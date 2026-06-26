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

  const hasMerged = useRef(false);

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
        return;
      }

      let finalItems: CartItem[] = [];

      // প্রথমে ডাটাবেজের আইটেমগুলো নিয়ে ফাইনাল লিস্ট তৈরি করি
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

      // সঠিক নিয়মে গেস্ট কার্ট ডাটাবেজের সাথে মার্জ (Merge) করার লজিক
      const localStr = localStorage.getItem('nomad_cart');
      if (localStr && !hasMerged.current) {
        const localCart: CartItem[] = JSON.parse(localStr);
        hasMerged.current = true;

        // ডাটাবেজের আইটেমগুলোর একটি ম্যাপ তৈরি করি সহজে খোঁজার জন্য
        const dbMap = new Map(finalItems.map(item => 
          [`${item.id}-${item.color || ''}-${item.size || ''}`, item]
        ));

        localCart.forEach(localItem => {
          const key = `${localItem.id}-${localItem.color || ''}-${localItem.size || ''}`;
          const existingDbItem = dbMap.get(key);

          if (existingDbItem) {
            // যদি একই প্রোডাক্ট দুই জায়গাতেই থাকে, তবে সর্বোচ্চ কোয়ান্টিটি সেট করুন
            existingDbItem.quantity = Math.max(existingDbItem.quantity, localItem.quantity);
          } else {
            // যদি প্রোডাক্টটি ডাটাবেজে না থাকে, তবে নতুন হিসেবে যোগ করুন
            finalItems.push(localItem);
          }
        });
      }

      setCartItems(finalItems);
      localStorage.setItem('nomad_cart', JSON.stringify(finalItems));

      // মার্জড কার্টটি ডাটাবেজে সিঙ্ক করে দিন
      if (finalItems.length > 0) {
        await syncToDatabase(uid, finalItems);
      }
    };

    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id || null;
      setUserId(uid);
      if (uid) loadCartForUser(uid);
    });

    // Auth State Change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id || null;
      setUserId(uid);

      if (event === 'SIGNED_IN' && uid) {
        hasMerged.current = false; // রিসেট করা হলো যাতে নতুন করে মার্জ হতে পারে
        await loadCartForUser(uid);
      } 

      if (event === 'SIGNED_OUT' || !uid) {
        setCartItems([]);
        localStorage.removeItem('nomad_cart');
        hasMerged.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // =================== AUTO SYNC TO DB ===================
  const syncToDatabase = async (uid: string, items: CartItem[]) => {
    // পুরোনো রেকর্ড মুছে নতুন রেকর্ড ইনসার্ট করা হচ্ছে
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
  };

  useEffect(() => {
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    // এখানে কন্ডিশন থেকে 'cartItems.length > 0' বাদ দেওয়া হয়েছে যাতে ফাঁকা কার্টও ডাটাবেজে সিঙ্ক হয়
    if (userId) {
      const timeout = setTimeout(() => {
        syncToDatabase(userId, cartItems);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [cartItems, userId]);

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
      await supabase.from('cart_items').delete().eq('user_id', userId);
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
