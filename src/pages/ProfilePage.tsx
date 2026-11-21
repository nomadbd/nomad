import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '../cloudinary';
import { useGlobalLoading, SkeletonViewType } from '../context/LoadingContext';
import OrderHistory from '../components/OrderHistory';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileSettings from '../components/profile/ProfileSettings';
import ProfileDetailsSheet from '../components/profile/ProfileDetailsSheet';
import NotificationsView from '../components/profile/NotificationsView';
import CommunicationView from '../components/profile/CommunicationView';
import ImageCropModal from '../components/ui/ImageCropModal';
import AmbassadorDashboard from '../components/ambassador/dashboard/AmbassadorDashboard';
import { useAmbassador } from '../hooks/useAmbassador';

function AmbassadorDashboardSection({ ambassadorData, profile }: { ambassadorData: any; profile: any }) {
  const ambassadorState = useAmbassador(ambassadorData);

  return (
    <div style={{ marginTop: '10px' }}>
      <AmbassadorDashboard
        ambassadorData={ambassadorData}
        profile={profile}
        isOwner={true}
        ambassadorState={ambassadorState}
      />
    </div>
  );
}

const stripQueryParams = (url: string) => url.split('?')[0];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { setIsPageLoading } = useGlobalLoading();
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

  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [currentSlug, setCurrentSlug] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const [payoutMethod, setPayoutMethod] = useState('bKash');
  const [currentPayoutDetails, setCurrentPayoutDetails] = useState('');
  const [newPayoutNumber, setNewPayoutNumber] = useState('');

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    slug?: string;
    payoutNumber?: string;
    password?: string;
  }>({});

  const [showConfirm, setShowConfirm] = useState(false);

  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const isAmbassador = String(profile?.role).toUpperCase().trim() === 'AMBASSADOR';
  const isAmbassadorActive = isAmbassador && portalMode === 'ambassador';

  const getActiveSkeletonView = useCallback((): SkeletonViewType => {
    if (view === 'settings') return 'settings';
    if (view === 'notifications') return 'notifications';
    if (view === 'communication') return 'communication';
    return isAmbassadorActive ? 'ambassador' : 'orders';
  }, [view, isAmbassadorActive]);

  useEffect(() => {
    if (loading) {
      setIsPageLoading(true, {
        view: getActiveSkeletonView(),
        isAmbassador: isAmbassadorActive,
      });
    } else {
      setIsPageLoading(false);
    }
  }, [loading, getActiveSkeletonView, isAmbassadorActive, setIsPageLoading]);

  useEffect(() => {
    return () => {
      setIsPageLoading(false);
    };
  }, [setIsPageLoading]);

  const changeView = (newView: 'profile' | 'settings' | 'notifications' | 'communication') => {
    setView(newView);
    localStorage.setItem('currentView', newView);
    setSettingsFeedback(null);
    setFieldErrors({});
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUnreadCounts = useCallback(async () => {
    if (!profile?.id) return;

    if (!isAmbassadorActive) {
      try {
        const { data: recipients } = await supabase
          .from('notification_recipients')
          .select('notification_id')
          .eq('user_id', profile.id)
          .eq('is_read', false);

        if (recipients && recipients.length > 0) {
          const notifIds = recipients.map(r => r.notification_id);

          const { count } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .in('id', notifIds)
            .in('target_audience', ['CUSTOMER', 'ALL', 'SPECIFIC']);

          setUnreadNotifCount(count || 0);
        } else {
          setUnreadNotifCount(0);
        }
      } catch (err) {
        console.error('Error fetching unread notification count:', err);
      }
    }

    if (isAmbassadorActive) {
      try {
        const { count } = await supabase
          .from('communications')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', profile.id)
          .eq('is_read', false)
          .neq('sender_role', 'ambassador');

        setUnreadMessagesCount(count || 0);
      } catch (err) {
        console.error('Error fetching unread messages count:', err);
      }
    }
  }, [profile?.id, isAmbassadorActive]);

  useEffect(() => {
    if (!profile?.id) return;

    fetchUnreadCounts();

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

    const chatChannel = supabase
      .channel(`profile_chat_${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications',
          filter: `channel_id=eq.${profile.id}`
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [profile?.id, fetchUnreadCounts]);

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
    setIsPageLoading(true, {
      view: getActiveSkeletonView(),
      isAmbassador: isAmbassadorActive,
    });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setSession({ user });

        const cleanEmail = (user.email || '').toLowerCase();
        const userInviteToken = user.user_metadata?.invite_token;

        let pendingInvite: any = null;

        if (userInviteToken) {
          const { data: inviteByToken } = await supabase
            .from('ambassador')
            .select('*')
            .eq('token', userInviteToken)
            .eq('is_registered', false)
            .maybeSingle();
          pendingInvite = inviteByToken;
        }

        if (!pendingInvite && cleanEmail) {
          const { data: inviteByEmail } = await supabase
            .from('ambassador')
            .select('*')
            .or(`email.eq.${cleanEmail},recipient_identifier.eq.${cleanEmail}`)
            .eq('is_registered', false)
            .maybeSingle();
          pendingInvite = inviteByEmail;
        }

        if (pendingInvite) {
          await supabase.rpc('complete_ambassador_registration', {
            invite_token: pendingInvite.token,
            new_user_id: user.id,
            user_email: cleanEmail,
            user_name: user.user_metadata?.full_name || pendingInvite.display_name || ''
          });
        }

        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();

        const normalizedRole = prof?.role ? String(prof.role).toUpperCase().trim() : '';
        const isStaff = ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(normalizedRole);

        if (isStaff) {
          navigate('/admin', { replace: true });
          return;
        }

        const fetchedAvatar = prof?.avatar_url || null;
        setProfile({ ...prof, email: user.email, avatar_url: fetchedAvatar });
        setAvatarUrl(fetchedAvatar);

        if (normalizedRole === 'AMBASSADOR') {
          const { data: amb } = await supabase.from('ambassador').select('*').eq('user_id', user.id).maybeSingle();
          setAmbassadorData(amb);
          if (amb) {
            setCurrentSlug(amb.assigned_slug || '');
            setCurrentPayoutDetails(amb.payout_details || '');

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
        setNewPayoutNumber('');
      }
    } finally {
      setLoading(false);
      setIsPageLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFeedback(null);
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
      setAvatarFeedback({ type: 'error', text: 'User profile ID missing.' });
      return;
    }

    try {
      setUploadingAvatar(true);
      setCropModalOpen(false);
      setAvatarFeedback(null);

      if (avatarUrl) {
        await deleteFromCloudinary(stripQueryParams(avatarUrl));
      }

      const uniquePublicId = `${profile.id}_${Date.now()}`;
      const uploadedUrl = await uploadToCloudinary(croppedFile, 'avatars', uniquePublicId);

      if (uploadedUrl) {
        const cleanUploadedUrl = stripQueryParams(uploadedUrl);
        const urlWithCacheBust = `${cleanUploadedUrl}?v=${Date.now()}`;

        const { data, error } = await supabase
          .from('profiles')
          .update({ avatar_url: urlWithCacheBust })
          .eq('id', profile.id)
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          setAvatarFeedback({ type: 'error', text: 'Database permission denied or row not found.' });
          return;
        }

        setAvatarUrl(urlWithCacheBust);
        setProfile((prev: any) => ({ ...prev, avatar_url: urlWithCacheBust }));
        setAvatarFeedback({ type: 'success', text: 'Profile picture updated.' });
      } else {
        setAvatarFeedback({ type: 'error', text: 'Image upload failed. Please try again.' });
      }
    } catch (err: any) {
      setAvatarFeedback({
        type: 'error',
        text: err?.message || 'Failed to upload profile picture.'
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.id) return;

    try {
      setUploadingAvatar(true);
      setAvatarFeedback(null);

      const currentUrl = avatarUrl || profile?.avatar_url;
      if (currentUrl) {
        await deleteFromCloudinary(stripQueryParams(currentUrl));
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        setAvatarFeedback({ type: 'error', text: 'Could not remove profile picture.' });
        return;
      }

      setAvatarUrl(null);
      setProfile((prev: any) => ({ ...prev, avatar_url: null }));
      setAvatarFeedback({ type: 'success', text: 'Profile picture removed.' });
    } catch (err: any) {
      setAvatarFeedback({
        type: 'error',
        text: err?.message || 'Failed to remove profile picture.'
      });
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
    setDeleteAccountError(null);

    if (!deleteConfirmPassword) {
      setDeleteAccountError('Password is required to delete account.');
      return;
    }

    setDeletingAccount(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: deleteConfirmPassword
      });

      if (authError) {
        setDeleteAccountError('Incorrect password. Account deletion failed.');
        setDeletingAccount(false);
        return;
      }

      const { error } = await supabase.rpc('delete_user');
      if (error) {
        setDeleteAccountError(error.message || 'Could not delete account.');
        setDeletingAccount(false);
      } else {
        setShowConfirm(false);
        localStorage.removeItem('currentView');
        localStorage.removeItem('portalMode');
        await supabase.auth.signOut();
        window.location.href = '/';
      }
    } catch (err: any) {
      setDeleteAccountError(err?.message || 'Unexpected error deleting account.');
      setDeletingAccount(false);
    }
  };

  const handleUpdate = async () => {
    setSettingsFeedback(null);
    setFieldErrors({});

    try {
      let emailChanged = false;
      let otherChanges = false;
      let passwordChanged = false;

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
        if (emailError) {
          setFieldErrors((prev) => ({ ...prev, email: emailError.message }));
          return;
        }
        emailChanged = true;
      }

      if (newPassword) {
        if (!currentPassword) {
          setFieldErrors((prev) => ({
            ...prev,
            password: 'Current password is required to change password.'
          }));
          return;
        }

        if (newPassword.length < 6) {
          setFieldErrors((prev) => ({
            ...prev,
            password: 'New password must be at least 6 characters long.'
          }));
          return;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: currentPassword
        });

        if (authError) {
          setFieldErrors((prev) => ({
            ...prev,
            password: 'Incorrect current password.'
          }));
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) {
          setFieldErrors((prev) => ({
            ...prev,
            password: passwordError.message
          }));
          return;
        }
        passwordChanged = true;
        otherChanges = true;
      }

      if (isAmbassador && profile?.id) {
        const updatesToAmb: any = {};

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
            setFieldErrors((prev) => ({
              ...prev,
              slug: 'This URL slug is already taken.'
            }));
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
            setSettingsFeedback({
              type: 'error',
              text: 'Update failed. Please check database permissions.'
            });
            return;
          }

          otherChanges = true;
        }
      }

      setCurrentPassword('');
      setNewPassword('');
      setDeleteConfirmPassword('');
      setNewSlug('');
      setNewPayoutNumber('');

      await fetchUserData();

      if (emailChanged) {
        setSettingsFeedback({
          type: 'success',
          text: 'Check your new email inbox to verify the change.'
        });
      } else if (passwordChanged) {
        setSettingsFeedback({
          type: 'success',
          text: 'Password updated successfully.'
        });
      } else if (otherChanges) {
        setSettingsFeedback({
          type: 'success',
          text: 'Settings updated successfully.'
        });
      }
    } catch (error: any) {
      setSettingsFeedback({
        type: 'error',
        text: error?.message || 'Failed to update settings.'
      });
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

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: view === 'notifications' || view === 'communication' ? '0' : '40px 20px', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '20px' }}>
          <div style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '25px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#ff4444', letterSpacing: '1px' }}>DELETE ACCOUNT</h3>
            <p style={{ fontSize: '13px', color: '#ccc', marginBottom: '20px' }}>This action is permanent. Enter your password to confirm deletion:</p>
            <input
              type="password"
              placeholder="Password"
              value={deleteConfirmPassword}
              onChange={(e) => {
                setDeleteConfirmPassword(e.target.value);
                if (deleteAccountError) setDeleteAccountError(null);
              }}
              style={{
                width: '100%',
                padding: '10px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: deleteAccountError ? '1px solid #F87171' : '1px solid #333',
                color: '#fff',
                marginBottom: deleteAccountError ? '8px' : '20px',
                outline: 'none',
                fontSize: '15px',
                boxSizing: 'border-box'
              }}
            />
            {deleteAccountError && (
              <p style={{ color: '#F87171', fontSize: '11px', margin: '0 0 16px 0' }}>
                {deleteAccountError}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => {
                  setShowConfirm(false);
                  setDeleteConfirmPassword('');
                  setDeleteAccountError(null);
                }}
                style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' }}>
                CANCEL
              </button>
              <button
                type="button"
                disabled={deletingAccount}
                onClick={handleDeleteAccount}
                style={{ background: '#ff4444', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: deletingAccount ? 'wait' : 'pointer', fontSize: '12px', letterSpacing: '1px', fontWeight: 'bold', opacity: deletingAccount ? 0.7 : 1 }}>
                {deletingAccount ? 'DELETING...' : 'DELETE'}
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
            targetAudience={['CUSTOMER', 'ALL', 'SPECIFIC']}
            onBack={() => {
              changeView('profile');
              fetchUnreadCounts();
            }}
          />
        ) : view === 'communication' ? (
          <CommunicationView
            userId={profile?.id}
            userEmail={profile?.email}
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
            avatarFeedback={avatarFeedback}
            clearAvatarFeedback={() => setAvatarFeedback(null)}
            fileInputRef={fileInputRef}
            newName={newName}
            newEmail={newEmail}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            currentSlug={currentSlug}
            newSlug={newSlug}
            setNewSlug={setNewSlug}
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
            settingsFeedback={settingsFeedback}
            clearSettingsFeedback={() => setSettingsFeedback(null)}
            fieldErrors={fieldErrors}
            clearFieldError={(field) =>
              setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
            }
            loading={loading}
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
              loading={loading}
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
