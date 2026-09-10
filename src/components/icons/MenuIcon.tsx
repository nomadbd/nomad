import React from 'react';

export const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 20,
  height = 20,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 2,
  ...props
}) => {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="8" x2="21" y2="8"></line>
      <line x1="9" y1="16" x2="21" y2="16"></line>
    </svg>
  );
};
