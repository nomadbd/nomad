import React from 'react';
import AuthForm from './AuthForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AuthOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#e0e0e0', zIndex: 9999, display: 'flex', 
      justifyContent: 'center', alignItems: 'center'
    }}>
      <button 
        onClick={onClose} 
        style={{
          position: 'absolute', top: '40px', right: '40px', 
          background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer'
        }}
      >
        ✕
      </button>
      <AuthForm />
    </div>
  );
};

export default AuthOverlay;
