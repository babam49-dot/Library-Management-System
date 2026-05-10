const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mydb_ex', 'root', '1021', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

async function check() {
  try {
    await sequelize.authenticate();
    const [rolesDesc] = await sequelize.query("DESCRIBE Roles;");
    console.log("Roles table schema:", rolesDesc);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

check();
