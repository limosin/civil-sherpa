import React from 'react';
import { Annotation } from '../types';

interface DocCanvasProps {
  imageSrc: string;
  annotations: Annotation[];
  focusedBox?: number[] | null; // Optional: [ymin, xmin, ymax, xmax]
}

export const DocCanvas: React.FC<DocCanvasProps> = ({ imageSrc, annotations, focusedBox }) => {
  
  const getStyleForType = (type: string) => {
    switch(type) {
      case 'signature':
        return 'border-indigo-600 bg-indigo-500/10';
      case 'warning':
        return 'border-red-600 bg-red-500/10';
      case 'date':
      case 'input':
      default:
        return 'border-blue-500 bg-blue-400/10';
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

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 shadow-inner bg-slate-50">
      <img 
        src={imageSrc} 
        alt="Document Analysis" 
        className="w-full h-auto object-contain" 
      />
      
      {/* Standard Annotations (Signature, etc.) */}
      {annotations.map((ann, idx) => (
        <div 
          key={idx}
          className={`absolute border-2 rounded-md group cursor-help transition-all duration-300 ${getStyleForType(ann.type)}`}
          style={toStyle(ann.box_2d)}
        >
          {/* Tooltip Label */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
            {ann.label}
            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
          </div>
          
          {/* Type Icon Badge */}
          <div className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xs z-10">
              {ann.type === 'signature' && '✍️'}
              {ann.type === 'warning' && '⚠️'}
              {ann.type === 'date' && '📅'}
              {ann.type === 'input' && '📝'}
          </div>
        </div>
      ))}

      {/* Focused Box Overlay (High Priority) */}
      {focusedBox && (
        <div 
          className="absolute border-4 border-fuchsia-500 bg-fuchsia-500/20 rounded-lg z-20 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all duration-300"
          style={toStyle(focusedBox)}
        >
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-fuchsia-600 rounded-full flex items-center justify-center shadow-md">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
             <div className="w-2 h-2 bg-white rounded-full relative"></div>
          </div>
        </div>
      )}
    </div>
  );
};