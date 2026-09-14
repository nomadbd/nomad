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
  const name = profile?.name || "PROFILE";
  const email = profile?.email || "";

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '28px',
      width: '100%',
      gap: '12px'
    }}>
      {/* বামপাশ: অ্যাভাটার ও ইউজার ইনফো */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        flex: 1, 
        minWidth: 0 
      }}>
        {/* অ্যাভাটার */}
        <div 
          onClick={togglePortalMode}
          style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '50%', 
            backgroundColor: '#121212', 
            border: isAmbassadorActive ? '1.5px solid #FFFFFF' : '1px solid #27272A', 
            boxShadow: isAmbassadorActive ? '0 0 12px rgba(255, 255, 255, 0.25)' : 'none',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontWeight: '600', 
            fontSize: '14px', 
            color: '#FFFFFF', 
            flexShrink: 0,
            cursor: isAmbassador ? 'pointer' : 'default',
            userSelect: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}>
          {avatarUrl && isAmbassadorActive ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(name, email)
          )}
        </div>

        {/* ইনফো কন্টেইনার (লং টেক্সট নিরাপদ রাখার জন্য) */}
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
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.25'
            }}
          >
            {name}
          </h2>
          {email && (
            <p 
              title={email}
              style={{ 
                margin: '3px 0 0 0', 
                fontSize: '11px', 
                color: '#71717A', 
                fontFamily: 'monospace, sans-serif',
                letterSpacing: '0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: '1.2'
              }}
            >
              {email}
            </p>
          )}
        </div>
      </div>

      {/* ডানপাশ: প্রিমিয়াম আইকন ব্যাজ */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        flexShrink: 0 
      }}>
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
            width: '38px',
            height: '38px',
            color: '#FFFFFF',
            outline: 'none'
          }}
          title={isAmbassadorActive ? "Messages" : "Notifications"}
        >
          {isAmbassadorActive ? (
            <MessageIcon width={18} height={18} stroke="#FFFFFF" />
          ) : (
            <NotificationIcon width={18} height={18} stroke="#FFFFFF" />
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
            width: '38px',
            height: '38px',
            color: '#FFFFFF',
            outline: 'none'
          }}
          title="Settings"
        >
          <SettingsIcon width={18} height={18} stroke="#FFFFFF" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
