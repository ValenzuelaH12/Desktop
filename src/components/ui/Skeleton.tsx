import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width, 
  height, 
  variant = 'rect' 
}) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div 
      className={`skeleton skeleton-${variant} ${className}`} 
      style={style}
    />
  );
};
