import React from 'react';

export const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 18,
  height = 18,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 2,
  ...props
}) => {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  );
};
