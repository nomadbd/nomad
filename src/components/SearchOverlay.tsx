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

        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Close search"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SearchOverlay;
