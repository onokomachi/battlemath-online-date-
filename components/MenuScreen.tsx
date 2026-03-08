
import React, { useState } from 'react';
import { Category, SubCategoryGroup } from '../types';
import { MATH_CATEGORIES } from '../constants';
import { ArchiveIcon } from './Icons';

interface MenuScreenProps {
  onSelectSubTopic: (category: string, subTopic: string) => void;
  onShowRecords: () => void;
  onExit: () => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onSelectSubTopic, onShowRecords, onExit }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(MATH_CATEGORIES[0]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white font-['Inter']">
      <header className="w-full max-w-5xl text-center mb-8 flex-shrink-0">
        <h1 className="text-6xl md:text-8xl font-black font-['Cinzel_Decorative'] text-hologram tracking-[0.2em] mb-4">
          ACADEMY
        </h1>
        <div className="flex items-center justify-center gap-4">
           <div className="h-[1px] w-12 bg-cyan-500/30"></div>
           <p className="text-cyan-400 text-[10px] tracking-[0.5em] uppercase font-black">Knowledge_Salvage_Unit</p>
           <div className="h-[1px] w-12 bg-cyan-500/30"></div>
        </div>
      </header>

      <main className="w-full max-w-7xl hud-panel rounded-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-[65vh]">
        <div className="corner-accent lt"></div>
        <div className="corner-accent rb"></div>
        
        {/* Left Side: Category Selection */}
        <div className="w-full md:w-1/4 bg-slate-950/60 border-r border-cyan-500/10 flex flex-col p-6 gap-3">
          <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-cyan-700 mb-2">Select_Domain</h2>
          {MATH_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat)}
              className={`p-4 text-left rounded-xl transition-all duration-300 font-bold text-sm border
                ${selectedCategory?.name === cat.name
                  ? 'bg-cyan-500/20 text-white border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                  : 'bg-transparent border-transparent text-cyan-900 hover:text-cyan-400 hover:bg-slate-900/40'
                }`}
            >
              {cat.name}
            </button>
          ))}
          
          <div className="mt-auto pt-6 border-t border-cyan-500/10 hidden md:block">
             <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-900/30">
                <p className="text-[8px] text-cyan-700 font-mono leading-tight">SYSTEM_STATUS: READY<br/>BUFFER: OPTIMIZED<br/>LOGS: ACCESSIBLE</p>
             </div>
          </div>
        </div>

        {/* Right Side: Grouped Subtopics */}
        {selectedCategory ? (
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-10 animate-math-fade-in">
            <header className="mb-10 flex justify-between items-end border-b border-cyan-500/10 pb-4">
                <div>
                   <p className="text-[10px] font-black tracking-[0.3em] uppercase text-cyan-700 mb-1">Target_Process</p>
                   <h2 className="text-3xl font-black font-['Cinzel_Decorative'] text-white tracking-widest">{selectedCategory.name}</h2>
                </div>
                <p className="text-[10px] text-cyan-900 font-mono hidden sm:block">Modules_Available: {selectedCategory.groups.reduce((acc, g) => acc + g.subtopics.length, 0)}</p>
            </header>

            <div className="space-y-12">
                {selectedCategory.groups.map((group: SubCategoryGroup) => (
                    <section key={group.name} className="animate-math-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-sm font-black text-cyan-400 uppercase tracking-[0.2em] whitespace-nowrap">◈ {group.name}</h3>
                            <div className="h-[1px] flex-grow bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.subtopics.map((subTopic: string) => (
                                <button
                                    key={subTopic}
                                    onClick={() => onSelectSubTopic(selectedCategory.name, subTopic)}
                                    className="bg-slate-950/40 border border-cyan-500/10 text-cyan-100/80 p-4 rounded-xl text-xs font-bold hover:bg-cyan-500 hover:text-slate-950 hover:border-white transition-all text-left relative group overflow-hidden"
                                >
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/20 group-hover:bg-white transition-colors"></div>
                                    <span className="relative z-10 block pr-6">{subTopic}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center border-2 border-dashed border-cyan-900/20 rounded-xl m-6">
             <p className="text-cyan-900 font-mono tracking-widest animate-pulse uppercase text-sm">Awaiting_Module_Selection...</p>
          </div>
        )}
      </main>

      <footer className="mt-8 flex items-center justify-center gap-6 w-full max-w-5xl flex-shrink-0">
         <button
            onClick={onShowRecords}
            className="btn-tactical px-8 py-3 rounded-lg flex items-center gap-3 font-bold text-sm tracking-widest text-cyan-300 border-cyan-500/20"
          >
            <ArchiveIcon className="w-5 h-5" />
            RECORD_ARCHIVE
          </button>
          <button 
            onClick={onExit} 
            className="btn-tactical px-10 py-3 rounded-lg font-black text-white bg-blue-700/20 border-cyan-500/40 hover:bg-blue-600 text-sm tracking-[0.2em]"
          >
            EXIT_INTERFACE
          </button>
      </footer>
    </div>
  );
};

export default MenuScreen;
