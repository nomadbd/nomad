import React from 'react';

interface HideOrdersModalProps {
  isHiding: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const HideOrdersModal: React.FC<HideOrdersModalProps> = ({
  isHiding,
  onCancel,
  onConfirm,
}) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
      <div style={{ maxWidth: '400px', width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '30px', textAlign: 'center' }}>
        <h4 style={{ color: '#fff', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px', fontFamily: 'monospace', fontWeight: 'bold' }}>
          REMOVE FROM DASHBOARD?
        </h4>
        <p style={{ color: '#aaa', fontSize: '11px', lineHeight: '1.6', letterSpacing: '0.5px', marginBottom: '25px', textAlign: 'justify', fontFamily: 'monospace' }}>
          THIS ACTION WILL HIDE THE SELECTED ITEM(S) FROM YOUR ACTIVE PROFILE VIEW. FOR REGULATORY COMPLIANCE, TAX AUDITS, AND CONSUMER PROTECTION LAWS, INTANGIBLE TRANSACTION LOGS ARE SECURELY IMMUTABLE WITHIN OUR CENTRAL ARCHIVED LEDGER.
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button disabled={isHiding} onClick={onCancel} style={{ flex: 1, padding: '12px', background: 'transparent', color: '#fff', border: '1px solid #444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
            CANCEL
          </button>
          <button disabled={isHiding} onClick={onConfirm} style={{ flex: 1, padding: '12px', backgroundColor: '#fff', color: '#000', border: '1px solid #fff', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' }}>
            {isHiding ? 'PROCESSING...' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HideOrdersModal;
