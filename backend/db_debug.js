const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('mydb_ex', 'root', '1021', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function check() {
  try {
    await sequelize.authenticate();
    const [roles] = await sequelize.query("SELECT * FROM Roles;");
    console.log("Roles in DB:", roles);
    
    const [usersDesc] = await sequelize.query("DESCRIBE Users;");
    console.log("Users table schema:", usersDesc);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

check();
