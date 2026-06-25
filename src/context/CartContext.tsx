import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // আপনার সঠিক পাথ দিন

interface CartItem {
  id: string; // এটি সবসময় অরিজিনাল product.id থাকবে যেন View Bag ঠিকঠাক কাজ করে
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
  // ⚡ ১. রিফ্রেশ সমস্যা সমাধান: শুরুতেই ব্রাউজার থেকে ডাটা ইনস্ট্যান্ট লোড হবে, তাই কার্ট খালি হবে না
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nomad_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadedFromDB, setIsLoadedFromDB] = useState(false); // সেভ গার্ড

  // ২. ইউজার লগইন স্টেট এবং ডাটাবেজ থেকে কার্ট লোড করা
  useEffect(() => {
    const loadInitialCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);

      if (currentUserId) {
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', currentUserId);

        // ডাটাবেজে ডাটা থাকলে এবং কালার/সাইজ অক্ষুণ্ণ রেখে স্টেটে বসানো
        if (!error && data && data.length > 0) {
          const dbItems = data.map((item: any) => ({
            id: item.product_id, // View Bag সচল রাখতে আইডি এবং প্রোডাক্ট আইডি এক রাখা হলো
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.color || undefined, // কালার রিকভারি
            size: item.size || undefined,   // সাইজ রিকভারি
            image_url: item.image_url,
            product_media: item.product_media ? JSON.parse(item.product_media) : undefined
          }));
          setCartItems(dbItems);
        }
      }
      setIsLoadedFromDB(true);
    };

    loadInitialCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
      if (event === 'SIGNED_OUT') {
        setCartItems([]);
        localStorage.removeItem('nomad_cart');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ৩. ব্রাউজার ও ডাটাবেজে অটো-সেভ লজিক (ওভাররাইট প্রোটেক্টেড)
  useEffect(() => {
    if (userId && !isLoadedFromDB) return; // ডাটা লোড হওয়ার আগে ডাটাবেজ রাইট ব্লক করা হলো

    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    const syncToDB = async () => {
      if (!userId) return;

      // পুরানো ডাটা ক্লিন করে ফ্রেশ ডাটা ইনসার্ট
      await supabase.from('cart_items').delete().eq('user_id', userId);

      if (cartItems.length > 0) {
        const records = cartItems.map(item => ({
          user_id: userId,
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color || null, // ডাটাবেজে কালার সেভ
          size: item.size || null,   // ডাটাবেজে সাইজ সেভ
          image_url: item.image_url || item.product_media?.[0]?.media_url || null,
          product_media: item.product_media ? JSON.stringify(item.product_media) : null
        }));

        await supabase.from('cart_items').insert(records);
      }
    };

    const debounce = setTimeout(syncToDB, 500);
    return () => clearTimeout(debounce);
  }, [cartItems, userId, isLoadedFromDB]);

  // ৪. কার্ট অ্যাকশনস (আইডি অরিজিনাল রেখে কালার/সাইজ হ্যান্ডলিং)
  const addToCart = (product: any, color?: string, size?: string) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(item => item.id === product.id && item.color === color && item.size === size);

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

      return [
        ...prev,
        {
          id: product.id, // 🎯 অরিজিনাল আইডি প্রিজার্ভড (View Bag এখন কাজ করবে)
          name: product.name,
          price: product.price,
          quantity: 1,
          color: color,
          size: size,
          image_url: product.image_url || product.product_media?.[0]?.media_url,
          product_media: product.product_media
        }
      ];
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
