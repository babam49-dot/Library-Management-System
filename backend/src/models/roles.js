module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Roles', {
    RoleID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    RoleName: { type: DataTypes.STRING(100), allowNull: false },
    Description: { type: DataTypes.TEXT }
  }, { tableName: 'Roles', timestamps: false });
};
