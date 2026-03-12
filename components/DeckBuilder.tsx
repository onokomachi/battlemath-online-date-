
import React, { useState, useMemo } from 'react';
import type { ProblemCard } from '../types';
import Card from './Card';
import { DECK_SIZE, MAX_DUPLICATES, DECK_CONSTRAINTS } from '../constants';
import { BackIcon } from './Icons';

interface DeckBuilderProps {
  ownedCards: ProblemCard[];
  onDeckSubmit: (deck: ProblemCard[], mode: 'cpu' | 'pvp') => void;
  onBack: () => void;
}

const DeckBuilder: React.FC<DeckBuilderProps> = ({ ownedCards, onDeckSubmit, onBack }) => {
  const [deck, setDeck] = useState<ProblemCard[]>([]);

  const deckCardCounts = useMemo(() => {
    return deck.reduce((acc, card) => {
      acc[card.id] = (acc[card.id] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }, [deck]);

  const addCardToDeck = (cardDef: ProblemCard) => {
    if (deck.length >= DECK_SIZE) return;
    if ((deckCardCounts[cardDef.id] || 0) >= MAX_DUPLICATES) return;

    const constraint = DECK_CONSTRAINTS[cardDef.difficulty];
    if(constraint) {
        const count = deck.filter(c => c.difficulty === cardDef.difficulty).length;
        if (count >= constraint) return;
    }
    setDeck(prev => [...prev, cardDef]);
  };

  const removeCardFromDeck = (index: number) => {
    setDeck(prev => prev.filter((_, i) => i !== index));
  };

  const isDeckValid = deck.length === DECK_SIZE;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white">
      <header className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-black text-hologram tracking-[0.1em] mb-2">デッキ編成</h1>
        <p className="text-sm text-cyan-400 font-bold">カードを選んでデッキを作ろう: {deck.length} / {DECK_SIZE}枚</p>
      </header>

      <div className="w-full max-w-7xl flex-grow flex gap-6 overflow-hidden">
        {/* 所持カード */}
        <div className="w-1/2 flex flex-col hud-panel rounded-2xl p-6 border-cyan-500/20 shadow-2xl relative">
          <div className="corner-accent lt"></div>
          <h2 className="text-sm font-bold text-cyan-400 mb-4">所持カード ({ownedCards.length}枚)</h2>
          <div className="flex-grow grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4 p-2 overflow-y-auto custom-scrollbar">
            {ownedCards.map((cardDef) => {
              const countInDeck = deckCardCounts[cardDef.id] || 0;
              const isDimmed = countInDeck >= MAX_DUPLICATES;
              return (
                 <div key={cardDef.id} className="relative group" onClick={() => !isDimmed && addCardToDeck(cardDef)}>
                   <div className={`${isDimmed ? 'opacity-20 saturate-0 scale-95' : 'cursor-pointer transition-transform hover:scale-105 active:scale-95'}`}>
                      <div className="transform scale-90 origin-top">
                        <Card card={cardDef} />
                      </div>
                   </div>
                   {!isDimmed && (
                     <div className="absolute top-0 right-2 bg-cyan-600 text-slate-950 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white/20 shadow-lg">
                       {MAX_DUPLICATES - countInDeck}
                     </div>
                   )}
                 </div>
              );
            })}
          </div>
        </div>

        {/* デッキ */}
        <div className="w-1/2 flex flex-col hud-panel rounded-2xl p-6 border-cyan-400/20 shadow-2xl relative bg-blue-900/5">
          <div className="corner-accent rt"></div>
          <h2 className="text-sm font-bold text-cyan-200 mb-4">デッキ ({deck.length}/{DECK_SIZE})</h2>
           <div className="flex-grow grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-4 p-2 overflow-y-auto custom-scrollbar">
             {deck.map((card, index) => (
                <div key={index} className="relative cursor-pointer transition-all hover:scale-105 active:scale-95 group" onClick={() => removeCardFromDeck(index)}>
                    <div className="transform scale-90 origin-top">
                        <Card card={card} />
                    </div>
                    <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                       <span className="text-red-400 text-xs font-bold">外す</span>
                    </div>
                </div>
             ))}
             {Array.from({ length: DECK_SIZE - deck.length }).map((_, i) => (
               <div key={`empty-${i}`} className="w-full aspect-[48/72] rounded-xl border border-dashed border-cyan-900/30 flex items-center justify-center bg-slate-950/20">
                 <span className="text-xs text-cyan-900 font-bold">空きスロット</span>
               </div>
             ))}
          </div>
        </div>
      </div>

       <div className="flex items-center gap-4 mt-8 flex-wrap justify-center">
         <button
          onClick={onBack}
          className="btn-tactical px-8 py-3 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <BackIcon className="w-4 h-4" /> 戻る
        </button>
        <button
          onClick={() => onDeckSubmit(deck, 'cpu')}
          disabled={!isDeckValid}
          className={`px-10 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105 shadow-lg
            ${!isDeckValid ? 'opacity-20 cursor-not-allowed bg-slate-800 text-gray-500 border border-slate-700' : 'bg-blue-600 text-white border-cyan-400/50 hover:bg-blue-500'}`}
        >
          {isDeckValid ? 'CPU対戦' : `あと${DECK_SIZE - deck.length}枚`}
        </button>
        <button
          onClick={() => onDeckSubmit(deck, 'pvp')}
          disabled={!isDeckValid}
          className={`px-10 py-4 rounded-xl text-lg font-bold transition-all transform hover:scale-105
            ${!isDeckValid ? 'opacity-20 cursor-not-allowed bg-slate-800 text-gray-500 border border-slate-700' : 'bg-amber-600 text-white border-amber-400/50 hover:bg-amber-500'}`}
        >
          {isDeckValid ? 'プレイヤー対戦 (PvP)' : `あと${DECK_SIZE - deck.length}枚`}
        </button>
       </div>
    </div>
  );
};

export default DeckBuilder;
