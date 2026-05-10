module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BookCopies', {
    CopyID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    BookID: { type: DataTypes.INTEGER },
    Status: { type: DataTypes.STRING(50) },
    ShelfLocation: { type: DataTypes.STRING(100) },
    AcquisitionDate: { type: DataTypes.DATE }
  }, { tableName: 'BookCopies', timestamps: false });
};
