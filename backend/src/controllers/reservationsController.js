const db = require('../db');

exports.getAllReservations = async (req, res) => {
  try {
    const { copyId, memberId, status } = req.query;
    
    let query = `
      SELECT 
        r.ReservationID as reservationId, r.RequestCode as requestCode,
        r.CopyID as copyId, r.Status as status, r.Priority as priority,
        r.ReservationDate as reservationDate, r.PickupDeadline as pickupDeadline,
        m.MemberID as memberID, u.FullName as memberName,
        b.Title as bookTitle, b.ISBN as isbn
      FROM Reservations r
      JOIN Members m ON r.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
      JOIN BookCopies bc ON r.CopyID = bc.CopyID
      JOIN Books b ON bc.BookID = b.BookID
    `;
    const params = [];
    const conditions = [];

    if (copyId) { conditions.push('r.CopyID = ?'); params.push(copyId); }
    if (memberId) { conditions.push('m.MemberID = ?'); params.push(memberId); }
    if (status) { conditions.push('r.Status = ?'); params.push(status); }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.ReservationDate DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const memberId = req.user.extensionId;
    
    const [rows] = await db.query(`
      SELECT 
        r.ReservationID as reservationId, r.RequestCode as requestCode,
        r.CopyID as copyId, r.Status as status, r.Priority as priority,
        r.ReservationDate as reservationDate, r.PickupDeadline as pickupDeadline,
        b.Title as bookTitle, b.ISBN as isbn,
        (SELECT COUNT(*) FROM Reservations r2 WHERE r2.CopyID = r.CopyID AND r2.Status = 'Queued' AND r2.Priority < r.Priority) as queuePosition
      FROM Reservations r
      JOIN BookCopies bc ON r.CopyID = bc.CopyID
      JOIN Books b ON bc.BookID = b.BookID
      WHERE r.MemberID = ?
      ORDER BY r.ReservationDate DESC
    `, [memberId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.cancelReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const isMember = req.user.role === 3;
    const memberId = req.user.extensionId;

    const [rows] = await db.query('SELECT MemberID, Status, CopyID FROM Reservations WHERE ReservationID = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    const resRecord = rows[0];

    if (isMember) {
      if (resRecord.MemberID !== memberId) return res.status(403).json({ success: false, message: "Forbidden" });
      if (resRecord.Status !== 'Queued') return res.status(400).json({ success: false, message: "Can only cancel queued reservations" });
    }

    await db.query(`UPDATE Reservations SET Status = 'Cancelled' WHERE ReservationID = ?`, [id]);

    // If it was ready, we need to release the copy and check queue
    if (resRecord.Status === 'Ready') {
      // Find pending borrowing record to kill
      const [br] = await db.query(`
        SELECT BorrowID FROM BorrowingRecords 
        WHERE MemberID = ? AND CopyID = ? AND Status = 'Pending'
      `, [resRecord.MemberID, resRecord.CopyID]);

      if (br.length > 0) {
        await db.query(`UPDATE BorrowingRecords SET Status = 'Expired' WHERE BorrowID = ?`, [br[0].BorrowID]);
      }

      await db.query(`UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?`, [resRecord.CopyID]);

      // Check next in queue
      const [nextRes] = await db.query(`
        SELECT ReservationID, MemberID, RequestCode FROM Reservations
        WHERE CopyID = ? AND Status = 'Queued'
        ORDER BY Priority ASC, ReservationDate ASC LIMIT 1
      `, [resRecord.CopyID]);

      if (nextRes.length > 0) {
        const next = nextRes[0];
        await db.query(`
          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `, [next.MemberID, resRecord.CopyID, next.RequestCode]);
        await db.query(`UPDATE BookCopies SET Status = 'Reserved_on_Shelf' WHERE CopyID = ?`, [resRecord.CopyID]);
        await db.query(`UPDATE Reservations SET Status = 'Ready', PickupDeadline = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE ReservationID = ?`, [next.ReservationID]);
      }
    }

    res.json({ success: true, message: "Reservation cancelled" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getQueueForCopy = async (req, res) => {
  try {
    const { copyId } = req.params;
    const [rows] = await db.query(`
      SELECT 
        r.ReservationID as reservationId, r.RequestCode as requestCode,
        r.Status as status, r.Priority as priority, r.ReservationDate as reservationDate,
        u.FullName as memberName
      FROM Reservations r
      JOIN Members m ON r.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
      WHERE r.CopyID = ? AND r.Status IN ('Queued', 'Ready')
      ORDER BY r.Priority ASC, r.ReservationDate ASC
    `, [copyId]);

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
