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
      const saved = localStorage.getItem('nomad_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true); 

  // DB Sync Helper
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
        if (event === 'SIGNED_OUT') {
          setCartItems([]);
          localStorage.removeItem('nomad_cart');
          
          // লগআউট হলে সমস্ত মার্জ ট্র্যাকার ক্লিয়ার হবে যেন পরবর্তীতে আবার মার্জ হতে পারে
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('cart_merged_')) {
              localStorage.removeItem(key);
            }
          });
        }
        setLoadingCart(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // =================== FETCH & MERGE CART (FIXED FOR REDIRECTS) ===================
  useEffect(() => {
    if (!userId) {
      setLoadingCart(false);
      return;
    }

    const loadCartForUser = async () => {
      setLoadingCart(true);
      
      const { data: dbItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId);

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
          product_media: [],
        }));
      }

      const localStr = localStorage.getItem('nomad_cart');
      const mergeKey = `cart_merged_${userId}`;
      const isAlreadyMerged = localStorage.getItem(mergeKey) === 'true';

      // 🔥 ফিক্স: রিডাইরেক্ট বা রিমুন্ট হলেও এই লকটি লোকালস্টোরেজে টিকে থাকবে, তাই ডাবল মার্জ হবে না
      if (localStr && !isAlreadyMerged) {
        localStorage.setItem(mergeKey, 'true'); // চিরস্থায়ী লক বসানো হলো
        const localCart: CartItem[] = JSON.parse(localStr);

        const dbMap = new Map(finalItems.map(item => 
          [`${item.id}-${item.color || ''}-${item.size || ''}`, item]
        ));

        localCart.forEach(localItem => {
          const key = `${localItem.id}-${localItem.color || ''}-${localItem.size || ''}`;
          const existingDbItem = dbMap.get(key);

          if (existingDbItem) {
            existingDbItem.quantity += localItem.quantity;
          } else {
            finalItems.push(localItem);
          }
        });
      }

      setCartItems(finalItems);
      localStorage.setItem('nomad_cart', JSON.stringify(finalItems));
      await performDbSync(userId, finalItems);
      setLoadingCart(false);
    };

    loadCartForUser();
  }, [userId]);

  // =================== AUTO SAVE TO LOCAL STORAGE ===================
  useEffect(() => {
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

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
