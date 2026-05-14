const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/borrowingController');
const { authenticate, requireRole } = require('../middleware/auth');

// Role guards
const memberOnly = [authenticate, requireRole(3)];
const staffOrAdmin = [authenticate, requireRole(1, 2)];

// MEMBER ROUTES
router.post('/request', memberOnly, ctrl.submitRequest);
router.get('/my', memberOnly, ctrl.getMyBorrows);
router.get('/my/active-count', memberOnly, ctrl.getActiveCount);
router.delete('/request/:code', memberOnly, ctrl.cancelRequest);

// STAFF ROUTES
router.get('/session/:code', staffOrAdmin, ctrl.getSession);
router.post('/confirm/:code', staffOrAdmin, ctrl.confirmCollection);
router.post('/return', staffOrAdmin, ctrl.processReturn);
router.get('/overdue', staffOrAdmin, ctrl.getOverdue);
router.get('/sessions', staffOrAdmin, ctrl.getSessions);

module.exports = router;
