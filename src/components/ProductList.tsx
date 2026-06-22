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

// 🛒 ২. ইনলাইন বাটন কম্পোনেন্ট
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


// 📦 ৩. প্রধান প্রোডাক্টリスト কম্পোনেন্ট
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
    <div style={{ backgroundColor: '#000', width: '100%', boxSizing: 'border-box' }}>
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        const isExpanded = !!expandedCategories[category];

        return (
          // 📱 মোবাইল ও ডেক্সটপের রেসপনসিভ প্যাডিং ক্লাস অ্যাড করা হয়েছে
          <div key={category} className="showroom-section" style={{ marginBottom: '60px' }}>
            
            {/* 👑 হেডার সেকশন */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              borderBottom: '1px solid #141414',
              paddingBottom: '12px',
              // বাটনের টেক্সট সমান রাখতে দুই পাশে সামান্য সেফ-প্যাডিং
              paddingLeft: '15px',
              paddingRight: '15px'
            }}>
              <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                {category}
              </h3>
              
              {/* 🎯 ফিক্সড উইথ ও ক্লিন বোতাম (কোনো অতিরিক্ত তীর বা মাইনাস চিহ্ন নেই, কোনো ঝাঁকুনি হবে না) */}
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
                  width: '100px',        // 💡 ফিক্সড উইথ যা টেক্সট পরিবর্তনের সময় লেআউট শিফট আটকাবে
                  textAlign: 'right',
                  fontFamily: 'monospace'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                {isExpanded ? 'SEE LESS' : 'SEE MORE'}
              </button>
            </div>

            {/* ⚡ প্রোডাক্ট কন্টেইনার */}
            <div 
              className="showroom-row-container"
              style={
                isExpanded 
                  ? {
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '40px 20px',
                      padding: '0 15px'
                    }
                  : {
                      display: 'flex', 
                      overflowX: 'auto', 
                      scrollSnapType: 'x mandatory', 
                      scrollBehavior: 'smooth',
                      gap: '15px', // মোবাইলে কার্ডের মাঝের গ্যাপ কিছুটা কমানো হয়েছে যাতে ফুল স্ক্রিন ফিল আসে
                      WebkitOverflowScrolling: 'touch',
                      paddingBottom: '10px'
                    }
              }
            >
              {categoryProducts.map((product) => (
                <div 
                  key={product.id} 
                  className={isExpanded ? "" : "showroom-card-item"}
                  style={{ 
                    scrollSnapAlign: 'start',
                    boxSizing: 'border-box',
                    display: 'flex', 
                    flexDirection: 'column', 
                    width: '100%' 
                  }}
                >
                  {/* ইমেজ কন্টেইনার */}
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

                  {/* প্রোডাক্ট ইনফো (ডাইনামিক টেক্সট অ্যালাইনমেন্ট সেফটিসহ) */}
                  <div style={{ marginTop: '15px', padding: '0 15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
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

      {/* 🎨 রেসপনসিভ ও পিওর ফুল-উইথ স্ক্রিন হ্যান্ডলিং সিএসএস */}
      <style>{`
        /* 📱 মোবাইলের জন্য ডিফল্ট সেটিংস (পুরো স্ক্রিন কভার করবে) */
        .showroom-section {
          padding: 0 0px; 
        }
        .showroom-card-item {
          min-width: 100vw; /* স্ক্রিনের পুরো চওড়া অংশ নেবে */
          padding: 0 15px;  /* দুই পাশে শোরুম স্ট্যান্ডার্ড বর্ডার গ্যাপ */
        }

        /* 💻 ডেক্সটপের জন্য রেসপনসিভ লেআউট */
        @media (min-width: 768px) {
          .showroom-section {
            padding: 0 25px; /* ডেক্সটপে দুই পাশে সুন্দর স্পেস */
          }
          .showroom-card-item {
            min-width: 290px; 
            max-width: 310px;
            padding: 0;
          }
        }

        /* স্ক্রলবার হাইড রাখার গ্লোবাল কোড */
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
