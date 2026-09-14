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
  onOpenProfileDetails?: () => void; // বটম শিট খোলার কলব্যাক
  hasUnread?: boolean;
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
  onOpenProfileDetails,
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
      gap: '12px'
    }}>
      {/* বামপাশ: নাম ও অ্যাভাটার (ক্লিক করলে বটম শিট ওপেন হবে) */}
      <div 
        onClick={onOpenProfileDetails}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          flex: 1, 
          minWidth: 0,
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        {/* অ্যাভাটার */}
        <div 
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
            overflow: 'hidden'
          }}>
          {avatarUrl && isAmbassadorActive ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(name, profile?.email)
          )}
        </div>

        {/* নাম ও সাবটাইটেল */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          flex: 1, 
          minWidth: 0 
        }}>
          <h2 
            style={{ 
              margin: 0, 
              fontSize: '16px', 
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

          {/* অ্যাম্বাসেডর একটিভ থাকলে ব্যাজ দেখাবে, না থাকলে আলতো সাবটাইটেল */}
          {isAmbassadorActive ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span style={{ fontSize: '10px', color: '#A1A1AA', fontWeight: '500', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                AMBASSADOR
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '11px', color: '#71717A', marginTop: '2px' }}>
              Tap for info
            </span>
          )}
        </div>
      </div>

      {/* ডানপাশ: আইকন বাটনসমূহ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
            width: '36px',
            height: '36px',
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

          {hasUnread && (
            <span style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              width: '6px',
              height: '6px',
              backgroundColor: '#EF4444',
              borderRadius: '50%'
            }} />
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
            width: '36px',
            height: '36px',
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
