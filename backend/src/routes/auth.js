const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message, data: null });

// Helper: get next UserID (since no AUTO_INCREMENT due to FK constraints)
async function nextUserId() {
  const [[row]] = await pool.execute('SELECT COALESCE(MAX(UserID), 0) + 1 AS nid FROM Users');
  return row.nid;
}

// Helper: get next StaffID
async function nextStaffId() {
  const [[row]] = await pool.execute('SELECT COALESCE(MAX(StaffID), 0) + 1 AS nid FROM Staff');
  return row.nid;
}

// Helper: get next MemberID
async function nextMemberId() {
  const [[row]] = await pool.execute('SELECT COALESCE(MAX(MemberID), 0) + 1 AS nid FROM Members');
  return row.nid;
}

// POST /api/auth/register/staff
router.post('/register/staff', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, jobTitle } = req.body;
    if (!firstName || !lastName || !email || !password)
      return fail(res, 'Missing required fields: firstName, lastName, email, password');
    if (password.length < 6)
      return fail(res, 'Password must be at least 6 characters');

    const [existing] = await pool.execute('SELECT UserID FROM Users WHERE Email = ?', [email]);
    if (existing.length > 0)
      return fail(res, 'This email is already registered. Please sign in.', 409);

    const hashed = await bcrypt.hash(password, 10);
    const uid = await nextUserId();
    await pool.execute(
      'INSERT INTO Users (UserID, Email, Password, FirstName, LastName, FullName, Phone, Status, RoleID) VALUES (?,?,?,?,?,?,?,?,?)',
      [uid, email, hashed, firstName, lastName, `${firstName} ${lastName}`, phone || null, 'pending', 2]
    );

    const sid = await nextStaffId();
    await pool.execute(
      'INSERT INTO Staff (StaffID, UserID, JobTitle, EmploymentDate) VALUES (?,?,?,?)',
      [sid, uid, jobTitle || 'Library Staff', new Date()]
    );

    return ok(res, 'Registration submitted. Your account is pending admin approval.');
  } catch (err) {
    console.error('register/staff error:', err);
    return fail(res, err.message, 500);
  }
});

// POST /api/auth/register/member
router.post('/register/member', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, universityId, department } = req.body;
    if (!firstName || !lastName || !email || !password)
      return fail(res, 'Missing required fields: firstName, lastName, email, password');
    if (password.length < 6)
      return fail(res, 'Password must be at least 6 characters');

    const [existing] = await pool.execute('SELECT UserID FROM Users WHERE Email = ?', [email]);
    if (existing.length > 0)
      return fail(res, 'This email is already registered. Please sign in.', 409);

    const hashed = await bcrypt.hash(password, 10);
    const uid = await nextUserId();
    await pool.execute(
      'INSERT INTO Users (UserID, Email, Password, FirstName, LastName, FullName, Phone, UniversityID, Status, RoleID) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [uid, email, hashed, firstName, lastName, `${firstName} ${lastName}`, phone || null, universityId || null, 'pending', 3]
    );

    const mid = await nextMemberId();
    await pool.execute(
      'INSERT INTO Members (MemberID, UserID, StudentID, Department, RegistrationDate, MaxBooksAllowed) VALUES (?,?,?,?,?,?)',
      [mid, uid, universityId || '', department || 'General', new Date(), 5]
    );

    return ok(res, 'Registration submitted. Your account is pending staff approval.');
  } catch (err) {
    console.error('register/member error:', err);
    return fail(res, err.message, 500);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return fail(res, 'Email and password are required');

    const [rows] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [email]);
    if (rows.length === 0)
      return fail(res, 'No account found with this email.', 401);

    const user = rows[0];
    const match = await bcrypt.compare(password, user.Password);
    if (!match)
      return fail(res, 'Incorrect password.', 401);

    if (user.Status === 'pending') {
      if (user.RoleID === 2) return fail(res, 'Your account is pending admin approval.', 403);
      if (user.RoleID === 3) return fail(res, 'Your account is pending staff approval.', 403);
      return fail(res, 'Your account is pending approval.', 403);
    }
    if (user.Status === 'rejected')
      return fail(res, 'Your account has been rejected. Contact the library.', 403);
    if (user.Status !== 'active')
      return fail(res, 'Your account is not active.', 403);

    const token = jwt.sign(
      { userID: user.UserID, roleID: user.RoleID, email: user.Email, status: user.Status },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    return ok(res, 'Login successful', {
      token,
      user: {
        UserID: user.UserID,
        FullName: user.FullName || `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
        Email: user.Email,
        RoleID: user.RoleID,
        Status: user.Status
      }
    });
  } catch (err) {
    console.error('login error:', err);
    return fail(res, err.message, 500);
  }
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.Email, u.FirstName, u.LastName, u.FullName, u.Phone, u.Status, u.RoleID,
              r.RoleName
       FROM Users u LEFT JOIN Roles r ON u.RoleID = r.RoleID
       WHERE u.UserID = ?`,
      [req.user.userID]
    );
    if (rows.length === 0) return fail(res, 'User not found', 404);
    return ok(res, 'User info', rows[0]);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
