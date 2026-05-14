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
       JOIN Staff s ON s.UserID = u.UserID
       WHERE u.RoleID = 2
       ORDER BY u.FullName`
    );
    return ok(res, 'All staff', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// ── MEMBER MANAGEMENT ─────────────────────────────────────────────────────────

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
    if (!['active', 'suspended', 'rejected', 'pending'].includes(status)) return fail(res, 'Invalid status');
    await pool.execute('UPDATE Users SET Status=? WHERE UserID=?', [status, req.params.id]);
    return ok(res, `User status updated to ${status}`);
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
      `SELECT b.BookID, b.Title, b.ISBN, b.Year, b.Language, b.CoverImage,
              c.CategoryName, p.PublisherName,
              GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') as Authors,
              COUNT(DISTINCT CASE WHEN bc.Status='available' THEN bc.CopyID END) as AvailableCopies,
              COUNT(DISTINCT bc.CopyID) as TotalCopies
       FROM Books b
       LEFT JOIN Categories c ON c.CategoryID = b.CategoryID
       LEFT JOIN Publishers p ON p.PublisherID = b.PublisherID
       LEFT JOIN BookAuthors ba ON ba.BookID = b.BookID
       LEFT JOIN Authors a ON a.AuthorID = ba.AuthorID
       LEFT JOIN BookCopies bc ON bc.BookID = b.BookID
       GROUP BY b.BookID ORDER BY b.Title`
    );
    return ok(res, 'All books', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// ── FINE MANAGEMENT ───────────────────────────────────────────────────────────

// GET /api/admin/fines
router.get('/fines', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.FineID, f.Amount, f.IssuedDate, f.FineStatus, f.UserID,
              u.FullName, u.Email,
              ft.TypeName,
              b.Title as BookTitle
       FROM Fines f
       LEFT JOIN Users u ON u.UserID = f.UserID
       LEFT JOIN FineTypes ft ON ft.TypeID = f.TypeID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = f.BorrowID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       ORDER BY f.IssuedDate DESC`
    );
    return ok(res, 'All fines', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// PATCH /api/admin/fines/:id/waive
router.patch('/fines/:id/waive', auth, async (req, res) => {
  try {
    await pool.execute("UPDATE Fines SET FineStatus='Waived' WHERE FineID=?", [req.params.id]);
    return ok(res, 'Fine waived');
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
      `SELECT dl.*, bc.BookID, b.Title, s.StaffID
       FROM BookDisposalLog dl
       LEFT JOIN BookCopies bc ON bc.CopyID = dl.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       LEFT JOIN Staff s ON s.StaffID = dl.StaffID
       ORDER BY dl.DateRemoved DESC`
    );
    return ok(res, 'Disposal log', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/damage-reports
router.get('/damage-reports', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT dr.*, r.ReturnDate, br.BorrowID,
              u.FullName as MemberName, b.Title as BookTitle
       FROM DamageReports dr
       LEFT JOIN Returns r ON r.ReturnID = dr.ReturnID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = r.BorrowID
       LEFT JOIN Members m ON m.MemberID = br.MemberID
       LEFT JOIN Users u ON u.UserID = m.UserID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       ORDER BY dr.AssessmentDate DESC`
    );
    return ok(res, 'Damage reports', rows);
  } catch (err) { return fail(res, err.message, 500); }
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

module.exports = router;
