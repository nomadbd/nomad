import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  size?: string;  // অপশনাল রাখা হলো, ইনপুট না দিলে ডেটা আসবে না
  color?: string; // অপশনাল রাখা হলো, ইনপুট না দিলে ডেটা আসবে না
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  incrementQuantity: (id: string) => Promise<void>; // আদি সিগনেচার অক্ষুণ্ণ
  decrementQuantity: (id: string) => Promise<void>; // আদি সিগনেচার অক্ষুণ্ণ
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
          .select('product_id, name, price, image_url, quantity, size, color')
          .eq('user_id', userId);

        if (data && !error) {
          const formattedItems: CartItem[] = data.map((item) => ({
            id: item.product_id,
            name: item.name,
            price: Number(item.price),
            image_url: item.image_url,
            quantity: item.quantity,
            size: item.size || undefined,   // কোনো ডিফল্ট ভ্যালু থ্রু করবে না
            color: item.color || undefined, // কোনো ডিফল্ট ভ্যালু থ্রু করবে না
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

  const addToCart = async (product: Omit<CartItem, 'quantity'>) => {
    let updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex((item) => item.id === product.id);

    if (existingItemIndex > -1) {
      return;
    }

    updatedCart.push({ ...product, quantity: 1 });
    setCartItems(updatedCart);

    if (userId) {
      await supabase.from('cart_items').upsert({
        user_id: userId, product_id: product.id, name: product.name,
        price: product.price, image_url: product.image_url, quantity: 1,
        size: product.size || null, color: product.color || null
      }, { onConflict: 'user_id,product_id' });
    } else {
      localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
    }
  };

  const incrementQuantity = async (id: string) => {
    let updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex((item) => item.id === id);

    if (existingItemIndex > -1) {
      const newQuantity = updatedCart[existingItemIndex].quantity + 1;
      updatedCart[existingItemIndex].quantity = newQuantity;
      setCartItems(updatedCart);

      if (userId) {
        await supabase.from('cart_items').update({ quantity: newQuantity }).eq('user_id', userId).eq('product_id', id);
      } else {
        localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
      }
    }
  };

  const decrementQuantity = async (id: string) => {
    let updatedCart = [...cartItems];
    const existingItemIndex = updatedCart.findIndex((item) => item.id === id);

    if (existingItemIndex > -1) {
      const currentQty = updatedCart[existingItemIndex].quantity;

      if (currentQty > 1) {
        const newQuantity = currentQty - 1;
        updatedCart[existingItemIndex].quantity = newQuantity;
        setCartItems(updatedCart);

        if (userId) {
          await supabase.from('cart_items').update({ quantity: newQuantity }).eq('user_id', userId).eq('product_id', id);
        } else {
          localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
        }
      } else {
        updatedCart = updatedCart.filter((item) => item.id !== id);
        setCartItems(updatedCart);

        if (userId) {
          await supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', id);
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
