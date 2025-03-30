import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  label?: string;
}

export default function Spinner({ 
  size = 'medium', 
  color = '#4a3520',
  label
}: SpinnerProps) {
  // Size mapping
  const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeMap[size]} border-4 border-t-transparent rounded-full animate-spin`} 
        style={{ borderColor: `${color} transparent transparent transparent` }}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <p className="mt-2 text-sm font-medium" style={{ color }}>
          {label}
        </p>
      )}
    </div>
  );
}
