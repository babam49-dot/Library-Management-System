/**
 * Run from: backend/
 *   node create_announcements_table.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(
      'CREATE TABLE IF NOT EXISTS BookAnnouncements (' +
      '  AnnouncementID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
      '  BookID         INT NOT NULL,' +
      '  Note           TEXT,' +
      '  CreatedAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,' +
      '  CONSTRAINT fk_announce_book FOREIGN KEY (BookID)' +
      '    REFERENCES Books(BookID) ON DELETE CASCADE' +
      ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    console.log('✅  BookAnnouncements table is ready.');
  } finally {
    conn.release();
    process.exit(0);
  }
}

run().catch(err => {
  console.error('❌ ', err.message);
  process.exit(1);
});
