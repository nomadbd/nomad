import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext'; 

// ১. TypeScript Interface
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

// 🛒 ২. ইনলাইন বাটন কম্পোনেন্ট (সংরক্ষিত ও অপরিবর্তিত)
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


// 📦 ৩. প্রধান প্রোডাক্ট লিস্ট কম্পোনেন্ট (শোরুম ও ইন-লাইন গ্রিড সিস্টেমে আপগ্রেড করা)
export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // 🔄 প্রতিটি ক্যাটাগরির এক্সপ্যান্ডেড স্টেট আলাদাভাবে ট্র্যাক করার জন্য অবজেক্ট স্টেট
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
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px', padding: '40px' }}>LOADING শোরুম...</p>;
  }

  if (products.length === 0) {
    return <p style={{ color: '#555', fontSize: '13px', letterSpacing: '1px', padding: '40px' }}>NO PRODUCTS AVAILABLE.</p>;
  }

  // 🗂️ ডাইনামিকালি ইউনিক ক্যাটাগরি লিস্ট তৈরি করা
  const categories = Array.from(new Set(products.map(p => p.category)));

  // সি-মোর বাটন টগল ফাংশন
  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div style={{ backgroundColor: '#000', width: '100%', boxSizing: 'border-box', padding: '20px 0' }}>
      {categories.map((category) => {
        // এই নির্দিষ্ট ক্যাটাগরির প্রোডাক্টগুলো ফিল্টার করা
        const categoryProducts = products.filter(p => p.category === category);
        const isExpanded = !!expandedCategories[category];

        return (
          <div key={category} style={{ marginBottom: '70px', padding: '0px 20px' }}>
            
            {/* 👑 ক্যাটাগরি হেডার এবং "SEE MORE" কন্ট্রোল বাটন */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'baseline', 
              marginBottom: '25px',
              borderBottom: '1px solid #141414',
              paddingBottom: '12px'
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
                  transition: 'opacity 0.2s' 
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                {isExpanded ? 'VIEW LESS —' : 'SEE MORE ↗'}
              </button>
            </div>

            {/* ⚡ প্রোডাক্ট কন্টেইনার: স্টেট অনুযায়ী ডাইনামিক লেআউট সুইচ */}
            <div 
              className="showroom-row-container"
              style={
                isExpanded 
                  ? {
                      // 🔳 SEE MORE ক্লিক করলে: লাক্সারি ডেক্সটপ গ্রিড লেআউট (অন্যান্য ক্যাটাগরি নিচে নেমে যাবে)
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '50px 30px',
                    }
                  : {
                      // ↔️ ডিফল্ট অবস্থা: ডানে থেকে বামে আল্ট্রা-স্মুথ স্ক্রল করা রো (Row)
                      display: 'flex', 
                      overflowX: 'auto', 
                      scrollSnapType: 'x mandatory', 
                      scrollBehavior: 'smooth',
                      gap: '30px',
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
                  {/* প্রোডাক্ট ইমেজ কন্টেইনার (প্রিমিয়াম ৩:৪ রেশিও) */}
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

                  {/* প্রোডাক্ট ডিটেইলস সেকশন */}
                  <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* আপডেটেড লাক্সারি সফট অফ-হোয়াইট কালার (#e5e5e5) */}
                    <h3 style={{ fontSize: '14px', fontWeight: 'normal', color: '#e5e5e5', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
                      {product.name}
                    </h3>
                    
                    <p style={{ fontSize: '13px', color: '#888', margin: '0 0 15px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
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

      {/* 🎨 রেসপনসিভ রেঞ্জ ও স্ক্রলবার হাইড করার গ্লোবাল সিএসএস */}
      <style>{`
        /* 📱 মোবাইলের জন্য ডিফল্ট (১টি প্রডাক্ট ফুল স্ক্রিন সোয়াইপ) */
        .showroom-card-item {
          min-width: 100%;
        }

        /* 💻 ডেক্সটপের জন্য (কোল্যাপ্সড অবস্থায় একের পর এক প্রডাক্ট ডানে সাজানো থাকবে) */
        @media (min-width: 768px) {
          .showroom-card-item {
            min-width: 280px; 
            max-width: 300px;
          }
        }

        /* প্রিমিয়াম শোরুম লুকের জন্য ব্রাউজার স্ক্রলবার হাইড করা */
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
