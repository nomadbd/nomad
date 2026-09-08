import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Ambassador from '../components/ambassador/Ambassador';

export default function AmbassadorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);

  useEffect(() => {
    checkAccessAndFetchData();
  }, []);

  const checkAccessAndFetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // ১. লগইন না থাকলে সরাসরি হোম পেজে পাঠিয়ে দেওয়া হবে
    if (!user) {
      navigate('/');
      return;
    }

    // ২. অ্যাম্বাসেডর টেবিল থেকে ডাটা চেক করা
    const { data: amb } = await supabase
      .from('ambassador')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // ৩. অ্যাম্বাসেডর না হলে বা এক্সেস না থাকলে হোম পেজে পাঠিয়ে দেওয়া হবে
    if (!amb) {
      navigate('/');
      return;
    }

    // প্রোফাইল ডাটা নিয়ে আসা
    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile({ ...prof, email: user.email });
    setAmbassadorData(amb);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#888', letterSpacing: '2px', fontSize: '12px' }}>VERIFYING ACCESS...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px' }}>
      <Ambassador ambassadorData={ambassadorData} profile={profile} />
    </div>
  );
}
