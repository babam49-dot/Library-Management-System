module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Fines', {
    FineID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID: { type: DataTypes.INTEGER },
    TypeID: { type: DataTypes.INTEGER },
    BorrowID: { type: DataTypes.INTEGER },
    Amount: { type: DataTypes.DECIMAL(10,2) },
    IssuedDate: { type: DataTypes.DATE },
    FineStatus: { type: DataTypes.STRING(50) }
  }, { tableName: 'Fines', timestamps: false });
};
