module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Payments', {
    PaymentID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    FineID: { type: DataTypes.INTEGER },
    PaymentDate: { type: DataTypes.DATE },
    AmountPaid: { type: DataTypes.DECIMAL(10,2) },
    PaymentMethod: { type: DataTypes.STRING(50) },
    TransactionRef: { type: DataTypes.STRING(100) }
  }, { tableName: 'Payments', timestamps: false });
};
