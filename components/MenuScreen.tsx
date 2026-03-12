
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
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white">
      <header className="w-full max-w-5xl text-center mb-8 flex-shrink-0">
        <h1 className="text-6xl md:text-8xl font-black text-hologram tracking-[0.1em] mb-3">
          練習モード
        </h1>
        <p className="text-cyan-400 text-sm font-bold">分野を選んで問題を解こう</p>
      </header>

      <main className="w-full max-w-7xl hud-panel rounded-2xl p-0 shadow-2xl relative overflow-hidden flex flex-col md:flex-row h-[65vh]">
        <div className="corner-accent lt"></div>
        <div className="corner-accent rb"></div>

        {/* Left Side: Category Selection */}
        <div className="w-full md:w-1/4 bg-slate-950/60 border-r border-cyan-500/10 flex flex-col p-6 gap-3">
          <h2 className="text-xs font-bold text-cyan-400 mb-2">分野を選択</h2>
          {MATH_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat)}
              className={`p-4 text-left rounded-xl transition-all duration-300 font-bold text-sm border
                ${selectedCategory?.name === cat.name
                  ? 'bg-cyan-500/20 text-white border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                  : 'bg-transparent border-transparent text-cyan-700 hover:text-cyan-400 hover:bg-slate-900/40'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Right Side: Grouped Subtopics */}
        {selectedCategory ? (
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-10 animate-math-fade-in">
            <header className="mb-8 flex justify-between items-end border-b border-cyan-500/10 pb-4">
                <div>
                   <h2 className="text-3xl font-bold text-white">{selectedCategory.name}</h2>
                </div>
                <p className="text-xs text-cyan-500 font-bold hidden sm:block">{selectedCategory.groups.reduce((acc, g) => acc + g.subtopics.length, 0)} 単元</p>
            </header>

            <div className="space-y-10">
                {selectedCategory.groups.map((group: SubCategoryGroup) => (
                    <section key={group.name} className="animate-math-fade-in">
                        <div className="flex items-center gap-4 mb-5">
                            <h3 className="text-sm font-bold text-cyan-400 whitespace-nowrap">{group.name}</h3>
                            <div className="h-[1px] flex-grow bg-gradient-to-r from-cyan-500/20 to-transparent"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.subtopics.map((subTopic: string) => (
                                <button
                                    key={subTopic}
                                    onClick={() => onSelectSubTopic(selectedCategory.name, subTopic)}
                                    className="bg-slate-950/40 border border-cyan-500/10 text-cyan-100/90 p-4 rounded-xl text-sm font-bold hover:bg-cyan-500 hover:text-slate-950 hover:border-white transition-all text-left relative group overflow-hidden"
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
             <p className="text-cyan-700 animate-pulse text-sm">分野を選択してください</p>
          </div>
        )}
      </main>

      <footer className="mt-8 flex items-center justify-center gap-6 w-full max-w-5xl flex-shrink-0">
         <button
            onClick={onShowRecords}
            className="btn-tactical px-8 py-3 rounded-lg flex items-center gap-3 font-bold text-sm text-cyan-300 border-cyan-500/20"
          >
            <ArchiveIcon className="w-5 h-5" />
            学習記録
          </button>
          <button
            onClick={onExit}
            className="btn-tactical px-10 py-3 rounded-lg font-bold text-white bg-blue-700/20 border-cyan-500/40 hover:bg-blue-600 text-sm"
          >
            メニューに戻る
          </button>
      </footer>
    </div>
  );
};

export default MenuScreen;
