/**
 * Migration: Create WebAuthnCredentials table
 * Run: node webauthn_migration.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS WebAuthnCredentials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        CredentialID VARCHAR(512) NOT NULL UNIQUE,
        PublicKey TEXT NOT NULL,
        Counter BIGINT NOT NULL DEFAULT 0,
        DeviceLabel VARCHAR(255) DEFAULT 'My Device',
        CreatedAt DATETIME DEFAULT NOW(),
        FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
      )
    `);
    console.log('✅ WebAuthnCredentials table created (or already exists)');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
