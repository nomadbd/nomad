import React, { useState, useMemo } from 'react';
// index.ts থেকে VisibilityIcon এবং CloseIcon ইম্পোর্ট করা হয়েছে
import { VisibilityIcon, CloseIcon } from '../../icons';

export interface AssignedProduct {
  id: string | number;
  title: string;
  description?: string;
  regular_price?: number;
  price: number;
  image_url?: string;
  category?: string;
  is_visible: boolean;
  status?: 'active' | 'sold_out' | string;
  stock_quantity?: number;
  commission_amount?: number;
  commission_rate?: number;
}

interface StorefrontProductsCardProps {
  assignedProducts: AssignedProduct[];
  loadingProducts: boolean;
  togglingId: string | number | null;
  onToggleVisibility: (productId: string | number, currentStatus: boolean) => void;
  ambassadorCommissionRate?: number;
  customerDiscountRate?: number;
}

export default function StorefrontProductsCard({
  assignedProducts,
  loadingProducts,
  togglingId,
  onToggleVisibility,
  ambassadorCommissionRate = 0,
  customerDiscountRate = 0
}: StorefrontProductsCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ১. মেট্রিক্স কাউন্ট
  const totalCount = assignedProducts.length;
  const activeCount = useMemo(() => assignedProducts.filter((p) => p.is_visible).length, [assignedProducts]);
  const hiddenCount = totalCount - activeCount;

  // ২. ক্যাটাগরি ফিল্টারিং ও গ্রুপিং
  const groupedProducts = useMemo(() => {
    const filtered = assignedProducts.filter((product) => {
      const q = searchQuery.toLowerCase();
      return (
        product.title.toLowerCase().includes(q) ||
        (product.category && product.category.toLowerCase().includes(q))
      );
    });

    const groups: Record<string, AssignedProduct[]> = {};

    filtered.forEach((prod) => {
      const categoryName = prod.category?.trim() || 'General Products';
      if (!groups[categoryName]) {
        groups[categoryName] = [];
      }
      groups[categoryName].push(prod);
    });

    return groups;
  }, [assignedProducts, searchQuery]);

  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', color: '#ffffff' }}>
      
      {/* মূল টাইটেল */}
      <h2
        style={{
          fontSize: '12px',
          margin: '0 0 12px 0',
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          color: '#ffffff',
          fontWeight: '700'
        }}
      >
        STORE PRODUCTS
      </h2>

      {/* সামারি কার্ড ৩টি */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}
      >
        <div
          style={{
            backgroundColor: '#121215',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '12px 8px',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '10px', color: '#a1a1aa', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            TOTAL
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace', marginTop: '2px', display: 'block' }}>
            {totalCount}
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#062016',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '12px 8px',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '10px', color: '#34d399', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ACTIVE
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981', fontFamily: 'monospace', marginTop: '2px', display: 'block' }}>
            {activeCount}
          </span>
        </div>

        <div
          style={{
            backgroundColor: '#1f1315',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '12px',
            padding: '12px 8px',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '10px', color: '#f43f5e', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            HIDDEN
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#f43f5e', fontFamily: 'monospace', marginTop: '2px', display: 'block' }}>
            {hiddenCount}
          </span>
        </div>
      </div>

      {/* সার্চবার */}
      <div style={{ marginBottom: '16px', width: '100%' }}>
        <input
          type="text"
          placeholder="Search products across all categories.."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#121215',
            border: '1px solid #27272a',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '13px',
            color: '#ffffff',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* লোডিং / খালি স্টেট */}
      {loadingProducts ? (
        <div style={{ fontSize: '12px', color: '#71717a', padding: '30px 0', textAlign: 'center' }}>
          Loading products...
        </div>
      ) : Object.keys(groupedProducts).length === 0 ? (
        <div
          style={{
            fontSize: '12px',
            color: '#71717a',
            padding: '24px',
            textAlign: 'center',
            border: '1px dashed #27272a',
            borderRadius: '12px'
          }}
        >
          No products found.
        </div>
      ) : (
        /* ক্যাটাগরি লিস্ট */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {Object.entries(groupedProducts).map(([categoryName, products]) => {
            const isExpanded = !!expandedCategories[categoryName];

            return (
              <div key={categoryName} style={{ width: '100%' }}>
                
                {/* ক্যাটাগরি হেডার */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    width: '100%',
                    marginBottom: '10px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid #1f1f23',
                    boxSizing: 'border-box'
                  }}
                >
                  <h3
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#a1a1aa',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px'
                    }}
                  >
                    {categoryName} <span style={{ color: '#52525b', fontSize: '11px' }}>({products.length})</span>
                  </h3>

                  {/* See More / See Less বাটন - marginLeft: auto যোগ করা হয়েছে যাতে ডানপাশে চলে যায় */}
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand(categoryName)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#a1a1aa',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: 'auto'
                    }}
                  >
                    {isExpanded ? 'SEE LESS' : 'SEE MORE'}
                  </button>
                </div>

                {/* প্রডাক্ট কনটেইনার */}
                <div
                  style={
                    isExpanded
                      ? {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          width: '100%'
                        }
                      : {
                          display: 'flex',
                          gap: '12px',
                          overflowX: 'auto',
                          paddingBottom: '8px',
                          width: '100%',
                          scrollSnapType: 'x mandatory',
                          WebkitOverflowScrolling: 'touch'
                        }
                  }
                >
                  {products.map((product) => {
                    const isVisible = product.is_visible;
                    const isToggling = togglingId === product.id;

                    // প্রাইসিং হিসাব
                    const basePrice = product.regular_price || product.price || 0;
                    const activeCommRate = product.commission_rate ?? ambassadorCommissionRate;
                    const activeDiscountRate = customerDiscountRate;

                    const customerDiscountAmount = (basePrice * activeDiscountRate) / 100;
                    const sellingPrice = basePrice - customerDiscountAmount;

                    const ambassadorCommissionAmount = product.commission_amount
                      ? product.commission_amount
                      : (sellingPrice * activeCommRate) / 100;

                    return (
                      <div
                        key={product.id}
                        style={{
                          backgroundColor: isVisible ? '#121215' : '#0a0a0c',
                          border: isVisible ? '1px solid #27272a' : '1px solid #1a1a1e',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          opacity: isVisible ? 1 : 0.6,
                          width: '100%',
                          minWidth: isExpanded ? '100%' : 'calc(100% - 16px)',
                          flexShrink: 0,
                          scrollSnapAlign: 'start',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* প্রডাক্ট হেডার: ছবি, নাম ও Visibility Icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                          {/* ছবি */}
                          <div
                            onClick={() => product.image_url && setPreviewImage(product.image_url)}
                            title="Click to preview image"
                            style={{
                              width: '52px',
                              height: '52px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              backgroundColor: '#18181b',
                              flexShrink: 0,
                              border: '1px solid #27272a',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'center',
                              cursor: product.image_url ? 'pointer' : 'default'
                            }}
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <span style={{ color: '#52525b', fontSize: '9px' }}>NO IMG</span>
                            )}
                          </div>

                          {/* নাম */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4
                              style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#ffffff',
                                margin: 0,
                                lineHeight: '1.3',
                                wordBreak: 'break-word'
                              }}
                            >
                              {product.title}
                            </h4>
                          </div>

                          {/* SVG Visibility Icon Button */}
                          <button
                            type="button"
                            onClick={() => onToggleVisibility(product.id, isVisible)}
                            disabled={isToggling}
                            title={isVisible ? 'Hide Product' : 'Make Product Visible'}
                            style={{
                              backgroundColor: isVisible ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                              border: isVisible ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #27272a',
                              borderRadius: '8px',
                              width: '38px',
                              height: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              justify: 'center',
                              cursor: 'pointer',
                              flexShrink: 0,
                              transition: 'all 0.2s ease',
                              padding: 0
                            }}
                          >
                            {isToggling ? (
                              <span style={{ fontSize: '10px', color: '#a1a1aa' }}>...</span>
                            ) : (
                              <VisibilityIcon visible={isVisible} size={18} />
                            )}
                          </button>
                        </div>

                        {/* প্রাইসিং তথ্য গ্রিড */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '6px',
                            backgroundColor: '#18181b',
                            padding: '10px 8px',
                            borderRadius: '8px',
                            border: '1px solid #27272a',
                            textAlign: 'center',
                            width: '100%',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              SELL PRICE
                            </span>
                            <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '700', fontFamily: 'monospace' }}>
                              ৳{sellingPrice.toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              YOUR COMM.
                            </span>
                            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700', fontFamily: 'monospace' }}>
                              +৳{ambassadorCommissionAmount.toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              CUST. OFFER
                            </span>
                            <span style={{ fontSize: '12px', color: customerDiscountAmount > 0 ? '#f43f5e' : '#71717a', fontWeight: '700', fontFamily: 'monospace' }}>
                              {customerDiscountAmount > 0 ? `-৳${customerDiscountAmount.toLocaleString()}` : 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* লাইটবক্স ইমেজ প্রিভিউ পপআপ (CloseIcon ব্যবহার করা হয়েছে) */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            padding: '16px',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              backgroundColor: '#121215',
              borderRadius: '16px',
              padding: '8px',
              border: '1px solid #27272a',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* index.ts থেকে আনীত CloseIcon যুক্ত ক্রস বাটন */}
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              title="Close Preview"
              style={{
                position: 'absolute',
                top: '-12px',
                right: '-12px',
                backgroundColor: '#27272a',
                color: '#ffffff',
                border: '1px solid #3f3f46',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                padding: 0
              }}
            >
              <CloseIcon size={16} color="#ffffff" />
            </button>

            <img
              src={previewImage}
              alt="Product Full Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '12px',
                display: 'block'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
