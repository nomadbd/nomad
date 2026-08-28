import React from 'react';

export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 11, color = "#000" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
