const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('Creating Views...');
    await conn.query(`
      CREATE OR REPLACE VIEW MemberBookView AS
      SELECT DISTINCT 
          b.BookID, b.Title, b.ISBN, b.Year, b.Edition, b.Language,
          GROUP_CONCAT(DISTINCT a.Name) AS Authors,
          c.CategoryName,
          (SELECT COUNT(*) FROM BookCopies bc WHERE bc.BookID = b.BookID AND bc.Status = 'Available') AS AvailableCopies
      FROM Books b
      LEFT JOIN BookAuthors ba ON b.BookID = ba.BookID
      LEFT JOIN Authors a ON ba.AuthorID = a.AuthorID
      LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
      WHERE EXISTS (SELECT 1 FROM BookCopies bc2 WHERE bc2.BookID = b.BookID AND bc2.Status != 'Disposed')
      GROUP BY b.BookID;
    `);

    await conn.query(`
      CREATE OR REPLACE VIEW OutstandingFinesReport AS
      SELECT 
          u.FullName, u.Email, m.StudentID,
          f.FineID, ft.TypeName, f.Amount, f.FineStatus,
          f.IssuedDate, b.Title
      FROM Fines f
      JOIN Users u ON f.UserID = u.UserID
      JOIN Members m ON u.UserID = m.UserID
      JOIN FineTypes ft ON f.TypeID = ft.TypeID
      LEFT JOIN BorrowingRecords br ON f.BorrowID = br.BorrowID
      LEFT JOIN BookCopies bc ON br.CopyID = bc.CopyID
      LEFT JOIN Books b ON bc.BookID = b.BookID
      WHERE f.FineStatus IN ('Unpaid', 'Partial')
      ORDER BY f.Amount DESC;
    `);

    await conn.query(`
      CREATE OR REPLACE VIEW CurrentlyBorrowedView AS
      SELECT 
          u.FullName AS MemberName,
          b.Title, bc.ShelfLocation,
          br.BorrowDate, br.DueDate,
          DATEDIFF(CURDATE(), br.DueDate) AS DaysOverdue
      FROM BorrowingRecords br
      JOIN Members m ON br.MemberID = m.MemberID
      JOIN Users u ON m.UserID = u.UserID
      JOIN BookCopies bc ON br.CopyID = bc.CopyID
      JOIN Books b ON bc.BookID = b.BookID
      WHERE br.Status IN ('Borrowed', 'Overdue');
    `);

    console.log('Dropping old triggers if exist...');
    await conn.query('DROP TRIGGER IF EXISTS check_member_fines_before_borrow;');
    await conn.query('DROP TRIGGER IF EXISTS calculate_overdue_fine;');

    console.log('Creating Triggers...');
    await conn.query(`
      CREATE TRIGGER check_member_fines_before_borrow
      BEFORE INSERT ON BorrowingRecords
      FOR EACH ROW
      BEGIN
          DECLARE unpaid_total INT;
          SELECT COALESCE(SUM(Amount), 0) INTO unpaid_total
          FROM Fines f
          JOIN Users u ON f.UserID = u.UserID
          JOIN Members m ON u.UserID = m.UserID
          WHERE m.MemberID = NEW.MemberID AND f.FineStatus IN ('Unpaid', 'Partial');
          
          IF unpaid_total > 0 THEN
              SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Member has unpaid fines. Cannot borrow.';
          END IF;
      END;
    `);

    await conn.query(`
      CREATE TRIGGER calculate_overdue_fine
      BEFORE UPDATE ON BorrowingRecords
      FOR EACH ROW
      BEGIN
          IF NEW.Status = 'Overdue' AND OLD.Status != 'Overdue' THEN
              INSERT INTO Fines (UserID, TypeID, BorrowID, Amount, IssuedDate, FineStatus)
              SELECT m.UserID, ft.TypeID, NEW.BorrowID, 
                     DATEDIFF(CURDATE(), NEW.DueDate) * ft.BaseAmount,
                     CURDATE(), 'Unpaid'
              FROM Members m
              CROSS JOIN FineTypes ft
              WHERE m.MemberID = NEW.MemberID AND ft.TypeName = 'Overdue';
          END IF;
      END;
    `);

    console.log('All executed successfully.');
  } catch (err) {
    console.error(err);
  } finally {
    await conn.end();
  }
}

run().catch(console.error);
