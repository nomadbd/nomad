import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Ambassador from '../components/ambassador/Ambassador';
import AmbassadorJoin from '../components/ambassador/AmbassadorJoin';

export default function AmbassadorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);

  useEffect(() => {
    fetchAmbassadorData();
  }, []);

  const fetchAmbassadorData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate('/login');
      return;
    }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile({ ...prof, email: user.email });

    const { data: amb } = await supabase
      .from('ambassador')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setAmbassadorData(amb);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#888', letterSpacing: '2px', fontSize: '12px' }}>LOADING PORTAL...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      {ambassadorData ? (
        <Ambassador ambassadorData={ambassadorData} profile={profile} />
      ) : (
        <AmbassadorJoin profile={profile} onJoined={fetchAmbassadorData} />
      )}
    </div>
  );
}
