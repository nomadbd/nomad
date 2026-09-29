import React, { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface EarningsCardProps {
  ambassadorId: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  payoutDetails?: string; // ডাটাবেজের payout_details কলামের ডাটা
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
  // Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Form States
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<string>('bKash');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasSavedDetails, setHasSavedDetails] = useState<boolean>(false);

  // History States
  const [history, setHistory] = useState<PayoutRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Auto-fill and parse payoutDetails when modal opens or payoutDetails changes
  useEffect(() => {
    if (payoutDetails && payoutDetails.trim() !== '') {
      setHasSavedDetails(true);
      if (payoutDetails.includes(':')) {
        const parts = payoutDetails.split(':');
        const savedMethod = parts[0]?.trim();
        const savedAccount = parts[1]?.trim();
        if (savedMethod) setMethod(savedMethod);
        if (savedAccount) setAccountNumber(savedAccount);
      } else {
        setAccountNumber(payoutDetails.trim());
      }
    } else {
      setHasSavedDetails(false);
    }
  }, [payoutDetails, showWithdrawModal]);

  // Submit Payout Request
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন।');
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
      // 1. Insert request into payout_requests table
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

      // 2. Format new payout_details string to keep DB synced
      const formattedPayoutDetails = `${method}: ${accountNumber.trim()}`;

      // 3. Update ambassador table (unpaid_balance & pending_balance & payout_details)
      const { error: updateError } = await supabase
        .from('ambassador')
        .update({
          unpaid_balance: Math.max(0, availableBalance - numericAmount),
          pending_balance: pendingBalance + numericAmount,
          payout_details: formattedPayoutDetails
        })
        .eq('id', ambassadorId);

      if (updateError) throw updateError;

      alert('উইথড্র রিকোয়েস্ট সফলভাবে পাঠানো হয়েছে!');
      setShowWithdrawModal(false);
      setAmount('');

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
    <div
      style={{
        backgroundColor: '#0a0a0c',
        border: '1px solid #1e1e24',
        borderRadius: '12px',
        padding: '24px',
        color: '#ffffff',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#a1a1aa', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            EARNINGS & WALLET
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowHistoryModal(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid #27272a',
            borderRadius: '6px',
            color: '#d4d4d8',
            fontSize: '11px',
            fontWeight: '600',
            padding: '6px 12px',
            cursor: 'pointer',
            letterSpacing: '0.5px',
            transition: 'all 0.2s ease'
          }}
        >
          HISTORY &rsaquo;
        </button>
      </div>

      {/* Main Balance & Withdraw Button */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          padding: '20px',
          backgroundColor: '#000000',
          border: '1px solid #1e1e24',
          borderRadius: '10px',
          marginBottom: '16px'
        }}
      >
        <div>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
            AVAILABLE BALANCE
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginTop: '4px', tracking: '-0.5px' }}>
            ৳{availableBalance.toLocaleString()}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowWithdrawModal(true)}
          disabled={availableBalance <= 0}
          style={{
            background: availableBalance > 0 ? 'linear-gradient(135deg, #ffffff 0%, #e4e4e7 100%)' : '#18181b',
            color: availableBalance > 0 ? '#000000' : '#52525b',
            border: availableBalance > 0 ? '1px solid #ffffff' : '1px solid #27272a',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '800',
            letterSpacing: '1px',
            cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
            boxShadow: availableBalance > 0 ? '0 4px 14px rgba(255, 255, 255, 0.15)' : 'none',
            transition: 'transform 0.1s ease, box-shadow 0.2s ease'
          }}
        >
          WITHDRAW
        </button>
      </div>

      {/* Pending & Total Earned */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ backgroundColor: '#121215', border: '1px solid #1e1e24', padding: '14px 16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PENDING</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b', marginTop: '4px' }}>৳{pendingBalance.toLocaleString()}</div>
        </div>
        <div style={{ backgroundColor: '#121215', border: '1px solid #1e1e24', padding: '14px 16px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TOTAL EARNED</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', marginTop: '4px' }}>৳{totalEarned.toLocaleString()}</div>
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
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid #27272a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#fff', letterSpacing: '0.5px' }}>
                  REQUEST WITHDRAWAL
                </h3>
                <p style={{ fontSize: '11px', color: '#71717a', margin: '2px 0 0 0' }}>
                  আপনার অর্জিত ব্যালেন্স উত্তোলনের আবেদন করুন
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* Saved Method Status Banner */}
            {hasSavedDetails ? (
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>
                <span style={{ fontSize: '11px', color: '#34d399' }}>
                  সেভ করা পেমেন্ট তথ্য অটো-ফিল করা হয়েছে। প্রয়োজনে পরিবর্তন করতে পারেন।
                </span>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '600' }}>⚠️ পেমেন্ট নাম্বার সেট করা নেই!</div>
                <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px' }}>
                  নিচে নম্বর প্রদান করুন। উইথড্র সম্পন্ন হলে এটি পরবর্তীতে অটো-সেভ হয়ে থাকবে।
                </div>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: '12px',
                  padding: '10px',
                  borderRadius: '6px',
                  marginBottom: '14px'
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: '#a1a1aa', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  PAYMENT METHOD
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="bKash">bKash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ)</option>
                  <option value="Rocket">Rocket (রকেট)</option>
                  <option value="Bank">Bank Account (ব্যাংক অ্যাকাউন্ট)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '10px', fontWeight: '700', color: '#a1a1aa', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  ACCOUNT NUMBER
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01700000000"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: '700', color: '#a1a1aa', letterSpacing: '0.5px' }}>WITHDRAW AMOUNT</label>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '600' }}>Max: ৳{availableBalance}</span>
                </div>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    backgroundColor: '#18181b',
                    border: '1px solid #27272a',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
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
                  padding: '14px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  marginTop: '8px',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s ease'
                }}
              >
                {loading ? 'SUBMITTING...' : 'CONFIRM WITHDRAWAL'}
              </button>
            </form>
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
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0c0c0e',
              border: '1px solid #27272a',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#fff', letterSpacing: '0.5px' }}>
                  PAYOUT HISTORY
                </h3>
                <p style={{ fontSize: '11px', color: '#71717a', margin: '2px 0 0 0' }}>আপনার পূর্ববর্তী পেমেন্ট আবেদনের তালিকা</p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ fontSize: '12px', color: '#71717a', textAlign: 'center', padding: '30px' }}>Loading history...</div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#71717a', textAlign: 'center', padding: '30px', border: '1px dashed #27272a', borderRadius: '8px' }}>
                কোনো পূর্ববর্তী উইথড্রল আবেদন পাওয়া যায়নি।
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: '#141417',
                      padding: '14px',
                      borderRadius: '8px',
                      border: '1px solid #27272a',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff' }}>৳{item.amount.toLocaleString()}</div>
                      <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>
                        {item.payout_method} &bull; <span style={{ color: '#d4d4d8' }}>{item.account_number}</span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#71717a', marginTop: '4px' }}>
                        {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontWeight: '700',
                        letterSpacing: '0.5px',
                        backgroundColor:
                          item.status === 'PAID'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : item.status === 'REJECTED'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                        color:
                          item.status === 'PAID'
                            ? '#34d399'
                            : item.status === 'REJECTED'
                            ? '#f87171'
                            : '#fbbf24',
                        border:
                          item.status === 'PAID'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : item.status === 'REJECTED'
                            ? '1px solid rgba(239, 68, 68, 0.3)'
                            : '1px solid rgba(245, 158, 11, 0.3)'
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
