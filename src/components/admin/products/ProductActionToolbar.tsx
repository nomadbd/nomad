import React, { useState } from 'react';
import { Product } from './products.types';
import { StockIcon, EditIcon, ShareIcon, VisibilityIcon } from '../../icons';

interface ProductActionToolbarProps {
  product: Product;
  onUpdateStock: (id: string | number, currentStock: number, change: number) => void;
  onEdit: (product: Product) => void;
  onUnhide: (id: string | number) => void;
  setIsStockEditing?: (editing: boolean) => void;
}

export const ProductActionToolbar: React.FC<ProductActionToolbarProps> = ({
  product,
  onUpdateStock,
  onEdit,
  onUnhide,
  setIsStockEditing,
}) => {
  const [showStockInput, setShowStockInput] = useState(false);
  const [inputVal, setInputVal] = useState(String(product.stock_quantity ?? 0));

  const isHidden = product.status === 'archived' || product.status === 'hidden';

  const toggleStockInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !showStockInput;
    setShowStockInput(nextState);
    if (setIsStockEditing) {
      setIsStockEditing(nextState);
    }
    if (nextState) {
      setInputVal(String(product.stock_quantity ?? 0));
    }
  };

  const handleStockSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed)) {
      const diff = parsed - (product.stock_quantity ?? 0);
      onUpdateStock(product.id, product.stock_quantity ?? 0, diff);
    }
    setShowStockInput(false);
    if (setIsStockEditing) {
      setIsStockEditing(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStockInput(false);
    if (setIsStockEditing) {
      setIsStockEditing(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {showStockInput ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '55px',
              backgroundColor: '#000',
              border: '1px solid #333',
              color: '#fff',
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '4px',
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <button
            type="button"
            onClick={handleStockSubmit}
            style={{
              background: 'none',
              border: 'none',
              color: '#22c55e',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: '0 4px',
              fontFamily: 'monospace',
            }}
          >
            DONE
          </button>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              padding: '0 4px',
              fontFamily: 'monospace',
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <>
          {isHidden ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnhide(product.id);
              }}
              title="Unhide Product"
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <VisibilityIcon size={16} color="currentColor" visible={false} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleStockInput}
                title="Update Stock"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <StockIcon size={16} color="currentColor" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                title="Edit Product"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <EditIcon size={16} color="currentColor" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({
                      title: product.name,
                      url: window.location.href,
                    }).catch(() => {});
                  }
                }}
                title="Share Product"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ShareIcon size={16} color="currentColor" />
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};
