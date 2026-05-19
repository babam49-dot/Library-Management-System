const pool = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const SALT_ROUNDS = 10;

/**
 * AUTH SERVICE
 */

const login = async ({ email, password, identifier, loginType }) => {
  if (!password || (!email && !identifier)) {
    throw { status: 400, message: "Identifier/Email and password are required" };
  }

  let users = [];

  // Step 1: Query based on loginType or fallback to email
  if (loginType === 'student') {
    // Try Student ID first, then email
    [users] = await pool.execute(
      `SELECT u.*, r.RoleName FROM Users u 
       JOIN Roles r ON u.RoleID = r.RoleID 
       JOIN Members m ON m.UserID = u.UserID 
       WHERE m.StudentID = ? OR u.Email = ?`,
      [identifier, identifier]
    );
  } else if (loginType === 'staff') {
    // Try Staff ID first, then email
    [users] = await pool.execute(
      `SELECT u.*, r.RoleName FROM Users u 
       JOIN Roles r ON u.RoleID = r.RoleID 
       JOIN Staff s ON s.UserID = u.UserID 
       WHERE s.StaffIdentifier = ? OR u.Email = ?`,
      [identifier, identifier]
    );
  } else {
    [users] = await pool.execute(
      'SELECT u.*, r.RoleName FROM Users u JOIN Roles r ON u.RoleID = r.RoleID WHERE u.Email = ?',
      [email || identifier]
    );
  }

  const user = users[0];

  // Step 2 & 4: Generic "Invalid credentials" for both no user found and password mismatch
  if (!user) {
    throw { status: 401, message: "Invalid credentials" };
  }

  // Step 3: Compare submitted password with stored bcrypt hash.
  // Plain-text passwords are intentionally never accepted.
  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) {
    throw { status: 401, message: "Invalid credentials" };
  }

  const normalizedStatus = String(user.Status || '').toLowerCase();
  if (normalizedStatus === 'suspended' || normalizedStatus === 'inactive') {
    throw { status: 401, message: "Account is not active" };
  }
  if (normalizedStatus === 'pending') {
    throw { status: 401, message: "Account is pending admin approval" };
  }
  if (normalizedStatus !== 'active') {
    throw { status: 403, message: "Account is not active" };
  }

  // Step 6: Query extension table
  let extensionProfile = null;
  if (user.RoleName === 'Member') {
    const [members] = await pool.execute('SELECT * FROM Members WHERE UserID = ?', [user.UserID]);
    extensionProfile = members[0] || null;
    if (!extensionProfile) throw { status: 403, message: "Member profile not found" };
  } else if (user.RoleName === 'Staff' || user.RoleName === 'Admin') {
    const [staff] = await pool.execute('SELECT * FROM Staff WHERE UserID = ?', [user.UserID]);
    extensionProfile = staff[0] || null;
  }

  // Step 7: Sign JWT
  const tokenPayload = {
    UserID: user.UserID,
    RoleID: user.RoleID,
    RoleName: user.RoleName,
    ...(user.RoleName === 'Member' ? { MemberID: extensionProfile.MemberID } : { StaffID: extensionProfile?.StaffID || null })
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
  return {
    token,
    user: {
      ...tokenPayload,
      FullName: user.FullName,
      Email: user.Email,
      Status: user.Status,
      memberContext: user.RoleName === 'Member' ? extensionProfile : null
    }
  };
};

const getMe = async (userId) => {
  const user = await getUserById(userId);
  // Re-format to match token payload for frontend consistency
  return {
    UserID: user.UserID,
    RoleID: user.RoleID,
    RoleName: user.RoleName,
    MemberID: user.MemberProfile?.MemberID || null,
    StaffID: user.StaffProfile?.StaffID || null
  };
};

/**
 * USERS SERVICE
 */

const createUser = async (userData, creatorRole) => {
  const { Email, FullName, Password, RoleID, ...extensionData } = userData;

  // Rule 4: Every user must have a RoleID
  if (!RoleID) throw { status: 400, message: "RoleID is required" };

  // Fetch RoleName for logic
  const [roles] = await pool.execute('SELECT RoleName FROM Roles WHERE RoleID = ?', [RoleID]);
  if (roles.length === 0) throw { status: 400, message: "Invalid RoleID" };
  const roleName = roles[0].RoleName;

  // Rule 8: Staff accounts can only be created by Admin users
  if ((roleName === 'Staff' || roleName === 'Admin') && creatorRole !== 'Admin') {
    throw { status: 403, message: "Only admins can create Staff or Admin accounts" };
  }

  // Rule 2: Email must be unique
  const [existingEmail] = await pool.execute('SELECT UserID, Status FROM Users WHERE Email = ?', [Email]);
  if (existingEmail.length > 0) {
    if (existingEmail[0].Status === 'Pending' || existingEmail[0].Status === 'pending') {
      throw { status: 409, message: "This member is already in pending state" };
    }
    throw { status: 409, message: "Email already exists" };
  }

  // Check unique StudentID for members
  if (roleName === 'Member') {
    if (!extensionData.StudentID) throw { status: 400, message: "StudentID is required for members" };
    const [existingStudent] = await pool.execute(
      'SELECT m.MemberID, u.Status FROM Members m JOIN Users u ON m.UserID = u.UserID WHERE m.StudentID = ?', 
      [extensionData.StudentID]
    );
    if (existingStudent.length > 0) {
      if (existingStudent[0].Status === 'Pending' || existingStudent[0].Status === 'pending') {
        throw { status: 409, message: "This member is already in pending state" };
      }
      throw { status: 409, message: "StudentID already exists" };
    }
  }

  // Check unique StaffIdentifier for staff
  if (roleName === 'Staff' || roleName === 'Admin') {
    if (!extensionData.StaffIdentifier) throw { status: 400, message: "Staff ID is required for staff members" };
    const [existingStaff] = await pool.execute(
      'SELECT s.StaffID, u.Status FROM Staff s JOIN Users u ON s.UserID = u.UserID WHERE s.StaffIdentifier = ?', 
      [extensionData.StaffIdentifier]
    );
    if (existingStaff.length > 0) {
      if (existingStaff[0].Status === 'Pending' || existingStaff[0].Status === 'pending') {
        throw { status: 409, message: "This staff member is already in pending state" };
      }
      throw { status: 409, message: "Staff ID already exists" };
    }
  }

  // Rule 1: Hash password
  const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Step 2: Insert into Users
    const [userResult] = await connection.execute(
      'INSERT INTO Users (Email, Password, FullName, RoleID, Status) VALUES (?, ?, ?, ?, ?)',
      [Email, hashedPassword, FullName, RoleID, 'Active']
    );
    const userId = userResult.insertId;

    // Step 3: Insert into extension table (Rule 5: mutually exclusive)
    if (roleName === 'Member') {
      await connection.execute(
        'INSERT INTO Members (UserID, StudentID, Department, MaxBooksAllowed) VALUES (?, ?, ?, ?)',
        [userId, extensionData.StudentID, extensionData.Department || null, extensionData.MaxBooksAllowed || 5]
      );
    } else if (roleName === 'Staff' || roleName === 'Admin') {
      await connection.execute(
        'INSERT INTO Staff (UserID, StaffIdentifier, JobTitle, EmploymentDate, Salary) VALUES (?, ?, ?, ?, ?)',
        [userId, extensionData.StaffIdentifier, extensionData.JobTitle, extensionData.EmploymentDate || null, extensionData.Salary || null]
      );
    }

    await connection.commit();
    return { UserID: userId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const registerPublicUser = async (userData) => {
  const Email = userData.Email || userData.email;
  const Password = userData.Password || userData.password;
  const FullName = userData.FullName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
  const RoleID = userData.RoleID;
  const extensionData = userData;

  if (!RoleID) throw { status: 400, message: "RoleID is required" };
  if (!Email || !Password || !FullName) throw { status: 400, message: "Missing required fields" };

  const [roles] = await pool.execute('SELECT RoleName FROM Roles WHERE RoleID = ?', [RoleID]);
  if (roles.length === 0) throw { status: 400, message: "Invalid RoleID" };
  const roleName = roles[0].RoleName;

  const [existingEmail] = await pool.execute('SELECT UserID, Status FROM Users WHERE Email = ?', [Email]);
  if (existingEmail.length > 0) {
    if (existingEmail[0].Status === 'Pending' || existingEmail[0].Status === 'pending') {
      throw { status: 409, message: "This member is already in pending state" };
    }
    throw { status: 409, message: "Email already exists" };
  }

  if (roleName === 'Member') {
    if (!extensionData.universityId) throw { status: 400, message: "University ID is required for members" };
    const [existingStudent] = await pool.execute(
      'SELECT m.MemberID, u.Status FROM Members m JOIN Users u ON m.UserID = u.UserID WHERE m.StudentID = ?', 
      [extensionData.universityId]
    );
    if (existingStudent.length > 0) {
      if (existingStudent[0].Status === 'Pending' || existingStudent[0].Status === 'pending') {
        throw { status: 409, message: "This member is already in pending state" };
      }
      throw { status: 409, message: "University ID already exists" };
    }
  }

  if (roleName === 'Staff' || roleName === 'Admin') {
    if (!extensionData.staffId) throw { status: 400, message: "Staff ID is required for staff members" };
    const [existingStaff] = await pool.execute(
      'SELECT s.StaffID, u.Status FROM Staff s JOIN Users u ON s.UserID = u.UserID WHERE s.StaffIdentifier = ?', 
      [extensionData.staffId]
    );
    if (existingStaff.length > 0) {
      if (existingStaff[0].Status === 'Pending' || existingStaff[0].Status === 'pending') {
        throw { status: 409, message: "This staff member is already in pending state" };
      }
      throw { status: 409, message: "Staff ID already exists" };
    }
  }

  const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userResult] = await connection.execute(
      'INSERT INTO Users (Email, Password, FullName, RoleID, Status) VALUES (?, ?, ?, ?, ?)',
      [Email, hashedPassword, FullName, RoleID, 'Pending']
    );
    const userId = userResult.insertId;

    if (roleName === 'Member') {
      await connection.execute(
        'INSERT INTO Members (UserID, StudentID, Department, MaxBooksAllowed) VALUES (?, ?, ?, ?)',
        [userId, extensionData.universityId, extensionData.department || null, 5]
      );
    } else if (roleName === 'Staff' || roleName === 'Admin') {
      await connection.execute(
        'INSERT INTO Staff (UserID, StaffIdentifier, JobTitle, EmploymentDate) VALUES (?, ?, ?, ?)',
        [userId, extensionData.staffId, extensionData.jobTitle, new Date()]
      );
    }

    await connection.commit();
    return { UserID: userId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const updateUser = async (userId, updateData) => {
  const { FullName, Email } = updateData;
  
  if (Email) {
    const [existing] = await pool.execute('SELECT UserID FROM Users WHERE Email = ? AND UserID != ?', [Email, userId]);
    if (existing.length > 0) throw { status: 409, message: "Email already exists" };
  }

  await pool.execute(
    'UPDATE Users SET FullName = COALESCE(?, FullName), Email = COALESCE(?, Email) WHERE UserID = ?',
    [FullName, Email, userId]
  );
};

const updateStatus = async (userId, status) => {
  // Rule 7: Status change only, no deletion
  const allowed = ['Active', 'Suspended', 'Inactive', 'Pending'];
  if (!allowed.includes(status)) throw { status: 400, message: "Invalid status value" };

  await pool.execute('UPDATE Users SET Status = ? WHERE UserID = ?', [status, userId]);
};

const updatePassword = async (userId, currentPassword, newPassword) => {
  const [users] = await pool.execute('SELECT Password FROM Users WHERE UserID = ?', [userId]);
  if (users.length === 0) throw { status: 404, message: "User not found" };

  const isMatch = await bcrypt.compare(currentPassword, users[0].Password);
  if (!isMatch) throw { status: 401, message: "Current password does not match" };

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.execute('UPDATE Users SET Password = ? WHERE UserID = ?', [hashedPassword, userId]);
};

const getAllUsers = async () => {
  const query = `
    SELECT u.UserID, u.Email, u.FullName, u.Status, r.RoleName,
           m.MemberID, s.StaffID
    FROM Users u
    JOIN Roles r ON u.RoleID = r.RoleID
    LEFT JOIN Members m ON u.UserID = m.UserID
    LEFT JOIN Staff s ON u.UserID = s.UserID
  `;
  const [rows] = await pool.execute(query);
  return rows;
};

const getUserById = async (userId) => {
  const [users] = await pool.execute(
    'SELECT u.UserID, u.Email, u.FullName, u.Status, u.RoleID, r.RoleName FROM Users u JOIN Roles r ON u.RoleID = r.RoleID WHERE u.UserID = ?',
    [userId]
  );
  if (users.length === 0) throw { status: 404, message: "User not found" };
  const user = users[0];

  if (user.RoleName === 'Member') {
    const [members] = await pool.execute('SELECT * FROM Members WHERE UserID = ?', [userId]);
    user.MemberProfile = members[0];
  } else {
    const [staff] = await pool.execute('SELECT * FROM Staff WHERE UserID = ?', [userId]);
    user.StaffProfile = staff[0];
  }
  return user;
};

/**
 * MEMBERS SERVICE
 */

const getMemberProfile = async (memberId) => {
  const query = `
    SELECT m.*, u.FullName, u.Email, u.Status
    FROM Members m
    JOIN Users u ON m.UserID = u.UserID
    WHERE m.MemberID = ?
  `;
  const [rows] = await pool.execute(query, [memberId]);
  if (rows.length === 0) throw { status: 404, message: "Member not found" };
  const member = rows[0];

  const context = await getMemberBorrowingContext(memberId);
  return { ...member, ...context };
};

const updateMaxBooks = async (memberId, maxBooks) => {
  if (maxBooks < 1) throw { status: 400, message: "Max books must be at least 1" };
  await pool.execute('UPDATE Members SET MaxBooksAllowed = ? WHERE MemberID = ?', [maxBooks, memberId]);
};

/**
 * STAFF SERVICE
 */

const getStaffProfile = async (staffId) => {
  const query = `
    SELECT s.*, u.FullName, u.Email, u.Status
    FROM Staff s
    JOIN Users u ON s.UserID = u.UserID
    WHERE s.StaffID = ?
  `;
  const [rows] = await pool.execute(query, [staffId]);
  if (rows.length === 0) throw { status: 404, message: "Staff not found" };
  return rows[0];
};

/**
 * ROLES SERVICE
 */

const getAllRoles = async () => {
  const [rows] = await pool.execute('SELECT * FROM Roles');
  return rows;
};

/**
 * EXPORTED CONTEXT FUNCTIONS FOR OTHER MODULES
 */

const getMemberBorrowingContext = async (memberId) => {
  // Query MaxBooksAllowed
  const [members] = await pool.execute('SELECT MaxBooksAllowed FROM Members WHERE MemberID = ?', [memberId]);
  if (members.length === 0) return null;

  // Query unpaid fines total
  // Table Fines (assume exists as per spec)
  let fines = [{ UnpaidFineTotal: 0 }];
  try {
    [fines] = await pool.execute(
      "SELECT COALESCE(SUM(Amount),0) as UnpaidFineTotal FROM Fines WHERE MemberID = ? AND FineStatus IN ('Unpaid', 'Partial')",
      [memberId]
    );
  } catch (_) {}

  // Query currently borrowed books
  // Table BorrowingRecords (assume exists as per spec)
  const [borrowing] = await pool.execute(
    "SELECT COUNT(*) as CurrentlyBorrowed FROM BorrowingRecords WHERE MemberID = ? AND Status IN ('Pending', 'Borrowed')",
    [memberId]
  );

  return {
    MaxBooksAllowed: members[0].MaxBooksAllowed,
    UnpaidFineTotal: Number(fines[0].UnpaidFineTotal || 0),
    CurrentlyBorrowed: Number(borrowing[0].CurrentlyBorrowed || 0)
  };
};

const isMemberEligibleToBorrow = async (memberId, requestedBooks = 1) => {
  const context = await getMemberBorrowingContext(memberId);
  if (!context) return { eligible: false, reason: "Member not found" };

  if (context.UnpaidFineTotal > 0) {
    return { eligible: false, reason: "You have outstanding unpaid fines" };
  }

  if (context.CurrentlyBorrowed + requestedBooks > context.MaxBooksAllowed) {
    return { eligible: false, reason: "Borrow limit exceeded" };
  }

  return { eligible: true, reason: null };
};

module.exports = {
  login,
  registerPublicUser,
  createUser,
  updateUser,
  updateStatus,
  updatePassword,
  getAllUsers,
  getUserById,
  getMemberProfile,
  updateMaxBooks,
  getStaffProfile,
  getAllRoles,
  getMe,
  getMemberBorrowingContext,
  isMemberEligibleToBorrow
};
