import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Container */}
      <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md shadow-indigo-200 shrink-0">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className="w-5 h-5"
        >
          <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.352-.272-2.636-.759-3.808a.75.75 0 00-.772-.516 11.209 11.209 0 01-7.703-3.257z" clipRule="evenodd" />
        </svg>
      </div>
      
      {/* Text Container */}
      <div className="flex flex-col justify-center">
        <span className="font-extrabold text-lg text-slate-800 leading-none tracking-tight whitespace-nowrap">Civic Lens</span>
        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5 whitespace-nowrap">Civil Rights Shield</span>
      </div>
    </div>
  );
};