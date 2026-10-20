import React, { useState } from 'react';
import { Product } from './products.types';
import { ProductMediaViewer } from './ProductMediaViewer';
import { ProductActionToolbar } from './ProductActionToolbar';
import { ChevronDownIcon } from '../../icons';

interface ProductShowroomCardProps {
  product: Product;
  onUpdateStock: (id: string | number, currentStock: number, change: number) => void;
  onEdit: (product: Product) => void;
  onUnhide: (id: string | number) => void;
}

export const ProductShowroomCard: React.FC<ProductShowroomCardProps> = ({
  product,
  onUpdateStock,
  onEdit,
  onUnhide,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mediaList =
    product.product_media && product.product_media.length > 0
      ? product.product_media.map((m) => ({ media_url: m.media_url, media_type: m.media_type }))
      : product.image_url
      ? [{ media_url: product.image_url, media_type: 'image' }]
      : [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const isHidden = product.status === 'archived' || product.status === 'hidden';

  return (
    <div
      className="admin-product-row smooth-transition"
      style={{
        width: '100%',
        backgroundColor: '#080808',
        border: '1px solid #1a1a1a',
        borderRadius: '6px',
        marginBottom: '8px',
        padding: '10px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        opacity: isHidden ? 0.6 : 1,
      }}
    >
      {/* রো ০: তারিখ একাই একদম উপরে ডান পাশে */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <span style={{ fontSize: '10px', color: '#555', fontFamily: 'sans-serif' }}>
          {formatDate(product.created_at)}
        </span>
      </div>

      {/* রো ১: ছবির পাশে নাম এবং তার পাশেই ড্রপডাউন অ্যারো */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '6px',
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#000',
              border: '1px solid #222',
            }}
          >
            <ProductMediaViewer media={mediaList} productName={product.name} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1, minWidth: 0 }}>
            <h4
              style={{
                fontSize: '13px',
                color: '#fff',
                margin: 0,
                fontWeight: '600',
                lineHeight: '1.35',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                maxHeight: '36px',
                flex: 1,
                minWidth: 0,
                fontFamily: 'sans-serif',
              }}
              title={product.name}
            >
              {product.name}
            </h4>
            {isHidden && (
              <span
                style={{
                  fontSize: '9px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  flexShrink: 0,
                  fontFamily: 'sans-serif',
                }}
              >
                HIDDEN
              </span>
            )}
          </div>
        </div>

        {/* ড্রপডাউন টগল আইকন */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Hide Details' : 'Show Details'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <ChevronDownIcon
            size={16}
            color="currentColor"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </button>
      </div>

      {/* রো ২: ছবির নিচে দাম, দাম বরাবর ডানে অ্যাকশন আইকনসমূহ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', marginTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold', fontFamily: 'sans-serif' }}>৳{product.price}</span>
        </div>

        <ProductActionToolbar
          product={product}
          onUpdateStock={onUpdateStock}
          onEdit={onEdit}
          onUnhide={onUnhide}
        />
      </div>

      {/* বিস্তারিত অংশ - ধারাবাহিক সাজানো ও সাধারণ রেগুলার ফন্ট */}
      {isExpanded && (
        <div
          className="animate-fade-in"
          style={{
            borderTop: '1px solid #161616',
            paddingTop: '12px',
            marginTop: '6px',
            fontSize: '12px',
            color: '#ccc',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* ১. পূর্ণাঙ্গ নাম */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '10px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Full Name
            </span>
            <span style={{ color: '#fff', fontSize: '13px', lineHeight: '1.4' }}>
              {product.name}
            </span>
          </div>

          {/* ২. শর্ট ডেসক্রিপশন */}
          {product.description && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '10px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Description
              </span>
              <p style={{ margin: 0, lineHeight: '1.5', color: '#bbb', fontSize: '12px' }}>
                {product.description}
              </p>
            </div>
          )}

          {/* ৩. স্পেসিফিকেশন/ডিটেইলস (সবার নিচে) */}
          {product.details && Object.keys(product.details).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Specifications
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px 12px',
                  backgroundColor: '#040404',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #141414',
                }}
              >
                {Object.entries(product.details).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>{key}</span>
                    <span style={{ color: '#ddd', fontSize: '12px', fontWeight: '500' }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
