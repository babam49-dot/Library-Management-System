module.exports = (sequelize, DataTypes) => {
  return sequelize.define('BookDisposalLog', {
    LogID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CopyID: { type: DataTypes.INTEGER },
    Reason: { type: DataTypes.STRING(255) },
    DateRemoved: { type: DataTypes.DATE },
    StaffID: { type: DataTypes.INTEGER }
  }, { tableName: 'BookDisposalLog', timestamps: false });
};
