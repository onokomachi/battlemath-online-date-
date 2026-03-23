import React, { useState } from 'react';
import type { BattleFormat } from '../types';
import { MATH_CATEGORIES } from '../constants';
import { BackIcon } from './Icons';

interface SpeedDuelSetupProps {
  onStart: (categories: string[], format: BattleFormat, mode: 'cpu' | 'pvp') => void;
  onBack: () => void;
  isLoggedIn: boolean;
}

const SPEED_FORMATS: { key: BattleFormat; label: string; desc: string; rounds: number }[] = [
  { key: 'best_of_3', label: '3本勝負', desc: '先に2問正解で勝利', rounds: 3 },
  { key: 'best_of_5', label: '5本勝負', desc: '先に3問正解で勝利', rounds: 5 },
  { key: 'best_of_7', label: '7本勝負', desc: '先に4問正解で勝利', rounds: 7 },
  { key: 'master_duel', label: 'マスターデュエル', desc: '10問勝負・最多正解で決着', rounds: 10 },
];

const CATEGORY_NAMES = MATH_CATEGORIES.map(c => c.name);

const SpeedDuelSetup: React.FC<SpeedDuelSetupProps> = ({ onStart, onBack, isLoggedIn }) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(CATEGORY_NAMES));
  const [format, setFormat] = useState<BattleFormat>('best_of_5');

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCategories.size === CATEGORY_NAMES.length) {
      setSelectedCategories(new Set([CATEGORY_NAMES[0]]));
    } else {
      setSelectedCategories(new Set(CATEGORY_NAMES));
    }
  };

  const handleStart = (mode: 'cpu' | 'pvp') => {
    onStart(Array.from(selectedCategories), format, mode);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white relative overflow-y-auto">
      <div className="absolute inset-0 bg-gradient-radial from-orange-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors p-2">
            <BackIcon className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-wider flex items-center gap-3">
              <span className="text-orange-400">&#9889;</span>
              <span className="text-hologram">SPEED DUEL</span>
            </h2>
            <p className="text-xs text-orange-400 font-bold mt-1">
              スピードデュエル — デッキ不要・早押し勝負
            </p>
          </div>
        </div>

        {/* Category Selection */}
        <div className="hud-panel rounded-xl p-5 mb-6 border border-orange-800/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-orange-400 tracking-widest uppercase">出題カテゴリ</h3>
            <button
              onClick={toggleAll}
              className="text-[10px] text-gray-400 border border-gray-700 px-3 py-1 rounded hover:text-white transition-colors"
            >
              {selectedCategories.size === CATEGORY_NAMES.length ? '最小選択' : '全選択'}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORY_NAMES.map(cat => {
              const isSelected = selectedCategories.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`p-3 rounded-lg border-2 text-sm font-bold transition-all text-left ${
                    isSelected
                      ? 'border-orange-500/50 bg-orange-900/20 text-orange-300'
                      : 'border-slate-700/30 bg-slate-900/30 text-gray-500 hover:border-gray-600'
                  }`}
                >
                  <span className="mr-2">{isSelected ? '&#9745;' : '&#9744;'}</span>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div className="hud-panel rounded-xl p-5 mb-6 border border-orange-800/30">
          <h3 className="text-sm font-bold text-orange-400 tracking-widest uppercase mb-4">対戦形式</h3>
          <div className="grid grid-cols-2 gap-3">
            {SPEED_FORMATS.map(f => (
              <button
                key={f.key}
                onClick={() => setFormat(f.key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  format === f.key
                    ? 'border-orange-500/50 bg-orange-900/20'
                    : 'border-slate-700/30 bg-slate-900/30 hover:border-gray-600'
                }`}
              >
                <div className={`text-sm font-bold ${format === f.key ? 'text-orange-300' : 'text-gray-400'}`}>
                  {f.label}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div className="hud-panel rounded-xl p-4 mb-6 border border-slate-700/30">
          <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-2">ルール</h3>
          <ul className="space-y-1 text-[11px] text-gray-400">
            <li>&#8226; 同じ問題が両プレイヤーに同時出題</li>
            <li>&#8226; 先に正解した方がラウンド勝利</li>
            <li>&#8226; 不正解の場合、相手に解答権が移る</li>
            <li>&#8226; デッキ構築は不要（カード不要）</li>
          </ul>
        </div>

        {/* Start Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleStart('cpu')}
            className="btn-tactical py-5 rounded-2xl font-bold tracking-[0.15em] text-base group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 text-5xl opacity-[0.08] group-hover:opacity-[0.15] transition-all">&#129302;</div>
            <div className="text-lg font-black">CPU対戦</div>
            <div className="text-[10px] text-cyan-400 opacity-70 mt-1">コンピュータと早押し勝負</div>
          </button>
          <button
            onClick={() => handleStart('pvp')}
            disabled={!isLoggedIn}
            className="btn-tactical py-5 rounded-2xl font-bold tracking-[0.15em] text-base group relative overflow-hidden disabled:opacity-40"
          >
            <div className="absolute -right-4 -bottom-4 text-5xl opacity-[0.08] group-hover:opacity-[0.15] transition-all">&#9876;</div>
            <div className="text-lg font-black">プレイヤー対戦</div>
            <div className="text-[10px] text-cyan-400 opacity-70 mt-1">
              {isLoggedIn ? 'オンラインで早押し勝負' : 'ログインが必要です'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeedDuelSetup;
