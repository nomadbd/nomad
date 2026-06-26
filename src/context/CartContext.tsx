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

  const hasMergedGuestCart = useRef(false);

  // ====================== AUTH HANDLING ======================
  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
      const currentUserId = session?.user?.id || null;
      setUserId(currentUserId);

      if (event === 'SIGNED_IN' && currentUserId) {
        await mergeGuestCartIntoUser(currentUserId);
      } 
      else if (event === 'SIGNED_OUT' || !currentUserId) {
        setCartItems([]);
        localStorage.removeItem('nomad_cart');
        hasMergedGuestCart.current = false;
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange('INITIAL', session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => subscription.unsubscribe();
  }, []);

  // =================== MERGE GUEST CART ===================
  const mergeGuestCartIntoUser = async (currentUserId: string) => {
    if (hasMergedGuestCart.current) return;
    hasMergedGuestCart.current = true;

    const localCartStr = localStorage.getItem('nomad_cart');
    if (!localCartStr) {
      await fetchUserCart(currentUserId);
      return;
    }

    const localCart: CartItem[] = JSON.parse(localCartStr);

    const { data: dbCart } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', currentUserId);

    let finalCart: CartItem[] = [...localCart];

    if (dbCart && dbCart.length > 0) {
      const dbMap = new Map(
        dbCart.map((item: any) => [`${item.product_id}-${item.color || ''}-${item.size || ''}`, item])
      );

      finalCart = localCart.map(localItem => {
        const key = `${localItem.id}-${localItem.color || ''}-${localItem.size || ''}`;
        const dbItem = dbMap.get(key);
        return dbItem 
          ? { ...localItem, quantity: Math.max(localItem.quantity, dbItem.quantity) }
          : localItem;
      });
    }

    setCartItems(finalCart);
    localStorage.setItem('nomad_cart', JSON.stringify(finalCart));

    await syncFullCartToDB(currentUserId, finalCart);
  };

  const fetchUserCart = async (currentUserId: string) => {
    const { data } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', currentUserId);

    if (data) {
      const mapped = data.map((item: any) => ({
        id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color || undefined,
        size: item.size || undefined,
        image_url: item.image_url,
        product_media: item.product_media ? JSON.parse(item.product_media) : undefined,
      }));

      setCartItems(mapped);
      localStorage.setItem('nomad_cart', JSON.stringify(mapped));
    }
  };

  const syncFullCartToDB = async (currentUserId: string, items: CartItem[]) => {
    await supabase.from('cart_items').delete().eq('user_id', currentUserId);

    if (items.length === 0) return;

    const records = items.map(item => ({
      user_id: currentUserId,
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

  // =================== AUTO SYNC ===================
  useEffect(() => {
    localStorage.setItem('nomad_cart', JSON.stringify(cartItems));

    if (!userId) return;

    const timeout = setTimeout(() => {
      syncFullCartToDB(userId, cartItems);
    }, 700);

    return () => clearTimeout(timeout);
  }, [cartItems, userId]);

  // =================== CART FUNCTIONS ===================
  const addToCart = (product: any, color?: string, size?: string) => {
    const chosenColor = color || product.color || product.selected_color || undefined;
    const chosenSize = size || product.size || product.selected_size || undefined;

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
    setCartItems(prev =>
      prev.map(item => {
        const match = item.id === id &&
          (color === undefined || item.color === color) &&
          (size === undefined || item.size === size);
        return match ? { ...item, quantity: item.quantity + 1 } : item;
      })
    );
  };

  const decrementQuantity = (id: string, color?: string, size?: string) => {
    setCartItems(prev =>
      prev
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