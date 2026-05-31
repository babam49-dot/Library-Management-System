const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/returnsController');
const { authenticate, requireRole } = require('../middleware/auth');

const staffOrAdmin = [authenticate, requireRole(1, 2)];

router.get('/', staffOrAdmin, ctrl.getAllReturns);
router.get('/:returnId', staffOrAdmin, ctrl.getReturnById);
router.get('/borrow/:borrowId', authenticate, ctrl.getReturnByBorrowId);

module.exports = router;
