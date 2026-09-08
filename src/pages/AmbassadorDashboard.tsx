import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Ambassador from '../components/ambassador/Ambassador';

export default function AmbassadorDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const { data: amb } = await supabase
          .from('ambassador')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setProfile({ ...prof, email: user.email });
        setAmbassadorData(amb);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#888', letterSpacing: '2px', fontSize: '12px' }}>LOADING...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px' }}>
      <Ambassador ambassadorData={ambassadorData} profile={profile} />
    </div>
  );
}
