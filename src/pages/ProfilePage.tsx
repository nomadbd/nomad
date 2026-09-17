import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '../cloudinary';
import OrderHistory from '../components/OrderHistory';
import Toast from '../components/ui/Toast';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSettings from '../components/profile/ProfileSettings';
import ProfileDetailsSheet from '../components/profile/ProfileDetailsSheet';
import NotificationsView from '../components/profile/NotificationsView';
import CommunicationView from '../components/profile/CommunicationView';
import ImageCropModal from '../components/ui/ImageCropModal';
import AmbassadorWorkspace from '../components/ambassador/AmbassadorWorkspace';
import { useAmbassador } from '../hooks/useAmbassador';

function AmbassadorDashboardSection({ ambassadorData, profile }: { ambassadorData: any; profile: any }) {
  const ambassadorState = useAmbassador(ambassadorData);

  return (
    <div style={{ marginTop: '10px' }}>
      <AmbassadorWorkspace 
        ambassadorData={ambassadorData} 
        profile={profile} 
        isOwner={true}
        ambassadorState={ambassadorState} 
      />
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<'profile' | 'settings' | 'notifications' | 'communication'>(() => {
    return (localStorage.getItem('currentView') as any) || 'profile';
  });

  const [portalMode, setPortalMode] = useState<'customer' | 'ambassador'>(() => {
    return (localStorage.getItem('portalMode') as 'customer' | 'ambassador') || 'customer';
  });

  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);
  const [, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // আনরিড স্টেট
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  const [currentSlug, setCurrentSlug] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const [currentDisplayName, setCurrentDisplayName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');

  const [payoutMethod, setPayoutMethod] = useState('bKash');
  const [currentPayoutDetails, setCurrentPayoutDetails] = useState('');
  const [newPayoutNumber, setNewPayoutNumber] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const isAmbassador = String(profile?.role).toUpperCase().trim() === 'AMBASSADOR';
  const isAmbassadorActive = isAmbassador && portalMode === 'ambassador';

  const changeView = (newView: 'profile' | 'settings' | 'notifications' | 'communication') => {
    setView(newView);
    localStorage.setItem('currentView', newView);
  };

  useEffect(() => { 
    fetchUserData(); 
  }, []);

  // অপঠিত নোটিফিকেশন ও মেসেজ কাউন্ট ফেচিং
  const fetchUnreadCounts = useCallback(async () => {
    if (!profile?.id) return;

    // ১. অপঠিত নোটিফিকেশন ফেচিং (SPECIFIC টার্গেটসহ)
    try {
      const { data: recipients } = await supabase
        .from('notification_recipients')
        .select('notification_id')
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (recipients && recipients.length > 0) {
        const notifIds = recipients.map(r => r.notification_id);
        const targetAudiences = isAmbassadorActive 
          ? ['AMBASSADOR', 'ALL', 'SPECIFIC'] 
          : ['CUSTOMER', 'ALL', 'SPECIFIC'];

        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .in('id', notifIds)
          .in('target_audience', targetAudiences);

        setUnreadNotifCount(count || 0);
      } else {
        setUnreadNotifCount(0);
      }
    } catch (err) {
      console.error('Error fetching unread notification count:', err);
    }

    // ২. অপঠিত মেসেজ ফেচিং (কর্তৃপক্ষের পাঠানো)
    try {
      const { count } = await supabase
        .from('communication')
        .select('id', { count: 'exact', head: true })
        .or(`user_id.eq.${profile.id},ambassador_id.eq.${profile.id}`)
        .eq('is_read', false)
        .neq('sender', 'ambassador');

      setUnreadMessagesCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread messages count:', err);
    }
  }, [profile?.id, isAmbassadorActive]);

  useEffect(() => {
    if (!profile?.id) return;

    fetchUnreadCounts();

    // নোটিফিকেশন রিয়েলটাইম চ্যানেল
    const notifChannel = supabase
      .channel(`profile_notif_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_recipients',
          filter: `user_id=eq.${profile.id}`
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    // মেসেজ চ্যাট রিয়েলটাইম চ্যানেল
    const chatChannel = supabase
      .channel(`profile_chat_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communication',
          filter: `user_id=eq.${profile.id}`
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [profile?.id, fetchUnreadCounts]);

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

      const fetchedAvatar = prof?.avatar_url || prof?.avatar || null;
      setProfile({ ...prof, email: user.email, avatar_url: fetchedAvatar });
      setAvatarUrl(fetchedAvatar);

      if (normalizedRole === 'AMBASSADOR') {
        const { data: amb } = await supabase.from('ambassador').select('*').eq('user_id', user.id).maybeSingle();
        setAmbassadorData(amb);
        if (amb) {
          setCurrentSlug(amb.assigned_slug || '');
          setCurrentPayoutDetails(amb.payout_details || '');
          setCurrentDisplayName(amb.display_name || '');

          if (amb.payout_details && amb.payout_details.includes(':')) {
            const [method] = amb.payout_details.split(':');
            if (method?.trim()) {
              setPayoutMethod(method.trim());
            }
          }
        }
      }

      setNewName('');
      setNewEmail('');
      setCurrentPassword('');
      setNewPassword('');
      setDeleteConfirmPassword('');
      setNewSlug('');
      setNewDisplayName('');
      setNewPayoutNumber('');
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    if (e.target) e.target.value = '';
  };

  const handleApplyCropAndUpload = async (croppedFile: File) => {
    if (!profile?.id) {
      showToast("User profile ID missing.", "#ff4444");
      return;
    }

    try {
      setUploadingAvatar(true);
      setCropModalOpen(false);
      showToast("Uploading cropped image...", "#3498db");

      const uploadedUrl = await uploadToCloudinary(croppedFile, 'avatars', profile.id);

      if (uploadedUrl) {
        const urlWithCacheBust = `${uploadedUrl}?v=${Date.now()}`;

        const { data, error } = await supabase
          .from('profiles')
          .update({ avatar_url: urlWithCacheBust })
          .eq('id', profile.id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          showToast("Database permission denied or row not found.", "#ff4444");
          return;
        }

        setAvatarUrl(urlWithCacheBust);
        setProfile((prev: any) => ({ ...prev, avatar_url: urlWithCacheBust }));
        showToast("Profile picture updated successfully!", "#2ecc71");
      } else {
        showToast("Cloudinary upload failed.", "#ff4444");
      }
    } catch (err: any) {
      showToast("Failed to upload image: " + (err.message || "Unknown error"), "#ff4444");
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

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        showToast("Database update failed.", "#ff4444");
        return;
      }

      setAvatarUrl(null);
      setProfile((prev: any) => ({ ...prev, avatar_url: null }));
      showToast("Profile picture removed successfully!", "#2ecc71");
    } catch (err: any) {
      showToast("Failed to remove image: " + err.message, "#ff4444");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => { 
    localStorage.removeItem('currentView');
    localStorage.removeItem('portalMode');
    await supabase.auth.signOut(); 
    window.location.href = '/'; 
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      showToast("Password is required to delete account.", "#ff4444");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password: deleteConfirmPassword
    });

    if (authError) {
      showToast("Incorrect password. Account deletion failed.", "#ff4444");
      return;
    }

    setShowConfirm(false);
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      showToast("Error: " + error.message, "#ff4444");
    } else {
      localStorage.removeItem('currentView');
      localStorage.removeItem('portalMode');
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
        if (!currentPassword) {
          showToast("Current password is required to change password.", "#ff4444");
          return;
        }

        if (newPassword.length < 6) {
          showToast("New password must be at least 6 characters long.", "#ff4444");
          return;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: currentPassword
        });

        if (authError) {
          showToast("Incorrect current password.", "#ff4444");
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        otherChanges = true;
      }

      if (isAmbassador && profile?.id) {
        const updatesToAmb: any = {};

        if (newDisplayName.trim()) {
          updatesToAmb.display_name = newDisplayName.trim().toUpperCase().slice(0, 10);
        }

        const getFallbackSlug = (name?: string) => {
          if (!name?.trim()) return '';
          return name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        };

        const targetSlug = newSlug.trim()
          ? newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
          : (!currentSlug ? getFallbackSlug(profile?.name) : '');

        if (targetSlug && targetSlug !== currentSlug) {
          const { data: existing } = await supabase
            .from('ambassador')
            .select('id, user_id')
            .eq('assigned_slug', targetSlug)
            .neq('user_id', profile.id)
            .maybeSingle();

          if (existing) {
            showToast("This URL slug is already taken.", "#ff4444");
            return;
          }
          updatesToAmb.assigned_slug = targetSlug;
        }

        if (newPayoutNumber.trim()) {
          updatesToAmb.payout_details = `${payoutMethod}: ${newPayoutNumber.trim()}`;
        }

        if (Object.keys(updatesToAmb).length > 0) {
          const { data: ambUpdatedData, error: ambErr } = await supabase
            .from('ambassador')
            .update(updatesToAmb)
            .eq('user_id', profile.id)
            .select();

          if (ambErr) throw ambErr;

          if (!ambUpdatedData || ambUpdatedData.length === 0) {
            showToast("Update failed! Please check database RLS policy.", "#ff4444");
            return;
          }

          otherChanges = true;
        }
      }

      if (emailChanged) {
        showToast("Check your new email inbox to verify the change.", "#3498db");
      } else if (otherChanges) {
        showToast("Settings updated successfully!", "#2ecc71");
      }

      setCurrentPassword('');
      setNewPassword('');
      setDeleteConfirmPassword('');
      setNewDisplayName('');
      setNewSlug('');
      setNewPayoutNumber('');

      await fetchUserData();
      changeView('profile');
    } catch (error: any) {
      showToast("Update Error: " + error.message, "#ff4444");
    }
  };

  const togglePortalMode = () => {
    if (isAmbassador) {
      setPortalMode(prev => {
        const nextMode = prev === 'customer' ? 'ambassador' : 'customer';
        localStorage.setItem('portalMode', nextMode);
        return nextMode;
      });
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px' }}>
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: view === 'notifications' || view === 'communication' ? '0' : '40px 20px', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {toast && <Toast message={toast.message} color={toast.color} />}

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '25px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ff4444', letterSpacing: '1px' }}>DELETE ACCOUNT</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>This action is permanent. Enter your password to confirm deletion:</p>
            <input 
              type="password" 
              placeholder="Password" 
              value={deleteConfirmPassword} 
              onChange={(e) => setDeleteConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => { setShowConfirm(false); setDeleteConfirmPassword(''); }}
                style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' }}>
                CANCEL
              </button>
              <button 
                onClick={handleDeleteAccount}
                style={{ background: '#ff4444', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold' }}>
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageCropModal 
        isOpen={cropModalOpen} 
        selectedImageSrc={selectedImageSrc} 
        isAmbassadorActive={isAmbassadorActive} 
        onClose={() => setCropModalOpen(false)} 
        onApply={handleApplyCropAndUpload} 
      />

      <ProfileDetailsSheet 
        isOpen={isDetailsSheetOpen} 
        onClose={() => setIsDetailsSheetOpen(false)} 
        profile={profile} 
        ambassadorData={ambassadorData}
        avatarUrl={avatarUrl} 
        getInitials={getInitials} 
        portalMode={portalMode}
        isAmbassador={isAmbassador} 
      />

      <div style={{ width: '100%' }}>
        {view === 'notifications' ? (
          <NotificationsView 
            userId={profile?.id} 
            targetAudience={isAmbassadorActive ? ['AMBASSADOR', 'ALL', 'SPECIFIC'] : ['CUSTOMER', 'ALL', 'SPECIFIC']}
            onBack={() => {
              changeView('profile');
              fetchUnreadCounts();
            }} 
          />
        ) : view === 'communication' ? (
          <CommunicationView 
            userId={profile?.id} 
            onBack={() => {
              changeView('profile');
              fetchUnreadCounts();
            }} 
          />
        ) : view === 'settings' ? (
          <ProfileSettings 
            profile={profile} 
            avatarUrl={avatarUrl} 
            isAmbassadorActive={isAmbassadorActive} 
            uploadingAvatar={uploadingAvatar} 
            fileInputRef={fileInputRef} 
            newName={newName} 
            newEmail={newEmail} 
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword} 
            currentSlug={currentSlug}
            newSlug={newSlug}
            setNewSlug={setNewSlug}
            currentDisplayName={currentDisplayName}
            newDisplayName={newDisplayName}
            setNewDisplayName={setNewDisplayName}
            payoutMethod={payoutMethod}
            setPayoutMethod={setPayoutMethod}
            currentPayoutDetails={currentPayoutDetails}
            newPayoutNumber={newPayoutNumber}
            setNewPayoutNumber={setNewPayoutNumber}
            setNewName={setNewName} 
            setNewEmail={setNewEmail} 
            setNewPassword={setNewPassword} 
            getInitials={getInitials} 
            handleDeleteAvatar={handleDeleteAvatar} 
            handleUpdate={handleUpdate} 
            handleSignOut={handleSignOut} 
            setShowConfirm={setShowConfirm} 
            onChangeView={changeView} 
          />
        ) : (
          <>
            <ProfileHeader 
              profile={profile} 
              avatarUrl={avatarUrl} 
              isAmbassador={isAmbassador} 
              isAmbassadorActive={isAmbassadorActive} 
              togglePortalMode={togglePortalMode} 
              getInitials={getInitials} 
              onChangeView={changeView} 
              onOpenProfileDetails={() => setIsDetailsSheetOpen(true)}
              onOpenNotifications={() => changeView('notifications')}
              onOpenCommunication={() => changeView('communication')}
              unreadMessagesCount={unreadMessagesCount}
              unreadNotifCount={unreadNotifCount}
              hasUnreadNotif={unreadNotifCount > 0}
            />

            {portalMode === 'ambassador' && isAmbassador ? (
              <AmbassadorDashboardSection ambassadorData={ambassadorData} profile={profile} />
            ) : (
              <div style={{ marginTop: '20px', borderTop: '1px solid #111', paddingTop: '10px' }}>
                <OrderHistory userId={profile?.id} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
