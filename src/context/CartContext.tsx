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

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      // ইউজার লগইন থাকলে 'nomad_cart' দেখবে, লগআউট থাকলে 'nomad_guest_cart' দেখবে
      const saved = localStorage.getItem('nomad_cart') || localStorage.getItem('nomad_guest_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true); 

  // DB Sync Helper (ডাটাবেজে কার্ট পুশ করার নিরাপদ ফাংশন)
  const performDbSync = async (uid: string, items: CartItem[]) => {
    try {
      // প্রথমে পুরোনো ডাটা ডিলিট
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
        if (event === 'SIGNED_OUT') {
          setCartItems([]);
          localStorage.removeItem('nomad_cart');
          localStorage.removeItem('nomad_guest_cart');
        }
        setLoadingCart(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // =================== FETCH & SAFE MERGE CART ===================
  useEffect(() => {
    if (!userId) {
      setLoadingCart(false);
      return;
    }

    const loadCartForUser = async () => {
      setLoadingCart(true);

      // ১. ডাটাবেজ থেকে এই ইউজারের কার্ট নিয়ে আসা
      const { data: dbItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error("Error fetching cart from DB:", error);
        setLoadingCart(false);
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

      // ২. 🔥 ফিক্স: শুধুমাত্র গেস্ট কার্ট ('nomad_guest_cart') থাকলেই মার্জ হবে
      // পেজ রিফ্রেশ করলে 'nomad_guest_cart' থাকবে না, তাই ডাবল মার্জ হওয়ার সুযোগ নেই।
      const guestStr = localStorage.getItem('nomad_guest_cart');

      if (guestStr) {
        const guestCart: CartItem[] = JSON.parse(guestStr);

        if (guestCart.length > 0) {
          guestCart.forEach(guestItem => {
            const existingItem = finalItems.find(item => 
              item.id === guestItem.id && item.color === guestItem.color && item.size === guestItem.size
            );

            if (existingItem) {
              existingItem.quantity += guestItem.quantity;
            } else {
              finalItems.push(guestItem);
            }
          });

          // মার্জ হওয়া নতুন ডাটা ডাটাবেজে সিঙ্ক করা
          await performDbSync(userId, finalItems);
          
          // মার্জ শেষ! এবার গেস্ট কার্ট পার্মানেন্টলি ডিলিট যেন রিফ্রেশে আর ঝামেলা না করে
          localStorage.removeItem('nomad_guest_cart');
        }
      }

      setCartItems(finalItems);
      localStorage.setItem('nomad_cart', JSON.stringify(finalItems));
      setLoadingCart(false);
    };

    loadCartForUser();
  }, [userId]);

  // =================== AUTO SAVE TO LOCAL STORAGE ===================
  useEffect(() => {
    if (userId) {
      // লগইন থাকলে মেইন কার্টে সেভ হবে
      localStorage.setItem('nomad_cart', JSON.stringify(cartItems));
      
      if (!loadingCart) {
        const timeout = setTimeout(() => {
          performDbSync(userId, cartItems);
        }, 800);
        return () => clearTimeout(timeout);
      }
    } else {
      // লগআউট থাকলে গেস্ট কার্টে সেভ হবে
      localStorage.setItem('nomad_guest_cart', JSON.stringify(cartItems));
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
      const match = item.id === id && item.color === color && item.size === size;
      return match ? { ...item, quantity: item.quantity + 1 } : item;
    }));
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
