import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => { fetchUserData(); }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...prof, email: user.email });
      setNewName(prof?.name || '');
      setNewEmail(user.email || '');
    }
  };

  const handleUpdate = async () => {
    // নাম আপডেট
    const { error: profileError } = await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
    
    // ইমেইল আপডেট
    if (newEmail !== profile.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
      if (emailError) { alert("Email Update Error: " + emailError.message); return; }
      else { alert("A confirmation link has been sent to your new email."); }
    }

    // পাসওয়ার্ড আপডেট
    if (newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) { alert("Password Update Error: " + passwordError.message); return; }
    }

    if (!profileError) {
      alert("PROFILE UPDATED SUCCESSFULLY!");
      setView('profile');
      fetchUserData();
    }
  };

  // ... (বাকি হ্যান্ডলার ফাংশনগুলো আগের মতোই থাকবে)

  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #222', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', marginBottom: '15px', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0' };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: '400px', margin: 'auto' }}>
        
        {view === 'settings' && (
          <>
            <h2 style={{ fontWeight: '100', letterSpacing: '4px', fontSize: '18px', marginBottom: '40px' }}>SETTINGS</h2>
            
            <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>FULL NAME</p>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
            
            <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>EMAIL ADDRESS</p>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
            
            <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>NEW PASSWORD</p>
            <input type="password" onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            
            <div style={{ marginTop: '30px' }}>
              <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
              <button onClick={() => setView('profile')} style={navButtonStyle}>BACK</button>
            </div>
          </>
        )}
        {/* প্রোফাইল ভিউ কোড আগের মতো... */}
      </div>
    </div>
  );
}
