const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { runExpirationJob } = require('../jobs/pickupExpirationJob');
const { runOverdueJob } = require('../jobs/overdueDetectionJob');

const adminOnly = [authenticate, requireRole(1)];

router.post('/run-expiration', adminOnly, async (req, res) => {
  try {
    const result = await runExpirationJob();
    res.json({ success: true, data: result, message: "Expiration job executed" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/run-overdue', adminOnly, async (req, res) => {
  try {
    const result = await runOverdueJob();
    res.json({ success: true, data: result, message: "Overdue job executed" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
