import React from 'react';
import { useAmbassador } from '../hooks/useAmbassador';
import AmbassadorWorkspace from '../components/ambassador/AmbassadorWorkspace';

interface AmbassadorDashboardProps {
  ambassadorData: any;
  profile: any;
}

export default function AmbassadorDashboard({ ambassadorData, profile }: AmbassadorDashboardProps) {
  const ambassadorState = useAmbassador(ambassadorData);

  return (
    <div style={{ marginTop: '10px' }}>
      <AmbassadorWorkspace 
        ambassadorData={ambassadorData} 
        profile={profile} 
        ambassadorState={ambassadorState} 
      />
    </div>
  );
}
