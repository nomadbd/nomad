import React, { useState } from 'react';
import { Product } from './products.type';
import { ProductMediaViewer } from './ProductMediaViewer';
import { ProductActionToolbar } from './ProductActionToolbar';

interface ProductShowroomCardProps {
  product: Product;
  onUpdateStock: (id: string | number, currentStock: number, change: number) => void;
  onEdit: (product: Product) => void;
  onUnhide: (id: string | number) => void;
}

export const ProductShowroomCard: React.FC<ProductShowroomCardProps> = ({ product, onUpdateStock, onEdit, onUnhide }) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const mediaList = (product.product_media && product.product_media.length > 0)
    ? product.product_media.map(m => ({ media_url: m.media_url, media_type: m.media_type }))
    : (product.image_url ? [{ media_url: product.image_url, media_type: 'image' }] : []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}, ${m}, ${day}`;
  };

  const formatId = (id: string | number) => {
    const s = String(id);
    if (s.length > 12) return s.slice(0, 12) + '....';
    return s;
  };

  return (
    <div className="showroom-card-item animate-card smooth-transition" style={{ scrollSnapAlign: 'start', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '8px' }}>
      <ProductMediaViewer media={mediaList} productName={product.name} />

      <div style={{ marginTop: '15px', padding: '0 15px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px 0', fontWeight: '600' }}>{product.name}</h3>
        <div style={{ fontSize: '11px', color: '#888', fontFamily: 'monospace', margin: '0 0 10px 0', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1, minWidth: 0 }}>{formatId(product.id)}</span>
          <span style={{ color: '#555', margin: '0 8px', flexShrink: 0 }}>·</span>
          <span style={{ flexShrink: 0, marginLeft: 'auto' }}>{formatDate(product.created_at)}</span>
        </div>

        <div style={{ margin: '0 0 10px 0' }}>
          {(() => {
            const descriptionText = product.description || '';
            const characterLimit = 75;
            const isLongText = descriptionText.length > characterLimit;
            const hasDetails = product.details && Object.keys(product.details).length > 0;
            const shouldShowSeeMore = isLongText || hasDetails;
            const displayedText = isLongText ? descriptionText.slice(0, characterLimit) + '...' : descriptionText;

            return !isDescExpanded ? (
              <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                {displayedText || (hasDetails ? '' : 'No description provided.')}
                {shouldShowSeeMore && (
                  <span
                    onClick={() => setIsDescExpanded(true)}
                    className="smooth-transition"
                    style={{ fontSize: '12px', color: '#fff', cursor: 'pointer', marginLeft: displayedText ? '6px' : '0', fontWeight: '500', display: 'inline' }}
                  >
                    see more
                  </span>
                )}
              </p>
            ) : (
              <div className="animate-fade-in">
                <p style={{ fontSize: '13px', color: '#aaa', margin: 0, lineHeight: '1.4' }}>
                  {descriptionText}
                </p>
                {product.details && Object.keys(product.details).length > 0 && (
                  <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {(() => {
                      const specKeys = ['FIT', 'GSM', 'MATERIAL', 'COLOR', 'SLEEVE', 'PATTERN', 'OCCASION', 'CARE', 'MADE IN'];
                      const detailsObj = product.details || {};
                      const detailKeys = Object.keys(detailsObj);

                      const getVal = (targetKey: string) => {
                        const foundKey = detailKeys.find(
                          (k) =>
                            k.trim().toUpperCase() === targetKey ||
                            k.trim().toUpperCase().replace(/\s+/g, '') === targetKey.replace(/\s+/g, '')
                        );
                        return foundKey ? detailsObj[foundKey] : null;
                      };

                      const detailsVal = getVal('DETAILS');

                      return (
                        <>
                          {specKeys.map((key) => {
                            const val = getVal(key);
                            if (!val) return null;
                            return (
                              <div key={key} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                <span style={{ color: '#fff', width: '95px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</span>
                                <span style={{ color: '#555', marginRight: '10px', flexShrink: 0 }}>:</span>
                                <span style={{ color: '#ccc', fontWeight: '400', flex: 1, overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}>{String(val)}</span>
                              </div>
                            );
                          })}

                          {detailsVal && (
                            <div style={{ marginTop: '4px', color: '#ccc', fontWeight: '400', overflowWrap: 'break-word', wordBreak: 'break-word', lineHeight: '1.4' }}>
                              {String(detailsVal)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
                <span
                  onClick={() => setIsDescExpanded(false)}
                  className="smooth-transition"
                  style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', marginTop: '12px', display: 'inline-block', letterSpacing: '0.5px' }}
                >
                  see less
                </span>
              </div>
            );
          })()}
        </div>

        <ProductActionToolbar product={product} onUpdateStock={onUpdateStock} onEdit={onEdit} onUnhide={onUnhide} />
      </div>
    </div>
  );
};
