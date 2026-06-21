import React, { createContext, useContext, useState, useEffect } from 'react';

// ১. প্রোডাক্টের টাইপ নির্ধারণ (ProductList এর সাথে মিল রেখে)
interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  created_at: string;
}

// কার্টের ভেতরের আইটেমের জন্য নতুন টাইপ (যেখানে quantity থাকবে)
interface CartItem extends Product {
  quantity: number;
}

// ২. কনটেক্সটের জন্য টাইপ নির্ধারণ
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

// কনটেক্সট তৈরি করা
const CartContext = createContext<CartContextType | undefined>(undefined);

// ৩. কার্ট প্রোভাইডার কম্পোনেন্ট
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // লোকাল স্টোরেজ থেকে আগের সেভ করা কার্ট ডাটা লোড করা
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // কার্টের ডাটা পরিবর্তন হলেই লোকাল স্টোরেজে সেভ করা
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // কার্টে প্রোডাক্ট যোগ করার ফাংশন
  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      // প্রোডাক্টটি অলরেডি কার্টে আছে কিনা চেক করা
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        // স্টক পরিমাণের চেয়ে বেশি যেন যোগ না হতে পারে তার চেক
        if (existingItem.quantity >= product.stock_quantity) {
          alert('দুঃখিত! এই প্রোডাক্টটি আর স্টকে নেই।');
          return prevItems;
        }
        // অলরেডি থাকলে শুধু কোয়ান্টিটি ১ বাড়িয়ে দেওয়া
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      // কার্টে একদম নতুন হলে কোয়ান্টিটি ১ দিয়ে যুক্ত করা
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  // কার্ট থেকে প্রোডাক্ট বাদ দেওয়ার ফাংশন
  const removeFromCart = (id: string | number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // কোয়ান্টিটি সরাসরি আপডেট করার ফাংশন (+ বা - বাটনের জন্য)
  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // পুরো কার্ট খালি করার ফাংশন
  const clearCart = () => {
    setCartItems([]);
  };

  // কার্টের মোট পণ্যের সংখ্যা (কাউন্ট) হিসাব করা
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // কার্টের মোট টাকার পরিমাণ হিসাব করা
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ৪. কাস্টম হুক - যা অন্য কম্পোনেন্টে (যেমন: ProductList, Header) ব্যবহার করা হবে
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart অবশ্যই একটি CartProvider এর ভেতরে ব্যবহার করতে হবে');
  }
  return context;
};
