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
    return ok(res, 'Dashboard data', {
      totalBooks: books.count,
      totalMembers: members.count,
      totalStaff: staff.count,
      activeBorrowings: borrowings.count,
      unpaidFines: fines.count,
      pendingStaff: pendingStaff.count
    });
  } catch (err) { return fail(res, err.message, 500); }
});

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

// GET /api/admin/all-staff
router.get('/all-staff', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Phone, u.Status,
              s.StaffID, s.JobTitle, s.EmploymentDate, s.Salary
       FROM Users u
       JOIN Staff s ON s.UserID = u.UserID
       WHERE u.RoleID = 2 AND u.Status = 'active'
       ORDER BY u.FullName`
    );
    return ok(res, 'All staff', rows);
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

// GET /api/admin/all-users
router.get('/all-users', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Status, u.RoleID, r.RoleName
       FROM Users u LEFT JOIN Roles r ON r.RoleID = u.RoleID ORDER BY u.UserID DESC`
    );
    return ok(res, 'All users', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/fines
router.get('/fines', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.*, u.FullName, ft.TypeName FROM Fines f
       LEFT JOIN Users u ON u.UserID = f.UserID
       LEFT JOIN FineTypes ft ON ft.TypeID = f.TypeID
       ORDER BY f.IssuedDate DESC`
    );
    return ok(res, 'All fines', rows);
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

// POST /api/admin/disposal-log
router.post('/disposal-log', auth, async (req, res) => {
  try {
    const { copyId, reason } = req.body;
    if (!copyId || !reason) return fail(res, 'copyId and reason required');
    const [staff] = await pool.execute('SELECT StaffID FROM Staff WHERE UserID=?', [req.user.userID]);
    const staffId = staff.length ? staff[0].StaffID : null;
    await pool.execute(
      'INSERT INTO BookDisposalLog (CopyID, Reason, DateRemoved, StaffID) VALUES (?,?,?,?)',
      [copyId, reason, new Date(), staffId]
    );
    await pool.execute("UPDATE BookCopies SET Status='Disposed' WHERE CopyID=?", [copyId]);
    return ok(res, 'Disposal logged');
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/admin/damage-reports
router.get('/damage-reports', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT dr.*, r.ReturnDate, br.BorrowID
       FROM DamageReports dr
       LEFT JOIN Returns r ON r.ReturnID = dr.ReturnID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = r.BorrowID
       ORDER BY dr.AssessmentDate DESC`
    );
    return ok(res, 'Damage reports', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

module.exports = router;
