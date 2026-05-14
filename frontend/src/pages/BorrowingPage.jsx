import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardShell from '../components/DashboardShell';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import BookBorrowCard from '../components/borrowing/BookBorrowCard';
import BorrowCart from '../components/borrowing/BorrowCart';
import BorrowRequestModal from '../components/borrowing/BorrowRequestModal';
import RequestCodeDisplay from '../components/borrowing/RequestCodeDisplay';
import { useBorrowing } from '../hooks/useBorrowing';
import { useMyBorrows } from '../hooks/useMyBorrows';

const API = 'http://localhost:4000/api';

export default function BorrowingPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  const [books, setBooks] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [requestResult, setRequestResult] = useState(null);
  
  const { submitRequest, loading: submitLoading, error: submitError } = useBorrowing();
  const { fetchActiveCount, activeCount } = useMyBorrows();

  useEffect(() => {
    fetchBooks();
    fetchActiveCount();
  }, [fetchActiveCount]);

  const fetchBooks = async () => {
    try {
      // Reusing the catalog endpoint since it includes copies nested
      const res = await axios.get(\`\${API}/catalog/books\`, {
        headers: { Authorization: \`Bearer \${localStorage.getItem('lms_token')}\` }
      });
      setBooks(res.data.data.filter(b => b.Status === 'Active'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = (book, expectedStatus) => {
    setCart(prev => [...prev, { ...book, expectedStatus }]);
  };

  const handleRemoveFromCart = (bookId) => {
    setCart(prev => prev.filter(c => c.BookID !== bookId));
  };

  const handleSubmitRequest = async () => {
    // Collect one copy ID per book in cart (we'll just take the first appropriate copy)
    const copyIds = cart.map(book => {
      if (book.expectedStatus === 'Borrow') {
        const availableCopy = book.copies.find(c => c.Status === 'Available');
        return availableCopy.CopyID;
      } else {
        const resCopy = book.copies.find(c => ['Borrowed', 'Reserved_on_Shelf'].includes(c.Status));
        return resCopy.CopyID;
      }
    });

    try {
      const result = await submitRequest({ copyIds });
      setShowModal(false);
      setRequestResult(result.data);
      fetchActiveCount(); // update counts
      fetchBooks(); // refresh copies status
    } catch (err) {
      // Error handled by hook, shown in modal
    }
  };

  const filteredBooks = books.filter(b => {
    const matchSearch = b.Title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (b.AuthorName && b.AuthorName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = categoryFilter ? b.CategoryName === categoryFilter : true;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(books.map(b => b.CategoryName).filter(Boolean))];

  if (requestResult) {
    return (
      <DashboardShell title="Borrow Books">
        <RequestCodeDisplay 
          result={requestResult} 
          onReset={() => {
            setRequestResult(null);
            setCart([]);
          }} 
        />
      </DashboardShell>
    );
  }

  const { maxAllowed, activeBorrows } = activeCount;
  const limitReached = activeBorrows >= maxAllowed;

  return (
    <DashboardShell title="Borrow Books">
      <div className="flex flex-col md:flex-row h-full">
        <div className="flex-1 flex flex-col min-w-0 pr-0 md:pr-4 overflow-y-auto pb-24 md:pb-0">
          
          <div className={\`mb-6 p-4 rounded-xl flex items-center justify-between \${isDark ? 'bg-gray-800' : 'bg-white'} shadow\`}>
            <div>
              <p className="text-sm text-gray-500">Your Borrow Limit</p>
              <p className="font-bold">{activeBorrows} / {maxAllowed} active borrows</p>
            </div>
            <div className="w-1/2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={\`h-full \${limitReached ? 'bg-red-500' : 'bg-[#d4af37]'}\`} 
                style={{ width: \`\${Math.min((activeBorrows / maxAllowed) * 100, 100)}%\` }}
              ></div>
            </div>
          </div>

          {limitReached && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl border border-red-300">
              <strong>Limit Reached:</strong> You have reached your borrow limit. Return a book before requesting more.
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input 
              type="text"
              placeholder="Search books..."
              className={\`flex-1 p-3 rounded-lg border \${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} focus:ring-2 focus:ring-[#d4af37] outline-none\`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className={\`p-3 rounded-lg border \${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'}\`}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <BookBorrowCard 
                key={book.BookID} 
                book={book} 
                cart={cart}
                onAddToCart={handleAddToCart}
              />
            ))}
            {filteredBooks.length === 0 && (
              <p className="col-span-full text-center py-10 text-gray-500">No books found.</p>
            )}
          </div>
        </div>

        <BorrowCart 
          cart={cart} 
          removeFromCart={handleRemoveFromCart}
          onProceed={() => setShowModal(true)}
          maxAllowed={maxAllowed}
          activeCount={activeBorrows}
        />
      </div>

      {showModal && (
        <BorrowRequestModal 
          cart={cart}
          onClose={() => setShowModal(false)}
          onSubmit={handleSubmitRequest}
          loading={submitLoading}
          error={submitError}
        />
      )}
    </DashboardShell>
  );
}
