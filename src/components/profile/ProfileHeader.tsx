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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div 
          onClick={togglePortalMode}
          style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            backgroundColor: '#181818', 
            border: isAmbassadorActive ? '1px solid #ffffff' : '1px solid #2a2a2a', 
            boxShadow: isAmbassadorActive ? '0 0 15px rgba(255, 255, 255, 0.4)' : 'none',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: '600', 
            fontSize: '18px', 
            color: '#fff', 
            textShadow: isAmbassadorActive ? '0 0 8px #ffffff, 0 0 16px #ffffff' : 'none',
            flexShrink: 0,
            cursor: isAmbassador ? 'pointer' : 'default',
            userSelect: 'none',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            position: 'relative'
          }}>
          {avatarUrl && isAmbassadorActive ? (
            <img src={avatarUrl} alt="Profile Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(profile?.name, profile?.email)
          )}
        </div>

        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#fff', letterSpacing: '0.5px' }}>
            {profile?.name || "PROFILE"}
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>
            {profile?.email}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenMessages}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            background: 'transparent', 
            border: 'none', 
            padding: '8px',
            color: '#fff'
          }}
          title={isAmbassadorActive ? "Messages" : "Notifications"}
        >
          {isAmbassadorActive ? (
            <MessageIcon width={22} height={22} stroke="#ffffff" />
          ) : (
            <NotificationIcon width={22} height={22} stroke="#ffffff" />
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
            padding: '8px',
            color: '#fff'
          }}
          title="Settings"
        >
          <SettingsIcon width={22} height={22} stroke="#ffffff" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
