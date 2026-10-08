import React, { useState, useEffect } from 'react';
import { CloseIcon, MessageIcon, EmailIcon, CartIcon, HistoryIcon } from '@/components/icons';
import { AmbassadorProfile } from './AmbassadorCard';
import { supabase } from '@/supabaseClient';
import { ActivityLogs } from './ActivityLogs';
import { logAuditActivity } from '@/utils/auditLogger';
import ConfirmModal from '@/components/ui/ConfirmModal';
import Toast from '@/components/ui/Toast';

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
  // is_active boolean কলাম দিয়ে স্ট্যাটাস নির্ধারণ
  const isActive = typeof ambassador.is_active === 'boolean' 
    ? ambassador.is_active 
    : ambassador.status?.toUpperCase() === 'ACTIVE';

  const isBlocked = !isActive;

  // সাব-ভিউ নেভিগেশন স্টেট ('main' | 'activity_logs')
  const [currentView, setCurrentView] = useState<'main' | 'activity_logs'>('main');

  // ইনস্ট্যান্ট প্লেসহোল্ডার আপডেটের জন্য ডিসপ্লে স্টেট
  const [displayCommission, setDisplayCommission] = useState<number>(ambassador.commission_rate ?? 0);
  const [displayDiscount, setDisplayDiscount] = useState<number>(ambassador.discount_percent ?? 0);

  // ইনপুট টাইপিং স্টেট
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modal & Toast States
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ইনপুটে কোনো মান লেখা আছে কি না
  const hasChanges = commissionRate !== '' || discountPercent !== '';

  // অ্যাম্বাসেডর চেঞ্জ হলে ডিসপ্লে স্টেট ও ভিউ রিসেট
  useEffect(() => {
    setCurrentView('main');
    setDisplayCommission(ambassador.commission_rate ?? 0);
    setDisplayDiscount(ambassador.discount_percent ?? 0);
  }, [ambassador]);

  // Helper for Initials
  const getInitials = (name: string) => {
    if (!name) return 'AM';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Supabase Rate Update Logic + Audit Logging
  const handleSaveRates = async () => {
    setIsSaving(true);

    const commNum = Number(commissionRate);
    const discNum = Number(discountPercent);

    const isCommChanged = commissionRate !== '' && commNum !== displayCommission;
    const isDiscChanged = discountPercent !== '' && discNum !== displayDiscount;

    if (!isCommChanged && !isDiscChanged) {
      setIsSaving(false);
      return;
    }

    const finalCommission = isCommChanged ? commNum : displayCommission;
    const finalDiscount = isDiscChanged ? discNum : displayDiscount;

    try {
      const { error } = await supabase
        .from('ambassador')
        .update({
          commission_rate: finalCommission,
          discount_percent: finalDiscount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ambassador.ambassador_id);

      if (error) throw error;

      // অডিট লগের বিবরণ প্রস্তুত
      let fieldName = 'Commission & Discount';
      let oldValue = `${displayCommission}% Commission / ${displayDiscount}% Discount`;
      let newValue = `${finalCommission}% Commission / ${finalDiscount}% Discount`;

      if (isCommChanged && !isDiscChanged) {
        fieldName = 'Commission Rate';
        oldValue = `${displayCommission}%`;
        newValue = `${finalCommission}%`;
      } else if (!isCommChanged && isDiscChanged) {
        fieldName = 'Customer Discount';
        oldValue = `${displayDiscount}%`;
        newValue = `${finalDiscount}%`;
      }

      await logAuditActivity({
        entityType: 'ambassador',
        entityId: ambassador.ambassador_id,
        actionType: 'RATE_UPDATE',
        fieldName,
        oldValue,
        newValue,
        reason: 'Updated rate configuration from bottom sheet',
      });

      setDisplayCommission(finalCommission);
      setDisplayDiscount(finalDiscount);
      setCommissionRate('');
      setDiscountPercent('');

      setToastMsg({ text: 'Rates updated successfully!', type: 'success' });

      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (err: any) {
      console.error('Error updating rates:', err.message);
      setToastMsg({ text: err.message || 'Failed to update rates.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Status Toggle (is_active boolean) + Audit Logging
  const handleToggleStatus = async () => {
    setIsSaving(true);

    const nextIsActive = !isActive;

    try {
      const { error } = await supabase
        .from('ambassador')
        .update({
          is_active: nextIsActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ambassador.ambassador_id);

      if (error) throw error;

      await logAuditActivity({
        entityType: 'ambassador',
        entityId: ambassador.ambassador_id,
        actionType: 'STATUS_CHANGE',
        fieldName: 'is_active',
        oldValue: isActive ? 'ACTIVE' : 'INACTIVE',
        newValue: nextIsActive ? 'ACTIVE' : 'INACTIVE',
        reason: nextIsActive ? 'Account Reactivated' : 'Account Deactivated',
      });

      setToastMsg({
        text: `Account ${nextIsActive ? 'activated' : 'deactivated'} successfully!`,
        type: 'success',
      });

      if (onToggleStatus) {
        onToggleStatus({
          ...ambassador,
          is_active: nextIsActive,
          status: nextIsActive ? 'ACTIVE' : 'INACTIVE',
        });
      }
      if (onUpdateSuccess) {
        onUpdateSuccess();
      }
    } catch (err: any) {
      console.error('Error toggling status:', err.message);
      setToastMsg({ text: err.message || 'Failed to update status.', type: 'error' });
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      {/* Global Toast Notification */}
      {toastMsg && (
        <Toast
          message={toastMsg.text}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      {/* Global Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={isBlocked ? 'Activate Ambassador Account' : 'Deactivate Ambassador Account'}
        message={`Are you sure you want to ${isBlocked ? 'activate' : 'deactivate'} ${ambassador.name}'s account?`}
        confirmText={isBlocked ? 'Yes, Activate' : 'Yes, Deactivate'}
        cancelText="Cancel"
        variant={isBlocked ? 'success' : 'danger'}
        isLoading={isSaving}
        onConfirm={handleToggleStatus}
        onCancel={() => setShowConfirmModal(false)}
      />

      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingTop: '80px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: '#09090b',
            borderTop: '1px solid #27272a',
            borderRadius: '20px 20px 0 0',
            padding: currentView === 'activity_logs' ? '0' : '24px 20px 28px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: 'calc(100dvh - 80px)',
            minHeight: currentView === 'activity_logs' ? '450px' : 'auto',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Sub-View: Activity Logs */}
          {currentView === 'activity_logs' ? (
            <ActivityLogs
              ambassadorId={ambassador.ambassador_id}
              onBack={() => setCurrentView('main')}
            />
          ) : (
            /* Main View Content */
            <>
              {/* 1. Header: Avatar + Name + Email + Close Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {ambassador.avatar_url ? (
                    <img
                      src={ambassador.avatar_url}
                      alt={ambassador.name}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #3f3f46',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#18181b',
                        border: '1px solid #3f3f46',
                        color: '#f4f4f5',
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
                        fontSize: '12px',
                        color: '#a1a1aa',
                        fontFamily: 'monospace',
                        marginTop: '3px',
                        wordBreak: 'break-all',
                      }}
                    >
                      {ambassador.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    color: '#d4d4d8',
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

              {/* 2. Primary Actions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Send Message */}
                <button
                  type="button"
                  onClick={() => onSendMessage(ambassador)}
                  style={{
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
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
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MessageIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>Send Message</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                        Chat directly with ambassador
                      </div>
                    </div>
                  </div>
                </button>

                {/* Send Email */}
                <button
                  type="button"
                  onClick={() => onOpenEmail(ambassador.email)}
                  style={{
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
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
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <EmailIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>Send Email</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                        Open default email client
                      </div>
                    </div>
                  </div>
                </button>

                {/* Manage Products */}
                <button
                  type="button"
                  onClick={() => onOpenProducts(ambassador)}
                  style={{
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
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
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CartIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>Manage Products</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
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
                    border: '1px solid #27272a',
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
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HistoryIcon style={{ width: '18px', height: '18px', color: '#ffffff' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>Payout Requests & History</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                        View all payouts for this ambassador
                      </div>
                    </div>
                  </div>
                </button>

                {/* Activity & Audit Logs (Payout Requests & History-এর ঠিক নিচে নিয়ে আসা হলো) */}
                <button
                  type="button"
                  onClick={() => setCurrentView('activity_logs')}
                  style={{
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
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
                    <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <HistoryIcon style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#ffffff' }}>Activity & Audit Logs</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                        View all audit logs and admin changes
                      </div>
                    </div>
                  </div>
                </button>

                {/* 3. Configure Rates Section */}
                <div
                  style={{
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '26px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#d4d4d8', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      CONFIGURE RATES
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveRates}
                      disabled={isSaving || !hasChanges}
                      style={{
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '4px 14px',
                        fontSize: '11px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(255, 255, 255, 0.2)',
                        opacity: hasChanges ? 1 : 0,
                        visibility: hasChanges ? 'visible' : 'hidden',
                        transition: 'opacity 0.2s ease, visibility 0.2s ease',
                        pointerEvents: hasChanges ? 'auto' : 'none',
                      }}
                    >
                      {isSaving ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                        COMMISSION (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(e.target.value)}
                        placeholder={String(displayCommission)}
                        style={{
                          width: '100%',
                          backgroundColor: '#09090b',
                          border: '1px solid #3f3f46',
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
                      <label style={{ display: 'block', fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                        CUST. DISCOUNT (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscountPercent(e.target.value)}
                        placeholder={String(displayDiscount)}
                        style={{
                          width: '100%',
                          backgroundColor: '#09090b',
                          border: '1px solid #3f3f46',
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
                </div>

                {/* 4. Account Deactivation / Activation (Danger Action - সবার নিচে) */}
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={isSaving}
                  style={{
                    backgroundColor: '#121215',
                    border: `1px solid ${isBlocked ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    color: isBlocked ? '#22c55e' : '#ef4444',
                    fontSize: '13px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    opacity: isSaving ? 0.6 : 1,
                  }}
                >
                  {isBlocked ? 'Activate Ambassador Account' : 'Deactivate Ambassador Account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
