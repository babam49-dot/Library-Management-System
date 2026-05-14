const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reservationsController');
const { authenticate, requireRole } = require('../middleware/auth');

const memberOnly = [authenticate, requireRole(3)];
const staffOrAdmin = [authenticate, requireRole(1, 2)];

router.get('/', staffOrAdmin, ctrl.getAllReservations);
router.get('/my', memberOnly, ctrl.getMyReservations);
router.delete('/:id', authenticate, ctrl.cancelReservation);
router.get('/queue/:copyId', staffOrAdmin, ctrl.getQueueForCopy);

module.exports = router;
