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
  onUpdateSuccess?: () => void; // ডাটা সেভ হলে প্যারেন্ট লিস্ট রিফ্রেশ করার জন্য
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

  // কমিশন এবং ডিসকাউন্ট এরিয়া স্টেট
  const [commissionRate, setCommissionRate] = useState<number | string>(ambassador.commission_rate ?? 0);
  const [discountPercent, setDiscountPercent] = useState<number | string>(ambassador.discount_percent ?? 0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supabase-এ কমিশন ও ডিসকাউন্ট আপডেট করার ফাংশন
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
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header Section */}
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
            style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              borderRadius: '50%',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>

        {/* Quick Communication Actions */}
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

        {/* Edit Commission & Discount Section */}
        <div
          style={{
            backgroundColor: '#121215',
            border: '1px solid #1f1f23',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', fontFamily: 'monospace', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Configure Rates
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#71717a', fontFamily: 'monospace', marginBottom: '4px' }}>
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
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#22c55e',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10px', color: '#71717a', fontFamily: 'monospace', marginBottom: '4px' }}>
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
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#3b82f6',
                  fontSize: '13px',
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
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              padding: '8px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '600',
              fontFamily: 'monospace',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              marginTop: '4px',
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

        {/* Action Options List */}
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
