module.exports = (sequelize, DataTypes) => {
  return sequelize.define('DamageReports', {
    ReportID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ReturnID: { type: DataTypes.INTEGER },
    Description: { type: DataTypes.TEXT },
    Severity: { type: DataTypes.STRING(50) },
    AssessmentDate: { type: DataTypes.DATE },
    StaffID: { type: DataTypes.INTEGER }
  }, { tableName: 'DamageReports', timestamps: false });
};
