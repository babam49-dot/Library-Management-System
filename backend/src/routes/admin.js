const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message, data: null });

const auth = [authenticate, requireRole(1)];

// GET /api/admin/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [[books]] = await pool.execute('SELECT COUNT(*) as count FROM Books');
    const [[members]] = await pool.execute('SELECT COUNT(*) as count FROM Members');
    const [[staff]] = await pool.execute('SELECT COUNT(*) as count FROM Staff');
    const [[borrowings]] = await pool.execute("SELECT COUNT(*) as count FROM BorrowingRecords WHERE Status='borrowed'");
    const [[fines]] = await pool.execute("SELECT COUNT(*) as count FROM Fines WHERE FineStatus='Unpaid'");
    const [[pendingStaff]] = await pool.execute("SELECT COUNT(*) as count FROM Users WHERE RoleID=2 AND Status='pending'");
    const [[pendingMembers]] = await pool.execute("SELECT COUNT(*) as count FROM Users WHERE RoleID=3 AND Status='pending'");
    return ok(res, 'Dashboard data', {
      totalBooks: books.count,
      totalMembers: members.count,
      totalStaff: staff.count,
      activeBorrowings: borrowings.count,
      unpaidFines: fines.count,
      pendingStaff: pendingStaff.count,
      pendingMembers: pendingMembers.count
    });
  } catch (err) { return fail(res, err.message, 500); }
});

// ── STAFF MANAGEMENT ──────────────────────────────────────────────────────────

// GET /api/admin/pending-staff
router.get('/pending-staff', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Phone, u.Status,
              s.StaffID, s.JobTitle, s.EmploymentDate
       FROM Users u
       LEFT JOIN Staff s ON s.UserID = u.UserID
       WHERE u.RoleID = 2 AND u.Status = 'pending'
       ORDER BY u.UserID DESC`
    );
    return ok(res, 'Pending staff list', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/approve-staff/:id
router.patch('/approve-staff/:id', auth, async (req, res) => {
  try {
    await pool.execute("UPDATE Users SET Status='active' WHERE UserID=? AND RoleID=2", [req.params.id]);
    return ok(res, 'Staff approved successfully');
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/reject-staff/:id
router.patch('/reject-staff/:id', auth, async (req, res) => {
  try {
    await pool.execute("UPDATE Users SET Status='rejected' WHERE UserID=? AND RoleID=2", [req.params.id]);
    return ok(res, 'Staff rejected');
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/all-staff  (active + rejected — all non-pending)
router.get('/all-staff', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Phone, u.Status,
              s.StaffID, s.JobTitle, s.EmploymentDate, s.Salary
       FROM Users u
       LEFT JOIN Staff s ON s.UserID = u.UserID
       WHERE u.RoleID = 2
       ORDER BY u.FullName`
    );
    return ok(res, 'All staff', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// ── MEMBER MANAGEMENT ─────────────────────────────────────────────────────────

// GET /api/admin/pending-members
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

// PATCH /api/admin/approve-member/:id
router.patch('/approve-member/:id', auth, async (req, res) => {
  try {
    await pool.execute("UPDATE Users SET Status='active' WHERE UserID=? AND RoleID=3", [req.params.id]);
    return ok(res, 'Member approved successfully');
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/reject-member/:id
router.patch('/reject-member/:id', auth, async (req, res) => {
  try {
    await pool.execute("UPDATE Users SET Status='rejected' WHERE UserID=? AND RoleID=3", [req.params.id]);
    return ok(res, 'Member rejected');
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/all-members
router.get('/all-members', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Phone, u.Status,
              m.MemberID, m.StudentID, m.Department, m.RegistrationDate, m.MaxBooksAllowed
       FROM Users u
       JOIN Members m ON m.UserID = u.UserID
       WHERE u.RoleID = 3
       ORDER BY u.FullName`
    );
    return ok(res, 'All members', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/members/:id/max-books
router.patch('/members/:id/max-books', auth, async (req, res) => {
  try {
    const { maxBooks } = req.body;
    if (!maxBooks || maxBooks < 1) return fail(res, 'maxBooks must be >= 1');
    await pool.execute('UPDATE Members SET MaxBooksAllowed=? WHERE MemberID=?', [maxBooks, req.params.id]);
    return ok(res, 'Max books updated');
  } catch (err) { return fail(res, err.message, 500); }
});

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────

// GET /api/admin/all-users
router.get('/all-users', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Phone, u.Status, u.RoleID, r.RoleName
       FROM Users u LEFT JOIN Roles r ON r.RoleID = u.RoleID ORDER BY u.UserID DESC`
    );
    return ok(res, 'All users', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Active', 'Suspended', 'Inactive', 'Pending', 'Rejected'];
    // Let's accept lowercase as well and convert to Title Case
    const formattedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    
    if (!allowed.includes(formattedStatus)) return fail(res, 'Invalid status');
    await pool.execute('UPDATE Users SET Status=? WHERE UserID=?', [formattedStatus, req.params.id]);
    return ok(res, `User status updated to ${formattedStatus}`);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/users/:id/unlock
router.patch('/users/:id/unlock', auth, async (req, res) => {
  try {
    await pool.execute('UPDATE Users SET account_locked_until = NULL, failed_login_attempts = 0 WHERE UserID = ?', [req.params.id]);
    return ok(res, 'User account unlocked');
  } catch (err) { return fail(res, err.message, 500); }
});

// PUT /api/admin/users/:id
router.put('/users/:id', auth, async (req, res) => {
  try {
    const { fullName, phone, department, maxBooksAllowed } = req.body;
    
    // Split full name if provided to update FirstName/LastName
    const nameParts = fullName ? fullName.split(' ') : [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    await pool.execute('UPDATE Users SET FullName=?, FirstName=?, LastName=?, Phone=? WHERE UserID=?', 
      [fullName, firstName, lastName, phone, req.params.id]);

    if (department || maxBooksAllowed !== undefined) {
      await pool.execute('UPDATE Members SET Department=COALESCE(?, Department), MaxBooksAllowed=COALESCE(?, MaxBooksAllowed) WHERE UserID=?', 
        [department, maxBooksAllowed, req.params.id]);
    }
    return ok(res, 'User profile updated');
  } catch (err) { return fail(res, err.message, 500); }
});

const bcrypt = require('bcryptjs');

// POST /api/admin/users/member
router.post('/users/member', auth, async (req, res) => {
  try {
    const { email, password, fullName, phone, studentId, department, maxBooksAllowed } = req.body;
    if (!email || !password || !fullName || !studentId) return fail(res, 'Email, password, full name, and Student ID are required');
    
    const [existing] = await pool.execute('SELECT UserID FROM Users WHERE Email = ?', [email]);
    if (existing.length > 0) return fail(res, 'Email already registered', 409);

    const hashed = await bcrypt.hash(password, 10);
    const [[{ nid }]] = await pool.execute('SELECT COALESCE(MAX(UserID), 0) + 1 AS nid FROM Users');
    
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    await pool.execute(
      'INSERT INTO Users (UserID, Email, Password, FullName, FirstName, LastName, Phone, Status, RoleID) VALUES (?,?,?,?,?,?,?,?,?)',
      [nid, email, hashed, fullName, firstName, lastName, phone || null, 'Active', 3]
    );

    const [[{ mid }]] = await pool.execute('SELECT COALESCE(MAX(MemberID), 0) + 1 AS mid FROM Members');
    await pool.execute(
      'INSERT INTO Members (MemberID, UserID, StudentID, Department, RegistrationDate, MaxBooksAllowed) VALUES (?,?,?,?,?,?)',
      [mid, nid, studentId, department || 'General', new Date(), maxBooksAllowed || 5]
    );

    return ok(res, 'Member account created');
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/admin/users/staff
router.post('/users/staff', auth, async (req, res) => {
  try {
    const { email, password, fullName, phone, jobTitle, salary, roleName, staffId } = req.body;
    if (!email || !password || !fullName || !jobTitle || !staffId) return fail(res, 'Email, password, full name, job title, and Staff ID are required');
    
    const [existing] = await pool.execute('SELECT UserID, Status FROM Users WHERE Email = ?', [email]);
    if (existing.length > 0) {
      if (existing[0].Status === 'Pending' || existing[0].Status === 'pending') {
        return fail(res, 'This member is already in pending state', 409);
      }
      return fail(res, 'Email already registered', 409);
    }

    const [existingStaff] = await pool.execute('SELECT StaffID FROM Staff WHERE StaffIdentifier = ?', [staffId]);
    if (existingStaff.length > 0) return fail(res, 'Staff ID already exists', 409);

    const roleId = roleName === 'Admin' ? 1 : 2;
    const hashed = await bcrypt.hash(password, 10);
    const [[{ nid }]] = await pool.execute('SELECT COALESCE(MAX(UserID), 0) + 1 AS nid FROM Users');
    
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    await pool.execute(
      'INSERT INTO Users (UserID, Email, Password, FullName, FirstName, LastName, Phone, Status, RoleID) VALUES (?,?,?,?,?,?,?,?,?)',
      [nid, email, hashed, fullName, firstName, lastName, phone || null, 'Active', roleId]
    );

    const [[{ sid }]] = await pool.execute('SELECT COALESCE(MAX(StaffID), 0) + 1 AS sid FROM Staff');
    await pool.execute(
      'INSERT INTO Staff (StaffID, UserID, StaffIdentifier, JobTitle, EmploymentDate, Salary) VALUES (?,?,?,?,?,?)',
      [sid, nid, staffId, jobTitle, new Date(), salary || 0]
    );

    return ok(res, 'Staff account created');
  } catch (err) { return fail(res, err.message, 500); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    if (parseInt(id) === req.user.userID) return fail(res, 'Cannot delete your own account');
    await pool.execute('DELETE FROM Reservations WHERE MemberID IN (SELECT MemberID FROM Members WHERE UserID=?)', [id]);
    await pool.execute('DELETE FROM Fines WHERE UserID=?', [id]);
    await pool.execute('DELETE FROM Members WHERE UserID=?', [id]);
    await pool.execute('DELETE FROM Staff WHERE UserID=?', [id]);
    await pool.execute('DELETE FROM Users WHERE UserID=?', [id]);
    return ok(res, 'User deleted');
  } catch (err) { return fail(res, err.message, 500); }
});

// ── BOOK MANAGEMENT ───────────────────────────────────────────────────────────

// GET /api/admin/all-books
router.get('/all-books', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.BookID, b.Title, b.ISBN, b.Year, b.Edition, b.Language, b.Description, b.CoverImage,
              c.CategoryName, c.CategoryID, p.PublisherName, p.PublisherID,
              GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') as Authors,
              SUM(CASE WHEN bc.Status='Available' THEN 1 ELSE 0 END) as AvailableCopies,
              COUNT(DISTINCT bc.CopyID) as TotalCopies
       FROM Books b
       LEFT JOIN Categories c ON c.CategoryID = b.CategoryID
       LEFT JOIN Publishers p ON p.PublisherID = b.PublisherID
       LEFT JOIN BookAuthors ba ON ba.BookID = b.BookID
       LEFT JOIN Authors a ON a.AuthorID = ba.AuthorID
       LEFT JOIN BookCopies bc ON bc.BookID = b.BookID AND bc.Status != 'Disposed'
       GROUP BY b.BookID ORDER BY b.Title`
    );
    return ok(res, 'All books', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// ── FINE MANAGEMENT ───────────────────────────────────────────────────────────

// GET /api/admin/fines/summary
router.get('/fines/summary', auth, async (req, res) => {
  try {
    const [[summary]] = await pool.execute(`
      SELECT
        COUNT(DISTINCT f.MemberID) AS MembersBlocked,
        COALESCE(SUM(f.Amount), 0) AS TotalOutstanding
      FROM Fines f
      WHERE f.FineStatus IN ('Unpaid', 'Partial')
    `);
    return ok(res, 'Fine summary', summary);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/fines/outstanding
router.get('/fines/outstanding', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM OutstandingFinesReport');
    return ok(res, 'Outstanding fines report', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/fines/member/:id/blocked
router.get('/fines/member/:id/blocked', auth, async (req, res) => {
  try {
    const [[result]] = await pool.execute(
      `SELECT COALESCE(SUM(Amount), 0) AS UnpaidTotal
       FROM Fines WHERE MemberID = ? AND FineStatus IN ('Unpaid', 'Partial')`,
      [req.params.id]
    );
    const unpaidTotal = Number(result.UnpaidTotal || 0);
    return ok(res, 'Member block status', { blocked: unpaidTotal > 0, unpaidTotal });
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/fines/member/:id
router.get('/fines/member/:id', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.FineID, ft.TypeName, f.Amount, f.FineStatus, f.IssuedDate,
              f.WaiverReason, f.WaivedByStaffID,
              b.Title, br.DueDate, br.BorrowDate,
              COALESCE(SUM(p.AmountPaid), 0) AS TotalPaid
       FROM Fines f
       JOIN FineTypes ft ON f.TypeID = ft.TypeID
       LEFT JOIN BorrowingRecords br ON f.BorrowID = br.BorrowID
       LEFT JOIN BookCopies bc ON br.CopyID = bc.CopyID
       LEFT JOIN Books b ON bc.BookID = b.BookID
       LEFT JOIN Payments p ON p.FineID = f.FineID
       WHERE f.MemberID = ?
       GROUP BY f.FineID
       ORDER BY f.IssuedDate DESC`,
      [req.params.id]
    );
    return ok(res, 'Member fines', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/fines
router.get('/fines', auth, async (req, res) => {
  try {
    const { status } = req.query; // optional filter: Unpaid, Partial, Paid, Waived
    let query = `SELECT f.FineID, f.Amount, f.IssuedDate, f.FineStatus, f.UserID, f.MemberID,
              f.WaiverReason, f.WaivedByStaffID,
              u.FullName, u.Email,
              ft.TypeName,
              b.Title as BookTitle
       FROM Fines f
       LEFT JOIN Users u ON u.UserID = f.UserID
       LEFT JOIN FineTypes ft ON ft.TypeID = f.TypeID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = f.BorrowID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID`;
    const params = [];
    if (status) { query += ` WHERE f.FineStatus = ?`; params.push(status); }
    query += ` ORDER BY f.IssuedDate DESC`;
    const [rows] = await pool.execute(query, params);
    return ok(res, 'All fines', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/fines/:id/payments
router.get('/fines/:id/payments', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT p.PaymentID, p.PaymentDate, p.AmountPaid, p.PaymentMethod, p.TransactionRef,
              u.FullName AS ReceivedBy
       FROM Payments p
       LEFT JOIN Staff s ON s.StaffID = p.ReceivedByStaffID
       LEFT JOIN Users u ON u.UserID = s.UserID
       WHERE p.FineID = ?
       ORDER BY p.PaymentDate DESC`,
      [req.params.id]
    );
    return ok(res, 'Payment history', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/admin/fines  (issue a manual fine)
router.post('/fines', auth, async (req, res) => {
  try {
    const { memberID, typeID, amount, reason } = req.body;
    if (!memberID || !amount) return fail(res, 'memberID and amount are required');

    // Resolve UserID from MemberID
    const [[member]] = await pool.execute(
      'SELECT UserID FROM Members WHERE MemberID = ?', [memberID]
    );
    if (!member) return fail(res, 'Member not found', 404);

    const [result] = await pool.execute(
      `INSERT INTO Fines (UserID, MemberID, TypeID, Amount, IssuedDate, FineStatus)
       VALUES (?, ?, ?, ?, CURDATE(), 'Unpaid')`,
      [member.UserID, memberID, typeID || null, amount]
    );

    return ok(res, 'Fine issued successfully', { FineID: result.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/fines/:id/waive  (enhanced with audit fields)
router.patch('/fines/:id/waive', auth, async (req, res) => {
  try {
    const { waiverReason } = req.body;
    if (!waiverReason || !waiverReason.trim()) {
      return fail(res, 'A waiver reason is required (BR-12)');
    }
    // Get the admin's StaffID for audit
    const [[staff]] = await pool.execute(
      'SELECT StaffID FROM Staff WHERE UserID = ?', [req.user.userID]
    );
    const staffId = staff ? staff.StaffID : null;
    await pool.execute(
      `UPDATE Fines SET FineStatus='Waived', WaivedByStaffID=?, WaiverReason=? WHERE FineID=?`,
      [staffId, waiverReason.trim(), req.params.id]
    );
    return ok(res, 'Fine waived successfully');
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/fine-types
router.get('/fine-types', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM FineTypes ORDER BY TypeID');
    return ok(res, 'Fine types', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/admin/fine-types
router.post('/fine-types', auth, async (req, res) => {
  try {
    const { typeName, baseAmount, description } = req.body;
    if (!typeName || baseAmount == null) return fail(res, 'TypeName and baseAmount required');
    const [r] = await pool.execute(
      'INSERT INTO FineTypes (TypeName, BaseAmount, Description) VALUES (?,?,?)',
      [typeName, baseAmount, description || '']
    );
    return ok(res, 'Fine type added', { TypeID: r.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// PUT /api/admin/fine-types/:id
router.put('/fine-types/:id', auth, async (req, res) => {
  try {
    const { typeName, baseAmount, description } = req.body;
    await pool.execute(
      'UPDATE FineTypes SET TypeName=?, BaseAmount=?, Description=? WHERE TypeID=?',
      [typeName, baseAmount, description || '', req.params.id]
    );
    return ok(res, 'Fine type updated');
  } catch (err) { return fail(res, err.message, 500); }
});

// DELETE /api/admin/fine-types/:id
router.delete('/fine-types/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM FineTypes WHERE TypeID=?', [req.params.id]);
    return ok(res, 'Fine type deleted');
  } catch (err) { return fail(res, err.message, 500); }
});

// ── BORROWING RECORDS ─────────────────────────────────────────────────────────

// GET /api/admin/borrowing-records
router.get('/borrowing-records', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT br.BorrowID, br.BorrowDate, br.DueDate, br.Status,
              u.FullName as MemberName, u.Email,
              b.Title as BookTitle,
              bc.CopyID, bc.ShelfLocation
       FROM BorrowingRecords br
       LEFT JOIN Members m ON m.MemberID = br.MemberID
       LEFT JOIN Users u ON u.UserID = m.UserID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       ORDER BY br.BorrowDate DESC LIMIT 300`
    );
    return ok(res, 'Borrowing records', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// ── DISPOSAL LOG & DAMAGE REPORTS ─────────────────────────────────────────────

// GET /api/admin/disposal-log
router.get('/disposal-log', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT dl.*, bc.BookID, b.Title, s.FullName as StaffName
       FROM BookDisposalLog dl
       LEFT JOIN BookCopies bc ON bc.CopyID = dl.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       LEFT JOIN Staff st ON st.StaffID = dl.StaffID
       LEFT JOIN Users s ON s.UserID = st.UserID
       ORDER BY dl.DateRemoved DESC`
    );
    return ok(res, 'Disposal log', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/damage-reports
router.get('/damage-reports', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT dr.*, r.ReturnDate, br.BorrowID, bc.CopyID,
              u.FullName as MemberName, u.UserID as MemberUserID, b.Title as BookTitle,
              su.FullName as StaffName
       FROM DamageReports dr
       LEFT JOIN Returns r ON r.ReturnID = dr.ReturnID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = r.BorrowID
       LEFT JOIN Members m ON m.MemberID = br.MemberID
       LEFT JOIN Users u ON u.UserID = m.UserID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       LEFT JOIN Staff st ON st.StaffID = dr.StaffID
       LEFT JOIN Users su ON su.UserID = st.UserID
       ORDER BY dr.AssessmentDate DESC`
    );
    return ok(res, 'Damage reports', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/dispose/:copyId
router.patch('/dispose/:copyId', auth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { reason } = req.body;
    await conn.beginTransaction();

    await conn.execute("UPDATE BookCopies SET Status='Disposed' WHERE CopyID=?", [req.params.copyId]);
    
    // Log disposal
    const staffId = req.user.StaffID || req.user.staffID || req.user.extensionId || null;
    await conn.execute(
      `INSERT INTO BookDisposalLog (CopyID, DateRemoved, Reason, StaffID) VALUES (?, CURDATE(), ?, ?)`,
      [req.params.copyId, reason || 'Manual Admin Disposal', staffId]
    );

    // Update Books available copies
    await conn.execute(`
      UPDATE Books b
      SET TotalCopies = (SELECT COUNT(*) FROM BookCopies WHERE BookID = b.BookID),
          AvailableCopies = (SELECT COUNT(*) FROM BookCopies WHERE BookID = b.BookID AND Status = 'Available')
      WHERE BookID = (SELECT BookID FROM BookCopies WHERE CopyID = ?)
    `, [req.params.copyId]);

    await conn.commit();
    return ok(res, 'Copy disposed successfully');
  } catch (err) {
    await conn.rollback();
    return fail(res, err.message, 500);
  } finally {
    conn.release();
  }
});

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

// GET /api/admin/analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const [topBooks] = await pool.execute(
      `SELECT b.Title as name, COUNT(br.BorrowID) as borrows
       FROM BorrowingRecords br
       JOIN BookCopies bc ON bc.CopyID = br.CopyID
       JOIN Books b ON b.BookID = bc.BookID
       GROUP BY b.BookID ORDER BY borrows DESC LIMIT 5`
    );
    const [trends] = await pool.execute(
      `SELECT DATE_FORMAT(BorrowDate, '%Y-%m') as month, COUNT(BorrowID) as count
       FROM BorrowingRecords GROUP BY month ORDER BY month DESC LIMIT 6`
    );
    const [categoryDistrib] = await pool.execute(
      `SELECT c.CategoryName as name, COUNT(b.BookID) as value
       FROM Books b JOIN Categories c ON c.CategoryID = b.CategoryID GROUP BY c.CategoryID`
    );
    return ok(res, 'Analytics data', { topBooks, trends: trends.reverse(), categoryDistrib });
  } catch (err) { return fail(res, err.message, 500); }
});

// ── ADDITIONAL REPORTS & CONFIG ────────────────────────────────────────────────

// GET /api/admin/reports/payment-history
router.get('/reports/payment-history', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.PaymentID, p.AmountPaid, p.PaymentMethod, p.PaymentReference, p.PaymentStatus, p.PaymentDate,
             f.FineID, ft.TypeName as FineType,
             m.MemberID, m.StudentID, u.FullName as MemberName,
             s.FullName as ProcessedBy
      FROM Payments p
      JOIN Fines f ON f.FineID = p.FineID
      LEFT JOIN FineTypes ft ON ft.TypeID = f.FineTypeID
      JOIN Members m ON m.MemberID = p.MemberID
      JOIN Users u ON u.UserID = m.UserID
      LEFT JOIN Staff st ON st.StaffID = p.ProcessedByStaffID
      LEFT JOIN Users s ON s.UserID = st.UserID
      ORDER BY p.PaymentDate DESC LIMIT 200
    `);
    return ok(res, 'Payment History Report', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/reports/fines
router.get('/reports/fines', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT f.FineID, f.Amount, f.FineStatus, f.IssuedDate,
             ft.TypeName as FineType,
             m.MemberID, m.StudentID, u.FullName as MemberName,
             COALESCE((SELECT SUM(AmountPaid) FROM Payments WHERE FineID = f.FineID AND PaymentStatus='Completed'), 0) as AmountPaid
      FROM Fines f
      LEFT JOIN FineTypes ft ON ft.TypeID = f.FineTypeID
      JOIN Members m ON m.MemberID = f.MemberID
      JOIN Users u ON u.UserID = m.UserID
      ORDER BY f.IssuedDate DESC LIMIT 200
    `);
    return ok(res, 'Fines Report', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PUT /api/admin/members/bulk-limit
router.put('/members/bulk-limit', auth, async (req, res) => {
  try {
    const { maxBooks } = req.body;
    if (!maxBooks || isNaN(maxBooks)) return fail(res, 'Invalid maxBooks value');
    await pool.execute('UPDATE Members SET MaxBooksAllowed = ?', [parseInt(maxBooks)]);
    return ok(res, 'Bulk limits updated successfully');
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/all-reservations
router.get('/all-reservations', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.ResID, r.ReservationID, r.RequestCode, r.Status, r.Priority,
              r.ReservationDate, r.PickupDeadline,
              b.BookID, b.Title AS BookTitle, b.ISBN, b.CoverImage,
              u.FullName AS MemberName, u.Email AS MemberEmail,
              m.StudentID, m.Department,
              bc.CopyID, bc.ShelfLocation
       FROM Reservations r
       JOIN Members m ON m.MemberID = r.MemberID
       JOIN Users u ON u.UserID = m.UserID
       JOIN Books b ON b.BookID = r.BookID
       LEFT JOIN BookCopies bc ON bc.CopyID = r.CopyID
       ORDER BY r.ReservationDate DESC LIMIT 500`
    );
    return ok(res, 'All reservations', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/all-reservations/:id
router.patch('/all-reservations/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['Queued','Ready','Fulfilled','Cancelled'];
    if (!allowed.includes(status)) return fail(res, 'Invalid status');
    await pool.execute(
      'UPDATE Reservations SET Status=? WHERE ResID=? OR ReservationID=?',
      [status, req.params.id, req.params.id]
    );
    return ok(res, 'Reservation status updated');
  } catch (err) { return fail(res, err.message, 500); }
});

module.exports = router;
