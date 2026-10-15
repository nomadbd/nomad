import React, { useState, useEffect } from 'react';
import { CloseIcon, HistoryIcon } from '@/components/icons';
import { supabase } from '@/supabaseClient';
import { logAuditActivity } from '@/utils/auditLogger';
import Toast from '@/components/ui/Toast';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  designation?: string | null;
  status: string;
  created_at: string;
  hired_at?: string | null;
  role_assigned_at?: string | null;
  updated_at?: string | null;
  avatar_url?: string | null;
}

interface StaffBottomSheetProps {
  staff: StaffMember;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export const StaffBottomSheet: React.FC<StaffBottomSheetProps> = ({
  staff,
  onClose,
  onUpdateSuccess,
}) => {
  const [currentView, setCurrentView] = useState<'main' | 'activity_logs'>('main');

  // Form States - ইনপুটগুলো খালি থাকবে, বর্তমান ভ্যালু প্লেসহোল্ডার হিসেবে দেখাবে
  const [designationInput, setDesignationInput] = useState<string>('');
  const [roleInput, setRoleInput] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Security Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'UPDATE_DETAILS' | 'TOGGLE_STATUS' | null>(null);

  // Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isActive = staff.status === 'ACTIVE';

  // ইনপুটে নতুন মান দিলে সেটি কার্যকর হবে, নাহলে প্লেসহোল্ডার/পুরানো ভ্যালু বহাল থাকবে
  const finalDesignation = designationInput.trim() !== '' ? designationInput.trim() : (staff.designation || '');
  const finalRole = roleInput.trim() !== '' ? roleInput.toUpperCase().trim() : staff.role;

  // কোনো পরিবর্তন হয়েছে কি না
  const hasChanges = (staff.designation || '') !== finalDesignation || staff.role !== finalRole;

  useEffect(() => {
    setCurrentView('main');
    setDesignationInput('');
    setRoleInput('');
    setReason('');
  }, [staff]);

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_id', staff.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching logs:', err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const triggerSaveDetails = () => {
    if (!hasChanges) return;

    // কারণ লেখা বাধ্যতামূলক চেক
    if (!reason.trim()) {
      setToastMsg({ text: 'Please provide a reason for the change!', type: 'error' });
      return;
    }

    if (!['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(finalRole)) {
      setToastMsg({ text: 'Invalid Role! Use STAFF, ADMIN, or SUPER_ADMIN', type: 'error' });
      return;
    }

    setPendingAction('UPDATE_DETAILS');
    setConfirmText('');
    setShowConfirmModal(true);
  };

  const triggerToggleStatus = () => {
    if (!reason.trim()) {
      setToastMsg({ text: 'Please provide a reason before changing status!', type: 'error' });
      return;
    }
    setPendingAction('TOGGLE_STATUS');
    setConfirmText('');
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (confirmText.toUpperCase().trim() !== 'CONFIRM') {
      setToastMsg({ text: 'Please type "CONFIRM" correctly to proceed.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const now = new Date().toISOString();

    try {
      if (pendingAction === 'UPDATE_DETAILS') {
        const isDesignationChanged = (staff.designation || '') !== finalDesignation;
        const isRoleChanged = staff.role !== finalRole;

        const updateData: any = { updated_at: now };
        if (isDesignationChanged) updateData.designation = finalDesignation || null;
        if (isRoleChanged) {
          updateData.role = finalRole;
          updateData.role_assigned_at = now;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', staff.id);

        if (error) throw error;

        if (isDesignationChanged) {
          await logAuditActivity({
            entityType: 'profile',
            entityId: staff.id,
            actionType: 'DESIGNATION_UPDATE',
            fieldName: 'designation',
            oldValue: staff.designation || 'None',
            newValue: finalDesignation || 'None',
            reason: reason.trim(),
          });
        }

        if (isRoleChanged) {
          await logAuditActivity({
            entityType: 'profile',
            entityId: staff.id,
            actionType: 'ROLE_UPDATE',
            fieldName: 'role',
            oldValue: staff.role,
            newValue: finalRole,
            reason: reason.trim(),
          });
        }

        setToastMsg({ text: 'Staff details updated successfully!', type: 'success' });
      } else if (pendingAction === 'TOGGLE_STATUS') {
        const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE';

        const { error } = await supabase
          .from('profiles')
          .update({ status: nextStatus, updated_at: now })
          .eq('id', staff.id);

        if (error) throw error;

        await logAuditActivity({
          entityType: 'profile',
          entityId: staff.id,
          actionType: 'STATUS_CHANGE',
          fieldName: 'status',
          oldValue: staff.status,
          newValue: nextStatus,
          reason: reason.trim(),
        });

        setToastMsg({
          text: `Staff access ${nextStatus === 'ACTIVE' ? 'activated' : 'revoked'} successfully!`,
          type: 'success',
        });
      }

      setShowConfirmModal(false);
      setPendingAction(null);
      setReason('');
      setDesignationInput('');
      setRoleInput('');
      setConfirmText('');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      console.error('Error executing action:', err.message);
      setToastMsg({ text: err.message || 'Action failed.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {toastMsg && (
        <Toast
          message={toastMsg.text}
          type={toastMsg.type}
          onClose={() => setToastMsg(null)}
        />
      )}

      {/* সিকিউরিটি কনফার্মেশন মোডাল */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                SECURITY CONFIRMATION
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '6px', lineHeight: '1.4' }}>
                Type <span style={{ color: '#ef4444', fontWeight: 'bold' }}>CONFIRM</span> to process changes for <strong style={{ color: '#fff' }}>{staff.name}</strong>.
              </div>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CONFIRM"
              style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={executeAction}
                disabled={isSaving || confirmText.toUpperCase().trim() !== 'CONFIRM'}
                style={{ flex: 1, backgroundColor: confirmText.toUpperCase().trim() === 'CONFIRM' ? '#ef4444' : '#27272a', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                {isSaving ? 'PROCESSING...' : 'EXECUTE'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                style={{ flex: 1, backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* বটম শিট */}
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
          {currentView === 'activity_logs' ? (
            /* Activity Logs Sub-View */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HistoryIcon style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>
                    Activity & Audit Logs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('main')}
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#d4d4d8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <CloseIcon style={{ width: '14px', height: '14px' }} />
                </button>
              </div>

              {loadingLogs ? (
                <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '40px', fontFamily: 'monospace' }}>
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '40px', fontFamily: 'monospace', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
                  No audit history found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '350px' }}>
                  {logs.map((log) => (
                    <div key={log.id} style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 14px', fontSize: '11px', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px' }}>
                        <span>{log.action_type || log.action}</span>
                        <span style={{ color: '#71717a', fontSize: '10px' }}>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <div style={{ color: '#d4d4d8', marginBottom: '4px' }}>
                        {log.field_name}: <span style={{ color: '#ef4444' }}>{log.old_value || 'None'}</span> → <span style={{ color: '#22c55e' }}>{log.new_value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Main View Content */
            <>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {staff.avatar_url ? (
                    <img
                      src={staff.avatar_url}
                      alt={staff.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #3f3f46', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'monospace' }}
                    >
                      {getInitials(staff.name)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: '1.2', wordBreak: 'break-word' }}>
                      {staff.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px', wordBreak: 'break-all' }}>
                      {staff.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#d4d4d8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <CloseIcon style={{ width: '14px', height: '14px' }} />
                </button>
              </div>

              {/* কনফিগারেশন সেকশন */}
              <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    CONFIGURATION
                  </span>

                  <button
                    type="button"
                    onClick={triggerSaveDetails}
                    disabled={isSaving || !hasChanges}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '3px 12px',
                      fontSize: '10px',
                      fontWeight: '700',
                      fontFamily: 'monospace',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: hasChanges ? 1 : 0,
                      visibility: hasChanges ? 'visible' : 'hidden',
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    {isSaving ? 'SAVING...' : 'SAVE'}
                  </button>
                </div>

                {/* Designation এবং Role (প্লেসহোল্ডার স্টাইলিং) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  {/* Designation Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>Designation</span>
                    <input
                      type="text"
                      value={designationInput}
                      onChange={(e) => setDesignationInput(e.target.value)}
                      placeholder={staff.designation || 'e.g. CEO'}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #3f3f46',
                        borderRadius: '0',
                        padding: '6px 0',
                        color: '#22c55e',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* System Role Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '9px', color: '#71717a', fontFamily: 'monospace', textTransform: 'uppercase' }}>Role</span>
                    <input
                      type="text"
                      value={roleInput}
                      onChange={(e) => setRoleInput(e.target.value)}
                      placeholder={staff.role || 'STAFF'}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #3f3f46',
                        borderRadius: '0',
                        padding: '6px 0',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Reason for Change (মাল্টিলাইন Textarea) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for change (Required)..."
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #27272a',
                      borderRadius: '0',
                      padding: '6px 0',
                      color: '#a1a1aa',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none',
                      lineHeight: '1.4',
                    }}
                  />
                </div>
              </div>

              {/* Activity Logs Button */}
              <button
                type="button"
                onClick={() => {
                  setCurrentView('activity_logs');
                  fetchAuditLogs();
                }}
                style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 16px', color: '#ffffff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left' }}
              >
                <HistoryIcon style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
                <span style={{ fontWeight: '600', fontSize: '12px' }}>Activity & Audit Logs</span>
              </button>

              {/* Account Revoke / Activate */}
              <button
                type="button"
                onClick={triggerToggleStatus}
                disabled={isSaving}
                style={{ backgroundColor: '#121215', border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`, borderRadius: '12px', padding: '12px 16px', color: isActive ? '#ef4444' : '#22c55e', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                {isActive ? 'Revoke Staff Access' : 'Activate Staff Access'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
