/**
 * ClassPanel.tsx - クラスチームシステム
 * エビデンスB: オキシトシン系 協力・つながり設計（Zak 2012）
 * エビデンスA: 社会的比較理論 × 集団目標
 */
import React, { useState } from 'react';
import type { ClassInfo } from '../types';

interface ClassPanelProps {
  classInfo: ClassInfo | null;
  onJoinClass: (code: string) => void;
  onCreateClass: (name: string) => void;
  onLeaveClass: () => void;
  onClose: () => void;
}

const WEEKLY_GOAL = 1000;

const ClassPanel: React.FC<ClassPanelProps> = ({
  classInfo, onJoinClass, onCreateClass, onLeaveClass, onClose
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [className, setClassName] = useState('');

  const getWeekLabel = () => {
    const d = new Date();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return `${monday.getMonth() + 1}/${monday.getDate()}週`;
  };

  const weeklyPct = classInfo ? Math.min(100, (classInfo.weeklyScore / WEEKLY_GOAL) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-gray-950 border border-cyan-800/40 rounded-2xl p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-cyan-300 tracking-widest">CLASS_TEAM</h2>
            <p className="text-xs text-gray-500 font-mono">クラスで一緒に頑張ろう！</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        {classInfo ? (
          /* クラス加入済み */
          <>
            {/* クラス情報 */}
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-700/40 rounded-xl">
              <div className="text-xs text-gray-400 mb-1">所属クラス</div>
              <div className="text-2xl font-bold text-white">{classInfo.className}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-gray-400">担任: {classInfo.teacherName}</div>
                <div className="text-xs text-gray-400">{classInfo.memberCount}人参加中</div>
              </div>
              <div className="text-xs font-mono text-cyan-600/70 mt-1">CODE: {classInfo.classId}</div>
            </div>

            {/* 週間クラス目標 — 集団進捗可視化 */}
            <div className="mb-5 p-4 bg-green-900/20 border border-green-700/40 rounded-xl">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-gray-400">クラス今週の正解数</div>
                  <div className="text-xs text-gray-500">{getWeekLabel()}</div>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-green-400">{classInfo.weeklyScore.toLocaleString()}</span>
                  <span className="text-green-600 text-sm ml-1">問</span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mb-1.5">
                <div
                  className="bg-gradient-to-r from-green-600 to-green-400 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${weeklyPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>目標: {WEEKLY_GOAL}問</span>
                <span>
                  {classInfo.weeklyScore >= WEEKLY_GOAL
                    ? '🎉 目標達成！'
                    : `残り ${WEEKLY_GOAL - classInfo.weeklyScore}問`}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                🏆 みんなで{WEEKLY_GOAL}問を目指そう！1問ずつがクラスの力になる
              </p>
            </div>

            <button
              onClick={onLeaveClass}
              className="text-xs text-red-400 border border-red-800/50 px-3 py-1.5 rounded hover:bg-red-900/20 transition-colors"
            >
              クラスを離れる
            </button>
          </>
        ) : (
          /* クラス未加入 */
          <>
            <div className="flex gap-2 mb-5">
              {(['join', 'create'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm rounded-lg font-bold transition-colors ${
                    tab === t
                      ? t === 'join' ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700' : 'bg-purple-900/60 text-purple-300 border border-purple-700'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {t === 'join' ? '参加する' : 'クラスを作る'}
                </button>
              ))}
            </div>

            {tab === 'join' ? (
              <div>
                <p className="text-xs text-gray-400 mb-3">先生からもらったクラスコードを入力してください</p>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinCode.length >= 4 && onJoinClass(joinCode)}
                  placeholder="例: AB1C2D"
                  maxLength={8}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white font-mono mb-3 focus:border-cyan-500 outline-none tracking-[0.3em] uppercase"
                />
                <button
                  onClick={() => { onJoinClass(joinCode); setJoinCode(''); }}
                  disabled={joinCode.length < 4}
                  className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg font-bold disabled:opacity-40 transition-colors"
                >
                  参加する
                </button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-3">クラス名を入力してクラスを作成します（先生向け）</p>
                <input
                  value={className}
                  onChange={e => setClassName(e.target.value)}
                  placeholder="例: 2年1組"
                  maxLength={20}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white mb-3 focus:border-purple-500 outline-none"
                />
                <button
                  onClick={() => { onCreateClass(className); setClassName(''); }}
                  disabled={className.length < 2}
                  className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold disabled:opacity-40 transition-colors"
                >
                  クラスを作成する
                </button>
                <p className="text-xs text-gray-500 mt-3">
                  ※ 作成後にクラスコードが発行されます。生徒に共有してください。
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassPanel;
