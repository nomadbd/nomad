import React, { useState, useMemo } from 'react';

export interface AssignedProduct {
  id: string | number;
  title: string;
  description?: string;
  regular_price?: number; // মূল দাম (Base / MRP Price)
  price: number;         // ব্যাকএন্ড প্রাইস
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

  // ২. ফিল্টার ও ক্যাটাগরি অনুসারে গ্রুপিং
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

  // See More / See Less টগল হ্যান্ডলার
  const toggleCategoryExpand = (catName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  return (
    <section
      style={{
        backgroundColor: '#09090b',
        border: '1px solid #1f1f23',
        padding: '16px',
        borderRadius: '16px',
        width: '100%',
        boxSizing: 'border-box',
        color: '#ffffff'
      }}
    >
      {/* ১. টপ ৩টি সামারি কার্ড (Total, Active, Hidden) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}
      >
        {/* Total Card */}
        <div
          style={{
            backgroundColor: '#121215',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '10px 8px',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total
          </span>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace' }}>
            {totalCount}
          </span>
        </div>

        {/* Active Card */}
        <div
          style={{
            backgroundColor: '#062016',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '10px 8px',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '9px', color: '#34d399', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active
          </span>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981', fontFamily: 'monospace' }}>
            {activeCount}
          </span>
        </div>

        {/* Hidden Card */}
        <div
          style={{
            backgroundColor: '#1f1315',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: '12px',
            padding: '10px 8px',
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '9px', color: '#f43f5e', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hidden
          </span>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#f43f5e', fontFamily: 'monospace' }}>
            {hiddenCount}
          </span>
        </div>
      </div>

      {/* ২. সেকশন টাইটেল ও ফুল-উইডথ সার্চ বার */}
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
          Store Products
        </h2>

        <div style={{ width: '100%' }}>
          <input
            type="text"
            placeholder="Search products across all categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '12px',
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* ৩. লোডিং ও নো-প্রোডাক্ট স্টেট */}
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
        /* ৪. ক্যাটাগরি ভিত্তিক স্ক্রলিং ও গ্রিড লেআউট */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {Object.entries(groupedProducts).map(([categoryName, products]) => {
            const isExpanded = !!expandedCategories[categoryName];

            return (
              <div key={categoryName} style={{ width: '100%' }}>
                {/* ক্যাটাগরি হেডার ও See More / See Less বাটন */}
                <div
                  style={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    paddingBottom: '4px',
                    borderBottom: '1px solid #1f1f23'
                  }}
                >
                  <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#a1a1aa', margin: 0, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    {categoryName} <span style={{ color: '#52525b', fontSize: '10px' }}>({products.length})</span>
                  </h3>

                  <button
                    type="button"
                    onClick={() => toggleCategoryExpand(categoryName)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '10px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {isExpanded ? 'See Less ▲' : 'See More ▼'}
                  </button>
                </div>

                {/* প্রোডাক্ট কনটেইনার (স্ক্রল বনাম বিস্তৃত গ্রিড) */}
                <div
                  style={
                    isExpanded
                      ? {
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                          gap: '12px',
                          width: '100%'
                        }
                      : {
                          display: 'flex',
                          gap: '12px',
                          overflowX: 'auto',
                          paddingBottom: '8px',
                          width: '100%',
                          WebkitOverflowScrolling: 'touch'
                        }
                  }
                >
                  {products.map((product) => {
                    const isVisible = product.is_visible;
                    const isToggling = togglingId === product.id;

                    // --- 🧮 গাণিতিক হিসাব ---
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
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          opacity: isVisible ? 1 : 0.55,
                          transition: 'all 0.2s ease-in-out',
                          // স্ক্রল মোডে ফিক্সড চওড়া রাখা যেন না চ্যাপ্টা হয়ে যায়
                          flex: isExpanded ? 'none' : '0 0 280px',
                          boxSizing: 'border-box'
                        }}
                      >
                        {/* কার্ডের উপরের অংশ */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div
                            style={{
                              width: '64px',
                              height: '64px',
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
                                  objectFit: 'contain'
                                }}
                              />
                            ) : (
                              <span style={{ color: '#52525b', fontSize: '9px' }}>NO IMG</span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                            <h4
                              style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#ffffff',
                                margin: '0 0 4px 0',
                                lineHeight: '1.3',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
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
                              padding: '5px 8px',
                              fontSize: '9px',
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

                        {/* কার্ডের নিচের অংশ: ৩টি প্রাইস বক্সে রিয়েল-টাইম ডাটা */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '4px',
                            backgroundColor: '#18181b',
                            padding: '8px',
                            borderRadius: '8px',
                            border: '1px solid #27272a',
                            textAlign: 'center'
                          }}
                        >
                          {/* ১. বিক্রয় মূল্য */}
                          <div>
                            <span style={{ fontSize: '8px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              Sell Price
                            </span>
                            <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: '700', fontFamily: 'monospace' }}>
                              ৳{sellingPrice.toLocaleString()}
                            </span>
                            {customerDiscountAmount > 0 && (
                              <span style={{ fontSize: '8px', color: '#71717a', textDecoration: 'line-through', display: 'block' }}>
                                ৳{basePrice.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* ২. অ্যাম্বাসেডরের নিট কমিশন (পারসেন্টেজ লেখা বাদ দেওয়া হয়েছে) */}
                          <div>
                            <span style={{ fontSize: '8px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              Your Comm.
                            </span>
                            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700', fontFamily: 'monospace' }}>
                              +৳{ambassadorCommissionAmount.toLocaleString()}
                            </span>
                          </div>

                          {/* ৩. কাস্টমার অফার */}
                          <div>
                            <span style={{ fontSize: '8px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                              Cust. Offer
                            </span>
                            <span style={{ fontSize: '11px', color: customerDiscountAmount > 0 ? '#f43f5e' : '#71717a', fontWeight: '700', fontFamily: 'monospace' }}>
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
    </section>
  );
}
