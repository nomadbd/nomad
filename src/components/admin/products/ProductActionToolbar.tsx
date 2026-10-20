import React, { useState } from 'react';
import { Product } from './products.types';
import { ShareIcon, EditIcon, BoxIcon } from '../../icons';

interface ProductActionToolbarProps {
  product: Product;
  onUpdateStock: (id: string | number, currentStock: number, change: number) => void;
  onEdit: (product: Product) => void;
  onUnhide: (id: string | number) => void;
}

export const ProductActionToolbar: React.FC<ProductActionToolbarProps> = ({
  product,
  onUpdateStock,
  onEdit,
  onUnhide,
}) => {
  const [step, setStep] = useState<'idle' | 'manage'>('idle');
  const isHidden = product.status === 'archived' || product.status === 'hidden';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
      {step === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isHidden ? (
            <button
              onClick={() => onUnhide(product.id)}
              style={{
                height: '28px',
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '4px',
                color: '#22c55e',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              UNHIDE
            </button>
          ) : (
            <button
              onClick={() => setStep('manage')}
              title={`Stock: ${product.stock_quantity}`}
              style={{
                height: '28px',
                width: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <BoxIcon size={15} color="currentColor" strokeWidth={2.2} />
            </button>
          )}

          <button
            onClick={() => onEdit(product)}
            style={{
              height: '28px',
              width: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <EditIcon size={15} color="currentColor" />
          </button>

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
            style={{
              height: '28px',
              width: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <ShareIcon size={15} color="currentColor" />
          </button>
        </div>
      )}

      {step === 'manage' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#111', padding: '2px 8px', borderRadius: '4px' }}>
          <span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'monospace' }}>{product.stock_quantity}</span>
          <button onClick={() => onUpdateStock(product.id, product.stock_quantity, -1)} style={{ width: '20px', height: '20px', background: '#222', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>-</button>
          <button onClick={() => onUpdateStock(product.id, product.stock_quantity, 1)} style={{ width: '20px', height: '20px', background: '#222', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>+</button>
          <button onClick={() => setStep('idle')} style={{ background: 'none', border: 'none', color: '#888', fontSize: '9px', cursor: 'pointer', marginLeft: '2px' }}>DONE</button>
        </div>
      )}
    </div>
  );
};
