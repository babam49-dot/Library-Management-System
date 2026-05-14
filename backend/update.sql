USE mydb_ex;

-- 1. Roles (Lookup table for Users)
CREATE TABLE IF NOT EXISTS Roles (
    RoleID INT AUTO_INCREMENT PRIMARY KEY,
    RoleName VARCHAR(50) NOT NULL,
    Description VARCHAR(255)
);

-- 2. FineTypes (Lookup table for Fines)
CREATE TABLE IF NOT EXISTS FineTypes (
    TypeID INT AUTO_INCREMENT PRIMARY KEY,
    TypeName VARCHAR(100) NOT NULL,
    BaseAmount INT NOT NULL,
    Description VARCHAR(255)
);

-- 3. Categories (Lookup table for Books)
CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL,
    Description TEXT
);

-- 4. Publishers (Lookup table for Books)
CREATE TABLE IF NOT EXISTS Publishers (
    PublisherID INT AUTO_INCREMENT PRIMARY KEY,
    PublisherName VARCHAR(150) NOT NULL,
    Address VARCHAR(255),
    ContactEmail VARCHAR(100),
    Phone VARCHAR(20)
);

-- 5. Authors (Lookup table for Books)
CREATE TABLE IF NOT EXISTS Authors (
    AuthorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Bio TEXT,
    Nationality VARCHAR(100)
);

-- 6. Users (Base table for Staff and Members)
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Password VARCHAR(255) NOT NULL, 
    FullName VARCHAR(150) NOT NULL,
    Phone VARCHAR(20),
    Status VARCHAR(50),
    RoleID INT,
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

-- 7. Books (Title details)
CREATE TABLE IF NOT EXISTS Books (
    BookID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    ISBN VARCHAR(20) UNIQUE,
    Year INT,
    Edition VARCHAR(50),
    Language VARCHAR(50),
    Description TEXT,
    PublisherID INT,
    CategoryID INT,
    FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- 8. BookAuthors (Junction Table for Many-to-Many)
CREATE TABLE IF NOT EXISTS BookAuthors (
    BookID INT,
    AuthorID INT,
    PRIMARY KEY (BookID, AuthorID),
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID) ON DELETE CASCADE
);

-- 9. BookCopies (Physical inventory)
CREATE TABLE IF NOT EXISTS BookCopies (
    CopyID INT AUTO_INCREMENT PRIMARY KEY,
    BookID INT,
    Status VARCHAR(50) DEFAULT 'Available',
    ShelfLocation VARCHAR(100),
    AcquisitionDate DATE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID)
);

-- 10. Members (Extends Users)
CREATE TABLE IF NOT EXISTS Members (
    MemberID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT UNIQUE,
    StudentID VARCHAR(50) UNIQUE,
    Department VARCHAR(100),
    RegistrationDate DATE,
    MaxBooksAllowed INT DEFAULT 5,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- 11. Staff (Extends Users)
CREATE TABLE IF NOT EXISTS Staff (
    StaffID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT UNIQUE,
    JobTitle VARCHAR(100),
    EmploymentDate DATE,
    Salary INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- 12. BorrowingRecords
CREATE TABLE IF NOT EXISTS BorrowingRecords (
    BorrowID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT,
    CopyID INT,
    BorrowDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    Status VARCHAR(50) DEFAULT 'Borrowed',
    FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
    FOREIGN KEY (CopyID) REFERENCES BookCopies(CopyID)
);

-- 13. Returns
-- Altering existing table if Condition is present
-- We will create it if not exists, but also we can just run ALTER TABLE to rename the column safely.
CREATE TABLE IF NOT EXISTS Returns (
    ReturnID INT AUTO_INCREMENT PRIMARY KEY,
    BorrowID INT UNIQUE,
    ReturnDate DATE NOT NULL,
    ConditionNote VARCHAR(255),
    StaffID INT,
    FOREIGN KEY (BorrowID) REFERENCES BorrowingRecords(BorrowID),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);

-- Safe rename if table exists with old column
SET @dbname = 'mydb_ex';
SET @tablename = 'Returns';
SET @columnname = 'Condition';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'ALTER TABLE Returns CHANGE `Condition` `ConditionNote` VARCHAR(255);',
  'SELECT 1;'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 14. Reservations
CREATE TABLE IF NOT EXISTS Reservations (
    ResID INT AUTO_INCREMENT PRIMARY KEY,
    MemberID INT,
    BookID INT,
    ReservationDate DATE NOT NULL,
    Status VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
    FOREIGN KEY (BookID) REFERENCES Books(BookID)
);

-- 15. Fines
CREATE TABLE IF NOT EXISTS Fines (
    FineID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    TypeID INT,
    BorrowID INT,
    Amount INT NOT NULL,
    IssuedDate DATE NOT NULL,
    FineStatus VARCHAR(50) DEFAULT 'Unpaid',
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (TypeID) REFERENCES FineTypes(TypeID),
    FOREIGN KEY (BorrowID) REFERENCES BorrowingRecords(BorrowID)
);

-- 16. DamageReports
CREATE TABLE IF NOT EXISTS DamageReports (
    ReportID INT AUTO_INCREMENT PRIMARY KEY,
    ReturnID INT,
    Description TEXT,
    Severity VARCHAR(50),
    AssessmentDate DATE,
    StaffID INT,
    FOREIGN KEY (ReturnID) REFERENCES Returns(ReturnID),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);

-- 17. Payments
CREATE TABLE IF NOT EXISTS Payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    FineID INT,
    PaymentDate DATE NOT NULL,
    AmountPaid INT NOT NULL,
    PaymentMethod VARCHAR(50),
    TransactionRef VARCHAR(100),
    FOREIGN KEY (FineID) REFERENCES Fines(FineID)
);

-- 18. BookDisposalLog
CREATE TABLE IF NOT EXISTS BookDisposalLog (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    CopyID INT,
    Reason VARCHAR(255),
    DateRemoved DATE,
    StaffID INT,
    FOREIGN KEY (CopyID) REFERENCES BookCopies(CopyID),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID)
);

-- Foreign key indexes (IGNORE ERROR IF EXISTS)
CREATE INDEX idx_borrowing_member ON BorrowingRecords(MemberID);
CREATE INDEX idx_borrowing_copy ON BorrowingRecords(CopyID);
CREATE INDEX idx_borrowing_status ON BorrowingRecords(Status);
CREATE INDEX idx_fines_user ON Fines(UserID);
CREATE INDEX idx_fines_status ON Fines(FineStatus);
CREATE INDEX idx_returns_borrow ON Returns(BorrowID);
CREATE INDEX idx_reservations_member ON Reservations(MemberID);
CREATE INDEX idx_reservations_status ON Reservations(Status);
CREATE INDEX idx_bookcopies_book ON BookCopies(BookID);
CREATE INDEX idx_bookcopies_status ON BookCopies(Status);
CREATE INDEX idx_books_title ON Books(Title);
CREATE INDEX idx_books_isbn ON Books(ISBN);
CREATE INDEX idx_users_email ON Users(Email);

-- Add CHECK constraints for status fields to ensure data integrity
ALTER TABLE BookCopies ADD CONSTRAINT chk_status CHECK (Status IN ('Available', 'Borrowed', 'Reserved_on_Shelf', 'Damaged', 'Disposed'));
ALTER TABLE BorrowingRecords ADD CONSTRAINT chk_borrow_status CHECK (Status IN ('Pending', 'Borrowed', 'Returned', 'Overdue', 'Expired'));
ALTER TABLE Fines ADD CONSTRAINT chk_fine_status CHECK (FineStatus IN ('Unpaid', 'Partial', 'Paid', 'Waived'));
ALTER TABLE Payments ADD CONSTRAINT chk_payment_method CHECK (PaymentMethod IN ('Cash', 'Card', 'Online'));

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS check_member_fines_before_borrow;
DROP TRIGGER IF EXISTS calculate_overdue_fine;

-- Add a trigger to prevent borrowing if member has unpaid fines
DELIMITER $$
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
END$$
DELIMITER ;

-- Add a trigger to automatically calculate overdue fines
DELIMITER $$
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
END$$
DELIMITER ;

-- Create or Replace Views
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
