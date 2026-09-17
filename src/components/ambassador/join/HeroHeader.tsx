import React from 'react';

interface HeroHeaderProps {
  displayName: string;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ displayName }) => {
  return (
    <div>
      <h1 style={titleStyle}>
        WELCOME,
        <br />
        <span style={{ color: '#ffffff', fontWeight: 400, letterSpacing: '3px' }}>{displayName}</span>
      </h1>
      <p style={descStyle}>
        You have been granted exclusive access to curate selected allocations and represent NOMAD.
      </p>
    </div>
  );
};

const titleStyle: React.CSSProperties = {
  fontSize: '26px',
  fontWeight: 200,
  letterSpacing: '4px',
  margin: '0 0 10px 0',
  lineHeight: 1.25,
  color: '#a0a0a0'
};

const descStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#bbbbbb',
  lineHeight: '1.6',
  margin: 0,
  fontWeight: 300
};
