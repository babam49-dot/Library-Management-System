const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1021',
      multipleStatements: true
    });

    console.log('Connected to DB');
    
    const sql = fs.readFileSync(path.join(__dirname, 'schema_user_request.sql'), 'utf8');
    
    console.log('Running SQL...');
    await connection.query(sql);
    
    console.log('Schema executed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error executing schema:', error);
    process.exit(1);
  }
}

runSchema();
