import { useState, RefObject } from 'react';

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

  const labelStyle = { fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' };
  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left', fontWeight: 'bold' };

  const payoutOptions = ['bKash', 'Nagad', 'Rocket', 'Card'];

  const getFallbackDisplayName = (name?: string) => {
    if (!name?.trim()) return '';
    const parts = name.trim().split(/\s+/);
    const prefixes = ['mohammad', 'mohammed', 'md', 'md.', 'mr', 'mr.', 'dr', 'dr.'];
    if (parts.length > 1 && prefixes.includes(parts[0].toLowerCase())) {
      return parts[1].slice(0, 10);
    }
    return parts[0].slice(0, 10);
  };

  const dynamicPlaceholder = currentDisplayName || getFallbackDisplayName(profile?.name) || "Display Name";

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h2 style={{ fontWeight: '500', letterSpacing: '4px', fontSize: '18px', margin: 0 }}>SETTINGS</h2>
        <svg onClick={() => onChangeView('profile')} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" cursor="pointer"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>

      {isAmbassadorActive && (
        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: '#181818', 
            border: '1px solid #ffffff',
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.4)',
            overflow: 'hidden', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: '600',
            color: '#fff',
            textShadow: '0 0 8px #ffffff, 0 0 16px #ffffff',
            flexShrink: 0
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{getInitials(profile?.name, profile?.email)}</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
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
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
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

          <p style={labelStyle}>STORE SLUG</p>
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
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '10px',
            marginBottom: '20px',
            scrollbarWidth: 'none'
          }}>
            {payoutOptions.map((option) => {
              const isSelected = payoutMethod === option || payoutMethod.startsWith(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPayoutMethod(option)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: isSelected ? '#181818' : 'transparent',
                    color: isSelected ? '#cccccc' : '#555555',
                    border: isSelected ? '1px solid #333333' : '1px solid #1a1a1a',
                    fontSize: '12px',
                    fontWeight: '400',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
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
            placeholder={currentPayoutDetails || "+1234567890"} 
            value={newPayoutNumber} 
            onChange={(e) => setNewPayoutNumber(e.target.value)} 
            style={inputStyle} 
          />
        </>
      )}

      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            CHANGE PASSWORD
          </button>

          {showPasswordSection && (
            <div style={{ marginTop: '15px', marginBottom: '10px' }}>
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

        <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
        <button onClick={handleSignOut} style={navButtonStyle}>SIGN OUT</button>
        <button onClick={() => setShowConfirm(true)} style={dangerButtonStyle}>DELETE ACCOUNT</button>
      </div>
    </>
  );
}
