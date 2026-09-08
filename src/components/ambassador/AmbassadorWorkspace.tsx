import React from 'react';
import AmbassadorStats from './stats/AmbassadorStats';
import SlugEditor from './slug/SlugEditor';
import PayoutForm from './payout/PayoutForm';
import AssignedProducts from './products/AssignedProducts';

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

      <AmbassadorStats 
        unpaidBalance={ambassadorState.unpaidBalance} 
        totalEarned={ambassadorState.totalEarned} 
      />

      <SlugEditor 
        slug={ambassadorState.slug}
        setSlug={ambassadorState.setSlug}
        isEditingSlug={ambassadorState.isEditingSlug}
        setIsEditingSlug={ambassadorState.setIsEditingSlug}
        handleSaveSlug={ambassadorState.handleSaveSlug}
        savingSlug={ambassadorState.savingSlug}
        slugMsg={ambassadorState.slugMsg}
      />

      <PayoutForm 
        payoutAmount={ambassadorState.payoutAmount}
        setPayoutAmount={ambassadorState.setPayoutAmount}
        payoutDetails={ambassadorState.payoutDetails}
        setPayoutDetails={ambassadorState.setPayoutDetails}
        handleRequestPayout={ambassadorState.handleRequestPayout}
        submittingPayout={ambassadorState.submittingPayout}
        unpaidBalance={ambassadorState.unpaidBalance}
        payoutMsg={ambassadorState.payoutMsg}
        payoutRequests={ambassadorState.payoutRequests}
      />

      <AssignedProducts 
        assignedProducts={ambassadorState.assignedProducts} 
      />
    </div>
  );
}
