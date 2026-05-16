const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrateFines() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mydb_ex',
    port: parseInt(process.env.DB_PORT, 10) || 3306
  });

  try {
    console.log('Starting Fines & Payments Migration...');

    // 1. Add columns to Fines
    try {
      await connection.query(`ALTER TABLE Fines ADD COLUMN MemberID INT AFTER FineStatus;`);
      console.log('Added MemberID to Fines');
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('MemberID already exists in Fines'); }

    try {
      await connection.query(`ALTER TABLE Fines ADD COLUMN WaivedByStaffID INT;`);
      console.log('Added WaivedByStaffID to Fines');
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('WaivedByStaffID already exists in Fines'); }

    try {
      await connection.query(`ALTER TABLE Fines ADD COLUMN WaiverReason TEXT;`);
      console.log('Added WaiverReason to Fines');
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('WaiverReason already exists in Fines'); }

    // Populate MemberID in Fines based on UserID if possible
    await connection.query(`
      UPDATE Fines f
      JOIN Members m ON m.UserID = f.UserID
      SET f.MemberID = m.MemberID
      WHERE f.MemberID IS NULL;
    `);
    console.log('Populated MemberID in Fines');

    // 2. Add columns to Payments
    try {
      await connection.query(`ALTER TABLE Payments ADD COLUMN ReceivedByStaffID INT;`);
      console.log('Added ReceivedByStaffID to Payments');
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; else console.log('ReceivedByStaffID already exists in Payments'); }

    // 3. Create View OutstandingFinesReport
    await connection.query(`
      CREATE OR REPLACE VIEW OutstandingFinesReport AS
      SELECT m.MemberID, u.FullName, u.Email, m.StudentID, 
             SUM(f.Amount) AS TotalUnpaidAmount,
             COUNT(f.FineID) AS UnpaidFinesCount
      FROM Fines f
      JOIN Members m ON f.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
      WHERE f.FineStatus IN ('Unpaid', 'Partial')
      GROUP BY m.MemberID, u.FullName, u.Email, m.StudentID
      ORDER BY TotalUnpaidAmount DESC;
    `);
    console.log('Created OutstandingFinesReport View');

    console.log('Migration Completed Successfully!');
  } catch (error) {
    console.error('Migration Failed:', error);
  } finally {
    await connection.end();
  }
}

migrateFines();
