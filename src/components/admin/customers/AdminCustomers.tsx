import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

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
    <div style={{ 
      color: '#f1f5f9', 
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '16px 20px', 
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      {/* Filter Bar */}
      {isFilterOpen && (
        <div style={{ 
          backgroundColor: '#0c0c0e', 
          border: '1px solid rgba(255, 255, 255, 0.06)', 
          borderRadius: '12px',
          padding: '16px', 
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ 
              backgroundColor: '#141417', 
              color: '#f1f5f9', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '8px',
              padding: '10px 14px', 
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            <option value="ALL">ALL STATUS</option>
            <option value="active">ACTIVE ONLY</option>
            <option value="blocked">BLOCKED ONLY</option>
          </select>
        </div>
      )}

      {/* Customer List Content */}
      {loading ? (
        <div style={{ fontSize: '12px', color: '#94a3b8', padding: '40px 0', textAlign: 'center', letterSpacing: '1px' }}>
          LOADING CUSTOMERS...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#64748b', padding: '40px 0', textAlign: 'center', letterSpacing: '0.5px' }}>
          NO CUSTOMERS FOUND.
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '16px' 
        }}>
          {filteredCustomers.map((cust) => {
            const isBlocked = cust.status === 'blocked';
            return (
              <div
                key={cust.id}
                style={{
                  backgroundColor: '#0c0c0e',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div>
                  {/* Top info: Name and Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
                        {cust.name || 'GUEST USER'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all' }}>
                        {cust.email}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        backgroundColor: isBlocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: isBlocked ? '#f87171' : '#4ade80',
                        border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`
                      }}
                    >
                      {(cust.status || 'ACTIVE').toUpperCase()}
                    </span>
                  </div>

                  {/* Secondary info: Phone & Joined Date */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    fontSize: '11px', 
                    color: '#64748b',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    marginTop: '12px',
                    marginBottom: '16px'
                  }}>
                    <span>Phone: <strong style={{ color: '#cbd5e1' }}>{cust.phone || 'N/A'}</strong></span>
                    <span>Joined: <strong style={{ color: '#cbd5e1' }}>{new Date(cust.created_at).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Action Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => toggleCustomerStatus(cust.id, cust.status)}
                    style={{
                      backgroundColor: 'transparent',
                      border: `1px solid ${isBlocked ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: isBlocked ? '#4ade80' : '#f87171',
                      padding: '6px 14px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {isBlocked ? 'UNBLOCK' : 'BLOCK CUSTOMER'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
