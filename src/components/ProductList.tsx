import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext'; 

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

interface ButtonProps {
  product: Product;
  disabled: boolean;
}

// 🛒 ২. ইনলাইন বাটন কম্পোনেন্ট (অপরিবর্তিত)
const AddToCartInlineButton: React.FC<ButtonProps> = ({ product, disabled }) => {
  const { cartItems, addToCart, setIsCartOpen } = useCart();
  const [isPressed, setIsPressed] = useState(false);

  if (disabled) {
    return (
      <button disabled style={{ background: 'transparent', border: '1px solid #1a1a1a', color: '#444', padding: '8px 16px', fontSize: '11px', letterSpacing: '1.5px', cursor: 'not-allowed', textTransform: 'uppercase', fontWeight: '600' }}>
        SOLD OUT
      </button>
    );
  }

  const isInCart = cartItems.some((item: any) => item.id === product.id);

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    if (isInCart) {
      setIsCartOpen(true);
    } else {
      addToCart(product);
    }
  };

  const buttonText = isInCart ? 'VIEW BAG' : 'ADD TO CART';
  const borderColor = isInCart ? '#fff' : '#333';

  return (
    <button
      onClick={handleClick}
      style={{
        background: 'transparent',
        border: `1px solid ${borderColor}`,
        color: '#fff',
        padding: '8px 16px',
        fontSize: '11px',
        letterSpacing: '1.5px',
        cursor: 'pointer',
        textTransform: 'uppercase',
        fontWeight: '600',
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
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


// 📦 ৩. প্রধান প্রোডাক্ট লিস্ট কম্পোনেন্ট
export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px', padding: '40px' }}>LOADING PRODUCTS...</p>;
  }

  if (products.length === 0) {
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px', padding: '40px' }}>NO PRODUCTS AVAILABLE.</p>;
  }

  const categories = Array.from(new Set(products.map(p => p.category)));

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div style={{ backgroundColor: '#000', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        const isExpanded = !!expandedCategories[category];

        return (
          <div key={category} className="showroom-section" style={{ marginBottom: '50px' }}>
            
            {/* 👑 হেডার সেকশন */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              borderBottom: '1px solid #141414',
              paddingBottom: '12px',
              paddingLeft: '15px',
              paddingRight: '15px'
            }}>
              <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                {category}
              </h3>
              
              <button 
                onClick={() => toggleCategoryExpand(category)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '11px', 
                  letterSpacing: '2px', 
                  cursor: 'pointer', 
                  textTransform: 'uppercase', 
                  opacity: 0.7, 
                  transition: 'opacity 0.2s',
                  width: '100px',        
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                {isExpanded ? 'SEE LESS' : 'SEE MORE'}
              </button>
            </div>

            {/* ⚡ প্রোডাক্ট কন্টেইনার (লেআউট শিফট এবং জুম সমস্যা স্থায়ীভাবে দূর করতে আপডেট করা হয়েছে) */}
            <div 
              className="showroom-row-container"
              style={
                isExpanded 
                  ? {
                      display: 'flex',
                      flexWrap: 'wrap', // গ্রিডের বদলে ফ্লেক্স-র‌্যাপ ব্যবহার করা হয়েছে যাতে কার্ডের সাইজ সবসময় ফিক্সড থাকে
                      gap: '40px 0px',   
                      width: '100%'
                    }
                  : {
                      display: 'flex', 
                      overflowX: 'auto', 
                      scrollSnapType: 'x mandatory', 
                      scrollBehavior: 'smooth',
                      WebkitOverflowScrolling: 'touch',
                      width: '100%'
                    }
              }
            >
              {categoryProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="showroom-card-item"
                  style={{ 
                    scrollSnapAlign: 'start',
                    boxSizing: 'border-box',
                    display: 'flex', 
                    flexDirection: 'column'
                  }}
                >
                  {/* ইমেজ কন্টেইনার (বামে ফাঁকা জায়গা দূর করতে উইথ 100% লকড) */}
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '3/4', 
                    backgroundColor: '#111', 
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #161616'
                  }}>
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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

                  {/* প্রোডাক্ট ইনফো */}
                  <div style={{ marginTop: '15px', padding: '0 5px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'normal', color: '#e5e5e5', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
                      {product.name}
                    </h3>
                    
                    <p style={{ fontSize: '13px', color: '#888', margin: '0 0 15px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingBottom: '5px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '500', color: '#fff', fontFamily: 'monospace' }}>
                        ৳{product.price}
                      </span>

                      <AddToCartInlineButton 
                        product={product} 
                        disabled={product.stock_quantity <= 0}
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        );
      })}

      {/* 🎨 পিওর ফুল-উইথ ও জিরো-ঝাঁকুনি সিএসএস লজিক */}
      <style>{`
        .showroom-section {
          padding: 0 0px; 
        }

        /* 📱 মোবাইলের জন্য নিখুঁত ফুল-উইথ সেটিংস (উভয় স্টেটেই ইমেজ সাইজ হুবহু ১টি কার্ডের সমান থাকবে) */
        .showroom-card-item {
          width: 100vw;
          min-width: 100vw;
          max-width: 100vw;
          padding: 0 15px; /* ভিউপোর্ট এর দুই পাশে ১.৫ রেম লাক্সারি বর্ডার গ্যাপ */
        }

        /* 💻 ডেক্সটপের জন্য রেসপনসিভ সাইজিং */
        @media (min-width: 768px) {
          .showroom-section {
            padding: 0 15px; 
          }
          .showroom-card-item {
            width: 300px;
            min-width: 300px;
            max-width: 300px;
            padding: 0 10px;
          }
        }

        /* আল্ট্রা-স্মুথ ইউআই এর জন্য কাস্টম স্ক্রলবার হাইড */
        .showroom-row-container::-webkit-scrollbar {
          display: none;
        }
        .showroom-row-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
