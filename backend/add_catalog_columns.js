/**
 * add_catalog_columns.js
 * Adds missing columns required by Module 1: Catalog.
 * Run once from backend/: node add_catalog_columns.js
 *
 * Safe to re-run – each ALTER is only applied if the column doesn't already exist.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db');

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = ?
       AND COLUMN_NAME  = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function run() {
  const conn = await pool.getConnection();
  try {
    // Books.IsActive
    if (!(await columnExists(conn, 'Books', 'IsActive'))) {
      await conn.execute('ALTER TABLE Books ADD COLUMN IsActive TINYINT(1) NOT NULL DEFAULT 1');
      console.log('✅  Books.IsActive added.');
    } else {
      console.log('ℹ️   Books.IsActive already exists.');
    }

    // BookCopies.BarcodeNumber
    if (!(await columnExists(conn, 'BookCopies', 'BarcodeNumber'))) {
      await conn.execute('ALTER TABLE BookCopies ADD COLUMN BarcodeNumber VARCHAR(100) NULL UNIQUE AFTER BookID');
      console.log('✅  BookCopies.BarcodeNumber added.');
    } else {
      console.log('ℹ️   BookCopies.BarcodeNumber already exists.');
    }

    console.log('\n✅  All catalog columns are in place.');
  } finally {
    conn.release();
    process.exit(0);
  }
}

run().catch(err => {
  console.error('❌ ', err.message);
  process.exit(1);
});
