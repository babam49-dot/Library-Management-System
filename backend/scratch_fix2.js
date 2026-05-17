const mysql = require('mysql2/promise');

async function fix() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1021',
    database: 'mydb_ex'
  });
  
  try {
    const conn = await pool.getConnection();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    console.log("Fixing Users...");
    await conn.query('ALTER TABLE Users MODIFY UserID INT AUTO_INCREMENT');
    
    console.log("Fixing Members...");
    await conn.query('ALTER TABLE Members MODIFY MemberID INT AUTO_INCREMENT');
    
    console.log("Fixing Staff...");
    await conn.query('ALTER TABLE Staff MODIFY StaffID INT AUTO_INCREMENT');
    
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    conn.release();
    console.log("Success!");
  } catch (e) {
    console.log("Error:", e.message);
  }
  
  process.exit(0);
}
fix();
