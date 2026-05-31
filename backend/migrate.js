const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'LibraryDB'
  });

  try {
    await conn.execute("ALTER TABLE Books ADD COLUMN CoverImage VARCHAR(255) NULL");
    console.log("Added CoverImage column to Books table.");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("CoverImage column already exists.");
    } else {
      console.error(err);
    }
  }

  process.exit(0);
}
migrate();
