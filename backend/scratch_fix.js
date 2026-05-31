const mysql = require('mysql2/promise');

async function fix() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1021',
    database: 'mydb_ex'
  });
  
  try {
    // We have to temporarily drop foreign keys if they are blocking, but usually MODIFY INT AUTO_INCREMENT is fine
    // if it's the primary key of the referenced table.
    await pool.query('ALTER TABLE Users MODIFY UserID INT AUTO_INCREMENT');
    console.log("Users fixed");
  } catch (e) {
    console.log("Users error:", e.message);
  }

  try {
    await pool.query('ALTER TABLE Members MODIFY MemberID INT AUTO_INCREMENT');
    console.log("Members fixed");
  } catch (e) {
    console.log("Members error:", e.message);
  }

  try {
    await pool.query('ALTER TABLE Staff MODIFY StaffID INT AUTO_INCREMENT');
    console.log("Staff fixed");
  } catch (e) {
    console.log("Staff error:", e.message);
  }
  
  process.exit(0);
}
fix();
