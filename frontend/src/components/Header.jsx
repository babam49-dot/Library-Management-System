import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-emerald-800 dark:text-emerald-400">
          Uni<span className="text-gray-900 dark:text-white">Library</span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6 mr-4 font-medium text-gray-600 dark:text-gray-300">
            <Link to="/" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Home</Link>
            <Link to="/catalog" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">Catalog</Link>
          </nav>
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/dashboard" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm">Dashboard</Link>
              <button onClick={logout} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">Sign In</Link>
              <Link to="/signup" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 shadow-sm">Join</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
