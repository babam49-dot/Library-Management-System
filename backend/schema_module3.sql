-- TABLE 1: BorrowingRecords
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
  FOREIGN KEY (CopyID) REFERENCES BookCopies(CopyID),
  FOREIGN KEY (ProcessedByStaffID) REFERENCES Staff(StaffID)
);

-- TABLE 2: Reservations
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

-- TABLE 3: Returns
CREATE TABLE IF NOT EXISTS Returns (
  ReturnID INT AUTO_INCREMENT PRIMARY KEY,
  BorrowID INT NOT NULL,
  ReturnDate DATETIME DEFAULT CURRENT_TIMESTAMP,
  ConditionOnReturn VARCHAR(50) DEFAULT 'Good',
  Notes TEXT,
  ProcessedByStaffID INT NOT NULL,
  FOREIGN KEY (BorrowID) REFERENCES BorrowingRecords(BorrowID),
  FOREIGN KEY (ProcessedByStaffID) REFERENCES Staff(StaffID)
);

-- INDEX FOR PERFORMANCE
CREATE INDEX idx_borrowing_requestcode ON BorrowingRecords(RequestCode);
CREATE INDEX idx_borrowing_memberid ON BorrowingRecords(MemberID);
CREATE INDEX idx_borrowing_status ON BorrowingRecords(Status);
CREATE INDEX idx_reservations_copyid ON Reservations(CopyID, Status);
