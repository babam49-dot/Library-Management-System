module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Members', {
    MemberID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID: { type: DataTypes.INTEGER },
    StudentID: { type: DataTypes.STRING(50) },
    Department: { type: DataTypes.STRING(100) },
    RegistrationDate: { type: DataTypes.DATE },
    MaxBooksAllowed: { type: DataTypes.INTEGER, defaultValue: 5 }
  }, { tableName: 'Members', timestamps: false });
};
