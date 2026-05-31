module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Authors', {
    AuthorID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Name: { type: DataTypes.STRING(255), allowNull: false },
    Bio: { type: DataTypes.TEXT },
    Nationality: { type: DataTypes.STRING(100) }
  }, { tableName: 'Authors', timestamps: false });
};
