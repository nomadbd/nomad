import React, { useState, useEffect, useRef } from 'react';
import { MessageIcon, NotificationIcon, SettingsIcon } from '../icons';

const animatedProfiles = new Set<string>();

interface ProfileHeaderProps {
  profile: any;
  avatarUrl: string | null;
  isAmbassador: boolean;
  isAmbassadorActive: boolean;
  togglePortalMode: () => void;
  getInitials: (name?: string, email?: string) => string;
  onChangeView: (
    view: 'profile' | 'settings' | 'notifications' | 'communication'
  ) => void;
  onOpenMessages?: () => void;
  onOpenNotifications?: () => void;
  onOpenCommunication?: () => void;
  onOpenProfileDetails?: () => void;
  unreadCount?: number;
  hasUnread?: boolean;
  unreadMessagesCount?: number;
  unreadNotifCount?: number;
  hasUnreadNotif?: boolean;
  loading?: boolean;
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
  hasUnreadNotif,
  loading = false,
}: ProfileHeaderProps) {
  const name = profile?.name || 'PROFILE';
  const profileKey =
    profile?.id || profile?.email || 'default_user';

  const hasAlreadyAnimated =
    animatedProfiles.has(profileKey);

  const [showGreeting, setShowGreeting] =
    useState(!hasAlreadyAnimated);
  const [fade, setFade] = useState(true);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (loading || !profile) return;

    if (hasAlreadyAnimated) {
      setShowGreeting(false);
      setFade(true);
      return;
    }

    setShowGreeting(true);
    setFade(true);

    const timer = window.setTimeout(() => {
      setFade(false);

      fadeTimeoutRef.current = window.setTimeout(() => {
        setShowGreeting(false);

        requestAnimationFrame(() => {
          setFade(true);
          animatedProfiles.add(profileKey);
        });
      }, 450);
    }, 2500);

    return () => {
      window.clearTimeout(timer);
      if (fadeTimeoutRef.current !== null) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [
    profileKey,
    hasAlreadyAnimated,
    loading,
    profile,
  ]);

  if (!profile && !loading) {
    return null;
  }

  const handleIconClick = () => {
    if (isAmbassadorActive) {
      if (onOpenCommunication) {
        onOpenCommunication();
      } else if (onOpenMessages) {
        onOpenMessages();
      }
    } else if (onOpenNotifications) {
      onOpenNotifications();
    } else if (onOpenMessages) {
      onOpenMessages();
    }
  };

  const msgCount =
    unreadMessagesCount !== undefined
      ? unreadMessagesCount
      : isAmbassadorActive
        ? unreadCount
        : 0;

  const notifCount =
    unreadNotifCount !== undefined
      ? unreadNotifCount
      : !isAmbassadorActive
        ? unreadCount
        : 0;

  const isNotifUnread =
    hasUnreadNotif !== undefined
      ? hasUnreadNotif
      : notifCount > 0 || hasUnread;

  const smoothTextStyle: React.CSSProperties = {
    opacity: fade ? 1 : 0,
    filter: fade ? 'blur(0px)' : 'blur(3px)',
    transform: fade
      ? 'translateY(0)'
      : 'translateY(-2px)',
    transition:
      'opacity 450ms ease-in-out, filter 450ms ease-in-out, transform 450ms ease-in-out',
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1F1F22',
        padding: '10px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1,
          minWidth: 0,
          marginRight: '8px',
        }}
      >
        <div
          onClick={
            isAmbassador
              ? togglePortalMode
              : undefined
          }
          title={
            isAmbassador
              ? 'Click to switch profile mode'
              : 'Profile Picture'
          }
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#121212',
            border: isAmbassadorActive
              ? '1.5px solid #FFFFFF'
              : '1px solid #27272A',
            boxShadow: isAmbassadorActive
              ? '0 0 8px rgba(255, 255, 255, 0.2)'
              : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '13px',
            color: '#FFFFFF',
            flexShrink: 0,
            cursor: isAmbassador
              ? 'pointer'
              : 'default',
            userSelect: 'none',
            transition: 'all 0.2s ease',
            overflow: 'hidden',
          }}
        >
          {avatarUrl && isAmbassadorActive ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            getInitials(name, profile?.email)
          )}
        </div>

        <div
          onClick={onOpenProfileDetails}
          title="Click to view full details"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '40px',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <h2
            key={showGreeting ? 'welcome' : 'name'}
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: '600',
              color: '#FFFFFF',
              letterSpacing: showGreeting
                ? '0.8px'
                : '0.2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.2',
              width: '100%',
              height: '18px',
              willChange: 'opacity, transform, filter',
              ...smoothTextStyle,
            }}
          >
            {showGreeting ? 'WELCOME' : name}
          </h2>

          {isAmbassadorActive ? (
            <div
              key={
                showGreeting
                  ? 'ambassador-greeting'
                  : 'ambassador-name'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: '2px',
                height: '14px',
                minWidth: 0,
                overflow: 'hidden',
                willChange:
                  'opacity, transform, filter',
                ...smoothTextStyle,
              }}
            >
              {!showGreeting && (
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor:
                      '#10B981',
                    flexShrink: 0,
                  }}
                />
              )}

              <span
                style={{
                  fontSize: '10px',
                  color: '#A1A1AA',
                  fontWeight: '500',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                  maxWidth: '100%',
                }}
              >
                {showGreeting
                  ? 'AMBASSADOR'
                  : 'AMBASSADOR'}
              </span>
            </div>
          ) : (
            <span
              key={
                showGreeting
                  ? 'member-greeting'
                  : 'member-email'
              }
              style={{
                fontSize: '10px',
                color: '#A1A1AA',
                marginTop: '2px',
                height: '14px',
                letterSpacing: showGreeting
                  ? '0.6px'
                  : '0.2px',
                textTransform: showGreeting
                  ? 'uppercase'
                  : 'none',
                fontWeight: showGreeting
                  ? '500'
                  : '400',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                maxWidth: '100%',
                willChange:
                  'opacity, transform, filter',
                ...smoothTextStyle,
              }}
            >
              {showGreeting
                ? loading
                  ? ''
                  : 'MEMBER'
                : profile?.email || ''}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
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
            position: 'relative',
          }}
          title={
            isAmbassadorActive
              ? 'Communication'
              : 'Notifications'
          }
        >
          {isAmbassadorActive ? (
            <MessageIcon
              width={17}
              height={17}
              stroke="#FFFFFF"
            />
          ) : (
            <NotificationIcon
              width={17}
              height={17}
              stroke="#FFFFFF"
            />
          )}

          {isAmbassadorActive ? (
            msgCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor:
                    '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  borderRadius:
                    '10px',
                  minWidth: '15px',
                  height: '15px',
                  padding:
                    '0 3px',
                  display:
                    'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  border:
                    '1.5px solid #000000',
                  lineHeight:
                    1,
                }}
              >
                {msgCount > 99
                  ? '99+'
                  : msgCount}
              </span>
            )
          ) : notifCount > 0 ? (
            <span
              style={{
                position:
                  'absolute',
                top: '-3px',
                right: '-3px',
                backgroundColor:
                  '#EF4444',
                color:
                  '#FFFFFF',
                fontSize:
                  '9px',
                fontWeight:
                  'bold',
                borderRadius:
                  '10px',
                minWidth:
                  '15px',
                height:
                  '15px',
                padding:
                  '0 3px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                border:
                  '1.5px solid #000000',
                lineHeight:
                  1,
              }}
            >
              {notifCount > 99
                ? '99+'
                : notifCount}
            </span>
          ) : isNotifUnread ? (
            <span
              style={{
                position:
                  'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                backgroundColor:
                  '#EF4444',
                borderRadius:
                  '50%',
                border:
                  '1.5px solid #000000',
              }}
            />
          ) : null}
        </button>

        <button
          type="button"
          onClick={() =>
            onChangeView('settings')
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'center',
            cursor: 'pointer',
            background:
              '#121212',
            border:
              '1px solid #27272A',
            borderRadius:
              '50%',
            width: '35px',
            height: '35px',
            color:
              '#FFFFFF',
            outline:
              'none',
          }}
          title="Settings"
        >
          <SettingsIcon
            width={17}
            height={17}
            stroke="#FFFFFF"
            strokeWidth={1.5}
          />
        </button>
      </div>
    </div>
  );
}