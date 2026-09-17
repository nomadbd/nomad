import React from 'react';
import { CloseIcon } from '@/components/icons';

interface JoinSheetProps {
  isJoinSheetOpen: boolean;
  isJoinSheetAnimating: boolean;
  viewportStyle: React.CSSProperties;
  handleCloseJoinSheet: () => void;
  mode: 'signup' | 'login';
  setMode: (mode: 'signup' | 'login') => void;
  isCheckingEmail: boolean;
  accountFound: boolean | null;
  errorMessage: string;
  handleSubmit: (e: React.FormEvent) => void;
  fullName: string;
  setFullName: (val: string) => void;
  defaultTitleName: string;
  email: string;
  setEmail: (val: string) => void;
  defaultEmail: string;
  password: string;
  setPassword: (val: string) => void;
  submitting: boolean;
}

export const JoinSheet: React.FC<JoinSheetProps> = ({
  isJoinSheetOpen,
  isJoinSheetAnimating,
  viewportStyle,
  handleCloseJoinSheet,
  mode,
  setMode,
  isCheckingEmail,
  accountFound,
  errorMessage,
  handleSubmit,
  fullName,
  setFullName,
  defaultTitleName,
  email,
  setEmail,
  defaultEmail,
  password,
  setPassword,
  submitting
}) => {
  if (!isJoinSheetOpen) return null;

  return (
    <div 
      style={{
        ...modalBackdropStyle,
        opacity: isJoinSheetAnimating ? 1 : 0,
        transition: 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={handleCloseJoinSheet}
    >
      <div 
        style={{
          ...bottomSheetBoxStyle,
          height: viewportStyle.height ? `calc(${viewportStyle.height} - 40px)` : 'auto',
          maxHeight: '90vh',
          transform: isJoinSheetAnimating ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div>
            <span style={{ fontSize: '8px', letterSpacing: '2.5px', color: '#666666', fontWeight: 600, display: 'block' }}>MEMBERSHIP ACCESS</span>
            <h3 style={{ fontSize: '13px', letterSpacing: '3px', fontWeight: 300, color: '#ffffff', margin: 0 }}>AMBASSADOR CIRCLE</h3>
          </div>
          <button 
            type="button" 
            onClick={handleCloseJoinSheet} 
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
          >
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: '20px 24px 28px 24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', marginBottom: '16px' }}>
            <button 
              type="button" 
              style={{ ...tabButtonStyle, borderBottomColor: mode === 'signup' ? '#ffffff' : 'transparent', color: mode === 'signup' ? '#ffffff' : '#666666' }} 
              onClick={() => setMode('signup')}
            >
              SIGN UP
            </button>
            <button 
              type="button" 
              style={{ ...tabButtonStyle, borderBottomColor: mode === 'login' ? '#ffffff' : 'transparent', color: mode === 'login' ? '#ffffff' : '#666666' }} 
              onClick={() => setMode('login')}
            >
              LOG IN
            </button>
          </div>

          <div style={{ minHeight: '18px', fontSize: '10px', letterSpacing: '1.5px', fontWeight: 500, textAlign: 'center', marginBottom: '12px' }}>
            {isCheckingEmail && <span style={{ color: '#60a5fa' }}>VERIFYING ACCOUNT...</span>}
            {!isCheckingEmail && accountFound === true && <span style={{ color: '#4ade80' }}>✓ EXISTING ACCOUNT DETECTED</span>}
            {errorMessage && <span style={{ color: '#f87171' }}>{errorMessage}</span>}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <div style={{ 
              width: '100%',
              maxHeight: mode === 'signup' ? '60px' : '0px', 
              opacity: mode === 'signup' ? 1 : 0, 
              overflow: 'hidden', 
              transition: 'max-height 0.3s ease, opacity 0.25s ease' 
            }}>
              <input 
                type="text" 
                name="ambassador_name_field"
                autoComplete="off"
                style={underlineInputStyle}
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder={defaultTitleName || "Full Name"}
              />
            </div>

            <div style={{ width: '100%' }}>
              <input 
                type="text" 
                inputMode="email"
                name="ambassador_user_id"
                autoComplete="off"
                style={underlineInputStyle}
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder={defaultEmail || "Email Address"}
              />
            </div>

            <div style={{ width: '100%' }}>
              <input 
                type="password" 
                name="ambassador_password_field"
                autoComplete="new-password"
                style={underlineInputStyle}
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={mode === 'signup' ? 'Create Password' : 'Password'}
                required 
                minLength={6} 
              />
            </div>

            <button type="submit" disabled={submitting || isCheckingEmail} style={{ ...pillButtonStyle, width: '100%', marginTop: '10px' }}>
              {submitting 
                ? 'PROCESSING...' 
                : mode === 'signup' 
                  ? 'CONFIRM & JOIN' 
                  : 'ENTER PORTAL'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.88)',
  backdropFilter: 'blur(10px)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  overflow: 'hidden'
};

const bottomSheetBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '430px',
  backgroundColor: '#0a0a0a',
  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '20px 20px 0 0',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflow: 'hidden'
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px 12px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'sticky',
  top: 0,
  backgroundColor: '#0a0a0a',
  zIndex: 20,
  flexShrink: 0
};

const tabButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 0',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2.5px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1.5px solid transparent',
  marginBottom: '-1px',
  outline: 'none'
};

const underlineInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 0',
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 300,
  letterSpacing: '0.5px',
  outline: 'none',
  boxSizing: 'border-box'
};

const pillButtonStyle: React.CSSProperties = {
  padding: '12px 32px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '9999px',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '10px',
  letterSpacing: '2.5px',
  outline: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.15s ease, opacity 0.15s ease',
  boxShadow: '0 4px 15px rgba(255, 255, 255, 0.1)'
};
