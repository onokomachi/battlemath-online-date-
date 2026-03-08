
import React from 'react';
import { BackspaceIcon } from './Icons';

interface KeypadProps {
  onKeyClick: (key: string) => void;
  layout: string[][];
  disabled?: boolean;
}

const Keypad: React.FC<KeypadProps> = ({ onKeyClick, layout, disabled = false }) => {
  const renderKey = (key: string) => {
    if (key === ' ' || !key) {
        return <div key={Math.random()} className="h-12 sm:h-14 w-full"></div>;
    }
    const isSpecial = ['=', '+', '-', '×', '(', ')', '^', '/', '°', '≤', '≥', '<', '>', ',', 'π', '²', '³'].includes(key);
    const isVar = ['x', 'y', 'a', 'b'].includes(key);

    return (
      <button
        key={key}
        onClick={() => onKeyClick(key)}
        disabled={disabled}
        className={`
          h-12 sm:h-14 w-full flex items-center justify-center rounded-lg transition-all duration-200 border
          text-xl sm:text-2xl font-black transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-1 focus:ring-cyan-400
          ${isSpecial || isVar
            ? 'bg-cyan-900/20 border-cyan-400/30 text-cyan-200 hover:bg-cyan-800/40 font-["JetBrains_Mono"]' 
            : 'bg-slate-900/60 border-cyan-900/50 text-white hover:bg-slate-800 font-mono shadow-[inset_0_0_10px_rgba(34,211,238,0.1)]'
          }
          disabled:opacity-10 disabled:cursor-not-allowed disabled:transform-none shadow-lg
        `}
      >
        {key}
      </button>
    );
  };
  
  const colCount = layout[0]?.length || 3;
  const gridColsClass = 
    colCount >= 6 ? 'grid-cols-6' : 
    colCount === 5 ? 'grid-cols-5' : 
    colCount === 4 ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className="w-full mt-4 bg-slate-950/40 p-4 rounded-xl backdrop-blur-xl border border-cyan-500/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      <div className={`grid ${gridColsClass} gap-2 sm:gap-3`}>
        {layout.flat().map(key => renderKey(key))}
      </div>
       <div className={`grid ${gridColsClass} gap-2 sm:gap-3 mt-3`}>
         <button
            onClick={() => onKeyClick('CLEAR')}
            disabled={disabled}
            className={`h-12 sm:h-14 w-full flex items-center justify-center rounded-lg transition-all duration-200
              text-xs font-black transform hover:scale-105 focus:outline-none focus:ring-1 focus:ring-red-400
              bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-900/40 uppercase tracking-widest
              disabled:opacity-20 disabled:cursor-not-allowed shadow-lg ${colCount >= 5 ? 'col-span-3' : 'col-span-2'}`}
          >
            Clear
          </button>

          <button
            onClick={() => onKeyClick('BACKSPACE')}
            disabled={disabled}
            className={`h-12 sm:h-14 w-full flex items-center justify-center rounded-lg transition-all duration-200
               transform hover:scale-105 focus:outline-none focus:ring-1 focus:ring-cyan-400
              bg-blue-900/20 border border-blue-500/20 text-cyan-400 hover:bg-blue-800/40
              disabled:opacity-20 disabled:cursor-not-allowed shadow-lg ${colCount >= 5 ? 'col-span-2' : 'col-span-1'}`}
          >
            <BackspaceIcon className="w-6 h-6" />
          </button>
      </div>
    </div>
  );
};

export default Keypad;
