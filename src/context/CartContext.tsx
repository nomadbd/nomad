import React, { createContext, useContext, useState, useEffect } from 'react';
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
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ১. ব্রাউজার থেকে ইনস্ট্যান্ট লোড (রিফ্রেশ প্রোটেকশন)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nomad_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadedFromDB, setIsLoadedFromDB] = useState(false);

  // ২. ডাটাবেজ থেকে কার্ট লোড এবং কালার/সাইজ রিকভারি মার্জ লজিক
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

        if (!error && data && data.length > 0) {
          // 🎯 লোকাল স্টোরেজের ব্যাকআপ ডাটা রিড করা যেন কালার/সাইজ হারিয়ে না যায়
          const localCart = localStorage.getItem('nomad_cart');
          const localItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

          const dbItems = data.map((item: any) => {
            // লোকাল কার্ট থেকে ম্যাচিং প্রোডাক্ট খুঁজে বের করা
            const matchingLocal = localItems.find(l => l.id === item.product_id);

            return {
              id: item.product_id, 
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              // ⚡ ডাটাবেজে না থাকলেও লোকাল স্টোরেজের ব্যাকআপ থেকে কালার/সাইজ উদ্ধার করা হবে
              color: item.color || item.selected_color || matchingLocal?.color || undefined, 
              size: item.size || item.selected_size || matchingLocal?.size || undefined,   
              image_url: item.image_url,
              product_media: item.product_media ? JSON.parse(item.product_media) : undefined
            };
          });
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

  // ৩. অটো-সেভ ও সিঙ্ক (কালার ও সাইজ সুরক্ষিত রেখে)
  useEffect(() => {
    if (userId && !isLoadedFromDB) return; 

    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    const syncToDB = async () => {
      if (!userId) return;

      await supabase.from('cart_items').delete().eq('user_id', userId);

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
    };

    const debounce = setTimeout(syncToDB, 500);
    return () => clearTimeout(debounce);
  }, [cartItems, userId, isLoadedFromDB]);

  // ৪. কার্ট অ্যাকশনস (অরিজিনাল আইডি ব্যাকআপ সহ)
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
          id: product.id, 
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
