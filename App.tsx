import React, { useState, useEffect } from 'react';
import { Language, AnalysisResult } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { FileUpload } from './components/FileUpload';
import { AnalysisResultView } from './components/AnalysisResultView';
import { PandaAvatar, PandaState } from './components/PandaAvatar';
import { analyzeDocument } from './services/geminiService';

enum Step {
  LANGUAGE_SELECT,
  UPLOAD,
  PROCESSING,
  RESULT,
  ERROR
}

// 5MB Limit for tangible file size restriction
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const STORAGE_KEY_LANG = 'civic_lens_lang';

function App() {
  const [step, setStep] = useState<Step>(Step.LANGUAGE_SELECT);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [analyzingText, setAnalyzingText] = useState("Reading...");
  
  // Animation State
  const [pandaState, setPandaState] = useState<PandaState>('idle');

  // Load language from local storage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY_LANG);
    if (savedLang) {
      const validLang = Object.values(Language).includes(savedLang as Language) 
        ? (savedLang as Language) 
        : null;
      
      if (validLang) {
        setSelectedLanguage(validLang);
        setStep(Step.UPLOAD);
        setPandaState('idle');
      }
    }
  }, []);

  // Tailwind Custom Animations (Add this style block or configure tailwind.config)
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes sway {
        0%, 100% { transform: rotate(-3deg); }
        50% { transform: rotate(3deg); }
      }
      @keyframes breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    localStorage.setItem(STORAGE_KEY_LANG, lang);
    setStep(Step.UPLOAD);
  };

  const handleChangeLanguage = () => {
    setStep(Step.LANGUAGE_SELECT);
    setAnalysisResult(null);
    setPandaState('idle');
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("The file is too large. Please ensure it is under 5MB.");
      setStep(Step.ERROR);
      setPandaState('worried');
      return;
    }

    setStep(Step.PROCESSING);
    setAnalyzingText("Scanning for traps...");
    setPandaState('scanning');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          // Sequence of animations during processing
          setTimeout(() => {
            setAnalyzingText("Translating legalese...");
            setPandaState('thinking');
          }, 2000);

          const result = await analyzeDocument(base64String, selectedLanguage);
          setAnalysisResult(result);
          setStep(Step.RESULT);
          
          // Determine final Panda mood based on result
          const hasHighRisk = result.urgency === 'Critical' || result.urgency === 'High' || result.risks.length > 0;
          setPandaState(hasHighRisk ? 'alert' : 'listening');

        } catch (err) {
          console.error(err);
          setErrorMsg("I couldn't read that properly. Please try again with a clearer image or document.");
          setStep(Step.ERROR);
          setPandaState('worried');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg("Failed to process the file.");
      setStep(Step.ERROR);
      setPandaState('worried');
    }
  };

  const handleReset = () => {
    setStep(Step.UPLOAD);
    setAnalysisResult(null);
    setErrorMsg('');
    setPandaState('idle');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center z-10 sticky top-0 backdrop-blur-md bg-white/70 border-b border-white/50 transition-all">
        <div className="flex items-center gap-3 select-none">
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-800 leading-none">Civic Lens</span>
            <span className="text-xs font-bold text-slate-400 tracking-wide uppercase mt-1">Civil Rights Shield</span>
          </div>
        </div>
        
        {step !== Step.LANGUAGE_SELECT && (
          <button 
            onClick={handleChangeLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {selectedLanguage}
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto relative pt-8 md:pt-12 px-4">
        
        {/* The Sherpa Avatar - Persistent Character */}
        <div className={`
           mb-8 transition-all duration-700
           ${step === Step.RESULT ? 'scale-75 mb-4' : 'scale-100'}
        `}>
          <PandaAvatar state={pandaState} />
        </div>

        {step === Step.LANGUAGE_SELECT && (
          <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <LanguageSelector onSelect={handleLanguageSelect} selected={selectedLanguage} />
          </div>
        )}

        {step === Step.UPLOAD && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
             <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-center text-slate-800 tracking-tight">
              I am your shield.
            </h2>
            <p className="text-slate-500 text-center mb-8 text-lg max-w-md leading-relaxed">
              Upload that confusing letter. I will check for hidden traps and tell you your rights.
            </p>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        )}

        {step === Step.PROCESSING && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-700 mt-4">
            <h2 className="text-2xl font-bold text-slate-800 mb-2 transition-all duration-300">{analyzingText}</h2>
            <p className="text-slate-500 text-lg">I am reading every word for you.</p>
          </div>
        )}

        {step === Step.RESULT && analysisResult && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AnalysisResultView 
              result={analysisResult} 
              language={selectedLanguage}
              onReset={handleReset}
            />
          </div>
        )}

        {step === Step.ERROR && (
          <div className="text-center p-8 bg-white/80 backdrop-blur rounded-3xl border border-red-100 shadow-xl shadow-red-50 max-w-sm animate-in zoom-in-95 mt-4">
            <h3 className="text-xl font-bold text-slate-800 mb-2">I couldn't read that</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{errorMsg}</p>
            <button 
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;