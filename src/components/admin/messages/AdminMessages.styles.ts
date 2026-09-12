import React from 'react';

export const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: '#000000',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box',
};

export const statusContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '80vh',
  color: '#888888',
  fontSize: '11px',
  letterSpacing: '2px',
  gap: '12px',
};

export const retryBtnStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: 'none',
  color: '#000000',
  padding: '8px 16px',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2px',
  cursor: 'pointer',
};

export const headerFilterBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: '#050505',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  flexWrap: 'wrap',
  gap: '10px',
};

export const filterChipStyle: React.CSSProperties = {
  border: '1px solid',
  padding: '5px 12px',
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  cursor: 'pointer',
  borderRadius: '20px',
  transition: 'all 0.2s ease',
};

export const listContainerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
};

export const emptyTextStyle: React.CSSProperties = {
  padding: '40px 20px',
  textAlign: 'center',
  color: '#666666',
  fontSize: '11px',
  letterSpacing: '1.5px',
  fontWeight: 300,
};

export const whatsappCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '14px 16px',
  gap: '14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  cursor: 'pointer',
  backgroundColor: 'transparent',
};

export const avatarStyle: React.CSSProperties = {
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 600,
  color: '#ffffff',
  flexShrink: 0,
};

export const cardContentStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

export const threadHeaderRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '4px',
};

export const userNameStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  letterSpacing: '0.5px',
  color: '#ffffff',
};

export const timeStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#666666',
  fontWeight: 300,
};

export const threadSubRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '8px',
};

export const previewMessageStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#888888',
  margin: 0,
  fontWeight: 300,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
};

export const roleBadgeStyle: React.CSSProperties = {
  fontSize: '7px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  padding: '1px 5px',
  borderRadius: '2px',
  letterSpacing: '0.8px',
  flexShrink: 0,
  textTransform: 'uppercase',
};

export const unreadBadgeStyle: React.CSSProperties = {
  backgroundColor: '#25D366',
  color: '#000000',
  fontSize: '9px',
  fontWeight: 700,
  padding: '1px 6px',
  borderRadius: '10px',
  flexShrink: 0,
};

export const chatScreenContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#000000',
  overflow: 'hidden',
};

/* --- চ্যাট হেডারে টেক্সট যাতে স্ক্রিনের বাইরে না যায় তার আপডেট --- */
export const whatsappHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '12px 14px',
  backgroundColor: '#0a0a0a',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  flexShrink: 0,
  justifyContent: 'space-between',
};

export const backBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#ffffff',
  fontSize: '28px',
  lineHeight: '1',
  cursor: 'pointer',
  padding: '0 8px 0 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const headerAvatarStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '13px',
  fontWeight: 600,
  color: '#ffffff',
  flexShrink: 0,
  cursor: 'pointer',
};

export const headerInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  flex: 1,
  cursor: 'pointer',
};

export const headerNameTitle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#ffffff',
  letterSpacing: '0.5px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const headerSubtitleStyle: React.CSSProperties = {
  fontSize: '10px',
  color: '#888888',
  fontWeight: 300,
  marginTop: '1px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const infoIconStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '16px',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
};

export const chatFeedStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  WebkitOverflowScrolling: 'touch',
};

export const msgTimeStyle: React.CSSProperties = {
  fontSize: '8px',
  color: '#555555',
  marginTop: '3px',
};

export const chatInputAreaStyle: React.CSSProperties = {
  padding: '10px 14px',
  paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
  flexShrink: 0,
  backgroundColor: '#0a0a0a',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
};

export const chatInputFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '24px',
  padding: '2px 6px 2px 14px',
  gap: '8px',
  width: '100%',
  boxSizing: 'border-box',
};

export const textareaInputStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: 'transparent',
  border: 'none',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 300,
  outline: 'none',
  resize: 'none',
  maxHeight: '80px',
  lineHeight: '1.4',
  padding: '8px 0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
};

/* --- কুইক প্রোফাইল ড্রয়ারের নতুন স্টাইলসমূহ --- */
export const drawerOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  zIndex: 10000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
};

export const drawerContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '500px',
  backgroundColor: '#0a0a0a',
  borderTopLeftRadius: '18px',
  borderTopRightRadius: '18px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderBottom: 'none',
  padding: '20px 18px 30px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
  boxSizing: 'border-box',
  animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
};

export const drawerHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const drawerTitleStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  letterSpacing: '1.5px',
  color: '#888888',
  textTransform: 'uppercase',
};

export const drawerCloseBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888888',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '0 4px',
};

export const profileHeroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  paddingBottom: '14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
};

export const drawerAvatarStyle: React.CSSProperties = {
  width: '54px',
  height: '54px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  fontWeight: 600,
  color: '#ffffff',
  flexShrink: 0,
};

export const drawerHeroTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  overflow: 'hidden',
};

export const drawerNameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#ffffff',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const actionGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '10px',
};

export const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 6px',
  backgroundColor: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: 500,
  textDecoration: 'none',
  gap: '6px',
  cursor: 'pointer',
};

export const infoListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  padding: '12px',
  borderRadius: '10px',
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

export const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '11px',
};

export const infoLabelStyle: React.CSSProperties = {
  color: '#777777',
  fontWeight: 400,
};

export const infoValueStyle: React.CSSProperties = {
  color: '#dddddd',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '60%',
};

export const fullProfileBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#ffffff',
  color: '#000000',
  border: 'none',
  borderRadius: '8px',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '1px',
  cursor: 'pointer',
  textAlign: 'center',
  marginTop: '4px',
};
