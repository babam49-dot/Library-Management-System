module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BookAuthors', {
    BookID: { type: DataTypes.INTEGER, primaryKey: true },
    AuthorID: { type: DataTypes.INTEGER, primaryKey: true }
  }, { tableName: 'BookAuthors', timestamps: false });
};
