const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'LibraryDB'
  });

  try {
    // Fix lowercase 'available' → 'Available'
    const [r1] = await conn.execute("UPDATE BookCopies SET Status='Available' WHERE Status='available'");
    console.log('Fixed available copies:', r1.affectedRows);

    // Fix lowercase 'borrowed' → 'Borrowed'
    const [r2] = await conn.execute("UPDATE BookCopies SET Status='Borrowed' WHERE Status='borrowed'");
    console.log('Fixed borrowed copies:', r2.affectedRows);

    // Fix any other common lowercase variants
    const [r3] = await conn.execute("UPDATE BookCopies SET Status='Reserved_on_Shelf' WHERE Status='reserved_on_shelf' OR Status='reserved'");
    console.log('Fixed reserved copies:', r3.affectedRows);

    // Ensure all books are marked active (IsActive=1)
    const [r4] = await conn.execute('UPDATE Books SET IsActive=1 WHERE IsActive IS NULL OR IsActive=0');
    console.log('Activated books:', r4.affectedRows);

    // Show current status distribution
    const [statuses] = await conn.execute('SELECT Status, COUNT(*) as cnt FROM BookCopies GROUP BY Status');
    console.log('\nCurrent BookCopies status distribution:');
    statuses.forEach(s => console.log(`  ${s.Status}: ${s.cnt}`));

    const [books] = await conn.execute('SELECT COUNT(*) as total, SUM(IsActive) as active FROM Books');
    console.log(`\nBooks: ${books[0].total} total, ${books[0].active} active`);

    console.log('\nDone! Books should now appear in Browse Catalog.');
  } finally {
    await conn.end();
  }
}

fix().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
