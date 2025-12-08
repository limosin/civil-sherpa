import React from 'react';

export type PandaState = 'idle' | 'listening' | 'scanning' | 'thinking' | 'alert' | 'worried';

interface PandaAvatarProps {
  state: PandaState;
  className?: string;
}

export const PandaAvatar: React.FC<PandaAvatarProps> = ({ state, className = '' }) => {
  // Mapping logic for a 3x3 Sprite Sheet
  // Assuming the sheet is a 3x3 grid. 
  // background-size: 300% 300% ensures one cell fills the div.
  // positions: x% y%
  
  const getPosition = (s: PandaState) => {
    switch (s) {
      case 'idle':
        return '0% 0%'; // Top-Left
      case 'listening':
        return '100% 0%'; // Top-Right (Speaking/Waving)
      case 'scanning':
        return '50% 0%'; // Top-Center (Magnifying Glass)
      case 'thinking':
        return '50% 50%'; // Center-Center (Chin tap)
      case 'alert':
        return '0% 100%'; // Bottom-Left (Stop Sign / Warning)
      case 'worried':
        return '100% 100%'; // Bottom-Right (Hands up/Scared)
      default:
        return '0% 0%';
    }
  };

  const getAnimation = (s: PandaState) => {
    switch (s) {
      case 'scanning':
        return 'animate-[sway_2s_ease-in-out_infinite]';
      case 'thinking':
        return 'animate-pulse';
      case 'alert':
        return 'animate-[bounce_0.5s_infinite]';
      case 'idle':
      default:
        return 'animate-[breathe_3s_ease-in-out_infinite]';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Container for the avatar */}
      <div 
        className={`
          w-40 h-40 md:w-56 md:h-56 mx-auto
          rounded-full bg-white shadow-2xl shadow-indigo-200/50
          border-4 border-white overflow-hidden
          transition-all duration-500
          ${getAnimation(state)}
        `}
      >
        {/* The Sprite Image */}
        <div 
          className="w-full h-full transition-[background-position] duration-500 ease-in-out bg-no-repeat"
          style={{
            backgroundImage: 'url(/panda_sheet.png)', // Fixed: public files are served at root
            backgroundSize: '300% 300%', // 3 cols x 3 rows
            backgroundPosition: getPosition(state),
            // Fallback color if image missing
            backgroundColor: '#f1f5f9' 
          }}
        />
      </div>
      
      {/* Optional: State Badge/Icon Overlay */}
      {state === 'alert' && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-3 rounded-full shadow-lg animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};