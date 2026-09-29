import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface EarningsCardProps {
  ambassadorId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  payoutDetails?: string;
  onSuccessRefresh?: () => void;
}

interface PayoutRequest {
  id: string;
  amount: number;
  payout_method: string;
  account_number: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  created_at: string;
}

export default function EarningsCard({
  ambassadorId,
  availableBalance = 0,
  pendingBalance = 0,
  totalEarned = 0,
  payoutDetails = '',
  onSuccessRefresh
}: EarningsCardProps) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [history, setHistory] = useState<PayoutRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Parse saved payout details
  let savedMethod = '';
  let savedAccount = '';

  if (payoutDetails && payoutDetails.trim() !== '') {
    if (payoutDetails.includes(':')) {
      const parts = payoutDetails.split(':');
      savedMethod = parts[0]?.trim() || '';
      savedAccount = parts[1]?.trim() || '';
    } else {
      savedAccount = payoutDetails.trim();
      savedMethod = 'Default';
    }
  }

  const hasPayoutDetails = Boolean(savedAccount);

  // Submit Payout Request
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!hasPayoutDetails) {
      setErrorMsg('Please set up your payment method in Settings first.');
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    if (numericAmount > availableBalance) {
      setErrorMsg('Amount exceeds your available balance.');
      return;
    }

    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('payout_requests')
        .insert([
          {
            ambassador_id: ambassadorId,
            amount: numericAmount,
            payout_method: savedMethod || 'bKash',
            account_number: savedAccount,
            status: 'PENDING'
          }
        ]);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('ambassador')
        .update({
          unpaid_balance: Math.max(0, availableBalance - numericAmount),
          pending_balance: pendingBalance + numericAmount
        })
        .eq('id', ambassadorId);

      if (updateError) throw updateError;

      alert('Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      setAmount('');

      if (onSuccessRefresh) onSuccessRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    if (!ambassadorId) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('ambassador_id', ambassadorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err: any) {
      console.error('History fetch error:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      fetchHistory();
    }
  }, [showHistoryModal]);

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#050505',
        border: '1px solid #1a1a1a',
        borderRadius: '16px',
        padding: '16px',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ১. হেডার (WALLET একদম বামে, HISTORY › একদম ডানে) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '14px',
          boxSizing: 'border-box'
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#888888',
            letterSpacing: '1.5px',
            textTransform: 'uppercase'
          }}
        >
          WALLET
        </span>
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888888',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            letterSpacing: '1px',
            padding: 0
          }}
        >
          HISTORY &rsaquo;
        </button>
      </div>

      {/* ২. Available Balance & Withdraw Button Card */}
      <div
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #1a1a1a',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '10px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ fontSize: '10px', color: '#888888', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '500', marginBottom: '8px' }}>
          AVAILABLE BALANCE
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '12px' }}>
          <span
            style={{
              fontSize: '22px',
              fontWeight: '700',
              color: '#ffffff',
              lineHeight: '1',
              whiteSpace: 'nowrap'
            }}
          >
            ৳{availableBalance.toLocaleString()}
          </span>

          <button
            type="button"
            onClick={() => setShowWithdrawModal(true)}
            disabled={availableBalance <= 0}
            style={{
              flexShrink: 0,
              backgroundColor: availableBalance > 0 ? '#ffffff' : '#1c1c1c',
              color: availableBalance > 0 ? '#000000' : '#555555',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap'
            }}
          >
            WITHDRAW
          </button>
        </div>
      </div>

      {/* ৩. Pending & Total Earned Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PENDING</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
            ৳{pendingBalance.toLocaleString()}
          </div>
        </div>
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', padding: '12px', borderRadius: '10px' }}>
          <div style={{ fontSize: '10px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL EARNED</div>
          <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}>
            ৳{totalEarned.toLocaleString()}
          </div>
        </div>
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              border: '1px solid #222222',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '380px',
              padding: '20px',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', margin: 0, color: '#ffffff', letterSpacing: '1px' }}>
                REQUEST WITHDRAWAL
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer', lineHeight: '1' }}
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div style={{ color: '#ef4444', fontSize: '11px', marginBottom: '12px', padding: '8px 10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                {errorMsg}
              </div>
            )}

            {!hasPayoutDetails ? (
              <div style={{ padding: '20px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px' }}>
                  No Payout Details Found
                </div>
                <p style={{ fontSize: '11px', color: '#aaaaaa', margin: 0, lineHeight: '1.5' }}>
                  Please set up your payment method and account number in Settings before requesting a withdrawal.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: '#111111', border: '1px solid #222222', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#888888' }}>METHOD</span>
                    <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 'bold' }}>{savedMethod}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '10px', color: '#888888' }}>ACCOUNT NUMBER</span>
                    <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 'bold' }}>{savedAccount}</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10px', color: '#888888', display: 'block', marginBottom: '6px' }}>
                    AMOUNT (Max: ৳{availableBalance.toLocaleString()})
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                    style={{
                      width: '100%',
                      backgroundColor: '#111111',
                      border: '1px solid #222222',
                      color: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    marginTop: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? 'SUBMITTING...' : 'CONFIRM WITHDRAWAL'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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
              border: '1px solid #222222',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '420px',
              padding: '20px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '13px', margin: 0, color: '#ffffff', letterSpacing: '1px' }}>
                PAYOUT HISTORY
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', color: '#888888', fontSize: '20px', cursor: 'pointer', lineHeight: '1' }}
              >
                &times;
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ fontSize: '11px', color: '#666666', textAlign: 'center', padding: '20px' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#666666', textAlign: 'center', padding: '20px' }}>No payout history found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#111111',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #1a1a1a',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff' }}>৳{item.amount.toLocaleString()}</div>
                      <div style={{ fontSize: '10px', color: '#888888', marginTop: '2px' }}>
                        {item.payout_method} ({item.account_number})
                      </div>
                      <div style={{ fontSize: '9px', color: '#555555', marginTop: '2px' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        backgroundColor:
                          item.status === 'PAID' ? '#064e3b' : item.status === 'REJECTED' ? '#4c0519' : '#451a03',
                        color:
                          item.status === 'PAID' ? '#34d399' : item.status === 'REJECTED' ? '#f87171' : '#fbbf24'
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
