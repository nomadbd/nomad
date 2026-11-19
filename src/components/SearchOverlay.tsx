import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/supabaseClient';
import { useCart } from '@/context/CartContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
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
  details?: Record<string, string> | null;
}

const BENGALI_TO_ENGLISH_ALIASES: Record<string, string[]> = {
  'টি-শার্ট': ['t-shirt', 'tshirt', 'tee'],
  'টিশার্ট': ['t-shirt', 'tshirt', 'tee'],
  'শার্ট': ['shirt'],
  'প্যান্ট': ['pant', 'pants', 'trouser', 'trousers'],
  'জিন্স': ['jeans', 'denim'],
  'হুডি': ['hoodie'],
  'জ্যাকেট': ['jacket'],
  'পোলো': ['polo'],
  'কালো': ['black'],
  'সাদা': ['white'],
  'নীল': ['blue', 'navy'],
  'লাল': ['red'],
  'সবুজ': ['green', 'olive'],
  'ধূসর': ['grey', 'gray'],
};

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const expandQueryTokens = (rawQuery: string): string[] => {
  const normalized = normalizeText(rawQuery);
  if (!normalized) return [];

  const tokens = normalized.split(' ').filter(Boolean);
  const expanded = new Set<string>([normalized, ...tokens]);

  Object.entries(BENGALI_TO_ENGLISH_ALIASES).forEach(([bn, enList]) => {
    if (normalized.includes(bn)) {
      enList.forEach((en) => expanded.add(normalizeText(en)));
    }
  });

  tokens.forEach((token) => {
    if (token === 'tshirt') {
      expanded.add('t shirt');
      expanded.add('t-shirt');
    }
    if (token === 't-shirt' || token === 't') {
      expanded.add('tshirt');
    }
  });

  return Array.from(expanded);
};

const scoreProduct = (product: Product, rawQuery: string): number => {
  const query = normalizeText(rawQuery);
  if (!query) return 0;

  let score = 0;

  const name = normalizeText(product.name || '');
  const category = normalizeText(product.category || '');
  const description = normalizeText(product.description || '');
  const sizes = (product.sizes || []).map((s) => normalizeText(String(s)));
  const colors = (product.colors || []).map((c) => normalizeText(String(c)));
  const detailsText = product.details
    ? normalizeText(
        Object.entries(product.details)
          .map(([k, v]) => `${k} ${v}`)
          .join(' ')
      )
    : '';

  const expandedTerms = expandQueryTokens(rawQuery);
  const queryTokens = query.split(' ').filter(Boolean);

  // ১. প্রোডাক্টের নাম (সর্বোচ্চ অগ্রাধিকার)
  if (name === query) {
    score += 140;
  } else if (name.startsWith(query)) {
    score += 110;
  } else if (name.includes(query)) {
    score += 85;
  }

  // ২. ক্যাটাগরি ম্যাচ (বাংলা ও ইংরেজি সমার্থকসহ)
  expandedTerms.forEach((term) => {
    if (!term) return;
    if (category === term) {
      score += 95;
    } else if (category.startsWith(term)) {
      score += 75;
    } else if (category.includes(term)) {
      score += 60;
    }
  });

  // ৩. মাল্টি-ওয়ার্ড টোকেন ম্যাচ (নাম ও ক্যাটাগরিতে)
  let matchedNameTokens = 0;
  queryTokens.forEach((token) => {
    const tokenAliases = expandQueryTokens(token);
    const inName = tokenAliases.some((alias) => name.includes(alias));
    const inCategory = tokenAliases.some((alias) => category.includes(alias));

    if (inName) {
      matchedNameTokens += 1;
      score += name.split(' ').some((w) => w.startsWith(token)) ? 32 : 22;
    }
    if (inCategory) {
      score += 24;
    }
  });

  if (queryTokens.length > 1 && matchedNameTokens === queryTokens.length) {
    score += 40;
  }

  // ৪. সাইজ এবং কালার ম্যাচ
  queryTokens.forEach((token) => {
    const tokenAliases = expandQueryTokens(token);

    if (sizes.some((s) => s === token)) {
      score += 75;
    } else if (sizes.some((s) => s.includes(token) && token.length >= 2)) {
      score += 40;
    }

    if (colors.some((c) => tokenAliases.includes(c))) {
      score += 70;
    } else if (colors.some((c) => tokenAliases.some((alias) => alias.length >= 3 && c.includes(alias)))) {
      score += 45;
    }
  });

  // ৫. দাম (Price) ম্যাচ
  const numericMatches = rawQuery.replace(/,/g, '').match(/\d+(\.\d+)?/g);
  if (numericMatches && numericMatches.length > 0) {
    const targetPrice = parseFloat(numericMatches[0]);
    if (!Number.isNaN(targetPrice) && targetPrice > 0) {
      const diff = Math.abs(product.price - targetPrice);
      if (diff === 0) {
        score += 85;
      } else if (diff <= targetPrice * 0.1) {
        score += 50;
      } else if (diff <= targetPrice * 0.25) {
        score += 25;
      } else if (String(product.price).startsWith(String(Math.floor(targetPrice)))) {
        score += 30;
      }
    }
  }

  // ৬. ডেসক্রিপশন এবং অতিরিক্ত ডিটেইলস
  if (description.includes(query)) {
    score += 25;
  } else {
    queryTokens.forEach((token) => {
      if (token.length >= 2 && description.includes(token)) {
        score += 10;
      }
    });
  }

  if (detailsText && detailsText.includes(query)) {
    score += 20;
  }

  // ইন-স্টক প্রোডাক্টকে সামান্য অগ্রাধিকার
  if (score > 0 && product.status === 'active' && product.stock_quantity > 0) {
    score += 5;
  }

  return score;
};

const ProductGallery = ({ images, productName }: { images: string[]; productName: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '3/4',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#111',
      }}
    >
      {images.length > 0 ? (
        <img
          src={images[currentIndex]}
          alt={productName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#333',
          }}
        >
          No Image
        </div>
      )}

      {images.length > 1 && (
        <>
          <div
            style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', cursor: 'pointer' }}
            onClick={handlePrev}
          />
          <div
            style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '100%', cursor: 'pointer' }}
            onClick={handleNext}
          />

          <div
            style={{
              position: 'absolute',
              bottom: '15px',
              left: 0,
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {images.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
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
    lineHeight: '1',
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '42px',
        marginTop: 'auto',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {step === 'idle' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            animation: 'swapFadeIn 0.25s ease-in-out',
          }}
        >
          <span
            style={{
              fontSize: '15px',
              color: isSoldOut ? '#555' : '#fff',
              fontWeight: 500,
              fontFamily: 'monospace',
            }}
          >
            ৳{product.price}
          </span>

          {isSoldOut ? (
            <button
              type="button"
              disabled
              style={{
                height: '36px',
                width: '130px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                lineHeight: '1',
                background: 'transparent',
                border: '1px solid #222',
                color: '#555',
                fontSize: '11px',
                letterSpacing: '1.5px',
                cursor: 'not-allowed',
                textTransform: 'uppercase',
                fontWeight: '600',
              }}
            >
              SOLD OUT
            </button>
          ) : (
            <button
              type="button"
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            animation: 'swapFadeIn 0.25s ease-in-out',
            overflow: 'hidden',
          }}
        >
          <span style={labelStyle}>SIZE:</span>
          <div
            className="variant-scroll-container"
            style={{
              display: 'flex',
              gap: '16px',
              overflowX: 'auto',
              flex: 1,
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              paddingRight: '5px',
              alignItems: 'center',
            }}
          >
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
                style={{
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '1px',
                  flexShrink: 0,
                  padding: '4px 2px',
                  lineHeight: '1',
                }}
              >
                {size}
              </span>
            ))}
          </div>
        </div>
      )}

      {step === 'color' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            animation: 'swapFadeIn 0.25s ease-in-out',
            overflow: 'hidden',
          }}
        >
          <span style={labelStyle}>COLOR:</span>
          <div
            className="variant-scroll-container"
            style={{
              display: 'flex',
              gap: '14px',
              overflowX: 'auto',
              flex: 1,
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              paddingRight: '5px',
              alignItems: 'center',
            }}
          >
            {availableColors.map((color) => (
              <span
                key={color}
                onClick={() => {
                  addToCart({
                    ...product,
                    size: selectedSize || 'FREE',
                    color: color,
                  });
                  triggerAddedFeedback();
                  setStep('idle');
                }}
                style={{
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '1px',
                  flexShrink: 0,
                  padding: '4px 2px',
                  textTransform: 'uppercase',
                  lineHeight: '1',
                }}
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

const ProductCard = ({ product }: { product: Product }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const mediaUrls = product.product_media?.map((m) => m.media_url) || [];
  const description = product.description || '';

  return (
    <div
      className="showroom-card-item search-card-item"
      style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          padding: '0 5px',
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            fontSize: '13px',
            letterSpacing: '3px',
            fontWeight: 'bold',
            color: '#b3b3b3',
          }}
        >
          {product.category || 'PRODUCT'}
        </span>
      </div>

      <ProductGallery images={mediaUrls} productName={product.name} />

      <div style={{ marginTop: '15px', padding: '0 5px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 6px 0', fontWeight: '600' }}>{product.name}</h3>

        <div style={{ margin: '0 0 15px 0' }}>
          {(() => {
            const characterLimit = 75;
            const isLongText = description.length > characterLimit;
            const displayedText = isLongText ? description.slice(0, characterLimit) + '...' : description;

            return !isDescExpanded ? (
              <p style={{ fontSize: '13px', color: '#fff', margin: 0, lineHeight: '1.4' }}>
                {displayedText}
                {isLongText && (
                  <span
                    onClick={() => setIsDescExpanded(true)}
                    style={{
                      fontSize: '12px',
                      color: '#aaa',
                      cursor: 'pointer',
                      marginLeft: '6px',
                      fontWeight: '500',
                      display: 'inline',
                    }}
                  >
                    see more
                  </span>
                )}
              </p>
            ) : (
              <div style={{ animation: 'swapFadeIn 0.3s ease-in-out' }}>
                <p style={{ fontSize: '13px', color: '#fff', margin: 0, lineHeight: '1.4' }}>{description}</p>

                {product.details && Object.keys(product.details).length > 0 && (
                  <div
                    style={{
                      borderTop: '1px solid #1a1a1a',
                      marginTop: '12px',
                      paddingTop: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  >
                    {Object.entries(product.details).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            color: '#fff',
                            width: '95px',
                            flexShrink: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          {key}
                        </span>
                        <span style={{ color: '#555', marginRight: '10px', flexShrink: 0 }}>:</span>
                        <span
                          style={{
                            color: '#fff',
                            fontWeight: '400',
                            flex: 1,
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            lineHeight: '1.4',
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <span
                  onClick={() => setIsDescExpanded(false)}
                  style={{
                    fontSize: '11px',
                    color: '#aaa',
                    cursor: 'pointer',
                    marginTop: '12px',
                    display: 'inline-block',
                    letterSpacing: '0.5px',
                  }}
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

export default function SearchOverlay({ isOpen, onClose, searchQuery }: Props) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
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

        if (error) throw error;
        if (isMounted && data) {
          setAllProducts(data as Product[]);
        }
      } catch (err) {
        console.error('Error loading search catalog:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const rankedResults = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return [];

    return allProducts
      .map((product) => ({
        product,
        score: scoreProduct(product, trimmed),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.product.created_at).getTime() - new Date(a.product.created_at).getTime();
      })
      .map((entry) => entry.product);
  }, [allProducts, searchQuery]);

  if (!isOpen) return null;

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100dvh',
        backgroundColor: 'black',
        zIndex: 900,
        boxSizing: 'border-box',
        overflowY: 'auto',
        fontFamily: 'sans-serif',
        paddingTop: '84px',
        paddingBottom: '40px',
      }}
    >
      <div style={{ color: 'white', width: '100%', boxSizing: 'border-box' }}>
        {!hasQuery && (
          <div style={{ padding: '24px 24px 0 24px' }}>
            <p
              style={{
                fontSize: '11px',
                letterSpacing: '2px',
                color: '#666',
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                margin: 0,
              }}
            >
              Search by name, category, size, color, or price
            </p>
          </div>
        )}

        {hasQuery && isLoading && rankedResults.length === 0 && (
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              color: '#777',
              padding: '0 24px',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            Searching...
          </p>
        )}

        {hasQuery && rankedResults.length > 0 && (
          <>
            <div
              style={{
                padding: '0 24px 18px 24px',
                fontSize: '10px',
                letterSpacing: '2px',
                color: '#666',
                textTransform: 'uppercase',
                fontFamily: 'monospace',
              }}
            >
              {rankedResults.length} {rankedResults.length === 1 ? 'Result' : 'Results'}
            </div>

            <div className="search-results-container">
              {rankedResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {hasQuery && !isLoading && rankedResults.length === 0 && (
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              opacity: 0.5,
              padding: '0 24px',
              textTransform: 'uppercase',
            }}
          >
            No products found matching "{searchQuery}"
          </p>
        )}
      </div>

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
          .search-results-container {
            width: 100vw;
            display: flex;
            flex-direction: column;
            gap: 40px;
          }
          .search-card-item {
            width: 100vw !important;
            min-width: 100vw !important;
            padding: 0 24px !important;
          }
        }

        @media (min-width: 768px) {
          .search-results-container {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            padding: 0 24px;
          }
          .search-card-item {
            width: 300px;
            min-width: 300px;
            margin-bottom: 30px;
          }
        }
      `}</style>
    </div>
  );
}
