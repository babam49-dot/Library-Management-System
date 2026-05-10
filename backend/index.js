const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/admin', require('./src/routes/admin'));
app.use('/api/staff', require('./src/routes/staff'));
app.use('/api/member', require('./src/routes/members'));
app.use('/api/books', require('./src/routes/books'));

app.get('/api/public/books', async (req, res) => {
  try {
    const pool = require('./src/db');
    const [rows] = await pool.execute(`
      SELECT b.BookID, b.Title, b.CoverImage, c.CategoryName,
             GROUP_CONCAT(DISTINCT a.Name SEPARATOR ', ') as Authors,
             COUNT(DISTINCT CASE WHEN bc.Status='available' THEN bc.CopyID END) as AvailableCopies
      FROM Books b
      LEFT JOIN Categories c ON c.CategoryID = b.CategoryID
      LEFT JOIN BookAuthors ba ON ba.BookID = b.BookID
      LEFT JOIN Authors a ON a.AuthorID = ba.AuthorID
      LEFT JOIN BookCopies bc ON bc.BookID = b.BookID
      GROUP BY b.BookID
      ORDER BY b.BookID DESC
      LIMIT 8
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => res.json({ message: 'Library Management API running' }));

// DB connectivity check
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
