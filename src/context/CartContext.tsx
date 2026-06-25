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
  incrementQuantity: (id: string, color?: string, size?: string) => void;
  decrementQuantity: (id: string, color?: string, size?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ১. লোকাল স্টোরেজ থেকে ইনস্ট্যান্ট ডাটা লোড (রিফ্রেশ প্রোটেকশন)
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

  // ২. ডাটাবেজ থেকে লোড এবং কালার/সাইজ সুরক্ষার লজিক
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
          const localCart = localStorage.getItem('nomad_cart');
          const localItems: CartItem[] = localCart ? JSON.parse(localCart) : [];

          const dbItems = data.map((item: any) => {
            const matchingLocal = localItems.find(l => l.id === item.product_id);

            return {
              id: item.product_id, 
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              // সব ধরনের সম্ভাব্য নামকরণ (Naming Conventions) থেকে কালার ও সাইজ রিকভারি
              color: item.color || item.selected_color || item.selectedColor || matchingLocal?.color || undefined, 
              size: item.size || item.selected_size || item.selectedSize || matchingLocal?.size || undefined,   
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

  // ৩. ডাটাবেজ ও লোকাল স্টোরেজ সিঙ্ক
  useEffect(() => {
    if (userId && !isLoadedFromDB) return; 

    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    const syncToDB = async () => {
      if (!userId) return;

      try {
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
      } catch (err) {
        console.error("DB Sync Error: ", err);
      }
    };

    const debounce = setTimeout(syncToDB, 500);
    return () => clearTimeout(debounce);
  }, [cartItems, userId, isLoadedFromDB]);

  // ৪. ডিফেন্সিভ অ্যাড-টু-কার্ট (যাতে কোনোভাবেই কালার/সাইজ মিস না হয়)
  const addToCart = (product: any, color?: string, size?: string) => {
    // প্রোডাক্ট অবজেক্টের ভেতর থেকে বা প্যারামিটার থেকে কালার ও সাইজ খুঁজে নেওয়া
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

  // ৫. কোয়ান্টিটি বাড়ানোর লজিক (ভেরিয়েন্টসহ)
  const incrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev.map(item => {
      const isMatch = item.id === id && 
        (color === undefined || item.color === color) && 
        (size === undefined || item.size === size);
      return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
    }));
  };

  // 🎯 ফিক্সড মাইনাস (-) লজিক: ১ থেকে মাইনাস করলে কার্ট থেকে রিমুভ হয়ে যাবে
  const decrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev
      .map(item => {
        const isMatch = item.id === id && 
          (color === undefined || item.color === color) && 
          (size === undefined || item.size === size);
        return isMatch ? { ...item, quantity: item.quantity - 1 } : item;
      })
      .filter(item => item.quantity > 0) // কোয়ান্টিটি ০ হয়ে গেলে আইটেমটি কার্ট থেকে মুছে যাবে
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
