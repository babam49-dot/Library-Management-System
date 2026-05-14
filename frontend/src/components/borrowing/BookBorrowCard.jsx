import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function BookBorrowCard({ book, cart, onAddToCart }) {
  const { isDark } = useTheme();
  
  const inCart = cart.some(item => item.BookID === book.BookID);
  
  // Calculate availability
  const copies = book.copies || [];
  const availableCopies = copies.filter(c => c.Status === 'Available');
  const reservableCopies = copies.filter(c => ['Borrowed', 'Reserved_on_Shelf'].includes(c.Status));
  
  const totalAvailable = availableCopies.length;
  const canWaitlist = totalAvailable === 0 && reservableCopies.length > 0;
  const unavailable = totalAvailable === 0 && reservableCopies.length === 0;

  const handleAction = () => {
    if (!inCart && !unavailable) {
      onAddToCart(book, totalAvailable > 0 ? 'Borrow' : 'Waitlist');
    }
  };

  return (
    <div className={\`p-4 rounded-xl shadow-lg flex flex-col h-full transition-transform hover:-translate-y-1 \${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}\`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-bold font-serif line-clamp-2" style={{ fontFamily: 'Playfair Display, serif' }}>{book.Title}</h3>
        {totalAvailable > 0 ? (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">{totalAvailable} Available</span>
        ) : canWaitlist ? (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full whitespace-nowrap">Waitlist</span>
        ) : (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full whitespace-nowrap">Unavailable</span>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mb-4">{book.AuthorName || 'Unknown Author'}</p>
      
      <div className="mt-auto space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{book.CategoryName || 'Uncategorized'}</span>
          <span>{book.Language}</span>
        </div>
        
        <button
          onClick={handleAction}
          disabled={inCart || unavailable}
          className={\`w-full py-2 rounded-lg font-semibold transition-colors \${
            inCart 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : unavailable
                ? 'bg-red-50 text-red-300 cursor-not-allowed'
                : canWaitlist
                  ? 'border-2 border-orange-500 text-orange-500 hover:bg-orange-50'
                  : 'bg-[#d4af37] text-white hover:bg-[#b5952f]'
          }\`}
        >
          {inCart ? 'In Cart ✓' : unavailable ? 'Unavailable' : canWaitlist ? 'Join Waitlist' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
