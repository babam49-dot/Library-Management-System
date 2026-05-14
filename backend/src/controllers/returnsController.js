const db = require('../db');

exports.getAllReturns = async (req, res) => {
  try {
    const { condition, staffId, fromDate, toDate } = req.query;
    
    let query = \`
      SELECT 
        rt.ReturnID as returnId, rt.ReturnDate as returnDate, 
        rt.ConditionOnReturn as conditionOnReturn, rt.Notes as notes,
        br.BorrowID as borrowId, br.RequestCode as requestCode,
        m.MemberID as memberID, u.FullName as memberName,
        b.Title as bookTitle, b.ISBN as isbn,
        bc.CopyID as copyId,
        s.StaffID as processedByStaffID, su.FullName as processedByStaffName
      FROM Returns rt
      JOIN BorrowingRecords br ON rt.BorrowID = br.BorrowID
      JOIN Members m ON br.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
      JOIN BookCopies bc ON br.CopyID = bc.CopyID
      JOIN Books b ON bc.BookID = b.BookID
      JOIN Staff s ON rt.ProcessedByStaffID = s.StaffID
      JOIN Users su ON s.UserID = su.UserID
    \`;
    const params = [];
    const conditions = [];

    if (condition) { conditions.push('rt.ConditionOnReturn = ?'); params.push(condition); }
    if (staffId) { conditions.push('rt.ProcessedByStaffID = ?'); params.push(staffId); }
    if (fromDate) { conditions.push('rt.ReturnDate >= ?'); params.push(fromDate); }
    if (toDate) { conditions.push('rt.ReturnDate <= ?'); params.push(toDate); }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY rt.ReturnDate DESC';

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getReturnById = async (req, res) => {
  try {
    const { returnId } = req.params;
    const [rows] = await db.query('SELECT * FROM Returns WHERE ReturnID = ?', [returnId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Return not found" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getReturnByBorrowId = async (req, res) => {
  try {
    const { borrowId } = req.params;
    const [rows] = await db.query('SELECT * FROM Returns WHERE BorrowID = ?', [borrowId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Return not found for this borrow record" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
