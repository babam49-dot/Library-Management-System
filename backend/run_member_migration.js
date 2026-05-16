const pool = require('./src/db');

async function tableExists(tableName) {
  const [rows] = await pool.query(
    'SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
    [tableName]
  );
  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function addColumn(tableName, columnName, definition) {
  if (!(await columnExists(tableName, columnName))) {
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`Added ${tableName}.${columnName}`);
  }
}

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS Roles (
      RoleID INT AUTO_INCREMENT PRIMARY KEY,
      RoleName VARCHAR(50) UNIQUE NOT NULL,
      Description VARCHAR(255)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Users (
      UserID INT AUTO_INCREMENT PRIMARY KEY,
      Email VARCHAR(100) UNIQUE NOT NULL,
      Password VARCHAR(255) NOT NULL,
      FullName VARCHAR(150) NOT NULL,
      RoleID INT NOT NULL,
      Status VARCHAR(20) DEFAULT 'Active',
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Members (
      MemberID INT AUTO_INCREMENT PRIMARY KEY,
      UserID INT UNIQUE NOT NULL,
      StudentID VARCHAR(50) UNIQUE,
      Department VARCHAR(100),
      MaxBooksAllowed INT DEFAULT 5
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Categories (
      CategoryID INT AUTO_INCREMENT PRIMARY KEY,
      CategoryName VARCHAR(100) UNIQUE NOT NULL,
      Description VARCHAR(255)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Publishers (
      PublisherID INT AUTO_INCREMENT PRIMARY KEY,
      PublisherName VARCHAR(150) NOT NULL,
      ContactEmail VARCHAR(100),
      Phone VARCHAR(30),
      Address VARCHAR(255)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Books (
      BookID INT AUTO_INCREMENT PRIMARY KEY,
      Title VARCHAR(255) NOT NULL,
      ISBN VARCHAR(20) UNIQUE,
      Language VARCHAR(50),
      Year YEAR,
      Edition VARCHAR(50),
      CategoryID INT,
      PublisherID INT,
      CoverImage VARCHAR(255),
      IsActive BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Authors (
      AuthorID INT AUTO_INCREMENT PRIMARY KEY,
      Name VARCHAR(200) NOT NULL,
      Bio TEXT,
      Nationality VARCHAR(100)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS BookAuthors (
      BookID INT NOT NULL,
      AuthorID INT NOT NULL,
      PRIMARY KEY (BookID, AuthorID)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS BookCopies (
      CopyID INT AUTO_INCREMENT PRIMARY KEY,
      BookID INT NOT NULL,
      BarcodeNumber VARCHAR(50) UNIQUE,
      Status VARCHAR(50) DEFAULT 'Available',
      ShelfLocation VARCHAR(100),
      AcquisitionDate DATE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS BorrowingRecords (
      BorrowID INT AUTO_INCREMENT PRIMARY KEY,
      MemberID INT NOT NULL,
      CopyID INT NOT NULL,
      RequestCode VARCHAR(50) NOT NULL,
      BorrowDate DATE NOT NULL,
      DueDate DATE NULL,
      ReturnDate DATE NULL,
      Status VARCHAR(50) DEFAULT 'Pending',
      PickupDeadline DATETIME NULL,
      ProcessedByStaffID INT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Reservations (
      ReservationID INT AUTO_INCREMENT PRIMARY KEY,
      MemberID INT NOT NULL,
      CopyID INT NOT NULL,
      RequestCode VARCHAR(50) NOT NULL,
      Status VARCHAR(50) DEFAULT 'Queued',
      Priority INT DEFAULT 1,
      ReservationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      PickupDeadline DATETIME NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS FineTypes (
      TypeID INT AUTO_INCREMENT PRIMARY KEY,
      TypeName VARCHAR(100) NOT NULL,
      BaseAmount DECIMAL(10,2) NOT NULL,
      Description VARCHAR(255),
      IsActive BOOLEAN DEFAULT TRUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Fines (
      FineID INT AUTO_INCREMENT PRIMARY KEY,
      BorrowID INT NULL,
      MemberID INT NULL,
      FineTypeID INT NULL,
      Amount DECIMAL(10,2) NOT NULL,
      FineStatus VARCHAR(20) DEFAULT 'Unpaid',
      GeneratedDate DATE NULL,
      Notes TEXT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS Payments (
      PaymentID INT AUTO_INCREMENT PRIMARY KEY,
      FineID INT NOT NULL,
      MemberID INT NULL,
      AmountPaid DECIMAL(10,2) NOT NULL,
      PaymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      PaymentMethod VARCHAR(50) NOT NULL,
      PaymentReference VARCHAR(200),
      ChapaTransactionID VARCHAR(200) NULL,
      PaymentStatus VARCHAR(50) DEFAULT 'Completed'
    )
  `);

  await addColumn('Users', 'FullName', 'VARCHAR(150)');
  await addColumn('Users', 'Status', "VARCHAR(20) DEFAULT 'Active'");
  await addColumn('Users', 'RoleID', 'INT NOT NULL DEFAULT 3');
  await addColumn('Members', 'MaxBooksAllowed', 'INT DEFAULT 5');
  await addColumn('BookCopies', 'BarcodeNumber', 'VARCHAR(50)');
  await addColumn('BookCopies', 'Status', "VARCHAR(50) DEFAULT 'Available'");
  await addColumn('BookCopies', 'ShelfLocation', 'VARCHAR(100)');
  await addColumn('BorrowingRecords', 'RequestCode', 'VARCHAR(50)');
  await addColumn('BorrowingRecords', 'PickupDeadline', 'DATETIME NULL');
  await addColumn('Fines', 'MemberID', 'INT NULL');
  await addColumn('Fines', 'FineTypeID', 'INT NULL');
  await addColumn('Fines', 'FineStatus', "VARCHAR(20) DEFAULT 'Unpaid'");
  await addColumn('Fines', 'GeneratedDate', 'DATE NULL');
  await addColumn('Payments', 'MemberID', 'INT NULL');
  await addColumn('Payments', 'PaymentReference', 'VARCHAR(200)');
  await addColumn('Payments', 'ChapaTransactionID', 'VARCHAR(200) NULL');
  await addColumn('Payments', 'PaymentStatus', "VARCHAR(50) DEFAULT 'Completed'");

  if (await columnExists('Fines', 'TypeID')) {
    await pool.query('UPDATE Fines SET FineTypeID = COALESCE(FineTypeID, TypeID) WHERE FineTypeID IS NULL');
  }
  if (await columnExists('Fines', 'IssuedDate')) {
    await pool.query('UPDATE Fines SET GeneratedDate = COALESCE(GeneratedDate, IssuedDate) WHERE GeneratedDate IS NULL');
  }
  if (await columnExists('Fines', 'UserID')) {
    await pool.query(`
      UPDATE Fines f
      JOIN Members m ON m.UserID = f.UserID
      SET f.MemberID = COALESCE(f.MemberID, m.MemberID)
      WHERE f.MemberID IS NULL
    `);
  }

  await pool.query(`
    INSERT IGNORE INTO Roles (RoleID, RoleName, Description) VALUES
    (1, 'Admin', 'Full system access'),
    (2, 'Staff', 'Library staff operations'),
    (3, 'Member', 'Student/member library access')
  `);

  await pool.query(`
    INSERT IGNORE INTO FineTypes (TypeID, TypeName, BaseAmount, Description) VALUES
    (1, 'Overdue', 5.00, 'Daily overdue fine'),
    (2, 'Damage-Minor', 50.00, 'Minor damage fine'),
    (3, 'Damage-Major', 200.00, 'Major damage fine'),
    (4, 'Loss', 500.00, 'Lost copy replacement fine')
  `);

  console.log('Member module migration complete');
}

run()
  .catch(err => {
    console.error('Member module migration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
