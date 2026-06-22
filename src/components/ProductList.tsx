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

// 🛒 ২. ইনলাইন বাটন কম্পোনেন্ট (এটি প্রতিটি প্রোডাক্টের স্টেট আলাদা রাখবে এবং ডাবল-ক্লিক হ্যান্ডেল করবে)
interface ButtonProps {
  product: Product;
  addToCart: (product: any) => void;
  setIsCartOpen: (isOpen: boolean) => void;
  disabled: boolean;
}

const AddToCartInlineButton: React.FC<ButtonProps> = ({ product, addToCart, setIsCartOpen, disabled }) => {
  const [buttonText, setButtonText] = useState('ADD TO CART');
  const [isPressed, setIsPressed] = useState(false);
  const lastClickTime = useRef<number>(0);

  // আউট অফ স্টক হলে সরাসরি SOLD OUT দেখাবে
  if (disabled) {
    return (
      <button disabled style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#444', padding: '8px 16px', fontSize: '11px', letterSpacing: '1.5px', cursor: 'not-allowed', textTransform: 'uppercase', fontWeight: '600' }}>
        SOLD OUT
      </button>
    );
  }

  const handleCustomClick = () => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime.current;

    if (timeDiff < 300) {
      // ⚡ ডাবল ক্লিক সনাক্ত হলে সরাসরি কার্ট ওপেন হবে
      setIsCartOpen(true);
    } else {
      // 🛒 সিঙ্গেল ক্লিকে কার্টে যুক্ত হবে এবং বাটনে ফিডব্যাক দেখাবে
      addToCart(product);

      setButtonText('ADDED ✓');
      setIsPressed(true);

      // ১ সেকেন্ড পর বাটন আবার আগের অবস্থায় ফিরবে
      setTimeout(() => setButtonText('ADD TO CART'), 1000);
      setTimeout(() => setIsPressed(false), 150);
    }

    lastClickTime.current = currentTime;
  };

  return (
    <button
      onClick={handleCustomClick}
      style={{
        background: 'transparent',
        border: buttonText === 'ADDED ✓' ? '1px solid #10b981' : '1px solid #333',
        color: buttonText === 'ADDED ✓' ? '#10b981' : '#fff',
        padding: '8px 16px',
        fontSize: '11px',
        letterSpacing: '1.5px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontWeight: '600',
        transition: 'all 0.15s ease-in-out',
        outline: 'none',
        
        // ক্লিকে হালকা অ্যানিমেশন রেসপন্স
        transform: isPressed ? 'scale(0.94)' : 'scale(1)',
        opacity: isPressed ? 0.7 : 1,
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

  // ⚡ কার্ট ওপেন করা এবং প্রোডাক্ট যোগ করার গ্লোবাল ফাংশন নিয়ে আসা হলো
  const { addToCart, setIsCartOpen } = useCart();

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

              {/* ⚡ আপডেটেড বাটন: পুরনো সাধারণ বাটনের জায়গায় কাস্টম ফিডব্যাক বাটনটি কল করা হলো */}
              <AddToCartInlineButton 
                product={product} 
                addToCart={addToCart} 
                setIsCartOpen={setIsCartOpen}
                disabled={product.stock_quantity <= 0}
              />
            </div>
          </div>

        </div>
      ))}
    </div>
  );
}
