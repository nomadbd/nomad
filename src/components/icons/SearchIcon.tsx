import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export const SearchIcon: React.FC<IconProps> = ({ size = 24, color = 'white', ...props }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="m21 21-4.34-4.34"/>
    <circle cx="11" cy="11" r="8"/>
  </svg>
);
