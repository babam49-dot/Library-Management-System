-- Idempotent foundation for member auth, catalog, borrowing, fines, and payments.
-- Run with: mysql -u root -p mydb_ex < member_modules_schema.sql

CREATE TABLE IF NOT EXISTS Roles (
  RoleID INT AUTO_INCREMENT PRIMARY KEY,
  RoleName VARCHAR(50) UNIQUE NOT NULL,
  Description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  FullName VARCHAR(150) NOT NULL,
  RoleID INT NOT NULL,
  Status VARCHAR(20) DEFAULT 'Active',
  CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE TABLE IF NOT EXISTS Members (
  MemberID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT UNIQUE NOT NULL,
  StudentID VARCHAR(50) UNIQUE,
  Department VARCHAR(100),
  MaxBooksAllowed INT DEFAULT 5,
  FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Categories (
  CategoryID INT AUTO_INCREMENT PRIMARY KEY,
  CategoryName VARCHAR(100) UNIQUE NOT NULL,
  Description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Publishers (
  PublisherID INT AUTO_INCREMENT PRIMARY KEY,
  PublisherName VARCHAR(150) NOT NULL,
  ContactEmail VARCHAR(100),
  Phone VARCHAR(30),
  Address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Books (
  BookID INT AUTO_INCREMENT PRIMARY KEY,
  Title VARCHAR(255) NOT NULL,
  ISBN VARCHAR(20) UNIQUE NOT NULL,
  Language VARCHAR(50),
  Year YEAR,
  Edition VARCHAR(50),
  CategoryID INT,
  PublisherID INT,
  CoverImage VARCHAR(255),
  IsActive BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
  FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID)
);

CREATE TABLE IF NOT EXISTS Authors (
  AuthorID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(200) NOT NULL,
  Bio TEXT,
  Nationality VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS BookAuthors (
  BookID INT NOT NULL,
  AuthorID INT NOT NULL,
  PRIMARY KEY (BookID, AuthorID),
  FOREIGN KEY (BookID) REFERENCES Books(BookID),
  FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID)
);

CREATE TABLE IF NOT EXISTS BookCopies (
  CopyID INT AUTO_INCREMENT PRIMARY KEY,
  BookID INT NOT NULL,
  BarcodeNumber VARCHAR(50) UNIQUE,
  Status VARCHAR(50) DEFAULT 'Available',
  ShelfLocation VARCHAR(100),
  AcquisitionDate DATE,
  FOREIGN KEY (BookID) REFERENCES Books(BookID)
);

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
  ProcessedByStaffID INT NULL,
  FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
  FOREIGN KEY (CopyID) REFERENCES BookCopies(CopyID)
);

CREATE TABLE IF NOT EXISTS Reservations (
  ReservationID INT AUTO_INCREMENT PRIMARY KEY,
  MemberID INT NOT NULL,
  CopyID INT NOT NULL,
  RequestCode VARCHAR(50) NOT NULL,
  Status VARCHAR(50) DEFAULT 'Queued',
  Priority INT DEFAULT 1,
  ReservationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  PickupDeadline DATETIME NULL,
  FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
  FOREIGN KEY (CopyID) REFERENCES BookCopies(CopyID)
);

CREATE TABLE IF NOT EXISTS FineTypes (
  TypeID INT AUTO_INCREMENT PRIMARY KEY,
  TypeName VARCHAR(100) NOT NULL,
  BaseAmount DECIMAL(10,2) NOT NULL,
  Description VARCHAR(255),
  IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS Fines (
  FineID INT AUTO_INCREMENT PRIMARY KEY,
  BorrowID INT NOT NULL,
  MemberID INT NOT NULL,
  FineTypeID INT NOT NULL,
  Amount DECIMAL(10,2) NOT NULL,
  FineStatus VARCHAR(20) DEFAULT 'Unpaid',
  GeneratedDate DATE NOT NULL,
  Notes TEXT NULL,
  FOREIGN KEY (BorrowID) REFERENCES BorrowingRecords(BorrowID),
  FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
  FOREIGN KEY (FineTypeID) REFERENCES FineTypes(TypeID)
);

CREATE TABLE IF NOT EXISTS Payments (
  PaymentID INT AUTO_INCREMENT PRIMARY KEY,
  FineID INT NOT NULL,
  MemberID INT NOT NULL,
  AmountPaid DECIMAL(10,2) NOT NULL,
  PaymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  PaymentMethod VARCHAR(50) NOT NULL,
  PaymentReference VARCHAR(200),
  ChapaTransactionID VARCHAR(200) NULL,
  PaymentStatus VARCHAR(50) DEFAULT 'Completed',
  FOREIGN KEY (FineID) REFERENCES Fines(FineID),
  FOREIGN KEY (MemberID) REFERENCES Members(MemberID)
);

INSERT IGNORE INTO Roles (RoleID, RoleName, Description) VALUES
(1, 'Admin', 'Full system access'),
(2, 'Staff', 'Library staff operations'),
(3, 'Member', 'Student/member library access');

INSERT IGNORE INTO FineTypes (TypeID, TypeName, BaseAmount, Description) VALUES
(1, 'Overdue', 5.00, 'Daily overdue fine'),
(2, 'Damage-Minor', 50.00, 'Minor damage fine'),
(3, 'Damage-Major', 200.00, 'Major damage fine'),
(4, 'Loss', 500.00, 'Lost copy replacement fine');
