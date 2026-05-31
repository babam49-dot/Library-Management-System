module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Reservations', {
    ResID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    MemberID: { type: DataTypes.INTEGER },
    BookID: { type: DataTypes.INTEGER },
    ReservationDate: { type: DataTypes.DATE },
    Status: { type: DataTypes.STRING(50) }
  }, { tableName: 'Reservations', timestamps: false });
};
