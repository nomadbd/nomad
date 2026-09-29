import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

export interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  accountNumber: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
}

interface EarningsCardProps {
  ambassadorId?: string;
  availableBalance?: number;
  pendingBalance?: number;
  totalEarned?: number;
  onWithdrawClick?: () => void;
}

export default function EarningsCard({
  ambassadorId,
  availableBalance = 0,
  pendingBalance = 0,
  totalEarned = 0,
  onWithdrawClick
}: EarningsCardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // ===== Visual Viewport Effect =====
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(offset);
    };

    vv.addEventListener('resize', update, { passive: true });
    vv.addEventListener('scroll', update, { passive: true });

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // ===== Real Supabase Fetch for Payout History =====
  const fetchPayoutHistory = async () => {
    if (!ambassadorId) return;

    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('payout_requests') // আপনার টেবিল নাম payouts বা payout_requests অনুযায়ী মিলায় নিন
        .select('*')
        .eq('ambassador_id', ambassadorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted: PayoutRecord[] = data.map((item: any) => ({
          id: item.id,
          amount: item.amount || 0,
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '',
          method: item.method || item.payment_method || 'bKash',
          accountNumber: item.account_number || item.account_no || 'N/A',
          status: (item.status?.toUpperCase() as PayoutRecord['status']) || 'PENDING',
        }));
        setPayoutHistory(formatted);
      }
    } catch (err: any) {
      console.error('Error fetching payout history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // হিস্ট্রি ওপেন হলে ডাটা ফেচ হবে
  useEffect(() => {
    if (isHistoryOpen && ambassadorId) {
      fetchPayoutHistory();
    }
  }, [isHistoryOpen, ambassadorId]);

  const getStatusStyle = (status: PayoutRecord['status']) => {
    switch (status) {
      case 'PAID':
        return { bg: '#0D2818', color: '#2ECC71', border: '#145A32', label: 'PAID' };
      case 'PENDING':
        return { bg: '#2A2100', color: '#F1C40F', border: '#5C4800', label: 'PENDING' };
      case 'REJECTED':
        return { bg: '#2A0808', color: '#E74C3C', border: '#5C1414', label: 'REJECTED' };
      default:
        return { bg: '#2A2100', color: '#F1C40F', border: '#5C4800', label: 'PENDING' };
    }
  };

  return (
    <>
      {/* ===== MAIN EARNINGS CARD ===== */}
      <div style={{
        backgroundColor: '#050505',
        border: '1px solid #1a1a1a',
        borderRadius: '12px',
        padding: '20px',
        color: '#FFFFFF',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', color: '#888888' }}>
            EARNINGS & WALLET
          </span>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '1px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: 0.8
            }}
          >
            HISTORY <span style={{ color: '#888888' }}>›</span>
          </button>
        </div>

        {/* Available Balance & Withdraw Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingBottom: '20px',
          borderBottom: '1px solid #1A1A1A',
          marginBottom: '16px'
        }}>
          <div>
            <p style={{ fontSize: '10px', color: '#AAAAAA', margin: '0 0 4px 0', letterSpacing: '0.5px' }}>
              AVAILABLE BALANCE
            </p>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, letterSpacing: '-0.5px' }}>
              ৳{availableBalance.toLocaleString()}
            </h1>
          </div>

          <button
            type="button"
            onClick={onWithdrawClick}
            disabled={availableBalance <= 0}
            style={{
              backgroundColor: availableBalance > 0 ? '#FFFFFF' : '#1A1A1A',
              color: availableBalance > 0 ? '#000000' : '#555555',
              border: 'none',
              borderRadius: '20px',
              padding: '10px 20px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '1px',
              cursor: availableBalance > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            WITHDRAW
          </button>
        </div>

        {/* Sub Stats: Pending & Total Earned */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '10px', color: '#888888', margin: '0 0 2px 0', letterSpacing: '0.5px' }}>
              PENDING
            </p>
            <p style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
              ৳{pendingBalance.toLocaleString()}
            </p>
          </div>

          <div>
            <p style={{ fontSize: '10px', color: '#888888', margin: '0 0 2px 0', letterSpacing: '0.5px' }}>
              TOTAL EARNED
            </p>
            <p style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>
              ৳{totalEarned.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ===== PAYOUT HISTORY BOTTOM SHEET ===== */}
      <div
        onClick={() => setIsHistoryOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          zIndex: 1100,
          opacity: isHistoryOpen ? 1 : 0,
          pointerEvents: isHistoryOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: keyboardOffset,
          zIndex: 1101,
          backgroundColor: '#0A0A0A',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          borderTop: '1px solid #222222',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          transform: isHistoryOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), bottom 0.25s ease',
          willChange: 'transform, bottom',
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: '36px',
          height: '4px',
          backgroundColor: '#333333',
          borderRadius: '2px',
          margin: '12px auto 8px',
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 20px 16px',
          borderBottom: '1px solid #1A1A1A',
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '600', letterSpacing: '1.5px', color: '#FFFFFF' }}>
            PAYOUT HISTORY
          </h3>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888888',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* List Content */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', color: '#666666', fontSize: '11px', padding: '30px 0' }}>
              LOADING HISTORY...
            </div>
          ) : payoutHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666666', fontSize: '11px', padding: '30px 0' }}>
              NO PAYOUT REQUESTS FOUND.
            </div>
          ) : (
            payoutHistory.map((item) => {
              const statusStyle = getStatusStyle(item.status);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #141414'
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
                      ৳{item.amount.toLocaleString()}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#777777' }}>
                      {item.method} ({item.accountNumber}) {item.date ? `• ${item.date}` : ''}
                    </p>
                  </div>

                  <span style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    letterSpacing: '0.8px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                    border: `1px solid ${statusStyle.border}`
                  }}>
                    {statusStyle.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
