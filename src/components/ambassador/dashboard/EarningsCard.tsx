import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface EarningsCardProps {
  ambassadorId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
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
  onSuccessRefresh
}: EarningsCardProps) {
  // Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form States
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<string>('bKash');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // History States
  const [history, setHistory] = useState<PayoutRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Submit Payout Request
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('অন অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।');
      return;
    }

    if (numericAmount > availableBalance) {
      setErrorMsg('আপনার অ্যাভেলেবল ব্যালেন্সের চেয়ে বেশি টাকা উইথড্র করতে পারবেন না।');
      return;
    }

    if (!accountNumber.trim()) {
      setErrorMsg('পেমেন্ট অ্যাকাউন্ট নম্বরটি লিখুন।');
      return;
    }

    setLoading(true);

    try {
      // 1. payout_requests টেবিলে রিকোয়েস্ট ইনসার্ট করা
      const { error: insertError } = await supabase
        .from('payout_requests')
        .insert([
          {
            ambassador_id: ambassadorId,
            amount: numericAmount,
            payout_method: method,
            account_number: accountNumber.trim(),
            status: 'PENDING'
          }
        ]);

      if (insertError) throw insertError;

      // 2. ambassador টেবিলে available_balance কমানো ও pending_balance বাড়ানো
      const { error: updateError } = await supabase
        .from('ambassador')
        .update({
          available_balance: availableBalance - numericAmount,
          pending_balance: pendingBalance + numericAmount
        })
        .eq('id', ambassadorId);

      if (updateError) throw updateError;

      alert('উইথড্র রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!');
      setShowWithdrawModal(false);
      setAmount('');
      setAccountNumber('');

      if (onSuccessRefresh) onSuccessRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'উইথড্র রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Payout History
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
    <div style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '8px', color: '#fff' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '11px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>
          EARNINGS & WALLET
        </span>
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '11px', cursor: 'pointer', letterSpacing: '1px' }}
        >
          HISTORY &rsaquo;
        </button>
      </div>

      {/* Main Balance & Withdraw Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #111' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>AVAILABLE BALANCE</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>৳{availableBalance}</div>
        </div>

        <button
          type="button"
          onClick={() => setShowWithdrawModal(true)}
          disabled={availableBalance <= 0}
          style={{
            backgroundColor: availableBalance > 0 ? '#ffffff' : '#1a1a1a',
            color: availableBalance > 0 ? '#000000' : '#555555',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: availableBalance > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          WITHDRAW
        </button>
      </div>

      {/* Pending & Total Earned */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <div>
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>PENDING</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#eab308', marginTop: '2px' }}>৳{pendingBalance}</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>TOTAL EARNED</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#34d399', marginTop: '2px' }}>৳{totalEarned}</div>
        </div>
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', width: '100%', maxWidth: '400px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: '#fff' }}>REQUEST WITHDRAWAL</h3>
              <button onClick={() => setShowWithdrawModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' }}>&times;</button>
            </div>

            {errorMsg && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px' }}>{errorMsg}</div>}

            <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>METHOD</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#111', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px' }}
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Bank">Bank Account</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>ACCOUNT NUMBER</label>
                <input
                  type="text"
                  placeholder="e.g. 01700000000"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#111', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: '#888', display: 'block', marginBottom: '4px' }}>AMOUNT (Max: ৳{availableBalance})</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', backgroundColor: '#111', border: '1px solid #222', color: '#fff', padding: '10px', borderRadius: '4px', fontSize: '12px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', marginTop: '8px', cursor: 'pointer' }}
              >
                {loading ? 'SUBMITTING...' : 'CONFIRM WITHDRAWAL'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', width: '100%', maxWidth: '450px', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', margin: 0, color: '#fff' }}>PAYOUT HISTORY</h3>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '18px', cursor: 'pointer' }}>&times;</button>
            </div>

            {loadingHistory ? (
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '20px' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', padding: '20px' }}>No payout history found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map((item) => (
                  <div key={item.id} style={{ backgroundColor: '#111', padding: '12px', borderRadius: '6px', border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>৳{item.amount}</div>
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{item.payout_method} ({item.account_number})</div>
                      <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      backgroundColor: item.status === 'PAID' ? '#064e3b' : item.status === 'REJECTED' ? '#4c0519' : '#451a03',
                      color: item.status === 'PAID' ? '#34d399' : item.status === 'REJECTED' ? '#f87171' : '#fbbf24'
                    }}>
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
