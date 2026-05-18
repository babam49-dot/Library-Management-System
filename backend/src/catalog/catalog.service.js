/**
 * catalog.service.js  –  Module 1: Catalog
 *
 * Written against the ACTUAL database schema:
 *   Books        : BookID, Title, ISBN, Year, Edition, Language, Description,
 *                  PublisherID, CategoryID, CoverImage, IsActive
 *   Authors      : AuthorID, Name, Bio, Nationality
 *   BookAuthors  : BookID, AuthorID
 *   Categories   : CategoryID, CategoryName, Description
 *   Publishers   : PublisherID, PublisherName, Address, ContactEmail, Phone
 *   BookCopies   : CopyID, BookID, BarcodeNumber, Status, ShelfLocation, AcquisitionDate
 *   BookAnnouncements : AnnouncementID, BookID, Note, CreatedAt
 *
 * Spec ↔ DB mappings kept transparent in comments where they differ.
 */
const pool = require('../db');

const ALLOWED_STATUSES = ['Available', 'Borrowed', 'Reserved_on_Shelf', 'Damaged', 'Disposed'];

// ─── internal helpers ─────────────────────────────────────────────────────────
const err = (status, message) => Object.assign(new Error(message), { status });

// ─── BOOKS ────────────────────────────────────────────────────────────────────

async function createBook(data) {
  // Spec uses PublishYear but actual column is "Year"
  const {
    Title, ISBN,
    Language, Edition,
    PublishYear,          // mapped → Year
    CategoryID, PublisherID,
    AuthorIDs,
    Note,                 // optional staff note → BookAnnouncements
  } = data;

  // Step 1 – required fields
  if (!Title || !ISBN || !CategoryID || !PublisherID)
    throw err(400, 'Title, ISBN, CategoryID and PublisherID are required.');
  if (!Array.isArray(AuthorIDs) || AuthorIDs.length === 0)
    throw err(400, 'AuthorIDs must be a non-empty array.');

  // Step 2 – unique ISBN
  const [[isbnRow]] = await pool.execute('SELECT BookID FROM Books WHERE ISBN = ?', [ISBN]);
  if (isbnRow) throw err(409, `ISBN "${ISBN}" already exists.`);

  // Step 3 – CategoryID exists
  const [[catRow]] = await pool.execute('SELECT CategoryID FROM Categories WHERE CategoryID = ?', [CategoryID]);
  if (!catRow) throw err(404, `CategoryID ${CategoryID} not found.`);

  // Step 4 – PublisherID exists
  const [[pubRow]] = await pool.execute('SELECT PublisherID FROM Publishers WHERE PublisherID = ?', [PublisherID]);
  if (!pubRow) throw err(404, `PublisherID ${PublisherID} not found.`);

  // Step 5 – all AuthorIDs exist
  for (const aid of AuthorIDs) {
    const [[aRow]] = await pool.execute('SELECT AuthorID FROM Authors WHERE AuthorID = ?', [aid]);
    if (!aRow) throw err(404, `AuthorID ${aid} not found.`);
  }

  // Step 6+7 – insert book & authors in a transaction
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO Books (Title, ISBN, Language, Edition, Year, CategoryID, PublisherID, IsActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [Title, ISBN, Language || null, Edition || null, PublishYear || null, CategoryID, PublisherID]
    );
    const bookId = result.insertId;

    for (const aid of AuthorIDs) {
      await connection.execute(
        'INSERT INTO BookAuthors (BookID, AuthorID) VALUES (?, ?)',
        [bookId, aid]
      );
    }

    // Optional new-arrival announcement
    if (Note) {
      await connection.execute(
        'INSERT INTO BookAnnouncements (BookID, Note, CreatedAt) VALUES (?, ?, NOW())',
        [bookId, Note]
      );
    }

    await connection.commit();
    return getBookById(bookId);
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

async function updateBook(id, data) {
  const [[book]] = await pool.execute('SELECT * FROM Books WHERE BookID = ?', [id]);
  if (!book) throw err(404, `Book ${id} not found.`);

  const { Title, ISBN, Language, Edition, PublishYear, CategoryID, PublisherID } = data;

  if (ISBN && ISBN !== book.ISBN) {
    const [[dup]] = await pool.execute('SELECT BookID FROM Books WHERE ISBN = ? AND BookID != ?', [ISBN, id]);
    if (dup) throw err(409, `ISBN "${ISBN}" already exists on another book.`);
  }
  if (CategoryID) {
    const [[c]] = await pool.execute('SELECT CategoryID FROM Categories WHERE CategoryID = ?', [CategoryID]);
    if (!c) throw err(404, `CategoryID ${CategoryID} not found.`);
  }
  if (PublisherID) {
    const [[p]] = await pool.execute('SELECT PublisherID FROM Publishers WHERE PublisherID = ?', [PublisherID]);
    if (!p) throw err(404, `PublisherID ${PublisherID} not found.`);
  }

  await pool.execute(
    `UPDATE Books SET
       Title       = COALESCE(?, Title),
       ISBN        = COALESCE(?, ISBN),
       Language    = COALESCE(?, Language),
       Edition     = COALESCE(?, Edition),
       Year        = COALESCE(?, Year),
       CategoryID  = COALESCE(?, CategoryID),
       PublisherID = COALESCE(?, PublisherID)
     WHERE BookID = ?`,
    [
      Title || null, ISBN || null, Language || null,
      Edition || null, PublishYear || null,
      CategoryID || null, PublisherID || null, id,
    ]
  );
  return getBookById(id);
}

async function deactivateBook(id) {
  const [[book]] = await pool.execute('SELECT * FROM Books WHERE BookID = ?', [id]);
  if (!book) throw err(404, `Book ${id} not found.`);

  const [[{ cnt }]] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM BookCopies WHERE BookID = ? AND Status NOT IN ('Disposed')`, [id]
  );
  if (cnt > 0)
    throw err(409, 'Cannot deactivate book with active copies. Dispose all copies first.');

  await pool.execute('UPDATE Books SET IsActive = 0 WHERE BookID = ?', [id]);
  return { BookID: parseInt(id), IsActive: false };
}

async function deleteBook(id) {
  const [[book]] = await pool.execute('SELECT * FROM Books WHERE BookID = ?', [id]);
  if (!book) throw err(404, `Book ${id} not found.`);

  const [[{ cnt }]] = await pool.execute(
    `SELECT COUNT(*) AS cnt FROM BookCopies WHERE BookID = ? AND Status NOT IN ('Disposed')`, [id]
  );
  if (cnt > 0) throw err(409, 'Cannot delete book with active copies.');

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM BookAuthors WHERE BookID = ?', [id]);
    await connection.execute('DELETE FROM BookAnnouncements WHERE BookID = ?', [id]);
    await connection.execute('DELETE FROM Books WHERE BookID = ?', [id]);
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

async function listBooks(filters) {
  const { title, author, isbn, categoryId, language } = filters || {};

  let sql = `
    SELECT
      b.BookID, b.Title, b.ISBN, b.Language, b.Edition, b.Year AS PublishYear,
      b.CategoryID, b.PublisherID, b.CoverImage,
      c.CategoryName, p.PublisherName,
      GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') AS Authors,
      COUNT(DISTINCT CASE WHEN bc.Status = 'Available' THEN bc.CopyID END) AS AvailableCopies,
      COUNT(DISTINCT bc.CopyID) AS TotalCopies,
      GROUP_CONCAT(DISTINCT CASE WHEN bc.Status = 'Available' THEN bc.CopyID END ORDER BY bc.CopyID SEPARATOR ',') AS AvailableCopyIds
    FROM Books b
    LEFT JOIN Categories c   ON c.CategoryID  = b.CategoryID
    LEFT JOIN Publishers p   ON p.PublisherID  = b.PublisherID
    LEFT JOIN BookAuthors ba ON ba.BookID      = b.BookID
    LEFT JOIN Authors a      ON a.AuthorID     = ba.AuthorID
    LEFT JOIN BookCopies bc  ON bc.BookID      = b.BookID
    WHERE b.IsActive = 1
  `;
  const params = [];

  if (title)      { sql += ' AND b.Title LIKE ?';      params.push(`%${title}%`); }
  if (isbn)       { sql += ' AND b.ISBN = ?';           params.push(isbn); }
  if (categoryId) { sql += ' AND b.CategoryID = ?';     params.push(categoryId); }
  if (language)   { sql += ' AND b.Language = ?';       params.push(language); }
  if (author) {
    sql += ' AND a.Name LIKE ?';
    params.push(`%${author}%`);
  }

  sql += ' GROUP BY b.BookID ORDER BY b.Title';

  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getBookById(id) {
  const [[book]] = await pool.execute(
    `SELECT b.*, b.Year AS PublishYear, c.CategoryName, p.PublisherName
     FROM Books b
     LEFT JOIN Categories c ON c.CategoryID = b.CategoryID
     LEFT JOIN Publishers p ON p.PublisherID = b.PublisherID
     WHERE b.BookID = ?`,
    [id]
  );
  if (!book) throw err(404, `Book ${id} not found.`);

  const [authors] = await pool.execute(
    `SELECT a.AuthorID, a.Name, a.Bio, a.Nationality
     FROM BookAuthors ba
     JOIN Authors a ON a.AuthorID = ba.AuthorID
     WHERE ba.BookID = ?`,
    [id]
  );

  const [[{ availableCopies }]] = await pool.execute(
    `SELECT COUNT(*) AS availableCopies FROM BookCopies
     WHERE BookID = ? AND Status = 'Available'`, [id]
  );

  const [copies] = await pool.execute(
    `SELECT CopyID, BarcodeNumber, Status, ShelfLocation
     FROM BookCopies
     WHERE BookID = ? AND Status != 'Disposed'`, [id]
  );

  return { ...book, authors, availableCopies, copies };
}

// ─── AUTHORS ─────────────────────────────────────────────────────────────────
// Actual Authors table has: AuthorID, Name, Bio, Nationality
// Spec uses FirstName/LastName – we map them into single Name field

async function createAuthor({ FirstName, LastName, Bio, Nationality }) {
  if (!FirstName || !LastName)
    throw err(400, 'FirstName and LastName are required.');

  const name = `${FirstName} ${LastName}`.trim();
  const [result] = await pool.execute(
    'INSERT INTO Authors (Name, Bio, Nationality) VALUES (?, ?, ?)',
    [name, Bio || null, Nationality || null]
  );
  const [[row]] = await pool.execute('SELECT * FROM Authors WHERE AuthorID = ?', [result.insertId]);
  return row;
}

async function updateAuthor(id, { FirstName, LastName, Bio, Nationality }) {
  const [[author]] = await pool.execute('SELECT * FROM Authors WHERE AuthorID = ?', [id]);
  if (!author) throw err(404, `Author ${id} not found.`);

  let newName = null;
  if (FirstName || LastName) {
    // Rebuild full name from existing parts + any updates
    const parts = author.Name.split(' ');
    const fn = FirstName || parts[0] || '';
    const ln = LastName  || parts.slice(1).join(' ') || '';
    newName = `${fn} ${ln}`.trim();
  }

  await pool.execute(
    `UPDATE Authors SET
       Name        = COALESCE(?, Name),
       Bio         = COALESCE(?, Bio),
       Nationality = COALESCE(?, Nationality)
     WHERE AuthorID = ?`,
    [newName, Bio !== undefined ? Bio : null, Nationality || null, id]
  );
  const [[row]] = await pool.execute('SELECT * FROM Authors WHERE AuthorID = ?', [id]);
  return row;
}

async function deleteAuthor(id) {
  const [[author]] = await pool.execute('SELECT * FROM Authors WHERE AuthorID = ?', [id]);
  if (!author) throw err(404, `Author ${id} not found.`);

  const [[{ cnt }]] = await pool.execute(
    'SELECT COUNT(*) AS cnt FROM BookAuthors WHERE AuthorID = ?', [id]
  );
  if (cnt > 0) throw err(409, 'Cannot delete author linked to existing books.');

  await pool.execute('DELETE FROM Authors WHERE AuthorID = ?', [id]);
}

async function listAuthors() {
  const [rows] = await pool.execute('SELECT * FROM Authors ORDER BY Name');
  return rows;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

async function createCategory({ CategoryName, Description }) {
  if (!CategoryName) throw err(400, 'CategoryName is required.');

  const [[dup]] = await pool.execute(
    'SELECT CategoryID FROM Categories WHERE CategoryName = ?', [CategoryName]
  );
  if (dup) throw err(409, `CategoryName "${CategoryName}" already exists.`);

  const [result] = await pool.execute(
    'INSERT INTO Categories (CategoryName, Description) VALUES (?, ?)',
    [CategoryName, Description || null]
  );
  const [[row]] = await pool.execute('SELECT * FROM Categories WHERE CategoryID = ?', [result.insertId]);
  return row;
}

async function updateCategory(id, { CategoryName, Description }) {
  const [[cat]] = await pool.execute('SELECT * FROM Categories WHERE CategoryID = ?', [id]);
  if (!cat) throw err(404, `Category ${id} not found.`);

  if (CategoryName && CategoryName !== cat.CategoryName) {
    const [[dup]] = await pool.execute(
      'SELECT CategoryID FROM Categories WHERE CategoryName = ? AND CategoryID != ?',
      [CategoryName, id]
    );
    if (dup) throw err(409, `CategoryName "${CategoryName}" already exists.`);
  }

  await pool.execute(
    `UPDATE Categories SET
       CategoryName = COALESCE(?, CategoryName),
       Description  = COALESCE(?, Description)
     WHERE CategoryID = ?`,
    [CategoryName || null, Description !== undefined ? Description : null, id]
  );
  const [[row]] = await pool.execute('SELECT * FROM Categories WHERE CategoryID = ?', [id]);
  return row;
}

async function listCategories() {
  const [rows] = await pool.execute('SELECT * FROM Categories ORDER BY CategoryName');
  return rows;
}

// ─── PUBLISHERS ──────────────────────────────────────────────────────────────
// Actual column: ContactEmail  (spec calls it Email)

async function createPublisher({ PublisherName, Email, Phone, Address }) {
  if (!PublisherName) throw err(400, 'PublisherName is required.');

  const [result] = await pool.execute(
    'INSERT INTO Publishers (PublisherName, ContactEmail, Phone, Address) VALUES (?, ?, ?, ?)',
    [PublisherName, Email || null, Phone || null, Address || null]
  );
  const [[row]] = await pool.execute('SELECT * FROM Publishers WHERE PublisherID = ?', [result.insertId]);
  return row;
}

async function updatePublisher(id, { PublisherName, Email, Phone, Address }) {
  const [[pub]] = await pool.execute('SELECT * FROM Publishers WHERE PublisherID = ?', [id]);
  if (!pub) throw err(404, `Publisher ${id} not found.`);

  await pool.execute(
    `UPDATE Publishers SET
       PublisherName = COALESCE(?, PublisherName),
       ContactEmail  = COALESCE(?, ContactEmail),
       Phone         = COALESCE(?, Phone),
       Address       = COALESCE(?, Address)
     WHERE PublisherID = ?`,
    [PublisherName || null, Email || null, Phone || null, Address || null, id]
  );
  const [[row]] = await pool.execute('SELECT * FROM Publishers WHERE PublisherID = ?', [id]);
  return row;
}

async function listPublishers() {
  const [rows] = await pool.execute('SELECT * FROM Publishers ORDER BY PublisherName');
  return rows;
}

// ─── BOOK COPIES ─────────────────────────────────────────────────────────────

async function createCopy(bookId, { BarcodeNumber, ShelfLocation }) {
  const [[book]] = await pool.execute(
    'SELECT BookID, IsActive FROM Books WHERE BookID = ?', [bookId]
  );
  if (!book || !book.IsActive)
    throw err(404, `Book ${bookId} not found or is inactive.`);

  let actualBarcode = BarcodeNumber;
  if (!actualBarcode) {
    const random4 = Math.floor(1000 + Math.random() * 9000);
    actualBarcode = `LIB-${bookId}-${Date.now().toString().slice(-4)}-${random4}`;
  }

  const [[dup]] = await pool.execute(
    'SELECT CopyID FROM BookCopies WHERE BarcodeNumber = ?', [actualBarcode]
  );
  if (dup) throw err(409, `BarcodeNumber "${actualBarcode}" already exists.`);

  const [result] = await pool.execute(
    `INSERT INTO BookCopies (BookID, BarcodeNumber, Status, ShelfLocation)
     VALUES (?, ?, 'Available', ?)`,
    [bookId, actualBarcode, ShelfLocation || null]
  );
  const [[row]] = await pool.execute('SELECT * FROM BookCopies WHERE CopyID = ?', [result.insertId]);
  return row;
}

/**
 * Exported for Module 3 & 4 – accepts optional DB connection for transactions.
 */
async function updateCopyStatus(copyId, newStatus, connection) {
  if (!ALLOWED_STATUSES.includes(newStatus))
    throw new Error('Invalid copy status');

  const db = connection || pool;
  const [[copy]] = await db.execute('SELECT * FROM BookCopies WHERE CopyID = ?', [copyId]);
  if (!copy) throw new Error('Copy not found');

  await db.execute('UPDATE BookCopies SET Status = ? WHERE CopyID = ?', [newStatus, copyId]);
  const [[updated]] = await db.execute('SELECT * FROM BookCopies WHERE CopyID = ?', [copyId]);
  return updated;
}

async function listCopiesForBook(bookId) {
  const [[book]] = await pool.execute('SELECT BookID FROM Books WHERE BookID = ?', [bookId]);
  if (!book) throw err(404, `Book ${bookId} not found.`);

  const [rows] = await pool.execute(
    `SELECT CopyID, BarcodeNumber, Status, ShelfLocation
     FROM BookCopies
     WHERE BookID = ? AND Status != 'Disposed'`,
    [bookId]
  );
  return rows;
}

// ─── PUBLIC: top 6 most borrowed ─────────────────────────────────────────────

async function getMostBorrowedBooks() {
  try {
    const [rows] = await pool.execute(`
      SELECT
        b.BookID, b.Title, b.ISBN, b.Language, b.Year AS PublishYear, b.CoverImage,
        c.CategoryName, p.PublisherName,
        GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') AS Authors,
        COUNT(DISTINCT CASE WHEN bc.Status = 'Available' THEN bc.CopyID END) AS AvailableCopies,
        COUNT(DISTINCT br.BorrowID)                                            AS BorrowCount
      FROM Books b
      LEFT JOIN Categories c        ON c.CategoryID  = b.CategoryID
      LEFT JOIN Publishers p        ON p.PublisherID  = b.PublisherID
      LEFT JOIN BookAuthors ba      ON ba.BookID      = b.BookID
      LEFT JOIN Authors a           ON a.AuthorID     = ba.AuthorID
      LEFT JOIN BookCopies bc       ON bc.BookID      = b.BookID
      LEFT JOIN BorrowingRecords br ON br.CopyID      = bc.CopyID
      WHERE b.IsActive = 1
      GROUP BY b.BookID
      ORDER BY BorrowCount DESC, b.BookID DESC
      LIMIT 6
    `);
    return rows;
  } catch (_) {
    // Fallback if BorrowingRecords doesn't exist yet
    const [rows] = await pool.execute(`
      SELECT
        b.BookID, b.Title, b.ISBN, b.Language, b.Year AS PublishYear, b.CoverImage,
        c.CategoryName, p.PublisherName,
        GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') AS Authors,
        COUNT(DISTINCT CASE WHEN bc.Status = 'Available' THEN bc.CopyID END) AS AvailableCopies,
        0 AS BorrowCount
      FROM Books b
      LEFT JOIN Categories c   ON c.CategoryID = b.CategoryID
      LEFT JOIN Publishers p   ON p.PublisherID = b.PublisherID
      LEFT JOIN BookAuthors ba ON ba.BookID     = b.BookID
      LEFT JOIN Authors a      ON a.AuthorID    = ba.AuthorID
      LEFT JOIN BookCopies bc  ON bc.BookID     = b.BookID
      WHERE b.IsActive = 1
      GROUP BY b.BookID
      ORDER BY b.BookID DESC
      LIMIT 6
    `);
    return rows;
  }
}

// ─── PUBLIC: latest staff announcements ──────────────────────────────────────

async function getLatestAnnouncements(limit = 5) {
  try {
    const [rows] = await pool.execute(
      `SELECT
         an.AnnouncementID, an.Note, an.CreatedAt,
         b.BookID, b.Title,
         GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') AS Authors
       FROM BookAnnouncements an
       JOIN Books b        ON b.BookID   = an.BookID
       LEFT JOIN BookAuthors ba ON ba.BookID = b.BookID
       LEFT JOIN Authors a      ON a.AuthorID = ba.AuthorID
       GROUP BY an.AnnouncementID
       ORDER BY an.CreatedAt DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  } catch (_) {
    return [];
  }
}

module.exports = {
  // books
  createBook, updateBook, deactivateBook, deleteBook, listBooks, getBookById,
  // authors
  createAuthor, updateAuthor, deleteAuthor, listAuthors,
  // categories
  createCategory, updateCategory, listCategories,
  // publishers
  createPublisher, updatePublisher, listPublishers,
  // copies
  createCopy, updateCopyStatus, listCopiesForBook,
  // public (no auth)
  getMostBorrowedBooks, getLatestAnnouncements,
};
