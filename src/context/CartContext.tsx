 import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

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
  incrementQuantity: (id: string, color?: string, size?: string) => void;
  decrementQuantity: (id: string, color?: string, size?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nomad_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // ট্র্যাকিং স্টেট: ডাটাবেজ থেকে কার্ট লোড হওয়া পর্যন্ত অটো-সিঙ্ক বন্ধ রাখবে
  const [loadingCart, setLoadingCart] = useState(true); 
  const hasMerged = useRef(false);

  // =================== DIRECT DB SYNC HELPER ===================
  // এই ফাংশনটি কোনো কন্ডিশন ছাড়াই সরাসরি ডাটাবেজে ডেটা রাইট করবে
  const performDbSync = async (uid: string, items: CartItem[]) => {
    try {
      await supabase.from('cart_items').delete().eq('user_id', uid);
      if (items.length === 0) return;

      const records = items.map(item => ({
        user_id: uid,
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color || null,
        size: item.size || null,
        image_url: item.image_url,
        product_media: item.product_media ? JSON.stringify(item.product_media) : null,
      }));

      await supabase.from('cart_items').insert(records);
    } catch (error) {
      console.error("Database sync failed:", error);
    }
  };

  // =================== AUTH & CART LOAD ===================
  useEffect(() => {
    const loadCartForUser = async (uid: string) => {
      if (!uid) return;

      const { data: dbItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', uid);

      if (error) {
        console.error("Error fetching cart from DB:", error);
        setLoadingCart(false);
        return;
      }

      let finalItems: CartItem[] = [];

      if (dbItems && dbItems.length > 0) {
        finalItems = dbItems.map((item: any) => ({
          id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          color: item.color || undefined,
          size: item.size || undefined,
          image_url: item.image_url,
          product_media: item.product_media ? JSON.parse(item.product_media) : undefined,
        }));
      }

      // গেস্ট কার্ট মার্জিং লজিক
      const localStr = localStorage.getItem('nomad_cart');
      if (localStr && !hasMerged.current) {
        const localCart: CartItem[] = JSON.parse(localStr);
        hasMerged.current = true;

        const dbMap = new Map(finalItems.map(item => 
          [`${item.id}-${item.color || ''}-${item.size || ''}`, item]
        ));

        localCart.forEach(localItem => {
          const key = `${localItem.id}-${localItem.color || ''}-${localItem.size || ''}`;
          const existingDbItem = dbMap.get(key);

          if (existingDbItem) {
            existingDbItem.quantity = Math.max(existingDbItem.quantity, localItem.quantity);
          } else {
            finalItems.push(localItem);
          }
        });
      }

      setCartItems(finalItems);
      localStorage.setItem('nomad_cart', JSON.stringify(finalItems));

      // মার্জ করা ডেটা সাথে সাথে ডাটাবেজে সেভ করে দিন
      await performDbSync(uid, finalItems);

      // সফলভাবে লোড ও মার্জ শেষ হলে লকটি খুলুন
      setLoadingCart(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id || null;

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (uid) {
          setUserId(uid);
          setLoadingCart(true); // লোডিং শুরু, অটো-সিঙ্ক সাময়িক বন্ধ
          hasMerged.current = false;   
          await loadCartForUser(uid);
        } else {
          setLoadingCart(false);
        }
      } 

      if (event === 'SIGNED_OUT') {
        setUserId(null);
        setCartItems([]);
        localStorage.removeItem('nomad_cart');
        hasMerged.current = false;
        setLoadingCart(false); // লগআউট স্টেটও ক্লিন
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // =================== AUTO SYNC TO DB (ON UPDATE) ===================
  useEffect(() => {
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    // শুধুমাত্র তখনই সিঙ্ক হবে যখন ইউজার থাকবে এবং ব্যাকএন্ড থেকে ইনিশিয়াল লোড শেষ হবে
    if (userId && !loadingCart) {
      const timeout = setTimeout(() => {
        performDbSync(userId, cartItems);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [cartItems, userId, loadingCart]);

  // =================== CART ACTIONS ===================
  const addToCart = (product: any, color?: string, size?: string) => {
    const chosenColor = color || product.color || product.selected_color || undefined;
    const chosenSize = size || product.size || product.selected_size || undefined;

    setCartItems(prev => {
      const index = prev.findIndex(i => 
        i.id === product.id && i.color === chosenColor && i.size === chosenSize
      );

      if (index > -1) {
        const updated = [...prev];
        updated[index].quantity += 1;
        return updated;
      }

      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        color: chosenColor,
        size: chosenSize,
        image_url: product.image_url || product.product_media?.[0]?.media_url,
        product_media: product.product_media,
      }];
    });
  };

  const incrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev.map(item => {
      const match = item.id === id &&
        (color === undefined || item.color === color) &&
        (size === undefined || item.size === size);
      return match ? { ...item, quantity: item.quantity + 1 } : item;
    }));
  };

  const decrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev
      .map(item => {
        const match = item.id === id &&
          (color === undefined || item.color === color) &&
          (size === undefined || item.size === size);
        return match ? { ...item, quantity: item.quantity - 1 } : item;
      })
      .filter(item => item.quantity > 0)
    );
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('nomad_cart');
    if (userId) {
      await performDbSync(userId, []);
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      incrementQuantity,
      decrementQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
