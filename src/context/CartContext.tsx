import React, { createContext, useContext, useState, useEffect } from 'react';
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

// ডুপ্লিকেট দূর করার হেল্পার
const aggregateCartItems = (items: CartItem[]): CartItem[] => {
  const map = new Map<string, CartItem>();
  items.forEach(item => {
    const key = `${item.id}_${item.color || ''}_${item.size || ''}`;
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.quantity += item.quantity;
    } else {
      map.set(key, { ...item });
    }
  });
  return Array.from(map.values());
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nomad_cart') || localStorage.getItem('nomad_guest_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🔥 গুরুত্বপূর্ণ ২টি স্টেট গার্ড
  const [authLoading, setAuthLoading] = useState(true); // অথেনটিকেশন চেক হচ্ছে কিনা
  const [isCartInitialized, setIsCartInitialized] = useState(false); // ডাটাবেজ থেকে ডাটা লোড হয়েছে কিনা

  // DB Sync
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
      }));

      const { error } = await supabase.from('cart_items').insert(records);
      if (error) throw error;
    } catch (error) {
      console.error("Database sync failed:", error);
    }
  };

  // =================== ১. AUTH STATE LISTENER ===================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      setAuthLoading(false); // 🔥 অথ চেক শেষ! এখন আমরা জানি ইউজার আসলে কে।

      if (!uid) {
        setIsCartInitialized(true); // গেস্ট ইউজারের জন্য DB ফেচের দরকার নেই
        if (event === 'SIGNED_OUT') {
          setCartItems([]);
          localStorage.removeItem('nomad_cart');
          localStorage.removeItem('nomad_guest_cart');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // =================== ২. FETCH & SAFE MERGE CART ===================
  useEffect(() => {
    // যতক্ষণ অথ লোড হচ্ছে, ততক্ষণ ডাটাবেজ ফেচ করা যাবে না
    if (authLoading || !userId) return;

    const loadCartForUser = async () => {
      setIsCartInitialized(false);

      const { data: dbItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching cart from DB:", error);
        setIsCartInitialized(true);
        return;
      }

      let finalItems: CartItem[] = dbItems ? dbItems.map((item: any) => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color || undefined,
        size: item.size || undefined,
        image_url: item.image_url,
        product_media: [],
      })) : [];

      finalItems = aggregateCartItems(finalItems);

      // গেস্ট কার্ট থাকলে তা শুধুমাত্র একবারই লগইনের পর মার্জ হবে
      const guestStr = localStorage.getItem('nomad_guest_cart');
      if (guestStr) {
        const guestCart: CartItem[] = JSON.parse(guestStr);
        if (guestCart.length > 0) {
          finalItems = aggregateCartItems([...finalItems, ...guestCart]);
          await performDbSync(userId, finalItems);
          localStorage.removeItem('nomad_guest_cart'); // মার্জ শেষে গেস্ট কার্ট মুছে ফেলা হলো
        }
      }

      setCartItems(finalItems);
      localStorage.setItem('nomad_cart', JSON.stringify(finalItems));
      setIsCartInitialized(true); // 🔥 ডাটাবেজ থেকে ডাটা এসে স্টেটে বসে গেছে, লক ওপেন।
    };

    loadCartForUser();
  }, [userId, authLoading]);

  // =================== ৩. AUTO SAVE EFFECT (SAFE) ===================
  useEffect(() => {
    // 🔥 ফিক্স গার্ড: যতক্ষণ অথ চেক শেষ না হচ্ছে, কোনো কিছু কোথাও সেভ করা যাবে না (লিক বন্ধ)
    if (authLoading) return; 

    if (userId) {
      localStorage.setItem('nomad_cart', JSON.stringify(cartItems));
      
      // শুধুমাত্র ডাটাবেজ থেকে ডাটা আসার পর সিঙ্ক চালু হবে
      if (isCartInitialized) {
        const timeout = setTimeout(() => {
          performDbSync(userId, cartItems);
        }, 500);
        return () => clearTimeout(timeout);
      }
    } else {
      // গেস্ট ইউজার হলে গেস্ট কার্টেই সেভ হবে
      localStorage.setItem('nomad_guest_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, userId, isCartInitialized, authLoading]);

  // =================== CART ACTIONS ===================
  const addToCart = (product: any, color?: string, size?: string) => {
    const chosenColor = color || product.color || product.selected_color || undefined;
    const chosenSize = size || product.size || product.selected_size || undefined;

    setCartItems(prev => {
      const updated = [...prev];
      const index = updated.findIndex(i => 
        i.id === product.id && i.color === chosenColor && i.size === chosenSize
      );

      if (index > -1) {
        updated[index].quantity += 1;
      } else {
        updated.push({
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          color: chosenColor,
          size: chosenSize,
          image_url: product.image_url || product.product_media?.[0]?.media_url,
          product_media: product.product_media,
        });
      }
      return aggregateCartItems(updated);
    });
  };

  const incrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => aggregateCartItems(prev.map(item => {
      const match = item.id === id && item.color === color && item.size === size;
      return match ? { ...item, quantity: item.quantity + 1 } : item;
    })));
  };

  const decrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev
      .map(item => {
        const match = item.id === id && item.color === color && item.size === size;
        return match ? { ...item, quantity: item.quantity - 1 } : item;
      })
      .filter(item => item.quantity > 0)
    );
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem('nomad_cart');
    localStorage.removeItem('nomad_guest_cart');
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
