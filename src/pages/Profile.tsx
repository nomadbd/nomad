import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '../cloudinary';
import OrderHistory from '../components/OrderHistory';
import Toast from '../components/ui/Toast';
import ConfirmModal from '../components/ui/ConfirmModal';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';
import ProfileHeader from '../components/profile/ProfileHeader';
import AmbassadorDashboard from './AmbassadorDashboard';
import SettingsView from '../components/profile/ProfileSettings';
import ImageCropModal from '../components/ui/ImageCropModal';

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [view, setView] = useState<'profile' | 'settings'>(() => {
    return (localStorage.getItem('currentView') as 'profile' | 'settings') || 'profile';
  });

  const [portalMode, setPortalMode] = useState<'customer' | 'ambassador'>(() => {
    return (localStorage.getItem('portalMode') as 'customer' | 'ambassador') || 'customer';
  });

  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] = useState<any>(null);
  const [, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // --- নতুন যুক্ত করা স্টেট ---
  const [slug, setSlug] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  // -------------------------

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [toast, setToast] = useState<{ message: string; color: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const changeView = (newView: 'profile' | 'settings') => {
    setView(newView);
    localStorage.setItem('currentView', newView);
  };

  useEffect(() => { 
    fetchUserData(); 
  }, []);

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
          setSlug(amb.assigned_slug || '');
          setPayoutDetails(amb.payout_details || '');
        }
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
        showToast("Cloudinary upload failed. Check Cloudinary upload preset/API keys.", "#ff4444");
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
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
      console.error('Avatar delete error:', err);
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
        if (newPassword.length < 6) {
          showToast("Password must be at least 6 characters long.", "#ff4444");
          return;
        }
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) throw passwordError;
        otherChanges = true;
      }

      // --- অ্যাম্বাসেডর স্ল্যাগ ও পেমেন্ট ডিটেইলস আপডেট লজিক ---
      if (isAmbassadorActive && ambassadorData?.id) {
        const formattedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

        if (formattedSlug && formattedSlug !== ambassadorData.assigned_slug) {
          const { data: existing } = await supabase
            .from('ambassador')
            .select('id')
            .eq('assigned_slug', formattedSlug)
            .neq('id', ambassadorData.id)
            .maybeSingle();

          if (existing) {
            showToast("This URL slug is already taken.", "#ff4444");
            return;
          }
        }

        const { error: ambErr } = await supabase
          .from('ambassador')
          .update({
            assigned_slug: formattedSlug,
            payout_details: payoutDetails.trim()
          })
          .eq('id', ambassadorData.id);

        if (ambErr) throw ambErr;
        otherChanges = true;
      }

      if (emailChanged) {
        showToast("Check your new email inbox to verify the change.", "#3498db");
      } else if (otherChanges) {
        showToast("Settings updated successfully!", "#2ecc71");
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
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {toast && <Toast message={toast.message} color={toast.color} />}

      <ConfirmModal 
        isOpen={showConfirm} 
        message="Are you sure you want to delete your account?" 
        onConfirm={handleDeleteAccount} 
        onCancel={() => setShowConfirm(false)} 
      />

      <ImageCropModal 
        isOpen={cropModalOpen} 
        selectedImageSrc={selectedImageSrc} 
        isAmbassadorActive={isAmbassadorActive} 
        onClose={() => setCropModalOpen(false)} 
        onApply={handleApplyCropAndUpload} 
      />

      <div style={{ width: '100%' }}>
        {view === 'profile' ? (
          <>
            <ProfileHeader 
              profile={profile} 
              avatarUrl={avatarUrl} 
              isAmbassador={isAmbassador} 
              isAmbassadorActive={isAmbassadorActive} 
              togglePortalMode={togglePortalMode} 
              getInitials={getInitials} 
              onChangeView={changeView} 
            />

            {portalMode === 'ambassador' && isAmbassador ? (
              <AmbassadorDashboard ambassadorData={ambassadorData} profile={profile} />
            ) : (
              <div style={{ marginTop: '20px', borderTop: '1px solid #111', paddingTop: '10px' }}>
                <OrderHistory userId={profile?.id} />
              </div>
            )}
          </>
        ) : (
          <SettingsView 
            profile={profile} 
            avatarUrl={avatarUrl} 
            isAmbassadorActive={isAmbassadorActive} 
            uploadingAvatar={uploadingAvatar} 
            fileInputRef={fileInputRef} 
            newName={newName} 
            newEmail={newEmail} 
            newPassword={newPassword} 
            // --- নতুন প্রপস পাস করা হলো ---
            slug={slug}
            setSlug={setSlug}
            payoutDetails={payoutDetails}
            setPayoutDetails={setPayoutDetails}
            // ---------------------------
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
        )}
      </div>
    </div>
  );
}
