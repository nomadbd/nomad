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
      {/* রো ১: ছবি + নাম + ড্রপডাউন অ্যারো */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '6px',
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#000',
              border: '1px solid #222',
            }}
          >
            <ProductMediaViewer media={mediaList} productName={product.name} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <h4
              style={{
                fontSize: '13px',
                color: '#fff',
                margin: 0,
                fontWeight: '600',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0,
              }}
              title={product.name}
            >
              {product.name}
            </h4>
            {isHidden && (
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                HIDDEN
              </span>
            )}
          </div>
        </div>

        {/* প্রিমিয়াম ড্রপডাউন টগল আইকন */}
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

      {/* রো ২: বামে দাম ও তারিখ, ডানে অ্যাকশন আইকনসমূহ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', marginTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'monospace' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>৳{product.price}</span>
          <span style={{ fontSize: '10px', color: '#555' }}>{formatDate(product.created_at)}</span>
        </div>

        <ProductActionToolbar
          product={product}
          onUpdateStock={onUpdateStock}
          onEdit={onEdit}
          onUnhide={onUnhide}
        />
      </div>

      {/* বিস্তারিত অংশ (এক্সপ্যান্ড করলে আসবে) */}
      {isExpanded && (
        <div
          className="animate-fade-in"
          style={{
            borderTop: '1px solid #161616',
            paddingTop: '10px',
            marginTop: '4px',
            fontSize: '12px',
            color: '#aaa',
          }}
        >
          {product.description && (
            <p style={{ margin: '0 0 8px 0', lineHeight: '1.4', color: '#bbb' }}>{product.description}</p>
          )}

          {product.details && Object.keys(product.details).length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: '#030303',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #141414',
              }}
            >
              {Object.entries(product.details).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ color: '#666', textTransform: 'uppercase' }}>{key}:</span>
                  <span style={{ color: '#ccc' }}>{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
