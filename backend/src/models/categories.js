module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Categories', {
    CategoryID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CategoryName: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    Description: { type: DataTypes.TEXT }
  }, { tableName: 'Categories', timestamps: false });
};
