import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ThemeToggle from './components/ThemeToggle'

export default function App(){
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const { user, logout } = useAuth()

  useEffect(()=>{
    axios.get('http://localhost:4000/api/books')
      .then(r => setBooks(r.data))
      .catch(()=> setError('Backend not reachable'))
  },[])

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto p-6">
        {error && <div className="text-red-600">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map(b => (
            <div key={b.BookID} className="bg-white rounded shadow p-4">
              <img src={b.ThumbnailLink} alt={b.Title} className="w-full h-40 object-cover rounded mb-3" />
              <h3 className="font-semibold">{b.Title}</h3>
              <p className="text-sm text-gray-500">ISBN: {b.ISBN}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
