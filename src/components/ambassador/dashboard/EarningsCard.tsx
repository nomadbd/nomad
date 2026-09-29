import { useState, useEffect } from 'react';

export interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  method: string;
  accountNumber: string;
  status: 'PENDING' | 'PAID' | 'REJECTED';
}

interface EarningsCardProps {
  availableBalance?: number;
  pendingBalance?: number;
  totalEarned?: number;
  payoutHistory?: PayoutRecord[];
  onWithdrawClick?: () => void;
}

// নমুনা হিস্ট্রি ডাটা (যদি প্রপ্স থেকে না আসে)
const defaultHistory: PayoutRecord[] = [
  { id: '1', amount: 1500, date: '28 Sep 2026', method: 'bKash', accountNumber: '01712***890', status: 'PAID' },
  { id: '2', amount: 800, date: '20 Sep 2026', method: 'Nagad', accountNumber: '01812***123', status: 'PAID' },
  { id: '3', amount: 1000, date: '15 Sep 2026', method: 'bKash', accountNumber: '01712***890', status: 'PENDING' },
];

export default function EarningsCard({
  availableBalance = 2500,
  pendingBalance = 1200,
  totalEarned = 15000,
  payoutHistory = defaultHistory,
  onWithdrawClick
}: EarningsCardProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // ===== Viewport scroll/resize check for bottom sheet =====
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

  const getStatusStyle = (status: PayoutRecord['status']) => {
    switch (status) {
      case 'PAID':
        return { bg: '#0D2818', color: '#2ECC71', border: '#145A32', label: 'PAID' };
      case 'PENDING':
        return { bg: '#2A2100', color: '#F1C40F', border: '#5C4800', label: 'PENDING' };
      case 'REJECTED':
        return { bg: '#2A0808', color: '#E74C3C', border: '#5C1414', label: 'REJECTED' };
    }
  };

  return (
    <>
      {/* ===== MAIN EARNINGS CARD ===== */}
      <div style={{
        backgroundColor: '#111111',
        border: '1px solid #222222',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '20px',
        color: '#FFFFFF'
      }}>
        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '1.5px', color: '#888888' }}>
            EARNINGS & WALLET
          </span>
          <button
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
          borderBottom: '1px solid #1C1C1E',
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
            onClick={onWithdrawClick}
            disabled={availableBalance <= 0}
            style={{
              backgroundColor: availableBalance > 0 ? '#FFFFFF' : '#222222',
              color: availableBalance > 0 ? '#000000' : '#666666',
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
      {/* Backdrop */}
      <div
        onClick={() => setIsHistoryOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1100,
          opacity: isHistoryOpen ? 1 : 0,
          pointerEvents: isHistoryOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: keyboardOffset,
          zIndex: 1101,
          backgroundColor: '#111111',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          transform: isHistoryOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), bottom 0.25s ease',
          willChange: 'transform, bottom',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
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
          borderBottom: '1px solid #1C1C1E',
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', letterSpacing: '1.5px', color: '#FFFFFF' }}>
            PAYOUT HISTORY
          </h3>
          <button
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
          {payoutHistory.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666666', fontSize: '12px', padding: '30px 0' }}>
              No payout requests yet.
            </p>
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
                    borderBottom: '1px solid #1A1A1A'
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '600', color: '#FFFFFF' }}>
                      ৳{item.amount.toLocaleString()}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: '#777777' }}>
                      {item.method} ({item.accountNumber}) • {item.date}
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
