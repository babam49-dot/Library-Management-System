module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Books', {
    BookID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Title: { type: DataTypes.STRING(255), allowNull: false },
    ISBN: { type: DataTypes.STRING(20), unique: true },
    Year: { type: DataTypes.INTEGER },
    Edition: { type: DataTypes.STRING(50) },
    Language: { type: DataTypes.STRING(50) },
    Description: { type: DataTypes.TEXT },
    PublisherID: { type: DataTypes.INTEGER },
    CategoryID: { type: DataTypes.INTEGER }
  }, { tableName: 'Books', timestamps: false });
};
