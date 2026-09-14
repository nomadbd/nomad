import React from 'react';
import { MessageIcon, NotificationIcon, SettingsIcon } from '../icons';

interface ProfileHeaderProps {
  profile: any;
  avatarUrl: string | null;
  isAmbassador: boolean;
  isAmbassadorActive: boolean;
  togglePortalMode: () => void;
  getInitials: (name?: string, email?: string) => string;
  onChangeView: (view: 'profile' | 'settings') => void;
  onOpenMessages?: () => void;
  hasUnread?: boolean; // নতুন মেসেজ/নোটিফিকেশন আছে কিনা
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
  hasUnread = false
}: ProfileHeaderProps) {
  const name = profile?.name || "PROFILE";

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
        {/* অ্যাভাটার */}
        <div 
          onClick={togglePortalMode}
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

        {/* নাম এবং সাবটাইটেল/রোল ব্যাজ */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          flex: 1, 
          minWidth: 0 
        }}>
          <h2 
            title={name}
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

          {/* ইমেইলের বদলে মার্জিত রোল ইন্ডিকেটর */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
            <span style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: isAmbassadorActive ? '#10B981' : '#71717A' // এক্টিভ থাকলে গ্রিন ডট
            }} />
            <span style={{ 
              fontSize: '10px', 
              color: isAmbassadorActive ? '#A1A1AA' : '#71717A', 
              fontWeight: '500',
              letterSpacing: '0.6px',
              textTransform: 'uppercase'
            }}>
              {isAmbassadorActive ? 'AMBASSADOR' : 'CUSTOMER'}
            </span>
          </div>
        </div>
      </div>

      {/* ডানপাশ: কমপ্যাক্ট আইকন বাটন */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        flexShrink: 0 
      }}>
        {/* মেসেজ / নোটিফিকেশন বাটন */}
        <button
          onClick={onOpenMessages}
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
          title={isAmbassadorActive ? "Messages" : "Notifications"}
        >
          {isAmbassadorActive ? (
            <MessageIcon width={17} height={17} stroke="#FFFFFF" />
          ) : (
            <NotificationIcon width={17} height={17} stroke="#FFFFFF" />
          )}

          {/* অনরিড মেসেজ/নোটিফিকেশন ডট */}
          {hasUnread && (
            <span style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '6px',
              height: '6px',
              backgroundColor: '#EF4444',
              borderRadius: '50%',
              boxShadow: '0 0 6px #EF4444'
            }} />
          )}
        </button>

        {/* সেটিংস বাটন */}
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
