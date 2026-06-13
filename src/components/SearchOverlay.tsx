import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'black', zIndex: 1000, padding: '20px', boxSizing: 'border-box'
    }}>
      {/* হেডার এরিয়া: সার্চ ইনপুট এবং ক্লোজ বাটন */}
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '40px', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '10px'
      }}>
        <input 
          type="text" 
          placeholder="Search nomad products..." 
          style={{
            width: '100%', background: 'none', border: 'none', 
            color: 'white', fontSize: '20px', outline: 'none'
          }}
          autoFocus
        />
        
        {/* SVG ক্লোজ বাটন */}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchOverlay;
