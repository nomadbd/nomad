import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // আপনার supabaseClient এর সঠিক পাথ দিন

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

  // ১. ইউজারের লগইন স্টেট (Supabase Auth) মনিটর করা
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ২. ইনিশিয়াল লোড: ব্রাউজার অথবা ডাটাবেজ থেকে কার্ট ডাটা রিড করা
  useEffect(() => {
    const fetchCart = async () => {
      if (userId) {
        // ইউজার লগইন থাকলে ডাটাবেজ থেকে কার্ট নিয়ে আসবে (মাল্টি-ডিভাইস সাপোর্ট)
        const { data, error } = await supabase
          .from('cart_items') // আপনার ডাটাবেজের টেবিল নাম
          .select('*')
          .eq('user_id', userId);

        if (!error && data) {
          setCartItems(data);
        }
      } else {
        // লগইন না থাকলে ব্রাউজারের LocalStorage থেকে লোড করবে
        const localCart = localStorage.getItem('nomad_cart');
        if (localCart) {
          setCartItems(JSON.parse(localCart));
        }
      }
    };

    fetchCart();
  }, [userId]);

  // ৩. অটো-সেভ এবং সিঙ্ক: কার্টে কোনো পরিবর্তন হলেই তা সেভ হবে
  useEffect(() => {
    if (cartItems.length === 0) {
      localStorage.removeItem('nomad_cart');
      return;
    }

    // সবসময় ব্রাউজারে ব্যাকআপ রাখা হচ্ছে
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    // ইউজার লগইন থাকলে ডাটাবেজেও সিঙ্ক (Upsert) হবে যেন অন্য ডিভাইস থেকে পাওয়া যায়
    const syncCartToDB = async () => {
      if (userId) {
        await supabase
          .from('cart_items')
          .upsert(
            cartItems.map(item => ({
              user_id: userId,
              product_id: item.id,
              quantity: item.quantity,
              color: item.color,
              size: item.size,
              name: item.name,
              price: item.price,
              product_media: item.product_media
            }))
          );
      }
    };

    const delayDebounce = setTimeout(() => {
      syncCartToDB();
    }, 500); // ঘন ঘন ডাটাবেজ রিকোয়েস্ট কমানোর জন্য ছোট্ট ডিলে

    return () => clearTimeout(delayDebounce);
  }, [cartItems, userId]);

  // ৪. কার্টের অন্যান্য হ্যান্ডলার ফাংশনসমূহ
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
