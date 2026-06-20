import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile() {
  // localStorage থেকে ভিউ স্টেট রিস্টোর করা হচ্ছে
  const [view, setView] = useState<'profile' | 'settings'>(() => {
    return (localStorage.getItem('currentView') as 'profile' | 'settings') || 'profile';
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // ভিউ পরিবর্তন হলে তা localStorage-এ সেভ করা হচ্ছে
  const changeView = (newView: 'profile' | 'settings') => {
    setView(newView);
    localStorage.setItem('currentView', newView);
  };

  useEffect(() => { fetchUserData(); }, []);

  const Skeleton = () => (
    <div style={{ opacity: 0.3, width: '100%', marginTop: '20px' }}>
      <div style={{ height: '24px', width: '40%', background: '#333', marginBottom: '25px', borderRadius: '4px' }}></div>
      <div style={{ height: '13px', width: '20%', background: '#333', marginBottom: '10px', borderRadius: '4px' }}></div>
      <div style={{ height: '18px', width: '60%', background: '#333', borderRadius: '4px' }}></div>
    </div>
  );

  const showToast = (message: string, color: string = '#fff') => {
    setToast({ message, color });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...prof, email: user.email });
      setNewName('');
      setNewEmail('');
    }
    setLoading(false);
  };

  const handleSignOut = async () => { 
    localStorage.removeItem('currentView'); // লগআউটের সময় ভিউ ক্লিয়ার করা
    await supabase.auth.signOut(); 
    window.location.href = '/'; 
  };

  const handleDeleteAccount = async () => {
    setShowConfirm(false);
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      showToast("Error: " + error.message, "#ff4444");
    } else {
      localStorage.removeItem('currentView');
      await supabase.auth.signOut();
      window.location.href = '/';
    }
  };

  const handleUpdate = async () => {
    try {
      let emailChanged = false;
      let otherChanges = false;

      if (newName && newName !== profile?.name) {
        const { error: profileError } = await supabase.from('profiles').update({ name: newName }).eq('id', profile.id);
        if (profileError) throw profileError;
        otherChanges = true;
      }

      if (newEmail && newEmail !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail });
        if (emailError) throw emailError;
        emailChanged = true;
      }

      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        otherChanges = true;
      }

      if (emailChanged) {
        showToast("Check your new email inbox to verify the change.", "#3498db");
      } else if (otherChanges) {
        showToast("Profile updated successfully!", "#2ecc71");
      }

      await fetchUserData();
      changeView('profile');
    } catch (error: any) {
      showToast("Update Error: " + error.message, "#ff4444");
    }
  };

  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left', fontWeight: 'bold' };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {toast && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#111', color: '#fff', padding: '15px 25px', borderRadius: '5px', borderLeft: `5px solid ${toast.color}`, zIndex: 9999, fontSize: '12px', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {toast.message}
        </div>
      )}

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '10px', textAlign: 'center', border: '1px solid #333', maxWidth: '300px' }}>
            <p style={{ marginBottom: '20px', fontSize: '14px' }}>Are you sure you want to delete your account?</p>
            <button onClick={handleDeleteAccount} style={{ background: '#ff4444', border: 'none', padding: '10px 20px', color: '#fff', marginRight: '10px', cursor: 'pointer' }}>Yes</button>
            <button onClick={() => setShowConfirm(false)} style={{ background: 'transparent', border: '1px solid #555', padding: '10px 20px', color: '#fff', cursor: 'pointer' }}>No</button>
          </div>
        </div>
      )}

      <div style={{ width: '100%' }}>
        {view === 'profile' ? (
          loading ? <Skeleton /> : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ width: '100%' }}>
                {profile?.name ? (
                  <>
                    <p style={{ margin: '0', fontSize: '22px', fontWeight: '600', color: '#fff', letterSpacing: '1px' }}>{profile.name}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666', letterSpacing: '0.5px' }}>{profile.email}</p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: '22px', fontWeight: '600', color: '#fff', letterSpacing: '1px' }}>PROFILE</p>
                    <p style={{ fontSize: '13px', fontWeight: '500', color: '#aaa', cursor: 'pointer', margin: '8px 0 0 0', letterSpacing: '1px' }} onClick={() => changeView('settings')}>Add your name</p>
                  </>
                )}
              </div>
              <svg onClick={() => changeView('settings')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" cursor="pointer"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>
          )
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontWeight: '500', letterSpacing: '4px', fontSize: '18px', margin: 0 }}>SETTINGS</h2>
              <svg onClick={() => changeView('profile')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" cursor="pointer"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>
            
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' }}>NAME</p>
            <input placeholder={profile?.name || "Enter your name"} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' }}>EMAIL ADDRESS</p>
            <input placeholder={profile?.email} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' }}>NEW PASSWORD</p>
            <input type="password" placeholder="••••••••" onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
            
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
              <button onClick={handleSignOut} style={navButtonStyle}>SIGN OUT</button>
              <button onClick={() => setShowConfirm(true)} style={dangerButtonStyle}>DELETE ACCOUNT</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
