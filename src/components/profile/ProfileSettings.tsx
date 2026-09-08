import { RefObject } from 'react';

interface ProfileSettingsProps {
  profile: any;
  avatarUrl: string | null;
  isAmbassadorActive: boolean;
  uploadingAvatar: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  newName: string;
  newEmail: string;
  newPassword: string;

  
  currentSlug?: string;
  newSlug: string;
  setNewSlug: (val: string) => void;
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
  newPassword,
  currentSlug = '',
  newSlug,
  setNewSlug,
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
  const labelStyle = { fontSize: '10px', color: '#888', letterSpacing: '2px', marginBottom: '5px' };
  const inputStyle = { width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', marginBottom: '20px', outline: 'none', fontSize: '15px' };
  const navButtonStyle = { background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px', display: 'block', width: '100%', textAlign: 'left', padding: '5px 0' };
  const dangerButtonStyle = { background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' as const, display: 'block', width: '100%', textAlign: 'left', fontWeight: 'bold' };

  
  const payoutOptions = ['bKash', 'Nagad', 'Rocket', 'Card'];

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
      <input placeholder={profile?.name || "Enter your name"} value={newName} onChange={(e) => setNewName(e.target.value)} style={inputStyle} />

      <p style={labelStyle}>EMAIL ADDRESS</p>
      <input placeholder={profile?.email} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={inputStyle} />

      
      {isAmbassadorActive && (
        <>
          <p style={labelStyle}>CUSTOM SHOWCASE SLUG</p>
          <input 
            placeholder={currentSlug || "e.g. your-custom-name"} 
            value={newSlug} 
            onChange={(e) => setNewSlug(e.target.value)} 
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
                    padding: '8px 20px',
                    borderRadius: '20px',
                    background: isSelected ? '#ffffff' : '#111111',
                    color: isSelected ? '#000000' : '#888888',
                    border: isSelected ? '1px solid #ffffff' : '1px solid #222222',
                    fontSize: '12px',
                    fontWeight: isSelected ? '600' : '400',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <p style={labelStyle}>PAYOUT NUMBER</p>
          <input 
            placeholder={currentPayoutDetails || "017XXXXXXXX"} 
            value={newPayoutNumber} 
            onChange={(e) => setNewPayoutNumber(e.target.value)} 
            style={inputStyle} 
          />
        </>
      )}

      <p style={labelStyle}>NEW PASSWORD</p>
      <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />

      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button onClick={handleUpdate} style={{ ...navButtonStyle, color: '#fff', fontWeight: '600' }}>SAVE CHANGES</button>
        <button onClick={handleSignOut} style={navButtonStyle}>SIGN OUT</button>
        <button onClick={() => setShowConfirm(true)} style={dangerButtonStyle}>DELETE ACCOUNT</button>
      </div>
    </>
  );
}
