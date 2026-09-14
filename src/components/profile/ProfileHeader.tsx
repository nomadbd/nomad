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
}

export default function ProfileHeader({
  profile,
  avatarUrl,
  isAmbassador,
  isAmbassadorActive,
  togglePortalMode,
  getInitials,
  onChangeView,
  onOpenMessages
}: ProfileHeaderProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '20px',
      width: '100%'
    }}>
      {/* অ্যাভাটার ও ইউজার ইনফো */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div 
          onClick={togglePortalMode}
          style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            backgroundColor: '#181818', 
            border: isAmbassadorActive ? '1.5px solid #ffffff' : '1px solid #2a2a2a', 
            boxShadow: isAmbassadorActive ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: '600', 
            fontSize: '14px', 
            color: '#fff', 
            flexShrink: 0,
            cursor: isAmbassador ? 'pointer' : 'default',
            userSelect: 'none',
            transition: 'all 0.2s ease',
            overflow: 'hidden'
          }}>
          {avatarUrl && isAmbassadorActive ? (
            <img src={avatarUrl} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(profile?.name, profile?.email)
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '15px', 
            fontWeight: '600', 
            color: '#fff', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.2'
          }}>
            {profile?.name || "PROFILE"}
          </h2>
          <p style={{ 
            margin: '2px 0 0 0', 
            fontSize: '12px', 
            color: '#777', 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: '1.2'
          }}>
            {profile?.email}
          </p>
        </div>
      </div>

      {/* ডানপাশের ডাইনামিক আইকনসমূহ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <button
          onClick={onOpenMessages}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            background: 'transparent', 
            border: 'none', 
            padding: '6px',
            color: '#fff'
          }}
          title={isAmbassadorActive ? "Messages" : "Notifications"}
        >
          {isAmbassadorActive ? (
            <MessageIcon width={20} height={20} stroke="#ffffff" />
          ) : (
            <NotificationIcon width={20} height={20} stroke="#ffffff" />
          )}
        </button>

        <button
          onClick={() => onChangeView('settings')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            background: 'transparent', 
            border: 'none', 
            padding: '6px',
            color: '#fff'
          }}
          title="Settings"
        >
          <SettingsIcon width={20} height={20} stroke="#ffffff" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
 