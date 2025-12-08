import React, { useEffect, useState, useCallback } from 'react';
import { AnalysisResult, Language } from '../types';
import { generateSpeech, playAudioBuffer } from '../services/geminiService';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  language: Language;
  onReset: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, language, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // Load audio automatically on mount
  useEffect(() => {
    let active = true;
    const fetchAudio = async () => {
      setIsLoadingAudio(true);
      try {
        const buffer = await generateSpeech(result.translatedSpeechText, language);
        if (active) {
          setAudioBuffer(buffer);
          setIsLoadingAudio(false);
        }
      } catch (error) {
        console.error("Failed to generate speech", error);
        if (active) setIsLoadingAudio(false);
      }
    };
    fetchAudio();
    return () => { active = false; };
  }, [result.translatedSpeechText, language]);

  const handlePlay = useCallback(() => {
    if (audioBuffer) {
      setIsPlaying(true);
      playAudioBuffer(audioBuffer);
      setTimeout(() => {
        setIsPlaying(false);
      }, audioBuffer.duration * 1000);
    }
  }, [audioBuffer]);

  // Urgency Color Mapping
  const urgencyConfig = {
    'Low': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🟢' },
    'Medium': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' },
    'High': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠' },
    'Critical': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴' }
  };
  
  const urgency = urgencyConfig[result.urgency] || urgencyConfig['Medium'];

  return (
    <div className="w-full max-w-xl mx-auto pb-32">
      
      {/* Summary Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 mb-6 relative overflow-hidden">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="relative z-10 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
            From
          </span>
          <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{result.sender}</h1>
          <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
            {result.summary}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={handlePlay}
            disabled={!audioBuffer || isPlaying}
            className={`
              group relative flex items-center gap-3 pr-8 pl-2 py-2 rounded-full transition-all duration-300
              ${!audioBuffer ? 'bg-slate-100 cursor-not-allowed' : isPlaying ? 'bg-indigo-600 ring-4 ring-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-lg shadow-indigo-200'}
            `}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${!audioBuffer ? 'bg-white' : 'bg-white/20 text-white'}
            `}>
              {isLoadingAudio ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                 <div className="flex gap-0.5 h-4 items-end">
                   <div className="w-1 bg-white animate-[pulse_1s_ease-in-out_infinite] h-full"></div>
                   <div className="w-1 bg-white animate-[pulse_1.2s_ease-in-out_infinite] h-3/4"></div>
                   <div className="w-1 bg-white animate-[pulse_0.8s_ease-in-out_infinite] h-full"></div>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 ml-0.5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`font-bold ${!audioBuffer ? 'text-slate-400' : 'text-white'}`}>
              {isPlaying ? 'Listening...' : 'Listen to explanation'}
            </span>
          </button>
        </div>
      </div>

      {/* Urgency Badge */}
      <div className={`mb-8 p-4 rounded-2xl border flex items-center justify-center gap-3 shadow-sm ${urgency.bg} ${urgency.border} ${urgency.text}`}>
        <span className="text-2xl">{urgency.icon}</span>
        <span className="font-bold text-lg">{result.urgency} Priority</span>
      </div>

      {/* Action Items List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-slate-800">Action Checklist</h3>
        </div>
        
        {result.actionItems.map((item, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md shadow-slate-100 flex gap-4 transition-transform hover:scale-[1.01]">
            <div className="mt-1">
               <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center">
                 {/* Empty circle representing unchecked list */}
               </div>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-900 leading-tight mb-2">
                {item.what}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {item.when && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-sm font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                    </svg>
                    Due {item.when}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-sm font-medium">
                  {item.how}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button for New Scan */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-20">
        <button 
          onClick={onReset}
          className="bg-slate-900 text-white font-bold py-4 px-8 rounded-full shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 border-4 border-white/20 backdrop-blur-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          </svg>
          Scan Another
        </button>
      </div>
    </div>
  );
};