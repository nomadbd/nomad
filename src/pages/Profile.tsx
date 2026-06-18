import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Toast } from '../components/Toast';
import { ConfirmModal } from '../components/ConfirmModal';

export default function Profile() {
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
    }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  const handleDeleteAccount = () => setShowConfirm(true);

  const confirmDelete = async () => {
    setShowConfirm(false);
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      showToast(error.message || "Error deleting account", "#ff4444");
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
        showToast("Confirmation link sent to new email.");
      }
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
      }
      showToast("Profile updated successfully!", "#2ecc71");
      await fetchUserData();
      setView('profile');
    } catch (error: any) {
      showToast(error?.message || "An unexpected error occurred", "#ff4444");
    }
  };

  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', marginBottom: '15px', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', marginTop: '30px', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left', fontWeight: 'bold' };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif" }}>
      
      {toast && <Toast message={toast.message} color={toast.color} />}
      {showConfirm && <ConfirmModal onConfirm={confirmDelete} onCancel={() => setShowConfirm(false)} />}

      <div style={{ maxWidth: '400px', margin: 'auto' }}>
        {view === 'profile' ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ letterSpacing: '4px', fontWeight: '100', fontSize: '18px', margin: 0 }}>PROFILE</h2>
              <svg onClick={() => setView('settings')} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" cursor="pointer">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
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
            <button onClick={handleDeleteAccount} style={dangerButtonStyle}>DELETE ACCOUNT</button>
          </>
        )}
      </div>
    </div>
  );
}
