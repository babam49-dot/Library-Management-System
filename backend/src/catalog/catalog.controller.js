const svc = require('./catalog.service');

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
