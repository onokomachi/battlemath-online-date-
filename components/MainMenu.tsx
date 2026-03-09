import React from 'react';
import type { GameState } from '../types';
import type { User } from 'firebase/auth';

interface MainMenuProps {
  onSelectMode: (mode: GameState) => void;
  playerLevel: number;
  playerExp: number;
  expForNextLevel: number;
  user?: User | null;
  mathPoints?: number;
  onLogout?: () => void;
  onOpenRanking?: () => void;
}

const PlayerStatus: React.FC<Omit<MainMenuProps, 'onSelectMode'>> = ({
  playerLevel, playerExp, expForNextLevel, user, mathPoints, onLogout, onOpenRanking
}) => {
  const expPercentage = (playerExp / expForNextLevel) * 100;

  return (
    <div className="absolute top-6 left-6 w-80 hud-panel rounded-xl p-5 shadow-2xl border-l-4 border-l-cyan-500">
      <div className="corner-accent rt" />
      <div className="corner-accent rb" />
      {/* User info */}
      {user && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-cyan-900/40">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-cyan-700/50" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-bold truncate">{user.displayName}</p>
            <p className="text-[10px] text-amber-400">MP: {mathPoints?.toLocaleString()}</p>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:text-white transition-colors"
            >
              OUT
            </button>
          )}
        </div>
      )}
      <div className="flex justify-between items-end mb-3">
        <div>
          <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase block mb-1">
            Authorization_Core
          </span>
          <span className="font-bold text-3xl font-['Cinzel_Decorative'] text-white">
            LV. {playerLevel}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-mono text-cyan-500/70 block">EXP_STREAM</span>
          <span className="text-xs font-mono text-gray-300">{playerExp} / {expForNextLevel}</span>
        </div>
      </div>
      <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden border border-cyan-900/50">
        <div
          className="bg-gradient-to-r from-blue-600 via-cyan-400 to-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_cyan]"
          style={{ width: `${expPercentage}%` }}
        />
      </div>
    </div>
  );
};

const MainMenu: React.FC<MainMenuProps> = ({
  onSelectMode, playerLevel, playerExp, expForNextLevel,
  user, mathPoints, onLogout, onOpenRanking
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white relative">
      <PlayerStatus
        playerLevel={playerLevel}
        playerExp={playerExp}
        expForNextLevel={expForNextLevel}
        user={user}
        mathPoints={mathPoints}
        onLogout={onLogout}
        onOpenRanking={onOpenRanking}
      />

      {/* Ranking button top-right */}
      {onOpenRanking && (
        <div className="absolute top-6 right-6">
          <button
            onClick={onOpenRanking}
            className="btn-tactical px-5 py-2 rounded-lg text-sm font-bold tracking-[0.2em]"
          >
            RANKING
          </button>
        </div>
      )}

      <div className="text-center mb-16 relative">
        <div className="absolute -inset-20 bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <h1 className="text-7xl md:text-9xl font-black text-hologram mb-4 tracking-[0.2em]">
          BATTLE-MATH
        </h1>
        <div className="flex items-center justify-center gap-6">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          <p className="text-xs md:text-sm text-cyan-300 font-bold tracking-[0.6em] uppercase opacity-80">
            Universal Protocol v3.0
          </p>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent via-cyan-500 to-transparent" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl px-6">
        {[
          { mode: 'deck_building' as GameState, label: 'Star Duel', desc: '戦略と計算で星海を制せ', icon: 'Ω' },
          { mode: 'practice_mode' as GameState, label: 'Academy', desc: '深宇宙の知識を解析せよ', icon: 'Δ' },
          { mode: 'card_shop' as GameState, label: 'Nebula Market', desc: '未知の数式をサルベージ', icon: 'Ξ' },
        ].map((item, i) => (
          <button
            key={item.mode}
            onClick={() => onSelectMode(item.mode)}
            className="flex-1 btn-tactical p-10 rounded-2xl flex flex-col items-center gap-3 group relative overflow-hidden"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="corner-accent lt" />
            <div className="corner-accent rb" />
            <div className="absolute -right-4 -bottom-4 text-6xl font-mono opacity-[0.04] group-hover:opacity-[0.1] group-hover:scale-125 transition-all duration-500">
              {item.icon}
            </div>
            <span className="text-3xl font-['Cinzel_Decorative'] font-bold group-hover:text-cyan-300 transition-colors">
              {item.label}
            </span>
            <span className="text-[10px] text-blue-300 uppercase tracking-[0.2em] font-bold opacity-60">
              {item.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Guest notice */}
      {!user && (
        <div className="mt-8">
          <button
            onClick={() => onSelectMode('login_screen')}
            className="text-xs text-amber-400 border border-amber-800/50 px-4 py-2 rounded-lg hover:bg-amber-900/20 transition-colors font-mono tracking-widest"
          >
            ログインしてランキングや対戦に参加
          </button>
        </div>
      )}

      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <div className="text-[10px] text-cyan-600 font-mono tracking-[0.4em] opacity-50 uppercase">
          Signal_Lock: Deep_Space_Network // Buffer: Clear
        </div>
        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
      </div>
    </div>
  );
};

export default MainMenu;
