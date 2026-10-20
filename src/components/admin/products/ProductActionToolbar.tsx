import React, { useState } from 'react';
import { Product } from './products.types';
import { ShareIcon, EditIcon, ChevronDownIcon } from './icons'; // আপনার সেন্ট্রাল আইকন ফাইল থেকে ইম্পোর্ট করা হলো

interface ProductActionToolbarProps {
  product: Product;
  onUpdateStock: (id: string | number, currentStock: number, change: number) => void;
  onEdit: (product: Product) => void;
  onUnhide: (id: string | number) => void;
  isExpanded?: boolean;           // ড্রপডাউন স্টেট চেনার জন্য
  onToggleExpand?: () => void;     // ড্রপডাউন টগল করার ফাংশন
}

export const ProductActionToolbar: React.FC<ProductActionToolbarProps> = ({
  product,
  onUpdateStock,
  onEdit,
  onUnhide,
  isExpanded = false,
  onToggleExpand
}) => {
  const [step, setStep] = useState<'idle' | 'manage'>('idle');
  const isHidden = product.status === 'archived' || product.status === 'hidden';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '42px', marginTop: '10px', boxSizing: 'border-box', width: '100%' }}>
      {step === 'idle' && (
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '6px' }}>
          <span style={{ fontSize: '14px', color: '#fff', fontWeight: 500, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flexShrink: 1 }}>৳{product.price}</span>
          
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

            {/* শেয়ার আইকন */}
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
                width: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#aaa'; }}
            >
              <ShareIcon size={15} color="currentColor" />
            </button>

            {/* এডিট আইকন */}
            <button
              onClick={() => onEdit(product)}
              className="smooth-transition"
              style={{
                height: '36px',
                width: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#aaa'; }}
            >
              <EditIcon size={15} color="currentColor" />
            </button>

            {/* ডিটেইলস টগল করার জন্য ChevronDown আইকন */}
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                title={isExpanded ? 'Hide Details' : 'Show Details'}
                className="smooth-transition"
                style={{
                  background: 'none',
                  border: '1px solid #262626',
                  borderRadius: '4px',
                  color: '#aaa',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <ChevronDownIcon
                  size={14}
                  color="#aaa"
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            )}
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
