import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function DeskLookupBar({ onLookup, isLoading }) {
  const { isDark } = useTheme();
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim()) onLookup(code.trim().toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className={`p-6 rounded-2xl shadow-sm mb-6 flex flex-col md:flex-row gap-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Enter Request Code (e.g. BR-0042)"
          className={`w-full pl-12 pr-4 py-4 rounded-xl text-lg font-mono font-bold tracking-widest border focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${isDark ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !code.trim()}
        className="px-8 py-4 bg-[#d4af37] text-white rounded-xl font-bold text-lg hover:bg-[#b5952f] disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {isLoading ? 'Looking up...' : 'Look Up'}
      </button>
    </form>
  );
}
