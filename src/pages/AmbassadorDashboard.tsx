import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import Ambassador from '../components/ambassador/Ambassador';

export default function AmbassadorDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // ১. প্রোফাইল তথ্য লোড
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          // ২. অ্যাম্বাসেডর ডাটা লোড
          const { data: amb } = await supabase
            .from('ambassador')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          setProfile(prof ? { ...prof, email: user.email } : { email: user.email });
          setAmbassadorData(amb);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#030303',
    color: '#ffffff',
    padding: '20px',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  };

  // ১. লোডিং অবস্থা (সাদা/কালো ব্ল্যাঙ্ক স্ক্রিন আসবে না)
  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ letterSpacing: '2px', fontSize: '12px', color: '#888' }}>
          LOADING DASHBOARD...
        </p>
      </div>
    );
  }

  // ২. ইউজার যদি একটিভ অ্যাম্বাসেডর হয়
  if (ambassadorData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#030303', color: '#fff', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <Ambassador ambassadorData={ambassadorData} profile={profile} />
        </div>
      </div>
    );
  }

  // ৩. অ্যাম্বাসেডর ডাটা না থাকলে ফলব্যাক কার্ড (যাতে পেজ ফাঁকা না দেখায়)
  return (
    <div style={containerStyle}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: '#0a0a0a',
        border: '1px solid #222',
        padding: '28px',
        borderRadius: '8px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '10px', color: '#ff4d4d', letterSpacing: '2px', marginBottom: '8px' }}>
          ACCESS RESTRICTED
        </div>
        <h3 style={{ fontSize: '18px', margin: '0 0 12px 0', fontWeight: '500', color: '#fff' }}>
          NOT AN AMBASSADOR
        </h3>
        <p style={{ fontSize: '13px', color: '#888', margin: 0, lineHeight: '1.5' }}>
          You do not have an active Ambassador account. Please use your exclusive invitation link to join.
        </p>
      </div>
    </div>
  );
}
