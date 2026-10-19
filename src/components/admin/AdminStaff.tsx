import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { StaffBottomSheet, StaffMember } from './StaffBottomSheet';
import { MessageIcon, EmailIcon } from '@/components/icons';

interface AdminStaffProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  dateFormat?: string;
  isAddOpen?: boolean;
  onCloseAdd?: () => void;
  onNavigateToTab?: (tab: string, params?: Record<string, string>) => void;
}

export default function AdminStaff({
  searchQuery = '',
  isFilterOpen = false,
  dateFormat = 'DD/MM/YYYY',
  isAddOpen = false,
  onCloseAdd,
  onNavigateToTab,
}: AdminStaffProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  const [bottomSheetStaff, setBottomSheetStaff] = useState<StaffMember | null>(null);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('STAFF');
  const [newDesignation, setNewDesignation] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [emailCheckInfo, setEmailCheckInfo] = useState<{
    found: boolean;
    role?: string;
    name?: string;
    source?: string;
  } | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [adminRoleConfirmed, setAdminRoleConfirmed] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['ADMIN', 'MANAGER', 'STAFF'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaffList(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setEmailCheckInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      const cleanEmail = newEmail.trim().toLowerCase();

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profileData) {
          setEmailCheckInfo({
            found: true,
            role: (profileData.role || 'CUSTOMER').toUpperCase(),
            name: profileData.name || '',
            source: 'profiles',
          });
          setCheckingEmail(false);
          return;
        }

        const { data: ambData } = await supabase
          .from('ambassador')
          .select('display_name, is_registered')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (ambData) {
          setEmailCheckInfo({
            found: true,
            role: ambData.is_registered ? 'AMBASSADOR' : 'INVITED AMBASSADOR',
            name: ambData.display_name || '',
            source: 'ambassador',
          });
          setCheckingEmail(false);
          return;
        }

        setEmailCheckInfo({ found: false });
      } catch (err) {
        setEmailCheckInfo(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [newEmail]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;

    if (newRole === 'ADMIN' && !adminRoleConfirmed) {
      alert('Security Alert: You must confirm administrative privileges checkbox before proceeding.');
      return;
    }

    setActionLoading(true);
    const cleanEmail = newEmail.trim().toLowerCase();
    const finalName = newName.trim();
    const now = new Date().toISOString();

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: finalName,
            role: newRole,
            designation: newDesignation.trim() ? newDesignation.trim() : null,
            status: 'ACTIVE',
            hired_at: now,
            role_assigned_at: now,
            updated_at: now,
          })
          .eq('id', existingProfile.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('profiles').insert([
          {
            name: finalName,
            email: cleanEmail,
            role: newRole,
            designation: newDesignation.trim() ? newDesignation.trim() : null,
            status: 'ACTIVE',
            hired_at: now,
            role_assigned_at: now,
            updated_at: now,
          },
        ]);

        if (insertError) throw insertError;
      }

      if (onCloseAdd) onCloseAdd();
      setNewName('');
      setNewEmail('');
      setNewDesignation('');
      setNewRole('STAFF');
      setEmailCheckInfo(null);
      setAdminRoleConfirmed(false);
      fetchStaff();
    } catch (err: any) {
      alert('Error updating staff role: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenChat = (staff: StaffMember, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetKey = staff.email || staff.id;

    if (onNavigateToTab) {
      onNavigateToTab('messages', { userId: targetKey });
    } else {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('tab', 'messages');
      currentUrl.searchParams.set('userId', targetKey);
      window.location.href = currentUrl.toString();
    }
  };

  const handleSendMail = (staff: StaffMember, e: React.MouseEvent) => {
    e.stopPropagation();
    if (staff.email) {
      window.location.href = `mailto:${staff.email}`;
    }
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const rolesList = [
    { label: 'ALL ROLES', value: 'ALL' },
    { label: 'STAFF', value: 'STAFF' },
    { label: 'MANAGER', value: 'MANAGER' },
    { label: 'ADMIN', value: 'ADMIN' },
  ];

  return (
    <div style={{ color: '#fff', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '1.2px', margin: 0, textTransform: 'uppercase', color: '#ffffff' }}>
            STAFF MANAGEMENT
          </h2>
          <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', letterSpacing: '0.8px' }}>
            TOTAL MEMBERS: {filteredStaff.length}
          </span>
        </div>
      </div>

      <div className={`filter-expand-wrapper ${isFilterOpen ? 'open' : ''}`}>
        <div className="filter-expand-content">
          <div
            className="animate-fade-in no-scrollbar"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '2px',
              alignItems: 'center',
            }}
          >
            {rolesList.map((item) => {
              const isActive = roleFilter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRoleFilter(item.value)}
                  className="apple-button-press"
                  style={{
                    backgroundColor: isActive ? '#ffffff' : '#09090b',
                    color: isActive ? '#000000' : '#a1a1aa',
                    border: isActive ? '1px solid #ffffff' : '1px solid #27272a',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '10px',
                    fontWeight: '700',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: '11px', color: '#71717a', padding: '24px 0', textAlign: 'center', fontFamily: 'monospace' }}>
          LOADING STAFF DATA...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#71717a', fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '8px' }}>
          NO STAFF MEMBERS FOUND.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredStaff.map((staff) => {
            const isInactive = staff.status === 'INACTIVE' || staff.status === 'BLOCKED';
            const hasDesignation = Boolean(staff.designation && staff.designation.trim());

            return (
              <div
                key={staff.id}
                style={{
                  backgroundColor: '#09090b',
                  border: '1px solid #1f1f23',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxSizing: 'border-box',
                  opacity: isInactive ? 0.6 : 1,
                  transition: 'border-color 0.2s ease, background-color 0.2s ease',
                }}
              >
                <div
                  onClick={() => setBottomSheetStaff(staff)}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
                  title="Click to view full profile & manage staff"
                >
                  {staff.avatar_url ? (
                    <img
                      src={staff.avatar_url}
                      alt={staff.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #27272a', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#18181b',
                        border: '1px solid #27272a',
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontFamily: 'monospace',
                      }}
                    >
                      {staff.name ? staff.name.slice(0, 2).toUpperCase() : 'ST'}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: '800',
                        color: '#ffffff',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        letterSpacing: '0.2px',
                      }}
                    >
                      {staff.name || 'UNNAMED STAFF'}
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: hasDesignation ? '#d4d4d8' : '#52525b',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                      }}
                    >
                      {hasDesignation ? staff.designation : 'No Designation Set'}
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: '#a1a1aa',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                        lineHeight: '1.3',
                        marginTop: '1px',
                      }}
                    >
                      {staff.email}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '3px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#121215',
                          color: '#a1a1aa',
                          border: '1px solid #27272a',
                          borderRadius: '4px',
                          padding: '1px 6px',
                          fontSize: '8px',
                          fontWeight: '700',
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {staff.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={(e) => handleOpenChat(staff, e)}
                    title="Direct Message"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      filter: 'brightness(0) invert(1)',
                    }}
                  >
                    <MessageIcon style={{ width: '16px', height: '16px' }} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSendMail(staff, e)}
                    title="Send Email"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      filter: 'brightness(0) invert(1)',
                    }}
                  >
                    <EmailIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>

                <div style={{ height: '1px', backgroundColor: '#18181b', width: '100%' }} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '8px', color: '#52525b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      JOINED
                    </div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                      {formatDate(staff.created_at)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#52525b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      HIRED AT
                    </div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                      {formatDate(staff.hired_at)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '8px', color: '#52525b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      UPDATED AT
                    </div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                      {formatDate(staff.updated_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bottomSheetStaff && (
        <StaffBottomSheet
          staff={bottomSheetStaff}
          onClose={() => setBottomSheetStaff(null)}
          onUpdateSuccess={() => {
            fetchStaff();
            setBottomSheetStaff(null);
          }}
        />
      )}

      {isAddOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '380px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
              APPOINT NEW MANAGEMENT / STAFF
            </h3>

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />

                {checkingEmail && (
                  <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', marginTop: '4px' }}>
                    Checking account status...
                  </div>
                )}

                {!checkingEmail && emailCheckInfo && (
                  <div style={{ marginTop: '6px', padding: '8px 10px', borderRadius: '6px', backgroundColor: emailCheckInfo.found ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)', border: emailCheckInfo.found ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: emailCheckInfo.found ? '#60a5fa' : '#4ade80', fontFamily: 'monospace' }}>
                      {emailCheckInfo.found ? `EXISTING ${emailCheckInfo.role} ACCOUNT DETECTED` : 'NEW EMAIL (NO EXISTING ACCOUNT)'}
                    </div>
                    {emailCheckInfo.found && (
                      <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px', fontFamily: 'system-ui' }}>
                        Current Name: <b>{emailCheckInfo.name || 'N/A'}</b>. Submitting will override their name & upgrade role.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>OFFICIAL FULL NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Md Toha Ali"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>DESIGNATION (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. CEO, Operations Lead, System Admin"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '6px', textTransform: 'uppercase' }}>ASSIGN ROLE & ACCESS LEVEL</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { roleKey: 'STAFF', label: 'STAFF' },
                    { roleKey: 'MANAGER', label: 'MANAGER' },
                    { roleKey: 'ADMIN', label: 'ADMIN' },
                  ].map((item) => {
                    const isSelected = newRole === item.roleKey;
                    return (
                      <button
                        key={item.roleKey}
                        type="button"
                        onClick={() => {
                          setNewRole(item.roleKey);
                          if (item.roleKey !== 'ADMIN') setAdminRoleConfirmed(false);
                        }}
                        style={{
                          backgroundColor: isSelected ? (item.roleKey === 'ADMIN' ? '#ef4444' : '#ffffff') : '#121215',
                          color: isSelected ? '#ffffff' : '#a1a1aa',
                          border: isSelected ? (item.roleKey === 'ADMIN' ? '1px solid #f87171' : '1px solid #ffffff') : '1px solid #27272a',
                          borderRadius: '8px',
                          padding: '10px 4px',
                          fontSize: '10px',
                          fontWeight: '800',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {newRole === 'ADMIN' && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', padding: '10px', marginTop: '2px' }}>
                  <div style={{ color: '#f87171', fontSize: '10px', fontWeight: '800', fontFamily: 'monospace', marginBottom: '6px' }}>
                    CRITICAL SECURITY CONFIRMATION
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={adminRoleConfirmed}
                      onChange={(e) => setAdminRoleConfirmed(e.target.checked)}
                      style={{ marginTop: '2px', accentColor: '#ef4444' }}
                    />
                    <span style={{ fontSize: '10px', color: '#fca5a5', lineHeight: '1.3' }}>
                      I confirm granting FULL ADMINISTRATIVE ACCESS to this account.
                    </span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={actionLoading || (newRole === 'ADMIN' && !adminRoleConfirmed)}
                  style={{
                    flex: 1,
                    backgroundColor: newRole === 'ADMIN' ? '#ef4444' : '#ffffff',
                    color: newRole === 'ADMIN' ? '#ffffff' : '#000000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    cursor: (actionLoading || (newRole === 'ADMIN' && !adminRoleConfirmed)) ? 'not-allowed' : 'pointer',
                    opacity: (newRole === 'ADMIN' && !adminRoleConfirmed) ? 0.4 : 1,
                    letterSpacing: '0.5px',
                  }}
                >
                  {actionLoading ? 'APPOINTING...' : 'CONFIRM APPOINTMENT'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseAdd) onCloseAdd();
                    setEmailCheckInfo(null);
                    setAdminRoleConfirmed(false);
                  }}
                  style={{ flex: 1, backgroundColor: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer' }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
