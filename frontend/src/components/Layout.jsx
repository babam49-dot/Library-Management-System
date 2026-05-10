import React from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-gray-950 dark:bg-gray-950 dark:text-gray-100 font-sans">
      <Header />
      <main className="flex-grow flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}
