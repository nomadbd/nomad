import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        
        setProfile({ email: user.email, username: data?.username });
      }
      setLoading(false);
    };
    getProfile();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) return null;

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', minHeight: '100vh', color: '#ffffff', 
      fontFamily: 'sans-serif', backgroundColor: '#000000' 
    }}>
      <div style={{ textAlign: 'center', maxWidth: '300px', width: '100%' }}>
        <h2 style={{ letterSpacing: '8px', fontWeight: '200', marginBottom: '40px' }}>PROFILE</h2>
        
        <div style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#777', marginBottom: '5px' }}>USERNAME</p>
          <p style={{ fontSize: '16px', letterSpacing: '1px' }}>{profile?.username}</p>
        </div>

        <div style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '40px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '2px', color: '#777', marginBottom: '5px' }}>EMAIL</p>
          <p style={{ fontSize: '16px', letterSpacing: '1px' }}>{profile?.email}</p>
        </div>

        <button 
          onClick={handleSignOut}
          style={{ 
            backgroundColor: 'transparent', color: '#fff', border: '1px solid #fff', 
            padding: '10px 30px', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px',
            transition: '0.3s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#fff', e.currentTarget.style.color = '#000')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent', e.currentTarget.style.color = '#fff')}
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
