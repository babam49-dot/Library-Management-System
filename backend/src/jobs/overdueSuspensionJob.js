const cron = require('node-cron');
const db = require('../db');

/**
 * Runs every hour.
 * 1. Marks borrowed books past due date as 'Overdue'.
 * 2. Suspends members who have at least one overdue book.
 * 3. Re-activates previously suspended members who have paid fines and returned all books.
 */
const runOverdueSuspensionJob = async () => {
  let conn;
  try {
    conn = await db.getConnection();
    await conn.beginTransaction();

    // Step 1: Mark borrowed records as Overdue if past due date
    const [overdueUpdate] = await conn.query(`
      UPDATE BorrowingRecords
      SET Status = 'Overdue'
      WHERE Status = 'Borrowed'
        AND DueDate IS NOT NULL
        AND DueDate < NOW()
    `);

    // Step 2: Suspend members who have overdue records
    const [overdueMembers] = await conn.query(`
      SELECT DISTINCT br.MemberID, m.UserID
      FROM BorrowingRecords br
      JOIN Members m ON m.MemberID = br.MemberID
      WHERE br.Status = 'Overdue'
    `);

    let suspended = 0;
    for (const row of overdueMembers) {
      await conn.query(
        "UPDATE Users SET Status = 'Suspended' WHERE UserID = ? AND Status = 'Active'",
        [row.UserID]
      );
      suspended++;
    }

    // Step 3: Re-activate suspended members who have:
    //   - No overdue books remaining
    //   - No unpaid fines
    const [suspendedUsers] = await conn.query(`
      SELECT u.UserID, m.MemberID
      FROM Users u
      JOIN Members m ON m.UserID = u.UserID
      WHERE u.Status = 'Suspended'
    `);

    let reactivated = 0;
    for (const su of suspendedUsers) {
      const [[{ overdueCount }]] = await conn.query(
        "SELECT COUNT(*) AS overdueCount FROM BorrowingRecords WHERE MemberID = ? AND Status = 'Overdue'",
        [su.MemberID]
      );
      const [[{ unpaidFines }]] = await conn.query(
        "SELECT COALESCE(SUM(Amount - COALESCE(paid.total,0)),0) AS unpaidFines FROM Fines f LEFT JOIN (SELECT FineID, SUM(AmountPaid) AS total FROM Payments WHERE PaymentStatus='Completed' GROUP BY FineID) paid ON paid.FineID=f.FineID WHERE f.MemberID = ? AND f.FineStatus IN ('Unpaid','Partial')",
        [su.MemberID]
      );

      if (Number(overdueCount) === 0 && Number(unpaidFines) === 0) {
        await conn.query(
          "UPDATE Users SET Status = 'Active' WHERE UserID = ?",
          [su.UserID]
        );
        reactivated++;
      }
    }

    await conn.commit();

    const changed = overdueUpdate.affectedRows + suspended + reactivated;
    if (changed > 0) {
      console.log(`[OverdueSuspension] Marked overdue: ${overdueUpdate.affectedRows}, Suspended: ${suspended}, Re-activated: ${reactivated}`);
    }
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('[OverdueSuspension Job Error]', err.message);
  } finally {
    if (conn) conn.release();
  }
};

// Run every hour
cron.schedule('0 * * * *', runOverdueSuspensionJob);

// Also run once at startup
runOverdueSuspensionJob();

module.exports = { runOverdueSuspensionJob };
