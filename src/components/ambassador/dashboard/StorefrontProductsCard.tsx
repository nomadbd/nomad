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
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        border: '1px solid #27272a',
        padding: '16px',
        borderRadius: '16px',
        width: '100%',
        boxSizing: 'border-box',
        color: '#ffffff'
      }}
    >
      {/* ১. প্রিমিয়াম হেডার ও কাউন্টার */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid #18181b'
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '13px',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '1.2px',
              color: '#f4f4f5',
              fontWeight: '700'
            }}
          >
            Store Products
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#a1a1aa' }}>
            আপনার স্টোরের প্রোডাক্ট ও কমিশন ম্যানেজমেন্ট
          </p>
        </div>

        <span
          style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '4px 10px',
            borderRadius: '20px',
            letterSpacing: '0.5px'
          }}
        >
          {visibleCount} Active
        </span>
      </div>

      {/* ২. সার্চ ও ফিল্টার বার (অনেক প্রোডাক্ট সামলানোর জন্য) */}
      {assignedProducts.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#fff',
              outline: 'none'
            }}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '12px',
              color: '#a1a1aa',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
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
        /* ৪. স্লিম প্রিমিয়াম প্রোডাক্ট লিস্ট */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {filteredProducts.map((product) => {
            const isVisible = product.is_visible;
            const isToggling = togglingId === product.id;

            // মূল হিসাবসমূহ
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
                  backgroundColor: isVisible ? '#121215' : '#0c0c0e',
                  border: isVisible ? '1px solid #27272a' : '1px solid #1a1a1e',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  opacity: isVisible ? 1 : 0.6,
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {/* কার্ড টপ: থাম্বনেইল, প্রোডাক্ট টাইটেল ও VISIBLE অ্যাকশন বাটন */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* পরিচ্ছন্ন থাম্বনেইল ছবি (কোনো ওভারলে ছাড়া) */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#18181b',
                      flexShrink: 0,
                      border: '1px solid #27272a'
                    }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b', fontSize: '9px' }}>
                        NO IMG
                      </div>
                    )}
                  </div>

                  {/* টাইটেল ও ক্যাটাগরি */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: '0 0 4px 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
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

                  {/* ভিসিবল / হাইড বাটন (কার্ডের ডান পাশে প্রিমিয়াম টগল বাটন) */}
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(product.id, isVisible)}
                    disabled={isToggling}
                    style={{
                      backgroundColor: isVisible ? '#ffffff' : '#18181b',
                      color: isVisible ? '#000000' : '#71717a',
                      border: isVisible ? '1px solid #ffffff' : '1px solid #27272a',
                      padding: '6px 12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      letterSpacing: '0.5px',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isToggling ? '...' : isVisible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </div>

                {/* কার্ড বটম: অ্যাম্বাসেডরের জন্য প্রয়োজনীয় ৩টি পরিষ্কার ইনফরমেশন গ্রিড */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '6px',
                    backgroundColor: '#18181b',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #27272a'
                  }}
                >
                  {/* ১. প্রডাক্ট এর দাম (Admin Set Price) */}
                  <div>
                    <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                      Price
                    </span>
                    <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '700', fontFamily: 'monospace' }}>
                      ৳{sellingPrice.toLocaleString()}
                    </span>
                  </div>

                  {/* ২. অ্যাম্বাসেডরের নিজের কমিশন */}
                  <div>
                    <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                      Your Comm.
                    </span>
                    <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '700', fontFamily: 'monospace' }}>
                      +৳{commission.toLocaleString()}
                    </span>
                  </div>

                  {/* ৩. কাস্টমার কী ছাড় পাবে */}
                  <div>
                    <span style={{ fontSize: '9px', color: '#a1a1aa', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
                      Cust. Offer
                    </span>
                    <span style={{ fontSize: '13px', color: customerDiscount > 0 ? '#f43f5e' : '#71717a', fontWeight: '700', fontFamily: 'monospace' }}>
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
