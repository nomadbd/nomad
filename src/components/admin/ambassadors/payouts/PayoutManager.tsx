import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface PayoutRequestItem {
  id: string;
  ambassador_id: string;
  amount: number;
  payout_method: string;
  account_number: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  transaction_id: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  ambassador?: {
    id: string;
    unpaid_balance: number;
    pending_balance: number;
    email: string;
    phone: string;
    profiles?: {
      name: string;
      avatar_url: string;
      email: string;
    } | null;
  } | null;
}

export default function PayoutManager() {
  const [requests, setRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State for Action (Approve / Reject)
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequestItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [transactionIdInput, setTransactionIdInput] = useState<string>('');
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // ১. ডেটা লোড করা
  const fetchPayoutRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('payout_requests')
        .select(`
          *,
          ambassador (
            id,
            unpaid_balance,
            pending_balance,
            email,
            phone,
            profiles (
              name,
              avatar_url,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests((data as any) || []);
    } catch (err: any) {
      console.error('Error fetching payout requests:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutRequests();
  }, [statusFilter]);

  // ২. মডাল ওপেন করার হ্যান্ডলার
  const openActionModal = (item: PayoutRequestItem, type: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(item);
    setActionType(type);
    setTransactionIdInput(item.transaction_id || '');
    setAdminNoteInput(item.admin_note || '');
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setActionType(null);
    setTransactionIdInput('');
    setAdminNoteInput('');
  };

  // ৩. রিকুয়েস্ট সাবমিট (Approve/Paid or Reject)
  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;

    if (actionType === 'APPROVE' && !transactionIdInput.trim()) {
      alert('Please enter a Transaction ID (e.g., bKash TrxID).');
      return;
    }

    setSubmitting(true);
    try {
      const isApprove = actionType === 'APPROVE';
      const newStatus = isApprove ? 'PAID' : 'REJECTED';

      // Step A: Update payout_requests
      const { error: reqError } = await supabase
        .from('payout_requests')
        .update({
          status: newStatus,
          transaction_id: transactionIdInput.trim() || null,
          admin_note: adminNoteInput.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (reqError) throw reqError;

      // Step B: Update ambassador balances
      const amb = selectedRequest.ambassador;
      if (amb) {
        const currentPending = amb.pending_balance || 0;
        const currentUnpaid = amb.unpaid_balance || 0;

        if (isApprove) {
          // Approve হলে pending_balance কমবে
          await supabase
            .from('ambassador')
            .update({
              pending_balance: Math.max(0, currentPending - selectedRequest.amount),
              updated_at: new Date().toISOString()
            })
            .eq('id', amb.id);
        } else {
          // Reject হলে pending_balance কমবে এবং টাকা unpaid_balance-এ ফেরত যাবে
          await supabase
            .from('ambassador')
            .update({
              pending_balance: Math.max(0, currentPending - selectedRequest.amount),
              unpaid_balance: currentUnpaid + selectedRequest.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', amb.id);
        }
      }

      alert(`Payout successfully ${isApprove ? 'approved and marked as PAID' : 'rejected'}.`);
      closeModal();
      fetchPayoutRequests();
    } catch (err: any) {
      alert('Error updating payout request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // সার্চ ফিল্টারিং
  const filteredRequests = requests.filter((r) => {
    const name = r.ambassador?.profiles?.name || '';
    const email = r.ambassador?.email || r.ambassador?.profiles?.email || '';
    const account = r.account_number || '';
    const trxId = r.transaction_id || '';
    const query = searchTerm.toLowerCase();

    return (
      name.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query) ||
      account.toLowerCase().includes(query) ||
      trxId.toLowerCase().includes(query)
    );
  });

  // মেট্রিক্স সামারি হিসাব
  const totalPendingAmount = requests
    .filter((r) => r.status === 'PENDING')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPaidAmount = requests
    .filter((r) => r.status === 'PAID' || r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={{ backgroundColor: '#050505', color: '#fff', minHeight: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* হেডার */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>
            PAYOUT MANAGEMENT
          </h1>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            Review, approve, and track ambassador withdrawal requests.
          </p>
        </div>

        {/* সামারি কার্ডসমূহ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>PENDING PAYOUTS</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#f59e0b', marginTop: '6px' }}>
              ৳{totalPendingAmount.toLocaleString()}
            </div>
          </div>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>TOTAL PAID OUT</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#34d399', marginTop: '6px' }}>
              ৳{totalPaidAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* ফিল্টার ও সার্চ বার */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {/* ফিল্টার বাটন */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['PENDING', 'PAID', 'REJECTED', 'ALL'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid #222',
                  backgroundColor: statusFilter === tab ? '#ffffff' : '#111111',
                  color: statusFilter === tab ? '#000000' : '#888888',
                  fontWeight: '700',
                  fontSize: '11px',
                  cursor: 'pointer',
                  letterSpacing: '0.5px'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* সার্চ বক্স */}
          <input
            type="text"
            placeholder="Search by name, account, TrxID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: '#111111',
              border: '1px solid #222',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              outline: 'none',
              width: '240px'
            }}
          />
        </div>

        {/* রিকুয়েস্ট লিস্ট টেবিল/কার্ড */}
        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: '60px', fontSize: '13px' }}>Loading payout requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ color: '#555', textAlign: 'center', padding: '60px', fontSize: '13px', backgroundColor: '#0a0a0a', borderRadius: '12px', border: '1px solid #1a1a1a' }}>
            No payout requests found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredRequests.map((item) => {
              const profileName = item.ambassador?.profiles?.name || 'Ambassador';
              const profileAvatar = item.ambassador?.profiles?.avatar_url;
              const contactEmail = item.ambassador?.email || item.ambassador?.profiles?.email || 'N/A';

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  {/* অ্যাম্বাসেডর তথ্য ও টাকা */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: '#888' }}>
                        {profileName.charAt(0)}
                      </div>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{profileName}</span>
                        <span style={{ fontSize: '11px', color: '#666' }}>({contactEmail})</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                        <strong style={{ color: '#fff' }}>{item.payout_method}</strong> &bull; <span style={{ fontFamily: 'monospace' }}>{item.account_number}</span>
                      </div>
                      {item.transaction_id && (
                        <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px', fontFamily: 'monospace' }}>
                          TrxID: {item.transaction_id}
                        </div>
                      )}
                      {item.admin_note && (
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', fontStyle: 'italic' }}>
                          Note: "{item.admin_note}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* অ্যামাউন্ট ও অ্যাকশন বাটন */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
                        ৳{item.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          letterSpacing: '0.5px',
                          color: item.status === 'PAID' ? '#34d399' : item.status === 'REJECTED' ? '#f87171' : '#f59e0b',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${item.status === 'PAID' ? 'rgba(52,211,153,0.2)' : item.status === 'REJECTED' ? 'rgba(248,113,113,0.2)' : 'rgba(245,158,11,0.2)'}`
                        }}
                      >
                        {item.status}
                      </span>

                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => openActionModal(item, 'APPROVE')}
                            style={{
                              backgroundColor: '#ffffff',
                              color: '#000',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            APPROVE
                          </button>
                          <button
                            onClick={() => openActionModal(item, 'REJECT')}
                            style={{
                              backgroundColor: '#1a1a1a',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              padding: '8px 14px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            REJECT
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ACTION MODAL (APPROVE OR REJECT) */}
        {actionType && selectedRequest && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #222',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '420px',
                padding: '20px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', margin: 0, color: '#fff', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {actionType === 'APPROVE' ? 'Approve & Mark Paid' : 'Reject Payout Request'}
                </h3>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}>
                  &times;
                </button>
              </div>

              <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#111', padding: '12px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '12px' }}>
                  <div style={{ color: '#888' }}>Amount: <strong style={{ color: '#fff' }}>৳{selectedRequest.amount.toLocaleString()}</strong></div>
                  <div style={{ color: '#888', marginTop: '4px' }}>Method: <strong style={{ color: '#fff' }}>{selectedRequest.payout_method} ({selectedRequest.account_number})</strong></div>
                </div>

                {actionType === 'APPROVE' && (
                  <div>
                    <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>
                      TRANSACTION ID (TrxID) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BKL8923JX9"
                      value={transactionIdInput}
                      onChange={(e) => setTransactionIdInput(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#111',
                        border: '1px solid #222',
                        color: '#fff',
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '6px' }}>
                    ADMIN NOTE (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder={actionType === 'REJECT' ? 'Reason for rejection...' : 'Internal reference note...'}
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#111',
                      border: '1px solid #222',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: actionType === 'APPROVE' ? '#ffffff' : '#ef4444',
                    color: actionType === 'APPROVE' ? '#000000' : '#ffffff',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  {submitting ? 'PROCESSING...' : actionType === 'APPROVE' ? 'CONFIRM PAYOUT' : 'CONFIRM REJECT'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
