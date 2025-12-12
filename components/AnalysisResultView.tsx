import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AnalysisResult, Language } from '../types';
import { generateSpeech } from '../services/geminiService';
import { DocCanvas } from './DocCanvas';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  language: Language;
  imageSrc: string | null;
  onReset: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ result, language, imageSrc, onReset }) => {
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('loading');
  const [zoom, setZoom] = useState(1);
  const [mobileTab, setMobileTab] = useState<'plan' | 'doc'>('plan');
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  
  // Interactive State
  const [highlightedBox, setHighlightedBox] = useState<number[] | null>(null);
  const [highlightedPage, setHighlightedPage] = useState<number | undefined>(undefined);

  // Load audio automatically on mount
  useEffect(() => {
    let active = true;
    const fetchAudio = async () => {
      try {
        const buffer = await generateSpeech(result.translatedSpeechText, language);
        if (active) {
          audioBufferRef.current = buffer;
          setAudioState('idle'); // Ready to play
        }
      } catch (error) {
        console.error("Failed to generate speech", error);
        if (active) setAudioState('idle'); // Just falback to idle even if failed
      }
    };
    fetchAudio();
    
    return () => { 
      active = false;
      if (sourceRef.current) sourceRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [result.translatedSpeechText, language]);

  const handleTogglePlay = async () => {
    if (!audioBufferRef.current) return;

    // Initialize Context if needed
    if (!audioContextRef.current) {
       audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    if (audioState === 'playing') {
       // Pause
       if (audioContextRef.current.state === 'running') {
         await audioContextRef.current.suspend();
         setAudioState('paused');
       }
    } else if (audioState === 'paused') {
       // Resume
       if (audioContextRef.current.state === 'suspended') {
         await audioContextRef.current.resume();
         setAudioState('playing');
       }
    } else {
       // Start from beginning
       if (sourceRef.current) {
          sourceRef.current.disconnect();
       }
       
       const source = audioContextRef.current.createBufferSource();
       source.buffer = audioBufferRef.current;
       source.connect(audioContextRef.current.destination);
       source.onended = () => {
          // Only reset if we naturally finished, not just paused
          if (audioContextRef.current?.state === 'running') {
             setAudioState('idle');
          }
       };
       source.start(0);
       sourceRef.current = source;
       setAudioState('playing');
       
       // Ensure context is running (sometimes needed after stop/close)
       if (audioContextRef.current.state === 'suspended') {
         await audioContextRef.current.resume();
       }
    }
  };

  const urgencyConfig = {
    'Low': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Safe Timeline' },
    'Medium': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Action Needed' },
    'High': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500', label: 'Important' },
    'Critical': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500', label: 'Urgent Action' }
  };
  
  const urgency = urgencyConfig[result.urgency] || urgencyConfig['Medium'];

  const handleInteraction = (box?: number[], page?: number) => {
    if (box && box.length === 4) {
      setHighlightedBox(box);
      setHighlightedPage(page);
      // On mobile, if they click a box item, switch to doc view to show it
      if (window.innerWidth < 1024) {
        setMobileTab('doc');
      }
    } else {
      setHighlightedBox(null);
      setHighlightedPage(undefined);
    }
  };

  return (
    // Workspace Container: Fixed height to window minus header (approx 5rem)
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-white overflow-hidden">
      
      {/* 1. Toolbar / Header Row */}
      <div className="h-16 shrink-0 border-b border-slate-200 bg-white px-4 md:px-6 flex items-center justify-between shadow-sm z-20 relative">
         <div className="flex items-center gap-3 md:gap-4 min-w-0">
             <button 
                onClick={onReset}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Back to Scan"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
             </button>
             
             <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{result.sender}</span>
                   <div className={`flex items-center gap-1 px-1.5 rounded border ${urgency.bg} ${urgency.border} ${urgency.text} scale-90 origin-left`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${urgency.dot}`}></span>
                       <span className="text-[10px] font-bold uppercase">{urgency.label}</span>
                   </div>
                </div>
                <h1 className="text-sm md:text-base font-bold text-slate-900 truncate max-w-[200px] md:max-w-md leading-tight">
                    {result.summary}
                </h1>
             </div>
         </div>

         <div className="flex items-center gap-2 md:gap-3">
             <button 
                onClick={handleTogglePlay}
                disabled={audioState === 'loading' || !audioBufferRef.current}
                className={`
                  flex items-center gap-2 py-2 px-3 md:px-4 rounded-full transition-all duration-200 font-semibold text-xs md:text-sm
                  ${audioState === 'loading' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 
                    audioState === 'playing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 
                    'bg-slate-900 text-white shadow hover:bg-slate-800'}
                `}
              >
                  {audioState === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : audioState === 'playing' ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden md:inline">Pause</span>
                    </>
                  ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden md:inline">{audioState === 'paused' ? 'Resume' : 'Listen'}</span>
                    </>
                  )}
            </button>
         </div>
      </div>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white">
        <button 
          onClick={() => setMobileTab('plan')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'plan' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Action Plan
        </button>
        <button 
          onClick={() => setMobileTab('doc')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'doc' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
        >
          Document
        </button>
      </div>

      {/* 2. Split Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
         
         {/* Left Panel: Document Viewer */}
         <div className={`
            flex-1 bg-slate-100 relative flex flex-col min-w-0 transition-transform duration-300 absolute inset-0 lg:static z-10 lg:z-auto
            ${mobileTab === 'doc' ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
         `}>
             {/* Zoom Controls Overlay */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur border border-slate-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-4">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="text-slate-500 hover:text-indigo-600 p-1">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" /></svg>
                </button>
                <span className="text-xs font-bold text-slate-700 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="text-slate-500 hover:text-indigo-600 p-1">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>
                </button>
             </div>

             {/* Scrollable Canvas Area */}
             <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar flex items-start justify-center bg-slate-100/50">
                 <div className="bg-white shadow-2xl rounded-sm transition-transform duration-200 origin-top" style={{ minWidth: 'fit-content' }}>
                   {imageSrc ? (
                      <DocCanvas 
                        imageSrc={imageSrc} 
                        annotations={result.annotations} 
                        focusedBox={highlightedBox}
                        focusedPage={highlightedPage}
                        zoom={zoom}
                      />
                    ) : (
                      <div className="w-[300px] h-[400px] flex items-center justify-center text-slate-300">No Document</div>
                    )}
                 </div>
             </div>
         </div>

         {/* Right Panel: Analysis Sidebar */}
         <div className={`
            w-full lg:w-[480px] xl:w-[550px] bg-white lg:border-l border-slate-200 overflow-y-auto flex-shrink-0 z-10 shadow-xl lg:shadow-none absolute inset-0 lg:static bg-white transition-transform duration-300
            ${mobileTab === 'plan' ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
         `}>
            <div className="p-4 md:p-6 space-y-8 pb-32">
                
                {/* Action Plan */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-indigo-200">1</div>
                        <h3 className="text-xl font-bold text-slate-900">Action Plan</h3>
                    </div>
                    <div className="space-y-4">
                      {result.actionItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`
                            bg-white p-5 rounded-2xl border transition-all cursor-pointer group
                            ${item.box_2d ? 'border-indigo-100 hover:border-indigo-400 hover:ring-1 hover:ring-indigo-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'}
                          `}
                          onClick={() => { handleInteraction(item.box_2d, item.page); }}
                        >
                          <div className="flex gap-4">
                             <div className="flex-1">
                                <p className="text-lg font-semibold text-slate-800 leading-snug mb-3 group-hover:text-indigo-700">
                                  {item.what}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {item.when && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-wide">
                                      Due {item.when}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                    {item.how}
                                  </span>
                                </div>
                             </div>
                             {/* Locator Icon if Box Exists */}
                             {item.box_2d && (
                               <div className="flex-shrink-0 self-center">
                                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" title={`Show on page ${item.page || 1}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.62.829.799 1.654 1.38 2.274 1.766a11.267 11.267 0 00.758.434l.017.007.006.003h.002zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                 </section>

                 {/* Risks */}
                 {result.risks && result.risks.length > 0 && (
                    <section>
                       <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-orange-500">
                            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                          </svg>
                          Traps & Fine Print
                       </h3>
                       <div className="bg-orange-50/30 rounded-2xl border border-orange-100 overflow-hidden">
                          {result.risks.map((risk, i) => (
                             <div 
                              key={i}
                              className={`
                                p-4 border-b border-orange-100 last:border-0 hover:bg-orange-50 cursor-pointer transition-colors group flex gap-3
                                ${risk.box_2d ? 'hover:bg-orange-100/50' : ''}
                              `}
                              onClick={() => { handleInteraction(risk.box_2d, risk.page); }}
                             >
                               <span className="text-orange-400 mt-0.5">•</span>
                               <div className="flex-1">
                                 <p className="text-sm font-medium text-slate-700 group-hover:text-orange-900 transition-colors leading-relaxed">
                                    {risk.description}
                                 </p>
                               </div>
                               {risk.box_2d && (
                                 <div className="text-orange-300 group-hover:text-orange-500">
                                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.62.829.799 1.654 1.38 2.274 1.766a11.267 11.267 0 00.758.434l.017.007.006.003h.002zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                   </svg>
                                 </div>
                               )}
                             </div>
                          ))}
                       </div>
                    </section>
                 )}

                 {/* Rights */}
                 {result.rights && result.rights.length > 0 && (
                    <section>
                       <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-500">
                            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.651 3 3 0 00-4.982 0 3 3 0 00-3.75 3.651 3 3 0 000 5.304 3 3 0 003.75 3.651 3 3 0 004.982 0 3 3 0 003.75-3.651zM10 8a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          Your Rights
                       </h3>
                       <div className="bg-blue-50/30 rounded-2xl border border-blue-100 overflow-hidden">
                          {result.rights.map((right, i) => (
                             <div 
                              key={i}
                              className={`
                                p-4 border-b border-blue-100 last:border-0 hover:bg-blue-50 cursor-pointer transition-colors group flex gap-3
                                ${right.box_2d ? 'hover:bg-blue-100/50' : ''}
                              `}
                              onClick={() => { handleInteraction(right.box_2d, right.page); }}
                             >
                               <span className="text-blue-400 mt-0.5">•</span>
                               <div className="flex-1">
                                 <p className="text-sm font-medium text-slate-700 group-hover:text-blue-900 transition-colors leading-relaxed">
                                    {right.description}
                                 </p>
                               </div>
                               {right.box_2d && (
                                 <div className="text-blue-300 group-hover:text-blue-500">
                                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.62.829.799 1.654 1.38 2.274 1.766a11.267 11.267 0 00.758.434l.017.007.006.003h.002zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                   </svg>
                                 </div>
                               )}
                             </div>
                          ))}
                       </div>
                    </section>
                 )}
            </div>
         </div>
      </div>
    </div>
  );
};