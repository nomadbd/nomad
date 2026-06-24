import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  size: string;   // নতুন যুক্ত করা হয়েছে
  color: string;  // নতুন যুক্ত করা হয়েছে
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  incrementQuantity: (id: string, size: string, color: string) => Promise<void>; // প্যারামিটার আপডেট
  decrementQuantity: (id: string, size: string, color: string) => Promise<void>; // প্যারামিটার আপডেট
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadCart = async () => {
      if (userId) {
        const { data, error } = await supabase
          .from('cart_items')
          .select('product_id, name, price, image_url, quantity, size, color') // size, color সিলেক্ট করা হলো
          .eq('user_id', userId);

        if (data && !error) {
          const formattedItems: CartItem[] = data.map((item) => ({
            id: item.product_id,
            name: item.name,
            price: Number(item.price),
            image_url: item.image_url,
            quantity: item.quantity,
            size: item.size || 'M',
            color: item.color || 'BLACK',
          }));
          setCartItems(formattedItems);
        }
      } else {
        const localCart = localStorage.getItem('nomad_guest_cart');
        setCartItems(localCart ? JSON.parse(localCart) : []);
      }
    };
    loadCart();
  }, [userId]);

  // 🛒 মেইন পেজের বাটন: আইডি, সাইজ এবং কালার সব মিললে তবেই ডুপ্লিকেট আটকাবে
  const addToCart = async (product: Omit<CartItem, 'quantity'>) => {
    let updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex(
      (item) => item.id === product.id && item.size === product.size && item.color === product.color
    );

    // অলরেডি এই নির্দিষ্ট সাইজ ও কালারের আইটেম কার্টে থাকলে ফাংশন এখানেই স্টপ হবে
    if (existingItemIndex > -1) {
      return;
    }

    // কার্টে না থাকলে একদম ফ্রেশ ১টি কোয়ান্টিটি নিয়ে যুক্ত হবে
    updatedCart.push({ ...product, quantity: 1 });
    setCartItems(updatedCart);

    if (userId) {
      await supabase.from('cart_items').upsert({
        user_id: userId, product_id: product.id, name: product.name,
        price: product.price, image_url: product.image_url, quantity: 1,
        size: product.size, color: product.color
      }, { onConflict: 'user_id,product_id,size,color' }); // কম্পোজিট অন-কনফ্লিক্ট কনস্ট্রেইন্ট
    } else {
      localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
    }
  };

  // ➕ কার্টের ভেতরের বাটন: নির্দিষ্ট আইডি, সাইজ ও কালার ম্যাচ করে পরিমাণ ১ বাড়বে
  const incrementQuantity = async (id: string, size: string, color: string) => {
    let updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex(
      (item) => item.id === id && item.size === size && item.color === color
    );

    if (existingItemIndex > -1) {
      const newQuantity = updatedCart[existingItemIndex].quantity + 1;
      updatedCart[existingItemIndex].quantity = newQuantity;
      setCartItems(updatedCart);

      if (userId) {
        await supabase.from('cart_items')
          .update({ quantity: newQuantity })
          .eq('user_id', userId)
          .eq('product_id', id)
          .eq('size', size)
          .eq('color', color);
      } else {
        localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
      }
    }
  };

  // ➖ কার্টের ভেতরের বাটন: পরিমাণ কমবে বা রিমুভ হবে
  const decrementQuantity = async (id: string, size: string, color: string) => {
    let updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex(
      (item) => item.id === id && item.size === size && item.color === color
    );

    if (existingItemIndex > -1) {
      const currentQty = updatedCart[existingItemIndex].quantity;

      if (currentQty > 1) {
        const newQuantity = currentQty - 1;
        updatedCart[existingItemIndex].quantity = newQuantity;
        setCartItems(updatedCart);

        if (userId) {
          await supabase.from('cart_items')
            .update({ quantity: newQuantity })
            .eq('user_id', userId)
            .eq('product_id', id)
            .eq('size', size)
            .eq('color', color);
        } else {
          localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
        }
      } else {
        updatedCart = updatedCart.filter(
          (item) => !(item.id === id && item.size === size && item.color === color)
        );
        setCartItems(updatedCart);

        if (userId) {
          await supabase.from('cart_items')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', id)
            .eq('size', size)
            .eq('color', color);
        } else {
          localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
        }
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (userId) {
      await supabase.from('cart_items').delete().eq('user_id', userId);
    } else {
      localStorage.removeItem('nomad_guest_cart');
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
