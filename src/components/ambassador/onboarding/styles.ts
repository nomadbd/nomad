import React from 'react';

export const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000000',
  color: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  boxSizing: 'border-box'
};

export const mainWrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '390px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
};

export const titleStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 200,
  letterSpacing: '4px',
  margin: '0 0 10px 0',
  lineHeight: 1.25,
  color: '#a0a0a0'
};

export const descStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#bbbbbb',
  lineHeight: '1.6',
  margin: 0,
  fontWeight: 300
};

export const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.3)',
  padding: '12px 16px'
};

export const numberStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: '#888888',
  letterSpacing: '2px',
  display: 'block',
  marginBottom: '2px'
};

export const benefitTitleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '2px',
  color: '#ffffff',
  marginBottom: '4px'
};

export const benefitDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cccccc',
  margin: 0,
  lineHeight: '1.5',
  fontWeight: 300
};

export const tabButtonStyle: React.CSSProperties = {
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

export const underlineInputStyle: React.CSSProperties = {
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

export const pillButtonStyle: React.CSSProperties = {
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

export const footerStyle: React.CSSProperties = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

export const footerLinksContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  flexWrap: 'nowrap'
};

export const footerLinkStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '9px',
  letterSpacing: '1.2px',
  textDecoration: 'none',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  whiteSpace: 'nowrap'
};

export const dotStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.2)',
  fontSize: '8px'
};

export const modalBackdropStyle: React.CSSProperties = {
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

export const bottomSheetBoxStyle: React.CSSProperties = {
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

export const modalHeaderStyle: React.CSSProperties = {
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

export const chatInputFormStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '28px',
  padding: '4px 6px 4px 16px',
  gap: '8px',
  width: '100%',
  boxSizing: 'border-box'
};
