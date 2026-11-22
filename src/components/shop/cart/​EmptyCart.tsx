import React from 'react';

const EmptyCart: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingBottom: '80px',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 'clamp(36px, 10vw, 52px)',
          fontWeight: '800',
          lineHeight: '1.05',
          letterSpacing: '-1px',
          color: '#3a3a3a',
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
        }}
      >
        YOUR
        <br />
        BAG IS
        <br />
        EMPTY
      </h3>
    </div>
  );
};

export default EmptyCart;
