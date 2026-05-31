const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const chapa = require('../services/chapaService');

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, message, status = 400, data = null) =>
  res.status(status).json({ success: false, message, data });

const memberOnly = [authenticate, requireRole(1, 2, 3)];

function getMemberId(req) {
  return req.user.MemberID || req.user.memberID || req.user.extensionId;
}

async function reconcileFineStatus(connection, fineId) {
  const [[fine]] = await connection.execute(
    'SELECT FineID, Amount FROM Fines WHERE FineID = ?',
    [fineId]
  );
  if (!fine) return null;

  const [[paid]] = await connection.execute(
    "SELECT COALESCE(SUM(AmountPaid),0) AS totalPaid FROM Payments WHERE FineID = ? AND PaymentStatus = 'Completed'",
    [fineId]
  );

  const amount = Number(fine.Amount || 0);
  const totalPaid = Number(paid.totalPaid || 0);
  const status = totalPaid >= amount ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid';

  await connection.execute('UPDATE Fines SET FineStatus = ? WHERE FineID = ?', [status, fineId]);
  return { amount, totalPaid, balance: Math.max(amount - totalPaid, 0), status };
}

async function getMemberSummary(memberId) {
  const [[borrowed]] = await pool.execute(
    "SELECT COUNT(*) AS count FROM BorrowingRecords WHERE MemberID = ? AND Status IN ('Pending','Borrowed','Overdue')",
    [memberId]
  );
  const [[reservations]] = await pool.execute(
    "SELECT COUNT(*) AS count FROM Reservations WHERE MemberID = ? AND Status IN ('Queued','Ready')",
    [memberId]
  );
  const [[fines]] = await pool.execute(
    "SELECT COALESCE(SUM(f.Amount - COALESCE(p.TotalPaid,0)),0) AS balance FROM Fines f LEFT JOIN (SELECT FineID, SUM(AmountPaid) AS TotalPaid FROM Payments WHERE PaymentStatus = 'Completed' GROUP BY FineID) p ON p.FineID = f.FineID WHERE f.MemberID = ? AND f.FineStatus IN ('Unpaid','Partial')",
    [memberId]
  );
  const [[member]] = await pool.execute(
    `SELECT m.MemberID, m.StudentID, m.Department, m.MaxBooksAllowed,
            u.UserID, u.FullName, u.Email, u.Status
     FROM Members m
     JOIN Users u ON u.UserID = m.UserID
     WHERE m.MemberID = ?`,
    [memberId]
  );

  // Count active overdue records (books not yet returned past due date)
  const [[overdueRow]] = await pool.execute(
    "SELECT COUNT(*) AS count FROM BorrowingRecords WHERE MemberID = ? AND Status = 'Overdue'",
    [memberId]
  );
  const overdueCount = Number(overdueRow.count || 0);
  const fineBalance = Number(fines.balance || 0);

  // Count unpaid damage/loss fines specifically for UI messaging
  const [[damageFines]] = await pool.execute(
    `SELECT COALESCE(SUM(f.Amount - COALESCE(p.TotalPaid,0)),0) AS balance
     FROM Fines f
     LEFT JOIN FineTypes ft ON ft.TypeID = f.FineTypeID
     LEFT JOIN (SELECT FineID, SUM(AmountPaid) AS TotalPaid FROM Payments WHERE PaymentStatus='Completed' GROUP BY FineID) p ON p.FineID = f.FineID
     WHERE f.MemberID = ? AND f.FineStatus IN ('Unpaid','Partial')
       AND (ft.TypeName LIKE '%Damage%' OR ft.TypeName LIKE '%Loss%' OR ft.TypeName LIKE '%Lost%')`,
    [memberId]
  );

  return {
    profile: member,
    activeBorrowCount: Number(borrowed.count || 0),
    reservationCount: Number(reservations.count || 0),
    fineBalance,
    overdueCount,
    damageOrLossFineBalance: Number(damageFines.balance || 0),
    // Blocked if ANY unpaid fine (overdue, damage, lost) OR any active overdue book
    borrowingBlocked: fineBalance > 0 || overdueCount > 0
  };
}

router.get('/dashboard', memberOnly, async (req, res) => {
  try {
    const memberId = getMemberId(req);
    if (!memberId) return fail(res, 'Member profile not found', 404);
    return ok(res, 'Member dashboard', await getMemberSummary(memberId));
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

router.get('/books', memberOnly, async (req, res) => {
  try {
    const { q, title, author, category, isbn } = req.query;
    const params = [];
    const filters = [];
    let sql = `
      SELECT
        b.BookID, b.Title, b.ISBN, b.Language, b.Edition, b.Year, b.Year AS PublishYear, b.CoverImage,
        c.CategoryName, p.PublisherName,
        GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') AS Authors,
        COUNT(DISTINCT CASE WHEN bc.Status = 'Available' THEN bc.CopyID END) AS AvailableCopies,
        COUNT(DISTINCT bc.CopyID) AS TotalCopies,
        GROUP_CONCAT(DISTINCT CASE WHEN bc.Status = 'Available' THEN bc.CopyID END ORDER BY bc.CopyID SEPARATOR ',') AS AvailableCopyIds
      FROM Books b
      LEFT JOIN Categories c ON c.CategoryID = b.CategoryID
      LEFT JOIN Publishers p ON p.PublisherID = b.PublisherID
      LEFT JOIN BookAuthors ba ON ba.BookID = b.BookID
      LEFT JOIN Authors a ON a.AuthorID = ba.AuthorID
      LEFT JOIN BookCopies bc ON bc.BookID = b.BookID
      WHERE COALESCE(b.IsActive, 1) = 1
    `;

    if (q) {
      filters.push('(b.Title LIKE ? OR a.Name LIKE ? OR c.CategoryName LIKE ? OR b.ISBN LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (title) { filters.push('b.Title LIKE ?'); params.push(`%${title}%`); }
    if (author) { filters.push('a.Name LIKE ?'); params.push(`%${author}%`); }
    if (category) { filters.push('c.CategoryName = ?'); params.push(category); }
    if (isbn) { filters.push('b.ISBN LIKE ?'); params.push(`%${isbn}%`); }

    if (filters.length) sql += ` AND ${filters.join(' AND ')}`;
    sql += ' GROUP BY b.BookID ORDER BY b.Title';

    const [rows] = await pool.execute(sql, params);
    return ok(res, 'Catalog books', rows);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

router.get('/my-borrowings', memberOnly, async (req, res) => {
  try {
    // Strictly only return records where the borrower is a student (RoleID = 3).
    // This prevents staff shadow-member borrowings from ever appearing on the student dashboard.
    const [rows] = await pool.execute(
      `SELECT br.BorrowID, br.RequestCode, br.BorrowDate, br.DueDate, br.ReturnDate, br.Status,
              b.Title, b.ISBN, bc.CopyID, bc.BarcodeNumber, bc.ShelfLocation
       FROM BorrowingRecords br
       JOIN BookCopies bc ON bc.CopyID = br.CopyID
       JOIN Books b ON b.BookID = bc.BookID
       JOIN Members m ON m.MemberID = br.MemberID
       JOIN Users u ON u.UserID = m.UserID
       WHERE br.MemberID = ? AND u.RoleID = 3
       ORDER BY br.BorrowDate DESC, br.BorrowID DESC`,
      [getMemberId(req)]
    );
    return ok(res, 'My borrowed books', rows);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

router.get('/my-reservations', memberOnly, async (req, res) => {
  try {
    const memberId = getMemberId(req);
    const [rows] = await pool.execute(
      `SELECT r.ReservationID, r.RequestCode, r.Status, r.Priority, r.ReservationDate, r.PickupDeadline,
              r.BookID, r.CopyID,
              b.Title, b.ISBN, bc.CopyID AS CopyNum,
              (
                SELECT COUNT(*) FROM Reservations r2
                WHERE r2.BookID = r.BookID
                  AND r2.Status = 'Queued'
                  AND (
                    r2.Priority < r.Priority
                    OR (r2.Priority = r.Priority AND r2.ReservationDate < r.ReservationDate)
                  )
              ) AS StudentsAhead
       FROM Reservations r
       LEFT JOIN BookCopies bc ON bc.CopyID = r.CopyID
       JOIN Books b ON b.BookID = r.BookID
       WHERE r.MemberID = ? AND r.Status NOT IN ('Cancelled','Expired')
       ORDER BY r.ReservationDate DESC`,
      [memberId]
    );
    return ok(res, 'My reservations', rows);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});


router.post('/reserve', memberOnly, async (req, res) => {
  const { bookId } = req.body;
  const memberId = getMemberId(req);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check fine block
    const summary = await getMemberSummary(memberId);
    if (summary.borrowingBlocked) {
      await connection.rollback();
      return fail(res, 'You have an unpaid balance. Please settle your fines before reserving.', 403);
    }

    // Check reservation limit (Max 2)
    const [resCount] = await connection.execute(
      "SELECT COUNT(*) as cnt FROM Reservations WHERE MemberID = ? AND Status IN ('Queued','Ready')",
      [memberId]
    );
    if (resCount[0].cnt >= 2) {
      await connection.rollback();
      return fail(res, 'You have reached the maximum reservation limit of 2 books.');
    }

    // Check if member already has this book reserved or borrowed
    const [existingRes] = await connection.execute(
      "SELECT * FROM Reservations WHERE MemberID = ? AND BookID = ? AND Status IN ('Queued','Ready')",
      [memberId, bookId]
    );
    if (existingRes.length > 0) {
      await connection.rollback();
      return fail(res, 'You already have an active reservation for this book.');
    }

    const [existingBor] = await connection.execute(
      "SELECT * FROM BorrowingRecords br JOIN BookCopies bc ON br.CopyID=bc.CopyID WHERE br.MemberID = ? AND bc.BookID = ? AND br.Status IN ('Pending','Borrowed')",
      [memberId, bookId]
    );
    if (existingBor.length > 0) {
      await connection.rollback();
      return fail(res, 'You already have this book borrowed or pending pickup.');
    }

    // Determine if any copy is available
    const [availableCopies] = await connection.execute(
      "SELECT CopyID FROM BookCopies WHERE BookID = ? AND Status = 'Available' LIMIT 1 FOR UPDATE",
      [bookId]
    );

    const requestCode = 'RSV-' + Math.floor(1000 + Math.random() * 9000); // Simple code

    if (availableCopies.length > 0) {
      // Immediate 30-minute hold
      const copyId = availableCopies[0].CopyID;
      await connection.execute(
        "UPDATE BookCopies SET Status = 'Reserved_on_Shelf' WHERE CopyID = ?",
        [copyId]
      );

      await connection.execute(
        "INSERT INTO Reservations (MemberID, BookID, CopyID, RequestCode, Status, Priority, ReservationDate, PickupDeadline) VALUES (?, ?, ?, ?, 'Ready', 0, NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE))",
        [memberId, bookId, copyId, requestCode]
      );

      await connection.commit();
      return ok(res, 'Reserved! You have 30 minutes to pick it up.', { immediate: true });
    } else {
      // Determine next priority for waitlist
      const [[priorityRow]] = await connection.execute(
        "SELECT COALESCE(MAX(Priority), 0) + 1 AS NextPriority FROM Reservations WHERE BookID = ? AND Status = 'Queued'",
        [bookId]
      );

      await connection.execute(
        "INSERT INTO Reservations (MemberID, BookID, RequestCode, Status, Priority, ReservationDate) VALUES (?, ?, ?, 'Queued', ?, NOW())",
        [memberId, bookId, requestCode, priorityRow.NextPriority]
      );

      await connection.commit();
      return ok(res, 'Added to waitlist successfully', { immediate: false });
    }
  } catch (err) {
    await connection.rollback();
    return fail(res, err.message, 500);
  } finally {
    connection.release();
  }
});

router.delete('/reservations/:id', memberOnly, async (req, res) => {
  const { id } = req.params;
  const memberId = getMemberId(req);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[res_row]] = await connection.execute(
      "SELECT * FROM Reservations WHERE ReservationID = ? AND MemberID = ? FOR UPDATE",
      [id, memberId]
    );
    if (!res_row) {
      await connection.rollback();
      return fail(res, 'Reservation not found or forbidden', 404);
    }
    if (!['Queued', 'Ready'].includes(res_row.Status)) {
      await connection.rollback();
      return fail(res, 'Only active reservations (Queued or Ready) can be retracted.');
    }

    await connection.execute("UPDATE Reservations SET Status = 'Cancelled' WHERE ReservationID = ?", [id]);

    // If a Ready reservation is retracted, release the copy and advance queue
    if (res_row.Status === 'Ready' && res_row.CopyID) {
      // Check for next in queue for this same BookID
      const [[nextQueued]] = await connection.execute(
        `SELECT ReservationID, MemberID FROM Reservations
         WHERE BookID = ? AND Status = 'Queued'
         ORDER BY Priority ASC, ReservationDate ASC LIMIT 1 FOR UPDATE`,
        [res_row.BookID]
      );

      if (nextQueued) {
        // Advance next person in queue to Ready with 30-min hold
        await connection.execute(
          `UPDATE Reservations SET Status = 'Ready', CopyID = ?,
           PickupDeadline = DATE_ADD(NOW(), INTERVAL 30 MINUTE)
           WHERE ReservationID = ?`,
          [res_row.CopyID, nextQueued.ReservationID]
        );
        // Keep copy as Reserved_on_Shelf for next person
        try {
          const { notifyMember } = require('../services/socketService');
          notifyMember(nextQueued.MemberID, 'queue:promoted', {
            reservationId: nextQueued.ReservationID,
            message: 'Your reservation is now Ready for pickup! You have 30 minutes.'
          });
          notifyMember(nextQueued.MemberID, 'reservation:updated', {});
        } catch (_) {}
      } else {
        // No queue — free the copy back to Available
        await connection.execute(
          "UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?",
          [res_row.CopyID]
        );
      }
    }

    await connection.commit();
    // Broadcast to staff
    try {
      const { notifyStaff } = require('../services/socketService');
      notifyStaff('reservation:cancelled', { reservationId: id, memberId });
    } catch (_) {}
    return ok(res, 'Reservation retracted successfully');
  } catch (err) {
    await connection.rollback();
    return fail(res, err.message, 500);
  } finally {
    connection.release();
  }
});


// Retract a pending borrow request (student cancels before staff approves)
router.delete('/borrows/:id/retract', memberOnly, async (req, res) => {
  const { id } = req.params;
  const memberId = getMemberId(req);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[borrow]] = await conn.execute(
      "SELECT * FROM BorrowingRecords WHERE BorrowID = ? AND MemberID = ? AND Status = 'Pending' FOR UPDATE",
      [id, memberId]
    );

    if (!borrow) {
      await conn.rollback();
      return fail(res, 'Pending borrow not found or cannot be retracted.', 404);
    }

    // Release the copy back to Available
    await conn.execute("UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?", [borrow.CopyID]);
    // Mark the borrow record as Expired (cancelled/retracted status allowed by chk_borrow_status)
    await conn.execute("UPDATE BorrowingRecords SET Status = 'Expired' WHERE BorrowID = ?", [id]);

    await conn.commit();
    return ok(res, 'Borrow request retracted. Book is available again.');
  } catch (err) {
    await conn.rollback();
    return fail(res, err.message, 500);
  } finally {
    conn.release();
  }
});

router.get('/my-fines', memberOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.FineID, f.BorrowID, f.MemberID, f.Amount, f.FineStatus, f.GeneratedDate,
              f.WaiverReason,
              ft.TypeName, ft.Description,
              b.Title AS BookTitle,
              COALESCE(p.TotalPaid,0) AS TotalPaid,
              GREATEST(f.Amount - COALESCE(p.TotalPaid,0),0) AS Balance
       FROM Fines f
       LEFT JOIN FineTypes ft ON ft.TypeID = f.FineTypeID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = f.BorrowID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       LEFT JOIN (
         SELECT FineID, SUM(AmountPaid) AS TotalPaid
         FROM Payments
         WHERE PaymentStatus = 'Completed'
         GROUP BY FineID
       ) p ON p.FineID = f.FineID
       WHERE f.MemberID = ?
       ORDER BY f.GeneratedDate DESC, f.FineID DESC`,
      [getMemberId(req)]
    );
    return ok(res, 'My fines', rows);
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

router.post('/payments/chapa/initialize', memberOnly, async (req, res) => {
  const { fineId, amount } = req.body;
  const memberId = getMemberId(req);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[fine]] = await connection.execute(
      `SELECT f.*, u.Email, u.FullName
       FROM Fines f
       JOIN Members m ON m.MemberID = f.MemberID
       JOIN Users u ON u.UserID = m.UserID
       WHERE f.FineID = ? AND f.MemberID = ? FOR UPDATE`,
      [fineId, memberId]
    );
    if (!fine) {
      await connection.rollback();
      return fail(res, 'Fine not found', 404);
    }

    const current = await reconcileFineStatus(connection, fineId);
    if (current.status === 'Paid') {
      await connection.commit();
      return ok(res, 'Fine already paid', { fineId, status: 'Paid' });
    }

    const payable = Number(amount || current.balance);
    if (!payable || payable <= 0 || payable > current.balance) {
      await connection.rollback();
      return fail(res, `Amount must be between 1 and ${current.balance.toFixed(2)}`);
    }

    const txRef = `LMS-${memberId}-${fineId}-${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

    const chapaPayload = {
      amount: payable.toFixed(2),
      currency: 'ETB',
      email: fine.Email,
      first_name: String(fine.FullName || 'Library').split(' ')[0],
      last_name: String(fine.FullName || 'Member').split(' ').slice(1).join(' ') || 'Member',
      tx_ref: txRef,
      callback_url: `${backendUrl}/api/member/payments/chapa/callback/${txRef}`,
      return_url: `${frontendUrl}/member?tab=fines&tx_ref=${encodeURIComponent(txRef)}`
    };

    const chapaResponse = await chapa.initializePayment(chapaPayload);
    await connection.execute(
      `INSERT INTO Payments
       (FineID, MemberID, AmountPaid, PaymentMethod, PaymentReference, ChapaTransactionID, PaymentStatus)
       VALUES (?, ?, ?, 'Online', ?, ?, 'Pending')`,
      [fineId, memberId, payable, txRef, chapaResponse?.data?.reference || null]
    );

    await connection.commit();
    return ok(res, 'Chapa checkout initialized', {
      txRef,
      checkoutUrl: chapaResponse?.data?.checkout_url,
      chapa: chapaResponse
    });
  } catch (err) {
    await connection.rollback();
    return fail(res, err.message, err.status || 500, err.payload || null);
  } finally {
    connection.release();
  }
});

router.post('/payments/mock', memberOnly, async (req, res) => {
  const { fineId, amount, phone } = req.body;
  const memberId = getMemberId(req);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get fine details along with member/user info for the receipt
    const [[fine]] = await connection.execute(
      `SELECT f.FineID, f.Amount, f.FineTypeID,
              u.FullName, u.Email, u.Phone,
              m.StudentID, m.Department,
              ft.TypeName AS FineTypeName,
              b.Title AS BookTitle
       FROM Fines f
       JOIN Members m ON m.MemberID = f.MemberID
       JOIN Users u ON u.UserID = m.UserID
       LEFT JOIN FineTypes ft ON ft.TypeID = f.FineTypeID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = f.BorrowID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       WHERE f.FineID = ? AND f.MemberID = ? FOR UPDATE`,
      [fineId, memberId]
    );
    if (!fine) {
      await connection.rollback();
      return fail(res, 'Fine not found', 404);
    }

    const current = await reconcileFineStatus(connection, fineId);
    const payable = Number(amount || current.balance);
    if (!payable || payable <= 0 || payable > current.balance) {
      await connection.rollback();
      return fail(res, `Amount must be between 1 and ${current.balance.toFixed(2)}`);
    }

    // Update phone if provided
    if (phone) {
      await connection.execute('UPDATE Users SET Phone = ? WHERE UserID = (SELECT UserID FROM Members WHERE MemberID = ?)', [phone, memberId]);
    }

    const txRef = `MOCK-${memberId}-${fineId}-${Date.now()}`;
    const [insertResult] = await connection.execute(
      `INSERT INTO Payments (FineID, MemberID, AmountPaid, PaymentMethod, PaymentReference, PaymentStatus)
       VALUES (?, ?, ?, 'Online', ?, 'Completed')`,
      [fineId, memberId, payable, txRef]
    );
    const paymentId = insertResult.insertId;

    const fineStatus = await reconcileFineStatus(connection, fineId);
    await connection.commit();

    return ok(res, 'Payment recorded successfully', {
      paymentId,
      txRef,
      amountPaid: payable,
      fineStatus,
      receipt: {
        paymentId,
        txRef,
        memberName: fine.FullName,
        studentId: fine.StudentID,
        department: fine.Department,
        email: fine.Email,
        phone: phone || fine.Phone || 'N/A',
        fineType: fine.FineTypeName || 'Library Fine',
        bookTitle: fine.BookTitle || 'N/A',
        amountPaid: payable,
        remainingBalance: fineStatus.balance,
        paidAt: new Date().toISOString(),
        method: 'Chapa (Mock)',
        status: fineStatus.status
      }
    });
  } catch (err) {
    await connection.rollback();
    return fail(res, err.message, 500);
  } finally {
    connection.release();
  }
});

// Get payment receipt by PaymentID
router.get('/payments/receipt/:paymentId', memberOnly, async (req, res) => {
  const { paymentId } = req.params;
  const memberId = getMemberId(req);
  try {
    const [[row]] = await pool.execute(
      `SELECT p.PaymentID, p.AmountPaid, p.PaymentMethod, p.PaymentReference,
              p.PaymentStatus, p.PaymentDate,
              f.FineID, f.Amount AS FineAmount, f.FineStatus,
              ft.TypeName AS FineTypeName,
              u.FullName, u.Email, u.Phone,
              m.StudentID, m.Department,
              b.Title AS BookTitle
       FROM Payments p
       JOIN Fines f ON f.FineID = p.FineID
       JOIN Members m ON m.MemberID = p.MemberID
       JOIN Users u ON u.UserID = m.UserID
       LEFT JOIN FineTypes ft ON ft.TypeID = f.FineTypeID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = f.BorrowID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       WHERE p.PaymentID = ? AND p.MemberID = ?`,
      [paymentId, memberId]
    );
    if (!row) return fail(res, 'Receipt not found', 404);
    return ok(res, 'Payment receipt', {
      paymentId: row.PaymentID,
      txRef: row.PaymentReference,
      memberName: row.FullName,
      studentId: row.StudentID,
      department: row.Department,
      email: row.Email,
      phone: row.Phone || 'N/A',
      fineType: row.FineTypeName || 'Library Fine',
      bookTitle: row.BookTitle || 'N/A',
      amountPaid: Number(row.AmountPaid),
      fineTotal: Number(row.FineAmount),
      method: row.PaymentMethod,
      paidAt: row.PaymentDate,
      status: row.FineStatus
    });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

router.get('/payments/chapa/verify/:txRef', memberOnly, async (req, res) => {
  const { txRef } = req.params;
  const memberId = getMemberId(req);
  const connection = await pool.getConnection();

  try {
    const chapaResponse = await chapa.verifyPayment(txRef);
    const statusText = String(chapaResponse?.data?.status || chapaResponse?.status || '').toLowerCase();
    const isCompleted = statusText === 'success' || statusText === 'completed';

    await connection.beginTransaction();
    const [[payment]] = await connection.execute(
      'SELECT * FROM Payments WHERE PaymentReference = ? AND MemberID = ? FOR UPDATE',
      [txRef, memberId]
    );
    if (!payment) {
      await connection.rollback();
      return fail(res, 'Payment reference not found', 404);
    }

    await connection.execute(
      `UPDATE Payments SET PaymentStatus = ?, ChapaTransactionID = COALESCE(?, ChapaTransactionID)
       WHERE PaymentID = ?`,
      [isCompleted ? 'Completed' : 'Failed', chapaResponse?.data?.reference || null, payment.PaymentID]
    );
    const fineStatus = await reconcileFineStatus(connection, payment.FineID);
    await connection.commit();

    return ok(res, 'Chapa payment verified', { txRef, completed: isCompleted, fineStatus, chapa: chapaResponse });
  } catch (err) {
    await connection.rollback();
    return fail(res, err.message, err.status || 500, err.payload || null);
  } finally {
    connection.release();
  }
});

router.get('/payments/chapa/callback/:txRef', async (req, res) => {
  res.json({ success: true, message: 'Payment callback received', txRef: req.params.txRef });
});

// Has registered fingerprint check
router.get('/has-fingerprint', memberOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM WebAuthnCredentials WHERE UserID = ? LIMIT 1',
      [req.user.UserID]
    );
    return ok(res, 'Fingerprint check', { hasFingerprint: rows.length > 0 });
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

// Update profile phone and password
const bcrypt = require('bcryptjs');
router.put('/profile', memberOnly, async (req, res) => {
  const { phone, password, currentPassword } = req.body;
  const userId = req.user.UserID;

  try {
    if (phone) {
      await pool.execute(
        'UPDATE Users SET Phone = ? WHERE UserID = ?',
        [phone, userId]
      );
    }

    if (password) {
      if (!currentPassword) {
        return fail(res, 'Current password is required to change password.', 400);
      }
      const [users] = await pool.execute('SELECT Password FROM Users WHERE UserID = ?', [userId]);
      if (users.length === 0) return fail(res, 'User not found', 404);

      const isMatch = await bcrypt.compare(currentPassword, users[0].Password);
      if (!isMatch) return fail(res, 'Current password does not match', 401);

      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.execute('UPDATE Users SET Password = ? WHERE UserID = ?', [hashedPassword, userId]);
    }

    return ok(res, 'Profile updated successfully');
  } catch (err) {
    return fail(res, err.message, 500);
  }
});

module.exports = router;
