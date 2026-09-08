import React from 'react';

interface PayoutFormProps {
  payoutAmount: string;
  setPayoutAmount: (val: string) => void;
  payoutDetails: string;
  setPayoutDetails: (val: string) => void;
  handleRequestPayout: (e: React.FormEvent) => void;
  submittingPayout: boolean;
  unpaidBalance: number;
  payoutMsg: { type: string; text: string };
  payoutRequests: any[];
}

export default function PayoutForm({
  payoutAmount,
  setPayoutAmount,
  payoutDetails,
  setPayoutDetails,
  handleRequestPayout,
  submittingPayout,
  unpaidBalance,
  payoutMsg,
  payoutRequests
}: PayoutFormProps) {
  return (
    <section style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '24px', marginBottom: '30px' }}>
      <h3 style={{ fontSize: '15px', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Request Commission Payout</h3>

      <form onSubmit={handleRequestPayout} style={{ display: 'grid', gap: '12px', maxWidth: '500px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Amount (BDT)</label>
          <input
            type="number"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            placeholder="e.g. 1000"
            style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Payment Details (bKash/Nagad/Bank Info)</label>
          <textarea
            value={payoutDetails}
            onChange={(e) => setPayoutDetails(e.target.value)}
            placeholder="bKash Personal: 017XXXXXXXX"
            rows={2}
            style={{ width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>

        <button
          type="submit"
          disabled={submittingPayout || unpaidBalance <= 0}
          style={{ backgroundColor: unpaidBalance > 0 ? '#d4af37' : '#333', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 'bold', cursor: unpaidBalance > 0 ? 'pointer' : 'not-allowed', marginTop: '4px' }}
        >
          {submittingPayout ? 'Submitting...' : 'Submit Payout Request'}
        </button>
      </form>

      {payoutMsg.text && (
        <p style={{ fontSize: '12px', color: payoutMsg.type === 'error' ? '#ff4d4d' : '#00ff88', marginTop: '12px', marginBottom: 0 }}>
          {payoutMsg.text}
        </p>
      )}

      {payoutRequests.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: '1px solid #222', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '13px', color: '#888', margin: '0 0 12px 0' }}>Payout History</h4>
          <div style={{ display: 'grid', gap: '8px' }}>
            {payoutRequests.map((req: any) => (
              <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '10px 14px', borderRadius: '4px', fontSize: '13px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>৳{req.amount}</span>
                  <span style={{ color: '#666', fontSize: '11px', marginLeft: '8px' }}>({req.payout_details})</span>
                </div>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', backgroundColor: req.status === 'PAID' ? '#003815' : req.status === 'REJECTED' ? '#380000' : '#332a00', color: req.status === 'PAID' ? '#00ff88' : req.status === 'REJECTED' ? '#ff4d4d' : '#ffcc00' }}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
