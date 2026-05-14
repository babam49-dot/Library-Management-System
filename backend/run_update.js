const fs = require('fs');
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

  const sql = fs.readFileSync('update.sql', 'utf8');
  console.log('Executing SQL...');
  await conn.query(sql);
  console.log('SQL Executed successfully.');
  await conn.end();
}

run().catch(console.error);
