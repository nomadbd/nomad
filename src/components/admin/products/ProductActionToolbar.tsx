import React, { useState, useEffect } from 'react';
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
  const [stockInput, setStockInput] = useState<string | number>(product.stock_quantity);
  const isHidden = product.status === 'archived' || product.status === 'hidden';

  // প্রডাক্টের স্টক প্রপ পরিবর্তন হলে লোকাল স্টেট সিংক রাখা
  useEffect(() => {
    setStockInput(product.stock_quantity);
  }, [product.stock_quantity]);

  const handleSaveStock = () => {
    const newStock = Number(stockInput);
    if (!isNaN(newStock) && newStock >= 0) {
      // এখানে সরাসরি নতুন সংখ্যা বা ডিফারেন্স পাঠানোর ব্যবস্থা করতে পারেন
      const diff = newStock - product.stock_quantity;
      if (diff !== 0) {
        onUpdateStock(product.id, product.stock_quantity, diff);
      }
    }
    setStep('idle');
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
                setStockInput(product.stock_quantity);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#111', padding: '2px 6px', borderRadius: '4px', border: '1px solid #222' }}>
          <input
            type="number"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            autoFocus
            style={{
              width: '42px',
              height: '22px',
              background: '#000',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '3px',
              textAlign: 'center',
              fontSize: '11px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSaveStock}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#22c55e',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              padding: '0 4px',
            }}
          >
            DONE
          </button>
        </div>
      )}
    </div>
  );
};
