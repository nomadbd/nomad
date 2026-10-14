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

  // Form States
  const [designation, setDesignation] = useState<string>(staff.designation || '');
  const [roleInput, setRoleInput] = useState<string>(staff.role || 'STAFF');
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

  // ইনপুটে কোনো পরিবর্তন হয়েছে কি না
  const hasChanges = (staff.designation || '') !== designation.trim() || staff.role !== roleInput.toUpperCase().trim();

  useEffect(() => {
    setCurrentView('main');
    setDesignation(staff.designation || '');
    setRoleInput(staff.role || 'STAFF');
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

  // ১. মেম্বার তথ্য ও রোল আপডেটের ট্র্রিগার
  const triggerSaveDetails = () => {
    if (!hasChanges) return;
    const formattedRole = roleInput.toUpperCase().trim();
    if (!['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(formattedRole)) {
      setToastMsg({ text: 'Invalid Role! Use STAFF, ADMIN, or SUPER_ADMIN', type: 'error' });
      return;
    }
    setPendingAction('UPDATE_DETAILS');
    setConfirmText('');
    setShowConfirmModal(true);
  };

  // ২. অ্যাকাউন্ট স্ট্যাটাস পরিবর্তনের ট্র্রিগার
  const triggerToggleStatus = () => {
    setPendingAction('TOGGLE_STATUS');
    setConfirmText('');
    setShowConfirmModal(true);
  };

  // চূড়ান্ত অ্যাকশন এক্সিকিউশন (কনফার্মেশন পাওয়ার পর)
  const executeAction = async () => {
    if (confirmText.toUpperCase().trim() !== 'CONFIRM') {
      setToastMsg({ text: 'Please type "CONFIRM" correctly to proceed.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const now = new Date().toISOString();

    try {
      if (pendingAction === 'UPDATE_DETAILS') {
        const isDesignationChanged = (staff.designation || '') !== designation.trim();
        const formattedRole = roleInput.toUpperCase().trim();
        const isRoleChanged = staff.role !== formattedRole;

        const updateData: any = { updated_at: now };
        if (isDesignationChanged) updateData.designation = designation.trim() || null;
        if (isRoleChanged) {
          updateData.role = formattedRole;
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
            newValue: designation.trim() || 'None',
            reason: reason || 'Updated staff designation from bottom sheet',
          });
        }

        if (isRoleChanged) {
          await logAuditActivity({
            entityType: 'profile',
            entityId: staff.id,
            actionType: 'ROLE_UPDATE',
            fieldName: 'role',
            oldValue: staff.role,
            newValue: formattedRole,
            reason: reason || 'Updated staff system role from bottom sheet',
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
          reason: reason || (nextStatus === 'ACTIVE' ? 'Staff Reactivated' : 'Staff Revoked/Deactivated'),
        });

        setToastMsg({
          text: `Staff access ${nextStatus === 'ACTIVE' ? 'activated' : 'revoked'} successfully!`,
          type: 'success',
        });
      }

      setShowConfirmModal(false);
      setPendingAction(null);
      setReason('');
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

      {/* সিকিউরিটি এক্সপ্লিসিট কনফার্মেশন মোডাল */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '380px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', fontFamily: 'monospace', letterSpacing: '1px' }}>
                SECURITY CONFIRMATION
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '6px', lineHeight: '1.4' }}>
                You are modifying critical permissions for <strong style={{ color: '#fff' }}>{staff.name}</strong>. Type <span style={{ color: '#ef4444', fontWeight: 'bold' }}>CONFIRM</span> to process.
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '9px', color: '#71717a', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                TYPE "CONFIRM" TO PROCEED
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRM"
                style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px', color: '#ef4444', fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
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

      {/* মেইন বটম শিট কন্টেইনার */}
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
                  No audit history found for this staff member.
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
                      {log.performed_by && (
                        <div style={{ color: '#71717a', fontSize: '9px' }}>By: {log.performed_by}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Main View Content */
            <>
              {/* Header: Member Avatar + Name + Email */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {staff.avatar_url ? (
                    <img
                      src={staff.avatar_url}
                      alt={staff.name}
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #3f3f46', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, letterSpacing: '0.5px', fontFamily: 'monospace' }}
                    >
                      {getInitials(staff.name)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', lineHeight: '1.3', wordBreak: 'break-word' }}>
                      {staff.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '3px', wordBreak: 'break-all' }}>
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

              {/* Action Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                {/* Configuration Box */}
                <div style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '26px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#d4d4d8', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      STAFF CONFIGURATION
                    </div>

                    <button
                      type="button"
                      onClick={triggerSaveDetails}
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Designation Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                        DESIGNATION
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. CEO, MD, Chairman"
                        style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px 12px', color: '#22c55e', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* System Role Input (No Dropdown - Manual Type for Safety) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                        SYSTEM ROLE (STAFF / ADMIN / SUPER_ADMIN)
                      </label>
                      <input
                        type="text"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="STAFF, ADMIN, or SUPER_ADMIN"
                        style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px 12px', color: '#ffffff', fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Audit Reason Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                        REASON FOR CHANGE (AUDIT LOG)
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Promotion approved by HR"
                        style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '8px 12px', color: '#a1a1aa', fontSize: '11px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Audit Logs Option (অহেতুক সাবটাইটেল রিমুভ করা হয়েছে) */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('activity_logs');
                    fetchAuditLogs();
                  }}
                  style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '14px 16px', color: '#ffffff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <HistoryIcon style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                  </div>
                  <div style={{ fontWeight: '600', color: '#ffffff' }}>Activity & Audit Logs</div>
                </button>

                {/* Account Revoke / Activate Button */}
                <button
                  type="button"
                  onClick={triggerToggleStatus}
                  disabled={isSaving}
                  style={{ backgroundColor: '#121215', border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`, borderRadius: '12px', padding: '14px 16px', color: isActive ? '#ef4444' : '#22c55e', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSaving ? 'not-allowed' : 'pointer', textAlign: 'center', opacity: isSaving ? 0.6 : 1 }}
                >
                  {isActive ? 'Revoke Staff Access' : 'Activate Staff Access'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
