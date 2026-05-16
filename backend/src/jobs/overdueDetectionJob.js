const cron = require('node-cron');
const db = require('../db');

// Run daily at midnight: '0 0 * * *'
const runOverdueJob = async () => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    const [rows] = await conn.query(`
      SELECT BorrowID, MemberID FROM BorrowingRecords
      WHERE DueDate < CURDATE() AND Status = 'Borrowed' FOR UPDATE
    `);

    let overdueCount = 0;

    for (const row of rows) {
      overdueCount++;
      
      // Update Status
      await conn.query(`UPDATE BorrowingRecords SET Status = 'Overdue' WHERE BorrowID = ?`, [row.BorrowID]);

      // Check if Fines table exists (for Module 4 readiness)
      // We will try to insert a placeholder if it does, but catch error if it doesn't
      try {
        const [fineCheck] = await conn.query(`SELECT FineID FROM Fines WHERE BorrowID = ?`, [row.BorrowID]);
        if (fineCheck.length === 0) {
          await conn.query(`
            INSERT INTO Fines (MemberID, BorrowID, Amount, Status, Description, IssuedDate)
            VALUES (?, ?, 5.00, 'Unpaid', 'Initial overdue fine', CURDATE())
          `, [row.MemberID, row.BorrowID]);
        }
      } catch (fineErr) {
        // Table probably doesn't exist yet, ignore
      }
    }

    await conn.commit();
    console.log(`Overdue job: ${overdueCount} records flagged as overdue`);
    return { overdueCount };
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Overdue Detection Job Error:", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

cron.schedule('0 0 * * *', runOverdueJob);

module.exports = { runOverdueJob };
