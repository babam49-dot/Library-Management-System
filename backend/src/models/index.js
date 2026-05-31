const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let sequelize;
if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length > 0) {
  // Use MySQL when credentials appear provided
  sequelize = new Sequelize(
    process.env.DB_NAME || 'library',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
} else {
  // No MySQL credentials — fall back to a local SQLite file for convenience
  const storagePath = path.join(__dirname, '../../library.sqlite');
  sequelize = new Sequelize({ dialect: 'sqlite', storage: storagePath, logging: false });
  console.warn('No DB_PASSWORD detected — using SQLite fallback at', storagePath);
}

const Roles = require('./roles')(sequelize, DataTypes);
const FineTypes = require('./fineTypes')(sequelize, DataTypes);
const Publishers = require('./publishers')(sequelize, DataTypes);
const Categories = require('./categories')(sequelize, DataTypes);
const Authors = require('./authors')(sequelize, DataTypes);
const Users = require('./users')(sequelize, DataTypes);
const Members = require('./members')(sequelize, DataTypes);
const Staff = require('./staff')(sequelize, DataTypes);
const Books = require('./books')(sequelize, DataTypes);
const BookAuthors = require('./bookAuthors')(sequelize, DataTypes);
const BookCopies = require('./bookCopies')(sequelize, DataTypes);
const BorrowingRecords = require('./borrowingRecords')(sequelize, DataTypes);
const Returns = require('./returns')(sequelize, DataTypes);
const Reservations = require('./reservations')(sequelize, DataTypes);
const BookDisposalLog = require('./bookDisposalLog')(sequelize, DataTypes);
const DamageReports = require('./damageReports')(sequelize, DataTypes);
const Fines = require('./fines')(sequelize, DataTypes);
const Payments = require('./payments')(sequelize, DataTypes);

// Associations
Roles.hasMany(Users, { foreignKey: 'RoleID' });
Users.belongsTo(Roles, { foreignKey: 'RoleID' });

Users.hasOne(Members, { foreignKey: 'UserID' });
Members.belongsTo(Users, { foreignKey: 'UserID' });

Users.hasOne(Staff, { foreignKey: 'UserID' });
Staff.belongsTo(Users, { foreignKey: 'UserID' });

Publishers.hasMany(Books, { foreignKey: 'PublisherID' });
Books.belongsTo(Publishers, { foreignKey: 'PublisherID' });

Categories.hasMany(Books, { foreignKey: 'CategoryID' });
Books.belongsTo(Categories, { foreignKey: 'CategoryID' });

Books.belongsToMany(Authors, { through: BookAuthors, foreignKey: 'BookID', otherKey: 'AuthorID' });
Authors.belongsToMany(Books, { through: BookAuthors, foreignKey: 'AuthorID', otherKey: 'BookID' });

Books.hasMany(BookCopies, { foreignKey: 'BookID' });
BookCopies.belongsTo(Books, { foreignKey: 'BookID' });

Members.hasMany(BorrowingRecords, { foreignKey: 'MemberID' });
BorrowingRecords.belongsTo(Members, { foreignKey: 'MemberID' });

BookCopies.hasMany(BorrowingRecords, { foreignKey: 'CopyID' });
BorrowingRecords.belongsTo(BookCopies, { foreignKey: 'CopyID' });

BorrowingRecords.hasOne(Returns, { foreignKey: 'BorrowID' });
Returns.belongsTo(BorrowingRecords, { foreignKey: 'BorrowID' });

Staff.hasMany(Returns, { foreignKey: 'StaffID' });
Returns.belongsTo(Staff, { foreignKey: 'StaffID' });

Members.hasMany(Reservations, { foreignKey: 'MemberID' });
Reservations.belongsTo(Members, { foreignKey: 'MemberID' });

Books.hasMany(Reservations, { foreignKey: 'BookID' });
Reservations.belongsTo(Books, { foreignKey: 'BookID' });

BookCopies.hasMany(BookDisposalLog, { foreignKey: 'CopyID' });
BookDisposalLog.belongsTo(BookCopies, { foreignKey: 'CopyID' });

Staff.hasMany(BookDisposalLog, { foreignKey: 'StaffID' });
BookDisposalLog.belongsTo(Staff, { foreignKey: 'StaffID' });

Returns.hasMany(DamageReports, { foreignKey: 'ReturnID' });
DamageReports.belongsTo(Returns, { foreignKey: 'ReturnID' });

Staff.hasMany(DamageReports, { foreignKey: 'StaffID' });
DamageReports.belongsTo(Staff, { foreignKey: 'StaffID' });

Users.hasMany(Fines, { foreignKey: 'UserID' });
Fines.belongsTo(Users, { foreignKey: 'UserID' });

FineTypes.hasMany(Fines, { foreignKey: 'TypeID' });
Fines.belongsTo(FineTypes, { foreignKey: 'TypeID' });

BorrowingRecords.hasMany(Fines, { foreignKey: 'BorrowID' });
Fines.belongsTo(BorrowingRecords, { foreignKey: 'BorrowID' });

Fines.hasMany(Payments, { foreignKey: 'FineID' });
Payments.belongsTo(Fines, { foreignKey: 'FineID' });

module.exports = {
  sequelize,
  Sequelize,
  Roles,
  FineTypes,
  Publishers,
  Categories,
  Authors,
  Users,
  Members,
  Staff,
  Books,
  BookAuthors,
  BookCopies,
  BorrowingRecords,
  Returns,
  Reservations,
  BookDisposalLog,
  DamageReports,
  Fines,
  Payments,
};
