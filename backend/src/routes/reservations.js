const express = require('express');
const router = express.Router();
const { authenticate, authorizeRole } = require('../middleware/auth');
const { Members, BookCopies, Reservations } = require('../models');

// Create reservation (members only) when no copies available
router.post('/', authenticate, authorizeRole('Member'), async (req, res) => {
  const { bookId } = req.body;
  if (!bookId) return res.status(400).json({ error: 'Missing bookId' });
  try {
    const member = await Members.findOne({ where: { UserID: req.user.userId } });
    if (!member) return res.status(403).json({ error: 'Not a member' });

    const available = await BookCopies.count({ where: { BookID: bookId, Status: 'Available' } });
    if (available > 0) return res.status(400).json({ error: 'Copies are available; cannot reserve' });

    const r = await Reservations.create({ MemberID: member.MemberID, BookID: bookId, ReservationDate: new Date(), Status: 'Active' });
    return res.json(r);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
