import React from 'react';
import { createPortal } from 'react-dom';

interface ProductDeleteModalProps {
  config: { type: 'soft' | 'hard'; productId: string | number } | null;
  isChecked: boolean;
  onCheckChange: (checked: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ProductDeleteModal: React.FC<ProductDeleteModalProps> = ({
  config,
  isChecked,
  onCheckChange,
  onCancel,
  onConfirm
}) => {
  if (!config) return null;

  return createPortal(
    <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', borderRadius: '10px', padding: '24px', maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <h4 style={{ color: '#fff', margin: 0, fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {config.type === 'soft' ? 'Hide Product' : 'Delete Product Permanently'}
        </h4>
        <p style={{ color: '#aaa', fontSize: '12px', margin: 0, lineHeight: '1.5' }}>
          {config.type === 'soft'
            ? 'This product will be hidden from the catalog. You can unhide it later.'
            : 'This action is irreversible. The product and all associated media will be permanently deleted.'}
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => onCheckChange(e.target.checked)}
            style={{ accentColor: '#fff', cursor: 'pointer' }}
          />
          <span style={{ color: '#ccc', fontSize: '11px', fontFamily: 'monospace' }}>I confirm this action</span>
        </label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{ flex: 1, background: 'transparent', border: '1px solid #333', borderRadius: '6px', color: '#aaa', padding: '10px', fontSize: '11px', cursor: 'pointer' }}
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={!isChecked}
            onClick={onConfirm}
            style={{
              flex: 1,
              background: isChecked ? (config.type === 'soft' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)') : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isChecked ? (config.type === 'soft' ? '#eab308' : '#ef4444') : '#222'}`,
              borderRadius: '6px',
              color: isChecked ? (config.type === 'soft' ? '#eab308' : '#ef4444') : '#555',
              padding: '10px',
              fontSize: '11px',
              cursor: isChecked ? 'pointer' : 'not-allowed',
              fontWeight: '600'
            }}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
