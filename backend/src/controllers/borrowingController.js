const db = require('../db');
const { generateRequestCode } = require('../utils/requestCodeGenerator');
const { validateDebtCheck, validateQuantityCheck } = require('../utils/borrowingValidator');

// Helper to get connection for transactions
const getConnection = async () => await db.getConnection();

exports.submitRequest = async (req, res) => {
  const { copyIds } = req.body;
  const memberId = req.user.extensionId;

  if (!copyIds || !Array.isArray(copyIds) || copyIds.length === 0) {
    return res.status(400).json({ success: false, message: "copyIds must be a non-empty array" });
  }

  let conn;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // STEP 1 — Pre-request validation
    const debtCheck = await validateDebtCheck(memberId, conn);
    if (!debtCheck.passed) {
      await conn.rollback();
      return res.status(403).json(debtCheck);
    }

    const qtyCheck = await validateQuantityCheck(memberId, copyIds.length, conn);
    if (!qtyCheck.passed) {
      await conn.rollback();
      return res.status(400).json(qtyCheck);
    }

    // Check for duplicate active BorrowingRecords
    const [existing] = await conn.query(`
      SELECT CopyID FROM BorrowingRecords
      WHERE MemberID = ? AND CopyID IN (?) AND Status IN ('Pending', 'Borrowed')
    `, [memberId, copyIds]);
    
    if (existing.length > 0) {
      await conn.rollback();
      return res.status(400).json({ 
        success: false, 
        message: "You already have an active request or borrow for one or more of these copies.",
        code: "DUPLICATE_BORROW"
      });
    }

    // STEP 2 — Generate RequestCode
    const requestCode = await generateRequestCode(conn);

    // STEP 3 — Evaluate each copyId independently
    const pending = [];
    const queued = [];
    const skipped = [];

    for (const copyId of copyIds) {
      // Lock row
      const [copies] = await conn.query('SELECT Status, BookID FROM BookCopies WHERE CopyID = ? FOR UPDATE', [copyId]);
      
      if (copies.length === 0) {
        skipped.push({ copyId, reason: "Copy not found" });
        continue;
      }

      const copyStatus = copies[0].Status;
      const bookId = copies[0].BookID;

      // Get Book Info for response
      const [books] = await conn.query('SELECT Title, ShelfLocation FROM Books WHERE BookID = ?', [bookId]);
      const bookTitle = books[0]?.Title || 'Unknown';
      const shelfLocation = books[0]?.ShelfLocation || 'Unknown';

      if (copyStatus === 'Available') {
        // Rule A
        await conn.query(`
          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `, [memberId, copyId, requestCode]);

        await conn.query(`UPDATE BookCopies SET Status = 'Reserved_on_Shelf' WHERE CopyID = ?`, [copyId]);

        pending.push({ copyId, bookTitle, shelfLocation, status: 'Pending' });

      } else if (copyStatus === 'Borrowed' || copyStatus === 'Reserved_on_Shelf') {
        // Rule B
        const [prioRows] = await conn.query(`
          SELECT MAX(Priority) as maxPrio FROM Reservations
          WHERE CopyID = ? AND Status = 'Queued'
        `, [copyId]);
        
        const nextPriority = (prioRows[0].maxPrio || 0) + 1;

        await conn.query(`
          INSERT INTO Reservations (MemberID, CopyID, RequestCode, Status, Priority, ReservationDate)
          VALUES (?, ?, ?, 'Queued', ?, NOW())
        `, [memberId, copyId, requestCode, nextPriority]);

        queued.push({ copyId, bookTitle, status: 'Queued', queuePosition: nextPriority });

      } else {
        // Rule C
        skipped.push({ copyId, bookTitle, reason: \`Copy is \${copyStatus}\` });
      }
    }

    await conn.commit();

    res.json({
      success: true,
      data: {
        requestCode,
        pickupDeadline: pending.length > 0 ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
        pending,
        queued,
        skipped,
        message: pending.length > 0 
          ? \`Your request has been submitted. Present code \${requestCode} at the desk.\`
          : \`Your request has been queued. Code: \${requestCode}\`
      }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    console.error("Borrow Request Error:", err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.getSession = async (req, res) => {
  try {
    const { code } = req.params;
    
    // Check BorrowingRecords
    const [rows] = await db.query(`
      SELECT 
        br.BorrowID as borrowId, br.CopyID as copyId, br.Status as status, 
        br.PickupDeadline as pickupDeadline, br.DueDate as dueDate, br.ReturnDate as returnDate,
        b.Title as bookTitle, b.ISBN as isbn, b.ShelfLocation as shelfLocation,
        m.MemberID as memberID, u.FullName as fullName, u.Email as email, m.UniversityID as studentID
      FROM BorrowingRecords br
      JOIN Members m ON br.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
      JOIN BookCopies bc ON br.CopyID = bc.CopyID
      JOIN Books b ON bc.BookID = b.BookID
      WHERE br.RequestCode = ?
    `, [code]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const member = {
      memberID: rows[0].memberID,
      fullName: rows[0].fullName,
      email: rows[0].email,
      studentID: rows[0].studentID
    };

    const sessionRows = rows.map(r => {
      const isPending = r.status === 'Pending';
      const isNotExpired = !r.pickupDeadline || new Date(r.pickupDeadline) > new Date();
      return {
        borrowId: r.borrowId,
        copyId: r.copyId,
        bookTitle: r.bookTitle,
        isbn: r.isbn,
        shelfLocation: r.shelfLocation,
        status: r.status,
        pickupDeadline: r.pickupDeadline,
        dueDate: r.dueDate,
        returnDate: r.returnDate,
        eligibleForConfirmation: isPending && isNotExpired
      };
    });

    res.json({
      success: true,
      data: {
        requestCode: code,
        member,
        rows: sessionRows
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.confirmCollection = async (req, res) => {
  const { code } = req.params;
  const { borrowIds, loanPeriodDays = 14 } = req.body;
  const staffId = req.user.extensionId;

  if (!borrowIds || !Array.isArray(borrowIds) || borrowIds.length === 0) {
    return res.status(400).json({ success: false, message: "No borrowIds provided" });
  }

  let conn;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    const confirmed = [];
    const expired = [];

    for (const bid of borrowIds) {
      const [rows] = await conn.query(`
        SELECT CopyID, Status, PickupDeadline, RequestCode FROM BorrowingRecords
        WHERE BorrowID = ? FOR UPDATE
      `, [bid]);

      if (rows.length === 0) continue;
      
      const record = rows[0];
      
      if (record.RequestCode !== code || record.Status !== 'Pending') {
        continue;
      }

      if (record.PickupDeadline && new Date(record.PickupDeadline) < new Date()) {
        expired.push({ borrowId: bid, copyId: record.CopyID });
        continue;
      }

      // Valid - confirm it
      await conn.query(`
        UPDATE BorrowingRecords SET
          Status = 'Borrowed',
          DueDate = DATE_ADD(CURDATE(), INTERVAL ? DAY),
          ProcessedByStaffID = ?
        WHERE BorrowID = ?
      `, [loanPeriodDays, staffId, bid]);

      await conn.query(`
        UPDATE BookCopies SET Status = 'Borrowed'
        WHERE CopyID = ?
      `, [record.CopyID]);

      confirmed.push({ borrowId: bid, copyId: record.CopyID, dueDate: new Date(Date.now() + loanPeriodDays * 24*60*60*1000).toISOString() });
    }

    await conn.commit();

    res.json({
      success: true,
      data: {
        confirmed,
        expired,
        message: \`\${confirmed.length} books confirmed.\`
      }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.processReturn = async (req, res) => {
  const { borrowId, conditionOnReturn, notes } = req.body;
  const staffId = req.user.extensionId;

  if (!conditionOnReturn) {
    return res.status(400).json({ success: false, message: "conditionOnReturn is mandatory" });
  }

  let conn;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // 1. Fetch BorrowingRecord
    const [bRows] = await conn.query(`
      SELECT CopyID, Status FROM BorrowingRecords WHERE BorrowID = ? FOR UPDATE
    `, [borrowId]);

    if (bRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Borrow record not found" });
    }

    const record = bRows[0];
    if (!['Borrowed', 'Overdue'].includes(record.Status)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: \`Cannot return record with status \${record.Status}\` });
    }

    // 2. Update BorrowingRecords
    await conn.query(`
      UPDATE BorrowingRecords SET
        Status = 'Returned',
        ReturnDate = NOW()
      WHERE BorrowID = ?
    `, [borrowId]);

    // 3. Insert Return
    const [retRes] = await conn.query(`
      INSERT INTO Returns (BorrowID, ReturnDate, ConditionOnReturn, Notes, ProcessedByStaffID)
      VALUES (?, NOW(), ?, ?, ?)
    `, [borrowId, conditionOnReturn, notes, staffId]);

    const returnId = retRes.insertId;

    // 4. Handle copy status
    let copyNewStatus = 'Available';
    if (conditionOnReturn === 'Major') copyNewStatus = 'Damaged';
    else if (conditionOnReturn === 'Total Loss') copyNewStatus = 'Disposed';

    await conn.query(`UPDATE BookCopies SET Status = ? WHERE CopyID = ?`, [copyNewStatus, record.CopyID]);

    let nextMemberNotified = false;

    // 5. Check Reservations queue if copy is Available
    if (copyNewStatus === 'Available') {
      const [resRows] = await conn.query(`
        SELECT ReservationID, MemberID, RequestCode FROM Reservations
        WHERE CopyID = ? AND Status = 'Queued'
        ORDER BY Priority ASC, ReservationDate ASC LIMIT 1 FOR UPDATE
      `, [record.CopyID]);

      if (resRows.length > 0) {
        const nextRes = resRows[0];
        
        // a. INSERT new BorrowingRecords row
        await conn.query(`
          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `, [nextRes.MemberID, record.CopyID, nextRes.RequestCode]);

        // b. UPDATE BookCopies
        await conn.query(`UPDATE BookCopies SET Status = 'Reserved_on_Shelf' WHERE CopyID = ?`, [record.CopyID]);
        copyNewStatus = 'Reserved_on_Shelf';

        // c. UPDATE Reservations
        await conn.query(`
          UPDATE Reservations SET Status = 'Ready', PickupDeadline = DATE_ADD(NOW(), INTERVAL 24 HOUR)
          WHERE ReservationID = ?
        `, [nextRes.ReservationID]);

        console.log(\`[QUEUE] Copy \${record.CopyID} now ready for MemberID \${nextRes.MemberID}\`);
        nextMemberNotified = true;
      }
    }

    await conn.commit();

    res.json({
      success: true,
      data: {
        returnId, borrowId, conditionOnReturn, copyNewStatus, nextMemberNotified,
        message: "Return processed successfully."
      }
    });

  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
};

exports.getMyBorrows = async (req, res) => {
  try {
    const memberId = req.user.extensionId;
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = \`
      SELECT 
        br.BorrowID as borrowId, br.RequestCode as requestCode, br.CopyID as copyId,
        b.Title as bookTitle, b.ISBN as isbn, b.CoverImage as coverImage,
        br.BorrowDate as borrowDate, br.DueDate as dueDate, br.ReturnDate as returnDate,
        br.Status as status, br.PickupDeadline as pickupDeadline,
        IF(br.DueDate < CURDATE() AND br.Status = 'Borrowed', true, false) as isOverdue,
        IF(br.DueDate < CURDATE() AND br.Status = 'Borrowed', DATEDIFF(CURDATE(), br.DueDate), 0) as daysOverdue
      FROM BorrowingRecords br
      JOIN BookCopies bc ON br.CopyID = bc.CopyID
      JOIN Books b ON bc.BookID = b.BookID
      WHERE br.MemberID = ?
    \`;
    const params = [memberId];

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      query += \` AND br.Status IN (?)\`;
      params.push(statuses);
    }

    query += \` ORDER BY br.BorrowDate DESC LIMIT ? OFFSET ?\`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await db.query(query, params);

    // Count
    let countQ = 'SELECT COUNT(*) as total FROM BorrowingRecords WHERE MemberID = ?';
    const cParams = [memberId];
    if (status) {
      countQ += ' AND Status IN (?)';
      cParams.push(status.split(',').map(s => s.trim()));
    }
    const [countRows] = await db.query(countQ, cParams);
    const total = countRows[0].total;

    res.json({
      success: true,
      data: {
        records: rows,
        total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total/limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getActiveCount = async (req, res) => {
  try {
    const memberId = req.user.extensionId;
    const [bRows] = await db.query(`
      SELECT COUNT(*) as c FROM BorrowingRecords WHERE MemberID = ? AND Status IN ('Pending', 'Borrowed')
    `, [memberId]);
    const activeBorrows = bRows[0].c;

    const [mRows] = await db.query('SELECT MaxBooksAllowed FROM Members WHERE MemberID = ?', [memberId]);
    const maxAllowed = mRows[0]?.MaxBooksAllowed || 5;

    res.json({
      success: true,
      data: { activeBorrows, maxAllowed, canBorrowMore: activeBorrows < maxAllowed }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOverdue = async (req, res) => {
  try {
    const { memberId, fromDate, toDate } = req.query;
    
    let query = \`
      SELECT 
        br.BorrowID as borrowId, br.RequestCode as requestCode,
        m.MemberID as memberID, u.FullName as fullName, u.Email as email, m.UniversityID as studentID,
        b.Title as bookTitle, b.ISBN as isbn,
        br.CopyID as copyId, br.BorrowDate as borrowDate, br.DueDate as dueDate,
        DATEDIFF(CURDATE(), br.DueDate) as daysOverdue,
        (DATEDIFF(CURDATE(), br.DueDate) * 5.00) as estimatedFine
      FROM BorrowingRecords br
      JOIN Members m ON br.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
      JOIN BookCopies bc ON br.CopyID = bc.CopyID
      JOIN Books b ON bc.BookID = b.BookID
      WHERE br.Status = 'Overdue'
    \`;
    const params = [];

    if (memberId) { query += ' AND m.MemberID = ?'; params.push(memberId); }
    if (fromDate) { query += ' AND br.DueDate >= ?'; params.push(fromDate); }
    if (toDate) { query += ' AND br.DueDate <= ?'; params.push(toDate); }

    query += ' ORDER BY daysOverdue DESC';

    const [rows] = await db.query(query, params);
    
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const { status, limit = 50, sort } = req.query;

    let query = \`
      SELECT 
        br.RequestCode as requestCode,
        u.FullName as memberName, u.Email as memberEmail,
        COUNT(br.CopyID) as totalCopies,
        SUM(IF(br.Status = 'Pending', 1, 0)) as pendingCount,
        SUM(IF(br.Status = 'Borrowed', 1, 0)) as borrowedCount,
        SUM(IF(br.Status = 'Returned', 1, 0)) as returnedCount,
        SUM(IF(br.Status = 'Overdue', 1, 0)) as overdueCount,
        MIN(br.BorrowDate) as borrowDate,
        MAX(br.DueDate) as latestDueDate
      FROM BorrowingRecords br
      JOIN Members m ON br.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
    \`;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(\`br.Status = ?\`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY br.RequestCode, u.FullName, u.Email';

    if (sort === 'recent') {
      query += ' ORDER BY borrowDate DESC';
    }

    query += ' LIMIT ?';
    params.push(parseInt(limit));

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.cancelRequest = async (req, res) => {
  const { code } = req.params;
  const memberId = req.user.extensionId;

  let conn;
  try {
    conn = await getConnection();
    await conn.beginTransaction();

    // Verify all rows under this code are Pending
    const [rows] = await conn.query(`
      SELECT BorrowID, CopyID, Status, MemberID FROM BorrowingRecords
      WHERE RequestCode = ? FOR UPDATE
    `, [code]);

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Auth check
    if (rows[0].MemberID !== memberId) {
      await conn.rollback();
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    for (const r of rows) {
      if (r.Status !== 'Pending') {
        await conn.rollback();
        return res.status(400).json({ success: false, message: "Cannot cancel - some books are not pending." });
      }
    }

    // Perform cancel
    for (const r of rows) {
      await conn.query(`UPDATE BorrowingRecords SET Status = 'Expired' WHERE BorrowID = ?`, [r.BorrowID]);
      await conn.query(`UPDATE BookCopies SET Status = 'Available' WHERE CopyID = ?`, [r.CopyID]);

      // Check queue
      const [resRows] = await conn.query(`
        SELECT ReservationID, MemberID, RequestCode FROM Reservations
        WHERE CopyID = ? AND Status = 'Queued'
        ORDER BY Priority ASC, ReservationDate ASC LIMIT 1 FOR UPDATE
      `, [r.CopyID]);

      if (resRows.length > 0) {
        const nextRes = resRows[0];
        await conn.query(`
          INSERT INTO BorrowingRecords (MemberID, CopyID, RequestCode, BorrowDate, Status, PickupDeadline)
          VALUES (?, ?, ?, CURDATE(), 'Pending', DATE_ADD(NOW(), INTERVAL 24 HOUR))
        `, [nextRes.MemberID, r.CopyID, nextRes.RequestCode]);
        await conn.query(`UPDATE BookCopies SET Status = 'Reserved_on_Shelf' WHERE CopyID = ?`, [r.CopyID]);
        await conn.query(`UPDATE Reservations SET Status = 'Ready', PickupDeadline = DATE_ADD(NOW(), INTERVAL 24 HOUR) WHERE ReservationID = ?`, [nextRes.ReservationID]);
      }
    }

    await conn.commit();
    res.json({ success: true, message: "Request cancelled successfully" });

  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (conn) conn.release();
  }
};
