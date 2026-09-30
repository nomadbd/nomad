import React, { useState, useMemo } from 'react';

export interface AssignedProduct {
  id: string | number;
  title: string;
  description?: string;
  regular_price?: number; // কাস্টমারের মূল রিটেইল প্রাইস
  price: number;         // ফাইনাল বিক্রয় মূল্য (এডমিন নির্ধারিত)
  image_url?: string;
  category?: string;
  is_visible: boolean;
  status?: 'active' | 'sold_out' | string;
  stock_quantity?: number;
  commission_amount?: number; // ফিক্সড কমিশন
  commission_rate?: number;   // শতাংশ কমিশন
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'visible' | 'hidden'>('all');

  // ফিল্টারড প্রোডাক্ট হিসেব
  const filteredProducts = useMemo(() => {
    return assignedProducts.filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (filterStatus === 'visible') return matchesSearch && product.is_visible;
      if (filterStatus === 'hidden') return matchesSearch && !product.is_visible;
      return matchesSearch;
    });
  }, [assignedProducts, searchQuery, filterStatus]);

  const visibleCount = assignedProducts.filter((p) => p.is_visible).length;

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
      {/* ১. প্রিমিয়াম হেডার */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '12px',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: '#ffffff',
              fontWeight: '700'
            }}
          >
            Store Products
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#71717a' }}>
            আপনার স্টোরের প্রোডাক্ট ও কমিশন ম্যানেজমেন্ট
          </p>
        </div>

        <span
          style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '4px 10px',
            borderRadius: '20px',
            letterSpacing: '0.5px'
          }}
        >
          {visibleCount} Active
        </span>
      </div>

      {/* ২. ডার্ক ম্যাচিং সার্চ ও ফিল্টার বার */}
      {assignedProducts.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#121215',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '12px',
                color: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '12px',
              color: '#a1a1aa',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all" style={{ backgroundColor: '#121215', color: '#fff' }}>All</option>
            <option value="visible" style={{ backgroundColor: '#121215', color: '#fff' }}>Visible</option>
            <option value="hidden" style={{ backgroundColor: '#121215', color: '#fff' }}>Hidden</option>
          </select>
        </div>
      )}

      {/* ৩. লোডিং ও খালি স্টেট */}
      {loadingProducts ? (
        <div style={{ fontSize: '12px', color: '#71717a', padding: '30px 0', textAlign: 'center' }}>
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
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
        /* ৪. সামঞ্জস্যপূর্ণ স্লিম লিস্ট লেআউট */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {filteredProducts.map((product) => {
            const isVisible = product.is_visible;
            const isToggling = togglingId === product.id;

            // মূল্য ও কমিশন হিসাব
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
                  backgroundColor: isVisible ? '#121215' : '#0a0a0c',
                  border: isVisible ? '1px solid #27272a' : '1px solid #1a1a1e',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  opacity: isVisible ? 1 : 0.55,
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {/* কার্ড এর উপর অংশ: প্রোডাক্টের ছবি, টাইটেল এবং দৃশ্যমানতা বাটন */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* ছবি: কনসিস্টেন্ট ১:১ রেশিও + সেফ ফিট (ছবি কখনো কাটবে না) */}
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
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
                          objectFit: 'contain', // পুরো ছবি অক্ষত রাখবে
                          display: 'block'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#52525b', fontSize: '9px' }}>NO IMG</span>
                    )}
                  </div>

                  {/* টাইটেল এবং ক্যাটাগরি (নাম কাটবে না) */}
                  <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                    <h3
                      style={{
                        fontSize: '13px',
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
                    </h3>
                    {product.category && (
                      <span style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {product.category}
                      </span>
                    )}
                  </div>

                  {/* টগল বাটন */}
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
                      flexShrink: 0,
                      marginTop: '2px'
                    }}
                  >
                    {isToggling ? '...' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>

                {/* কার্ড এর নিচের অংশ: প্রয়োজনীয় ৩টি স্বচ্ছ তথ্য */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '4px',
                    backgroundColor: '#18181b',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                    textAlign: 'center'
                  }}
                >
                  {/* এডমিন নির্ধারিত বিক্রয় মূল্য */}
                  <div>
                    <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                      Price
                    </span>
                    <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '700', fontFamily: 'monospace' }}>
                      ৳{sellingPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* অ্যাম্বাসেডরের কমিশন */}
                  <div>
                    <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                      Your Comm.
                    </span>
                    <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '700', fontFamily: 'monospace' }}>
                      +৳{commission.toLocaleString()}
                    </span>
                  </div>

                  {/* কাস্টমারের জন্য ছাড় */}
                  <div>
                    <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                      Cust. Offer
                    </span>
                    <span style={{ fontSize: '12px', color: customerDiscount > 0 ? '#f43f5e' : '#71717a', fontWeight: '700', fontFamily: 'monospace' }}>
                      {customerDiscount > 0 ? `-৳${customerDiscount.toLocaleString()}` : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
