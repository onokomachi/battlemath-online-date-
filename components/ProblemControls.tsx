
import React from 'react';
import { LightbulbIcon } from './Icons';

interface ProblemControlsProps {
  isProof: boolean;
  isLoading: boolean;
  userAnswer: string;
  result: 'correct' | 'incorrect' | 'proof' | null;
  isSessionComplete: boolean;
  hasHint: boolean;
  onCheckAnswer: () => void;
  onLoadNextProblem: () => void;
  onShowHint: () => void;
}

const ProblemControls: React.FC<ProblemControlsProps> = ({
  isProof,
  isLoading,
  userAnswer,
  result,
  isSessionComplete,
  hasHint,
  onCheckAnswer,
  onLoadNextProblem,
  onShowHint,
}) => {
  return (
    <div className='w-full flex flex-col gap-4 font-["Inter"]'>
      <button
        onClick={onCheckAnswer}
        disabled={isLoading || !userAnswer || result !== null || isSessionComplete}
        className="w-full bg-blue-700 text-white font-black px-6 py-4 rounded-xl hover:bg-blue-600 transition-all disabled:bg-slate-900/50 disabled:text-slate-700 disabled:border-slate-800 disabled:cursor-not-allowed text-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-blue-400/30 uppercase tracking-[0.2em]"
      >
        {isProof ? 'ANALYZE_PATTERN' : 'COMMIT_INPUT'}
      </button>
      <button
        onClick={onLoadNextProblem}
        disabled={isSessionComplete}
        className="w-full bg-slate-950 text-cyan-200 px-6 py-4 rounded-xl hover:bg-slate-900 transition-all text-sm border border-cyan-900/50 disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest font-black"
      >
        NEXT_SEQUENCE
      </button>
      <button
        onClick={onShowHint}
        disabled={!hasHint || isSessionComplete}
        className="w-full bg-slate-900/20 text-cyan-400/70 px-6 py-3 rounded-xl hover:bg-cyan-900/10 transition-all text-xs border border-cyan-500/10 disabled:opacity-10 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-black uppercase tracking-widest"
      >
        <LightbulbIcon className="w-5 h-5" />
        DATA_HINT
      </button>
    </div>
  );
};

export default ProblemControls;
