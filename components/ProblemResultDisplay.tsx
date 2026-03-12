
import React from 'react';
import { Problem } from '../types';
import { ClockIcon, TrophyIcon, CheckCircleIcon, XCircleIcon } from './Icons';

interface ProblemResultDisplayProps {
  showAnswer: boolean;
  problemData: Problem | null;
  result: 'correct' | 'incorrect' | 'proof' | null;
  userAnswer: string;
  timeTaken: number | null;
  score: number | null;
  getResultRingColor: () => string;
}

const ProblemResultDisplay: React.FC<ProblemResultDisplayProps> = ({
  showAnswer,
  problemData,
  result,
  userAnswer,
  timeTaken,
  score,
  getResultRingColor,
}) => {
  if (!showAnswer || !problemData) return null;

  const isCorrect = result === 'correct';
  const isProof = result === 'proof';

  const statusLabel = isCorrect ? '正解！' : isProof ? '確認完了' : '不正解';
  const statusColor = isCorrect ? 'text-cyan-400' : isProof ? 'text-blue-300' : 'text-red-400';
  const bgColor = isCorrect ? 'bg-cyan-500/5' : isProof ? 'bg-blue-500/5' : 'bg-red-500/5';
  const borderColor = isCorrect ? 'border-cyan-400' : isProof ? 'border-blue-400' : 'border-red-500';

  return (
    <div className={`mt-6 rounded-xl overflow-hidden border-l-4 ${borderColor} ${bgColor} animate-math-fade-in shadow-xl relative`}>
      <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-lg bg-black/40 border border-white/10 ${statusColor}`}>
            {isCorrect ? <CheckCircleIcon className="w-7 h-7" /> : isProof ? <ClockIcon className="w-7 h-7" /> : <XCircleIcon className="w-7 h-7" />}
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${statusColor}`}>
              {statusLabel}
            </h3>
            {/* Level B: Growth Mindset feedback (Dweck, 2006) - process praise over person praise */}
            {!isCorrect && !isProof && (
              <p className="text-white/50 text-xs mt-1">間違いは成長のチャンス。正解を確認しよう！</p>
            )}
            {isCorrect && (
              <p className="text-cyan-300/50 text-xs mt-1">よくできました！</p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-5 bg-black/30 px-5 py-3 rounded-lg border border-white/5'>
          {result !== 'proof' && timeTaken !== null && (
            <div className='flex flex-col items-center'>
              <span className='text-[10px] text-cyan-500 font-bold'>時間</span>
              <div className="flex items-center text-white font-mono">
                <span className="text-lg font-bold">{timeTaken.toFixed(1)}<span className="text-xs ml-0.5 text-white/40">秒</span></span>
              </div>
            </div>
          )}

          {isCorrect && score !== null && (
            <>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className='flex flex-col items-center'>
                <span className='text-[10px] text-cyan-500 font-bold'>獲得</span>
                <div className="flex items-center text-amber-400 font-mono">
                  <span className="text-lg font-bold">+{score}<span className="text-xs ml-0.5 text-amber-500/60">MP</span></span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-4 bg-black/40 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-cyan-400 mb-1.5 font-bold">あなたの解答</p>
            <p className="text-white/80 bg-slate-950/60 p-3 rounded-lg border border-white/5 break-all font-mono text-sm">
              {problemData.type === 'graphing' ? userAnswer : (userAnswer || '未入力').replace(/;/g, ' | ')}
            </p>
          </div>
          <div>
            <p className="text-xs text-cyan-400 mb-1.5 font-bold">正解</p>
            <p className="text-cyan-300 bg-slate-950/60 p-3 rounded-lg border border-cyan-400/20 break-all font-mono text-sm">
              {problemData.answer.replace(/;/g, ' | ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemResultDisplay;
