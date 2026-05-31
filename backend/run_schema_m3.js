const db = require('./src/db');

async function fixReservations() {
  try {
    const alterQueries = [
      "ALTER TABLE Reservations CHANGE ResID ReservationID INT AUTO_INCREMENT",
      "ALTER TABLE Reservations ADD COLUMN CopyID INT NOT NULL DEFAULT 1",
      "ALTER TABLE Reservations ADD COLUMN RequestCode VARCHAR(50) NOT NULL DEFAULT 'BR-TEMP'",
      "ALTER TABLE Reservations ADD COLUMN Priority INT DEFAULT 1",
      "ALTER TABLE Reservations ADD COLUMN PickupDeadline DATETIME NULL",
      "ALTER TABLE Reservations ADD FOREIGN KEY (CopyID) REFERENCES BookCopies(CopyID)",
      "CREATE INDEX idx_reservations_copyid ON Reservations(CopyID, Status)"
    ];

    for (let q of alterQueries) {
      try {
        await db.query(q);
        console.log("Executed:", q);
      } catch (e) {
        console.error("Error on", q, e.message);
      }
    }

  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

fixReservations();
