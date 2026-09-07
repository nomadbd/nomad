import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary } from '../cloudinary';
import OrderHistory from '../components/OrderHistory'; 

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<'profile' | 'settings'>(() => {
    return (localStorage.getItem('currentView') as 'profile' | 'settings') || 'profile';
  });

  const [portalMode, setPortalMode] = useState<'customer' | 'ambassador'>('customer');
  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const changeView = (newView: 'profile' | 'settings') => {
    setView(newView);
    localStorage.setItem('currentView', newView);
  };

  useEffect(() => { 
    fetchUserData(); 
  }, []);

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

  const getInitials = (name?: string, email?: string) => {
    if (name?.trim()) {
      return name.trim().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    if (email?.trim()) {
      return email.trim()[0].toUpperCase();
    }
    return 'U';
  };

  const fetchUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setSession({ user });
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      const normalizedRole = prof?.role ? String(prof.role).toUpperCase().trim() : '';
      const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(normalizedRole);

      if (isStaff) {
        navigate('/admin', { replace: true });
        return;
      }

      setProfile({ ...prof, email: user.email });
      setAvatarUrl(prof?.avatar_url || null);

      if (normalizedRole === 'AMBASSADOR') {
        const { data: amb } = await supabase.from('ambassador').select('*').eq('user_id', user.id).maybeSingle();
        setAmbassadorData(amb);
      }

      setNewName('');
      setNewEmail('');
      setNewPassword('');
    }
    setLoading(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    try {
      setUploadingAvatar(true);
      showToast("Uploading profile picture...", "#3498db");

      const uploadedUrl = await uploadToCloudinary(file, 'avatars', 'profiles');

      if (uploadedUrl) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: uploadedUrl })
          .eq('id', profile.id);

        if (error) throw error;

        setAvatarUrl(uploadedUrl);
        setProfile((prev: any) => ({ ...prev, avatar_url: uploadedUrl }));
        showToast("Profile picture updated successfully!", "#2ecc71");
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showToast("Failed to upload image: " + err.message, "#ff4444");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSignOut = async () => { 
    localStorage.removeItem('currentView');
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

      if (newName.trim() && newName !== profile?.name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name: newName.trim() })
          .eq('id', profile.id);
        if (profileError) throw profileError;
        otherChanges = true;
      }

      if (newEmail.trim() && newEmail !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: newEmail.trim() });
        if (emailError) throw emailError;
        emailChanged = true;
      }

      if (newPassword) {
        if (newPassword.length < 6) {
          showToast("Password must be at least 6 characters long.", "#ff4444");
          return;
        }
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        otherChanges = true;
      }

      if (emailChanged) {
        showToast("Check your new email inbox to verify the change.", "#3498db");
      } else if (otherChanges) {
        showToast("Profile updated successfully!", "#2ecc71");
      }

      setNewPassword('');
      await fetchUserData();
      changeView('profile');
    } catch (error: any) {
      showToast("Update Error: " + error.message, "#ff4444");
    }
  };

  const isAmbassador = String(profile?.role).toUpperCase().trim() === 'AMBASSADOR';
  const isAmbassadorActive = isAmbassador && portalMode === 'ambassador';

  const togglePortalMode = () => {
    if (isAmbassador) {
      setPortalMode(prev => (prev === 'customer' ? 'ambassador' : 'customer'));
    }
  };

  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left', fontWeight: 'bold' };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px' }}>
        <Skeleton />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

      {isAmbassadorActive && (
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleAvatarChange} 
          accept="image/*" 
          style={{ display: 'none' }} 
        />
      )}

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
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                <div 
                  onClick={togglePortalMode}
                  style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '50%', 
                    backgroundColor: '#181818', 
                    border: isAmbassadorActive ? '1px solid #ffffff' : '1px solid #2a2a2a', 
                    boxShadow: isAmbassadorActive ? '0 0 15px rgba(255, 255, 255, 0.4)' : 'none',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: '600', 
                    fontSize: '18px', 
                    color: '#fff', 
                    textShadow: isAmbassadorActive ? '0 0 8px #ffffff, 0 0 16px #ffffff' : 'none',
                    flexShrink: 0,
                    cursor: isAmbassador ? 'pointer' : 'default',
                    userSelect: 'none',
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    getInitials(profile?.name, profile?.email)
                  )}
                </div>

                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
                    {profile?.name || "PROFILE"}
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>
                    {profile?.email}
                  </p>
                </div>
              </div>

              <div
                onClick={() => changeView('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: 'none',
                  padding: '8px'
                }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
            </div>

            {portalMode === 'ambassador' && isAmbassador ? (
              <div style={{ marginTop: '20px' }}>
                <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '24px', borderRadius: '8px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '10px', color: '#d4af37', letterSpacing: '2px', textTransform: 'uppercase' }}>VIP PARTNER</span>
                  <h2 style={{ fontSize: '18px', margin: '4px 0 16px 0', fontWeight: '500', letterSpacing: '1px' }}>AMBASSADOR DASHBOARD</h2>

                  <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '1px' }}>STATUS</p>
                  <p style={{ margin: '4px 0 16px 0', fontSize: '15px', color: '#4edf4e', fontWeight: 'bold' }}>ACTIVE PARTNER</p>

                  <p style={{ margin: 0, fontSize: '11px', color: '#888', letterSpacing: '1px' }}>RECIPIENT ID</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#fff' }}>{ambassadorData?.recipient_identifier || profile?.email}</p>
                </div>

                <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #222', padding: '24px', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', letterSpacing: '1px', color: '#fff' }}>CONCIERGE & SUPPORT</h4>
                  <p style={{ fontSize: '13px', color: '#888', lineHeight: '1.6', margin: 0 }}>
                    Welcome to your exclusive Ambassador portal. For partner inquiries or payout updates, contact your concierge admin directly.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: '20px', borderTop: '1px solid #111', paddingTop: '10px' }}>
                <OrderHistory userId={profile?.id} />
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontWeight: '500', letterSpacing: '4px', fontSize: '18px', margin: 0 }}>SETTINGS</h2>
              <svg onClick={() => changeView('profile')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" cursor="pointer"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>

            {isAmbassadorActive && (
              <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#181818', border: '1px solid #333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{getInitials(profile?.name, profile?.email)}</span>
                  )}
                </div>
                <button 
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    letterSpacing: '1px',
                    cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                    opacity: uploadingAvatar ? 0.6 : 1
                  }}>
                  {uploadingAvatar ? 'UPLOADING...' : 'CHANGE PICTURE'}
                </button>
              </div>
            )}

            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' }}>NAME</p>
            <input placeholder={profile?.name || "Enter your name"} value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />

            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' }}>EMAIL ADDRESS</p>
            <input placeholder={profile?.email} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />

            <p style={{ fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' }}>NEW PASSWORD</p>
            <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />

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
