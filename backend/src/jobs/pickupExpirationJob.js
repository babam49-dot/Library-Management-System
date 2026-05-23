const cron = require('node-cron');
const db = require('../db');
const { notifyMember } = require('../services/socketService');

// Run every 1 minute
const runExpirationJob = async () => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Query expired rows
    const [expiredRows] = await conn.query(`
      SELECT BorrowID, CopyID FROM BorrowingRecords
      WHERE Status = 'Pending' AND PickupDeadline < NOW() FOR UPDATE
    `);

    let expiredCount = 0;
    let queueAdvances = 0;

    for (const row of expiredRows) {
      expiredCount++;
      
      // a. Update to Expired
      await conn.query(`UPDATE BorrowingRecords SET Status = 'Expired' WHERE BorrowID = ?`, [row.BorrowID]);

      // b. Fetch BookID for the CopyID
      const [[copyRow]] = await conn.query('SELECT BookID FROM BookCopies WHERE CopyID = ?', [row.CopyID]);
      
      if (copyRow) {
        const bookId = copyRow.BookID;

        // c. Check Reservations queue for this BookID
        const [resRows] = await conn.query(`
          SELECT ReservationID, MemberID, RequestCode FROM Reservations
          WHERE BookID = ? AND Status = 'Queued'
          ORDER BY Priority ASC, ReservationDate ASC LIMIT 1 FOR UPDATE
        `, [bookId]);

        if (resRows.length > 0) {
          // d. Advance queue
          const nextRes = resRows[0];
          await conn.query(`
            INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
            VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 30 MINUTE))
          `, [nextRes.MemberID, row.CopyID, nextRes.RequestCode]);

          await conn.query(`UPDATE BookCopies SET Status = 'Reserved_on_Shelf' WHERE CopyID = ?`, [row.CopyID]);

          await conn.query(`
            UPDATE Reservations SET Status = 'Ready', CopyID = ?, PickupDeadline = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
            WHERE ReservationID = ?
          `, [row.CopyID, nextRes.ReservationID]);

          queueAdvances++;
          // Notify the member in real-time
          notifyMember(nextRes.MemberID, 'queue:promoted', {
            reservationId: nextRes.ReservationID,
            requestCode: nextRes.RequestCode,
            message: 'Your reservation is now Ready for pickup! You have 30 minutes.'
          });
          notifyMember(nextRes.MemberID, 'reservation:updated', {});
        } else {
          // e. No queue -> Available
          await conn.query(`UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?`, [row.CopyID]);
        }
      } else {
        // Fallback if copy not found
        await conn.query(`UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?`, [row.CopyID]);
      }
    }

    await conn.commit();
    if (expiredCount > 0) {
      console.log(`Pickup expiration job: ${expiredCount} rows expired, ${queueAdvances} queue advances`);
    }
    return { expiredCount, queueAdvances };
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Pickup Expiration Job Error:", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

cron.schedule('* * * * *', runExpirationJob);

module.exports = { runExpirationJob };
