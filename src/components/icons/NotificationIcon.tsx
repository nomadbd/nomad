import React from 'react';

export const NotificationIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  width = 18,
  height = 18,
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 2,
  ...props
}) => (
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default NotificationIcon;
