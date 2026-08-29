import React, { useState } from 'react';
import { Product } from '../types/product.types';

interface ProductActionToolbarProps {
  product: Product;
  onUpdateStock: (id: string | number, currentStock: number, change: number) => void;
  onEdit: (product: Product) => void;
  onUnhide: (id: string | number) => void;
}

export const ProductActionToolbar: React.FC<ProductActionToolbarProps> = ({ product, onUpdateStock, onEdit, onUnhide }) => {
  const [step, setStep] = useState<'idle' | 'manage'>('idle');
  const isSoldOut = product.status === 'sold_out' || product.stock_quantity <= 0;
  const isHidden = product.status === 'archived' || product.status === 'hidden';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', marginTop: '10px', boxSizing: 'border-box', width: '100%' }}>
      {step === 'idle' && (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px' }}>
          <span style={{ fontSize: '14px', color: isSoldOut ? '#555' : '#fff', fontWeight: 500, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flexShrink: 1 }}>৳{product.price}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {isHidden ? (
              <button
                onClick={() => onUnhide(product.id)}
                className="smooth-transition"
                style={{
                  height: '36px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  boxSizing: 'border-box',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  color: '#22c55e',
                  fontSize: '10px',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                UNHIDE
              </button>
            ) : (
              <button
                onClick={() => setStep('manage')}
                className="smooth-transition"
                style={{
                  height: '36px',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  boxSizing: 'border-box',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '10px',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                STOCK ({product.stock_quantity})
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                const shareData = {
                  title: product.name,
                  text: product.description,
                  url: window.location.href,
                };
                if (navigator.share) {
                  navigator.share(shareData).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="smooth-transition"
              style={{
                height: '36px',
                padding: '0 6px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '0',
                color: '#aaa',
                cursor: 'pointer',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#aaa';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>

            <button
              onClick={() => onEdit(product)}
              className="smooth-transition"
              style={{
                height: '36px',
                padding: '0 6px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                background: 'transparent',
                border: 'none',
                borderRadius: '0',
                color: '#aaa',
                cursor: 'pointer',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#aaa';
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {step === 'manage' && (
        <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', backgroundColor: '#111', padding: '0 10px', borderRadius: '6px', boxSizing: 'border-box' }}>
          <span style={{ fontSize: '11px', color: '#aaa', fontFamily: 'monospace' }}>STOCK: {product.stock_quantity}</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => onUpdateStock(product.id, product.stock_quantity, -1)} className="smooth-transition" style={{ width: '24px', height: '24px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>-</button>
            <button onClick={() => onUpdateStock(product.id, product.stock_quantity, 1)} className="smooth-transition" style={{ width: '24px', height: '24px', background: '#222', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>+</button>
            <button onClick={() => setStep('idle')} className="smooth-transition" style={{ background: 'none', border: 'none', color: '#888', fontSize: '10px', cursor: 'pointer', marginLeft: '5px' }}>DONE</button>
          </div>
        </div>
      )}
    </div>
  );
};
