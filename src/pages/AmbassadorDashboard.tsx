import Ambassador from '../components/ambassador/Ambassador';

interface AmbassadorDashboardProps {
  ambassadorData: any;
  profile: any;
}

export default function AmbassadorDashboard({ ambassadorData, profile }: AmbassadorDashboardProps) {
  return (
    <div style={{ marginTop: '10px' }}>
      <Ambassador ambassadorData={ambassadorData} profile={profile} />
    </div>
  );
}
