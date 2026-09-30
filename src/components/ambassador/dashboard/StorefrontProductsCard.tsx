import React, { useState } from 'react';

export interface AssignedProduct {
  id: string | number;
  title: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  is_visible: boolean;
  status?: 'active' | 'sold_out' | string;
  stock_quantity?: number;
  commission_amount?: number;
  commission_rate?: number;
  details?: Record<string, string> | null;
  sizes?: string[];
  colors?: string[];
}

interface StorefrontProductsCardProps {
  assignedProducts: AssignedProduct[];
  loadingProducts: boolean;
  togglingId: string | number | null;
  onToggleVisibility: (productId: string | number, currentStatus: boolean) => void;
}

export default function StorefrontProductsCard({
  assignedProducts,
  loadingProducts,
  togglingId,
  onToggleVisibility
}: StorefrontProductsCardProps) {
  const [expandedProductId, setExpandedProductId] = useState<string | number | null>(null);

  const visibleCount = assignedProducts.filter((p) => p.is_visible).length;

  const toggleExpand = (id: string | number) => {
    setExpandedProductId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      style={{
        backgroundColor: '#000000',
        border: '1px solid #141414',
        padding: '14px',
        borderRadius: '10px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* সংক্ষেপিত ক্লিন হেডার */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '10px',
          borderBottom: '1px solid #141414'
        }}
      >
        <h2
          style={{
            fontSize: '11px',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: '#888888',
            fontWeight: '700'
          }}
        >
          PRODUCTS
        </h2>

        <span
          style={{
            fontSize: '9px',
            fontWeight: '600',
            color: '#aaa',
            border: '1px solid #222',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: '#080808',
            letterSpacing: '0.8px'
          }}
        >
          {visibleCount} / {assignedProducts.length} VISIBLE
        </span>
      </div>

      {/* লোডিং ও খালি স্টেট */}
      {loadingProducts ? (
        <div style={{ fontSize: '11px', color: '#555', padding: '20px 0', textAlign: 'center', letterSpacing: '1px' }}>
          LOADING PRODUCTS...
        </div>
      ) : assignedProducts.length === 0 ? (
        <div
          style={{
            fontSize: '11px',
            color: '#555',
            padding: '24px 0',
            textAlign: 'center',
            border: '1px dashed #1a1a1a',
            borderRadius: '6px'
          }}
        >
          NO PRODUCTS ASSIGNED.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
          {assignedProducts.map((product) => {
            const isVisible = product.is_visible;
            const isToggling = togglingId === product.id;
            const isExpanded = expandedProductId === product.id;
            const isSoldOut = product.status === 'sold_out' || (product.stock_quantity !== undefined && product.stock_quantity <= 0);

            const estimatedEarn = product.commission_amount
              ? product.commission_amount
              : product.commission_rate
              ? (product.price * product.commission_rate) / 100
              : null;

            return (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#050505',
                  border: isVisible ? '1px solid #222222' : '1px solid #121212',
                  borderRadius: '8px',
                  padding: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                  opacity: isVisible ? 1 : 0.65,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* টপ রো: অরিজিনাল রেশিও ইমেজ, টাইটেল ও অ্যাকশন */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  
                  {/* অরিজিনাল রেশিও বজায় রাখার সুবিধার্থে objectFit: 'contain' */}
                  <div
                    style={{
                      width: '60px',
                      minHeight: '75px',
                      borderRadius: '6px',
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #1f1f1f',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      />
                    ) : (
                      <span style={{ fontSize: '8px', color: '#444', fontFamily: 'monospace' }}>NO IMG</span>
                    )}
                  </div>

                  {/* প্রোডাক্টের মূল সারসংক্ষেপ */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: '0 0 4px 0',
                        lineHeight: '1.3'
                      }}
                    >
                      {product.title}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                        ৳{product.price}
                      </span>

                      {estimatedEarn !== null && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#34d399',
                            backgroundColor: '#04140a',
                            border: '1px solid #0a381b',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}
                        >
                          Earn: ৳{estimatedEarn}
                        </span>
                      )}

                      {isSoldOut && (
                        <span
                          style={{
                            fontSize: '8px',
                            color: '#ff4d4d',
                            border: '1px solid #441111',
                            backgroundColor: '#1a0505',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            fontWeight: '600'
                          }}
                        >
                          SOLD OUT
                        </span>
                      )}
                    </div>

                    <span
                      onClick={() => toggleExpand(product.id)}
                      style={{
                        fontSize: '10px',
                        color: '#888',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: '500'
                      }}
                    >
                      {isExpanded ? '▲ SEE LESS' : '▼ SEE DETAILS'}
                    </span>
                  </div>

                  {/* ভিজিবিলিটি অন/অফ বাটন */}
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(product.id, isVisible)}
                    disabled={isToggling}
                    style={{
                      flexShrink: 0,
                      backgroundColor: isVisible ? '#ffffff' : 'transparent',
                      color: isVisible ? '#000000' : '#888888',
                      border: isVisible ? '1px solid #ffffff' : '1px solid #222222',
                      padding: '7px 10px',
                      fontSize: '9px',
                      fontWeight: '700',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {isToggling ? '...' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>

                {/* বিস্তারিত তথ্য সেকশন (SEE DETAILS এ ক্লিক করলে আসবে) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #181818',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '11px'
                    }}
                  >
                    {/* ডেসক্রিপশন */}
                    {product.description && (
                      <div>
                        <span style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Description</span>
                        <p style={{ color: '#ccc', margin: 0, lineHeight: '1.4' }}>{product.description}</p>
                      </div>
                    )}

                    {/* ক্যাটাগরি, সাইজ, কালার ও স্টক */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', fontFamily: 'monospace' }}>
                      {product.category && (
                        <div>
                          <span style={{ color: '#666' }}>CATEGORY: </span>
                          <span style={{ color: '#fff' }}>{product.category}</span>
                        </div>
                      )}

                      {product.stock_quantity !== undefined && (
                        <div>
                          <span style={{ color: '#666' }}>STOCK: </span>
                          <span style={{ color: '#fff' }}>{product.stock_quantity}</span>
                        </div>
                      )}

                      {product.sizes && product.sizes.length > 0 && (
                        <div>
                          <span style={{ color: '#666' }}>SIZES: </span>
                          <span style={{ color: '#fff' }}>{product.sizes.join(', ')}</span>
                        </div>
                      )}

                      {product.colors && product.colors.length > 0 && (
                        <div>
                          <span style={{ color: '#666' }}>COLORS: </span>
                          <span style={{ color: '#fff' }}>{product.colors.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* প্রোডাক্টের বিস্তারিত স্পেসিফিকেশন (FIT, GSM, MATERIAL ইত্যাদি) */}
                    {product.details && Object.keys(product.details).length > 0 && (
                      <div style={{ borderTop: '1px dashed #1a1a1a', paddingTop: '8px', marginTop: '4px', fontFamily: 'monospace' }}>
                        {Object.entries(product.details).map(([key, val]) => (
                          <div key={key} style={{ display: 'flex', marginBottom: '3px' }}>
                            <span style={{ color: '#666', width: '90px', flexShrink: 0, textTransform: 'uppercase' }}>{key}</span>
                            <span style={{ color: '#333', marginRight: '6px' }}>:</span>
                            <span style={{ color: '#ddd' }}>{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
