import React, { useEffect, useState, useCallback } from 'react';
import { AnalysisResult, Language } from '../types';
import { generateSpeech, playAudioBuffer } from '../services/geminiService';
import { DocCanvas } from './DocCanvas';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  language: Language;
  imageSrc: string | null;
  onReset: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, language, imageSrc, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Interactive State
  const [highlightedBox, setHighlightedBox] = useState<number[] | null>(null);

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
    'Low': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🟢', label: 'Safe Timeline' },
    'Medium': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡', label: 'Action Needed' },
    'High': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: '🟠', label: 'Important' },
    'Critical': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '🔴', label: 'Urgent Action' }
  };
  
  const urgency = urgencyConfig[result.urgency] || urgencyConfig['Medium'];

  const scrollToDoc = () => {
    const docEl = document.getElementById('doc-view');
    if (docEl) docEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleInteraction = (box?: number[]) => {
    if (box && box.length === 4) {
      setHighlightedBox(box);
    } else {
      setHighlightedBox(null);
    }
  };

  return (
    <div className="w-full px-4 md:px-8 pb-32">
      
      {/* 1. Header Section: Summary, Sender & Audio (Full Width) */}
      <div className="max-w-5xl mx-auto mb-12 text-center pt-4">
         <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
             <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-bold uppercase tracking-wider shadow-sm">
               {result.sender}
             </span>
             <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border shadow-sm ${urgency.bg} ${urgency.border} ${urgency.text}`}>
               <span className="text-sm font-bold uppercase">{urgency.label}</span>
             </div>
         </div>

         <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
            {result.summary}
         </h1>

          <div className="flex justify-center">
            <button 
                onClick={handlePlay}
                disabled={!audioBuffer || isPlaying}
                className={`
                  group relative flex items-center justify-center gap-3 py-3 px-8 rounded-full transition-all duration-300
                  ${!audioBuffer ? 'bg-slate-100 cursor-not-allowed' : isPlaying ? 'bg-indigo-600 ring-4 ring-indigo-100' : 'bg-slate-900 hover:bg-slate-800 shadow-xl shadow-indigo-200/50 hover:-translate-y-1'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${!audioBuffer ? 'bg-slate-300 text-slate-500' : 'bg-white/20 text-white'}
                `}>
                  {isLoadingAudio ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : isPlaying ? (
                     <div className="flex gap-0.5 h-3 items-end">
                       <div className="w-0.5 bg-white animate-[pulse_1s_ease-in-out_infinite] h-full"></div>
                       <div className="w-0.5 bg-white animate-[pulse_1.2s_ease-in-out_infinite] h-3/4"></div>
                       <div className="w-0.5 bg-white animate-[pulse_0.8s_ease-in-out_infinite] h-full"></div>
                    </div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                 <span className={`font-bold text-lg ${!audioBuffer ? 'text-slate-400' : 'text-white'}`}>
                  {isPlaying ? 'Listening...' : 'Listen to Explanation'}
                </span>
            </button>
          </div>
      </div>

      {/* 2. Main Grid: Document vs Details */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start max-w-[1800px] mx-auto">
        
        {/* Left Column: Interactive Document (Dominant) */}
        <div className="order-2 xl:order-1 xl:col-span-7 xl:sticky xl:top-24" id="doc-view">
           <div className="bg-slate-50 rounded-[2rem] p-2 md:p-6 shadow-inner border border-slate-200 overflow-hidden relative">
            <div className="absolute top-6 right-6 z-10 bg-white/90 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm pointer-events-none border border-slate-200">
              Interactive Document View
            </div>
            {imageSrc ? (
              <DocCanvas 
                imageSrc={imageSrc} 
                annotations={result.annotations} 
                focusedBox={highlightedBox}
              />
            ) : (
              <div className="aspect-[3/4] flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl border border-dashed border-slate-300">
                No Preview Available
              </div>
            )}
             <p className="mt-4 text-sm text-slate-400 text-center font-medium">
              Hover or tap items on the right to locate them in the document.
            </p>
          </div>
        </div>

        {/* Right Column: Analysis Details */}
        <div className="order-1 xl:order-2 xl:col-span-5 space-y-6">
          
          {/* RISKS & RIGHTS Section */}
          <div className="grid grid-cols-1 gap-4">
            {/* Risks */}
            {result.risks && result.risks.length > 0 && (
              <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                <div className="flex items-center gap-2 mb-4 text-orange-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-bold uppercase tracking-wide text-sm">Traps & Fine Print</h3>
                </div>
                <ul className="space-y-3">
                  {result.risks.map((risk, i) => (
                    <li 
                      key={i} 
                      className="group cursor-pointer p-3 -mx-2 rounded-xl bg-white/50 hover:bg-white border border-transparent hover:border-orange-200 transition-all shadow-sm hover:shadow-md"
                      onMouseEnter={() => handleInteraction(risk.box_2d)}
                      onMouseLeave={() => handleInteraction(undefined)}
                      onClick={() => { handleInteraction(risk.box_2d); scrollToDoc(); }}
                    >
                      <div className="text-orange-900 text-sm font-bold leading-snug flex items-start gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform"></span>
                        <div className="flex-1">
                          {risk.description}
                        </div>
                         {risk.box_2d && (
                            <span className="text-xs text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Show ↗
                            </span>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Rights */}
            {result.rights && result.rights.length > 0 && (
              <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                 <div className="flex items-center gap-2 mb-4 text-blue-800">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.352-.272-2.636-.759-3.808a.75.75 0 00-.772-.516 11.209 11.209 0 01-7.703-3.257z" clipRule="evenodd" />
                  </svg>
                  <h3 className="font-bold uppercase tracking-wide text-sm">Your Rights</h3>
                </div>
                <ul className="space-y-3">
                  {result.rights.map((right, i) => (
                    <li 
                      key={i} 
                      className="group cursor-pointer p-3 -mx-2 rounded-xl bg-white/50 hover:bg-white border border-transparent hover:border-blue-200 transition-all shadow-sm hover:shadow-md"
                      onMouseEnter={() => handleInteraction(right.box_2d)}
                      onMouseLeave={() => handleInteraction(undefined)}
                      onClick={() => { handleInteraction(right.box_2d); scrollToDoc(); }}
                    >
                      <div className="text-blue-900 text-sm font-bold leading-snug flex items-start gap-3">
                        <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 group-hover:scale-150 transition-transform"></span>
                        <div className="flex-1">
                           {right.description}
                        </div>
                           {right.box_2d && (
                            <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Show ↗
                            </span>
                          )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action Items List */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 mb-2 ml-1">
              <h3 className="text-2xl font-extrabold text-slate-900">Your Action Plan</h3>
            </div>
            
            {result.actionItems.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-md shadow-slate-100 flex gap-4 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer hover:border-indigo-200 group"
                onMouseEnter={() => handleInteraction(item.box_2d)}
                onMouseLeave={() => handleInteraction(undefined)}
                onClick={() => { handleInteraction(item.box_2d); scrollToDoc(); }}
              >
                <div className="mt-1">
                   <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors shadow-sm">
                     {idx + 1}
                   </div>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-slate-900 leading-tight mb-3 group-hover:text-indigo-700 transition-colors">
                    {item.what}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {item.when && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-red-50 text-red-700 text-sm font-bold border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                        </svg>
                        Due {item.when}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 text-slate-600 text-sm font-semibold border border-slate-200">
                      {item.how}
                    </span>
                    {item.box_2d && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                         🔍 Locate on Doc
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Floating Action Button for New Scan */}
      <div className="fixed bottom-8 left-0 right-0 px-6 flex justify-center z-20 pointer-events-none">
        <button 
          onClick={onReset}
          className="pointer-events-auto bg-slate-900 text-white font-bold py-4 px-8 rounded-full shadow-2xl flex items-center gap-3 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 border-4 border-white/20 backdrop-blur-sm"
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