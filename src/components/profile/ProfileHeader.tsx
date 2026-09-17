import React from 'react';
import { MessageIcon, NotificationIcon, SettingsIcon } from '../icons';

interface ProfileHeaderProps {
  profile: any;
  avatarUrl: string | null;
  isAmbassador: boolean;
  isAmbassadorActive: boolean;
  togglePortalMode: () => void;
  getInitials: (name?: string, email?: string) => string;
  onChangeView: (view: 'profile' | 'settings' | 'notifications' | 'communication') => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  onOpenCommunication?: () => void;
  onOpenProfileDetails?: () => void;
  unreadCount?: number;
  hasUnread?: boolean;
  unreadMessagesCount?: number; // অপঠিত মেসেজ সংখ্যা
  unreadNotifCount?: number;    // অপঠিত নোটিফিকেশন সংখ্যা
  hasUnreadNotif?: boolean;     // নোটিফিকেশনের লাল ডটের জন্য
}

export default function ProfileHeader({
  profile,
  avatarUrl,
  isAmbassador,
  isAmbassadorActive,
  togglePortalMode,
  getInitials,
  onChangeView,
  onOpenMessages,
  onOpenNotifications,
  onOpenCommunication,
  onOpenProfileDetails,
  unreadCount = 0,
  hasUnread = false,
  unreadMessagesCount,
  unreadNotifCount,
  hasUnreadNotif
}: ProfileHeaderProps) {
  const name = profile?.name || "PROFILE";

  const handleIconClick = () => {
    if (isAmbassadorActive) {
      if (onOpenCommunication) {
        onOpenCommunication();
      } else if (onOpenMessages) {
        onOpenMessages();
      }
    } else {
      if (onOpenNotifications) {
        onOpenNotifications();
      } else if (onOpenMessages) {
        onOpenMessages();
      }
    }
  };

  // অপঠিত মেসেজ এবং নোটিফিকেশন লজিক ফিল্টারিং
  const msgCount = unreadMessagesCount !== undefined 
    ? unreadMessagesCount 
    : (isAmbassadorActive ? unreadCount : 0);

  const notifCount = unreadNotifCount !== undefined 
    ? unreadNotifCount 
    : (!isAmbassadorActive ? unreadCount : 0);

  const isNotifUnread = hasUnreadNotif !== undefined 
    ? hasUnreadNotif 
    : (notifCount > 0 || hasUnread);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '24px',
      width: '100%',
      gap: '8px'
    }}>
      {/* বামপাশ: অ্যাভাটার ও ইউজার ইনফো */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        flex: 1, 
        minWidth: 0 
      }}>
        {/* ১. প্রোফাইল ছবি/অ্যাভাটার */}
        <div 
          onClick={isAmbassador ? togglePortalMode : undefined}
          title={isAmbassador ? "Click to switch profile mode" : "Profile Picture"}
          style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            backgroundColor: '#121212', 
            border: isAmbassadorActive ? '1.5px solid #FFFFFF' : '1px solid #27272A', 
            boxShadow: isAmbassadorActive ? '0 0 10px rgba(255, 255, 255, 0.2)' : 'none',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: '600', 
            fontSize: '13px', 
            color: '#FFFFFF', 
            flexShrink: 0,
            cursor: isAmbassador ? 'pointer' : 'default',
            userSelect: 'none',
            transition: 'all 0.2s ease',
            overflow: 'hidden'
          }}>
          {avatarUrl && isAmbassadorActive ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(name, profile?.email)
          )}
        </div>

        {/* ২. নাম এবং সাবটাইটেল */}
        <div 
          onClick={onOpenProfileDetails}
          title="Click to view full details"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            flex: 1, 
            minWidth: 0,
            cursor: 'pointer',
            userSelect: 'none'
          }}>
          <h2 
            style={{ 
              margin: 0, 
              fontSize: '15px', 
              fontWeight: '600', 
              color: '#FFFFFF', 
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.2'
            }}
          >
            {name}
          </h2>

          {isAmbassadorActive ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: '#10B981'
              }} />
              <span style={{ 
                fontSize: '10px', 
                color: '#A1A1AA', 
                fontWeight: '500',
                letterSpacing: '0.6px',
                textTransform: 'uppercase'
              }}>
                AMBASSADOR
              </span>
            </div>
          ) : (
            <span style={{ 
              fontSize: '11px', 
              color: '#71717A', 
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {profile?.email || ''}
            </span>
          )}
        </div>
      </div>

      {/* ডানপাশ: আইকন বাটনসমূহ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={handleIconClick}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            background: '#121212', 
            border: '1px solid #27272A',
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            color: '#FFFFFF',
            outline: 'none',
            position: 'relative'
          }}
          title={isAmbassadorActive ? "Communication" : "Notifications"}
        >
          {isAmbassadorActive ? (
            <MessageIcon width={17} height={17} stroke="#FFFFFF" />
          ) : (
            <NotificationIcon width={17} height={17} stroke="#FFFFFF" />
          )}

          {/* ব্যাজ ইন্ডিকেটর */}
          {isAmbassadorActive ? (
            /* অ্যাম্বাসেডর মোড: কেবল অপঠিত মেসেজের সংখ্যা দেখাবে */
            msgCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 'bold',
                borderRadius: '10px',
                minWidth: '15px',
                height: '15px',
                padding: '0 3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #000000',
                lineHeight: 1
              }}>
                {msgCount > 99 ? '99+' : msgCount}
              </span>
            )
          ) : (
            /* সাধারণ ইউজার মোড: নোটিফিকেশন সংখ্যা বা লাল ডট দেখাবে */
            notifCount > 0 ? (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 'bold',
                borderRadius: '10px',
                minWidth: '15px',
                height: '15px',
                padding: '0 3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #000000',
                lineHeight: 1
              }}>
                {notifCount > 99 ? '99+' : notifCount}
              </span>
            ) : isNotifUnread ? (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#EF4444',
                borderRadius: '50%',
                border: '1.5px solid #000000'
              }} />
            ) : null
          )}
        </button>

        <button
          onClick={() => onChangeView('settings')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            background: '#121212', 
            border: '1px solid #27272A',
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            color: '#FFFFFF',
            outline: 'none'
          }}
          title="Settings"
        >
          <SettingsIcon width={17} height={17} stroke="#FFFFFF" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
