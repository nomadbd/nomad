import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface CartItem {
  id: string; // মূলত product_id হিসেবে কাজ করবে
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ১. ইউজারের লগইন সেশন ট্র্যাক করা
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ২. ইউজার অনুযায়ী সুপাবেজ বা লোকাল স্টোরেজ থেকে কার্ট ডাটা আনা
  useEffect(() => {
    const loadCart = async () => {
      if (userId) {
        const { data, error } = await supabase
          .from('cart_items')
          .select('product_id, name, price, image_url, quantity')
          .eq('user_id', userId);

        if (data && !error) {
          const formattedItems: CartItem[] = data.map((item) => ({
            id: item.product_id,
            name: item.name,
            price: Number(item.price),
            image_url: item.image_url,
            quantity: item.quantity,
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

  // ৩. কার্টে প্রোডাক্ট যোগ করা (Upsert/Save)
  const addToCart = async (product: Omit<CartItem, 'quantity'>) => {
    let updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex((item) => item.id === product.id);
    let newQuantity = 1;

    if (existingItemIndex > -1) {
      newQuantity = updatedCart[existingItemIndex].quantity + 1;
      updatedCart[existingItemIndex].quantity = newQuantity;
    } else {
      updatedCart.push({ ...product, quantity: 1 });
    }

    setCartItems(updatedCart);

    if (userId) {
      await supabase.from('cart_items').upsert({
        user_id: userId,
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: newQuantity
      }, { onConflict: 'user_id,product_id' });
    } else {
      localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
    }
  };

  // ৪. কার্ট থেকে প্রোডাক্ট রিমুভ করা
  const removeFromCart = async (id: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);
    setCartItems(updatedCart);

    if (userId) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', id);
    } else {
      localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
    }
  };

  // ৫. পুরো কার্ট খালি করা
  const clearCart = async () => {
    setCartItems([]);
    if (userId) {
      await supabase.from('cart_items').delete().eq('user_id', userId);
    } else {
      localStorage.removeItem('nomad_guest_cart');
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, isCartOpen, setIsCartOpen, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
