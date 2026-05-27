const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/borrowingController');
const { authenticate, requireRole } = require('../middleware/auth');

// Role guards
const borrowers = [authenticate, requireRole(1, 2, 3)];
const staffOrAdmin = [authenticate, requireRole(1, 2)];

// MEMBER / STAFF / ADMIN BORROWING ROUTES
router.post('/request', borrowers, ctrl.submitRequest);
router.get('/my', borrowers, ctrl.getMyBorrows);
router.get('/my/active-count', borrowers, ctrl.getActiveCount);
router.delete('/request/:code', borrowers, ctrl.cancelRequest);

// STAFF / ADMIN DESK ROUTES
router.get('/session/:code', staffOrAdmin, ctrl.getSession);
router.post('/confirm/:code', staffOrAdmin, ctrl.confirmCollection);
router.post('/return', staffOrAdmin, ctrl.processReturn);
router.get('/overdue', staffOrAdmin, ctrl.getOverdue);
router.get('/sessions', staffOrAdmin, ctrl.getSessions);

module.exports = router;
