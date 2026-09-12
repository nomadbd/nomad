import React from 'react';

export const EmailIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
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
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default EmailIcon;
