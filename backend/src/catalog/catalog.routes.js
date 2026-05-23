const express = require('express');
const router  = express.Router();
const ctrl    = require('./catalog.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Role guards
// roleID 1 = Admin, 2 = Staff, 3 = Member
const adminOnly     = [authenticate, requireRole(1)];
const staffOrAdmin  = [authenticate, requireRole(1, 2)];
const authenticated = [authenticate];            // any logged-in user

// ─── PUBLIC (no auth) ─────────────────────────────────────────────────────────
// These two are mounted directly on /api/public via index.js
// but we expose them here too so the catalog module is self-contained.
// index.js will mount this router at /api/catalog.

// ─── BOOKS ────────────────────────────────────────────────────────────────────

router.get(   '/books',                  authenticated,  ctrl.listBooks);
router.get(   '/books/:id',              authenticated,  ctrl.getBook);
router.post(  '/books',                  staffOrAdmin,   ctrl.createBook);
router.put(   '/books/:id',              staffOrAdmin,   ctrl.updateBook);
router.patch( '/books/:id/deactivate',   staffOrAdmin,   ctrl.deactivateBook);
router.delete('/books/:id',              adminOnly,      ctrl.deleteBook);

// ─── BOOK COPIES ─────────────────────────────────────────────────────────────

router.get(  '/books/:id/copies',        authenticated,  ctrl.listCopies);
router.post( '/books/:id/copies',        staffOrAdmin,   ctrl.createCopy);
router.patch('/copies/:copyId/status',   staffOrAdmin,   ctrl.updateCopyStatus);

// ─── AUTHORS ─────────────────────────────────────────────────────────────────

router.get(   '/authors',      authenticated, ctrl.listAuthors);
router.post(  '/authors',      staffOrAdmin,  ctrl.createAuthor);
router.put(   '/authors/:id',  staffOrAdmin,  ctrl.updateAuthor);
router.delete('/authors/:id',  staffOrAdmin,  ctrl.deleteAuthor);

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

router.get( '/categories',      authenticated, ctrl.listCategories);
router.post('/categories',      staffOrAdmin,  ctrl.createCategory);
router.put( '/categories/:id',  staffOrAdmin,  ctrl.updateCategory);

// ─── PUBLISHERS ──────────────────────────────────────────────────────────────

router.get( '/publishers',      authenticated, ctrl.listPublishers);
router.post('/publishers',      staffOrAdmin,  ctrl.createPublisher);
router.put( '/publishers/:id',  staffOrAdmin,  ctrl.updatePublisher);

// ─── ISBN / BARCODE LOOKUP ────────────────────────────────────────────────────
router.get('/isbn-lookup/:isbn', staffOrAdmin, ctrl.isbnLookup);

module.exports = router;
