const express = require('express');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const { Server } = require('socket.io');
const socketService = require('./src/services/socketService');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});
socketService.init(io);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Module 2: Users & Roles (Consolidated) ──────────────────────────────────
app.use('/api', require('./src/modules/users/users.routes'));

// ─── Existing routes (legacy - consider removing once migration is verified) ──
// app.use('/api/auth',   require('./src/routes/auth'));
app.use('/api/admin',  require('./src/routes/admin'));
app.use('/api/staff',  require('./src/routes/staff'));
// app.use('/api/member', require('./src/routes/members'));
app.use('/api/books',  require('./src/routes/books'));
app.use('/api/member', require('./src/routes/members'));

// ─── Module 3: Borrowing Logic ────────────────────────────────────────────────
app.use('/api/borrowing', require('./src/routes/borrowing'));
app.use('/api/reservations', require('./src/routes/reservations'));
app.use('/api/returns', require('./src/routes/returns'));
app.use('/api/jobs', require('./src/routes/jobs'));

// Start Cron Jobs
require('./src/jobs/pickupExpirationJob');
require('./src/jobs/overdueDetectionJob');
require('./src/jobs/reservationExpiryJob');
require('./src/jobs/overdueSuspensionJob');


// ─── Module 1: Catalog ───────────────────────────────────────────────────────
app.use('/api/catalog', require('./src/catalog/catalog.routes'));

// ─── Public endpoints (no auth required) ─────────────────────────────────────
const catalogSvc = require('./src/catalog/catalog.service');

/**
 * GET /api/public/books
 * Returns the 6 most-borrowed active books for the Home page.
 * No authentication required.
 */
app.get('/api/public/books', async (req, res) => {
  try {
    const books = await catalogSvc.getMostBorrowedBooks();
    res.json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/public/announcements
 * Returns the latest staff-uploaded book announcements (new arrivals + notes).
 * No authentication required — shown on the Home page hero widget.
 */
app.get('/api/public/announcements', async (req, res) => {
  try {
    const items = await catalogSvc.getLatestAnnouncements(5);
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Health / root ───────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'Library Management API running' }));

app.get('/db-check', async (req, res) => {
  try {
    const pool = require('./src/db');
    await pool.execute('SELECT 1');
    res.json({ ok: true, message: 'DB connected' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} (HTTP + WebSocket)`));
