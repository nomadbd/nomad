import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      // এখানে ইমেইল এবং নাম নিশ্চিত করা হয়েছে
      setProfile({ ...prof, email: user.email });
      setNewName(prof?.name || ''); 
    }
  };

  const handleUpdate = async () => {
    // ১. নাম আপডেট করার লজিক
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name: newName }) 
      .eq('id', profile.id);

    if (profileError) {
      alert("Error updating profile: " + profileError.message);
      return;
    }

    // ২. পাসওয়ার্ড আপডেট করার লজিক
    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) {
        alert("Error updating password: " + passwordError.message);
        return;
      }
    }

    alert("PROFILE UPDATED!");
    setView('profile');
    fetchUserData();
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ height: '60px' }}></div> 
      <div style={{ maxWidth: '400px', margin: 'auto' }}>
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ letterSpacing: '8px', fontWeight: '200', margin: 0 }}>PROFILE</h2>
              
<svg 
  onClick={() => setView('settings')} 
  width="24" 
  height="24" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="white" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round" 
  cursor="pointer"
>
  <circle cx="12" cy="12" r="3"></circle>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
</svg>


            </div>

            {/* নামের ক্ষেত্রে খালি থাকলে ফাঁকা দেখাবে */}
            <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>NAME</p>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>{profile?.name || ''}</p>
            
            <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>EMAIL</p>
            <p style={{ fontSize: '16px', marginBottom: '40px' }}>{profile?.email || ''}</p>
          </>
        ) : (
          <>
            <h3 style={{ fontWeight: '200', letterSpacing: '2px', fontSize: '14px', marginBottom: '30px' }}>SETTINGS</h3>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="NAME" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', marginBottom: '15px' }} />
            <input type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="NEW PASSWORD" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', marginBottom: '25px' }} />
            <button onClick={handleUpdate} style={{ width: '100%', padding: '12px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', marginBottom: '15px' }}>SAVE CHANGES</button>
            <button onClick={() => setView('profile')} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #333', color: '#fff', cursor: 'pointer' }}>BACK</button>
          </>
        )}
      </div>
    </div>
  );
}
