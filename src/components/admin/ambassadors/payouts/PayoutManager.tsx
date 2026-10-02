import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

interface PayoutRequest {
  id: string;
  ambassador_id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export default function PayoutManager() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select(`
          id,
          ambassador_id,
          amount,
          payment_method,
          account_details,
          status,
          created_at,
          profiles:ambassador_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayouts((data as any) || []);
    } catch (err: any) {
      console.error('Error fetching payouts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleUpdateStatus = async (payoutId: string, newStatus: 'APPROVED' | 'REJECTED' | 'PAID') => {
    const confirm = window.confirm(`Are you sure you want to mark this request as ${newStatus}?`);
    if (!confirm) return;

    setActionLoading(payoutId);
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', payoutId);

      if (error) throw error;
      fetchPayouts();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div style={{ width: '100%', fontFamily: 'monospace' }}>
      {/* FILTER BUTTONS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            style={{
              backgroundColor: statusFilter === st ? '#111' : 'transparent',
              color: statusFilter === st ? '#2997ff' : '#666',
              border: '1px solid',
              borderColor: statusFilter === st ? '#2997ff' : '#222',
              padding: '4px 10px',
              fontSize: '10px',
              cursor: 'pointer',
              borderRadius: '2px',
              letterSpacing: '1px',
            }}
          >
            {st} ({payouts.filter((p) => st === 'ALL' || p.status === st).length})
          </button>
        ))}
      </div>

      {/* LIST CONTENT */}
      {loading ? (
        <div style={{ color: '#666', fontSize: '11px', padding: '20px 0' }}>LOADING PAYOUT REQUESTS...</div>
      ) : filteredPayouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#555', backgroundColor: '#050505', border: '1px solid #222', borderRadius: '2px', fontSize: '11px' }}>
          NO PAYOUT REQUESTS FOUND.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredPayouts.map((item) => {
            const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            const isPending = item.status === 'PENDING';

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#050505',
                  border: '1px solid #222',
                  padding: '12px 14px',
                  borderRadius: '2px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                    {profile?.name || 'Unknown Ambassador'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    {profile?.email || 'N/A'} • {new Date(item.created_at).toLocaleDateString('en-GB')}
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
                    METHOD: <span style={{ color: '#fff' }}>{item.payment_method}</span> ({item.account_details})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#64ffda' }}>
                      ৳{item.amount.toLocaleString()}
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        display: 'inline-block',
                        marginTop: '4px',
                        backgroundColor:
                          item.status === 'APPROVED' ? '#082210' : item.status === 'REJECTED' ? '#220808' : '#221a08',
                        color:
                          item.status === 'APPROVED' ? '#4dff88' : item.status === 'REJECTED' ? '#ff4d4d' : '#e3a008',
                        border: `1px solid ${
                          item.status === 'APPROVED' ? '#115522' : item.status === 'REJECTED' ? '#551111' : '#554411'
                        }`,
                      }}
                    >
                      {item.status}
                    </span>
                  </div>

                  {isPending && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        disabled={actionLoading === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                        style={{
                          backgroundColor: '#082210',
                          color: '#4dff88',
                          border: '1px solid #115522',
                          padding: '6px 10px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          fontWeight: 'bold',
                        }}
                      >
                        APPROVE
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                        style={{
                          backgroundColor: '#220808',
                          color: '#ff4d4d',
                          border: '1px solid #551111',
                          padding: '6px 10px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          borderRadius: '2px',
                          fontWeight: 'bold',
                        }}
                      >
                        REJECT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
