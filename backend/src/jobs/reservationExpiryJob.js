const cron = require('node-cron');
const db = require('../db');

// Run every 1 minute
const runReservationExpiry = async () => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Query expired reservations
    const [expiredRows] = await conn.query(`
      SELECT ReservationID, CopyID FROM Reservations
      WHERE Status = 'Ready' AND PickupDeadline < NOW() FOR UPDATE
    `);

    let expiredCount = 0;

    for (const row of expiredRows) {
      expiredCount++;
      
      // a. Update to Expired
      await conn.query(`UPDATE Reservations SET Status = 'Expired' WHERE ReservationID = ?`, [row.ReservationID]);

      if (!row.CopyID) continue; // Should have a CopyID if it was Ready, but just in case

      // b. Release the copy back to Available, unless someone else is in queue
      // First, see if someone else is in the queue for this book
      const [resRows] = await conn.query(`
        SELECT ReservationID, MemberID, RequestCode FROM Reservations
        WHERE CopyID = ? AND Status = 'Queued'
        ORDER BY Priority ASC, ReservationDate ASC LIMIT 1 FOR UPDATE
      `, [row.CopyID]);

      if (resRows.length > 0) {
        // Next person in queue gets it (30 min deadline since we're using 30-min holds now)
        const nextRes = resRows[0];
        await conn.query(`
          UPDATE Reservations SET Status = 'Ready', PickupDeadline = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
          WHERE ReservationID = ?
        `, [nextRes.ReservationID]);
      } else {
        // No one in queue -> copy becomes Available
        await conn.query(`UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?`, [row.CopyID]);
      }
    }

    await conn.commit();
    if (expiredCount > 0) {
      console.log(`Reservation expiry job: ${expiredCount} reservations expired.`);
    }
    return { expiredCount };
  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Reservation Expiry Job Error:", err);
  } finally {
    if (conn) conn.release();
  }
};

cron.schedule('* * * * *', runReservationExpiry);

module.exports = { runReservationExpiry };
