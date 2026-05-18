/**
 * Migration: Assign StaffIdentifier 'STAFF-ADMIN-001' to admin@kibrary.com
 * Run: node assign_admin_staff_id.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db');

async function run() {
  const conn = await pool.getConnection();
  try {
    // Find admin user
    const [users] = await conn.execute(
      "SELECT u.UserID, u.Email, u.RoleID, s.StaffID, s.StaffIdentifier FROM Users u LEFT JOIN Staff s ON s.UserID = u.UserID WHERE u.Email = ?",
      ['admin@library.com']
    );

    if (users.length === 0) {
      console.log('❌ admin@library.com not found in Users table.');
      return;
    }

    const user = users[0];
    console.log('Found user:', user);

    if (user.StaffID) {
      if (user.StaffIdentifier) {
        console.log(`✅ Admin already has StaffIdentifier: ${user.StaffIdentifier}`);
      } else {
        await conn.execute(
          "UPDATE Staff SET StaffIdentifier = 'STAFF-ADMIN-001' WHERE StaffID = ?",
          [user.StaffID]
        );
        console.log('✅ Updated StaffIdentifier to STAFF-ADMIN-001');
      }
    } else {
      // Create Staff row
      await conn.execute(
        "INSERT INTO Staff (UserID, StaffIdentifier, JobTitle, EmploymentDate) VALUES (?, 'STAFF-ADMIN-001', 'System Administrator', NOW())",
        [user.UserID]
      );
      console.log('✅ Created Staff row with StaffIdentifier = STAFF-ADMIN-001');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
