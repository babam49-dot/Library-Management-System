const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const ok = (res, message, data = null) => res.json({ success: true, message, data });
const fail = (res, message, status = 400) => res.status(status).json({ success: false, message, data: null });

const auth = [authenticate, requireRole(1, 2)];

// GET /api/books/categories
router.get('/categories', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Categories ORDER BY CategoryName');
    return ok(res, 'Categories', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/books/categories
router.post('/categories', auth, async (req, res) => {
  try {
    const { categoryName, description } = req.body;
    if (!categoryName) return fail(res, 'categoryName required');
    const [r] = await pool.execute('INSERT INTO Categories (CategoryName, Description) VALUES (?,?)', [categoryName, description || '']);
    return ok(res, 'Category added', { CategoryID: r.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/books/authors
router.get('/authors', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Authors ORDER BY Name');
    return ok(res, 'Authors', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/books/authors
router.post('/authors', auth, async (req, res) => {
  try {
    const { name, bio, nationality } = req.body;
    if (!name) return fail(res, 'name required');
    const [r] = await pool.execute('INSERT INTO Authors (Name, Bio, Nationality) VALUES (?,?,?)', [name, bio || '', nationality || '']);
    return ok(res, 'Author added', { AuthorID: r.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/books/publishers
router.get('/publishers', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM Publishers ORDER BY PublisherName');
    return ok(res, 'Publishers', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/books/publishers
router.post('/publishers', auth, async (req, res) => {
  try {
    const { publisherName, address, contactEmail, phone } = req.body;
    if (!publisherName) return fail(res, 'publisherName required');
    const [r] = await pool.execute(
      'INSERT INTO Publishers (PublisherName, Address, ContactEmail, Phone) VALUES (?,?,?,?)',
      [publisherName, address || '', contactEmail || '', phone || '']
    );
    return ok(res, 'Publisher added', { PublisherID: r.insertId });
  } catch (err) { return fail(res, err.message, 500); }
});

// GET /api/books - all books
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.BookID, b.Title, b.ISBN, b.Year, b.Edition, b.Language, b.Description, b.CoverImage,
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
       GROUP BY b.BookID
       ORDER BY b.Title`
    );
    return ok(res, 'All books', rows);
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/books - add book
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.post('/', auth, upload.single('coverImage'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { title, isbn, year, edition, language, description, publisherId, categoryId, authorIds, numberOfCopies, shelfLocation } = req.body;
    if (!title) {
      await connection.rollback();
      return fail(res, 'title required');
    }

    let coverImagePath = null;
    if (req.file) {
      coverImagePath = '/uploads/' + req.file.filename;
    } else if (req.body.coverImage) {
      coverImagePath = req.body.coverImage;
    }

    const [[mBook]] = await connection.execute("SELECT MAX(BookID) as m FROM Books");
    const bookId = (mBook.m || 0) + 1;

    await connection.execute(
      'INSERT INTO Books (BookID, Title, ISBN, Year, Edition, Language, Description, PublisherID, CategoryID, CoverImage) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [bookId, title, isbn || null, year || null, edition || null, language || 'English', description || '', publisherId || null, categoryId || null, coverImagePath]
    );

    if (authorIds) {
      let authors = [];
      try { authors = Array.isArray(authorIds) ? authorIds : JSON.parse(authorIds); } catch(e) {}
      for (const aid of authors) {
        await connection.execute('INSERT IGNORE INTO BookAuthors (BookID, AuthorID) VALUES (?,?)', [bookId, aid]);
      }
    }

    if (numberOfCopies && parseInt(numberOfCopies) > 0) {
      const num = parseInt(numberOfCopies);
      const shelf = shelfLocation || 'General Stack';
      for (let i = 0; i < num; i++) {
        await connection.execute(
          'INSERT INTO BookCopies (BookID, Status, ShelfLocation, AcquisitionDate) VALUES (?,?,?,CURDATE())',
          [bookId, 'Available', shelf]
        );
      }
    }

    await connection.commit();
    return ok(res, 'Book added successfully', { BookID: bookId, CoverImage: coverImagePath });
  } catch (err) { 
    await connection.rollback();
    return fail(res, err.message, 500); 
  } finally {
    connection.release();
  }
});

// GET /api/books/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [books] = await pool.execute(
      `SELECT b.*, c.CategoryName, p.PublisherName,
              GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') as Authors
       FROM Books b
       LEFT JOIN Categories c ON c.CategoryID = b.CategoryID
       LEFT JOIN Publishers p ON p.PublisherID = b.PublisherID
       LEFT JOIN BookAuthors ba ON ba.BookID = b.BookID
       LEFT JOIN Authors a ON a.AuthorID = ba.AuthorID
       WHERE b.BookID=?
       GROUP BY b.BookID`,
      [req.params.id]
    );
    if (!books.length) return fail(res, 'Book not found', 404);

    const [copies] = await pool.execute(
      "SELECT CopyID, Status, ShelfLocation, AcquisitionDate FROM BookCopies WHERE BookID=?", [req.params.id]
    );
    return ok(res, 'Book details', { ...books[0], copies });
  } catch (err) { return fail(res, err.message, 500); }
});

// PUT /api/books/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, isbn, year, edition, language, description, publisherId, categoryId } = req.body;
    await pool.execute(
      'UPDATE Books SET Title=?, ISBN=?, Year=?, Edition=?, Language=?, Description=?, PublisherID=?, CategoryID=? WHERE BookID=?',
      [title, isbn || null, year || null, edition || null, language || 'English', description || '', publisherId || null, categoryId || null, req.params.id]
    );
    return ok(res, 'Book updated');
  } catch (err) { return fail(res, err.message, 500); }
});

// DELETE /api/books/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.execute('DELETE FROM Books WHERE BookID=?', [req.params.id]);
    return ok(res, 'Book deleted');
  } catch (err) { return fail(res, err.message, 500); }
});

// POST /api/books/:id/authors
router.post('/:id/authors', auth, async (req, res) => {
  try {
    const { authorId } = req.body;
    if (!authorId) return fail(res, 'authorId required');
    await pool.execute('INSERT IGNORE INTO BookAuthors (BookID, AuthorID) VALUES (?,?)', [req.params.id, authorId]);
    return ok(res, 'Author linked to book');
  } catch (err) { return fail(res, err.message, 500); }
});

module.exports = router;
