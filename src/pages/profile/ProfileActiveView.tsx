import React from 'react';
import OrderHistory from '../../components/shop/orders/OrderHistory';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileSettings from '../../components/profile/ProfileSettings';
import NotificationsView from '../../components/profile/NotificationsView';
import CommunicationView from '../../components/profile/CommunicationView';
import AmbassadorDashboardSection from './AmbassadorDashboardSection';
import { ProfileViewType, getInitials } from './profileTypes';

interface ProfileActiveViewProps {
  view: ProfileViewType;
  profile: any;
  ambassadorData: any;
  avatarUrl: string | null;
  portalMode: 'customer' | 'ambassador';
  isAmbassador: boolean;
  isAmbassadorActive: boolean;
  loading: boolean;
  unreadNotifCount: number;
  unreadMessagesCount: number;
  uploadingAvatar: boolean;
  avatarFeedback: { type: 'success' | 'error'; text: string } | null;
  clearAvatarFeedback: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  newName: string;
  setNewName: (val: string) => void;
  newEmail: string;
  setNewEmail: (val: string) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  currentSlug: string;
  newSlug: string;
  setNewSlug: (val: string) => void;
  payoutMethod: string;
  setPayoutMethod: (val: string) => void;
  currentPayoutDetails: string;
  newPayoutNumber: string;
  setNewPayoutNumber: (val: string) => void;
  settingsFeedback: { type: 'success' | 'error'; text: string } | null;
  clearSettingsFeedback: () => void;
  fieldErrors: {
    name?: string;
    email?: string;
    slug?: string;
    payoutNumber?: string;
    password?: string;
  };
  clearFieldError: (field: string) => void;
  onChangeView: (newView: ProfileViewType) => void;
  onFetchUnreadCounts: () => void;
  onTogglePortalMode: () => void;
  onOpenProfileDetails: () => void;
  onDeleteAvatar: () => void;
  onUpdate: () => void;
  onSignOut: () => void;
  onOpenDeleteConfirm: () => void;
}

export default function ProfileActiveView({
  view,
  profile,
  ambassadorData,
  avatarUrl,
  portalMode,
  isAmbassador,
  isAmbassadorActive,
  loading,
  unreadNotifCount,
  unreadMessagesCount,
  uploadingAvatar,
  avatarFeedback,
  clearAvatarFeedback,
  fileInputRef,
  newName,
  setNewName,
  newEmail,
  setNewEmail,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  currentSlug,
  newSlug,
  setNewSlug,
  payoutMethod,
  setPayoutMethod,
  currentPayoutDetails,
  newPayoutNumber,
  setNewPayoutNumber,
  settingsFeedback,
  clearSettingsFeedback,
  fieldErrors,
  clearFieldError,
  onChangeView,
  onFetchUnreadCounts,
  onTogglePortalMode,
  onOpenProfileDetails,
  onDeleteAvatar,
  onUpdate,
  onSignOut,
  onOpenDeleteConfirm,
}: ProfileActiveViewProps) {
  if (view === 'notifications') {
    return (
      <NotificationsView
        userId={profile?.id}
        targetAudience={['CUSTOMER', 'ALL', 'SPECIFIC']}
        onBack={() => {
          onChangeView('profile');
          onFetchUnreadCounts();
        }}
      />
    );
  }

  if (view === 'communication') {
    return (
      <CommunicationView
        userId={profile?.id}
        userEmail={profile?.email}
        onBack={() => {
          onChangeView('profile');
          onFetchUnreadCounts();
        }}
      />
    );
  }

  if (view === 'settings') {
    return (
      <ProfileSettings
        profile={profile}
        avatarUrl={avatarUrl}
        isAmbassadorActive={isAmbassadorActive}
        uploadingAvatar={uploadingAvatar}
        avatarFeedback={avatarFeedback}
        clearAvatarFeedback={clearAvatarFeedback}
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
        handleDeleteAvatar={onDeleteAvatar}
        handleUpdate={onUpdate}
        handleSignOut={onSignOut}
        setShowConfirm={onOpenDeleteConfirm}
        onChangeView={onChangeView}
        settingsFeedback={settingsFeedback}
        clearSettingsFeedback={clearSettingsFeedback}
        fieldErrors={fieldErrors}
        clearFieldError={clearFieldError}
        loading={loading}
      />
    );
  }

  return (
    <>
      <ProfileHeader
        profile={profile}
        avatarUrl={avatarUrl}
        isAmbassador={isAmbassador}
        isAmbassadorActive={isAmbassadorActive}
        togglePortalMode={onTogglePortalMode}
        getInitials={getInitials}
        onChangeView={onChangeView}
        onOpenProfileDetails={onOpenProfileDetails}
        onOpenNotifications={() => onChangeView('notifications')}
        onOpenCommunication={() => onChangeView('communication')}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotifCount={unreadNotifCount}
        hasUnreadNotif={unreadNotifCount > 0}
        loading={loading}
      />

      {!loading &&
        (portalMode === 'ambassador' && isAmbassador ? (
          <AmbassadorDashboardSection
            ambassadorData={ambassadorData}
            profile={profile}
          />
        ) : (
          <div
            style={{
              marginTop: '20px',
              borderTop: '1px solid #111',
              paddingTop: '10px',
            }}
          >
            <OrderHistory userId={profile?.id} />
          </div>
        ))}
    </>
  );
}
