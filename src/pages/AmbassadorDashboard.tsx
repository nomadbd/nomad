import Ambassador from '../components/ambassador/Ambassador';

interface AmbassadorDashboardProps {
  profile?: any;
  ambassadorData?: any;
}

export default function AmbassadorDashboard({ profile, ambassadorData }: AmbassadorDashboardProps) {
  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px' }}>
      <Ambassador profile={profile} ambassadorData={ambassadorData} />
    </div>
  );
}
