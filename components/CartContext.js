import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // ব্রাউজার থেকে কার্ট ডাটা লোড করা
  useEffect(() => {
    const savedCart = localStorage.getItem('nomadCart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  // কার্ট আপডেট হলে লোকাল স্টোরেজে সেভ করা
  useEffect(() => {
    localStorage.setItem('nomadCart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
