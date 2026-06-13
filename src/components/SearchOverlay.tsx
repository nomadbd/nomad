import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%',
      backgroundColor: 'black', 
      zIndex: 1000, 
      padding: '40px', 
      boxSizing: 'border-box'
    }}>
      <button 
        onClick={onClose} 
        style={{ 
          color: 'white', 
          background: 'none', 
          border: 'none', 
          fontSize: '16px', 
          cursor: 'pointer', 
          marginBottom: '40px', 
          textTransform: 'uppercase' 
        }}
      >
        [ Close ]
      </button>
      <input 
        type="text" 
        placeholder="Search nomad products..." 
        style={{
          width: '100%', 
          background: 'none', 
          border: 'none', 
          borderBottom: '1px solid white',
          color: 'white', 
          fontSize: '32px', 
          outline: 'none', 
          paddingBottom: '10px'
        }}
        autoFocus
      />
    </div>
  );
};

export default SearchOverlay;
