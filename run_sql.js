const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, 'backend', '.env')});

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    await conn.execute("INSERT IGNORE INTO Roles (RoleID, RoleName, Description) VALUES (1, 'Admin', 'Full access set manually in DB'), (2, 'Staff', 'Approved by admin'), (3, 'Member', 'Student approved by staff');");
    await conn.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS FirstName VARCHAR(100);");
    await conn.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS LastName VARCHAR(100);");
    await conn.execute("ALTER TABLE Users ADD COLUMN IF NOT EXISTS UniversityID VARCHAR(100);");
    console.log('SQL executed successfully');
    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
