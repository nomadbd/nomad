import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext'; 

// ১. TypeScript Interface - প্রোডাক্ট কলামের টাইপ
interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  created_at: string;
}

// 🛒 ২. ইনলাইন বাটন কম্পোনেন্ট (সম্পূর্ণ গ্লোবাল স্টেটের সাথে সিঙ্কড)
interface ButtonProps {
  product: Product;
  disabled: boolean;
}

const AddToCartInlineButton: React.FC<ButtonProps> = ({ product, disabled }) => {
  // গ্লোবাল কার্ট কনটেক্সট থেকে cartItems, addToCart এবং setIsCartOpen নিয়ে আসা হলো
  const { cartItems, addToCart, setIsCartOpen } = useCart();
  const [isPressed, setIsPressed] = useState(false);

  // আউট অফ স্টক হলে সরাসরি SOLD OUT দেখাবে
  if (disabled) {
    return (
      <button disabled style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#444', padding: '8px 16px', fontSize: '11px', letterSpacing: '1.5px', cursor: 'not-allowed', textTransform: 'uppercase', fontWeight: '600' }}>
        SOLD OUT
      </button>
    );
  }

  // ✨ মোস্ট ইম্পর্ট্যান্ট লাইন: এই প্রোডাক্টটি কার্ট লিস্টে অলরেডি আছে কি না তা চেক করা
  const isInCart = cartItems.some((item: any) => item.id === product.id);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    if (isInCart) {
      // ⚡ অলরেডি কার্টে থাকলে ক্লিক করলে সরাসরি কার্ট ওভারলে ওপেন হবে
      setIsCartOpen(true);
    } else {
      // 🛒 কার্টে না থাকলে যুক্ত হবে (যুক্ত হওয়ার সাথে সাথে গ্লোবাল স্টেট চেঞ্জ হয়ে বাটন নিজে থেকেই VIEW BAG হয়ে যাবে)
      addToCart(product);
    }
  };

  // 🎨 লাক্সারি মোনাক্রোম স্টাইল: অলরেডি কার্টে থাকলে সাদা ব্যাকগ্রাউন্ড ও কালো লেখা (VIEW BAG)
  const buttonText = isInCart ? 'VIEW BAG' : 'ADD TO CART';
  const backgroundColor = isInCart ? '#fff' : 'transparent';
  const textColor = isInCart ? '#000' : '#fff';
  const borderColor = isInCart ? '#fff' : '#333';

  return (
    <button
      onClick={handleClick}
      style={{
        background: backgroundColor,
        border: `1px solid ${borderColor}`,
        color: textColor,
        padding: '8px 16px',
        fontSize: '11px',
        letterSpacing: '1.5px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontWeight: '600',
        transition: 'all 0.2s ease-in-out', // রঙ পরিবর্তনের স্মুথ অ্যানিমেশন
        outline: 'none',
        transform: isPressed ? 'scale(0.94)' : 'scale(1)',
        opacity: isPressed ? 0.8 : 1,
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {buttonText}
    </button>
  );
};


// 📦 প্রধান কম্পোনেন্ট
export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ডাটাবেজ থেকে প্রোডাক্ট ফেচ করা
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error.message);
    } else if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px' }}>LOADING PRODUCTS...</p>;
  }

  if (products.length === 0) {
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px' }}>NO PRODUCTS AVAILABLE.</p>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '40px 30px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {products.map((product) => (
        <div key={product.id} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

          {/* প্রোডাক্ট ইমেজ কন্টেইনার */}
          <div style={{ 
            width: '100%', 
            height: '320px', 
            backgroundColor: '#111', 
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #1a1a1a'
          }}>
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#333', fontSize: '11px' }}>NO IMAGE</div>
            )}

            {product.stock_quantity <= 0 && (
              <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#ff4444', color: '#fff', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                OUT OF STOCK
              </div>
            )}
          </div>

          {/* প্রোডাক্ট ডিটেইলস */}
          <div style={{ marginTop: '15px' }}>
            <p style={{ fontSize: '11px', color: '#666', letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 5px 0' }}>
              {product.category}
            </p>
            <h3 style={{ fontSize: '15px', fontWeight: '500', color: '#fff', margin: '0 0 5px 0', letterSpacing: '0.5px' }}>
              {product.name}
            </h3>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 15px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>
                ৳{product.price}
              </span>

              {/* ⚡ নতুন জাদুকরী বাটন যা গ্লোবাল কার্ট ট্র্যাক করে */}
              <AddToCartInlineButton 
                product={product} 
                disabled={product.stock_quantity <= 0}
              />
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
