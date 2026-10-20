import React, { useState } from 'react';
import { Product } from './products.types';
import { ProductMediaViewer } from './ProductMediaViewer';
import { ProductActionToolbar } from './ProductActionToolbar';

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

  const formatId = (id: string | number) => {
    const s = String(id);
    return s.length > 8 ? s.slice(0, 8) + '...' : s;
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
        padding: '10px 14px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        opacity: isHidden ? 0.6 : 1,
      }}
    >
      {/* মূল রো কন্ট্রোল - এক নজরে সব তথ্য */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* প্রোডাক্ট থাম্বনেইল ছবি ও প্রাথমিক তথ্য */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px', minWidth: '0' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '6px',
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: '#000',
              border: '1px solid #222',
            }}
          >
            <ProductMediaViewer media={mediaList} productName={product.name} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4
                style={{
                  fontSize: '13px',
                  color: '#fff',
                  margin: 0,
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
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
                  }}
                >
                  HIDDEN
                </span>
              )}
            </div>

            <div
              style={{
                fontSize: '10px',
                color: '#666',
                fontFamily: 'monospace',
                marginTop: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>ID: {formatId(product.id)}</span>
              <span>•</span>
              <span>{formatDate(product.created_at)}</span>
            </div>
          </div>
        </div>

        {/* প্রাইস ও ক্যাটাগরি পিল */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            flexShrink: 0,
            fontFamily: 'monospace',
          }}
        >
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>৳{product.price}</div>
            <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase' }}>
              {product.category || 'GENERAL'}
            </div>
          </div>
        </div>

        {/* টুলবার ও একশন বাটন (স্টক আপডেট, এডিট, ভিউ) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <ProductActionToolbar
            product={product}
            onUpdateStock={onUpdateStock}
            onEdit={onEdit}
            onUnhide={onUnhide}
          />

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: '1px solid #262626',
              borderRadius: '4px',
              color: '#888',
              fontSize: '10px',
              fontFamily: 'monospace',
              padding: '6px 10px',
              cursor: 'pointer',
            }}
          >
            {isExpanded ? 'LESS ▲' : 'DETAILS ▼'}
          </button>
        </div>
      </div>

      {/* প্রসারিত ভিউ (যদি ডেসক্রিপশন বা ডিটেইলস দেখতে চায়) */}
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
