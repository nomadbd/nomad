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
  status: 'active' | 'blocked';
  created_at: string;
}

export default function AdminCustomers({ searchQuery = '', isFilterOpen }: AdminCustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // ভুল এড়াতে কনফার্মেশন স্টেট (কোন ইউজারের বিপরীতে কনফার্মেশন চলছে)
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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

  const handleStatusAction = async (id: string, currentStatus: string) => {
    if (confirmingId !== id) {
      // প্রথম ক্লিক: কনফার্মেশনের জন্য প্রস্তুত করা
      setConfirmingId(id);
      return;
    }

    // দ্বিতীয় ক্লিক: কার্যকর করা
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setConfirmingId(null);
      fetchCustomers();
    } catch (err: any) {
      alert('Failed to change status: ' + err.message);
      setConfirmingId(null);
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || cust.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ 
      color: '#f1f5f9', 
      width: '100%', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '16px 12px', 
      boxSizing: 'border-box',
      overflowX: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
    }}>
      {/* ডিম্বাকার ফিল্টার সিলেক্ট ডিজাইন (মডাল ছাড়া) */}
      {isFilterOpen && (
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {[
            { label: 'ALL STATUS', value: 'ALL' },
            { label: 'ACTIVE', value: 'active' },
            { label: 'BLOCKED', value: 'blocked' }
          ].map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : '#0c0c0e',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  border: `1px solid ${isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.06'}`,
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', 
          gap: '16px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {filteredCustomers.map((cust) => {
            const isBlocked = cust.status === 'blocked';
            const isConfirming = confirmingId === cust.id;

            return (
              <div
                key={cust.id}
                style={{
                  backgroundColor: '#0c0c0e',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}
              >
                <div>
                  {/* ওপরে নাম, নিচে ইমেইল এবং ডানপাশে স্ট্যাটাস ডট */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cust.name || 'GUEST USER'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-all' }}>
                        {cust.email}
                      </div>
                    </div>
                    {/* লাল বা সবুজ ডট স্ট্যাটাস */}
                    <div 
                      title={isBlocked ? 'Blocked' : 'Active'}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isBlocked ? '#ef4444' : '#22c55e',
                        boxShadow: `0 0 8px ${isBlocked ? '#ef4444' : '#22c55e'}`,
                        flexShrink: 0,
                        marginTop: '6px'
                      }}
                    />
                  </div>

                  {/* Joined Date */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#64748b',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                    marginBottom: '16px'
                  }}>
                    Joined: <strong style={{ color: '#cbd5e1' }}>{new Date(cust.created_at).toLocaleDateString()}</strong>
                  </div>
                </div>

                {/* কমপ্যাক্ট কনফার্মেশন সহ অ্যাকশন বাটন */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  {isConfirming && (
                    <button
                      onClick={() => setConfirmingId(null)}
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        padding: '6px 10px',
                        fontSize: '10px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      CANCEL
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusAction(cust.id, cust.status)}
                    style={{
                      backgroundColor: isConfirming ? (isBlocked ? '#22c55e' : '#ef4444') : 'transparent',
                      border: `1px solid ${isBlocked ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: isConfirming ? '#fff' : (isBlocked ? '#4ade80' : '#f87171'),
                      padding: '6px 14px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '0.5px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isConfirming ? 'CONFIRM?' : (isBlocked ? 'UNBLOCK' : 'BLOCK CUSTOMER')}
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
