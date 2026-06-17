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

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  const handleDeleteAccount = async () => {
    if (window.confirm("ARE YOU SURE? THIS ACTION CANNOT BE UNDONE.")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    }
  };

  const handleUpdate = async () => {
    const { error: profileError } = await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
    if (profileError) { alert("Error: " + profileError.message); return; }
    if (newPassword) await supabase.auth.updateUser({ password: newPassword });
    alert("PROFILE UPDATED!");
    setView('profile');
    fetchUserData();
  };

  // প্রিমিয়াম স্টাইলস
  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #1a1a1a', color: '#fff', marginBottom: '30px', outline: 'none', fontSize: '16px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '20px', fontSize: '13px', letterSpacing: '2px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0', transition: '0.3s' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#333', cursor: 'pointer', marginTop: '80px', fontSize: '10px', letterSpacing: '3px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left' };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '60px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '400px', margin: 'auto' }}>
        
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '80px' }}>
              <h2 style={{ letterSpacing: '6px', fontWeight: '100', fontSize: '20px', margin: 0 }}>PROFILE</h2>
              <div onClick={() => setView('settings')} style={{ cursor: 'pointer', color: '#444', fontSize: '12px', letterSpacing: '2px' }}>SETTINGS</div>
            </div>

            <div style={{ marginBottom: '50px' }}>
              <p style={{ fontSize: '9px', color: '#333', letterSpacing: '3px', marginBottom: '15px' }}>NAME</p>
              <p style={{ fontSize: '18px', fontWeight: '200' }}>{profile?.name || 'No name'}</p>
            </div>

            <div>
              <p style={{ fontSize: '9px', color: '#333', letterSpacing: '3px', marginBottom: '15px' }}>EMAIL</p>
              <p style={{ fontSize: '18px', fontWeight: '200' }}>{profile?.email || ''}</p>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontWeight: '100', letterSpacing: '6px', fontSize: '20px', marginBottom: '80px' }}>SETTINGS</h2>
            
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="NAME" style={inputStyle} onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'} onBlur={(e) => e.target.style.borderBottom = '1px solid #1a1a1a'} />
            <input type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="NEW PASSWORD" style={inputStyle} onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'} onBlur={(e) => e.target.style.borderBottom = '1px solid #1a1a1a'} />
            
            <div style={{ marginTop: '40px' }}>
              <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
              <button onClick={() => setView('profile')} style={navButtonStyle}>BACK</button>
              <button onClick={handleSignOut} style={navButtonStyle}>SIGN OUT</button>
            </div>
            
            <button onClick={handleDeleteAccount} style={dangerButtonStyle} onMouseOver={(e) => e.currentTarget.style.color = '#770000'} onMouseOut={(e) => e.currentTarget.style.color = '#333'}>DELETE ACCOUNT</button>
          </>
        )}
      </div>
    </div>
  );
}
