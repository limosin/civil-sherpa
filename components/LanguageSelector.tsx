import React from 'react';
import { Language, LANGUAGE_CONFIGS } from '../types';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
  selected?: Language;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect, selected }) => {
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-3xl font-extrabold mb-8 text-slate-800 text-center tracking-tight">
        Choose your language
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
        {Object.values(Language).map((lang) => {
          const config = LANGUAGE_CONFIGS[lang];
          const isSelected = selected === lang;
          return (
            <button
              key={lang}
              onClick={() => onSelect(lang)}
              className={`
                group relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300
                ${isSelected 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105 ring-4 ring-indigo-100' 
                  : 'bg-white hover:bg-white text-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 border border-slate-200'}
              `}
            >
              <div className={`
                text-4xl mb-3 transition-transform duration-300 group-hover:scale-110
                ${isSelected ? 'scale-110' : ''}
              `}>
                {config.flag}
              </div>
              <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {config.label}
              </span>
              
              {!isSelected && (
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-100 rounded-3xl transition-colors"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};