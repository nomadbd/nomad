import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '../cloudinary';
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

  // Crop Modal States
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - offset.x, y: e.touches[0].clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const generateCroppedFile = (): Promise<File | null> => {
    return new Promise((resolve) => {
      if (!imgRef.current || !selectedImageSrc) {
        resolve(null);
        return;
      }

      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const viewportSize = 220; 
      const outputSize = 500; 
      canvas.width = outputSize;
      canvas.height = outputSize;

      const baseScale = Math.max(viewportSize / image.naturalWidth, viewportSize / image.naturalHeight);
      const currentScale = baseScale * zoom;

      const renderedWidth = image.naturalWidth * currentScale;
      const renderedHeight = image.naturalHeight * currentScale;

      const imgLeftInViewport = (viewportSize - renderedWidth) / 2 + offset.x;
      const imgTopInViewport = (viewportSize - renderedHeight) / 2 + offset.y;

      const scaleRatio = outputSize / viewportSize;

      ctx.drawImage(
        image,
        imgLeftInViewport * scaleRatio,
        imgTopInViewport * scaleRatio,
        renderedWidth * scaleRatio,
        renderedHeight * scaleRatio
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        resolve(croppedFile);
      }, 'image/jpeg', 0.92);
    });
  };

  const handleApplyCropAndUpload = async () => {
    if (!profile?.id) return;

    try {
      setUploadingAvatar(true);
      setCropModalOpen(false);
      showToast("Uploading cropped image...", "#3498db");

      const croppedFile = await generateCroppedFile();
      if (!croppedFile) {
        showToast("Failed to process image.", "#ff4444");
        return;
      }

      const uploadedUrl = await uploadToCloudinary(croppedFile, 'avatars', profile.id);

      if (uploadedUrl) {
        const urlWithCacheBust = `${uploadedUrl}?v=${Date.now()}`;

        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: urlWithCacheBust })
          .eq('id', profile.id);

        if (error) throw error;

        setAvatarUrl(urlWithCacheBust);
        setProfile((prev: any) => ({ ...prev, avatar_url: urlWithCacheBust }));
        showToast("Profile picture updated successfully!", "#2ecc71");
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showToast("Failed to upload image: " + err.message, "#ff4444");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.id) return;

    try {
      setUploadingAvatar(true);
      showToast("Removing profile picture...", "#3498db");

      if (avatarUrl) {
        await deleteFromCloudinary(avatarUrl);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (error) throw error;

      setAvatarUrl(null);
      setProfile((prev: any) => ({ ...prev, avatar_url: null }));
      showToast("Profile picture removed successfully!", "#2ecc71");
    } catch (err: any) {
      console.error('Avatar delete error:', err);
      showToast("Failed to remove image: " + err.message, "#ff4444");
    } finally {
      setUploadingAvatar(false);
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
          onChange={handleFileSelect} 
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

      {/* Twitter-Style Bottom Sheet Cropper Modal */}
      {cropModalOpen && selectedImageSrc && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: 'rgba(0, 0, 0, 0.75)', 
          backdropFilter: 'blur(10px)', 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'center', 
          zIndex: 10001 
        }}>
          <div style={{ 
            background: '#121212', 
            borderTop: '1px solid #282828', 
            borderRadius: '24px 24px 0 0', 
            padding: '16px 24px 32px 24px', 
            maxWidth: '480px', 
            width: '100%', 
            textAlign: 'center', 
            boxShadow: '0 -10px 30px rgba(0,0,0,0.8)',
            boxSizing: 'border-box'
          }}>
            {/* Mobile Drag Indicator Bar */}
            <div style={{ width: '36px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 16px auto' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>EDIT MEDIA</h3>
              <button 
                onClick={() => setCropModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>
                ✕
              </button>
            </div>

            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                margin: '0 auto 20px auto',
                overflow: 'hidden',
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                backgroundColor: '#181818',
                border: isAmbassadorActive ? '1px solid #ffffff' : '1px solid #333',
                boxShadow: isAmbassadorActive ? '0 0 20px rgba(255, 255, 255, 0.4)' : 'none',
                userSelect: 'none',
                touchAction: 'none'
              }}>
              <img 
                ref={imgRef}
                src={selectedImageSrc} 
                alt="Crop preview" 
                draggable={false}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  minWidth: '100%',
                  minHeight: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px', padding: '0 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '8px', letterSpacing: '1px' }}>
                <span>ZOOM</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.05" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#fff', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setCropModalOpen(false)}
                style={{
                  flex: 1,
                  background: '#1a1a1a',
                  border: '1px solid #333',
                  color: '#ccc',
                  padding: '12px 0',
                  borderRadius: '24px',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                CANCEL
              </button>
              <button 
                onClick={handleApplyCropAndUpload}
                style={{
                  flex: 1,
                  background: '#fff',
                  border: 'none',
                  color: '#000',
                  padding: '12px 0',
                  borderRadius: '24px',
                  fontSize: '12px',
                  letterSpacing: '1px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}>
                APPLY
              </button>
            </div>
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
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  backgroundColor: '#181818', 
                  border: '1px solid #ffffff',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.4)',
                  overflow: 'hidden', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: '600',
                  color: '#fff',
                  textShadow: '0 0 8px #ffffff, 0 0 16px #ffffff',
                  flexShrink: 0
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{getInitials(profile?.name, profile?.email)}</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                    {uploadingAvatar ? 'UPLOADING...' : (avatarUrl ? 'CHANGE PICTURE' : 'UPLOAD PICTURE')}
                  </button>

                  {avatarUrl && (
                    <button 
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={handleDeleteAvatar}
                      style={{
                        background: 'transparent',
                        border: '1px solid #ff4444',
                        color: '#ff4444',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        letterSpacing: '1px',
                        cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                        opacity: uploadingAvatar ? 0.6 : 1
                      }}>
                      REMOVE PICTURE
                    </button>
                  )}
                </div>
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
