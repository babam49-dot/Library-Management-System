const pool = require('./src/db');

async function updateSchema() {
  try {
    console.log('Updating Books table...');
    try {
      await pool.execute('ALTER TABLE Books ADD UNIQUE (ISBN)');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.error('Books error:', e.message);
    }

    console.log('Updating Categories table...');
    try {
      await pool.execute('ALTER TABLE Categories ADD UNIQUE (CategoryName)');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.error('Categories error:', e.message);
    }

    console.log('Updating BookCopies table...');
    try {
      await pool.execute('ALTER TABLE BookCopies ADD COLUMN BarcodeNumber VARCHAR(50)');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.error('BookCopies BarcodeNumber column error:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE BookCopies ADD UNIQUE (BarcodeNumber)');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') console.error('BookCopies BarcodeNumber unique error:', e.message);
    }

    try {
      await pool.execute(`UPDATE BookCopies SET Status = 'Available' WHERE Status NOT IN ('Available', 'Borrowed', 'Reserved_on_Shelf', 'Damaged', 'Disposed') OR Status IS NULL`);
      await pool.execute(`ALTER TABLE BookCopies MODIFY COLUMN Status ENUM('Available', 'Borrowed', 'Reserved_on_Shelf', 'Damaged', 'Disposed') DEFAULT 'Available'`);
    } catch (e) {
      console.error('BookCopies Status error:', e.message);
    }
    
    console.log('Creating/Updating View MemberBookView...');
    try {
      await pool.execute(`
        CREATE OR REPLACE VIEW MemberBookView AS
        SELECT b.BookID, b.Title, b.ISBN, b.Year, b.Edition, b.Language, b.Description, b.PublisherID, b.CategoryID,
               COUNT(bc.CopyID) AS AvailableCopies
        FROM Books b
        LEFT JOIN BookCopies bc ON b.BookID = bc.BookID AND bc.Status = 'Available'
        GROUP BY b.BookID
      `);
    } catch (e) {
      console.error('View creation error:', e.message);
    }

    console.log('Schema update complete.');
  } catch (error) {
    console.error('Error during schema update:', error);
  } finally {
    await pool.end();
  }
}

updateSchema();
