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
  const [isStockEditing, setIsStockEditing] = useState(false);

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

  const rawDetails = (product.details || {}) as Record<string, any>;
  const mergedSpecs: Record<string, any> = { ...rawDetails };

  const hasValidValue = (val: any) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  };

  const sizesData = (product as any).sizes || (product as any).available_sizes || rawDetails.sizes || rawDetails.SIZE || rawDetails.SIZES;
  if (hasValidValue(sizesData) && !mergedSpecs.SIZE && !mergedSpecs.SIZES && !mergedSpecs.sizes) {
    mergedSpecs['SIZES'] = Array.isArray(sizesData) ? sizesData.join(', ') : sizesData;
  }

  const colorsData = (product as any).colors || (product as any).available_colors || rawDetails.colors || rawDetails.COLOR || rawDetails.COLORS;
  if (hasValidValue(colorsData) && !mergedSpecs.COLOR && !mergedSpecs.COLORS && !mergedSpecs.colors) {
    mergedSpecs['COLORS'] = Array.isArray(colorsData) ? colorsData.join(', ') : colorsData;
  }

  const { details: extraText1, DETAILS: extraText2, ...specsMap } = mergedSpecs;
  const bottomDetailsValue = hasValidValue(extraText1) ? extraText1 : hasValidValue(extraText2) ? extraText2 : null;

  const madeInEntry = Object.entries(specsMap).find(
    ([key, val]) => key.toLowerCase().replace(/_/g, ' ') === 'made in' && hasValidValue(val)
  );
  const madeInKey = madeInEntry ? madeInEntry[0] : null;
  const madeInValue = madeInEntry ? madeInEntry[1] : null;

  const standardSpecs = Object.fromEntries(
    Object.entries(specsMap).filter(([key, value]) => key !== madeInKey && hasValidValue(value))
  );

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <span style={{ fontSize: '10px', color: '#999', fontFamily: 'sans-serif' }}>
          {formatDate(product.created_at)}
        </span>
      </div>

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

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Hide Details' : 'Show Details'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#aaa',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            marginTop: '-2px',
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', width: '100%', marginTop: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold', fontFamily: 'sans-serif' }}>৳{product.price}</span>
          {!isStockEditing && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: '600',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                backgroundColor: product.stock_quantity > 0 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.15)',
                color: product.stock_quantity > 0 ? '#aaa' : '#ef4444',
                border: `1px solid ${product.stock_quantity > 0 ? '#222' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {product.stock_quantity > 0 ? `Stock: ${product.stock_quantity}` : 'OUT OF STOCK'}
            </span>
          )}
        </div>

        <ProductActionToolbar
          product={product}
          onUpdateStock={onUpdateStock}
          onEdit={onEdit}
          onUnhide={onUnhide}
          setIsStockEditing={setIsStockEditing}
        />
      </div>

      {isExpanded && (
        <div
          className="animate-fade-in"
          style={{
            borderTop: '1px solid #1f1f1f',
            paddingTop: '12px',
            marginTop: '6px',
            fontSize: '13px',
            color: '#eee',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Full Name
            </span>
            <span style={{ color: '#ffffff', fontSize: '13px', lineHeight: '1.4' }}>
              {product.name}
            </span>
          </div>

          {product.description && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Description
              </span>
              <p style={{ margin: 0, lineHeight: '1.5', color: '#eeeeee', fontSize: '13px' }}>
                {product.description}
              </p>
            </div>
          )}

          {((standardSpecs && Object.keys(standardSpecs).length > 0) || madeInValue || bottomDetailsValue) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Specifications
              </span>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: '#040404',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #1a1a1a',
                }}
              >
                {Object.keys(standardSpecs).length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: '10px 14px',
                    }}
                  >
                    {Object.entries(standardSpecs).map(([key, value]) => {
                      const valStr = Array.isArray(value) ? value.join(', ') : String(value ?? '');
                      const isLongText = valStr.length > 20;
                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            gridColumn: isLongText ? 'span 2' : 'auto',
                          }}
                        >
                          <span style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase' }}>
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500', wordBreak: 'break-word' }}>
                            {valStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {madeInValue && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      borderTop: Object.keys(standardSpecs).length > 0 ? '1px solid #222222' : 'none',
                      paddingTop: Object.keys(standardSpecs).length > 0 ? '8px' : '0',
                    }}
                  >
                    <span style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase' }}>
                      {madeInKey ? madeInKey.replace(/_/g, ' ') : 'MADE IN'}
                    </span>
                    <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
                      {Array.isArray(madeInValue) ? madeInValue.join(', ') : String(madeInValue)}
                    </span>
                  </div>
                )}

                {bottomDetailsValue && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      borderTop: (Object.keys(standardSpecs).length > 0 || madeInValue) ? '1px solid #222222' : 'none',
                      paddingTop: (Object.keys(standardSpecs).length > 0 || madeInValue) ? '8px' : '0',
                    }}
                  >
                    <span style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase' }}>DETAILS</span>
                    <span style={{ color: '#ffffff', fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      {Array.isArray(bottomDetailsValue) ? bottomDetailsValue.join(', ') : String(bottomDetailsValue)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
