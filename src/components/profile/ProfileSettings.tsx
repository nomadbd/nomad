import { useState, useEffect, RefObject } from 'react';
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
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(true);

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

  // Dynamic Dirty Check (যেকোনো ইনপুট পরিবর্তন বা টাইপিং শুরু হলে সত্য হবে)
  const isDirty = Boolean(
    (newName && newName !== profile?.name) ||
    (newEmail && newEmail !== profile?.email) ||
    (newDisplayName && newDisplayName !== currentDisplayName) ||
    (newSlug && newSlug !== currentSlug) ||
    (newPayoutNumber && newPayoutNumber !== cleanPayoutNumber(currentPayoutDetails)) ||
    currentPassword.length > 0 ||
    newPassword.length > 0
  );

  // UNIFORM BRIGHT GRAY / WHITE PALETTE
  const labelStyle = { fontSize: '10px', color: '#A0A0A0', letterSpacing: '1.5px', marginBottom: '4px', fontWeight: '500' };
  const inputStyle = { width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #282828', color: '#FFFFFF', marginBottom: '16px', outline: 'none', fontSize: '14px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#D1D1D1', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left' as const, padding: '8px 0' };
  const actionButtonStyle = { background: 'transparent', border: 'none', color: '#D1D1D1', cursor: 'pointer', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left' as const, fontWeight: '500', marginTop: '10px' };

  const payoutOptions = ['bKash', 'Nagad', 'Rocket', 'Card'];

  const getFallbackDisplayName = (name?: string) => {
    if (!name?.trim()) return '';
    const firstWord = name.trim().split(/\s+/)[0];
    return Array.from(firstWord).slice(0, 10).join('');
  };

  const dynamicPlaceholder = currentDisplayName || getFallbackDisplayName(profile?.name) || "Display Name";
  const activeSlug = newSlug || currentSlug || 'slug';

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: '600', letterSpacing: '3px', fontSize: '16px', color: '#FFFFFF', margin: 0 }}>SETTINGS</h2>
        <svg onClick={() => onChangeView('profile')} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1D1D1" strokeWidth="2" cursor="pointer"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>

      {/* 1. AVATAR SECTION */}
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
                color: '#D1D1D1',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                letterSpacing: '1px',
                cursor: uploadingAvatar ? 'not-allowed' : 'pointer'
              }}>
              {uploadingAvatar ? 'UPLOADING...' : (avatarUrl ? 'CHANGE PICTURE' : 'UPLOAD PICTURE')}
            </button>

            {/* RED REMOVED -> UNIFORM BRIGHT GRAY */}
            {avatarUrl && (
              <button 
                type="button"
                disabled={uploadingAvatar}
                onClick={handleDeleteAvatar}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#D1D1D1',
                  padding: '6px 4px',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  opacity: uploadingAvatar ? 0.6 : 1
                }}>
                REMOVE
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. PERSONAL IDENTIFICATION */}
      <p style={labelStyle}>NAME</p>
      <input placeholder={profile?.name || "Full Name"} value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />

      <p style={labelStyle}>EMAIL ADDRESS</p>
      <input placeholder={profile?.email || "Email Address"} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />

      {/* 3. STORE & AMBASSADOR DETAILS */}
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
            <span style={{ fontSize: '10px', color: '#666666', marginBottom: '4px' }}>/{activeSlug}</span>
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

          {/* 4. FINANCIAL & PAYOUT DETAILS */}
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
                    color: isSelected ? '#FFFFFF' : '#666666',
                    border: isSelected ? '1px solid #FFFFFF' : '1px solid #222222',
                    fontSize: '11px',
                    fontWeight: isSelected ? '500' : '400',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                >
                  <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    border: isSelected ? '1px solid #FFFFFF' : '1px solid #444444'
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

          {/* 5. APP PREFERENCES */}
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
            <span style={{ fontSize: '11px', color: '#D1D1D1', letterSpacing: '0.5px' }}>
              Sales & admin alerts
            </span>
            <button
              type="button"
              disabled={pushLoading}
              onClick={handlePushToggle}
              style={{
                background: pushEnabled ? '#FFFFFF' : 'transparent',
                color: pushEnabled ? '#000000' : '#888888',
                border: pushEnabled ? '1px solid #FFFFFF' : '1px solid #333333',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
            >
              {pushLoading ? '...' : (pushEnabled ? 'ENABLED' : 'DISABLED')}
            </button>
          </div>
        </>
      )}

      {/* 6. SECURITY & ACTIONS */}
      <div style={{ borderTop: '1px solid #1C1C1E', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <button 
            type="button"
            onClick={() => {
              setShowPasswordSection(!showPasswordSection);
              if (showPasswordSection) {
                setCurrentPassword('');
                setNewPassword('');
              }
            }}
            style={navButtonStyle}
          >
            <span>CHANGE PASSWORD</span>
            <span style={{ fontSize: '10px', color: '#D1D1D1', transform: showPasswordSection ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>▼</span>
          </button>

          {/* SMOOTH ANIMATED ACCORDION (NO JERK) */}
          <div style={{
            maxHeight: showPasswordSection ? '180px' : '0px',
            opacity: showPasswordSection ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: showPasswordSection ? 'auto' : 'none'
          }}>
            <div style={{ paddingTop: '12px' }}>
              <p style={labelStyle}>CURRENT PASSWORD</p>
              <input 
                type="password" 
                placeholder="Current Password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                style={inputStyle} 
              />

              <p style={labelStyle}>NEW PASSWORD</p>
              <input 
                type="password" 
                placeholder="New Password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                style={inputStyle} 
              />
            </div>
          </div>
        </div>

        {/* DYNAMIC SAVE BUTTON */}
        <button 
          onClick={handleUpdate} 
          style={{ 
            width: '100%',
            padding: '12px 0',
            background: isDirty ? '#FFFFFF' : 'transparent',
            color: isDirty ? '#000000' : '#888888',
            border: isDirty ? '1px solid #FFFFFF' : '1px solid #333333',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '2px',
            cursor: isDirty ? 'pointer' : 'default',
            marginTop: '8px',
            marginBottom: '4px',
            transition: 'all 0.3s ease'
          }}
        >
          SAVE CHANGES
        </button>

        <button onClick={handleSignOut} style={navButtonStyle}>
          <span>SIGN OUT</span>
        </button>
        <button onClick={() => setShowConfirm(true)} style={actionButtonStyle}>DELETE ACCOUNT</button>
      </div>
    </>
  );
}
