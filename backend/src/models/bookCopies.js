module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BookCopies', {
    CopyID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    BookID: { type: DataTypes.INTEGER },
    BarcodeNumber: { type: DataTypes.STRING(50), unique: true },
    Status: { type: DataTypes.ENUM('Available', 'Borrowed', 'Reserved_on_Shelf', 'Damaged', 'Disposed'), defaultValue: 'Available' },
    ShelfLocation: { type: DataTypes.STRING(100) },
    AcquisitionDate: { type: DataTypes.DATE }
  }, { tableName: 'BookCopies', timestamps: false });
};
