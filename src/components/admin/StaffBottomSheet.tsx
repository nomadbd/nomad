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

  const [designationInput, setDesignationInput] = useState<string>('');
  const [roleInput, setRoleInput] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'UPDATE_DETAILS' | 'TOGGLE_STATUS' | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, { name: string; designation?: string; email?: string; role?: string }>>({});
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isActive = staff.status === 'ACTIVE';

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdminId(user.id);
      }
    };
    fetchCurrentUser();
  }, []);

  const isSelf = currentAdminId === staff.id;

  const finalDesignation = designationInput.trim() !== '' ? designationInput.trim() : (staff.designation || '');
  const finalRole = roleInput.trim() !== '' ? roleInput.toUpperCase().trim() : staff.role;

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
        .eq('entity_type', 'profile')
        .eq('profile_id', staff.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rawLogs = data || [];
      setLogs(rawLogs);

      const adminIds = Array.from(new Set(rawLogs.map((l) => l.performed_by).filter(Boolean)));

      if (adminIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, designation, email, role')
          .in('id', adminIds);

        if (profilesData) {
          const profileMap: Record<string, { name: string; designation?: string; email?: string; role?: string }> = {};
          profilesData.forEach((p) => {
            profileMap[p.id] = {
              name: p.name || 'Admin User',
              designation: p.designation || '',
              email: p.email || '',
              role: p.role || '',
            };
          });
          setAdminProfiles(profileMap);
        }
      }
    } catch (err: any) {
      console.error('Error fetching logs:', err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const triggerSaveDetails = () => {
    if (!hasChanges) return;

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

        const changesObject: Record<string, { old: string; new: string }> = {};

        if (isDesignationChanged) {
          changesObject.Designation = {
            old: staff.designation || 'None',
            new: finalDesignation || 'None',
          };
        }

        if (isRoleChanged) {
          changesObject.Role = {
            old: staff.role || 'None',
            new: finalRole,
          };
        }

        await logAuditActivity({
          entityType: 'profile',
          entityId: staff.id,
          actionType: 'PROFILE_UPDATE',
          reason: reason.trim(),
          changes: changesObject,
        });

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
          reason: reason.trim(),
          changes: {
            Status: {
              old: staff.status,
              new: nextStatus,
            },
          },
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

      {/* ব্যাকড্রপ overlay */}
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
        }}
      >
        {/* ফুল উইডথ বটম শীট কন্টেইনার (মোবাইল ও ডেক্সটপ উভয় ক্ষেত্রে ফুল চওড়া এবং পর্যাপ্ত সেফ বটম প্যাডিং সহ) */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            backgroundColor: '#09090b',
            borderTop: '1px solid #27272a',
            borderRadius: '20px 20px 0 0',
            padding: currentView === 'activity_logs' ? '0' : '24px 24px 64px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '82vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {currentView === 'activity_logs' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 0', boxSizing: 'border-box' }}>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', opacity: 0.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ width: '120px', height: '12px', backgroundColor: '#27272a', borderRadius: '4px' }} />
                        <div style={{ width: '80px', height: '10px', backgroundColor: '#27272a', borderRadius: '4px' }} />
                      </div>
                      <div style={{ width: '180px', height: '12px', backgroundColor: '#27272a', borderRadius: '4px', marginTop: '4px' }} />
                      <div style={{ width: '140px', height: '10px', backgroundColor: '#27272a', borderRadius: '4px' }} />
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '40px', fontFamily: 'monospace', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
                  No audit history found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '50vh' }}>
                  {logs.map((log) => {
                    const fetchedAdmin = adminProfiles[log.performed_by];
                    const adminName = fetchedAdmin?.name || log.metadata?.admin_name || 'Admin User';
                    const adminEmail = fetchedAdmin?.email || log.metadata?.admin_email || '';
                    const adminRole = fetchedAdmin?.role || log.metadata?.admin_role || 'SUPER_ADMIN';
                    const adminDesignation = fetchedAdmin?.designation || log.metadata?.admin_designation || '';

                    let changeItems: Array<{ label: string; oldVal: string; newVal: string }> = [];

                    if (log.changes && typeof log.changes === 'object') {
                      Object.entries(log.changes).forEach(([key, val]: [string, any]) => {
                        changeItems.push({
                          label: key,
                          oldVal: String(val.old ?? 'None'),
                          newVal: String(val.new ?? 'None'),
                        });
                      });
                    } else if (log.field_name) {
                      changeItems.push({
                        label: log.field_name.charAt(0).toUpperCase() + log.field_name.slice(1),
                        oldVal: String(log.old_value ?? 'None'),
                        newVal: String(log.new_value ?? 'None'),
                      });
                    }

                    return (
                      <div key={log.id} style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '16px', fontSize: '11px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #1a1a1e', paddingBottom: '4px' }}>
                          <span style={{ color: '#71717a', fontSize: '10px' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {changeItems.map((item, idx) => (
                            <div key={idx} style={{ color: '#d4d4d8', fontSize: '12px', lineHeight: '1.4' }}>
                              <span style={{ color: '#a1a1aa' }}>{item.label} : </span>
                              <span style={{ color: '#ef4444' }}>{item.oldVal}</span>
                              <span style={{ color: '#71717a', margin: '0 6px' }}>→</span>
                              <span style={{ color: '#22c55e' }}>{item.newVal}</span>
                            </div>
                          ))}
                        </div>

                        {log.reason && (
                          <div style={{ color: '#a1a1aa', fontSize: '11px', fontStyle: 'italic', backgroundColor: '#09090b', padding: '8px 12px', borderRadius: '6px', border: '1px solid #1f1f23', lineHeight: '1.4' }}>
                            Reason: {log.reason}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid #1f1f23', paddingTop: '8px', marginTop: '2px', color: '#a1a1aa' }}>
                          <div style={{ fontSize: '11px' }}>
                            <span style={{ color: '#71717a' }}>By: </span>
                            <strong style={{ color: '#ffffff' }}>{adminName}</strong>
                          </div>
                          <div style={{ fontSize: '10px', color: '#38bdf8' }}>
                            {adminDesignation ? `${adminDesignation} • ${adminRole}` : adminRole}
                          </div>
                          {adminEmail && (
                            <div style={{ fontSize: '10px', color: '#71717a' }}>
                              {adminEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
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
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: '1.2', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {staff.name}
                      {isSelf && (
                        <span style={{ fontSize: '9px', backgroundColor: '#27272a', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>YOU</span>
                      )}
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
                      padding: '4px 14px',
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

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

              <button
                type="button"
                onClick={() => {
                  setCurrentView('activity_logs');
                  fetchAuditLogs();
                }}
                style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '14px 16px', color: '#ffffff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left' }}
              >
                <HistoryIcon style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
                <span style={{ fontWeight: '600', fontSize: '12px' }}>Activity & Audit Logs</span>
              </button>

              <button
                type="button"
                onClick={triggerToggleStatus}
                disabled={isSaving}
                style={{
                  backgroundColor: '#121215',
                  border: isActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  color: isActive ? '#ef4444' : '#22c55e',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                }}
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
