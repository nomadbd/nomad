import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminStaffProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  dateFormat?: string;
  isAddOpen?: boolean;
  onCloseAdd?: () => void;
}

interface StaffMember {
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

export default function AdminStaff({
  searchQuery = '',
  isFilterOpen,
  dateFormat = 'DD/MM/YYYY',
  isAddOpen = false,
  onCloseAdd,
}: AdminStaffProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

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

  const handleRoleChange = async (id: string, role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role,
          role_assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchStaff();
    } catch (err: any) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleDesignationChange = async (id: string, designation: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          designation: designation.trim() ? designation.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchStaff();
    } catch (err: any) {
      alert('Failed to update designation: ' + err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchStaff();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '1.5px', margin: 0, textTransform: 'uppercase' }}>
            STAFF MANAGEMENT
          </h2>
          <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', letterSpacing: '1px' }}>
            TOTAL MEMBERS: {filteredStaff.length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      {isFilterOpen && (
        <div style={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '8px', padding: '10px', marginBottom: '16px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ width: '100%', backgroundColor: '#121215', color: '#fff', border: '1px solid #27272a', borderRadius: '6px', padding: '8px 12px', fontSize: '11px', fontFamily: 'monospace' }}
          >
            <option value="ALL">ALL ROLES</option>
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>
      )}

      {/* Staff Cards View */}
      {loading ? (
        <div style={{ fontSize: '11px', color: '#666', padding: '20px 0', textAlign: 'center', fontFamily: 'monospace' }}>
          LOADING STAFF DATA...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#555', fontSize: '11px', fontFamily: 'monospace', backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '8px' }}>
          NO STAFF MEMBERS FOUND.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredStaff.map((staff) => {
            const isInactive = staff.status === 'INACTIVE' || staff.status === 'BLOCKED';

            return (
              <div
                key={staff.id}
                style={{
                  backgroundColor: '#09090b',
                  border: '1px solid #1f1f23',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxSizing: 'border-box',
                  opacity: isInactive ? 0.6 : 1,
                }}
              >
                {/* Top Section: Member Info (Left) + Role Select (Right) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  
                  {/* Left: Avatar + Name + Designation + Email */}
                  <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: 0 }}>
                    {staff.avatar_url ? (
                      <img
                        src={staff.avatar_url}
                        alt={staff.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #27272a', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#18181b',
                          border: '1px solid #27272a',
                          color: '#fff',
                          fontSize: '12px',
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

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Name */}
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', lineHeight: '1.2', wordBreak: 'break-word' }}>
                        {staff.name || 'UNNAMED STAFF'}
                      </div>

                      {/* Designation Inline Editor (উপরে নাম, নিচে পদবি) */}
                      <div style={{ marginTop: '3px' }}>
                        <input
                          type="text"
                          placeholder="+ Set Designation (e.g. CEO)"
                          defaultValue={staff.designation || ''}
                          onBlur={(e) => handleDesignationChange(staff.id, e.target.value)}
                          style={{
                            width: '100%',
                            maxWidth: '180px',
                            backgroundColor: 'transparent',
                            color: '#22c55e',
                            border: 'none',
                            borderBottom: '1px dashed #27272a',
                            padding: '1px 0',
                            fontSize: '11px',
                            fontWeight: '600',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Email */}
                      <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace', marginTop: '4px', wordBreak: 'break-all' }}>
                        {staff.email}
                      </div>
                    </div>
                  </div>

                  {/* Right: System Role Select */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ fontSize: '8px', color: '#52525b', fontFamily: 'monospace', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      SYSTEM ROLE
                    </span>
                    <select
                      value={staff.role}
                      onChange={(e) => handleRoleChange(staff.id, e.target.value)}
                      style={{
                        backgroundColor: '#121215',
                        color: staff.role === 'SUPER_ADMIN' ? '#38bdf8' : staff.role === 'ADMIN' ? '#22c55e' : '#a1a1aa',
                        border: '1px solid #27272a',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    </select>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: '#18181b', width: '100%' }} />

                {/* Bottom Row Columns: Joined + Hired At + Status Toggle */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', alignItems: 'center' }}>
                  {/* Column 1: Joined */}
                  <div>
                    <div style={{ fontSize: '8px', color: '#52525b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      JOINED
                    </div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                      {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  {/* Column 2: Hired At */}
                  <div>
                    <div style={{ fontSize: '8px', color: '#52525b', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      HIRED AT
                    </div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: '2px' }}>
                      {staff.hired_at ? new Date(staff.hired_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  {/* Column 3: Action Button */}
                  <div style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleStatus(staff.id, staff.status)}
                      style={{
                        backgroundColor: isInactive ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: `1px solid ${isInactive ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                        color: isInactive ? '#22c55e' : '#ef4444',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '9px',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {isInactive ? 'ACTIVATE' : 'REVOKE'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Staff Modal (Controlled by Header Plus Icon) */}
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
