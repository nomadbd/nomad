import React, { useState, useMemo } from 'react';

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

  // ১. কাউন্ট মেট্রিক্স
  const totalCount = assignedProducts.length;
  const activeCount = useMemo(() => assignedProducts.filter((p) => p.is_visible).length, [assignedProducts]);
  const hiddenCount = totalCount - activeCount;

  // ২. ক্যাটাগরি ভিত্তিক গ্রুপিং ও ফিল্টারিং
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

  // See More / See Less টগল
  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', color: '#ffffff' }}>
      
      {/* ১. টপ ৩টি সামারি কার্ড (মূল লেআউটের সাথে সামঞ্জস্যপূর্ণ) */}
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

      {/* ২. সেকশন টাইটেল ও স্বাধীন ফুল-উইডথ সার্চবার */}
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '12px',
            margin: '0 0 10px 0',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: '#ffffff',
            fontWeight: '700'
          }}
        >
          STORE PRODUCTS
        </h2>

        <div style={{ width: '100%' }}>
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
      </div>

      {/* ৩. লোডিং ও খালি স্টেট */}
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
        /* ৪. ক্যাটাগরি ভিত্তিক পণ্য তালিকা */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {Object.entries(groupedProducts).map(([categoryName, products]) => {
            const isExpanded = !!expandedCategories[categoryName];
            // ডিফল্টভাবে ১টি বা ২টি প্রডাক্ট দেখানো হবে, 'See More' এ ক্লিক করলে সবকটি দেখাবে
            const visibleProducts = isExpanded ? products : products.slice(0, 2);

            return (
              <div key={categoryName} style={{ width: '100%' }}>
                
                {/* ক্যাটাগরি হেডার (See More/Less এখন ক্যাটাগরির মতো একই কালার ও ট্রায়াঙ্গেল টগল ছাড়া) */}
                <div
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    marginBottom: '10px',
                    paddingBottom: '6px',
                    borderBottom: '1px solid #1f1f23'
                  }}
                >
                  <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#a1a1aa', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {categoryName} <span style={{ color: '#52525b', fontSize: '11px' }}>({products.length})</span>
                  </h3>

                  {products.length > 2 && (
                    <button
                      type="button"
                      onClick={() => toggleCategoryExpand(categoryName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a1a1aa', // ক্যাটাগরির রঙের সাথে ম্যাচিং
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {isExpanded ? 'See Less' : 'See More'}
                    </button>
                  )}
                </div>

                {/* প্রডাক্ট লিস্ট (১০০% উইডথ যাতে পর্যাপ্ত জায়গা থাকে) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                  {visibleProducts.map((product) => {
                    const isVisible = product.is_visible;
                    const isToggling = togglingId === product.id;

                    // --- 🧮 প্রাইসিং হিসাব ---
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
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* প্রডাক্ট হেডার: ছবি, নাম ও VISIBLE বাটন */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                          <div
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
                              justify: 'center'
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

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4
                              style={{
                                fontSize: '13px',
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

                          <button
                            type="button"
                            onClick={() => onToggleVisibility(product.id, isVisible)}
                            disabled={isToggling}
                            style={{
                              backgroundColor: isVisible ? '#ffffff' : '#18181b',
                              color: isVisible ? '#000000' : '#71717a',
                              border: isVisible ? '1px solid #ffffff' : '1px solid #27272a',
                              padding: '6px 10px',
                              fontSize: '10px',
                              fontWeight: '700',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              letterSpacing: '0.5px',
                              flexShrink: 0
                            }}
                          >
                            {isToggling ? '...' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                          </button>
                        </div>

                        {/* প্রাইসিং মেট্রিক্স - পর্যাপ্ত জায়গা পাওয়ায় এখন ৩টি সুন্দর কলামে দেখাবে */}
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
                          {/* ১. বিক্রয় মূল্য */}
                          <div>
                            <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              SELL PRICE
                            </span>
                            <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '700', fontFamily: 'monospace' }}>
                              ৳{sellingPrice.toLocaleString()}
                            </span>
                          </div>

                          {/* ২. কমিশন */}
                          <div>
                            <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              YOUR COMM.
                            </span>
                            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700', fontFamily: 'monospace' }}>
                              +৳{ambassadorCommissionAmount.toLocaleString()}
                            </span>
                          </div>

                          {/* ৩. কাস্টমার অফার */}
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
    </div>
  );
}
