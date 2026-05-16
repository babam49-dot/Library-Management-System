import React from 'react';
import { CONDITION_OPTIONS } from '../../constants/borrowingStatuses';
import { useTheme } from '../../context/ThemeContext';

export default function ReturnConditionSelect({ value, onChange }) {
  const { isDark } = useTheme();
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
    >
      <option value="" disabled>Select condition...</option>
      {CONDITION_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value} className={isDark ? 'bg-gray-800' : 'bg-white'}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
