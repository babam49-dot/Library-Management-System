const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1021',
    database: 'mydb_ex'
  });
  
  const [cols1] = await pool.query('DESCRIBE Users');
  console.log("Users:", cols1);
  const [cols2] = await pool.query('DESCRIBE Members');
  console.log("Members:", cols2);
  
  process.exit(0);
}
test();
