import React from 'react';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative pt-20 pb-32 overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-indigo-50 to-transparent -z-10 rounded-b-[100px]"></div>
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
             <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">AI-Powered Bureaucracy Shield</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Never get tricked by <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">fine print</span> again.
          </h1>
          
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Civic Lens acts as your personal bureaucratic sherpa. Upload any confusing letter, and we'll translate it, find the traps, and tell you exactly what to do.
          </p>

          <button 
            onClick={onStart}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 active:scale-95 animate-in fade-in zoom-in-90 duration-500 delay-200"
          >
            Start Scanning Free
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <FeatureCard 
            icon="🔎" 
            title="Trap Detection" 
            description="Our AI scans for aggressive deadlines, hidden fees, and predatory legal language." 
          />
          <FeatureCard 
            icon="🗣️" 
            title="Native Dialect" 
            description="Don't just translate text. Hear actionable advice spoken in your native dialect." 
          />
          <FeatureCard 
            icon="📍" 
            title="Visual Guidance" 
            description="Augmented reality overlays show you exactly where to sign and what to date." 
          />
          
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-slate-50 py-24 border-t border-slate-200">
         <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">Empowering Communities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               <CommunityBadge name="National Tenant Union" />
               <CommunityBadge name="Senior Alliance" />
               <CommunityBadge name="Immigrant Defense Project" />
               <CommunityBadge name="Legal Aid Society" />
            </div>
         </div>
      </div>
    </div>
  );
};

const CommunityBadge = ({ name }: { name: string }) => (
  <div className="h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-4 shadow-sm hover:shadow-md transition-shadow">
    <span className="font-bold text-slate-600 text-sm">{name}</span>
  </div>
);

const FeatureCard = ({ icon, title, description }: { icon: string, title: string, description: string }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 hover:-translate-y-2 group">
    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">
      {description}
    </p>
  </div>
);