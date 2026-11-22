import AmbassadorDashboard from '../../components/ambassador/dashboard/AmbassadorDashboard';
import { useAmbassador } from '../../hooks/useAmbassador';

export default function AmbassadorDashboardSection({
  ambassadorData,
  profile,
}: {
  ambassadorData: any;
  profile: any;
}) {
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
