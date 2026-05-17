const pool = require('./src/db');
async function run() {
  const [rows] = await pool.query('DESCRIBE Users');
  console.log('Users table schema:', rows);
  process.exit(0);
}
run();
