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
      backgroundColor: '#1a1a1a', zIndex: 9999, display: 'flex', 
      justifyContent: 'center', alignItems: 'center', padding: '20px'
    }}>
      <AuthForm />
      <button 
        onClick={onClose} 
        style={{
          position: 'absolute', bottom: '40px', background: 'none', 
          border: 'none', fontSize: '11px', cursor: 'pointer', 
          color: '#555', letterSpacing: '2px', textTransform: 'uppercase'
        }}
      >
        Cancel
      </button>
    </div>
  );
};

export default AuthOverlay;
