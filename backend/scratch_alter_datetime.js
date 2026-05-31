const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1021',
    database: process.env.DB_NAME || 'mydb_ex',
    port: parseInt(process.env.DB_PORT, 10) || 3306
  });

  console.log('Connected to MySQL. Altering tables to support DATETIME...');
  try {
    // Modify columns in BorrowingRecords to DATETIME
    await connection.query('ALTER TABLE BorrowingRecords MODIFY COLUMN BorrowDate DATETIME NOT NULL');
    console.log('Altered BorrowDate to DATETIME');
    
    await connection.query('ALTER TABLE BorrowingRecords MODIFY COLUMN DueDate DATETIME NULL');
    console.log('Altered DueDate to DATETIME');
    
    await connection.query('ALTER TABLE BorrowingRecords MODIFY COLUMN ReturnDate DATETIME NULL');
    console.log('Altered ReturnDate to DATETIME');
    
    console.log('Successfully updated BorrowingRecords columns to DATETIME!');
  } catch (err) {
    console.error('Error during alter:', err);
  } finally {
    await connection.end();
  }
}

run();
