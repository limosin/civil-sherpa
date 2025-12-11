import React, { useState } from 'react';
import { Language, LANGUAGE_CONFIGS } from '../types';

interface LanguageSelectorProps {
  onSelect: (lang: Language) => void;
  selected?: Language;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect, selected }) => {
  const [search, setSearch] = useState('');

  const filteredLanguages = Object.values(Language).filter(lang => 
    LANGUAGE_CONFIGS[lang].label.toLowerCase().includes(search.toLowerCase()) ||
    lang.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col items-center w-full px-4">
      <h2 className="text-3xl font-extrabold mb-2 text-slate-800 text-center tracking-tight">
        Choose your language
      </h2>
      <p className="text-slate-500 mb-8 text-center">
        Select the dialect you want to hear.
      </p>
      
      {/* Search Bar */}
      <div className="relative w-full max-w-md mb-8 group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 font-medium"
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
        {filteredLanguages.length > 0 ? (
          filteredLanguages.map((lang) => {
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
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">
            No languages found matching "{search}"
          </div>
        )}
      </div>
    </div>
  );
};