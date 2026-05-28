const svc = require('./catalog.service');
const pool = require('../db');

// ─── utility ──────────────────────────────────────────────────────────────────
const send = (res, status, success, payload) =>
  res.status(status).json(success ? { success: true, data: payload } : { success: false, message: payload });

const handleErr = (res, err) => {
  if (err && err.status) return send(res, err.status, false, err.message);
  console.error('[CatalogController]', err);
  return send(res, 500, false, 'Internal server error.');
};

// ─── BOOKS ───────────────────────────────────────────────────────────────────

exports.createBook = async (req, res) => {
  try { send(res, 201, true, await svc.createBook(req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.updateBook = async (req, res) => {
  try { send(res, 200, true, await svc.updateBook(req.params.id, req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.deactivateBook = async (req, res) => {
  try { send(res, 200, true, await svc.deactivateBook(req.params.id)); }
  catch (err) { handleErr(res, err); }
};

exports.deleteBook = async (req, res) => {
  try {
    await svc.deleteBook(req.params.id);
    send(res, 200, true, { message: 'Book deleted successfully.' });
  } catch (err) { handleErr(res, err); }
};

exports.listBooks = async (req, res) => {
  try { send(res, 200, true, await svc.listBooks(req.query)); }
  catch (err) { handleErr(res, err); }
};

exports.getBook = async (req, res) => {
  try { send(res, 200, true, await svc.getBookById(req.params.id)); }
  catch (err) { handleErr(res, err); }
};

// ─── AUTHORS ─────────────────────────────────────────────────────────────────

exports.createAuthor = async (req, res) => {
  try { send(res, 201, true, await svc.createAuthor(req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.updateAuthor = async (req, res) => {
  try { send(res, 200, true, await svc.updateAuthor(req.params.id, req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.deleteAuthor = async (req, res) => {
  try {
    await svc.deleteAuthor(req.params.id);
    send(res, 200, true, { message: 'Author deleted successfully.' });
  } catch (err) { handleErr(res, err); }
};

exports.listAuthors = async (req, res) => {
  try { send(res, 200, true, await svc.listAuthors()); }
  catch (err) { handleErr(res, err); }
};

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

exports.createCategory = async (req, res) => {
  try { send(res, 201, true, await svc.createCategory(req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.updateCategory = async (req, res) => {
  try { send(res, 200, true, await svc.updateCategory(req.params.id, req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.listCategories = async (req, res) => {
  try { send(res, 200, true, await svc.listCategories()); }
  catch (err) { handleErr(res, err); }
};

// ─── PUBLISHERS ──────────────────────────────────────────────────────────────

exports.createPublisher = async (req, res) => {
  try { send(res, 201, true, await svc.createPublisher(req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.updatePublisher = async (req, res) => {
  try { send(res, 200, true, await svc.updatePublisher(req.params.id, req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.listPublishers = async (req, res) => {
  try { send(res, 200, true, await svc.listPublishers()); }
  catch (err) { handleErr(res, err); }
};

// ─── BOOK COPIES ─────────────────────────────────────────────────────────────

exports.createCopy = async (req, res) => {
  try { send(res, 201, true, await svc.createCopy(req.params.id, req.body)); }
  catch (err) { handleErr(res, err); }
};

exports.updateCopyStatus = async (req, res) => {
  try {
    const { Status } = req.body;
    if (!Status) return send(res, 400, false, 'Status is required.');
    send(res, 200, true, await svc.updateCopyStatus(req.params.copyId, Status));
  } catch (err) {
    if (err.message === 'Invalid copy status') return send(res, 400, false, err.message);
    if (err.message === 'Copy not found') return send(res, 404, false, err.message);
    handleErr(res, err);
  }
};

exports.listCopies = async (req, res) => {
  try { send(res, 200, true, await svc.listCopiesForBook(req.params.id)); }
  catch (err) { handleErr(res, err); }
};

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

exports.getMostBorrowed = async (req, res) => {
  try { send(res, 200, true, await svc.getMostBorrowedBooks()); }
  catch (err) { handleErr(res, err); }
};

exports.getAnnouncements = async (req, res) => {
  try { send(res, 200, true, await svc.getLatestAnnouncements(5)); }
  catch (err) { handleErr(res, err); }
};

// ─── ISBN / BARCODE LOOKUP ────────────────────────────────────────────────────

exports.isbnLookup = async (req, res) => {
  const isbn = req.params.isbn.replace(/[^0-9X]/gi, '');
  if (!isbn || (isbn.length !== 10 && isbn.length !== 13)) {
    return send(res, 400, false, 'Invalid ISBN. Must be 10 or 13 digits.');
  }

  try {
    // ── 1. Try Open Library ────────────────────────────────────────────────
    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    let bookData = null;

    try {
      const olRes = await fetch(olUrl, { signal: AbortSignal.timeout(6000) });
      if (olRes.ok) {
        const olJson = await olRes.json();
        const key = `ISBN:${isbn}`;
        if (olJson[key]) {
          const b = olJson[key];
          bookData = {
            source: 'openlibrary',
            title:       b.title || '',
            isbn:        isbn,
            year:        b.publish_date ? parseInt(b.publish_date.slice(-4)) || '' : '',
            description: b.notes?.value || b.description?.value || '',
            language:    b.languages?.[0]?.key?.replace('/languages/', '') || 'English',
            edition:     b.edition_name || '',
            coverUrl:    b.cover?.large || b.cover?.medium || b.cover?.small || '',
            authors:     (b.authors || []).map(a => a.name).filter(Boolean),
            publisher:   b.publishers?.[0]?.name || '',
            subjects:    (b.subjects || []).slice(0, 3).map(s => s.name || s).filter(Boolean),
          };
        }
      }
    } catch (_) { /* timeout or network, fall through */ }

    // ── 2. Fallback to Google Books ────────────────────────────────────────
    if (!bookData) {
      try {
        const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;
        const gbRes = await fetch(gbUrl, { signal: AbortSignal.timeout(6000) });
        if (gbRes.ok) {
          const gbJson = await gbRes.json();
          const vol = gbJson.items?.[0]?.volumeInfo;
          if (vol) {
            bookData = {
              source:      'googlebooks',
              title:       vol.title || '',
              isbn:        isbn,
              year:        vol.publishedDate ? parseInt(vol.publishedDate.slice(0, 4)) || '' : '',
              description: vol.description || '',
              language:    vol.language || 'English',
              edition:     '',
              coverUrl:    vol.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
              authors:     vol.authors || [],
              publisher:   vol.publisher || '',
              subjects:    (vol.categories || []).slice(0, 3),
            };
          }
        }
      } catch (_) { /* give up */ }
    }

    if (!bookData) {
      return send(res, 404, false, `No book information found for ISBN ${isbn}. Please fill in the details manually.`);
    }

    // ── 3. Auto-register publisher, category, and authors if missing ──
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Publisher
      let publisherId = null;
      if (bookData.publisher) {
        const [[existingPub]] = await connection.execute(
          'SELECT PublisherID FROM Publishers WHERE PublisherName = ?',
          [bookData.publisher]
        );
        if (existingPub) {
          publisherId = existingPub.PublisherID;
        } else {
          const [pubRes] = await connection.execute(
            'INSERT INTO Publishers (PublisherName, Address, ContactEmail, Phone) VALUES (?, ?, ?, ?)',
            [bookData.publisher, 'Auto-registered via ISBN Lookup', '', '']
          );
          publisherId = pubRes.insertId;
        }
      }
      bookData.publisherId = publisherId;

      // 2. Category / Subject
      let categoryId = null;
      const categoryName = bookData.subjects?.[0] || 'General';
      const [[existingCat]] = await connection.execute(
        'SELECT CategoryID FROM Categories WHERE CategoryName = ?',
        [categoryName]
      );
      if (existingCat) {
        categoryId = existingCat.CategoryID;
      } else {
        const [catRes] = await connection.execute(
          'INSERT INTO Categories (CategoryName, Description) VALUES (?, ?)',
          [categoryName, 'Auto-registered via ISBN Lookup']
        );
        categoryId = catRes.insertId;
      }
      bookData.categoryId = categoryId;

      // 3. Authors
      const authorIds = [];
      if (Array.isArray(bookData.authors)) {
        for (const authorName of bookData.authors) {
          if (!authorName) continue;
          const [[existingAuth]] = await connection.execute(
            'SELECT AuthorID FROM Authors WHERE Name = ?',
            [authorName]
          );
          if (existingAuth) {
            authorIds.push(existingAuth.AuthorID);
          } else {
            const [authRes] = await connection.execute(
              'INSERT INTO Authors (Name, Bio, Nationality) VALUES (?, ?, ?)',
              [authorName, 'Auto-registered via ISBN Lookup', 'Unknown']
            );
            authorIds.push(authRes.insertId);
          }
        }
      }
      bookData.authorIds = authorIds;

      await connection.commit();
    } catch (dbErr) {
      await connection.rollback();
      console.error('[ISBN Auto-register Error]', dbErr);
    } finally {
      connection.release();
    }

    return send(res, 200, true, bookData);

  } catch (err) {
    handleErr(res, err);
  }
};

