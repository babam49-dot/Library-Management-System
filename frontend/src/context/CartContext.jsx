import React, { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isInCart: () => false,
})

export const useCart = () => useContext(CartContext)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lms_borrow_cart') || '[]')
    } catch {
      return []
    }
  })

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lms_borrow_cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item) => {
    // item: { bookId, copyId, title, authors, category }
    setCart(prev => {
      if (prev.some(i => i.copyId === item.copyId)) return prev   // duplicate guard
      return [...prev, item]
    })
  }

  const removeFromCart = (copyId) =>
    setCart(prev => prev.filter(i => i.copyId !== copyId))

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('lms_borrow_cart')
  }

  const isInCart = (copyId) => cart.some(i => i.copyId === copyId)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}
