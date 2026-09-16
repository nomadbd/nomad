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
  onOpenProfileDetails?: () => void; // বটম শিটের জন্য কলব্যাক
  unreadCount?: number;              // আনরিড নটিফিকেশনের সংখ্যা পাঠানোর জন্য
  hasUnread?: boolean;               // আনরিড স্ট্যাটাস (সংখ্যা না থাকলে ডট দেখাবে)
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
  hasUnread = false
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

  // আনরিড ব্যাজ দেখানোর সিদ্ধান্ত
  const showBadge = unreadCount > 0 || hasUnread;

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
        {/* ১. প্রোফাইল ছবি/অ্যাভাটার (ক্লিক করলে মোড সুইচ হবে) */}
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
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(name, profile?.email)
          )}
        </div>

        {/* ২. নাম এবং সাবটাইটেল (ক্লিক করলে বটম শিট খুলবে) */}
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

          {/* অ্যাম্বাসেডর এক্টিভ থাকলে ব্যাজ দেখাবে, কাস্টমার হলে ইমেইল দেখাবে */}
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
        {/* মূল নোটিফিকেশন/মেসেজ আইকন বাটন */}
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

          {/* মূল আইকনে আনরিড কাউন্ট / ব্যাজ */}
          {showBadge && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
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
              {unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : ''}
            </span>
          )}
        </button>

        {/* সেটিং আইকন বাটন */}
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
