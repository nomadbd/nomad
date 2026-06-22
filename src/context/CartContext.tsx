import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export interface CartItem {
  id: string; 
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
  
  // 📱 মোবাইলে লাইভ স্ট্যাটাস দেখার জন্য স্টেট
  const [mobileLog, setMobileLog] = useState<string>("সিস্টেম চালু হচ্ছে...");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setMobileLog(`শুরুর সেশন চেক: ${session?.user?.id ? "লগইন আছেন ✅" : "গেস্ট মোড 🌐"}`);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setMobileLog(`লগইন স্টেট পরিবর্তন: ${session?.user?.id ? "লগইন হয়েছেন ✅" : "লগআউট 🌐"}`);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadCart = async () => {
      if (userId) {
        setMobileLog("সুপাবেজ থেকে কার্ট ডাটা আনা হচ্ছে...");
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
          setMobileLog(`সুপাবেজ থেকে ${formattedItems.length}টি প্রোডাক্ট লোড হয়েছে।`);
        } else if (error) {
          setMobileLog(`কার্ট লোড এরর: ${error.message}`);
        }
      } else {
        const localCart = localStorage.getItem('nomad_guest_cart');
        setCartItems(localCart ? JSON.parse(localCart) : []);
        setMobileLog("লোকাল স্টোরেজ (গেস্ট মোড) থেকে কার্ট লোড হয়েছে।");
      }
    };

    loadCart();
  }, [userId]);

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
      setMobileLog("সুপাবেজে ডাটা পাঠানোর চেষ্টা করা হচ্ছে...");
      const { error } = await supabase.from('cart_items').upsert({
        user_id: userId,
        product_id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity: newQuantity
      }, { onConflict: 'user_id,product_id' });

      if (error) {
        setMobileLog(`❌ সুপাবেজ এরর: ${error.message} (${error.details || 'No details'})`);
      } else {
        setMobileLog("🎉 সুপাবেজে সফলভাবে সেভ হয়েছে!");
      }
    } else {
      setMobileLog("⚠️ লগইন নেই! লোকাল স্টোরেজে সেভ হলো।");
      localStorage.setItem('nomad_guest_cart', JSON.stringify(updatedCart));
    }
  };

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

      {/* 📱 মোবাইল লাইভ কনসোল প্যানেল (টেস্টিং শেষ হলে এই অংশটুকু ডিলিট করে দেব) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#000000',
        color: '#00ff00',
        padding: '12px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 99999,
        borderTop: '2px solid #222',
        textAlign: 'center',
        opacity: 0.9
      }}>
        <span style={{ color: '#888' }}>[NOMAD DEBUGGER]:</span> {mobileLog}
      </div>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
