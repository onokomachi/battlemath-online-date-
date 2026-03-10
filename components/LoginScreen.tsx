import React from 'react';
import type { User } from 'firebase/auth';

interface LoginScreenProps {
  currentUser: User | null;
  onLogin: () => void;
  onGuestPlay: () => void;
  onLogout: () => void;
  onOpenGameMaster?: () => void;
  mathPoints: number;
  playerLevel: number;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  currentUser,
  onLogin,
  onGuestPlay,
  onLogout,
  onOpenGameMaster,
  mathPoints,
  playerLevel,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Title */}
      <div className="text-center mb-16 relative">
        <div className="absolute -inset-20 bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <h1 className="text-7xl md:text-9xl font-black text-hologram mb-4 tracking-[0.2em]">
          BATTLE-MATH
        </h1>
        <div className="flex items-center justify-center gap-6 mb-2">
          <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          <p className="text-xs md:text-sm text-cyan-300 font-bold tracking-[0.6em] uppercase opacity-80">
            Online Protocol v3.0
          </p>
          <div className="h-[1px] w-20 bg-gradient-to-l from-transparent via-cyan-500 to-transparent" />
        </div>
        <p className="text-xs text-cyan-500/60 font-mono tracking-widest">
          数学でバトル。全国のプレイヤーと対戦せよ。
        </p>
      </div>

      {/* Auth Panel */}
      <div className="w-full max-w-md hud-panel rounded-2xl p-8 shadow-2xl">
        {currentUser ? (
          /* Logged in */
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4">
              {currentUser.photoURL && (
                <img
                  src={currentUser.photoURL}
                  alt="avatar"
                  className="w-16 h-16 rounded-full border-2 border-cyan-500 shadow-[0_0_12px_cyan]"
                />
              )}
              <div>
                <p className="text-xs text-cyan-400 tracking-widest uppercase font-bold">
                  Authorization_Core
                </p>
                <p className="text-xl font-bold text-white">{currentUser.displayName}</p>
                <p className="text-xs text-gray-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex gap-6 text-center">
              <div className="hud-panel rounded-lg px-4 py-2">
                <p className="text-xs text-cyan-400 tracking-widest">LEVEL</p>
                <p className="text-2xl font-bold text-white font-['Cinzel_Decorative']">{playerLevel}</p>
              </div>
              <div className="hud-panel rounded-lg px-4 py-2">
                <p className="text-xs text-cyan-400 tracking-widest">MATH_PTS</p>
                <p className="text-2xl font-bold text-amber-400">{mathPoints.toLocaleString()}</p>
              </div>
            </div>

            <button
              onClick={onGuestPlay}
              className="w-full btn-tactical py-4 rounded-xl text-xl tracking-[0.3em] font-bold"
            >
              LAUNCH GAME
            </button>

            <div className="flex gap-4 w-full">
              {onOpenGameMaster && (
                <button
                  onClick={onOpenGameMaster}
                  className="flex-1 py-2 rounded-lg text-sm font-bold text-red-400 border border-red-800 hover:bg-red-900/30 transition-colors tracking-widest"
                >
                  GAME MASTER
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex-1 py-2 rounded-lg text-sm font-bold text-gray-400 border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                LOGOUT
              </button>
            </div>
          </div>
        ) : (
          /* Not logged in */
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-300 mb-1">ログインしてランキングや対戦を楽しもう</p>
              <p className="text-xs text-gray-500">Googleアカウントで安全にログイン</p>
            </div>

            <button
              onClick={onLogin}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              {/* Google Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Googleでログイン
            </button>

            <div className="relative w-full flex items-center gap-3">
              <div className="flex-1 h-[1px] bg-gray-700" />
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-[1px] bg-gray-700" />
            </div>

            <button
              onClick={onGuestPlay}
              className="w-full btn-tactical py-3 rounded-xl text-sm font-bold tracking-[0.3em] opacity-80 hover:opacity-100"
            >
              GUEST PLAY（データは保存されません）
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <div className="text-[10px] text-cyan-600 font-mono tracking-[0.4em] opacity-50 uppercase">
          Signal_Lock: Online_Protocol // Auth: Firebase
        </div>
        <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
      </div>
    </div>
  );
};

export default LoginScreen;
