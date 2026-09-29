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
  const [showHistoryBottomSheet, setShowHistoryBottomSheet] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

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

  const openBottomSheet = () => {
    setIsAnimatingOut(false);
    setShowHistoryBottomSheet(true);
  };

  const closeBottomSheet = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShowHistoryBottomSheet(false);
      setIsAnimatingOut(false);
    }, 240);
  };

  useEffect(() => {
    if (showHistoryBottomSheet && !isAnimatingOut) {
      fetchHistory();
    }
  }, [showHistoryBottomSheet]);

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
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* CSS Animations */}
      <style>{`
        @keyframes iosSlideUp {
          from { transform: translate3d(0, 100%, 0); }
          to { transform: translate3d(0, 0, 0); }
        }
        @keyframes iosSlideDown {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(0, 100%, 0); }
        }
        @keyframes iosFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes iosFadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes skeletonPulse {
          0% { opacity: 0.25; }
          50% { opacity: 0.6; }
          100% { opacity: 0.25; }
        }
        .apple-sheet-enter {
          animation: iosSlideUp 0.32s cubic-bezier(0.32, 0.72, 0, 1) forwards;
          will-change: transform;
        }
        .apple-sheet-exit {
          animation: iosSlideDown 0.24s cubic-bezier(0.32, 0.72, 0, 1) forwards;
          will-change: transform;
        }
        .apple-backdrop-enter {
          animation: iosFadeIn 0.25s ease-out forwards;
        }
        .apple-backdrop-exit {
          animation: iosFadeOut 0.24s ease-in forwards;
        }
        .skeleton-pulse {
          animation: skeletonPulse 1.4s infinite ease-in-out;
          background-color: #1e1e1e;
          border-radius: 6px;
        }
      `}</style>

      {/* ১. হেডার রো (WALLET বামে, HISTORY ডানে) */}
      <div
        style={{
          display: 'flex',
          justify: 'space-between',
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
          onClick={openBottomSheet}
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

      {/* ২. Available Balance & Withdraw Button Box */}
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

      {/* ৩. Pending & Total Earned Box */}
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

      {/* PAYOUT HISTORY BOTTOM SHEET */}
      {showHistoryBottomSheet && (
        <div
          onClick={closeBottomSheet}
          className={isAnimatingOut ? 'apple-backdrop-exit' : 'apple-backdrop-enter'}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justify: 'center'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={isAnimatingOut ? 'apple-sheet-exit' : 'apple-sheet-enter'}
            style={{
              backgroundColor: '#0d0d0d',
              borderTop: '1px solid #222222',
              borderLeft: '1px solid #222222',
              borderRight: '1px solid #222222',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              width: '100%',
              maxWidth: '500px',
              height: '70vh',
              maxHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              padding: '12px 20px 20px 20px',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.9)',
              transform: 'translate3d(0, 0, 0)'
            }}
          >
            {/* Drag Bar Handle */}
            <div
              onClick={closeBottomSheet}
              style={{
                width: '100%',
                display: 'flex',
                justify: 'center',
                padding: '4px 0 14px 0',
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '5px',
                  backgroundColor: '#333333',
                  borderRadius: '10px'
                }}
              />
            </div>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
              <h3 style={{ fontSize: '13px', margin: 0, color: '#ffffff', letterSpacing: '1px', fontWeight: '700' }}>
                PAYOUT HISTORY
              </h3>
              <button
                onClick={closeBottomSheet}
                style={{
                  background: '#1a1a1a',
                  border: 'none',
                  color: '#888888',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Container */}
            <div
              style={{
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                flex: 1,
                paddingRight: '2px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {loadingHistory ? (
                <>
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      style={{
                        backgroundColor: '#111111',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid #1a1a1a',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        height: '84px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton-pulse" style={{ height: '16px', width: '30%' }} />
                        <div className="skeleton-pulse" style={{ height: '18px', width: '20%' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton-pulse" style={{ height: '12px', width: '40%' }} />
                        <div className="skeleton-pulse" style={{ height: '12px', width: '20%' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div className="skeleton-pulse" style={{ height: '10px', width: '25%' }} />
                        <div className="skeleton-pulse" style={{ height: '10px', width: '20%' }} />
                      </div>
                    </div>
                  ))}
                </>
              ) : history.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#666666', textAlign: 'center', padding: '60px 0' }}>
                  No payout history found.
                </div>
              ) : (
                history.map((item) => {
                  const dateObj = new Date(item.created_at);
                  const year = dateObj.getFullYear();
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const day = String(dateObj.getDate()).padStart(2, '0');
                  const formattedDate = `${year}/${month}/${day}`;

                  const formattedTime = dateObj.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#111111',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: '1px solid #1a1a1a',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        flexShrink: 0
                      }}
                    >
                      {/* ১. টাকার পরিমাণ (বামে) এবং স্ট্যাটাস (ডানে) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
                          ৳{item.amount.toLocaleString()}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            backgroundColor:
                              item.status === 'PAID'
                                ? 'rgba(52, 211, 153, 0.1)'
                                : item.status === 'REJECTED'
                                ? 'rgba(248, 113, 113, 0.1)'
                                : 'rgba(251, 191, 36, 0.1)',
                            color:
                              item.status === 'PAID'
                                ? '#34d399'
                                : item.status === 'REJECTED'
                                ? '#f87171'
                                : '#fbbf24',
                            border: `1px solid ${
                              item.status === 'PAID'
                                ? 'rgba(52, 211, 153, 0.2)'
                                : item.status === 'REJECTED'
                                ? 'rgba(248, 113, 113, 0.2)'
                                : 'rgba(251, 191, 36, 0.2)'
                            }`
                          }}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* ২. নাম্বার/কার্ড/মোবাইল (বামে) এবং মাধ্যম (ডানে) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span style={{ color: '#cccccc', fontFamily: 'monospace', fontSize: '11px' }}>{item.account_number}</span>
                        <span style={{ color: '#aaaaaa', fontWeight: '500' }}>{item.payout_method}</span>
                      </div>

                      {/* ৩. তারিখ (বামে) এবং সময় (ডানে) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#666666' }}>
                        <span>{formattedDate}</span>
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
