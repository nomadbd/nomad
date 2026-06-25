import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // আপনার সঠিক পাথ দিন

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  product_media?: any[];
  color?: string;
  size?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: any, color?: string, size?: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🛡️ ক্রুশিয়াল স্টেট: ডাটা লোড হওয়া শেষ না হওয়া পর্যন্ত সেভ করা আটকাবে
  const [isInitialized, setIsInitialized] = useState(false);

  // ১. ইউজারের লগইন স্টেট চেক করা
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ২. ইনিশিয়াল লোড: রিফ্রেশ করার পর ডাটা রিকভার করা
  useEffect(() => {
    const fetchSavedCart = async () => {
      if (userId) {
        // 🌐 ইউজার লগইন থাকলে ডাটাবেজ থেকে কার্ট আনা হবে
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          setCartItems(data);
        }
      } else {
        // 💻 লগইন না থাকলে LocalStorage থেকে আনা হবে
        const localCart = localStorage.getItem('nomad_cart');
        if (localCart) {
          setCartItems(JSON.parse(localCart));
        }
      }
      // লোডিং সম্পন্ন হলে সিঙ্ক করার পারমিশন দেওয়া হলো
      setIsInitialized(true);
    };

    fetchSavedCart();
  }, [userId]);

  // ৩. অটো-সেভ এবং ব্যাকএন্ড সিঙ্ক (ডাটা ওভাররাইট প্রোটেক্টেড)
  useEffect(() => {
    // 🚨 ডাটা পুরোপুরি লোড হওয়ার আগে যদি স্টেট খালি থাকে, তবে সেভ প্রসেস স্কিপ করো
    if (!isInitialized) return;

    // ব্রাউজারে ব্যাকআপ রাখা হচ্ছে
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    // ডাটাবেজে সিঙ্ক করা
    const syncCartToDB = async () => {
      if (!userId) return;

      if (cartItems.length === 0) {
        // কার্ট খালি হলে ডাটাবেজ থেকেও মুছে দাও
        await supabase.from('cart_items').delete().eq('user_id', userId);
        return;
      }

      // ডাটাবেজের কনফ্লিক্ট এড়াতে প্রথমে পুরানো কার্ট মুছে নতুন অ্যারে ইনসার্ট করা সবচেয়ে নিরাপদ ও ক্লিন উপায়
      await supabase.from('cart_items').delete().eq('user_id', userId);
      
      await supabase.from('cart_items').insert(
        cartItems.map(item => ({
          user_id: userId,
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color,
          size: item.size,
          product_media: item.product_media,
          image_url: item.image_url || item.product_media?.[0]?.media_url
        }))
      );
    };

    const delayDebounce = setTimeout(() => {
      syncCartToDB();
    }, 500); 

    return () => clearTimeout(delayDebounce);
  }, [cartItems, userId, isInitialized]);

  // ৪. কার্ট অ্যাকশন হ্যান্ডলারসমূহ
  const addToCart = (product: any, color?: string, size?: string) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(item => item.id === product.id && item.color === color && item.size === size);
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prev, { ...product, quantity: 1, color, size }];
    });
  };

  const incrementQuantity = (id: string) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  };

  const decrementQuantity = (id: string) => {
    setCartItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item));
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('nomad_cart');
    if (userId) {
      await supabase.from('cart_items').delete().eq('user_id', userId);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, isCartOpen, setIsCartOpen, addToCart, incrementQuantity, decrementQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
