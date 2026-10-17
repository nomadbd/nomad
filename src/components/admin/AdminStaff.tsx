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
  isFilterOpen,
  dateFormat = 'DD/MM/YYYY',
  isAddOpen = false,
  onCloseAdd,
  onNavigateToTab,
}: AdminStaffProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Bottom Sheet State
  const [bottomSheetStaff, setBottomSheetStaff] = useState<StaffMember | null>(null);

  // New Staff Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('STAFF');
  const [newDesignation, setNewDesignation] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['SUPER_ADMIN', 'ADMIN', 'STAFF'])
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
    setActionLoading(true);

    const now = new Date().toISOString();

    try {
      const { error } = await supabase.from('profiles').insert([
        {
          name: newName,
          email: newEmail,
          role: newRole,
          designation: newDesignation.trim() ? newDesignation.trim() : null,
          status: 'ACTIVE',
          hired_at: now,
          role_assigned_at: now,
          updated_at: now,
        },
      ]);

      if (error) throw error;
      if (onCloseAdd) onCloseAdd();
      setNewName('');
      setNewEmail('');
      setNewDesignation('');
      setNewRole('STAFF');
      fetchStaff();
    } catch (err: any) {
      alert('Error adding staff: ' + err.message);
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

  return (
    <div style={{ color: '#fff', width: '100%', boxSizing: 'border-box' }}>
      {/* Header Info */}
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

      {/* Filter Bar */}
      {isFilterOpen && (
        <div style={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '8px', padding: '8px', marginBottom: '14px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '100%', backgroundColor: '#121215', color: '#fff', border: '1px solid #27272a', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
          >
            <option value="ALL">ALL ROLES</option>
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>
      )}

      {/* Staff Cards Read-Only List */}
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
                {/* প্রোফাইল হেডার ও বিস্তারিত কলাম (কেবল এই অংশে ক্লিকে বটম শীট ওপেন হবে) */}
                <div
                  onClick={() => setBottomSheetStaff(staff)}
                  style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}
                  title="Click to view full profile & manage staff"
                >
                  {/* ১. প্রোফাইল পিকচার */}
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

                  {/* ২. নাম, ইমেইল, পদবী ও রোল এর কমপ্যাক্ট কলাম */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', lineHeight: '1.2', wordBreak: 'break-word' }}>
                      {staff.name || 'UNNAMED STAFF'}
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: '#a1a1aa',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                        lineHeight: '1.3',
                        marginTop: '2px',
                      }}
                    >
                      {staff.email}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: hasDesignation ? '#22c55e' : '#52525b',
                          fontFamily: 'monospace',
                        }}
                      >
                        {hasDesignation ? staff.designation : 'No Designation Set'}
                      </span>

                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#121215',
                          color: staff.role === 'SUPER_ADMIN' ? '#38bdf8' : staff.role === 'ADMIN' ? '#22c55e' : '#a1a1aa',
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

                {/* ৩. আইকন একশন রো (স্বাধীন অ্যাকশন বাটন) */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '2px' }}>
                  {/* মেসেজ আইকন */}
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

                  {/* মেইল আইকন */}
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

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: '#18181b', width: '100%' }} />

                {/* Bottom Row: Date Columns */}
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

      {/* Staff Bottom Sheet Component */}
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

      {/* Add Staff Modal */}
      {isAddOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '800', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
              ADD NEW STAFF MEMBER
            </h3>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>FULL NAME</label>
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
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>EMAIL ADDRESS</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>DESIGNATION (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. CEO, MD, Chairman"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '9px', color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '4px', textTransform: 'uppercase' }}>INITIAL ROLE</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#121215', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', padding: '10px', fontSize: '12px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 1, backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer', letterSpacing: '0.5px' }}
                >
                  {actionLoading ? 'ADDING...' : 'CONFIRM'}
                </button>
                <button
                  type="button"
                  onClick={onCloseAdd}
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
