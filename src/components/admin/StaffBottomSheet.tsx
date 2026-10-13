import React, { useState, useEffect } from 'react';
import { CloseIcon, HistoryIcon } from '@/components/icons';
import { supabase } from '@/supabaseClient';
import { logAuditActivity } from '@/utils/auditLogger';
import ConfirmModal from '@/components/ui/ConfirmModal';
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
  const [currentView, setCurrentView] = useState<'main' | 'logs'>('main');
  const [designation, setDesignation] = useState<string>(staff.designation || '');
  const [role, setRole] = useState<string>(staff.role || 'STAFF');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Audit Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Modal & Toast States
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isActive = staff.status === 'ACTIVE';

  useEffect(() => {
    setDesignation(staff.designation || '');
    setRole(staff.role || 'STAFF');
  }, [staff]);

  // Fetch audit logs for this staff member
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

  const handleOpenLogs = () => {
    setCurrentView('logs');
    fetchAuditLogs();
  };

  // Save Designation & Role Updates
  const handleSaveDetails = async () => {
    setIsSaving(true);
    const now = new Date().toISOString();

    const isDesignationChanged = (staff.designation || '') !== designation.trim();
    const isRoleChanged = staff.role !== role;

    if (!isDesignationChanged && !isRoleChanged) {
      setIsSaving(false);
      return;
    }

    try {
      const updateData: any = { updated_at: now };
      if (isDesignationChanged) updateData.designation = designation.trim() || null;
      if (isRoleChanged) {
        updateData.role = role;
        updateData.role_assigned_at = now;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', staff.id);

      if (error) throw error;

      // Audit Logging
      if (isDesignationChanged) {
        await logAuditActivity({
          entityType: 'profile',
          entityId: staff.id,
          actionType: 'DESIGNATION_UPDATE',
          fieldName: 'designation',
          oldValue: staff.designation || 'None',
          newValue: designation.trim() || 'None',
          reason: 'Updated staff designation from bottom sheet',
        });
      }

      if (isRoleChanged) {
        await logAuditActivity({
          entityType: 'profile',
          entityId: staff.id,
          actionType: 'ROLE_UPDATE',
          fieldName: 'role',
          oldValue: staff.role,
          newValue: role,
          reason: 'Updated staff system role from bottom sheet',
        });
      }

      setToastMsg({ text: 'Staff details updated successfully!', type: 'success' });
      onUpdateSuccess();
    } catch (err: any) {
      console.error('Error updating staff:', err.message);
      setToastMsg({ text: err.message || 'Failed to update details.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Account Status (Activate / Revoke)
  const handleToggleStatus = async () => {
    setIsSaving(true);
    const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE';
    const now = new Date().toISOString();

    try {
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
        reason: nextStatus === 'ACTIVE' ? 'Staff Reactivated' : 'Staff Revoked/Deactivated',
      });

      setToastMsg({
        text: `Staff access ${nextStatus === 'ACTIVE' ? 'activated' : 'revoked'} successfully!`,
        type: 'success',
      });

      onUpdateSuccess();
    } catch (err: any) {
      console.error('Error updating status:', err.message);
      setToastMsg({ text: err.message || 'Failed to update status.', type: 'error' });
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
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

      <ConfirmModal
        isOpen={showConfirmModal}
        title={isActive ? 'Revoke Staff Access' : 'Activate Staff Access'}
        message={`Are you sure you want to ${isActive ? 'revoke access for' : 'activate'} ${staff.name}?`}
        confirmText={isActive ? 'Yes, Revoke' : 'Yes, Activate'}
        cancelText="Cancel"
        variant={isActive ? 'danger' : 'success'}
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
            padding: '24px 20px 28px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: 'calc(100dvh - 80px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                }}
              >
                {staff.name ? staff.name.slice(0, 2).toUpperCase() : 'ST'}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{staff.name}</div>
                <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace' }}>{staff.email}</div>
              </div>
            </div>

            <button
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
              }}
            >
              <CloseIcon style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          {currentView === 'logs' ? (
            /* Activity Logs Sub-View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', fontFamily: 'monospace' }}>
                  AUDIT & ACTIVITY LOGS
                </span>
                <button
                  onClick={() => setCurrentView('main')}
                  style={{ backgroundColor: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '11px', cursor: 'pointer', fontFamily: 'monospace' }}
                >
                  ← Back to Details
                </button>
              </div>

              {loadingLogs ? (
                <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '20px' }}>Loading logs...</div>
              ) : logs.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '20px' }}>No audit history found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {logs.map((log) => (
                    <div key={log.id} style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8', fontWeight: 'bold' }}>
                        <span>{log.action_type || log.action}</span>
                        <span style={{ color: '#71717a', fontSize: '10px' }}>{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: '#d4d4d8', marginTop: '4px' }}>
                        {log.field_name}: <span style={{ color: '#ef4444' }}>{log.old_value || 'None'}</span> → <span style={{ color: '#22c55e' }}>{log.new_value}</span>
                      </div>
                      {log.performed_by && (
                        <div style={{ color: '#71717a', fontSize: '9px', marginTop: '4px' }}>By: {log.performed_by}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Main Edit View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Designation Edit */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                  DESIGNATION
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. CEO, Managing Director, Chairman"
                  style={{
                    width: '100%',
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#22c55e',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* System Role Edit */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>
                  SYSTEM ROLE
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#121215',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                </select>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveDetails}
                disabled={isSaving}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>

              {/* View Activity & Audit Logs */}
              <button
                type="button"
                onClick={handleOpenLogs}
                style={{
                  backgroundColor: '#121215',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                <HistoryIcon style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
                VIEW ACTIVITY & AUDIT LOGS
              </button>

              {/* Account Revoke / Activate */}
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                style={{
                  backgroundColor: '#121215',
                  border: `1px solid ${isActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                  borderRadius: '8px',
                  padding: '12px',
                  color: isActive ? '#ef4444' : '#22c55e',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                {isActive ? 'REVOKE STAFF ACCESS' : 'ACTIVATE STAFF ACCESS'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
