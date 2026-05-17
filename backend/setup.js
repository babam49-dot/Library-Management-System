const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setup() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mydb_ex',
    port: parseInt(process.env.DB_PORT, 10) || 3306
  });
  console.log('Connected to DB');

  // Fix UserID AUTO_INCREMENT
  try {
    await conn.execute('ALTER TABLE Users MODIFY COLUMN UserID INT NOT NULL AUTO_INCREMENT');
    console.log('UserID AUTO_INCREMENT fixed');
  } catch (e) {
    console.log('AUTO_INCREMENT note:', e.message);
  }

  // Seed roles
  try {
    await conn.execute("INSERT IGNORE INTO Roles (RoleID, RoleName, Description) VALUES (1,'Admin','Full access'),(2,'Staff','Approved by admin'),(3,'Member','Student approved by staff')");
    console.log('Roles seeded');
  } catch (e) { console.log('Roles note:', e.message); }

  // Add missing columns - check first, then add
  const [cols] = await conn.execute('SHOW COLUMNS FROM Users');
  const existing = cols.map(c => c.Field);

  const toAdd = [
    ['FirstName', 'ALTER TABLE Users ADD COLUMN FirstName VARCHAR(100)'],
    ['LastName',  'ALTER TABLE Users ADD COLUMN LastName VARCHAR(100)'],
    ['UniversityID', 'ALTER TABLE Users ADD COLUMN UniversityID VARCHAR(100) UNIQUE'],
    ['FullName',  'ALTER TABLE Users ADD COLUMN FullName VARCHAR(255)'],
    ['Status',    "ALTER TABLE Users ADD COLUMN Status VARCHAR(50) DEFAULT 'pending'"],
  ];
  for (const [col, sql] of toAdd) {
    if (!existing.includes(col)) {
      try { await conn.execute(sql); console.log('Added column:', col); }
      catch (e) { console.log(`Column ${col} note:`, e.message); }
    } else {
      console.log('Column already exists:', col);
    }
  }

  // Create default admin - need explicit UserID since no AUTO_INCREMENT
  const [existAdmin] = await conn.execute("SELECT UserID FROM Users WHERE Email='admin@library.com'");
  if (existAdmin.length === 0) {
    const [[maxRow]] = await conn.execute("SELECT COALESCE(MAX(UserID), 0) + 1 AS nextId FROM Users");
    const nextId = maxRow.nextId;
    const hashed = await bcrypt.hash('admin123', 10);
    await conn.execute(
      "INSERT INTO Users (UserID, Email, Password, FirstName, LastName, FullName, Status, RoleID) VALUES (?,?,?,?,?,?,?,?)",
      [nextId, 'admin@library.com', hashed, 'Library', 'Admin', 'Library Admin', 'active', 1]
    );
    console.log('\nAdmin created: admin@library.com / admin123');
  } else {
    await conn.execute("UPDATE Users SET Status='active', RoleID=1 WHERE Email='admin@library.com'");
    console.log('Admin already exists - ensured active');
  }

  // Seed FineType if none
  const [ft] = await conn.execute('SELECT TypeID FROM FineTypes LIMIT 1');
  if (ft.length === 0) {
    try {
      await conn.execute("INSERT INTO FineTypes (TypeName, BaseAmount, Description) VALUES ('Overdue', 5.00, 'Daily overdue fine')");
      console.log('FineType seeded');
    } catch (e) { console.log('FineType note:', e.message); }
  }

  await conn.end();
  console.log('\nSetup complete!');
  console.log('Admin login -> email: admin@library.com  password: admin123');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
