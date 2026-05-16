const cron = require('node-cron');
const db = require('../db');

// Run every 1 hour: '0 * * * *'
// For testing purposes, we can export the logic to run manually
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

      // b. Check Reservations queue
      const [resRows] = await conn.query(`
        SELECT ReservationID, MemberID, RequestCode FROM Reservations
        WHERE CopyID = ? AND Status = 'Queued'
        ORDER BY Priority ASC, ReservationDate ASC LIMIT 1 FOR UPDATE
      `);

      if (resRows.length > 0) {
        // c. Advance queue
        const nextRes = resRows[0];
        await conn.query(`
          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `, [nextRes.MemberID, row.CopyID, nextRes.RequestCode]);

        await conn.query(`UPDATE BookCopies SET Status = 'Reserved_on_Shelf' WHERE CopyID = ?`, [row.CopyID]);

        await conn.query(`
          UPDATE Reservations SET Status = 'Ready', PickupDeadline = DATE_ADD(NOW(), INTERVAL 24 HOUR)
          WHERE ReservationID = ?
        `, [nextRes.ReservationID]);

        queueAdvances++;
      } else {
        // d. No queue -> Available
        await conn.query(`UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?`, [row.CopyID]);
      }
    }

    await conn.commit();
    console.log(`Pickup expiration job: ${expiredCount} rows expired, ${queueAdvances} queue advances`);
    return { expiredCount, queueAdvances };
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Pickup Expiration Job Error:", err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

cron.schedule('0 * * * *', runExpirationJob);

module.exports = { runExpirationJob };
