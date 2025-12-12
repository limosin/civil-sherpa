import React, { useEffect, useState } from 'react';
import { Annotation } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Handle ESM default export quirk for pdfjs-dist
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Initialize PDF.js worker
// Use cdnjs which is known to host the worker correctly for browser usage
if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface DocCanvasProps {
  imageSrc: string;
  annotations: Annotation[];
  focusedBox?: number[] | null; // Optional: [ymin, xmin, ymax, xmax]
  zoom?: number;
}

export const DocCanvas: React.FC<DocCanvasProps> = ({ imageSrc, annotations, focusedBox, zoom = 1 }) => {
  const [renderedImage, setRenderedImage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const isPdf = imageSrc.startsWith('data:application/pdf');

  useEffect(() => {
    let active = true;

    if (!isPdf) {
      setRenderedImage(imageSrc);
      return;
    }

    const renderPdf = async () => {
      setIsRendering(true);
      setError(null);
      try {
        // Use the resolved pdfjs object
        const loadingTask = pdfjs.getDocument(imageSrc);
        const pdf = await loadingTask.promise;
        
        if (!active) return;
        setPageCount(pdf.numPages);

        // Render first page
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 }); // Render at high quality
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          if (active) {
            setRenderedImage(canvas.toDataURL('image/jpeg'));
          }
        }
      } catch (err: any) {
        console.error("Error rendering PDF:", err);
        if (active) {
            setError(err.message || "Failed to render PDF");
        }
      } finally {
        if (active) setIsRendering(false);
      }
    };

    renderPdf();

    return () => { active = false; };
  }, [imageSrc, isPdf]);

  const getStyleForType = (type: string) => {
    switch(type) {
      case 'signature':
        return 'border-indigo-600 bg-indigo-500/20 shadow-[0_0_10px_rgba(79,70,229,0.3)]';
      case 'warning':
        return 'border-red-600 bg-red-500/20 shadow-[0_0_10px_rgba(220,38,38,0.3)]';
      case 'date':
      case 'input':
      default:
        return 'border-blue-500 bg-blue-400/20';
    }
  };

  const toStyle = (box: number[]) => {
    const [ymin, xmin, ymax, xmax] = box;
    return {
      top: `${ymin / 10}%`,
      left: `${xmin / 10}%`,
      height: `${(ymax - ymin) / 10}%`,
      width: `${(xmax - xmin) / 10}%`,
    };
  };

  if (isRendering) {
     return (
        <div 
          className="flex items-center justify-center w-full bg-slate-50 rounded-lg border border-slate-200"
          style={{ height: '80vh', minHeight: '600px' }}
        >
           <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-medium text-sm">Converting Document...</p>
           </div>
        </div>
     );
  }
  
  if (error) {
     return (
        <div 
          className="flex items-center justify-center w-full bg-red-50 rounded-lg border border-red-200 p-8"
          style={{ height: '50vh', minHeight: '300px' }}
        >
           <div className="flex flex-col items-center gap-3 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 font-bold">Could not display PDF</p>
              <p className="text-red-400 text-sm max-w-xs">{error}</p>
           </div>
        </div>
     );
  }

  if (!renderedImage) return null;

  return (
    <div 
      className="relative transition-transform duration-200 ease-out origin-top-left"
      style={{ 
        width: `${zoom * 100}%`,
        minWidth: '100%'
      }}
    >
      <img 
        src={renderedImage} 
        alt="Document Analysis" 
        className="w-full h-auto object-contain rounded-lg shadow-sm" 
      />
      
      {/* PDF Page Indicator */}
      {isPdf && pageCount > 1 && (
         <div className="absolute top-4 right-4 bg-slate-900/90 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm z-30 pointer-events-none border border-white/10">
            Page 1 of {pageCount}
         </div>
      )}

      {/* Standard Annotations (Signature, etc.) */}
      {annotations.map((ann, idx) => (
        <div 
          key={idx}
          className={`absolute border-2 rounded group cursor-help transition-all duration-300 ${getStyleForType(ann.type)}`}
          style={toStyle(ann.box_2d)}
        >
          {/* Tooltip Label */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl border border-white/20">
            {ann.label}
            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 rotate-45 border-r border-b border-white/20"></div>
          </div>
        </div>
      ))}

      {/* Focused Box Overlay (High Priority) */}
      {focusedBox && (
        <div 
          className="absolute border-[3px] border-fuchsia-500 bg-fuchsia-500/20 rounded z-20 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(217,70,239,0.6)] transition-all duration-300 backdrop-blur-[1px]"
          style={toStyle(focusedBox)}
        >
        </div>
      )}
    </div>
  );
};