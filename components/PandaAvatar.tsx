import React, { useState } from 'react';

export type PandaState = 'idle' | 'listening' | 'scanning' | 'thinking' | 'alert' | 'worried';

interface PandaAvatarProps {
  state: PandaState;
  className?: string;
}

// Hosted sprite sheet URL
const PANDA_IMAGE_URL = 'https://res.cloudinary.com/dft5dlcya/image/upload/v1765188873/civic-lens/panda-sheet_knbxsh.png';

export const PandaAvatar: React.FC<PandaAvatarProps> = ({ state, className = '' }) => {
  const [imageError, setImageError] = useState(false);

  // Mapping logic for a 3x3 Sprite Sheet
  // positions: x% y%
  const getPosition = (s: PandaState) => {
    switch (s) {
      case 'idle':
        return '0% 0%'; // Top-Left
      case 'listening':
        return '100% 0%'; // Top-Right
      case 'scanning':
        return '50% 0%'; // Top-Center
      case 'thinking':
        return '50% 50%'; // Center-Center
      case 'alert':
        return '0% 100%'; // Bottom-Left
      case 'worried':
        return '100% 100%'; // Bottom-Right
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

  const getFallbackEmoji = (s: PandaState) => {
    switch (s) {
      case 'idle': return '🐼';
      case 'listening': return '👋';
      case 'scanning': return '🔍';
      case 'thinking': return '🤔';
      case 'alert': return '🛑';
      case 'worried': return '😨';
      default: return '🐼';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden image to trigger load error detection */}
      <img 
        src={PANDA_IMAGE_URL} 
        alt="Panda Sprite Sheet"
        onError={() => setImageError(true)}
        className="hidden" 
      />

      {/* Container for the avatar */}
      <div 
        className={`
          w-40 h-40 md:w-56 md:h-56 mx-auto
          rounded-full bg-white shadow-2xl shadow-indigo-200/50
          border-4 border-white overflow-hidden
          flex items-center justify-center
          transition-all duration-500
          ${getAnimation(state)}
        `}
      >
        {imageError ? (
          // Fallback UI if image is missing
          <div className="text-8xl select-none filter drop-shadow-sm">
            {getFallbackEmoji(state)}
          </div>
        ) : (
          // Sprite Image UI
          // scaled up 1.5x and shifted up to crop labels and center face
          <div 
            className="w-full h-full transition-[background-position] duration-500 ease-in-out bg-no-repeat transform scale-[1.5] -translate-y-4"
            style={{
              backgroundImage: `url(${PANDA_IMAGE_URL})`, 
              backgroundSize: '300% 300%', // 3 cols x 3 rows
              backgroundPosition: getPosition(state),
            }}
          />
        )}
      </div>
      
      {/* Optional: State Badge/Icon Overlay for extra emphasis */}
      {state === 'alert' && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white p-3 rounded-full shadow-lg animate-bounce z-10">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
};