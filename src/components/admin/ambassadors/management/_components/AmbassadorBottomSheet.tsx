import React, { useState } from 'react';
import { CloseIcon, MessageIcon, EmailIcon, CartIcon, HistoryIcon } from '@/components/icons';
import { AmbassadorProfile } from './AmbassadorCard';
import { supabase } from '@/supabaseClient';

interface AmbassadorBottomSheetProps {
  ambassador: AmbassadorProfile;
  onClose: () => void;
  onSendMessage: (amb: AmbassadorProfile) => void;
  onOpenEmail: (email: string) => void;
  onOpenProducts: (amb: AmbassadorProfile) => void;
  onOpenPayouts: () => void;
  onToggleStatus: (amb: AmbassadorProfile) => void;
  onUpdateSuccess?: () => void;
}

export const AmbassadorBottomSheet: React.FC<AmbassadorBottomSheetProps> = ({
  ambassador,
  onClose,
  onSendMessage,
  onOpenEmail,
  onOpenProducts,
  onOpenPayouts,
  onToggleStatus,
  onUpdateSuccess,
}) => {
  const isBlocked = ambassador.status?.toUpperCase() === 'BLOCKED' || ambassador.status?.toUpperCase() === 'DEACTIVATED';

  // State for rates
  const [commissionRate, setCommissionRate] = useState<number | string>(ambassador.commission_rate ?? 0);
  const [discountPercent, setDiscountPercent] = useState<number | string>(ambassador.discount_percent ?? 0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper for Initials
  const getInitials = (name: string) => {
    if (!name) return 'AM';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Supabase Update Logic
  const handleSaveRates = async () => {
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const { error } = await supabase
        .from('ambassadors')
        .update({
          commission_rate: Number(commissionRate) || 0,
          discount_percent: Number(discountPercent) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ambassador.ambassador_id);

      if (error) throw error;

      setStatusMsg({ type: 'success', text: 'Rates updated successfully!' });
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Error updating rates:', err.message);
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update rates.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
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
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 28px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        {/* 1. Header: Avatar + Name + Email + Close Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {/* Avatar Circle */}
            {ambassador.avatar_url ? (
              <img
                src={ambassador.avatar_url}
                alt={ambassador.name}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1px solid #27272a',
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  color: '#a1a1aa',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  letterSpacing: '0.5px',
                }}
              >
                {getInitials(ambassador.name)}
              </div>
            )}

            {/* Name & Email Container (Ensures full text displays properly without break) */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#ffffff',
                  lineHeight: '1.3',
                  wordBreak: 'break-word',
                }}
              >
                {ambassador.name}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#71717a',
                  fontFamily: 'monospace',
                  marginTop: '3px',
                  wordBreak: 'break-all',
                }}
              >
                {ambassador.email}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CloseIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        {/* 2. Quick Contact Buttons (Minimal Circular Design with White Icons) */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => onSendMessage(ambassador)}
            title="Send Message"
            aria-label="Send Message"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <MessageIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
          </button>

          <button
            type="button"
            onClick={() => onOpenEmail(ambassador.email)}
            title="Send Email"
            aria-label="Send Email"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <EmailIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
          </button>
        </div>

        {/* 3. Action Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Manage Products */}
          <button
            type="button"
            onClick={() => onOpenProducts(ambassador)}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #1f1f23',
              borderRadius: '12px',
              padding: '14px 16px',
              color: '#ffffff',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CartIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
              <div>
                <div style={{ fontWeight: '600' }}>Manage Products</div>
                <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', marginTop: '2px' }}>
                  {ambassador.assigned_products_count || 0} products currently assigned
                </div>
              </div>
            </div>
          </button>

          {/* Payout Requests & History */}
          <button
            type="button"
            onClick={onOpenPayouts}
            style={{
              backgroundColor: '#121215',
              border: '1px solid #1f1f23',
              borderRadius: '12px',
              padding: '14px 16px',
              color: '#ffffff',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <HistoryIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
              <div>
                <div style={{ fontWeight: '600' }}>Payout Requests & History</div>
                <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', marginTop: '2px' }}>
                  View all payouts for this ambassador
                </div>
              </div>
            </div>
          </button>

          {/* 4. Configure Rates Section (Placed right above Deactivate) */}
          <div
            style={{
              backgroundColor: '#121215',
              border: '1px solid #1f1f23',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              CONFIGURE RATES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#71717a', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                  COMMISSION (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="10"
                  style={{
                    width: '100%',
                    backgroundColor: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#22c55e',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#71717a', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                  CUST. DISCOUNT (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="5"
                  style={{
                    width: '100%',
                    backgroundColor: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#3b82f6',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveRates}
              disabled={isSaving}
              style={{
                width: '100%',
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '10px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '600',
                fontFamily: 'monospace',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                letterSpacing: '0.5px',
              }}
            >
              {isSaving ? 'SAVING...' : 'SAVE RATES'}
            </button>

            {statusMsg && (
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: statusMsg.type === 'success' ? '#22c55e' : '#ef4444',
                  textAlign: 'center',
                }}
              >
                {statusMsg.text}
              </div>
            )}
          </div>

          {/* 5. Account Deactivation / Activation (Bottom) */}
          <button
            type="button"
            onClick={() => onToggleStatus(ambassador)}
            style={{
              backgroundColor: '#121215',
              border: `1px solid ${isBlocked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              borderRadius: '12px',
              padding: '14px 16px',
              color: isBlocked ? '#22c55e' : '#ef4444',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {isBlocked ? 'Activate Ambassador Account' : 'Deactivate Ambassador Account'}
          </button>
        </div>
      </div>
    </div>
  );
};
