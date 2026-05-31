module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Publishers', {
    PublisherID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    PublisherName: { type: DataTypes.STRING(255), allowNull: false },
    Address: { type: DataTypes.STRING(255) },
    ContactEmail: { type: DataTypes.STRING(255) },
    Phone: { type: DataTypes.STRING(20) }
  }, { tableName: 'Publishers', timestamps: false });
};
