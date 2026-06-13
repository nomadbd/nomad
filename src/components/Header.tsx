import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: 'black', color: 'white' }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>nomad</div>
      <div style={{ display: 'flex', gap: '20px' }}>
        <span>[Email]</span>
        <span>[Chat]</span>
      </div>
    </header>
  );
};

export default Header;
