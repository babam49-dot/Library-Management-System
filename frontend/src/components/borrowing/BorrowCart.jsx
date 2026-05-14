import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function BorrowCart({ cart, removeFromCart, onProceed, maxAllowed, activeCount }) {
  const { isDark } = useTheme();
  
  const currentTotal = activeCount + cart.length;
  const isAtLimit = currentTotal > maxAllowed;

  if (cart.length === 0) return null;

  return (
    <div className={\`fixed bottom-0 left-0 right-0 md:relative md:w-80 md:flex-shrink-0 border-t md:border-t-0 md:border-l p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none \${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}\`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold font-serif">Your Cart</h2>
        <span className="text-sm text-gray-500">{cart.length} items</span>
      </div>

      <div className="max-h-48 md:max-h-full overflow-y-auto space-y-3 mb-4">
        {cart.map(item => (
          <div key={item.BookID} className={\`flex justify-between items-center p-2 rounded \${isDark ? 'bg-gray-800' : 'bg-gray-50'}\`}>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-sm font-semibold truncate">{item.Title}</p>
              <p className={\`text-xs \${item.expectedStatus === 'Waitlist' ? 'text-orange-500' : 'text-green-500'}\`}>
                {item.expectedStatus}
              </p>
            </div>
            <button 
              onClick={() => removeFromCart(item.BookID)}
              className="text-gray-400 hover:text-red-500 px-2 text-lg"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm mb-4">
          <span>Total Books (Active + Cart)</span>
          <span className={isAtLimit ? 'text-red-500 font-bold' : ''}>{currentTotal} / {maxAllowed}</span>
        </div>
        
        {isAtLimit && (
          <p className="text-red-500 text-xs mb-3">
            You will exceed your borrow limit. Please remove items or return books.
          </p>
        )}

        <button
          onClick={onProceed}
          disabled={isAtLimit}
          className={\`w-full py-3 rounded-xl font-bold transition-colors \${
            isAtLimit 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#d4af37] text-white hover:bg-[#b5952f]'
          }\`}
        >
          Proceed to Request
        </button>
      </div>
    </div>
  );
}
