const bcrypt = require('bcrypt');
const { sequelize, Roles, FineTypes, Publishers, Categories, Authors, Users, Members, Staff, Books, BookAuthors, BookCopies } = require('../models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Roles
    const [adminRole, memberRole, staffRole] = await Promise.all([
      Roles.create({ RoleName: 'Admin', Description: 'Administrator' }),
      Roles.create({ RoleName: 'Member', Description: 'Library Member' }),
      Roles.create({ RoleName: 'Staff', Description: 'Library Staff' })
    ]);

    // Fine type
    const defaultFineType = await FineTypes.create({ TypeName: 'Overdue', BaseAmount: 2.50, Description: 'Fine per overdue day' });

    // Publisher & category
    const publisher = await Publishers.create({ PublisherName: 'Default Publisher' });
    const category = await Categories.create({ CategoryName: 'General', Description: 'General works' });

    // Author
    const author = await Authors.create({ Name: 'Default Author' });

    // Admin and staff users for testing
    const adminHash = await bcrypt.hash('adminpass', 10);
    const adminUser = await Users.create({ Email: 'admin@example.com', Password: adminHash, FirstName: 'Admin', LastName: 'User', FullName: 'Admin User', RoleID: adminRole.RoleID });

    const staffHash = await bcrypt.hash('staffpass', 10);
    const staffUser = await Users.create({ Email: 'staff@example.com', Password: staffHash, FirstName: 'Staff', LastName: 'Member', FullName: 'Staff Member', RoleID: staffRole.RoleID });
    await Staff.create({ UserID: staffUser.UserID, JobTitle: 'Librarian', EmploymentDate: new Date(), Salary: 0 });

    // User + member
    const passwordHash = await bcrypt.hash('password', 10);
    const user = await Users.create({ Email: 'member@example.com', Password: passwordHash, FirstName: 'Default', LastName: 'Member', UniversityID: 'UNI1001', Phone: '000-000-0000', FullName: 'Default Member', RoleID: memberRole.RoleID });
    await Members.create({ UserID: user.UserID, StudentID: 'UNI1001', Department: 'General', RegistrationDate: new Date(), MaxBooksAllowed: 5 });

    // Create 10 books
    for (let i = 1; i <= 10; i++) {
      const b = await Books.create({ Title: `Sample Book ${i}`, ISBN: `ISBN-${i}`, Year: 2020 + (i % 3), Edition: '1st', Language: 'English', Description: `Seeded book ${i}`, PublisherID: publisher.PublisherID, CategoryID: category.CategoryID });
      await BookAuthors.create({ BookID: b.BookID, AuthorID: author.AuthorID });
      await BookCopies.create({ BookID: b.BookID, Status: 'Available', ShelfLocation: `A${i}`, AcquisitionDate: new Date() });
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
