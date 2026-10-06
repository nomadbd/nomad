import React from 'react';
import { CloseIcon, MessageIcon, EmailIcon, CartIcon, HistoryIcon } from '@/components/icons';
import { AmbassadorProfile } from './AmbassadorCard';

interface AmbassadorBottomSheetProps {
  ambassador: AmbassadorProfile;
  onClose: () => void;
  onSendMessage: (amb: AmbassadorProfile) => void;
  onOpenEmail: (email: string) => void;
  onOpenProducts: (amb: AmbassadorProfile) => void;
  onOpenPayouts: () => void;
  onToggleStatus: (amb: AmbassadorProfile) => void;
}

export const AmbassadorBottomSheet: React.FC<AmbassadorBottomSheetProps> = ({
  ambassador,
  onClose,
  onSendMessage,
  onOpenEmail,
  onOpenProducts,
  onOpenPayouts,
  onToggleStatus,
}) => {
  const isBlocked = ambassador.status?.toUpperCase() === 'BLOCKED' || ambassador.status?.toUpperCase() === 'DEACTIVATED';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#09090b',
          borderTop: '1px solid #1f1f23',
          borderRadius: '16px 16px 0 0',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
              {ambassador.name}
            </div>
            <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', marginTop: '2px' }}>
              {ambassador.email}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ backgroundColor: '#121215', border: '1px solid #27272a', color: '#a1a1aa', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <CloseIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => onSendMessage(ambassador)}
            title="Send Message"
            aria-label="Send Message"
            style={{
              flex: 1,
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <MessageIcon style={{ width: '18px', height: '18px', color: '#2997ff' }} />
          </button>

          <button
            type="button"
            onClick={() => onOpenEmail(ambassador.email)}
            title="Send Email"
            aria-label="Send Email"
            style={{
              flex: 1,
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '12px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <EmailIcon style={{ width: '18px', height: '18px', color: '#64ffda' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onOpenProducts(ambassador)}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #1f1f23',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#ffffff',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CartIcon style={{ width: '16px', height: '16px', color: '#2997ff' }} />
              <div>
                <div style={{ fontWeight: '600' }}>Manage Products</div>
                <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                  {ambassador.assigned_products_count || 0} products currently assigned
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenPayouts}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #1f1f23',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#ffffff',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HistoryIcon style={{ width: '16px', height: '16px', color: '#e3a008' }} />
              <div>
                <div style={{ fontWeight: '600' }}>Payout Requests & History</div>
                <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                  View all payouts for this ambassador
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onToggleStatus(ambassador)}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #1f1f23',
              borderRadius: '10px',
              padding: '12px 14px',
              color: isBlocked ? '#22c55e' : '#ef4444',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: '600' }}>
              {isBlocked ? 'Activate Ambassador Account' : 'Deactivate Ambassador Account'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
