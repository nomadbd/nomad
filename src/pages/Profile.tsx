import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...prof, email: user.email });
      setNewName(prof?.name || '');
    }
  };

  const handleUpdate = async () => {
    // নাম আপডেট
    await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
    // পাসওয়ার্ড আপডেট
    if (newPassword) await supabase.auth.updateUser({ password: newPassword });
    
    alert("Profile Updated Successfully!");
    setView('profile');
    fetchUserData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* হেডার (প্রোফাইল মোডে থাকলে দেখাবে) */}
      {view === 'profile' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', position: 'relative', zIndex: 10 }}>
          <h2 style={{ letterSpacing: '8px', fontWeight: '200', margin: 0 }}>PROFILE</h2>
          <svg onClick={() => setView('settings')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" cursor="pointer">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </div>
      )}

      {/* সেটিংস ক্লোজ বাটন */}
      {view === 'settings' && (
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <span onClick={() => setView('profile')} style={{ cursor: 'pointer', letterSpacing: '2px', fontSize: '12px' }}>CLOSE</span>
        </div>
      )}

      {view === 'profile' ? (
        <div style={{ maxWidth: '400px', margin: 'auto' }}>
          <p style={{ fontSize: '10px', color: '#777' }}>NAME</p>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>{profile?.name || 'Set your name'}</p>
          <p style={{ fontSize: '10px', color: '#777' }}>EMAIL</p>
          <p style={{ fontSize: '16px', marginBottom: '40px' }}>{profile?.email}</p>
          
          {/* অর্ডার হিস্ট্রি সেকশন একই থাকবে... */}
        </div>
      ) : (
        <div style={{ maxWidth: '400px', margin: 'auto' }}>
          <h3 style={{ fontWeight: '200' }}>SETTINGS</h3>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New Name" style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: '#fff', marginBottom: '15px' }} />
          <input type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #444', color: '#fff', marginBottom: '20px' }} />
          
          <button onClick={handleUpdate} style={{ width: '100%', padding: '12px', background: '#fff', border: 'none', cursor: 'pointer', marginBottom: '20px' }}>SAVE CHANGES</button>
          <button onClick={handleSignOut} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #444', color: '#777', cursor: 'pointer' }}>SIGN OUT</button>
        </div>
      )}
    </div>
  );
}
