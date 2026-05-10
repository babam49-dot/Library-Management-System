const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message, data: null });

const auth = [authenticate, requireRole(2)];

// GET /api/staff/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [[pending]] = await pool.execute("SELECT COUNT(*) as count FROM Users WHERE RoleID=3 AND Status='pending'");
    const [[active]] = await pool.execute("SELECT COUNT(*) as count FROM BorrowingRecords WHERE Status='borrowed'");
    const today = new Date().toISOString().slice(0, 10);
    const [[returnsToday]] = await pool.execute(
      "SELECT COUNT(*) as count FROM Returns WHERE DATE(ReturnDate)=?", [today]
    );
    const [[overdueCount]] = await pool.execute(
      "SELECT COUNT(*) as count FROM BorrowingRecords WHERE Status='borrowed' AND DueDate < NOW()"
    );
    return ok(res, 'Staff dashboard', {
      pendingMembers: pending.count,
      activeBorrowings: active.count,
      returnsToday: returnsToday.count,
      overdueCount: overdueCount.count
    });
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/staff/pending-members
router.get('/pending-members', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Phone, u.Status,
              m.MemberID, m.StudentID, m.Department, m.RegistrationDate
       FROM Users u
       LEFT JOIN Members m ON m.UserID = u.UserID
       WHERE u.RoleID = 3 AND u.Status = 'pending'
       ORDER BY u.UserID DESC`
    );
    return ok(res, 'Pending members', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/staff/approve-member/:id
router.patch('/approve-member/:id', auth, async (req, res) => {
  try {
    await pool.execute("UPDATE Users SET Status='active' WHERE UserID=? AND RoleID=3", [req.params.id]);
    return ok(res, 'Member approved successfully');
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/staff/reject-member/:id
router.patch('/reject-member/:id', auth, async (req, res) => {
  try {
    await pool.execute("UPDATE Users SET Status='rejected' WHERE UserID=? AND RoleID=3", [req.params.id]);
    return ok(res, 'Member rejected');
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/staff/borrow
router.post('/borrow', auth, async (req, res) => {
  try {
    const { memberId, copyId } = req.body;
    if (!memberId || !copyId) return fail(res, 'memberId and copyId are required');

    const [copies] = await pool.execute("SELECT * FROM BookCopies WHERE CopyID=?", [copyId]);
    if (!copies.length) return fail(res, 'Copy not found', 404);
    if (copies[0].Status !== 'available') return fail(res, 'Copy is not available');

    const [members] = await pool.execute("SELECT * FROM Members WHERE MemberID=?", [memberId]);
    if (!members.length) return fail(res, 'Member not found', 404);

    const member = members[0];
    const [activeCount] = await pool.execute(
      "SELECT COUNT(*) as cnt FROM BorrowingRecords WHERE MemberID=? AND Status='borrowed'", [memberId]
    );
    if (activeCount[0].cnt >= member.MaxBooksAllowed)
      return fail(res, `Member has reached max books allowed (${member.MaxBooksAllowed})`);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const [result] = await pool.execute(
      "INSERT INTO BorrowingRecords (MemberID, CopyID, BorrowDate, DueDate, Status) VALUES (?,?,NOW(),?,'borrowed')",
      [memberId, copyId, dueDate]
    );
    await pool.execute("UPDATE BookCopies SET Status='borrowed' WHERE CopyID=?", [copyId]);

    // Update any matching reservation to 'fulfilled'
    const [bookRes] = await pool.execute("SELECT BookID FROM BookCopies WHERE CopyID=?", [copyId]);
    if (bookRes.length) {
      await pool.execute(
        "UPDATE Reservations SET Status='fulfilled' WHERE MemberID=(SELECT UserID FROM Members WHERE MemberID=?) AND BookID=? AND Status='pending'",
        [memberId, bookRes[0].BookID]
      );
    }

    return ok(res, 'Book issued successfully', { BorrowID: result.insertId, DueDate: dueDate });
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/staff/return
router.post('/return', auth, async (req, res) => {
  try {
    const { borrowId, condition } = req.body;
    if (!borrowId) return fail(res, 'borrowId is required');

    const [borrows] = await pool.execute("SELECT * FROM BorrowingRecords WHERE BorrowID=?", [borrowId]);
    if (!borrows.length) return fail(res, 'Borrow record not found', 404);
    if (borrows[0].Status === 'returned') return fail(res, 'Already returned');

    const borrow = borrows[0];
    const [staffRows] = await pool.execute("SELECT StaffID FROM Staff WHERE UserID=?", [req.user.userID]);
    const staffId = staffRows.length ? staffRows[0].StaffID : null;

    const [retResult] = await pool.execute(
      "INSERT INTO Returns (BorrowID, ReturnDate, Condition, StaffID) VALUES (?,NOW(),?,?)",
      [borrowId, condition || 'Good', staffId]
    );
    await pool.execute("UPDATE BorrowingRecords SET Status='returned' WHERE BorrowID=?", [borrowId]);
    await pool.execute("UPDATE BookCopies SET Status='available' WHERE CopyID=?", [borrow.CopyID]);

    // Update pending reservation if copy now available
    const [bookRes] = await pool.execute("SELECT BookID FROM BookCopies WHERE CopyID=?", [borrow.CopyID]);
    if (bookRes.length) {
      await pool.execute(
        "UPDATE Reservations SET Status='available' WHERE BookID=? AND Status='pending' ORDER BY ReservationDate ASC LIMIT 1",
        [bookRes[0].BookID]
      );
    }

    // Auto-calculate fine if overdue
    const returnDate = new Date();
    const dueDate = new Date(borrow.DueDate);
    let fineId = null;
    if (returnDate > dueDate) {
      const days = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      const [fineTypes] = await pool.execute("SELECT * FROM FineTypes WHERE TypeName LIKE '%Overdue%' OR TypeName LIKE '%overdue%' LIMIT 1");
      const baseAmount = fineTypes.length ? parseFloat(fineTypes[0].BaseAmount) : 1;
      const amount = days * baseAmount;
      const typeId = fineTypes.length ? fineTypes[0].TypeID : null;

      const [memberRows] = await pool.execute("SELECT UserID FROM Members WHERE MemberID=?", [borrow.MemberID]);
      if (memberRows.length) {
        const [fineResult] = await pool.execute(
          "INSERT INTO Fines (UserID, TypeID, BorrowID, Amount, IssuedDate, FineStatus) VALUES (?,?,?,?,NOW(),'Unpaid')",
          [memberRows[0].UserID, typeId, borrowId, amount]
        );
        fineId = fineResult.insertId;
      }
    }

    return ok(res, 'Return processed successfully', { ReturnID: retResult.insertId, fineCreated: fineId !== null, fineId });
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/staff/fine
router.post('/fine', auth, async (req, res) => {
  try {
    const { userId, typeId, amount, borrowId } = req.body;
    if (!userId || !amount) return fail(res, 'userId and amount required');
    const [result] = await pool.execute(
      "INSERT INTO Fines (UserID, TypeID, BorrowID, Amount, IssuedDate, FineStatus) VALUES (?,?,?,?,NOW(),'Unpaid')",
      [userId, typeId || null, borrowId || null, amount]
    );
    return ok(res, 'Fine issued', { FineID: result.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/staff/damage-report
router.post('/damage-report', auth, async (req, res) => {
  try {
    const { returnId, description, severity } = req.body;
    if (!returnId || !description) return fail(res, 'returnId and description required');
    const [staffRows] = await pool.execute("SELECT StaffID FROM Staff WHERE UserID=?", [req.user.userID]);
    const staffId = staffRows.length ? staffRows[0].StaffID : null;
    const [result] = await pool.execute(
      "INSERT INTO DamageReports (ReturnID, Description, Severity, AssessmentDate, StaffID) VALUES (?,?,?,NOW(),?)",
      [returnId, description, severity || 'Medium', staffId]
    );
    return ok(res, 'Damage report filed', { ReportID: result.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/staff/borrowing-records
router.get('/borrowing-records', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT br.*, u.FullName as MemberName, b.Title as BookTitle, bc.ShelfLocation
       FROM BorrowingRecords br
       LEFT JOIN Members m ON m.MemberID = br.MemberID
       LEFT JOIN Users u ON u.UserID = m.UserID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       ORDER BY br.BorrowDate DESC LIMIT 100`
    );
    return ok(res, 'Borrowing records', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/staff/reservations
router.get('/reservations', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.FullName as MemberName, b.Title as BookTitle
       FROM Reservations r
       LEFT JOIN Members m ON m.MemberID = r.MemberID
       LEFT JOIN Users u ON u.UserID = m.UserID
       LEFT JOIN Books b ON b.BookID = r.BookID
       ORDER BY r.ReservationDate DESC`
    );
    return ok(res, 'Reservations', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/staff/reservations/:id
router.patch('/reservations/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute("UPDATE Reservations SET Status=? WHERE ResID=?", [status, req.params.id]);
    return ok(res, 'Reservation updated');
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/staff/book-copies
router.post('/book-copies', auth, async (req, res) => {
  try {
    const { bookId, shelfLocation } = req.body;
    if (!bookId) return fail(res, 'bookId required');
    const [result] = await pool.execute(
      "INSERT INTO BookCopies (BookID, Status, ShelfLocation, AcquisitionDate) VALUES (?,'available',?,NOW())",
      [bookId, shelfLocation || '']
    );
    return ok(res, 'Book copy added', { CopyID: result.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/staff/book-copies/:id
router.patch('/book-copies/:id', auth, async (req, res) => {
  try {
    const { status, shelfLocation } = req.body;
    await pool.execute(
      "UPDATE BookCopies SET Status=COALESCE(?,Status), ShelfLocation=COALESCE(?,ShelfLocation) WHERE CopyID=?",
      [status || null, shelfLocation || null, req.params.id]
    );
    return ok(res, 'Copy updated');
  } catch (err) { return fail(res, err.message, 500); }
});

module.exports = router;
