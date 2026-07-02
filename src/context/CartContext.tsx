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
      // প্রথমে চেক করবে লগইন করা কার্টের ক্যাশ আছে কিনা, না থাকলে গেস্ট কার্ট চেক করবে
      const savedCart = localStorage.getItem('nomad_cart');
      if (savedCart) return JSON.parse(savedCart);
      
      const guestCart = localStorage.getItem('nomad_guest_cart');
      return guestCart ? JSON.parse(guestCart) : [];
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);

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

  // =================== FETCH & SAFE MERGE CART (অন্য ফোনের জন্য নিরাপদ) ===================
  useEffect(() => {
    if (!userId) {
      setLoadingCart(false);
      return;
    }

    const loadCartForUser = async () => {
      setLoadingCart(true);
      try {
        // ১. ডাটাবেজ থেকে এই ইউজারের কার্ট নিয়ে আসা (অন্য ফোন থেকে আসলেও ডাটা পাওয়া যাবে)
        const { data: dbItems, error } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', userId);

        if (error) throw error;

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

        // ২. গেস্ট কার্ট চেক করা (লগইন করার ঠিক আগের মুহূর্তের প্রোডাক্ট মার্জ করার জন্য)
        const guestStr = localStorage.getItem('nomad_guest_cart');
        
        if (guestStr) {
          const guestCart: CartItem[] = JSON.parse(guestStr);
          
          if (guestCart.length > 0) {
            for (const guestItem of guestCart) {
              const existingItem = finalItems.find(item => 
                item.id === guestItem.id && 
                item.color === guestItem.color && 
                item.size === guestItem.size
              );

              if (existingItem) {
                // পরিমাণ বাড়িয়ে ডাটাবেজ আপডেট করা
                existingItem.quantity += guestItem.quantity;
                await supabase
                  .from('cart_items')
                  .update({ quantity: existingItem.quantity })
                  .eq('user_id', userId)
                  .eq('product_id', guestItem.id)
                  .eq('color', guestItem.color || null)
                  .eq('size', guestItem.size || null);
              } else {
                // নতুন প্রোডাক্ট ডাটাবেজে যুক্ত করা
                await supabase.from('cart_items').insert({
                  user_id: userId,
                  product_id: guestItem.id,
                  name: guestItem.name,
                  price: guestItem.price,
                  quantity: guestItem.quantity,
                  color: guestItem.color || null,
                  size: guestItem.size || null,
                  image_url: guestItem.image_url,
                });
                finalItems.push(guestItem);
              }
            }
            // মার্জ শেষ! এবার গেস্ট কার্ট রিমুভ করে দেওয়া হলো যেন রিফ্রেশে ডাবল মার্জ না হয়
            localStorage.removeItem('nomad_guest_cart');
          }
        }

        setCartItems(finalItems);
        localStorage.setItem('nomad_cart', JSON.stringify(finalItems));
      } catch (err) {
        console.error("Error loading cart:", err);
      } finally {
        setLoadingCart(false);
      }
    };

    loadCartForUser();
  }, [userId]);

  // =================== AUTO SAVE TO LOCAL STORAGE CACHE ===================
  useEffect(() => {
    if (userId) {
      localStorage.setItem('nomad_cart', JSON.stringify(cartItems));
    } else {
      localStorage.setItem('nomad_guest_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, userId]);

  // =================== CART ACTIONS (REAL-TIME DB SYNC - নো ডিলে, নো ডাটা লস) ===================
  const addToCart = async (product: any, color?: string, size?: string) => {
    const chosenColor = color || product.color || product.selected_color || undefined;
    const chosenSize = size || product.size || product.selected_size || undefined;

    // UI-তে ইনস্ট্যান্ট রেসপন্স পাওয়ার জন্য স্টেট আপডেট
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

    // ইউজার লগইন থাকলে সরাসরি ব্যাকএন্ডে ইনস্ট্যান্ট সেভ (কোনো ৮০০ms ডিলে নেই)
    if (userId) {
      try {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', userId)
          .eq('product_id', product.id)
          .eq('color', chosenColor || null)
          .eq('size', chosenSize || null)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('from', 'cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        } else {
          await supabase.from('cart_items').insert({
            user_id: userId,
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            color: chosenColor || null,
            size: chosenSize || null,
            image_url: product.image_url || product.product_media?.[0]?.media_url,
          });
        }
      } catch (error) {
        console.error("Failed to add to DB cart:", error);
      }
    }
  };

  const incrementQuantity = async (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev.map(item => {
      const match = item.id === id && item.color === color && item.size === size;
      return match ? { ...item, quantity: item.quantity + 1 } : item;
    }));

    if (userId) {
      try {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', userId)
          .eq('product_id', id)
          .eq('color', color || null)
          .eq('size', size || null)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        }
      } catch (error) {
        console.error("Failed to increment in DB:", error);
      }
    }
  };

  const decrementQuantity = async (id: string, color?: string, size?: string) => {
    setCartItems(prev => prev
      .map(item => {
        const match = item.id === id && item.color === color && item.size === size;
        return match ? { ...item, quantity: item.quantity - 1 } : item;
      })
      .filter(item => item.quantity > 0)
    );

    if (userId) {
      try {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', userId)
          .eq('product_id', id)
          .eq('color', color || null)
          .eq('size', size || null)
          .maybeSingle();

        if (existing) {
          if (existing.quantity <= 1) {
            await supabase.from('cart_items').delete().eq('id', existing.id);
          } else {
            await supabase
              .from('cart_items')
              .update({ quantity: existing.quantity - 1 })
              .eq('id', existing.id);
          }
        }
      } catch (error) {
        console.error("Failed to decrement in DB:", error);
      }
    }
  };

  const clearCart = async () => {
    setCartItems([]);
    if (userId) {
      localStorage.removeItem('nomad_cart');
      try {
        await supabase.from('cart_items').delete().eq('user_id', userId);
      } catch (error) {
        console.error("Failed to clear DB cart:", error);
      }
    } else {
      localStorage.removeItem('nomad_guest_cart');
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
