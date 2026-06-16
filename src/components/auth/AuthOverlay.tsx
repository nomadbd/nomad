import React from 'react';
import AuthForm from './AuthForm'; // আপনার আগের তৈরি করা Supabase ফর্ম

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AuthOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  // যদি ওপেন না থাকে, তবে কিছুই দেখাবে না (কোনো ব্যাকগ্রাউন্ড ইস্যু হবে না)
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)', zIndex: 2000, padding: '20px', 
      boxSizing: 'border-box', display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        
        {/* ফর্ম বন্ধ করার ক্লোজ বাটন */}
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute', top: '15px', right: '25px', 
            background: 'none', border: 'none', color: '#333', 
            fontSize: '24px', cursor: 'pointer', zIndex: 10001
          }}
          aria-label="Close form"
        >
          ✕
        </button>

        {/* আপনার আসল সাদা সুপাবেজ ফর্ম */}
        <AuthForm />
        
      </div>
    </div>
  );
};

export default AuthOverlay;
