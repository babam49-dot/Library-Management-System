module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Returns', {
    ReturnID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    BorrowID: { type: DataTypes.INTEGER },
    ReturnDate: { type: DataTypes.DATE },
    Condition: { type: DataTypes.STRING(100) },
    StaffID: { type: DataTypes.INTEGER }
  }, { tableName: 'Returns', timestamps: false });
};
