module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Fines', {
    FineID:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID:           { type: DataTypes.INTEGER },
    MemberID:         { type: DataTypes.INTEGER },
    TypeID:           { type: DataTypes.INTEGER },
    BorrowID:         { type: DataTypes.INTEGER },
    Amount:           { type: DataTypes.DECIMAL(10,2) },
    IssuedDate:       { type: DataTypes.DATE },
    FineStatus:       { type: DataTypes.ENUM('Unpaid','Partial','Paid','Waived'), defaultValue: 'Unpaid' },
    WaivedByStaffID:  { type: DataTypes.INTEGER },
    WaiverReason:     { type: DataTypes.TEXT }
  }, { tableName: 'Fines', timestamps: false });
};
