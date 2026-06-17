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
      setProfile({ ...prof, email: user.email });
      setNewName(prof?.name || '');
    }
  };

  const handleUpdate = async () => {
    // শুধুমাত্র নাম আপডেট হবে
    const { error } = await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
    
    if (newPassword) await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      alert("Error updating profile");
    } else {
      alert("PROFILE UPDATED!");
      setView('profile');
      fetchUserData(); // ডাটা রিফ্রেশ করা যাতে সাথে সাথে নতুন নাম দেখা যায়
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      
      {/* মেইন কন্টেইনার */}
      <div style={{ maxWidth: '400px', margin: 'auto' }}>
        
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ letterSpacing: '8px', fontWeight: '200', margin: 0 }}>PROFILE</h2>
              <span onClick={() => setView('settings')} style={{ cursor: 'pointer', fontSize: '10px', color: '#777' }}>SETTINGS</span>
            </div>

            <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>NAME</p>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>{profile?.name || 'SET YOUR NAME'}</p>
            <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>EMAIL</p>
            <p style={{ fontSize: '16px', marginBottom: '40px' }}>{profile?.email}</p>
          </>
        ) : (
          <>
            <h3 style={{ fontWeight: '200', letterSpacing: '2px', fontSize: '14px', marginBottom: '30px' }}>SETTINGS</h3>
            
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="NEW NAME" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', marginBottom: '15px' }} />
            <input type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="NEW PASSWORD" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', marginBottom: '25px' }} />
            
            <button onClick={handleUpdate} style={{ width: '100%', padding: '12px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', marginBottom: '15px' }}>SAVE CHANGES</button>
            <button onClick={() => setView('profile')} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid #333', color: '#fff', cursor: 'pointer', marginBottom: '15px' }}>CANCEL</button>
            <button onClick={handleSignOut} style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: '#777', cursor: 'pointer', fontSize: '12px' }}>SIGN OUT</button>
          </>
        )}
      </div>
    </div>
  );
}
