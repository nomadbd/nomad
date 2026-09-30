import React from 'react';

export interface AssignedProduct {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  category?: string;
  is_visible: boolean;
}

interface StorefrontProductsCardProps {
  assignedProducts: AssignedProduct[];
  loadingProducts: boolean;
  togglingId: string | null;
  onToggleVisibility: (productId: string, currentStatus: boolean) => void;
}

export default function StorefrontProductsCard({
  assignedProducts,
  loadingProducts,
  togglingId,
  onToggleVisibility
}: StorefrontProductsCardProps) {
  const visibleCount = assignedProducts.filter((p) => p.is_visible).length;

  return (
    <section
      style={{
        backgroundColor: '#050505',
        border: '1px solid #1a1a1a',
        padding: '16px 14px',
        borderRadius: '12px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* হেডার ও ভিজিবল কাউন্টার */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          gap: '10px'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '11px',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#888888',
              fontWeight: '700'
            }}
          >
            STOREFRONT PRODUCTS
          </h2>
          <p
            style={{
              fontSize: '10px',
              color: '#555555',
              margin: '3px 0 0 0'
            }}
          >
            Select which assigned products to display on your public showcase.
          </p>
        </div>

        <span
          style={{
            flexShrink: 0,
            fontSize: '9px',
            fontWeight: '700',
            color: '#aaa',
            border: '1px solid #222',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: '#0a0a0a',
            letterSpacing: '0.5px'
          }}
        >
          {visibleCount} / {assignedProducts.length} VISIBLE
        </span>
      </div>

      {/* প্রোডাক্ট লিস্ট / লোডিং স্টেট */}
      {loadingProducts ? (
        <div style={{ fontSize: '11px', color: '#555', padding: '20px 0', textAlign: 'center' }}>
          LOADING ASSIGNED PRODUCTS...
        </div>
      ) : assignedProducts.length === 0 ? (
        <div
          style={{
            fontSize: '11px',
            color: '#555',
            padding: '24px 0',
            textAlign: 'center',
            border: '1px dashed #222',
            borderRadius: '8px'
          }}
        >
          NO PRODUCTS ASSIGNED BY ADMIN YET.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
          {assignedProducts.map((product) => {
            const isVisible = product.is_visible;
            const isToggling = togglingId === product.id;

            return (
              <div
                key={product.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: '#0a0a0a',
                  border: isVisible ? '1px solid #1f1f1f' : '1px solid #141414',
                  borderRadius: '8px',
                  gap: '12px',
                  width: '100%',
                  boxSizing: 'border-box',
                  opacity: isVisible ? 1 : 0.65,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* ইমেজ ও প্রোডাক্ট তথ্য */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '6px',
                      backgroundColor: '#151515',
                      border: '1px solid #222',
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
                      <span style={{ fontSize: '10px', color: '#444' }}>IMG</span>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: '12px',
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#34d399' }}>
                        ৳{product.price.toLocaleString()}
                      </span>
                      {product.category && (
                        <span
                          style={{
                            fontSize: '9px',
                            color: '#666',
                            backgroundColor: '#111',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            border: '1px solid #222'
                          }}
                        >
                          {product.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ভিজিবিলিটি টগল বাটন */}
                <button
                  type="button"
                  onClick={() => onToggleVisibility(product.id, isVisible)}
                  disabled={isToggling}
                  style={{
                    flexShrink: 0,
                    backgroundColor: isVisible ? '#04140a' : '#111111',
                    color: isVisible ? '#4dff88' : '#777777',
                    border: `1px solid ${isVisible ? '#0a381b' : '#222222'}`,
                    padding: '7px 12px',
                    fontSize: '9px',
                    fontWeight: '700',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isToggling ? 'UPDATING...' : isVisible ? 'SHOWING ON STORE' : 'HIDDEN FROM STORE'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
