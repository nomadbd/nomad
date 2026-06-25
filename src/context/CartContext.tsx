import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // আপনার সঠিক পাথ দিন

interface CartItem {
  id: string;          // ফ্রন্টএন্ডের জন্য ইউনিক আইডি (প্রোডাক্ট আইডি + কালার + সাইজ)
  product_id: string;   // অরিজিনাল প্রোডাক্ট আইডি
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
  const [isInitialized, setIsInitialized] = useState(false); // ট্র্যাকিং গার্ড

  // 🔄 ১. ইউনিফাইড লাইফসাইকেল: অথেনটিকেশন এবং কার্ট ডাটা একসাথে লোড করা
  useEffect(() => {
    const initializeAuthAndCart = async () => {
      try {
        // কারেন্ট সেশন থেকে ইউজার আইডি নেওয়া
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id || null;
        setUserId(currentUserId);

        if (currentUserId) {
          // ইউজার লগইন থাকলে ডাটাবেজ থেকে কার্ট আনা
          const { data, error } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', currentUserId);

          if (!error && data) {
            // ডাটাবেজের ডাটা স্টেটে ম্যাপ করা
            const mappedData = data.map(item => ({
              ...item,
              id: item.id || `${item.product_id}-${item.color || ''}-${item.size || ''}`
            }));
            setCartItems(mappedData);
          }
        } else {
          // লগইন না থাকলে ব্রাউজারের LocalStorage থেকে আনা
          const localCart = localStorage.getItem('nomad_cart');
          if (localCart) {
            setCartItems(JSON.parse(localCart));
          }
        }
      } catch (err) {
        console.error("Cart Initialization Error:", err);
      } finally {
        // ডাটা সম্পূর্ণ লোড হওয়ার পরেই কেবল ইনিশিয়ালাইজেশন ট্রু হবে
        setIsInitialized(true);
      }
    };

    initializeAuthAndCart();

    // ইউজার ইনস্ট্যান্ট লগইন বা লগআউট করলে তা ট্র্যাক করা
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);

      if (currentUserId) {
        setIsInitialized(false); // নতুন ইউজারের ডাটা লোড হওয়ার আগ পর্যন্ত সিঙ্ক পজ থাকবে
        const { data, error } = await supabase.from('cart_items').select('*').eq('user_id', currentUserId);
        if (!error && data) {
          setCartItems(data);
        }
        setIsInitialized(true);
      } else if (event === 'SIGNED_OUT') {
        setCartItems([]);
        localStorage.removeItem('nomad_cart');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 💾 ২. অটো-সেভ এবং ব্যাকএন্ড সিঙ্ক (রেস কন্ডিশন প্রোটেক্টেড)
  useEffect(() => {
    if (!isInitialized) return; // ডাটা লোড শেষ না হওয়া পর্যন্ত সেভ করা সম্পূর্ণ নিষিদ্ধ

    // লোকাল স্টোরেজে ব্যাকআপ রাখা
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    const syncCartToDB = async () => {
      if (!userId) return;

      // ডুপ্লিকেট বা কনফ্লিক্ট এড়াতে প্রথমে পুরানো ডাটা ক্লিন করা
      await supabase.from('cart_items').delete().eq('user_id', userId);

      if (cartItems.length > 0) {
        const recordsToInsert = cartItems.map(item => ({
          user_id: userId,
          product_id: item.product_id || item.id.split('-')[0], // অরিজিনাল প্রোডাক্ট আইডি নিশ্চিত করা
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color || null, // কালার প্রিজার্ভ করা
          size: item.size || null,   // সাইজ প্রিজার্ভ করা
          image_url: item.image_url || item.product_media?.[0]?.media_url || null,
          product_media: item.product_media || null
        }));

        await supabase.from('cart_items').insert(recordsToInsert);
      }
    };

    const delayDebounce = setTimeout(() => {
      syncCartToDB();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [cartItems, userId, isInitialized]);

  // ➕ ৩. কার্ট অ্যাকশন হ্যান্ডলার (ইউনিক কম্পোজিট আইডি সহ)
  const addToCart = (product: any, color?: string, size?: string) => {
    setCartItems((prev) => {
      // আইডি, কালার এবং সাইজ তিনটিই মিললে তবেই কোয়ান্টিটি বাড়বে
      const existingIndex = prev.findIndex(
        item => (item.product_id === product.id || item.id.startsWith(product.id)) && 
                item.color === color && 
                item.size === size
      );

      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }

      // ভিন্ন ভ্যারিয়েন্টের জন্য আলাদা ইউনিক আইডি জেনারেট করা (কী কলিশন রোধ করতে)
      const cartItemId = `${product.id}-${color || ''}-${size || ''}`;
      
      return [
        ...prev, 
        { 
          ...product, 
          id: cartItemId, 
          product_id: product.id, 
          quantity: 1, 
          color: color || undefined, 
          size: size || undefined 
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
