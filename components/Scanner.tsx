import React, { useState, useEffect } from 'react';
import { Language, AnalysisResult, LANGUAGE_CONFIGS } from '../types';
import { LanguageSelector } from './LanguageSelector';
import { FileUpload } from './FileUpload';
import { AnalysisResultView } from './AnalysisResultView';
import { analyzeDocument } from '../services/geminiService';

enum Step {
  LANGUAGE_SELECT,
  UPLOAD,
  PROCESSING,
  RESULT,
  ERROR
}

// 5MB Limit
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const STORAGE_KEY_LANG = 'civic_lens_lang';

export const Scanner: React.FC = () => {
  const [step, setStep] = useState<Step>(Step.LANGUAGE_SELECT);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [analyzingText, setAnalyzingText] = useState("Reading...");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY_LANG);
    if (savedLang) {
      const validLang = Object.values(Language).includes(savedLang as Language) 
        ? (savedLang as Language) 
        : null;
      
      if (validLang) {
        setSelectedLanguage(validLang);
        setStep(Step.UPLOAD);
      }
    }
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    localStorage.setItem(STORAGE_KEY_LANG, lang);
    setStep(Step.UPLOAD);
  };

  const handleChangeLanguage = () => {
    setStep(Step.LANGUAGE_SELECT);
    setAnalysisResult(null);
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("The file is too large. Please ensure it is under 5MB.");
      setStep(Step.ERROR);
      return;
    }

    setStep(Step.PROCESSING);
    setAnalyzingText("Scanning for traps...");
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setFilePreview(base64String);
        
        try {
          setTimeout(() => {
            setAnalyzingText("Translating legalese...");
          }, 2000);

          const result = await analyzeDocument(base64String, selectedLanguage);
          setAnalysisResult(result);
          setStep(Step.RESULT);
          
        } catch (err) {
          console.error(err);
          setErrorMsg("I couldn't read that properly. Please try again with a clearer image or document.");
          setStep(Step.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg("Failed to process the file.");
      setStep(Step.ERROR);
    }
  };

  const handleReset = () => {
    setStep(Step.UPLOAD);
    setAnalysisResult(null);
    setFilePreview(null);
    setErrorMsg('');
  };

  const currentLangConfig = LANGUAGE_CONFIGS[selectedLanguage];

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
       {/* Language Badge */}
      {step !== Step.LANGUAGE_SELECT && (
        <div className="flex justify-end mb-4 px-4">
           <button 
            onClick={handleChangeLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {selectedLanguage}
          </button>
        </div>
      )}

      {step === Step.LANGUAGE_SELECT && (
        <div className="w-full animate-in fade-in zoom-in-95 duration-500">
          <LanguageSelector onSelect={handleLanguageSelect} selected={selectedLanguage} />
        </div>
      )}

      {step === Step.UPLOAD && (
        <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500 px-4">
           
           {/* Active Language Animation */}
           <div className="mb-6 animate-in zoom-in-50 slide-in-from-top-4 duration-700 delay-100">
             <div className="inline-flex items-center gap-3 px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 shadow-sm">
                <span className="text-2xl animate-[bounce_2s_infinite]">{currentLangConfig.flag}</span>
                <span className="font-bold text-sm">Active: {currentLangConfig.label} Mode</span>
             </div>
           </div>

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
        <div className="flex flex-col items-center text-center animate-in fade-in duration-700 mt-20 px-4">
          <div className="mb-8 relative">
              <div className="absolute inset-0 bg-indigo-200/50 blur-2xl rounded-full"></div>
              <div className="relative w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-indigo-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2 transition-all duration-300">{analyzingText}</h2>
          <p className="text-slate-500 text-lg">I am reading every word for you.</p>
        </div>
      )}

      {step === Step.RESULT && analysisResult && (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
          <AnalysisResultView 
            result={analysisResult} 
            language={selectedLanguage}
            imageSrc={filePreview}
            onReset={handleReset}
          />
        </div>
      )}

      {step === Step.ERROR && (
        <div className="px-4 flex justify-center">
          <div className="text-center p-8 bg-white/80 backdrop-blur rounded-3xl border border-red-100 shadow-xl shadow-red-50 max-w-sm animate-in zoom-in-95 mt-20">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">I couldn't read that</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{errorMsg}</p>
            <button 
              onClick={handleReset}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};