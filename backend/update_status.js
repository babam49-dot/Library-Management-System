const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '.env')});

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    // Set staff and jane to active
    await conn.execute("UPDATE Users SET Status = 'active' WHERE Email IN ('staff@library.com', 'jane@uni.edu');");
    console.log('Successfully updated status to active');
    await conn.end();
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
