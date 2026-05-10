const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mydb_ex', 'root', '1021', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    const [results, metadata] = await sequelize.query("SHOW TABLES;");
    console.log('Tables:', results);
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
  } finally {
    await sequelize.close();
  }
}

check();
