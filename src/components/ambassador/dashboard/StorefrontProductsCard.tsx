import React, { useState } from 'react';

export interface AssignedProduct {
  id: string | number;
  title: string;
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
        padding: '18px 14px',
        borderRadius: '12px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* কার্ড হেডার ও ফিল্টার/ভিজিবিলিটি স্ট্যাটাস */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          gap: '10px',
          paddingBottom: '12px',
          borderBottom: '1px solid #141414'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '11px',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#b3b3b3',
              fontWeight: '600'
            }}
          >
            STOREFRONT PRODUCTS
          </h2>
          <p style={{ fontSize: '10px', color: '#666', margin: '4px 0 0 0', letterSpacing: '0.3px' }}>
            Manage which products appear on your public nomad collection.
          </p>
        </div>

        <span
          style={{
            flexShrink: 0,
            fontSize: '9px',
            fontWeight: '600',
            color: '#888',
            border: '1px solid #222',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#050505',
            letterSpacing: '1px'
          }}
        >
          {visibleCount} / {assignedProducts.length} VISIBLE
        </span>
      </div>

      {/* কন্টেন্ট লোডিং ও খালি অবস্থা */}
      {loadingProducts ? (
        <div style={{ fontSize: '11px', color: '#555', padding: '30px 0', textAlign: 'center', letterSpacing: '1.5px' }}>
          LOADING ASSIGNED PRODUCTS...
        </div>
      ) : assignedProducts.length === 0 ? (
        <div
          style={{
            fontSize: '11px',
            color: '#555',
            padding: '30px 0',
            textAlign: 'center',
            border: '1px dashed #1a1a1a',
            borderRadius: '8px',
            letterSpacing: '1px'
          }}
        >
          NO PRODUCTS ASSIGNED BY ADMIN YET.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
          {assignedProducts.map((product) => {
            const isVisible = product.is_visible;
            const isToggling = togglingId === product.id;
            const isExpanded = expandedProductId === product.id;
            const isSoldOut = product.status === 'sold_out' || (product.stock_quantity !== undefined && product.stock_quantity <= 0);

            // সম্ভাব্য কমিশন গণনা
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
                  opacity: isVisible ? 1 : 0.6,
                  transition: 'all 0.25s ease'
                }}
              >
                {/* প্রাইমারি রো (ইমেজ, টাইটেল, প্রাইস, টগল বাটন) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  {/* থাম্বনেইল ও টাইটেল সংলগ্ন অংশ */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '6px',
                        backgroundColor: '#111',
                        border: '1px solid #1a1a1a',
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
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '9px', color: '#444', fontFamily: 'monospace' }}>NO IMG</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <h4
                          style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#ffffff',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {product.title}
                        </h4>

                        {isSoldOut && (
                          <span
                            style={{
                              fontSize: '8px',
                              color: '#ff4d4d',
                              border: '1px solid #441111',
                              backgroundColor: '#1a0505',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              fontWeight: '600',
                              letterSpacing: '0.5px'
                            }}
                          >
                            SOLD OUT
                          </span>
                        )}
                      </div>

                      {/* প্রাইস, কমিশন ও এক্সপ্যান্ড বাটন */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500', fontFamily: 'monospace' }}>
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

                        <span
                          onClick={() => toggleExpand(product.id)}
                          style={{
                            fontSize: '10px',
                            color: '#888',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            textDecoration: 'underline'
                          }}
                        >
                          {isExpanded ? 'see less' : 'see details'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* অন / অফ অ্যাকশন বাটন */}
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(product.id, isVisible)}
                    disabled={isToggling}
                    style={{
                      flexShrink: 0,
                      backgroundColor: isVisible ? '#ffffff' : 'transparent',
                      color: isVisible ? '#000000' : '#888888',
                      border: isVisible ? '1px solid #ffffff' : '1px solid #222222',
                      padding: '8px 12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isToggling ? 'UPDATING...' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>

                {/* এক্সপ্যান্ডেবল ডিটেইলস সেকশন (গ্রাহক প্যানেলের মতো স্পেসিফিকেশন) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #141414',
                      animation: 'swapFadeIn 0.25s ease-in-out'
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '8px',
                        fontFamily: 'monospace',
                        fontSize: '11px'
                      }}
                    >
                      {product.category && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ color: '#666' }}>CATEGORY:</span>
                          <span style={{ color: '#fff' }}>{product.category}</span>
                        </div>
                      )}

                      {product.sizes && product.sizes.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ color: '#666' }}>SIZES:</span>
                          <span style={{ color: '#fff' }}>{product.sizes.join(', ')}</span>
                        </div>
                      )}

                      {product.colors && product.colors.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ color: '#666' }}>COLORS:</span>
                          <span style={{ color: '#fff' }}>{product.colors.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* প্রোডাক্ট ডিটেইলস কি-ভ্যালু জোড়া */}
                    {product.details && Object.keys(product.details).length > 0 && (
                      <div
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          fontFamily: 'monospace',
                          fontSize: '11px'
                        }}
                      >
                        {Object.entries(product.details).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ color: '#666', width: '85px', flexShrink: 0, textTransform: 'uppercase' }}>
                              {k}
                            </span>
                            <span style={{ color: '#333', marginRight: '6px' }}>:</span>
                            <span style={{ color: '#ccc', flex: 1 }}>{String(v)}</span>
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
