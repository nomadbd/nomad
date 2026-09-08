import React from 'react';

interface AmbassadorWorkspaceProps {
  ambassadorData: any;
  profile: any;
  ambassadorState: any;
}

export default function AmbassadorWorkspace({
  ambassadorData,
  profile,
  ambassadorState
}: AmbassadorWorkspaceProps) {
  const {
    slug,
    setSlug,
    isEditingSlug,
    setIsEditingSlug,
    slugMsg,
    savingSlug,
    unpaidBalance,
    totalEarned,
    payoutAmount,
    setPayoutAmount,
    payoutDetails,
    setPayoutDetails,
    payoutMsg,
    submittingPayout,
    payoutRequests,
    assignedProducts,
    handleSaveSlug,
    handleRequestPayout
  } = ambassadorState;

  const storeUrl = `${window.location.origin}/ref/${slug}`;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
      <header style={{ borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', margin: '0 0 4px 0' }}>
          Ambassador Workspace
        </h1>
        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
          Welcome back, {ambassadorData?.recipient_identifier || profile?.full_name || 'Partner'}
        </p>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>
          <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Unpaid Balance</span>
          <h2 style={{ fontSize: '28px', color: '#d4af37', margin: '8px 0 0 0' }}>৳{unpaidBalance}</h2>
        </div>

        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>
          <span style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Earned</span>
          <h2 style={{ fontSize: '28px', color: '#fff', margin: '8px 0 0 0' }}>৳{totalEarned}</h2>
        </div>
      </div>

      {/* Showcase Link */}
      <section style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '24px', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '15px', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Custom Showcase Link</h3>

        {isEditingSlug ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>{window.location.origin}/ref/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="your-custom-slug"
              style={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '8px 12px', borderRadius: '4px', fontSize: '14px', flex: '1', minWidth: '180px' }}
            />
            <button
              onClick={handleSaveSlug}
              disabled={savingSlug}
              style={{ backgroundColor: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {savingSlug ? 'Saving...' : 'Save Link'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <a href={storeUrl} target="_blank" rel="noreferrer" style={{ color: '#d4af37', textDecoration: 'underline', wordBreak: 'break-all', fontSize: '14px' }}>
              {storeUrl}
            </a>
            <button
              onClick={() => setIsEditingSlug(true)}
              style={{ backgroundColor: 'transparent', border: '1px solid #444', color: '#ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              Edit Link
            </button>
          </div>
        )}

        {slugMsg.text && (
          <p style={{ marginTop: '10px', fontSize: '12px', color: slugMsg.type === 'error' ? '#ff4d4d' : '#00ff88', margin: '10px 0 0 0' }}>
            {slugMsg.text}
          </p>
        )}
      </section>

      {/* Payout Section */}
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

        {/* History */}
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

      {/* Featured Products */}
      <section style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '24px' }}>
        <h3 style={{ fontSize: '15px', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Assigned Showcase Products</h3>
        {assignedProducts.length === 0 ? (
          <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>No products assigned by admin yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {assignedProducts.map((p: any) => (
              <div key={p.id} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '6px', padding: '12px' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 4px 0', color: '#fff' }}>{p.name}</h4>
                <p style={{ fontSize: '12px', color: '#d4af37', margin: 0 }}>৳{p.price}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
