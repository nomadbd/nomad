import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false); // কনফার্মেশন মডালের জন্য

  useEffect(() => { fetchUserData(); }, []);

  const showToast = (message: string, color: string = '#fff') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...prof, email: user.email });
      setNewName(prof?.name || '');
      setNewEmail('');
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  const handleDeleteAccount = async () => {
    setShowConfirm(false);
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      showToast("Error: " + error.message, "#ff4444");
    } else {
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

  const handleUpdate = async () => {
    try {
      if (newName !== profile?.name) {
        const { error: profileError } = await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
        if (profileError) throw profileError;
      }
      if (newEmail && newEmail !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
        if (emailError) throw emailError;
        showToast("Check your new email to confirm.", "#3498db");
      }
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
      }
      showToast("Profile updated successfully!", "#2ecc71");
      await fetchUserData();
      setView('profile');
    } catch (error: any) {
      showToast("Update Error: " + error.message, "#ff4444");
    }
  };

  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', marginBottom: '15px', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', marginTop: '30px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left', fontWeight: 'bold' };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#111', color: '#fff', padding: '15px 25px', borderRadius: '5px', borderLeft: `5px solid ${toast.color}`, zIndex: 9999, fontSize: '12px', letterSpacing: '1px', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {toast.message}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '10px', textAlign: 'center', border: '1px solid #333', maxWidth: '300px' }}>
            <p style={{ marginBottom: '20px', fontSize: '14px' }}>Are you sure you want to delete your account?</p>
            <button onClick={handleDeleteAccount} style={{ background: '#ff4444', border: 'none', padding: '10px 20px', color: '#fff', marginRight: '10px', cursor: 'pointer' }}>Yes</button>
            <button onClick={() => setShowConfirm(false)} style={{ background: 'transparent', border: '1px solid #555', padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>No</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '400px', margin: 'auto' }}>
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ letterSpacing: '4px', fontWeight: '100', fontSize: '18px', margin: 0 }}>PROFILE</h2>
              <svg onClick={() => setView('settings')} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" cursor="pointer">
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>NAME</p>
              {profile?.name ? (
                <p style={{ fontSize: '16px', fontWeight: '300', color: '#fff' }}>{profile.name}</p>
              ) : (
                <p style={{ fontSize: '16px', fontWeight: '300', color: '#555', cursor: 'pointer', borderBottom: '1px dotted #555', display: 'inline-block' }} onClick={() => setView('settings')}>Add display name</p>
              )}
            </div>
            <div style={{ marginBottom: '25px' }}>
              <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>EMAIL</p>
              <p style={{ fontSize: '16px', fontWeight: '300', color: '#fff' }}>{profile?.email || ''}</p>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontWeight: '100', letterSpacing: '4px', fontSize: '18px', marginBottom: '40px' }}>SETTINGS</h2>
            <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>NAME</p>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>EMAIL ADDRESS</p>
            <input placeholder={profile?.email} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: '8px', color: '#555', letterSpacing: '2px', marginBottom: '5px' }}>NEW PASSWORD</p>
            <input type="password" placeholder="••••••••" onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
              <button onClick={() => setView('profile')} style={navButtonStyle}>BACK</button>
              <button onClick={handleSignOut} style={navButtonStyle}>SIGN OUT</button>
            </div>
            <button onClick={() => setShowConfirm(true)} style={dangerButtonStyle}>DELETE ACCOUNT</button>
          </>
        )}
      </div>
    </div>
  );
}
