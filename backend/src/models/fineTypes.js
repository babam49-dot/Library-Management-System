module.exports = (sequelize, DataTypes) => {
  return sequelize.define('FineTypes', {
    TypeID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TypeName: { type: DataTypes.STRING(100), allowNull: false },
    BaseAmount: { type: DataTypes.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
    Description: { type: DataTypes.TEXT }
  }, { tableName: 'FineTypes', timestamps: false });
};
