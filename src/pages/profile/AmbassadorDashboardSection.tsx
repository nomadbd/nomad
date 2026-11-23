import AmbassadorDashboard from '../../components/ambassador/dashboard/AmbassadorDashboard';
import { useAmbassador } from '../../components/ambassador/dashboard/useAmbassador';

interface AmbassadorDashboardSectionProps {
  ambassadorData: any;
  profile: any;
}

export default function AmbassadorDashboardSection({
  ambassadorData,
  profile,
}: AmbassadorDashboardSectionProps) {
  const ambassadorState = useAmbassador(ambassadorData);

  return (
    <div style={{ marginTop: '10px' }}>
      <AmbassadorDashboard
        ambassadorData={ambassadorData}
        profile={profile}
        isOwner
        ambassadorState={ambassadorState}
      />
    </div>
  );
}
