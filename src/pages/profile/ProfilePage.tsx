import OrderHistory from '../../components/shop/orders/OrderHistory';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfileSettings from '../../components/profile/ProfileSettings';
import ProfileDetailsSheet from '../../components/profile/ProfileDetailsSheet';
import NotificationsView from '../../components/profile/NotificationsView';
import CommunicationView from '../../components/profile/CommunicationView';
import ImageCropModal from '../../components/ui/ImageCropModal';
import AmbassadorDashboardSection from './AmbassadorDashboardSection';
import DeleteAccountModal from './DeleteAccountModal';
import { getInitials } from './profileTypes';
import { useProfileController } from './useProfileController';

export default function ProfilePage() {
  const ctrl = useProfileController();

  return (
    <div
      style={{
        backgroundColor: '#000',
        minHeight: '100vh',
        color: '#fff',
        padding:
          ctrl.view === 'notifications' || ctrl.view === 'communication'
            ? '0'
            : '40px 20px',
        fontFamily: "'Inter', sans-serif",
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <input
        type="file"
        ref={ctrl.fileInputRef}
        onChange={ctrl.handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <DeleteAccountModal
        isOpen={ctrl.showConfirm}
        deleteConfirmPassword={ctrl.deleteConfirmPassword}
        deleteAccountError={ctrl.deleteAccountError}
        deletingAccount={ctrl.deletingAccount}
        onPasswordChange={(value) => {
          ctrl.setDeleteConfirmPassword(value);
          if (ctrl.deleteAccountError) {
            ctrl.setDeleteAccountError(null);
          }
        }}
        onCancel={() => {
          ctrl.setShowConfirm(false);
          ctrl.setDeleteConfirmPassword('');
          ctrl.setDeleteAccountError(null);
        }}
        onConfirm={ctrl.handleDeleteAccount}
      />

      <ImageCropModal
        isOpen={ctrl.cropModalOpen}
        selectedImageSrc={ctrl.selectedImageSrc}
        isAmbassadorActive={ctrl.isAmbassadorActive}
        onClose={() => ctrl.setCropModalOpen(false)}
        onApply={ctrl.handleApplyCropAndUpload}
      />

      <ProfileDetailsSheet
        isOpen={ctrl.isDetailsSheetOpen}
        onClose={() => ctrl.setIsDetailsSheetOpen(false)}
        profile={ctrl.profile}
        ambassadorData={ctrl.ambassadorData}
        avatarUrl={ctrl.avatarUrl}
        getInitials={getInitials}
        portalMode={ctrl.portalMode}
        isAmbassador={ctrl.isAmbassador}
      />

      <div style={{ width: '100%' }}>
        {ctrl.view === 'notifications' ? (
          <NotificationsView
            userId={ctrl.profile?.id}
            targetAudience={['CUSTOMER', 'ALL', 'SPECIFIC']}
            onBack={() => {
              ctrl.changeView('profile');
              ctrl.fetchUnreadCounts();
            }}
          />
        ) : ctrl.view === 'communication' ? (
          <CommunicationView
            userId={ctrl.profile?.id}
            userEmail={ctrl.profile?.email}
            onBack={() => {
              ctrl.changeView('profile');
              ctrl.fetchUnreadCounts();
            }}
          />
        ) : ctrl.view === 'settings' ? (
          <ProfileSettings
            profile={ctrl.profile}
            avatarUrl={ctrl.avatarUrl}
            isAmbassadorActive={ctrl.isAmbassadorActive}
            uploadingAvatar={ctrl.uploadingAvatar}
            avatarFeedback={ctrl.avatarFeedback}
            clearAvatarFeedback={() => ctrl.setAvatarFeedback(null)}
            fileInputRef={ctrl.fileInputRef}
            newName={ctrl.newName}
            newEmail={ctrl.newEmail}
            currentPassword={ctrl.currentPassword}
            setCurrentPassword={ctrl.setCurrentPassword}
            newPassword={ctrl.newPassword}
            currentSlug={ctrl.currentSlug}
            newSlug={ctrl.newSlug}
            setNewSlug={ctrl.setNewSlug}
            payoutMethod={ctrl.payoutMethod}
            setPayoutMethod={ctrl.setPayoutMethod}
            currentPayoutDetails={ctrl.currentPayoutDetails}
            newPayoutNumber={ctrl.newPayoutNumber}
            setNewPayoutNumber={ctrl.setNewPayoutNumber}
            setNewName={ctrl.setNewName}
            setNewEmail={ctrl.setNewEmail}
            setNewPassword={ctrl.setNewPassword}
            getInitials={getInitials}
            handleDeleteAvatar={ctrl.handleDeleteAvatar}
            handleUpdate={ctrl.handleUpdate}
            handleSignOut={ctrl.handleSignOut}
            setShowConfirm={ctrl.setShowConfirm}
            onChangeView={ctrl.changeView}
            settingsFeedback={ctrl.settingsFeedback}
            clearSettingsFeedback={() => ctrl.setSettingsFeedback(null)}
            fieldErrors={ctrl.fieldErrors}
            clearFieldError={(field) =>
              ctrl.setFieldErrors((previous) => ({
                ...previous,
                [field]: undefined,
              }))
            }
            loading={ctrl.loading}
          />
        ) : (
          <>
            <ProfileHeader
              profile={ctrl.profile}
              avatarUrl={ctrl.avatarUrl}
              isAmbassador={ctrl.isAmbassador}
              isAmbassadorActive={ctrl.isAmbassadorActive}
              togglePortalMode={ctrl.togglePortalMode}
              getInitials={getInitials}
              onChangeView={ctrl.changeView}
              onOpenProfileDetails={() => ctrl.setIsDetailsSheetOpen(true)}
              onOpenNotifications={() => ctrl.changeView('notifications')}
              onOpenCommunication={() => ctrl.changeView('communication')}
              unreadMessagesCount={ctrl.unreadMessagesCount}
              unreadNotifCount={ctrl.unreadNotifCount}
              hasUnreadNotif={ctrl.unreadNotifCount > 0}
              loading={ctrl.loading}
            />

            {!ctrl.loading &&
              (ctrl.portalMode === 'ambassador' && ctrl.isAmbassador ? (
                <AmbassadorDashboardSection
                  ambassadorData={ctrl.ambassadorData}
                  profile={ctrl.profile}
                />
              ) : (
                <div
                  style={{
                    marginTop: '20px',
                    borderTop: '1px solid #111',
                    paddingTop: '10px',
                  }}
                >
                  <OrderHistory userId={ctrl.profile?.id} />
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
