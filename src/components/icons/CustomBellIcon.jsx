import React from 'react';

export default function CustomBellIcon({ 
  size = 24, 
  color = "currentColor", 
  strokeWidth = 2,
  isShaking = false 
}) {
  return (
    <>
      <style>
        {`
          /* 6-second total loop: 3s shaking, 3s resting */
          @keyframes bell-ring-pause {
            0%   { transform: rotate(0); }
            5%   { transform: rotate(25deg); }
            10%  { transform: rotate(-20deg); }
            15%  { transform: rotate(25deg); }
            20%  { transform: rotate(-20deg); }
            25%  { transform: rotate(25deg); }
            30%  { transform: rotate(-20deg); }
            35%  { transform: rotate(25deg); }
            40%  { transform: rotate(-20deg); }
            45%  { transform: rotate(25deg); }
            50%  { transform: rotate(0); } /* Shaking stops at 3 seconds (50% of 6s) */
            100% { transform: rotate(0); } /* Stays completely still for the remaining 3 seconds */
          }
          
          .animate-bell-pause {
            animation: bell-ring-pause 6s ease-in-out infinite;
            transform-origin: top center; 
          }
        `}
      </style>

      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className={isShaking ? "animate-bell-pause" : ""} 
        style={{ display: 'inline-block' }}
      >
        <path d="M8 17v-6a4 4 0 0 1 8 0v6" />
        <line x1="5" y1="17" x2="19" y2="17" />
        <path d="M11 7a1 1 0 0 1 2 0" />
        <line x1="10.5" y1="21" x2="13.5" y2="21" />
      </svg>
    </>
  );
}