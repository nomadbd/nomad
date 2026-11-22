import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { uploadToCloudinary, deleteFromCloudinary } from '../../cloudinary';
import { useGlobalLoading } from '../../context/LoadingContext';
import ProfileDetailsSheet from '../../components/profile/ProfileDetailsSheet';
import ImageCropModal from '../../components/ui/ImageCropModal';
import DeleteAccountModal from './DeleteAccountModal';
import ProfileActiveView from './ProfileActiveView';
import { useProfileUnreadCounts } from './useProfileUnreadCounts';
import {
  ProfileViewType,
  stripQueryParams,
  resolveSkeletonViewForState,
  getInitials,
} from './profileTypes';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { setIsPageLoading } = useGlobalLoading();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pageLoadingTokenRef = useRef<number | null>(null);

  const initialView: ProfileViewType = (() => {
    const saved = localStorage.getItem(
      'currentView'
    ) as ProfileViewType | null;

    if (
      saved === 'settings' ||
      saved === 'notifications' ||
      saved === 'communication' ||
      saved === 'profile'
    ) {
      return saved;
    }

    return 'profile';
  })();

  const initialPortalMode: 'customer' | 'ambassador' = (() => {
    const saved = localStorage.getItem('portalMode');
    return saved === 'ambassador' ? 'ambassador' : 'customer';
  })();

  const [view, setView] =
    useState<ProfileViewType>(initialView);

  const [portalMode, setPortalMode] =
    useState<'customer' | 'ambassador'>(
      initialPortalMode
    );

  const [isDetailsSheetOpen, setIsDetailsSheetOpen] =
    useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [ambassadorData, setAmbassadorData] =
    useState<any>(null);
  const [, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] =
    useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] =
    useState('');
  const [deleteAccountError, setDeleteAccountError] =
    useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const [currentSlug, setCurrentSlug] = useState('');
  const [newSlug, setNewSlug] = useState('');

  const [payoutMethod, setPayoutMethod] =
    useState('bKash');
  const [currentPayoutDetails, setCurrentPayoutDetails] =
    useState('');
  const [newPayoutNumber, setNewPayoutNumber] =
    useState('');

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [avatarFeedback, setAvatarFeedback] =
    useState<{
      type: 'success' | 'error';
      text: string;
    } | null>(null);

  const [settingsFeedback, setSettingsFeedback] =
    useState<{
      type: 'success' | 'error';
      text: string;
    } | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    slug?: string;
    payoutNumber?: string;
    password?: string;
  }>({});

  const [showConfirm, setShowConfirm] = useState(false);
  const [cropModalOpen, setCropModalOpen] =
    useState(false);
  const [selectedImageSrc, setSelectedImageSrc] =
    useState<string | null>(null);

  const isAmbassador =
    String(profile?.role).toUpperCase().trim() ===
    'AMBASSADOR';

  const isAmbassadorActive =
    Boolean(
      profile &&
        isAmbassador &&
        portalMode === 'ambassador'
    );

  const resolvedAmbassadorMode =
    profile
      ? isAmbassadorActive
      : initialPortalMode === 'ambassador';

  const {
    unreadNotifCount,
    unreadMessagesCount,
    fetchUnreadCounts,
  } = useProfileUnreadCounts(profile?.id, isAmbassadorActive);

  const startPageLoading = useCallback(
    (
      targetView: ProfileViewType,
      targetAmbassadorActive: boolean
    ) => {
      const token = setIsPageLoading(true, {
        view: resolveSkeletonViewForState(
          targetView,
          targetAmbassadorActive
        ),
        isAmbassador: targetAmbassadorActive,
      });

      pageLoadingTokenRef.current = token;
      return token;
    },
    [setIsPageLoading]
  );

  const stopPageLoading = useCallback(
    (token = pageLoadingTokenRef.current) => {
      if (token === null) return;

      setIsPageLoading(false, undefined, token);

      if (pageLoadingTokenRef.current === token) {
        pageLoadingTokenRef.current = null;
      }
    },
    [setIsPageLoading]
  );

  useEffect(() => {
    if (loading) {
      startPageLoading(view, resolvedAmbassadorMode);
    } else {
      stopPageLoading();
    }
  }, [
    loading,
    view,
    resolvedAmbassadorMode,
    startPageLoading,
    stopPageLoading,
  ]);

  useEffect(() => {
    return () => {
      stopPageLoading();
    };
  }, [stopPageLoading]);

  const changeView = (newView: ProfileViewType) => {
    setView(newView);
    localStorage.setItem('currentView', newView);
    setSettingsFeedback(null);
    setFieldErrors({});

    if (loading) {
      startPageLoading(newView, resolvedAmbassadorMode);
    }
  };

  const fetchUserData = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setSession({ user });

      const cleanEmail = (user.email || '').toLowerCase();
      const userInviteToken =
        user.user_metadata?.invite_token;

      let pendingInvite: any = null;

      if (userInviteToken) {
        const { data: inviteByToken } =
          await supabase
            .from('ambassador')
            .select('*')
            .eq('token', userInviteToken)
            .eq('is_registered', false)
            .maybeSingle();

        pendingInvite = inviteByToken;
      }

      if (!pendingInvite && cleanEmail) {
        const { data: inviteByEmail } =
          await supabase
            .from('ambassador')
            .select('*')
            .or(
              `email.eq.${cleanEmail},recipient_identifier.eq.${cleanEmail}`
            )
            .eq('is_registered', false)
            .maybeSingle();

        pendingInvite = inviteByEmail;
      }

      if (pendingInvite) {
        await supabase.rpc(
          'complete_ambassador_registration',
          {
            invite_token: pendingInvite.token,
            new_user_id: user.id,
            user_email: cleanEmail,
            user_name:
              user.user_metadata?.full_name ||
              pendingInvite.display_name ||
              '',
          }
        );
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const normalizedRole =
        prof?.role
          ? String(prof.role).toUpperCase().trim()
          : '';

      const isStaff = [
        'SUPER_ADMIN',
        'ADMIN',
        'STAFF',
      ].includes(normalizedRole);

      if (isStaff) {
        navigate('/admin', { replace: true });
        return;
      }

      const fetchedAvatar =
        prof?.avatar_url || null;

      setProfile({
        ...prof,
        email: user.email,
        avatar_url: fetchedAvatar,
      });

      setAvatarUrl(fetchedAvatar);

      if (normalizedRole === 'AMBASSADOR') {
        const { data: amb } = await supabase
          .from('ambassador')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setAmbassadorData(amb);

        if (amb) {
          setCurrentSlug(
            amb.assigned_slug || ''
          );
          setCurrentPayoutDetails(
            amb.payout_details || ''
          );

          if (
            amb.payout_details &&
            amb.payout_details.includes(':')
          ) {
            const [method] =
              amb.payout_details.split(':');

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
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarFeedback(null);

    const reader = new FileReader();

    reader.onload = () => {
      setSelectedImageSrc(
        reader.result as string
      );
      setCropModalOpen(true);
    };

    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const handleApplyCropAndUpload =
    async (croppedFile: File) => {
      if (!profile?.id) {
        setAvatarFeedback({
          type: 'error',
          text: 'User profile ID missing.',
        });
        return;
      }

      try {
        setUploadingAvatar(true);
        setCropModalOpen(false);
        setAvatarFeedback(null);

        if (avatarUrl) {
          await deleteFromCloudinary(
            stripQueryParams(avatarUrl)
          );
        }

        const uniquePublicId =
          `${profile.id}_${Date.now()}`;

        const uploadedUrl =
          await uploadToCloudinary(
            croppedFile,
            'avatars',
            uniquePublicId
          );

        if (!uploadedUrl) {
          setAvatarFeedback({
            type: 'error',
            text:
              'Image upload failed. Please try again.',
          });
          return;
        }

        const cleanUploadedUrl =
          stripQueryParams(uploadedUrl);

        const urlWithCacheBust =
          `${cleanUploadedUrl}?v=${Date.now()}`;

        const { data, error } =
          await supabase
            .from('profiles')
            .update({
              avatar_url: urlWithCacheBust,
            })
            .eq('id', profile.id)
            .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          setAvatarFeedback({
            type: 'error',
            text:
              'Database permission denied or row not found.',
          });
          return;
        }

        setAvatarUrl(urlWithCacheBust);

        setProfile((previous: any) => ({
          ...previous,
          avatar_url: urlWithCacheBust,
        }));

        setAvatarFeedback({
          type: 'success',
          text: 'Profile picture updated.',
        });
      } catch (err: any) {
        setAvatarFeedback({
          type: 'error',
          text:
            err?.message ||
            'Failed to upload profile picture.',
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

      const currentUrl =
        avatarUrl || profile?.avatar_url;

      if (currentUrl) {
        await deleteFromCloudinary(
          stripQueryParams(currentUrl)
        );
      }

      const { data, error } =
        await supabase
          .from('profiles')
          .update({
            avatar_url: null,
          })
          .eq('id', profile.id)
          .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        setAvatarFeedback({
          type: 'error',
          text:
            'Could not remove profile picture.',
        });
        return;
      }

      setAvatarUrl(null);

      setProfile((previous: any) => ({
        ...previous,
        avatar_url: null,
      }));

      setAvatarFeedback({
        type: 'success',
        text:
          'Profile picture removed.',
      });
    } catch (err: any) {
      setAvatarFeedback({
        type: 'error',
        text:
          err?.message ||
          'Failed to remove profile picture.',
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
      setDeleteAccountError(
        'Password is required to delete account.'
      );
      return;
    }

    setDeletingAccount(true);

    try {
      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: profile.email,
          password:
            deleteConfirmPassword,
        });

      if (authError) {
        setDeleteAccountError(
          'Incorrect password. Account deletion failed.'
        );
        setDeletingAccount(false);
        return;
      }

      const { error } =
        await supabase.rpc('delete_user');

      if (error) {
        setDeleteAccountError(
          error.message ||
            'Could not delete account.'
        );
        setDeletingAccount(false);
      } else {
        setShowConfirm(false);

        localStorage.removeItem(
          'currentView'
        );
        localStorage.removeItem(
          'portalMode'
        );

        await supabase.auth.signOut();

        window.location.href =
          '/';
      }
    } catch (err: any) {
      setDeleteAccountError(
        err?.message ||
          'Unexpected error deleting account.'
      );
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

      if (
        newName.trim() &&
        newName !== profile?.name
      ) {
        const { error } =
          await supabase
            .from('profiles')
            .update({
              name: newName.trim(),
            })
            .eq('id', profile.id);

        if (error) throw error;
        otherChanges = true;
      }

      if (
        newEmail.trim() &&
        newEmail !== profile?.email
      ) {
        const { error } =
          await supabase.auth.updateUser({
            email:
              newEmail.trim(),
          });

        if (error) {
          setFieldErrors({
            email:
              error.message,
          });
          return;
        }

        emailChanged = true;
      }

      if (newPassword) {
        if (!currentPassword) {
          setFieldErrors({
            password:
              'Current password is required to change password.',
          });
          return;
        }

        if (
          newPassword.length < 6
        ) {
          setFieldErrors({
            password:
              'New password must be at least 6 characters long.',
          });
          return;
        }

        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email:
              profile.email,
            password:
              currentPassword,
          });

        if (authError) {
          setFieldErrors({
            password:
              'Incorrect current password.',
          });
          return;
        }

        const { error: passwordError } =
          await supabase.auth.updateUser({
            password:
              newPassword,
          });

        if (passwordError) {
          setFieldErrors({
            password:
              passwordError.message,
          });
          return;
        }

        passwordChanged = true;
        otherChanges = true;
      }

      if (
        isAmbassador &&
        profile?.id
      ) {
        const updatesToAmb: any =
          {};

        const getFallbackSlug = (
          name?: string
        ) => {
          if (!name?.trim()) {
            return '';
          }

          return name
            .trim()
            .toLowerCase()
            .replace(
              /\s+/g,
              '-'
            )
            .replace(
              /[^a-z0-9-]/g,
              ''
            );
        };

        const targetSlug =
          newSlug.trim()
            ? newSlug
                .trim()
                .toLowerCase()
                .replace(
                  /[^a-z0-9-]/g,
                  '-'
                )
            : !currentSlug
              ? getFallbackSlug(
                  profile?.name
                )
              : '';

        if (
          targetSlug &&
          targetSlug !== currentSlug
        ) {
          const { data: existing } =
            await supabase
              .from('ambassador')
              .select(
                'id, user_id'
              )
              .eq(
                'assigned_slug',
                targetSlug
              )
              .neq(
                'user_id',
                profile.id
              )
              .maybeSingle();

          if (existing) {
            setFieldErrors({
              slug:
                'This URL slug is already taken.',
            });
            return;
          }

          updatesToAmb.assigned_slug =
            targetSlug;
        }

        if (
          newPayoutNumber.trim()
        ) {
          updatesToAmb.payout_details =
            `${payoutMethod}: ${newPayoutNumber.trim()}`;
        }

        if (
          Object.keys(
            updatesToAmb
          ).length > 0
        ) {
          const {
            data: ambassadorUpdate,
            error:
              ambassadorError,
          } =
            await supabase
              .from('ambassador')
              .update(
                updatesToAmb
              )
              .eq(
                'user_id',
                profile.id
              )
              .select();

          if (
            ambassadorError
          ) {
            throw ambassadorError;
          }

          if (
            !ambassadorUpdate ||
            ambassadorUpdate.length ===
              0
          ) {
            setSettingsFeedback({
              type: 'error',
              text:
                'Update failed. Please check database permissions.',
            });
            return;
          }

          otherChanges =
            true;
        }
      }

      setCurrentPassword(
        ''
      );
      setNewPassword(
        ''
      );
      setDeleteConfirmPassword(
        ''
      );
      setNewSlug(
        ''
      );
      setNewPayoutNumber(
        ''
      );

      await fetchUserData();

      if (
        emailChanged
      ) {
        setSettingsFeedback({
          type: 'success',
          text:
            'Check your new email inbox to verify the change.',
        });
      } else if (
        passwordChanged
      ) {
        setSettingsFeedback({
          type: 'success',
          text:
            'Password updated successfully.',
        });
      } else if (
        otherChanges
      ) {
        setSettingsFeedback({
          type: 'success',
          text:
            'Settings updated successfully.',
        });
      }
    } catch (error: any) {
      setSettingsFeedback({
        type: 'error',
        text:
          error?.message ||
          'Failed to update settings.',
      });
    }
  };

  const togglePortalMode =
    () => {
      if (!isAmbassador) {
        return;
      }

      const nextMode =
        portalMode ===
        'customer'
          ? 'ambassador'
          : 'customer';

      setPortalMode(
        nextMode
      );
      localStorage.setItem(
        'portalMode',
        nextMode
      );

      const token = startPageLoading(
        view,
        nextMode === 'ambassador'
      );

      window.requestAnimationFrame(
        () => {
          stopPageLoading(token);
        }
      );
    };

  return (
    <div
      style={{
        backgroundColor:
          '#000',
        minHeight:
          '100vh',
        color:
          '#fff',
        padding:
          view ===
            'notifications' ||
          view ===
            'communication'
            ? '0'
            : '40px 20px',
        fontFamily:
          "'Inter', sans-serif",
        width:
          '100%',
        boxSizing:
          'border-box',
      }}
    >
      <input
        type="file"
        ref={
          fileInputRef
        }
        onChange={
          handleFileSelect
        }
        accept="image/*"
        style={{
          display:
            'none',
        }}
      />

      <DeleteAccountModal
        isOpen={showConfirm}
        password={deleteConfirmPassword}
        error={deleteAccountError}
        deleting={deletingAccount}
        onPasswordChange={(value) => {
          setDeleteConfirmPassword(value);
          if (deleteAccountError) {
            setDeleteAccountError(null);
          }
        }}
        onCancel={() => {
          setShowConfirm(false);
          setDeleteConfirmPassword('');
          setDeleteAccountError(null);
        }}
        onConfirm={handleDeleteAccount}
      />

      <ImageCropModal
        isOpen={
          cropModalOpen
        }
        selectedImageSrc={
          selectedImageSrc
        }
        isAmbassadorActive={
          isAmbassadorActive
        }
        onClose={() =>
          setCropModalOpen(
            false
          )
        }
        onApply={
          handleApplyCropAndUpload
        }
      />

      <ProfileDetailsSheet
        isOpen={
          isDetailsSheetOpen
        }
        onClose={() =>
          setIsDetailsSheetOpen(
            false
          )
        }
        profile={
          profile
        }
        ambassadorData={
          ambassadorData
        }
        avatarUrl={
          avatarUrl
        }
        getInitials={
          getInitials
        }
        portalMode={
          portalMode
        }
        isAmbassador={
          isAmbassador
        }
      />

      <div
        style={{
          width:
            '100%',
        }}
      >
        <ProfileActiveView
          view={view}
          profile={profile}
          ambassadorData={ambassadorData}
          avatarUrl={avatarUrl}
          portalMode={portalMode}
          isAmbassador={isAmbassador}
          isAmbassadorActive={isAmbassadorActive}
          loading={loading}
          unreadNotifCount={unreadNotifCount}
          unreadMessagesCount={unreadMessagesCount}
          uploadingAvatar={uploadingAvatar}
          avatarFeedback={avatarFeedback}
          clearAvatarFeedback={() => setAvatarFeedback(null)}
          fileInputRef={fileInputRef}
          newName={newName}
          setNewName={setNewName}
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          currentPassword={currentPassword}
          setCurrentPassword={setCurrentPassword}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          currentSlug={currentSlug}
          newSlug={newSlug}
          setNewSlug={setNewSlug}
          payoutMethod={payoutMethod}
          setPayoutMethod={setPayoutMethod}
          currentPayoutDetails={currentPayoutDetails}
          newPayoutNumber={newPayoutNumber}
          setNewPayoutNumber={setNewPayoutNumber}
          settingsFeedback={settingsFeedback}
          clearSettingsFeedback={() => setSettingsFeedback(null)}
          fieldErrors={fieldErrors}
          clearFieldError={(field) =>
            setFieldErrors((previous) => ({
              ...previous,
              [field]: undefined,
            }))
          }
          onChangeView={changeView}
          onFetchUnreadCounts={fetchUnreadCounts}
          onTogglePortalMode={togglePortalMode}
          onOpenProfileDetails={() => setIsDetailsSheetOpen(true)}
          onDeleteAvatar={handleDeleteAvatar}
          onUpdate={handleUpdate}
          onSignOut={handleSignOut}
          onOpenDeleteConfirm={() => setShowConfirm(true)}
        />
      </div>
    </div>
  );
}
