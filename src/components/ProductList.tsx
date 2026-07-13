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
  sizes: string[];  
  colors: string[]; 
  created_at: string;
  product_media: { media_url: string; media_type: string }[];
  details?: Record<string, string> | null; // ⚡ সুপাবেজের JSONB কলাম টাইপ
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

// 🛒 ১০০% সিমেট্রিক বর্ডার যুক্ত অ্যাকশন রো 
const ProductActionRow = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();

  const [step, setStep] = useState<'idle' | 'size' | 'color'>('idle');
  const [selectedSize, setSelectedSize] = useState('');
  const [isAdded, setIsAdded] = useState(false);

  const availableSizes = product.sizes || [];
  const availableColors = product.colors || [];

  const isSoldOut = product.status === 'sold_out' || product.stock_quantity <= 0;

  const triggerAddedFeedback = () => {
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleActionClick = () => {
    if (availableSizes.length === 0 && availableColors.length === 0) {
      addToCart({ ...product, size: 'FREE', color: 'DEFAULT' });
      triggerAddedFeedback();
      return;
    }
    if (availableSizes.length > 0) {
      setStep('size');
    } else {
      setStep('color');
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: '500',
    letterSpacing: '1px',
    color: '#888',
    textTransform: 'uppercase',
    flexShrink: 0,
    marginRight: '12px',
    display: 'inline-block',
    lineHeight: '1'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', marginTop: 'auto', boxSizing: 'border-box', width: '100%' }}>
      {step === 'idle' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', animation: 'swapFadeIn 0.25s ease-in-out' }}>
          <span style={{ fontSize: '15px', color: isSoldOut ? '#555' : '#fff', fontWeight: 500, fontFamily: 'monospace' }}>৳{product.price}</span>

          {isSoldOut ? (
            <button 
              disabled 
              style={{ 
                height: '36px', width: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', lineHeight: '1',
                background: 'transparent', border: '1px solid #222', color: '#555', fontSize: '11px', letterSpacing: '1.5px', cursor: 'not-allowed', textTransform: 'uppercase', fontWeight: '600' 
              }}
            >
              SOLD OUT
            </button>
          ) : (
            <button
              onClick={handleActionClick}
              style={{
                height: '36px',
                width: '130px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                lineHeight: '1',
                background: 'transparent',
                border: `1px solid ${isAdded ? '#fff' : '#333'}`,
                color: '#fff',
                fontSize: '11px',
                letterSpacing: '1.5px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: '600',
                transition: 'all 0.2s ease',
              }}
            >
              {isAdded ? 'ADDED' : 'ADD TO CART'}
            </button>
          )}
        </div>
      )}

      {step === 'size' && (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', animation: 'swapFadeIn 0.25s ease-in-out', overflow: 'hidden' }}>
          <span style={labelStyle}>SIZE:</span>
          <div className="variant-scroll-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', flex: 1, scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', paddingRight: '5px', alignItems: 'center' }}>
            {availableSizes.map((size) => (
              <span
                key={size}
                onClick={() => {
                  setSelectedSize(size);
                  if (availableColors.length > 0) {
                    setStep('color');
                  } else {
                    addToCart({ ...product, size: size, color: 'DEFAULT' });
                    triggerAddedFeedback();
                    setStep('idle');
                  }
                }}
                style={{ color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: '500', letterSpacing: '1px', flexShrink: 0, padding: '4px 2px', lineHeight: '1' }}
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      )}

      {step === 'color' && (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%', animation: 'swapFadeIn 0.25s ease-in-out', overflow: 'hidden' }}>
          <span style={labelStyle}>COLOR:</span>
          <div className="variant-scroll-container" style={{ display: 'flex', gap: '14px', overflowX: 'auto', flex: 1, scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', paddingRight: '5px', alignItems: 'center' }}>
            {availableColors.map((color) => (
              <span
                key={color}
                onClick={() => {
                  addToCart({
                    ...product,
                    size: selectedSize || 'FREE',
                    color: color
                  });
                  triggerAddedFeedback();
                  setStep('idle');
                }}
                style={{ color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: '500', letterSpacing: '1px', flexShrink: 0, padding: '4px 2px', textTransform: 'uppercase', lineHeight: '1' }}
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

// 💳 ইনডিভিজুয়াল প্রোডাক্ট কার্ড কম্পোনেন্ট
const ProductCard = ({ product }: { product: Product }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  return (
    <div className="showroom-card-item" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <ProductGallery 
        images={product.product_media?.map(m => m.media_url) || []} 
        productName={product.name} 
      />

      <div style={{ marginTop: '15px', padding: '0 5px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 6px 0', fontWeight: '600' }}>{product.name}</h3>

        {/* ⚡ এক্সপ্যান্ডেবল বর্ণনা ও স্পেসিফিকেশন সেকশন */}
        <div style={{ margin: '0 0 15px 0' }}>
          {(() => {
            const characterLimit = 75; 
            const isLongText = product.description.length > characterLimit;
            const displayedText = isLongText 
              ? product.description.slice(0, characterLimit) + '...' 
              : product.description;

            return !isDescExpanded ? (
              <p style={{ fontSize: '13px', color: '#fff', margin: 0, lineHeight: '1.4' }}>
                {displayedText}
                <span 
                  onClick={() => setIsDescExpanded(true)}
                  style={{ fontSize: '12px', color: '#aaa', cursor: 'pointer', marginLeft: '6px', fontWeight: '500', display: 'inline' }}
                >
                  see more
                </span>
              </p>
            ) : (
              <div style={{ animation: 'swapFadeIn 0.3s ease-in-out' }}>
                <p style={{ fontSize: '13px', color: '#fff', margin: 0, lineHeight: '1.4' }}>
                  {product.description}
                </p>

                {/* 📊 সুপাবেজ JSONB থেকে আসা ডাইনামিক কি-ভ্যালু পেয়ার রেন্ডারিং */}
                {product.details && Object.keys(product.details).length > 0 && (
                  <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {Object.entries(product.details).map(([key, value]) => (
                      // ⚡ alignItems: 'flex-start' করা হয়েছে যেন ভ্যালু মাল্টি-লাইন হলেও Key উপরেই এলাইন থাকে
                      <div key={key} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                        <span style={{ color: '#fff', width: '95px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</span>
                        <span style={{ color: '#555', marginRight: '10px', flexShrink: 0 }}>:</span>
                        {/* ⚡ flex: 1 এবং overflowWrap এর কারণে টেক্সট বড় হলেও কোলনের পরে সুন্দরভাবে ব্রেক হবে */}
                        <span style={{ color: '#fff', fontWeight: '400', flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                <span 
                  onClick={() => setIsDescExpanded(false)}
                  style={{ fontSize: '11px', color: '#aaa', cursor: 'pointer', marginTop: '12px', display: 'inline-block', letterSpacing: '0.5px' }}
                >
                  see less
                </span>
              </div>
            );
          })()}
        </div>

        <ProductActionRow product={product} />
      </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 15px 12px 15px', borderBottom: '1px solid #141414' }}>
              <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '3px', color: '#b3b3b3', textTransform: 'uppercase' }}>{category}</h3>

              <button 
                onClick={() => setExpandedCategories(prev => ({ ...prev, [category]: !isExpanded }))} 
                style={{ 
                  background: 'none', border: 'none', color: '#fff', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', opacity: 0.7,
                  display: 'flex', padding: 0, alignItems: 'center', width: '85px', justifyContent: 'flex-end'
                }}
              >
                <span>SEE&nbsp;</span>
                <span style={{ display: 'inline-block', width: '35px', textAlign: 'left' }}>
                  {isExpanded ? 'LESS' : 'MORE'}
                </span>
              </button>
            </div>

            <div className="showroom-row-container" style={{ display: 'flex', flexWrap: isExpanded ? 'wrap' : 'nowrap', width: '100%', scrollSnapType: 'x mandatory', overflowX: 'auto', scrollBehavior: 'smooth' }}>
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
