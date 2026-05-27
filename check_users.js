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
    const [rows] = await conn.execute("SELECT u.UserID, u.Email, u.FullName, u.Status, u.RoleID, r.RoleName FROM Users u JOIN Roles r ON u.RoleID = r.RoleID LIMIT 20;");
    console.log(rows);
    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
