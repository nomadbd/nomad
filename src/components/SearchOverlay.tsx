import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 
import { useCart } from '../context/CartContext'; // 🛒 কার্ট কন্টেক্সট ইম্পোর্ট করা হয়েছে

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

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
  details?: Record<string, string> | null; // JSONB কলাম টাইপ
}

// 📸 প্রোডাক্ট গ্যালারি কম্পোনেন্ট (ProductList থেকে নেওয়া)
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

// 🛒 ১০০% সিমেট্রিক বর্ডার যুক্ত অ্যাকশন রো (ProductList থেকে নেওয়া)
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

// 💳 ইনডিভিজুয়াল প্রোডাক্ট কার্ড কম্পোনেন্ট (ডিটেইলস ও see more/less সহ)
const ProductCard = ({ product }: { product: Product }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // মিডিয়া উইন্ডো থেকে ছবির লিঙ্কগুলো বের করা
  const mediaUrls = product.product_media?.map(m => m.media_url) || [];

  return (
    <div className="showroom-card-item" style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px' }}>
      
      {/* Category header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '2px', fontWeight: 'bold', color: '#b3b3b3' }}>
          {product.category || 'PRODUCT'}
        </span>
      </div>

      <ProductGallery 
        images={mediaUrls} 
        productName={product.name} 
      />

      <div style={{ padding: '0 5px', display: 'flex', flexDirection: 'column', flex: 1 }}>
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
                {isLongText && (
                  <span 
                    onClick={() => setIsDescExpanded(true)}
                    style={{ fontSize: '12px', color: '#aaa', cursor: 'pointer', marginLeft: '6px', fontWeight: '500', display: 'inline' }}
                  >
                    see more
                  </span>
                )}
              </p>
            ) : (
              <div style={{ animation: 'swapFadeIn 0.3s ease-in-out' }}>
                <p style={{ fontSize: '13px', color: '#fff', margin: 0, lineHeight: '1.4' }}>
                  {product.description}
                </p>

                {/* 📊 সুপাবেজ JSONB থেকে আসা ডাইনামিক স্পেসিফিকেশন টেবিল */}
                {product.details && Object.keys(product.details).length > 0 && (
                  <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {Object.entries(product.details).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                        <span style={{ color: '#fff', width: '95px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</span>
                        <span style={{ color: '#555', marginRight: '10px', flexShrink: 0 }}>:</span>
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

export default SearchOverlay;

// 🔍 মেইন সার্চ ওভারলে কম্পোনেন্ট
export function SearchOverlay({ isOpen, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchProducts();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchProducts = async () => {
    try {
      const query = `%${searchQuery}%`;

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_media (
            media_url,
            media_type
          )
        `)
        .eq('status', 'active')
        .or(`name.ilike.${query},description.ilike.${query},category.ilike.${query},sizes.cat.${query},colors.cat.${query}`); 

      if (error) {
        // ফ্যালব্যাক কুয়েরি
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select(`
            *,
            product_media (
              media_url,
              media_type
            )
          `)
          .eq('status', 'active')
          .or(`name.ilike.${query},description.ilike.${query},category.ilike.${query}`);

        if (fallbackError) throw fallbackError;
        setResults((fallbackData as Product[]) || []);
      } else {
        setResults((data as Product[]) || []);
      }
    } catch (err) {
      console.error('Error searching products:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'black', zIndex: 1000, padding: '24px', boxSizing: 'border-box',
      overflowY: 'auto', fontFamily: 'sans-serif'
    }}>
      {/* Search Header */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '40px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '15px'
      }}>
        <input 
          type="text" 
          placeholder="Search nomad products..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', background: 'none', border: 'none', 
            color: 'white', fontSize: '24px', outline: 'none',
            letterSpacing: '1px'
          }}
          autoFocus
        />

        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Close search"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Results Area */}
      <div style={{ color: 'white' }}>
        {results.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '30px',
            marginTop: '20px'
          }}>
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {searchQuery.trim().length > 0 && results.length === 0 && (
          <p style={{ 
            fontSize: '11px', 
            letterSpacing: '2px', 
            opacity: 0.5,
            marginTop: '40px',
            textTransform: 'uppercase'
          }}>
            No products found matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* অ্যানিমেশন ও স্ক্রলবার হাইড করার স্টাইলশীট */}
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
      `}</style>
    </div>
  );
}
