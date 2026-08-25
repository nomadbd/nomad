import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface AdminCustomersProps {
  searchQuery?: string;
  isFilterOpen?: boolean;
  dateFormat?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'blocked';
  created_at: string;
  total_orders?: number;
}

export default function AdminCustomers({ searchQuery = '', isFilterOpen }: AdminCustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'CUSTOMER')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const toggleCustomerStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchCustomers();
    } catch (err: any) {
      alert('Failed to change status: ' + err.message);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'ALL' || cust.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ color: '#fff', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', letterSpacing: '2px', margin: 0 }}>CUSTOMER DIRECTORY</h2>
        <span style={{ fontSize: '10px', color: '#888' }}>TOTAL REGISTERED: {filteredCustomers.length}</span>
      </div>

      {/* Filter Bar */}
      {isFilterOpen && (
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', padding: '12px', marginBottom: '20px' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ backgroundColor: '#111', color: '#fff', border: '1px solid #222', padding: '8px 12px', fontSize: '11px' }}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="active">ACTIVE ONLY</option>
            <option value="blocked">BLOCKED ONLY</option>
          </select>
        </div>
      )}

      {/* Customer List Table */}
      {loading ? (
        <div style={{ fontSize: '11px', color: '#888', padding: '20px 0' }}>LOADING CUSTOMERS...</div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #1a1a1a', backgroundColor: '#060606' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a', color: '#666', height: '40px' }}>
                <th style={{ padding: '0 16px' }}>CUSTOMER</th>
                <th style={{ padding: '0 16px' }}>CONTACT</th>
                <th style={{ padding: '0 16px' }}>JOINED</th>
                <th style={{ padding: '0 16px' }}>STATUS</th>
                <th style={{ padding: '0 16px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} style={{ borderBottom: '1px solid #111', height: '52px' }}>
                  <td style={{ padding: '0 16px' }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{cust.name || 'GUEST USER'}</div>
                    <div style={{ fontSize: '10px', color: '#666' }}>{cust.email}</div>
                  </td>
                  <td style={{ padding: '0 16px', color: '#888' }}>
                    {cust.phone || 'N/A'}
                  </td>
                  <td style={{ padding: '0 16px', color: '#888' }}>
                    {new Date(cust.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0 16px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '3px 6px',
                        borderRadius: '2px',
                        fontWeight: 'bold',
                        backgroundColor: cust.status === 'blocked' ? '#331111' : '#112211',
                        color: cust.status === 'blocked' ? '#ff4d4d' : '#2ecc71',
                        border: `1px solid ${cust.status === 'blocked' ? '#551111' : '#114411'}`
                      }}
                    >
                      {(cust.status || 'ACTIVE').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '0 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => toggleCustomerStatus(cust.id, cust.status)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${cust.status === 'blocked' ? '#2ecc71' : '#ff4d4d'}`,
                        color: cust.status === 'blocked' ? '#2ecc71' : '#ff4d4d',
                        padding: '4px 8px',
                        fontSize: '9px',
                        cursor: 'pointer'
                      }}
                    >
                      {cust.status === 'blocked' ? 'UNBLOCK' : 'BLOCK'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
