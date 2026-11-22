import React from 'react';

interface CartFooterProps {
  subtotal: number;
  selectedCount: number;
  onProceedToCheckout: () => void;
}

const CartFooter: React.FC<CartFooterProps> = ({
  subtotal,
  selectedCount,
  onProceedToCheckout,
}) => {
  return (
    <div
      style={{
        marginTop: 'auto',
        padding: '15px 0 calc(35px + env(safe-area-inset-bottom)) 0',
        backgroundColor: '#000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '20px',
          fontSize: '13px',
          letterSpacing: '0.5px',
        }}
      >
        <span style={{ color: '#b5b5b5', textTransform: 'uppercase', fontWeight: '500' }}>Subtotal</span>
        <span style={{ color: 'white', fontWeight: '600', fontFamily: 'monospace', fontSize: '15px' }}>
          ৳{subtotal}
        </span>
      </div>

      <button
        disabled={selectedCount === 0}
        onClick={onProceedToCheckout}
        style={{
          width: '100%',
          padding: '15px',
          background: 'transparent',
          color: selectedCount > 0 ? 'white' : '#666',
          border:
            selectedCount > 0
              ? '1px solid rgba(255, 255, 255, 0.9)'
              : '1px solid #333',
          fontWeight: '600',
          letterSpacing: '2px',
          cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
          fontSize: '11px',
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
          outline: 'none',
          opacity: selectedCount > 0 ? 1 : 0.4,
        }}
      >
        PROCEED TO CHECKOUT ({selectedCount})
      </button>

      <div
        style={{
          textAlign: 'center',
          marginTop: '15px',
          fontSize: '9px',
          color: '#b5b5b5',
          letterSpacing: '1px',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          fontWeight: '500',
        }}
      >
        Secure Checkout • Nomad Concepts
      </div>
    </div>
  );
};

export default CartFooter;
