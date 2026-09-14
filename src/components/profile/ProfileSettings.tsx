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

  // OPTIMIZED BALANCED SPACING STYLES
  const labelStyle = { fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '4px' };
  const inputStyle = { width: '100%', padding: '8px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '16px', outline: 'none', fontSize: '14px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left' as const, padding: '6px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left' as const, fontWeight: 'bold', marginTop: '8px' };

  const payoutOptions = ['bKash', 'Nagad', 'Rocket', 'Card'];

  const getFallbackDisplayName = (name?: string) => {
    if (!name?.trim()) return '';
    const firstWord = name.trim().split(/\s+/)[0];
    return Array.from(firstWord).slice(0, 10).join('');
  };

  const cleanPayoutNumber = (details?: string) => {
    if (!details) return '';
    return details.includes(':') ? details.split(':')[1].trim() : details;
  };

  const dynamicPlaceholder = currentDisplayName || getFallbackDisplayName(profile?.name) || "Display Name";
  const activeSlug = newSlug || currentSlug || 'slug';

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontWeight: '500', letterSpacing: '4px', fontSize: '18px', margin: 0 }}>SETTINGS</h2>
        <svg onClick={() => onChangeView('profile')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" cursor="pointer"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>

      {/* 1. AVATAR SECTION */}
      {isAmbassadorActive && (
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            borderRadius: '50%', 
            backgroundColor: '#181818', 
            border: '1px solid #ffffff',
            boxShadow: '0 0 12px rgba(255, 255, 255, 0.3)',
            overflow: 'hidden', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '600',
            color: '#fff',
            textShadow: '0 0 8px #ffffff',
            flexShrink: 0
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{getInitials(profile?.name, profile?.email)}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '11px',
                letterSpacing: '1px',
                cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                opacity: uploadingAvatar ? 0.6 : 1
              }}>
              {uploadingAvatar ? 'UPLOADING...' : (avatarUrl ? 'CHANGE PICTURE' : 'UPLOAD PICTURE')}
            </button>

            {avatarUrl && (
              <button 
                type="button"
                disabled={uploadingAvatar}
                onClick={handleDeleteAvatar}
                style={{
                  background: 'transparent',
                  border: '1px solid #ff4444',
                  color: '#ff4444',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  opacity: uploadingAvatar ? 0.6 : 1
                }}>
                REMOVE PICTURE
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
            <span style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>/{activeSlug}</span>
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
                    background: isSelected ? '#181818' : 'transparent',
                    color: isSelected ? '#cccccc' : '#555555',
                    border: isSelected ? '1px solid #333333' : '1px solid #1a1a1a',
                    fontSize: '11px',
                    fontWeight: '400',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: isSelected ? '#aaaaaa' : 'transparent',
                    border: isSelected ? '1px solid #aaaaaa' : '1px solid #333333',
                    transition: 'all 0.2s ease'
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
            background: '#141414',
            border: '1px solid #222222',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '11px', color: '#aaa', letterSpacing: '0.5px' }}>
              Sales & admin alerts
            </span>
            <button
              type="button"
              disabled={pushLoading}
              onClick={handlePushToggle}
              style={{
                background: pushEnabled ? '#22c55e' : 'transparent',
                color: pushEnabled ? '#000' : '#888',
                border: pushEnabled ? '1px solid #22c55e' : '1px solid #444',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {pushLoading ? '...' : (pushEnabled ? 'ENABLED' : 'DISABLED')}
            </button>
          </div>
        </>
      )}

      {/* 6. SECURITY & ACCOUNT ACTIONS */}
      <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            <span style={{ fontSize: '10px', color: '#666', transform: showPasswordSection ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>▼</span>
          </button>

          {showPasswordSection && (
            <div style={{ marginTop: '12px', marginBottom: '4px' }}>
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
          )}
        </div>

        {/* PRIMARY SAVE BUTTON */}
        <button 
          onClick={handleUpdate} 
          style={{ 
            width: '100%',
            padding: '12px 0',
            background: '#ffffff',
            color: '#000000',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '2px',
            cursor: 'pointer',
            marginTop: '4px',
            marginBottom: '4px',
            transition: 'opacity 0.2s ease'
          }}
        >
          SAVE CHANGES
        </button>

        <button onClick={handleSignOut} style={navButtonStyle}>
          <span>SIGN OUT</span>
        </button>
        <button onClick={() => setShowConfirm(true)} style={dangerButtonStyle}>DELETE ACCOUNT</button>
      </div>
    </>
  );
}
