import React from 'react';

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 24,
  height = 24,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 2,
  ...props
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill={fill} 
      stroke={stroke} 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
};
