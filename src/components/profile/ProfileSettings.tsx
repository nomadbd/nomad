import { useState, useEffect, useRef, RefObject } from 'react';
import { isUserSubscribed, subscribeUserToPush, unsubscribeUserFromPush } from '@/utils/pushManager';

interface ProfileSettingsProps {
  profile: any;
  avatarUrl: string | null;
  isAmbassadorActive: boolean;
  uploadingAvatar: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  newName: string;
  newEmail: string;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  currentSlug?: string;
  newSlug: string;
  setNewSlug: (val: string) => void;
  currentDisplayName?: string;
  newDisplayName: string;
  setNewDisplayName: (val: string) => void;
  payoutMethod: string;
  setPayoutMethod: (val: string) => void;
  currentPayoutDetails?: string;
  newPayoutNumber: string;
  setNewPayoutNumber: (val: string) => void;
  setNewName: (val: string) => void;
  setNewEmail: (val: string) => void;
  setNewPassword: (val: string) => void;
  getInitials: (name?: string, email?: string) => string;
  handleDeleteAvatar: () => void;
  handleUpdate: () => void;
  handleSignOut: () => void;
  setShowConfirm: (val: boolean) => void;
  onChangeView: (view: 'profile' | 'settings') => void;
}

export default function ProfileSettings({
  profile,
  avatarUrl,
  isAmbassadorActive,
  uploadingAvatar,
  fileInputRef,
  newName,
  newEmail,
  currentPassword,
  setCurrentPassword,
  newPassword,
  currentSlug = '',
  newSlug,
  setNewSlug,
  currentDisplayName = '',
  newDisplayName,
  setNewDisplayName,
  payoutMethod,
  setPayoutMethod,
  currentPayoutDetails = '',
  newPayoutNumber,
  setNewPayoutNumber,
  setNewName,
  setNewEmail,
  setNewPassword,
  getInitials,
  handleDeleteAvatar,
  handleUpdate,
  handleSignOut,
  setShowConfirm,
  onChangeView
}: ProfileSettingsProps) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);
  const [isPasswordSheetOpen, setIsPasswordSheetOpen] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  const headerRef = useRef<HTMLDivElement>(null);

  // ===== Jitter-free Fixed Header + Keyboard Offset for Sheet =====
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let rafId = 0;

    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Header
        if (headerRef.current) {
          headerRef.current.style.transform = `translateY(${vv.offsetTop}px)`;
        }

        // Keyboard height calculation (for Bottom Sheet)
        const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        setKeyboardOffset(offset);
      });
    };

    update();

    vv.addEventListener('resize', update, { passive: true });
    vv.addEventListener('scroll', update, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  // ===== Body scroll lock =====
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  useEffect(() => {
    async function checkPushStatus() {
      if (isAmbassadorActive) {
        const status = await isUserSubscribed();
        setPushEnabled(status);
        setPushLoading(false);
      }
    }
    checkPushStatus();
  }, [isAmbassadorActive]);

  const handlePushToggle = async () => {
    setPushLoading(true);
    if (pushEnabled) {
      const success = await unsubscribeUserFromPush();
      if (success) setPushEnabled(false);
    } else {
      const success = await subscribeUserToPush();
      if (success) setPushEnabled(true);
    }
    setPushLoading(false);
  };

  const cleanPayoutNumber = (details?: string) => {
    if (!details) return '';
    return details.includes(':') ? details.split(':')[1].trim() : details;
  };

  // ===== Header SAVE-এ পাসওয়ার্ড আর গণনা হবে না =====
  const isDirty = Boolean(
    (newName && newName !== profile?.name) ||
    (newEmail && newEmail !== profile?.email) ||
    (newDisplayName && newDisplayName !== currentDisplayName) ||
    (newSlug && newSlug !== currentSlug) ||
    (newPayoutNumber && newPayoutNumber !== cleanPayoutNumber(currentPayoutDetails))
  );

  const isPasswordDirty = currentPassword.length > 0 && newPassword.length > 0;

  const labelStyle = { fontSize: '10px', color: '#FFFFFF', letterSpacing: '1.5px', marginBottom: '4px', fontWeight: '500' };
  const inputStyle = { width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #282828', color: '#FFFFFF', marginBottom: '16px', outline: 'none', fontSize: '14px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left' as const, padding: '12px 0' };
  const actionButtonStyle = { background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left' as const, fontWeight: '500', marginTop: '10px' };

  const payoutOptions = ['bKash', 'Nagad', 'Rocket', 'Card'];

  const getFallbackDisplayName = (name?: string) => {
    if (!name?.trim()) return '';
    const firstWord = name.trim().split(/\s+/)[0];
    return Array.from(firstWord).slice(0, 10).join('');
  };

  const dynamicPlaceholder = currentDisplayName || getFallbackDisplayName(profile?.name) || "Display Name";
  const activeSlug = newSlug || currentSlug || 'slug';

  const openPasswordSheet = () => {
    setIsPasswordSheetOpen(true);
  };

  const closePasswordSheet = () => {
    setIsPasswordSheetOpen(false);
    setCurrentPassword('');
    setNewPassword('');
  };

  const handlePasswordUpdate = () => {
    if (!isPasswordDirty) return;
    handleUpdate();
    closePasswordSheet();
  };

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      backgroundColor: '#000000',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ===== FIXED HEADER ===== */}
      <div
        ref={headerRef}
        style={{ 
          position: 'fixed', 
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1000, 
          backgroundColor: '#000000',
          padding: '12px 20px',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid #1A1A1A',
          boxSizing: 'border-box',
          transform: 'translateY(0)',
          willChange: 'transform',
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          backfaceVisibility: 'hidden',
        }}
      >
        <h2 style={{ fontWeight: '600', letterSpacing: '3px', fontSize: '15px', color: '#FFFFFF', margin: 0 }}>SETTINGS</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={handleUpdate}
            disabled={!isDirty}
            style={{
              background: isDirty ? '#FFFFFF' : 'transparent',
              color: isDirty ? '#000000' : '#444444',
              border: isDirty ? '1px solid #FFFFFF' : '1px solid #333333',
              padding: '6px 16px',
              borderRadius: '16px',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1.5px',
              cursor: isDirty ? 'pointer' : 'default',
              opacity: isDirty ? 1 : 0.4,
              transition: 'all 0.25s ease'
            }}
          >
            SAVE
          </button>

          <svg onClick={() => onChangeView('profile')} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" cursor="pointer">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: 'calc(51px + env(safe-area-inset-top))',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingBottom: '40px',
        WebkitOverflowScrolling: 'touch',
      }}>

        {isAmbassadorActive && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '50%', 
              backgroundColor: '#111111', 
              border: '1px solid #333333',
              overflow: 'hidden', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: '600',
              color: '#FFFFFF',
              flexShrink: 0
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '18px', fontWeight: '500' }}>{getInitials(profile?.name, profile?.email)}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: '#161616',
                  border: '1px solid #2C2C2E',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  lineHeight: '1.3',
                  textAlign: 'center',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer'
                }}>
                CHANGE<br />PICTURE
              </button>

              {avatarUrl && (
                <button 
                  type="button"
                  disabled={uploadingAvatar}
                  onClick={handleDeleteAvatar}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '6px 4px',
                    fontSize: '11px',
                    letterSpacing: '1px',
                    lineHeight: '1.3',
                    textAlign: 'center',
                    cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                    opacity: uploadingAvatar ? 0.6 : 1
                  }}>
                  REMOVE<br />PICTURE
                </button>
              )}
            </div>
          </div>
        )}

        <p style={labelStyle}>NAME</p>
        <input placeholder={profile?.name || "Full Name"} value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />

        <p style={labelStyle}>EMAIL ADDRESS</p>
        <input placeholder={profile?.email || "Email Address"} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />

        {isAmbassadorActive && (
          <>
            <p style={labelStyle}>DISPLAY NAME</p>
            <input 
              type="text"
              maxLength={10}
              placeholder={dynamicPlaceholder} 
              value={newDisplayName} 
              onChange={(e) => setNewDisplayName(e.target.value)} 
              style={inputStyle} 
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={labelStyle}>STORE SLUG</p>
              <span style={{ fontSize: '10px', color: '#888888', marginBottom: '4px' }}>/{activeSlug}</span>
            </div>
            <input 
              placeholder={currentSlug || "slug-name"} 
              value={newSlug} 
              onChange={(e) => {
                const formattedSlug = e.target.value
                  .toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '');
                setNewSlug(formattedSlug);
              }} 
              style={inputStyle} 
            />

            <p style={labelStyle}>DEFAULT PAYOUT METHOD</p>
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '6px',
              marginBottom: '16px',
              scrollbarWidth: 'none'
            }}>
              {payoutOptions.map((option) => {
                const isSelected = Boolean(payoutMethod) && (payoutMethod === option || payoutMethod.startsWith(option));
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setPayoutMethod(option)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: isSelected ? '#1A1A1A' : 'transparent',
                      color: '#FFFFFF',
                      border: isSelected ? '1px solid #FFFFFF' : '1px solid #222222',
                      fontSize: '11px',
                      fontWeight: isSelected ? '500' : '400',
                      letterSpacing: '1px',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      opacity: isSelected ? 1 : 0.6,
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: isSelected ? '#FFFFFF' : 'transparent',
                      border: isSelected ? '1px solid #FFFFFF' : '1px solid #666666'
                    }} />
                    {option}
                  </button>
                );
              })}
            </div>

            <p style={labelStyle}>PAYOUT NUMBER</p>
            <input 
              placeholder={cleanPayoutNumber(currentPayoutDetails) || "017XXXXXXXX"} 
              value={newPayoutNumber} 
              onChange={(e) => setNewPayoutNumber(e.target.value)} 
              style={inputStyle} 
            />

            <p style={labelStyle}>REAL-TIME SALES ALERTS</p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#111111',
              border: '1px solid #222222',
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '11px', color: '#FFFFFF', letterSpacing: '0.5px' }}>
                Sales & admin alerts
              </span>
              <button
                type="button"
                disabled={pushLoading}
                onClick={handlePushToggle}
                style={{
                  background: pushEnabled ? '#FFFFFF' : 'transparent',
                  color: pushEnabled ? '#000000' : '#FFFFFF',
                  border: pushEnabled ? '1px solid #FFFFFF' : '1px solid #333333',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '10px',
                  fontWeight: '600',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: pushEnabled ? 1 : 0.6,
                  flexShrink: 0
                }}
              >
                {pushLoading ? '...' : (pushEnabled ? 'ENABLED' : 'DISABLED')}
              </button>
            </div>
          </>
        )}

        <div style={{ borderTop: '1px solid #1C1C1E', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          <button 
            type="button"
            onClick={openPasswordSheet}
            style={navButtonStyle}
          >
            <span>CHANGE PASSWORD</span>
            <span style={{ fontSize: '14px', color: '#888888' }}>›</span>
          </button>

          <button onClick={handleSignOut} style={navButtonStyle}>
            <span>SIGN OUT</span>
          </button>
          <button onClick={() => setShowConfirm(true)} style={actionButtonStyle}>DELETE ACCOUNT</button>
        </div>
      </div>

      {/* ===== BOTTOM SHEET ===== */}
      {/* Backdrop */}
      <div
        onClick={closePasswordSheet}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1100,
          opacity: isPasswordSheetOpen ? 1 : 0,
          pointerEvents: isPasswordSheetOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: keyboardOffset, // ← কীবোর্ডের উপরে তুলে দেয়
          zIndex: 1101,
          backgroundColor: '#111111',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
          transform: isPasswordSheetOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), bottom 0.25s ease',
          willChange: 'transform, bottom',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Handle bar */}
        <div style={{
          width: '40px',
          height: '4px',
          backgroundColor: '#333333',
          borderRadius: '2px',
          margin: '12px auto 8px',
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '8px 20px 16px',
          flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', letterSpacing: '1.5px', color: '#FFFFFF' }}>
            CHANGE PASSWORD
          </h3>
          <button
            onClick={closePasswordSheet}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888888',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable Fields (যদি দরকার হয়) */}
        <div style={{ 
          padding: '0 20px', 
          overflowY: 'auto',
          flex: 1,
        }}>
          <p style={labelStyle}>CURRENT PASSWORD</p>
          <input 
            type="password" 
            placeholder="Current Password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)} 
            style={{ ...inputStyle, marginBottom: '20px' }} 
          />

          <p style={labelStyle}>NEW PASSWORD</p>
          <input 
            type="password" 
            placeholder="New Password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)} 
            style={{ ...inputStyle, marginBottom: '8px' }} 
          />
        </div>

        {/* Sticky Footer Button - সবসময় দৃশ্যমান */}
        <div style={{ 
          padding: '16px 20px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          flexShrink: 0,
          borderTop: '1px solid #1A1A1A',
        }}>
          <button
            onClick={handlePasswordUpdate}
            disabled={!isPasswordDirty}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: isPasswordDirty ? '#FFFFFF' : '#222222',
              color: isPasswordDirty ? '#000000' : '#666666',
              fontSize: '13px',
              fontWeight: '700',
              letterSpacing: '1.5px',
              cursor: isPasswordDirty ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
            }}
          >
            UPDATE PASSWORD
          </button>
        </div>
      </div>
    </div>
  );
}
