const cron = require('node-cron');
const db = require('../db');
const { notifyMember } = require('../services/socketService');

// Run every 1 minute
const runReservationExpiry = async () => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // 1. Query expired reservations
    const [expiredRows] = await conn.query(`
      SELECT ReservationID, BookID, CopyID FROM Reservations
      WHERE Status = 'Ready' AND PickupDeadline < NOW() FOR UPDATE
    `);

    let expiredCount = 0;

    for (const row of expiredRows) {
      expiredCount++;
      
      // a. Update to Expired
      await conn.query(`UPDATE Reservations SET Status = 'Expired' WHERE ReservationID = ?`, [row.ReservationID]);

      if (!row.CopyID) continue; // Should have a CopyID if it was Ready, but just in case

      // b. Release the copy back to Available, unless someone else is in queue
      // First, fetch the BookID for this copy (or use row.BookID)
      const bookId = row.BookID;

      // Second, see if someone else is in the queue for this book
      const [resRows] = await conn.query(`
        SELECT ReservationID, MemberID, RequestCode FROM Reservations
        WHERE BookID = ? AND Status = 'Queued'
        ORDER BY Priority ASC, ReservationDate ASC LIMIT 1 FOR UPDATE
      `, [bookId]);

      if (resRows.length > 0) {
        // Next person in queue gets it (30 min deadline since we're using 30-min holds now)
        const nextRes = resRows[0];
        await conn.query(`
          UPDATE Reservations SET Status = 'Ready', CopyID = ?, PickupDeadline = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
          WHERE ReservationID = ?
        `, [row.CopyID, nextRes.ReservationID]);
        // Notify the promoted member in real-time
        notifyMember(nextRes.MemberID, 'queue:promoted', {
          reservationId: nextRes.ReservationID,
          requestCode: nextRes.RequestCode,
          message: 'Your reservation is now Ready for pickup! You have 30 minutes.'
        });
        notifyMember(nextRes.MemberID, 'reservation:updated', {});
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
