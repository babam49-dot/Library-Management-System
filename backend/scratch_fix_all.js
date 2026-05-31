const mysql = require('mysql2/promise');

async function fix() {
  const pool = mysql.createPool({ host: 'localhost', user: 'root', password: '1021', database: 'mydb_ex' });
  
  const tables = {
    'FineTypes': 'TypeID',
    'Categories': 'CategoryID',
    'Publishers': 'PublisherID',
    'Authors': 'AuthorID',
    'Books': 'BookID',
    'BookCopies': 'CopyID',
    'BorrowingRecords': 'BorrowID',
    'Returns': 'ReturnID',
    'Reservations': 'ResID',
    'Fines': 'FineID',
    'DamageReports': 'ReportID',
    'Payments': 'PaymentID',
    'BookDisposalLog': 'LogID'
  };

  try {
    const conn = await pool.getConnection();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    for (const [table, pk] of Object.entries(tables)) {
      try {
        console.log(`Fixing ${table}...`);
        await conn.query(`ALTER TABLE ${table} MODIFY ${pk} INT AUTO_INCREMENT`);
      } catch(e) {
        console.log(`Error fixing ${table}:`, e.message);
      }
    }
    
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    conn.release();
    console.log("Success!");
  } catch (e) { console.log("Error:", e.message); }
  
  process.exit(0);
}
fix();
