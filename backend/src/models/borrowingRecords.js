module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BorrowingRecords', {
    BorrowID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MemberID: { type: DataTypes.INTEGER },
    CopyID: { type: DataTypes.INTEGER },
    BorrowDate: { type: DataTypes.DATE },
    DueDate: { type: DataTypes.DATE },
    Status: { type: DataTypes.STRING(50) }
  }, { tableName: 'BorrowingRecords', timestamps: false });
};
