
import React, { useState, useEffect } from 'react';
import { getRecords, clearRecords } from '../services/recordService';
import { LearningRecord } from '../types';
import { BackIcon, TrophyIcon, CheckCircleIcon, XCircleIcon } from './Icons';

interface RecordsScreenProps {
  onBackToMenu: () => void;
}

const RecordsScreen: React.FC<RecordsScreenProps> = ({ onBackToMenu }) => {
  const [records, setRecords] = useState<LearningRecord[]>([]);

  useEffect(() => {
    setRecords(getRecords());
  }, []);

  const handleClearRecords = () => {
    if (window.confirm("PROTOCOL_WARNING: Permanently delete all archives? This action is irreversible.")) {
      clearRecords();
      setRecords([]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 flex flex-col items-center font-['Inter']">
      <main className="w-full max-w-5xl">
        <header className="flex justify-between items-end mb-10 border-b border-cyan-500/20 pb-6">
          <div>
            <h2 className="text-[10px] text-cyan-600 font-black tracking-[0.5em] uppercase mb-1">Analytical_Archives</h2>
            <h1 className="text-5xl font-black text-white font-['Cinzel_Decorative'] tracking-widest">RECORD_LOGS</h1>
          </div>
          <button onClick={onBackToMenu} className="btn-tactical px-8 py-3 rounded-lg flex items-center gap-3 font-bold text-xs tracking-[0.2em] text-cyan-400">
            <BackIcon className="w-5 h-5" />
            RETURN
          </button>
        </header>

        {records.length === 0 ? (
          <div className="text-center hud-panel rounded-2xl p-20 shadow-2xl flex flex-col items-center gap-4">
             <div className="w-16 h-16 border border-cyan-900/30 rounded-full flex items-center justify-center animate-pulse">
               <span className="text-cyan-900 font-mono">?</span>
             </div>
            <p className="text-cyan-900 font-mono tracking-widest text-sm uppercase">No_Records_Found_In_Local_Buffer</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-right mb-6">
                <button 
                    onClick={handleClearRecords}
                    className="text-[10px] text-red-500/60 hover:text-red-400 transition-colors font-mono tracking-[0.2em] uppercase"
                >
                    [ PURGE_ARCHIVES ]
                </button>
            </div>
            {records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
              <div key={record.id} className="hud-panel rounded-xl p-5 animate-math-fade-in shadow-xl group border-cyan-500/5 hover:border-cyan-500/20 transition-all">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                  <div className="space-y-1">
                    <p className="text-[9px] text-cyan-800 font-mono tracking-tighter uppercase">{new Date(record.date).toLocaleString('ja-JP')}</p>
                    <p className="font-black text-cyan-300 text-xl tracking-tight uppercase">{record.category}</p>
                    <p className="text-xs text-white/50 font-medium tracking-wide">{record.subTopic}</p>
                  </div>
                  <div className="flex items-center gap-8 mt-4 sm:mt-0 border-t sm:border-none border-cyan-500/5 pt-4 sm:pt-0 font-mono">
                    <div className="flex flex-col items-center" title="Score">
                      <span className="text-[8px] text-cyan-900 font-black uppercase mb-1">Energy</span>
                      <div className="flex items-center gap-1.5 text-cyan-100">
                        <TrophyIcon className="w-4 h-4 text-cyan-500" />
                        <span className="font-black text-xl">{record.stats.totalScore}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center" title="Correct">
                       <span className="text-[8px] text-cyan-900 font-black uppercase mb-1">Sync</span>
                      <div className="flex items-center gap-1.5 text-green-400">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span className="font-bold text-xl">{record.stats.correct}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center" title="Incorrect">
                       <span className="text-[8px] text-cyan-900 font-black uppercase mb-1">Leak</span>
                      <div className="flex items-center gap-1.5 text-red-500/70">
                        <XCircleIcon className="w-4 h-4" />
                        <span className="font-bold text-xl">{record.stats.incorrect}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default RecordsScreen;
