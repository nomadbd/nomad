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

// ডুপ্লিকেট আইটেম দূর করার হেল্পার ফাংশন (সেফটি গার্ড)
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
  
  // 🔥 গুরুত্বপূর্ণ: ডাটাবেজ থেকে ডাটা আসা শেষ হয়েছে কিনা তা ট্র্যাক করার ফ্ল্যাগ
  const [isCartInitialized, setIsCartInitialized] = useState(false); 

  // DB Sync Function
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

  // =================== AUTH STATE LISTENER ===================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user?.id || null;

      if (uid) {
        setUserId(uid);
      } else {
        setUserId(null);
        setIsCartInitialized(true); // গেস্ট ইউজারের জন্য ইনিশিয়ালাইজেশন ট্রু
        if (event === 'SIGNED_OUT') {
          setCartItems([]);
          localStorage.removeItem('nomad_cart');
          localStorage.removeItem('nomad_guest_cart');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // =================== FETCH & SAFE MERGE CART ===================
  useEffect(() => {
    if (!userId) return;

    const loadCartForUser = async () => {
      setIsCartInitialized(false); // ডাটা লোড হওয়া শুরু হলে লক করে দিন

      const { data: dbItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching cart from DB:", error);
        setIsCartInitialized(true);
        return;
      }

      // ডাটাবেজ থেকে আসা ডাটা ফরম্যাট করা
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

      // ডাটাবেজের ডাটায় কোনো ডুপ্লিকেট থাকলে তা ক্লিন করা
      finalItems = aggregateCartItems(finalItems);

      // গেস্ট কার্ট থাকলে তা মার্জ করা
      const guestStr = localStorage.getItem('nomad_guest_cart');
      if (guestStr) {
        const guestCart: CartItem[] = JSON.parse(guestStr);
        if (guestCart.length > 0) {
          finalItems = aggregateCartItems([...finalItems, ...guestCart]);
          await performDbSync(userId, finalItems);
          localStorage.removeItem('nomad_guest_cart');
        }
      }

      setCartItems(finalItems);
      localStorage.setItem('nomad_cart', JSON.stringify(finalItems));
      
      // 🔥 ডাটাবেজ থেকে ডাটা সফলভাবে স্টেটে বসে গেছে, এবার লক খুলুন
      setIsCartInitialized(true); 
    };

    loadCartForUser();
  }, [userId]);

  // =================== AUTO SAVE TO LOCAL STORAGE & DB ===================
  useEffect(() => {
    if (userId) {
      localStorage.setItem('nomad_cart', JSON.stringify(cartItems));
      
      // 🔥 ফিক্স: শুধুমাত্র ইনিশিয়ালাইজেশন ট্রু হলেই ডাটাবেজে রাইট হবে, রিফ্রেশ করার সাথে সাথে নয়
      if (isCartInitialized) {
        const timeout = setTimeout(() => {
          performDbSync(userId, cartItems);
        }, 500);
        return () => clearTimeout(timeout);
      }
    } else {
      localStorage.setItem('nomad_guest_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, userId, isCartInitialized]);

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
