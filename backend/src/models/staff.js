module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Staff', {
    StaffID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserID: { type: DataTypes.INTEGER },
    JobTitle: { type: DataTypes.STRING(100) },
    EmploymentDate: { type: DataTypes.DATE },
    Salary: { type: DataTypes.DECIMAL(10,2) }
  }, { tableName: 'Staff', timestamps: false });
};
