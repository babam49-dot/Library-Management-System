module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Payments', {
    PaymentID:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    FineID:             { type: DataTypes.INTEGER },
    PaymentDate:        { type: DataTypes.DATE },
    AmountPaid:         { type: DataTypes.DECIMAL(10,2) },
    PaymentMethod:      { type: DataTypes.ENUM('Cash','Card','Online'), defaultValue: 'Cash' },
    TransactionRef:     { type: DataTypes.STRING(100) },
    ReceivedByStaffID:  { type: DataTypes.INTEGER }
  }, { tableName: 'Payments', timestamps: false });
};
