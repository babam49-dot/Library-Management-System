const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'LibraryDB'
  });

  const hashed = await bcrypt.hash('pass123', 10);

  // Default Staff
  const [staffExist] = await conn.execute("SELECT * FROM Users WHERE Email='staff@library.com'");
  if (staffExist.length === 0) {
    const [[maxRow]] = await conn.execute("SELECT MAX(UserID) as m FROM Users");
    const nextId = (maxRow.m || 0) + 1;
    await conn.execute(
      "INSERT INTO Users (UserID, Email, Password, FirstName, LastName, FullName, Status, RoleID) VALUES (?,?,?,?,?,?,?,?)",
      [nextId, 'staff@library.com', hashed, 'Demo', 'Staff', 'Demo Staff', 'approved', 2]
    );
    const [[maxStaff]] = await conn.execute("SELECT MAX(StaffID) as m FROM Staff");
    const nextStaffId = (maxStaff.m || 0) + 1;
    await conn.execute("INSERT INTO Staff (StaffID, UserID, JobTitle) VALUES (?, ?, ?)", [nextStaffId, nextId, 'Head Librarian']);
  } else {
    await conn.execute("UPDATE Users SET Status='approved', Password=? WHERE Email='staff@library.com'", [hashed]);
  }

  // Default Member
  const [memberExist] = await conn.execute("SELECT * FROM Users WHERE Email='jane@uni.edu'");
  if (memberExist.length === 0) {
    const [[maxRow]] = await conn.execute("SELECT MAX(UserID) as m FROM Users");
    const nextId = (maxRow.m || 0) + 1;
    await conn.execute(
      "INSERT INTO Users (UserID, Email, Password, FirstName, LastName, FullName, Status, RoleID) VALUES (?,?,?,?,?,?,?,?)",
      [nextId, 'jane@uni.edu', hashed, 'Jane', 'Doe', 'Jane Doe', 'approved', 3]
    );
    const [[maxMember]] = await conn.execute("SELECT MAX(MemberID) as m FROM Members");
    const nextMemberId = (maxMember.m || 0) + 1;
    await conn.execute("INSERT INTO Members (MemberID, UserID, StudentID, Department) VALUES (?, ?, ?, ?)", [nextMemberId, nextId, '123456', 'Computer Science']);
  } else {
    await conn.execute("UPDATE Users SET Status='approved', Password=? WHERE Email='jane@uni.edu'", [hashed]);
  }

  console.log("Successfully seeded and approved default Staff and Member.");
  process.exit(0);
}

seed().catch(console.error);
