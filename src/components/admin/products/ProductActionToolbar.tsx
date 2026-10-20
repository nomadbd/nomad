import React, { useState, useEffect, useRef } from 'react';
import { Product } from './products.types';
import { ShareIcon, EditIcon, BoxIcon, CloseIcon } from '../../icons';

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
  const [stockInput, setStockInput] = useState<string | number>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isHidden = product.status === 'archived' || product.status === 'hidden';

  // ম্যানেজ মোডে যাওয়ার সাথে সাথে ইনপুট অটো-ফোকাস করা
  useEffect(() => {
    if (step === 'manage' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleSaveStock = () => {
    if (stockInput === '' || stockInput === null || stockInput === undefined) {
      setStep('idle');
      return;
    }
    const newStock = Number(stockInput);
    if (!isNaN(newStock) && newStock >= 0) {
      const diff = newStock - product.stock_quantity;
      if (diff !== 0) {
        onUpdateStock(product.id, product.stock_quantity, diff);
      }
    }
    setStep('idle');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveStock();
    } else if (e.key === 'Escape') {
      setStep('idle');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
      {step === 'idle' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              onClick={() => {
                setStockInput('');
                setStep('manage');
              }}
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
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0d0d0d',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid #262626',
            boxSizing: 'border-box',
          }}
        >
          <input
            ref={inputRef}
            type="number"
            value={stockInput}
            placeholder={String(product.stock_quantity)}
            onChange={(e) => setStockInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '50px',
              height: '26px',
              background: '#000000',
              color: '#ffffff',
              border: '1px solid #333333',
              borderRadius: '4px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              fontFamily: 'system-ui, sans-serif',
              outline: 'none',
              padding: '0 4px',
            }}
          />

          <button
            onClick={handleSaveStock}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#22c55e',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              padding: '0 4px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            DONE
          </button>

          <button
            onClick={() => setStep('idle')}
            title="Cancel"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888888',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
            }}
          >
            <CloseIcon size={14} color="currentColor" />
          </button>
        </div>
      )}
    </div>
  );
};
