const pool = require('./src/db');

(async () => {
  try {
    await pool.execute("UPDATE Staff SET StaffIdentifier = 'LIB-STAFF-001' WHERE StaffID = 1");
    await pool.execute("UPDATE Staff SET StaffIdentifier = 'LIB-STAFF-002' WHERE StaffID = 2");
    console.log('Done! Assigned StaffIdentifiers.');
    const [rows] = await pool.execute(
      'SELECT u.FullName, u.Email, s.StaffIdentifier FROM Users u JOIN Staff s ON s.UserID = u.UserID'
    );
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
