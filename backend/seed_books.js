const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const booksData = [
  {
    title: 'Calculus: Early Transcendentals',
    category: 'Mathematics',
    author: 'James Stewart',
    publisher: 'Cengage',
    isbn: '9781337613927',
    year: 2020,
    cover: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Comprehensive calculus textbook covering limits, derivatives, integrals, and multiple variables.'
  },
  {
    title: 'University Physics with Modern Physics',
    category: 'Physics',
    author: 'Hugh D. Young',
    publisher: 'Pearson',
    isbn: '9780135159552',
    year: 2019,
    cover: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Standard textbook for university level physics, covering mechanics, thermodynamics, and quantum physics.'
  },
  {
    title: 'Introduction to Algorithms',
    category: 'Computer Science',
    author: 'Thomas H. Cormen',
    publisher: 'MIT Press',
    isbn: '9780262033848',
    year: 2009,
    cover: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'The standard textbook on algorithms, comprehensively covering a wide spectrum of data structures and algorithms.'
  },
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    category: 'Computer Programming',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    isbn: '9780132350884',
    year: 2008,
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.'
  },
  {
    title: 'The Great Gatsby',
    category: 'Fiction',
    author: 'F. Scott Fitzgerald',
    publisher: 'Scribner',
    isbn: '9780743273565',
    year: 1925,
    cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'A novel about the American Dream in the Roaring Twenties.'
  },
  {
    title: 'To Kill a Mockingbird',
    category: 'Fiction',
    author: 'Harper Lee',
    publisher: 'J. B. Lippincott & Co.',
    isbn: '9780446310789',
    year: 1960,
    cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
    description: 'The memorable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.'
  }
];

async function seedBooks() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'LibraryDB'
  });

  try {
    for (const b of booksData) {
      // Get or create category
      let [cat] = await conn.execute("SELECT CategoryID FROM Categories WHERE CategoryName=?", [b.category]);
      let catId;
      if (cat.length === 0) {
        const [[mCat]] = await conn.execute("SELECT MAX(CategoryID) as m FROM Categories");
        catId = (mCat.m || 0) + 1;
        await conn.execute("INSERT INTO Categories (CategoryID, CategoryName, Description) VALUES (?,?,?)", [catId, b.category, '']);
      } else catId = cat[0].CategoryID;

      // Get or create publisher
      let [pub] = await conn.execute("SELECT PublisherID FROM Publishers WHERE PublisherName=?", [b.publisher]);
      let pubId;
      if (pub.length === 0) {
        const [[mPub]] = await conn.execute("SELECT MAX(PublisherID) as m FROM Publishers");
        pubId = (mPub.m || 0) + 1;
        await conn.execute("INSERT INTO Publishers (PublisherID, PublisherName, Address, ContactEmail, Phone) VALUES (?,?,?,?,?)", [pubId, b.publisher, '', '', '']);
      } else pubId = pub[0].PublisherID;

      // Get or create author
      let [auth] = await conn.execute("SELECT AuthorID FROM Authors WHERE Name=?", [b.author]);
      let authId;
      if (auth.length === 0) {
        const [[mAuth]] = await conn.execute("SELECT MAX(AuthorID) as m FROM Authors");
        authId = (mAuth.m || 0) + 1;
        await conn.execute("INSERT INTO Authors (AuthorID, Name, Bio, Nationality) VALUES (?,?,?,?)", [authId, b.author, '', '']);
      } else authId = auth[0].AuthorID;

      // Check if book exists
      let [existingBook] = await conn.execute("SELECT BookID FROM Books WHERE Title=?", [b.title]);
      let bookId;
      if (existingBook.length === 0) {
        const [[mBook]] = await conn.execute("SELECT MAX(BookID) as m FROM Books");
        bookId = (mBook.m || 0) + 1;
        await conn.execute(
          "INSERT INTO Books (BookID, Title, ISBN, Year, Edition, Language, Description, PublisherID, CategoryID, CoverImage, IsActive) VALUES (?,?,?,?,?,?,?,?,?,?,1)",
          [bookId, b.title, b.isbn, b.year, '1st', 'English', b.description, pubId, catId, b.cover]
        );
        
        await conn.execute("INSERT IGNORE INTO BookAuthors (BookID, AuthorID) VALUES (?,?)", [bookId, authId]);

        // Insert copies
        const [[mCopy1]] = await conn.execute("SELECT MAX(CopyID) as m FROM BookCopies");
        let copyId = (mCopy1.m || 0) + 1;
        await conn.execute("INSERT INTO BookCopies (CopyID, BookID, ShelfLocation, Status) VALUES (?,?,?,?)", [copyId, bookId, 'A1', 'Available']);
        await conn.execute("INSERT INTO BookCopies (CopyID, BookID, ShelfLocation, Status) VALUES (?,?,?,?)", [copyId + 1, bookId, 'A1', 'Available']);
      }
    }
    console.log("Successfully seeded demo books with covers!");
  } catch (err) {
    console.error(err);
  }

  process.exit(0);
}

seedBooks();
