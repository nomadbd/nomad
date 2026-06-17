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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("ARE YOU SURE? This action cannot be undone.")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // ১. প্রোফাইল টেবিল থেকে ডাটা ডিলিট
        await supabase.from('profiles').delete().eq('id', user.id);
        // ২. ইউজার ডিলিট (নোট: Supabase-এ ইউজার ডিলিট করার জন্য Admin API প্রয়োজন হতে পারে, এটি ক্লায়েন্ট সাইড লজিক)
        const { error } = await supabase.auth.admin?.deleteUser(user.id) || await supabase.auth.signOut();
        window.location.href = '/';
      }
    }
  };

  const handleUpdate = async () => {
    const { error: profileError } = await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
    if (profileError) { alert("Error: " + profileError.message); return; }
    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) { alert("Error: " + passwordError.message); return; }
    }
    alert("PROFILE UPDATED!");
    setView('profile');
    fetchUserData();
  };

  // প্রিমিয়াম মিনিমাল স্টাইল
  const inputStyle = { width: '100%', padding: '14px', background: '#0a0a0a', border: '1px solid #222', color: '#fff', marginBottom: '15px', outline: 'none', borderRadius: '4px' };
  const primaryButtonStyle = { width: '100%', padding: '14px', background: '#fff', color: '#000', border: 'none', cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold' };
  const secondaryButtonStyle = { width: '100%', padding: '14px', background: 'transparent', border: '1px solid #333', color: '#fff', cursor: 'pointer', marginBottom: '15px' };
  const dangerButtonStyle = { width: '100%', padding: '14px', background: 'transparent', border: '1px solid #550000', color: '#ff4444', cursor: 'pointer', marginTop: '40px', fontSize: '12px', letterSpacing: '1px' };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ height: '60px' }}></div> 
      <div style={{ maxWidth: '400px', margin: 'auto' }}>
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ letterSpacing: '8px', fontWeight: '200', margin: 0 }}>PROFILE</h2>
              <svg onClick={() => setView('settings')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" cursor="pointer"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15..."></path></svg>
            </div>
            <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>NAME</p>
            <p style={{ fontSize: '16px', marginBottom: '20px' }}>{profile?.name || ''}</p>
            <p style={{ fontSize: '10px', color: '#777', margin: '0 0 5px 0' }}>EMAIL</p>
            <p style={{ fontSize: '16px', marginBottom: '40px' }}>{profile?.email || ''}</p>
          </>
        ) : (
          <>
            <h3 style={{ fontWeight: '200', letterSpacing: '2px', fontSize: '14px', marginBottom: '30px' }}>SETTINGS</h3>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="NAME" style={inputStyle} />
            <input type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="NEW PASSWORD" style={inputStyle} />
            <button onClick={handleUpdate} style={primaryButtonStyle}>SAVE CHANGES</button>
            <button onClick={() => setView('profile')} style={secondaryButtonStyle}>BACK</button>
            <button onClick={handleSignOut} style={secondaryButtonStyle}>SIGN OUT</button>
            
            {/* প্রিমিয়াম ডিজাইনে ডিলিট বাটন নিচে আলাদা রাখা হয়েছে */}
            <button onClick={handleDeleteAccount} style={dangerButtonStyle}>DELETE ACCOUNT</button>
          </>
        )}
      </div>
    </div>
  );
}
