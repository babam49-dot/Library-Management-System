const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message, data: null });

const auth = [authenticate, requireRole(3)];

// GET /api/member/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [memRows] = await pool.execute("SELECT MemberID FROM Members WHERE UserID=?", [req.user.userID]);
    if (!memRows.length) return fail(res, 'Member profile not found', 404);
    const memberId = memRows[0].MemberID;

    const [[borrows]] = await pool.execute("SELECT COUNT(*) as cnt FROM BorrowingRecords WHERE MemberID=? AND Status='borrowed'", [memberId]);
    const [[reservations]] = await pool.execute("SELECT COUNT(*) as cnt FROM Reservations WHERE MemberID=? AND Status='pending'", [memberId]);
    const [[fines]] = await pool.execute("SELECT COALESCE(SUM(Amount),0) as total FROM Fines WHERE UserID=? AND FineStatus='Unpaid'", [req.user.userID]);

    const [activeBorrows] = await pool.execute(
      `SELECT br.BorrowID, br.BorrowDate, br.DueDate, br.Status,
              b.Title, b.ISBN, bc.ShelfLocation, bc.CopyID
       FROM BorrowingRecords br
       JOIN BookCopies bc ON bc.CopyID = br.CopyID
       JOIN Books b ON b.BookID = bc.BookID
       WHERE br.MemberID=? AND br.Status='borrowed'
       ORDER BY br.DueDate ASC`,
      [memberId]
    );

    return ok(res, 'Member dashboard', {
      activeBorrowsCount: borrows.cnt,
      reservationsCount: reservations.cnt,
      unpaidFinesTotal: fines.total,
      activeBorrows
    });
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/member/books
router.get('/books', auth, async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT b.BookID, b.Title, b.ISBN, b.Year, b.Language, b.CoverImage,
             c.CategoryName, p.PublisherName,
             GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') as Authors,
             COUNT(DISTINCT CASE WHEN bc.Status='available' THEN bc.CopyID END) as AvailableCopies,
             COUNT(DISTINCT bc.CopyID) as TotalCopies
      FROM Books b
      LEFT JOIN Categories c ON c.CategoryID = b.CategoryID
      LEFT JOIN Publishers p ON p.PublisherID = b.PublisherID
      LEFT JOIN BookAuthors ba ON ba.BookID = b.BookID
      LEFT JOIN Authors a ON a.AuthorID = ba.AuthorID
      LEFT JOIN BookCopies bc ON bc.BookID = b.BookID
    `;
    const params = [];
    if (q) {
      sql += ` WHERE b.Title LIKE ? OR b.ISBN LIKE ? OR a.Name LIKE ? OR c.CategoryName LIKE ?`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    sql += ' GROUP BY b.BookID ORDER BY b.Title';
    const [rows] = await pool.execute(sql, params);
    return ok(res, 'Books list', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/member/my-borrowings
router.get('/my-borrowings', auth, async (req, res) => {
  try {
    const [memRows] = await pool.execute("SELECT MemberID FROM Members WHERE UserID=?", [req.user.userID]);
    if (!memRows.length) return fail(res, 'Member not found', 404);

    const [rows] = await pool.execute(
      `SELECT br.BorrowID, br.BorrowDate, br.DueDate, br.Status,
              b.Title, b.ISBN, bc.CopyID, bc.ShelfLocation,
              r.ReturnDate, r.Condition
       FROM BorrowingRecords br
       JOIN BookCopies bc ON bc.CopyID = br.CopyID
       JOIN Books b ON b.BookID = bc.BookID
       LEFT JOIN Returns r ON r.BorrowID = br.BorrowID
       WHERE br.MemberID=?
       ORDER BY br.BorrowDate DESC`,
      [memRows[0].MemberID]
    );
    return ok(res, 'My borrowings', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/member/my-reservations
router.get('/my-reservations', auth, async (req, res) => {
  try {
    const [memRows] = await pool.execute("SELECT MemberID FROM Members WHERE UserID=?", [req.user.userID]);
    if (!memRows.length) return fail(res, 'Member not found', 404);

    const [rows] = await pool.execute(
      `SELECT r.ResID, r.ReservationDate, r.Status, b.Title, b.BookID
       FROM Reservations r
       JOIN Books b ON b.BookID = r.BookID
       WHERE r.MemberID=?
       ORDER BY r.ReservationDate DESC`,
      [memRows[0].MemberID]
    );
    return ok(res, 'My reservations', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/member/reservations
router.post('/reservations', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return fail(res, 'bookId required');

    const [copies] = await pool.execute("SELECT CopyID FROM BookCopies WHERE BookID=? AND Status='available'", [bookId]);
    if (copies.length > 0) return fail(res, 'Copies are available — please borrow directly');

    const [memRows] = await pool.execute("SELECT MemberID FROM Members WHERE UserID=?", [req.user.userID]);
    if (!memRows.length) return fail(res, 'Member not found', 404);

    const [existing] = await pool.execute(
      "SELECT ResID FROM Reservations WHERE MemberID=? AND BookID=? AND Status='pending'",
      [memRows[0].MemberID, bookId]
    );
    if (existing.length) return fail(res, 'You already have a pending reservation for this book');

    await pool.execute(
      "INSERT INTO Reservations (MemberID, BookID, ReservationDate, Status) VALUES (?,?,NOW(),'pending')",
      [memRows[0].MemberID, bookId]
    );
    return ok(res, 'Reservation created successfully');
  } catch (err) { return fail(res, err.message, 500); }
});

// DELETE /api/member/reservations/:id
router.delete('/reservations/:id', auth, async (req, res) => {
  try {
    const [memRows] = await pool.execute("SELECT MemberID FROM Members WHERE UserID=?", [req.user.userID]);
    if (!memRows.length) return fail(res, 'Member not found', 404);
    await pool.execute("DELETE FROM Reservations WHERE ResID=? AND MemberID=?", [req.params.id, memRows[0].MemberID]);
    return ok(res, 'Reservation cancelled');
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/member/my-fines
router.get('/my-fines', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT f.FineID, f.Amount, f.IssuedDate, f.FineStatus, ft.TypeName, ft.Description,
              b.Title as BookTitle
       FROM Fines f
       LEFT JOIN FineTypes ft ON ft.TypeID = f.TypeID
       LEFT JOIN BorrowingRecords br ON br.BorrowID = f.BorrowID
       LEFT JOIN BookCopies bc ON bc.CopyID = br.CopyID
       LEFT JOIN Books b ON b.BookID = bc.BookID
       WHERE f.UserID=?
       ORDER BY f.IssuedDate DESC`,
      [req.user.userID]
    );
    return ok(res, 'My fines', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/member/my-profile
router.get('/my-profile', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.UserID, u.FirstName, u.LastName, u.FullName, u.Email, u.Phone, u.UniversityID, u.Status,
              m.MemberID, m.StudentID, m.Department, m.RegistrationDate, m.MaxBooksAllowed
       FROM Users u
       LEFT JOIN Members m ON m.UserID = u.UserID
       WHERE u.UserID=?`,
      [req.user.userID]
    );
    if (!rows.length) return fail(res, 'Profile not found', 404);
    return ok(res, 'Profile', rows[0]);
  } catch (err) { return fail(res, err.message, 500); }
});

module.exports = router;
