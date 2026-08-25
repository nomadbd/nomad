import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminStaffProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  isSearchOpen?: boolean;
  dateFormat?: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function AdminStaff({ searchQuery = '', isFilterOpen, dateFormat = 'DD/MM/YYYY' }: AdminStaffProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  
  // New Staff Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('STAFF');
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
        .update({ role })
        .eq('id', id);

      if (error) throw error;
      fetchStaff();
    } catch (err: any) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    setActionLoading(true);

    try {
      // Create user auth or trigger invite
      const { error } = await supabase.from('profiles').insert([
        { name: newName, email: newEmail, role: newRole, status: 'active' }
      ]);

      if (error) throw error;
      setIsModalOpen(false);
      setNewName('');
      setNewEmail('');
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
      staff.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Header & Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '16px', letterSpacing: '2px', margin: 0 }}>STAFF MANAGEMENT</h2>
          <span style={{ fontSize: '10px', color: '#888' }}>TOTAL STAFF: {filteredStaff.length}</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            border: 'none',
            padding: '10px 16px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer',
            borderRadius: '2px'
          }}
        >
          + ADD NEW STAFF
        </button>
      </div>

      {/* Filter Bar */}
      {isFilterOpen && (
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', padding: '12px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ backgroundColor: '#111', color: '#fff', border: '1px solid #222', padding: '8px 12px', fontSize: '11px' }}
          >
            <option value="ALL">ALL ROLES</option>
            <option value="SUPER_ADMIN">SUPER ADMIN</option>
            <option value="ADMIN">ADMIN</option>
            <option value="STAFF">STAFF</option>
          </select>
        </div>
      )}

      {/* Staff List Table */}
      {loading ? (
        <div style={{ fontSize: '11px', color: '#888', padding: '20px 0' }}>LOADING STAFF DATA...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #1a1a1a', backgroundColor: '#060606' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a', color: '#666', height: '40px' }}>
                <th style={{ padding: '0 16px' }}>MEMBER</th>
                <th style={{ padding: '0 16px' }}>ROLE</th>
                <th style={{ padding: '0 16px' }}>JOINED</th>
                <th style={{ padding: '0 16px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} style={{ borderBottom: '1px solid #111', height: '52px' }}>
                  <td style={{ padding: '0 16px' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{staff.name || 'UNNAMED'}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>{staff.email}</div>
                  </td>
                  <td style={{ padding: '0 16px' }}>
                    <select
                      value={staff.role}
                      onChange={(e) => handleRoleChange(staff.id, e.target.value)}
                      style={{ backgroundColor: '#111', color: '#2ecc71', border: '1px solid #222', padding: '4px 8px', fontSize: '10px', fontWeight: 'bold' }}
                    >
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    </select>
                  </td>
                  <td style={{ padding: '0 16px', color: '#888' }}>
                    {new Date(staff.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleRoleChange(staff.id, 'INACTIVE')}
                      style={{ background: 'transparent', border: '1px solid #331111', color: '#ff4d4d', padding: '4px 8px', fontSize: '9px', cursor: 'pointer' }}
                    >
                      REVOKE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #222', padding: '24px', width: '360px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', letterSpacing: '1px' }}>ADD NEW STAFF MEMBER</h3>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="FULL NAME"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff', padding: '10px', fontSize: '11px' }}
              />
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff', padding: '10px', fontSize: '11px' }}
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                style={{ backgroundColor: '#111', border: '1px solid #222', color: '#fff', padding: '10px', fontSize: '11px' }}
              >
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{ flex: 1, backgroundColor: '#fff', color: '#000', border: 'none', padding: '10px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' }}
                >
                  {actionLoading ? 'ADDING...' : 'CONFIRM'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, backgroundColor: 'transparent', color: '#888', border: '1px solid #333', padding: '10px', fontSize: '10px', cursor: 'pointer' }}
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
