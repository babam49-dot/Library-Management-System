module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Users', {
    UserID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    Password: { type: DataTypes.STRING(255), allowNull: false },
    FirstName: { type: DataTypes.STRING(100) },
    LastName: { type: DataTypes.STRING(100) },
    UniversityID: { type: DataTypes.STRING(100), unique: true },
    Phone: { type: DataTypes.STRING(20) },
    FullName: { type: DataTypes.STRING(255) },
    Status: { type: DataTypes.STRING(50) },
    RoleID: { type: DataTypes.INTEGER }
  }, { tableName: 'Users', timestamps: false });
};
