const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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
    const { email, identifier, password, loginType } = req.body;
    const loginInput = email || identifier;
    if (!loginInput || !password)
      return fail(res, 'Email/Identifier and password are required');

    let user = null;
    // Step 1: Look up by Email
    const [emailRows] = await pool.execute('SELECT * FROM Users WHERE Email = ?', [loginInput]);
    if (emailRows.length > 0) {
      user = emailRows[0];
    } else {
      // Step 2: Look up by Student ID or Staff ID
      if (loginType === 'student') {
        const [studentRows] = await pool.execute(
          `SELECT u.* FROM Users u 
           JOIN Members m ON u.UserID = m.UserID 
           WHERE m.StudentID = ?`,
          [loginInput]
        );
        if (studentRows.length > 0) user = studentRows[0];
      } else if (loginType === 'staff') {
        const [staffRows] = await pool.execute(
          `SELECT u.* FROM Users u 
           JOIN Staff s ON u.UserID = s.UserID 
           WHERE s.StaffIdentifier = ?`,
          [loginInput]
        );
        if (staffRows.length > 0) user = staffRows[0];
      }
    }

    if (!user)
      return fail(res, 'Invalid credentials', 401);

    const match = await bcrypt.compare(password, user.Password);
    if (!match)
      return fail(res, 'Invalid credentials', 401);

    const userStatus = (user.Status || '').toLowerCase();
    if (userStatus === 'pending') {
      if (user.RoleID === 2) return fail(res, 'Your account is pending admin approval.', 403);
      if (user.RoleID === 3) return fail(res, 'Your account is pending staff approval.', 403);
      return fail(res, 'Your account is pending approval.', 403);
    }
    if (userStatus === 'rejected')
      return fail(res, 'Your account has been rejected. Contact the library.', 403);
    if (userStatus !== 'active')
      return fail(res, 'Account is not active', 403);

    let memberId = null;
    let staffId = null;
    if (user.RoleID === 3) {
      const [m] = await pool.execute('SELECT MemberID FROM Members WHERE UserID = ?', [user.UserID]);
      if (m.length) memberId = m[0].MemberID;
    } else if (user.RoleID === 2 || user.RoleID === 1) {
      const [s] = await pool.execute('SELECT StaffID FROM Staff WHERE UserID = ?', [user.UserID]);
      if (s.length) staffId = s[0].StaffID;

      // Auto-create/link a Member record for Staff/Admin so they can borrow books
      const [m] = await pool.execute('SELECT MemberID FROM Members WHERE UserID = ?', [user.UserID]);
      if (m.length) {
        memberId = m[0].MemberID;
      } else {
        const mid = await nextMemberId();
        const staffIdentifier = staffId ? `STAFF-${staffId}` : `ADMIN-${user.UserID}`;
        await pool.execute(
          'INSERT INTO Members (MemberID, UserID, StudentID, Department, RegistrationDate, MaxBooksAllowed) VALUES (?,?,?,?,?,?)',
          [mid, user.UserID, staffIdentifier, 'Staff Department', new Date(), 5]
        );
        memberId = mid;
      }
    }

    const token = jwt.sign(
      { 
        userID: user.UserID, 
        roleID: user.RoleID, 
        email: user.Email, 
        status: user.Status,
        memberID: memberId,
        MemberID: memberId,
        staffID: staffId,
        StaffID: staffId,
        extensionId: memberId || staffId
      },
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
        Status: user.Status,
        MemberID: memberId,
        StaffID: staffId
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
              r.RoleName, m.MemberID, s.StaffID
       FROM Users u 
       LEFT JOIN Roles r ON u.RoleID = r.RoleID
       LEFT JOIN Members m ON u.UserID = m.UserID
       LEFT JOIN Staff s ON u.UserID = s.UserID
       WHERE u.UserID = ?`,
      [req.user.userID]
    );
    if (rows.length === 0) return fail(res, 'User not found', 404);
    return ok(res, 'User info', rows[0]);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// POST /api/auth/change-password
router.post('/change-password', require('../middleware/auth').authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return fail(res, 'Both current and new password are required');
    if (newPassword.length < 8) return fail(res, 'New password must be at least 8 characters');

    const [rows] = await pool.execute('SELECT Password FROM Users WHERE UserID = ?', [req.user.userID]);
    if (rows.length === 0) return fail(res, 'User not found', 404);

    const match = await bcrypt.compare(currentPassword, rows[0].Password);
    if (!match) return fail(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE Users SET Password = ? WHERE UserID = ?', [hashed, req.user.userID]);
    return ok(res, 'Password updated successfully');
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
