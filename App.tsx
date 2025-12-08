import React, { useState } from 'react';
import { Language, AnalysisResult } from './types';
import { LanguageSelector } from './components/LanguageSelector';
import { FileUpload } from './components/FileUpload';
import { AnalysisResultView } from './components/AnalysisResultView';
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

const SherpaLogo = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4L4 32H36L20 4Z" fill="#4F46E5" fillOpacity="0.2"/>
    <path d="M20 8L8 32H32L20 8Z" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 26L20 22L24 26" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20 32V26" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="16" r="1.5" fill="#4F46E5"/>
  </svg>
);

function App() {
  const [step, setStep] = useState<Step>(Step.LANGUAGE_SELECT);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [analyzingText, setAnalyzingText] = useState("Reading...");

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLanguage(lang);
    setStep(Step.UPLOAD);
  };

  const handleFileSelect = async (file: File) => {
    // Basic validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg("The file is too large. Please ensure it is under 5MB.");
      setStep(Step.ERROR);
      return;
    }

    setStep(Step.PROCESSING);
    setAnalyzingText("Looking at document...");
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        try {
          setAnalyzingText("Understanding...");
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
    setErrorMsg('');
  };

  const handleFullReset = () => {
    setStep(Step.LANGUAGE_SELECT);
    setAnalysisResult(null);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center z-10 sticky top-0 backdrop-blur-md bg-white/70 border-b border-white/50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleFullReset}>
          <div className="bg-indigo-50 p-1.5 rounded-xl group-hover:scale-105 transition-transform duration-300">
             <SherpaLogo />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-800 leading-none">Civic Lens</span>
            <span className="text-xs font-medium text-slate-500 tracking-wide uppercase mt-1">Your Bureaucratic Guide</span>
          </div>
        </div>
        
        {step !== Step.LANGUAGE_SELECT && (
          <button 
            onClick={handleFullReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            {selectedLanguage}
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center justify-start md:justify-center w-full max-w-3xl mx-auto">
        
        {step === Step.LANGUAGE_SELECT && (
          <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            <LanguageSelector onSelect={handleLanguageSelect} selected={selectedLanguage} />
          </div>
        )}

        {step === Step.UPLOAD && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
             <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-center text-slate-800 tracking-tight">
              What can I help you read?
            </h2>
            <p className="text-slate-500 text-center mb-8 text-lg max-w-md">
              Show me the letter or form. I will explain it simply.
            </p>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        )}

        {step === Step.PROCESSING && (
          <div className="flex flex-col items-center text-center animate-in fade-in duration-700 mt-12">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-indigo-100 rounded-full"></div>
              <div className="absolute top-0 left-0 w-24 h-24 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-24 h-24 flex items-center justify-center">
                <span className="text-2xl">🧠</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mt-8 mb-2">{analyzingText}</h2>
            <p className="text-slate-500 text-lg">Translating legalese to {selectedLanguage}...</p>
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
          <div className="text-center p-8 bg-white/80 backdrop-blur rounded-3xl border border-red-100 shadow-xl shadow-red-50 max-w-sm animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
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
        )}
      </main>
    </div>
  );
}

export default App;