import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  status: 'active' | 'sold_out' | string;
  sizes: string[];  // 🛠️ ডাটাবেজ থেকে আসা ডাইনামিক সাইজ অ্যারে
  colors: string[]; // 🛠️ ডাটাবেজ থেকে আসা ডাইনামিক কালার অ্যারে
  created_at: string;
  product_media: { media_url: string; media_type: string }[];
}

// 📸 প্রোডাক্ট গ্যালারি কম্পোনেন্ট
const ProductGallery = ({ images, productName }: { images: string[], productName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{ width: '100%', aspectRatio: '3/4', position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
      {images.length > 0 ? (
        <img 
          src={images[currentIndex]} 
          alt={productName} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>No Image</div>
      )}

      {images.length > 1 && (
        <>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handlePrev} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }} onClick={handleNext} />

          <div style={{ position: 'absolute', bottom: '15px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {images.map((_, idx) => (
              <div 
                key={idx}
                style={{ 
                  width: '6px', height: '6px', borderRadius: '50%', 
                  background: currentIndex === idx ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// 🛒 ১০০% ডাইনামিক অ্যাকশন রো (অ্যাডমিন নিয়ন্ত্রিত সাইজ ও কালার ভিউ)
const ProductActionRow = ({ product }: { product: Product }) => {
  const { cartItems, addToCart, setIsCartOpen } = useCart();
  
  const [step, setStep] = useState<'idle' | 'size' | 'color'>('idle');
  const [selectedSize, setSelectedSize] = useState('');

  // ⚡ ডাটাবেজ থেকে প্রডাক্টের নিজস্ব ভ্যারিয়েন্ট নেওয়া হচ্ছে (ফেলব্যাক সহ)
  const availableSizes = product.sizes || [];
  const availableColors = product.colors || [];

  const isInCart = cartItems.some((item: any) => item.id === product.id);
  const isSoldOut = product.status === 'sold_out' || product.stock_quantity <= 0;

  const handleActionClick = () => {
    if (isInCart) {
      setIsCartOpen(true);
      return;
    }
    
    // যদি কোনো সাইজ বা কালার অ্যাডমিন সেট না করে থাকে, তবে সরাসরি কার্টে যোগ হবে
    if (availableSizes.length === 0 && availableColors.length === 0) {
      addToCart({ ...product, size: 'FREE', color: 'DEFAULT' });
      return;
    }
    
    // সাইজ না থাকলে সরাসরি কালার সিলেকশনে যাবে, অন্যথায় সাইজে যাবে
    if (availableSizes.length > 0) {
      setStep('size');
    } else {
      setStep('color');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px', marginTop: 'auto', paddingBottom: '5px', boxSizing: 'border-box', width: '100%', overflow: 'hidden' }}>
      
      {/* ১. সাধারণ অবস্থা */}
      {step === 'idle' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', animation: 'swapFadeIn 0.25s ease-in-out' }}>
          <span style={{ fontSize: '15px', color: isSoldOut ? '#555' : '#fff', fontWeight: 500, fontFamily: 'monospace' }}>৳{product.price}</span>
          
          {isSoldOut ? (
            <button disabled style={{ background: 'transparent', border: '1px solid #222', color: '#555', padding: '8px 16px', fontSize: '11px', letterSpacing: '1.5px', cursor: 'not-allowed', textTransform: 'uppercase', fontWeight: '600' }}>
              SOLD OUT
            </button>
          ) : (
            <button
              onClick={handleActionClick}
              style={{
                background: 'transparent',
                border: `1px solid ${isInCart ? '#fff' : '#333'}`,
                color: '#fff',
                padding: '8px 16px',
                fontSize: '11px',
                letterSpacing: '1.5px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
            >
              {isInCart ? 'VIEW BAG' : 'ADD TO CART'}
            </button>
          )}
        </div>
      )}

      {/* ২. ডাইনামিক সাইজ স্ক্রল */}
      {step === 'size' && (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', animation: 'swapFadeIn 0.25s ease-in-out', overflow: 'hidden' }}>
          <span style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', flexShrink: 0, marginRight: '15px' }}>SIZE:</span>
          <div className="variant-scroll-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', flex: 1, scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', paddingRight: '5px' }}>
            {availableSizes.map((size) => (
              <span
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  if (availableColors.length > 0) {
                    setStep('color');
                  } else {
                    addToCart({ ...product, size: size, color: 'DEFAULT' });
                    setStep('idle');
                  }
                }}
                style={{ color: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: '500', letterSpacing: '1px', flexShrink: 0, padding: '2px 4px' }}
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ৩. ডাইনামিক কালার স্ক্রল */}
      {step === 'color' && (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', animation: 'swapFadeIn 0.25s ease-in-out', overflow: 'hidden' }}>
          <span style={{ fontSize: '9px', color: '#555', letterSpacing: '2px', textTransform: 'uppercase', flexShrink: 0, marginRight: '15px' }}>COLOR:</span>
          <div className="variant-scroll-container" style={{ display: 'flex', gap: '14px', overflowX: 'auto', flex: 1, scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', paddingRight: '5px' }}>
            {availableColors.map((color) => (
              <span
                key={color}
                onClick={() => {
                  addToCart({
                    ...product,
                    size: selectedSize || 'FREE',
                    color: color
                  });
                  setStep('idle');
                }}
                style={{ color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: '500', letterSpacing: '1px', flexShrink: 0, padding: '2px 4px', textTransform: 'uppercase' }}
              >
                {color}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_media (
          media_url,
          media_type
        )
      `)
      .order('created_at', { ascending: false });

    if (data) {
      const shuffledProducts = [...data].sort(() => Math.random() - 0.5);
      const uniqueCategories = Array.from(new Set(shuffledProducts.map(p => p.category)))
        .sort(() => Math.random() - 0.5);

      setProducts(shuffledProducts as Product[]);
      setCategories(uniqueCategories);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  if (loading) return <p style={{ color: '#555', padding: '40px', letterSpacing: '2px', fontSize: '11px' }}>LOADING PRODUCTS...</p>;

  return (
    <div style={{ backgroundColor: '#000', width: '100%', boxSizing: 'border-box' }}>
      {categories.map((category) => {
        const categoryProducts = products.filter(p => p.category === category);
        const isExpanded = !!expandedCategories[category];

        return (
          <div key={category} className="showroom-section" style={{ marginBottom: '50px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 15px 12px 15px', borderBottom: '1px solid #141414' }}>
              <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase' }}>{category}</h3>
              <button onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', opacity: 0.7 }}>
                {isExpanded ? 'SEE LESS' : 'SEE MORE'}
              </button>
            </div>

            <div className="showroom-row-container" style={{ display: 'flex', flexWrap: isExpanded ? 'wrap' : 'nowrap', width: '100%', scrollSnapType: 'x mandatory', overflowX: 'auto', scrollBehavior: 'smooth' }}>
              {categoryProducts.map((product) => (
                <div key={product.id} className="showroom-card-item" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>

                  <ProductGallery 
                    images={product.product_media?.map(m => m.media_url) || []} 
                    productName={product.name} 
                  />

                  <div style={{ marginTop: '15px', padding: '0 5px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '14px', color: '#e5e5e5', margin: '0 0 6px 0' }}>{product.name}</h3>
                    <p style={{ fontSize: '13px', color: '#888', margin: '0 0 15px 0', lineHeight: '1.4', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>
                    
                    <ProductActionRow product={product} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes swapFadeIn {
          from { opacity: 0; transform: translateY(1px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .variant-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .variant-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 767px) {
          .showroom-section { margin-left: calc(-50vw + 50%); margin-right: calc(-50vw + 50%); width: 100vw; }
          .showroom-card-item { width: 100vw !important; min-width: 100vw !important; padding: 0 15px !important; }
        }
        @media (min-width: 768px) {
          .showroom-section { padding: 0 15px; }
          .showroom-card-item { width: 300px; min-width: 300px; padding: 0 10px; margin-bottom: 30px; }
        }
        .showroom-row-container::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
