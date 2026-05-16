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

      try {
        const [fineCheck] = await conn.query(`SELECT FineID FROM Fines WHERE BorrowID = ? AND TypeID = (SELECT TypeID FROM FineTypes WHERE TypeName LIKE '%Overdue%' LIMIT 1)`, [row.BorrowID]);
        if (fineCheck.length === 0) {
          const [memberCheck] = await conn.query(`SELECT UserID FROM Members WHERE MemberID = ?`, [row.MemberID]);
          if (memberCheck.length > 0) {
            await conn.query(`
              INSERT INTO Fines (UserID, TypeID, BorrowID, Amount, IssuedDate, FineStatus, MemberID)
              VALUES (?, (SELECT TypeID FROM FineTypes WHERE TypeName LIKE '%Overdue%' LIMIT 1), ?, COALESCE((SELECT BaseAmount FROM FineTypes WHERE TypeName LIKE '%Overdue%' LIMIT 1), 5.00), CURDATE(), 'Unpaid', ?)
            `, [memberCheck[0].UserID, row.BorrowID, row.MemberID]);
          }
        }
      } catch (fineErr) {
        console.error('Fine insertion error:', fineErr.message);
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
