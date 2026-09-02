import React from 'react';

interface IconProps {
  width?: string | number;
  height?: string | number;
  stroke?: string;
  strokeWidth?: string | number;
  className?: string;
}

export const HistoryIcon: React.FC<IconProps> = ({
  width = "14",
  height = "14",
  stroke = "currentColor",
  strokeWidth = "2",
  className = ""
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
};
