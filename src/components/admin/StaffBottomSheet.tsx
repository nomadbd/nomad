import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, HistoryIcon } from '@/components/icons';
import { supabase } from '@/supabaseClient';
import { logAuditActivity } from '@/utils/auditLogger';
import Toast from '@/components/ui/Toast';
import ImageCropModal from '@/components/ui/ImageCropModal';
import { uploadToCloudinary } from '@/cloudinary';

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
  const [currentView, setCurrentView] = useState<'main' | 'avatar_manage' | 'activity_logs'>('main');

  const [designationInput, setDesignationInput] = useState<string>('');
  const [roleInput, setRoleInput] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [avatarReason, setAvatarReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmText, setConfirmText] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<'UPDATE_DETAILS' | 'TOGGLE_STATUS' | 'DELETE_AVATAR' | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, { name: string; designation?: string; email?: string; role?: string }>>({});
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isActive = staff.status === 'ACTIVE';

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdminId(user.id);
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (userProfile) {
          setCurrentUserRole(userProfile.role);
        }
      }
    };
    fetchCurrentUser();
  }, []);

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
  const isSelf = currentAdminId === staff.id;

  const finalDesignation = designationInput.trim() !== '' ? designationInput.trim() : (staff.designation || '');
  const finalRole = roleInput.trim() !== '' ? roleInput.toUpperCase().trim() : staff.role;

  const hasChanges = (staff.designation || '') !== finalDesignation || staff.role !== finalRole;

  useEffect(() => {
    setCurrentView('main');
    setDesignationInput('');
    setRoleInput('');
    setReason('');
    setAvatarReason('');
  }, [staff]);

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const triggerSelectImage = () => {
    if (!avatarReason.trim()) {
      setToastMsg({ text: 'Please enter a reason before updating the photo!', type: 'error' });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageSrc(reader.result as string);
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropApply = async (croppedFile: File) => {
    setIsCropModalOpen(false);
    setUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadToCloudinary(croppedFile, 'staff_avatars', `avatar_${staff.id}`);
      
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: uploadedUrl, updated_at: now })
        .eq('id', staff.id);

      if (error) throw error;

      await logAuditActivity({
        entityType: 'profile',
        entityId: staff.id,
        actionType: 'PROFILE_UPDATE',
        reason: avatarReason.trim() || 'Updated avatar image via Super Admin panel',
        changes: {
          Avatar: {
            old: staff.avatar_url ? '[Previous Image]' : 'None',
            new: '[Image Updated]',
          },
        },
      });

      setToastMsg({ text: 'Profile image updated successfully!', type: 'success' });
      setAvatarReason('');
      setCurrentView('main');
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setToastMsg({ text: err.message || 'Failed to upload image.', type: 'error' });
    } finally {
      setUploadingAvatar(false);
      setSelectedImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerDeleteAvatar = () => {
    if (!avatarReason.trim()) {
      setToastMsg({ text: 'Please enter a reason before deleting the photo!', type: 'error' });
      return;
    }
    setPendingAction('DELETE_AVATAR');
    setConfirmText('');
    setShowConfirmModal(true);
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
      } else if (pendingAction === 'DELETE_AVATAR') {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: null, updated_at: now })
          .eq('id', staff.id);

        if (error) throw error;

        await logAuditActivity({
          entityType: 'profile',
          entityId: staff.id,
          actionType: 'PROFILE_UPDATE',
          reason: avatarReason.trim() || 'Removed profile image via Super Admin',
          changes: {
            Avatar: {
              old: '[Previous Image]',
              new: 'None',
            },
          },
        });

        setToastMsg({ text: 'Profile image removed successfully!', type: 'success' });
        setAvatarReason('');
        setCurrentView('main');
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

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        selectedImageSrc={selectedImageSrc}
        isAmbassadorActive={false}
        onClose={() => {
          setIsCropModalOpen(false);
          setSelectedImageSrc(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
        onApply={handleCropApply}
      />

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

      {/* Backdrop */}
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
        <div
          onClick={(e) => e.stopPropagation()}
          className="staff-bottom-sheet"
          style={{
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#09090b',
            border: '1px solid #27272a',
            borderBottom: 'none',
            borderRadius: '20px 20px 0 0',
            padding: currentView === 'activity_logs' ? '0' : '20px 20px 32px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* VIEW ১: AVATAR MANAGE */}
          {currentView === 'avatar_manage' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '10px 0 10px 0', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#71717a', fontFamily: 'monospace', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  MEDIA PREVIEW
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentView('main')}
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#d4d4d8', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <CloseIcon style={{ width: '12px', height: '12px' }} />
                </button>
              </div>

              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #27272a',
                  backgroundColor: '#121215',
                  flexShrink: 0,
                }}
              >
                {staff.avatar_url ? (
                  <img
                    src={staff.avatar_url}
                    alt={staff.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      color: '#ffffff',
                      fontSize: '36px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'monospace',
                    }}
                  >
                    {getInitials(staff.name)}
                  </div>
                )}
              </div>

              {/* ছবি পরিবর্তনের জন্য কারণ ইনপুট */}
              {isSuperAdmin && (
                <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  <textarea
                    rows={2}
                    value={avatarReason}
                    onChange={(e) => setAvatarReason(e.target.value)}
                    placeholder="Reason for photo change/deletion (Required)..."
                    style={{
                      width: '100%',
                      backgroundColor: '#121215',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#a1a1aa',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none',
                      lineHeight: '1.4',
                    }}
                  />

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={triggerSelectImage}
                      style={{
                        backgroundColor: '#18181b',
                        color: '#38bdf8',
                        border: '1px solid #27272a',
                        borderRadius: '20px',
                        padding: '8px 22px',
                        fontSize: '11px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        letterSpacing: '0.8px',
                      }}
                    >
                      {uploadingAvatar ? 'UPLOADING...' : 'EDIT'}
                    </button>

                    {staff.avatar_url && (
                      <button
                        type="button"
                        onClick={triggerDeleteAvatar}
                        style={{
                          backgroundColor: '#18181b',
                          color: '#ef4444',
                          border: '1px solid #27272a',
                          borderRadius: '20px',
                          padding: '8px 22px',
                          fontSize: '11px',
                          fontWeight: '700',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          letterSpacing: '0.8px',
                        }}
                      >
                        DELETE
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setCurrentView('main')}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  marginTop: '2px',
                }}
              >
                BACK TO PROFILE
              </button>
            </div>
          ) : currentView === 'activity_logs' ? (
            /* VIEW ২: ACTIVITY LOGS */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HistoryIcon style={{ width: '18px', height: '18px', color: '#38bdf8' }} />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>
                    Activity & Audit Logs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('main')}
                  style={{ backgroundColor: '#18181b', border: '1px solid #27272a', color: '#d4d4d8', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
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
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'center', padding: '40px', fontFamily: 'monospace', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px' }}>
                  No audit history found.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '55vh' }}>
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
                      <div key={log.id} style={{ backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '12px', padding: '14px', fontSize: '11px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #1a1a1e', paddingBottom: '4px' }}>
                          <span style={{ color: '#71717a', fontSize: '10px' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {changeItems.map((item, idx) => (
                            <div key={idx} style={{ color: '#d4d4d8', fontSize: '12px', lineHeight: '1.4' }}>
                              <span style={{ color: '#a1a1aa' }}>{item.label} : </span>
                              <span style={{ color: '#ef4444' }}>
                                {item.oldVal.startsWith('http') ? '[Previous Image]' : item.oldVal}
                              </span>
                              <span style={{ color: '#71717a', margin: '0 6px' }}>→</span>
                              <span style={{ color: '#22c55e' }}>
                                {item.newVal.startsWith('http') ? '[Image Updated]' : item.newVal}
                              </span>
                            </div>
                          ))}
                        </div>

                        {log.reason && (
                          <div style={{ color: '#a1a1aa', fontSize: '11px', fontStyle: 'italic', backgroundColor: '#09090b', padding: '6px 10px', borderRadius: '6px', border: '1px solid #1f1f23', lineHeight: '1.4' }}>
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
            /* VIEW ৩: MAIN PROFILE */
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  <div
                    onClick={() => setCurrentView('avatar_manage')}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                    title="Click to view/edit image"
                  >
                    {staff.avatar_url ? (
                      <img
                        src={staff.avatar_url}
                        alt={staff.name}
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #3f3f46' }}
                      />
                    ) : (
                      <div
                        style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#f4f4f5', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}
                      >
                        {getInitials(staff.name)}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: '1.2', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ wordBreak: 'break-word' }}>{staff.name}</span>
                      {isSelf && (
                        <span style={{ fontSize: '9px', backgroundColor: '#27272a', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', flexShrink: 0 }}>YOU</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '3px', wordBreak: 'break-all', overflowWrap: 'anywhere' }}>
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

              {/* কনফিগারেশন বক্স */}
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

              {/* হিস্ট্রি ও লগের বাটন */}
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

              {/* রিভোক বাটন */}
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
