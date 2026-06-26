import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // আপনার সঠিক পাথ দিন

interface CartItem {
  id: string; // View Bag বাটন সচল রাখতে এটি অরিজিনাল product.id থাকবে
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
  incrementQuantity: (id: string, color?: string, size?: string) => void;
  decrementQuantity: (id: string, color?: string, size?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ১. পেজ লোড হওয়া মাত্রই লোকাল স্টোরেজ থেকে কার্ট রিড করা (যাতে এক সেকেন্ডের জন্যও কার্ট খালি না দেখায়)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nomad_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🛡️ ক্লাউড ডাটাবেজ ওভাররাইট প্রোটেকশন লক (সবচেয়ে গুরুত্বপূর্ণ গার্ড)
  const allowDBSync = useRef(false);

  // ২. ইউনিফাইড অথেনটিকেশন এবং ডাটা রিকভারি লাইফসাইকেল
  useEffect(() => {
    const syncAuthAndFetchCart = async (currentUserId: string | null) => {
      allowDBSync.current = false; // ডাটাবেজে রাইট করা সাময়িক লক করুন
      setUserId(currentUserId);

      if (currentUserId) {
        // 🌐 ইউজার লগইন থাকলে ডাটাবেজ থেকে কার্ট ডাটা নিয়ে আসা
        const { data, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', currentUserId);

        if (!error && data) {
          if (data.length > 0) {
            // ক) ডাটাবেজে আগে থেকে প্রোডাক্ট থাকলে তা অ্যাপে লোড হবে (অন্য ডিভাইস বা আগের সেশনের ডাটা)
            const dbItems = data.map((item: any) => ({
              id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              color: item.color || undefined,
              size: item.size || undefined,
              image_url: item.image_url,
              product_media: item.product_media ? JSON.parse(item.product_media) : undefined
            }));
            setCartItems(dbItems);
            localStorage.setItem('nomad_cart', JSON.stringify(dbItems));
          } else {
            // খ) ডাটাবেজ খালি কিন্তু লগইন করার আগে গেস্ট হিসেবে কার্টে কিছু আইটেম ছিল, তা অ্যাকাউন্টে থেকে যাবে
            const localCart = localStorage.getItem('nomad_cart');
            if (localCart) {
              setCartItems(JSON.parse(localCart));
            }
          }
        }
        // ডাটা সম্পূর্ণ লোড হওয়া শেষ, এবার ক্লাউড সিঙ্ক লক উন্মুক্ত (Unlock) করা হলো
        allowDBSync.current = true;
      } else {
        // ইউজার লগইন না থাকলে (গেস্ট মোড)
        allowDBSync.current = true;
      }
    };

    // প্রথমবার অ্যাপ ওপেন বা রিফ্রেশ হলে সেশন চেক
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncAuthAndFetchCart(session?.user?.id || null);
    });

    // ডাইনামিক সাইন-ইন বা সাইন-আউট ইভেন্ট লিসেনার
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id || null;

      if (event === 'SIGNED_IN') {
        await syncAuthAndFetchCart(currentUserId);
      }

      if (event === 'SIGNED_OUT') {
        // 🚨 ক্রুশিয়াল ফিক্স: সাইন আউট করলে ডাটাবেজ রাইট সম্পূর্ণ লক করুন 
        // যাতে অ্যাকাউন্টের ক্লাউড ডাটা কোনোভাবেই ডিলিট না হয়ে সুরক্ষিত থাকে।
        allowDBSync.current = false; 
        setUserId(null);
        setCartItems([]);
        localStorage.removeItem('nomad_cart');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ৩. রিয়েল-টাইম অটো-সেভ এবং মাল্টি-ডিভাইস ক্লাউড সিঙ্ক
  useEffect(() => {
    // লোকাল স্টোরেজে সবসময় ইনস্ট্যান্ট ব্যাকআপ থাকবে
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    // লক অন থাকলে বা ইউজার লগআউট অবস্থায় থাকলে ডাটাবেজে সিঙ্ক হবে না
    if (!allowDBSync.current || !userId) return;

    const syncToSupabase = async () => {
      if (!userId || !allowDBSync.current) return;

      try {
        // কনф্লিক্ট এড়াতে প্রথমে ক্লাউডের পুরানো ডাটা ক্লিন করা
        await supabase.from('cart_items').delete().eq('user_id', userId);

        // কার্ট খালি না হলে নতুন আইটেমগুলো অ্যাকাউন্টে পুশ করা
        if (cartItems.length > 0) {
          const records = cartItems.map(item => ({
            user_id: userId,
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.color || null,
            size: item.size || null,
            image_url: item.image_url || item.product_media?.[0]?.media_url || null,
            product_media: item.product_media ? JSON.stringify(item.product_media) : null
          }));

          await supabase.from('cart_items').insert(records);
        }
      } catch (err) {
        console.error("Cloud Sync Error:", err);
      }
    };

    const debounce = setTimeout(syncToSupabase, 500);
    return () => clearTimeout(debounce);
  }, [cartItems, userId]);

  // ৪. কার্ট অ্যাকশনস
  const addToCart = (product: any, color?: string, size?: string) => {
    const chosenColor = color || product.color || product.selected_color || product.selectedColor || undefined;
    const chosenSize = size || product.size || product.selected_size || product.selectedSize || undefined;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(item => 
        item.id === product.id && 
        item.color === chosenColor && 
        item.size === chosenSize
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          color: chosenColor,
          size: chosenSize,
          image_url: product.image_url || product.product_media?.[0]?.media_url || product.image,
          product_media: product.product_media
        }
      ];
    });
  };

  const incrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev.map(item => {
      const isMatch = item.id === id && 
        (color === undefined || item.color === color) && 
        (size === undefined || item.size === size);
      return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
    }));
  };

  const decrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev
      .map(item => {
        const isMatch = item.id === id && 
          (color === undefined || item.color === color) && 
          (size === undefined || item.size === size);
        return isMatch ? { ...item, quantity: item.quantity - 1 } : item;
      })
      .filter(item => item.quantity > 0)
    );
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
