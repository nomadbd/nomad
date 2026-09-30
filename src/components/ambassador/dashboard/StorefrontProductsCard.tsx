import React, { useState } from 'react';

export interface AssignedProduct {
  id: string | number;
  title: string;
  description?: string;
  regular_price?: number; // গ্রাহকের মূল রিটেইল প্রাইস
  price: number;         // ফাইনাল বিক্রয় মূল্য (Selling Price)
  image_url?: string;
  category?: string;
  is_visible: boolean;
  status?: 'active' | 'sold_out' | string;
  stock_quantity?: number;
  commission_amount?: number; // নির্দিষ্ট ফিক্সড কমিশন (যদি থাকে)
  commission_rate?: number;   // শতাংশ কমিশন (যদি থাকে)
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
        borderRadius: '12px',
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
          marginBottom: '14px',
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
        <div style={{ fontSize: '11px', color: '#555', padding: '30px 0', textAlign: 'center', letterSpacing: '1px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
          {assignedProducts.map((product) => {
            const isVisible = product.is_visible;
            const isToggling = togglingId === product.id;
            const isExpanded = expandedProductId === product.id;
            const isSoldOut = product.status === 'sold_out' || (product.stock_quantity !== undefined && product.stock_quantity <= 0);

            // প্রাইসিং ও কমিশন হিসেব
            const regularPrice = product.regular_price || product.price;
            const sellingPrice = product.price;
            const customerDiscount = regularPrice > sellingPrice ? regularPrice - sellingPrice : 0;
            const commission = product.commission_amount
              ? product.commission_amount
              : product.commission_rate
              ? (sellingPrice * product.commission_rate) / 100
              : 0;

            return (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#050505',
                  border: isVisible ? '1px solid #222222' : '1px solid #141414',
                  borderRadius: '10px',
                  padding: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                  opacity: isVisible ? 1 : 0.65,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* ১. ফুল-উইডথ প্রোডাক্ট ছবি (অরিজিনাল রেশিও সহ) + ছবির ভেতরে ওভারলে ব্যাজ */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #1f1f1f'
                  }}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '380px',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: '11px', fontFamily: 'monospace' }}>
                      NO IMAGE AVAILABLE
                    </div>
                  )}

                  {/* ছবির বাম দিকে উপরে: বিক্রয়মূল্য ও ডিসকাউন্ট ট্যাগের ওভারলে */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 2 }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        backdropFilter: 'blur(4px)',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}
                    >
                      ৳{sellingPrice.toLocaleString()}
                    </span>

                    {customerDiscount > 0 && (
                      <span
                        style={{
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          letterSpacing: '0.5px'
                        }}
                      >
                        SAVE ৳{customerDiscount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* ছবির ডান দিকে উপরে: VISIBLE / HIDDEN বাটনের ওভারলে */}
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(product.id, isVisible)}
                    disabled={isToggling}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 2,
                      backgroundColor: isVisible ? '#ffffff' : 'rgba(0, 0, 0, 0.85)',
                      color: isVisible ? '#000000' : '#888888',
                      border: isVisible ? '1px solid #ffffff' : '1px solid #333333',
                      padding: '6px 10px',
                      fontSize: '9px',
                      fontWeight: '700',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backdropFilter: 'blur(4px)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {isToggling ? '...' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>

                  {/* সোল্ড আউট ব্যাজ (যদি থাকে) */}
                  {isSoldOut && (
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: '#991b1b', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px', letterSpacing: '1px' }}>
                      SOLD OUT
                    </div>
                  )}
                </div>

                {/* ২. ছবির ঠিক নিচে প্রোডাক্টের নাম */}
                <div style={{ marginTop: '12px' }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#ffffff',
                      margin: '0 0 8px 0',
                      lineHeight: '1.3'
                    }}
                  >
                    {product.title}
                  </h3>

                  {/* ৩. ফিন্যান্সিয়াল সামারি বক্স (কত বিক্রি, কত ডিসকাউন্ট, কত কমিশন) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      backgroundColor: '#0a0a0a',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #1a1a1a',
                      margin: '8px 0',
                      fontFamily: 'monospace'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                        Regular Price
                      </span>
                      <span style={{ fontSize: '12px', color: customerDiscount > 0 ? '#888' : '#fff', textDecoration: customerDiscount > 0 ? 'line-through' : 'none', fontWeight: '600' }}>
                        ৳{regularPrice.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                        Selling Price
                      </span>
                      <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>
                        ৳{sellingPrice.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                        Customer Discount
                      </span>
                      <span style={{ fontSize: '12px', color: customerDiscount > 0 ? '#ef4444' : '#555', fontWeight: '600' }}>
                        {customerDiscount > 0 ? `৳${customerDiscount.toLocaleString()}` : '0% OFF'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                        Your Profit / Comm
                      </span>
                      <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700' }}>
                        +৳{commission.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* ৪. ডিটেইলস এক্সপ্যান্ড বাটন */}
                  <span
                    onClick={() => toggleExpand(product.id)}
                    style={{
                      fontSize: '10px',
                      color: '#888',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500',
                      display: 'inline-block',
                      marginTop: '4px'
                    }}
                  >
                    {isExpanded ? '▲ SEE LESS' : '▼ SEE DETAILS'}
                  </span>
                </div>

                {/* ৫. ড্রপডাউন ডিটেইলস (Description, Specs, Sizes, Colors) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #181818',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '11px'
                    }}
                  >
                    {product.description && (
                      <div>
                        <span style={{ color: '#666', fontSize: '9px', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Description</span>
                        <p style={{ color: '#ccc', margin: 0, lineHeight: '1.4' }}>{product.description}</p>
                      </div>
                    )}

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
