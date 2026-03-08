
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
  
  const statusLabel = isCorrect ? 'SYNC_SUCCESS' : isProof ? 'DATA_PARSED' : 'BUFFER_OVERFLOW';
  const statusColor = isCorrect ? 'text-cyan-400' : isProof ? 'text-blue-300' : 'text-red-500';
  const bgColor = isCorrect ? 'bg-cyan-500/5' : isProof ? 'bg-blue-500/5' : 'bg-red-500/5';

  return (
    <div className={`mt-6 p-0 rounded-xl overflow-hidden border-l-4 ${getResultRingColor()} ${bgColor} animate-math-fade-in shadow-2xl relative`}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#22d3ee_1px,transparent_1px)] [background-size:12px:12px]"></div>
      
      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded bg-black/60 border border-white/5 ${statusColor}`}>
            {isCorrect ? <CheckCircleIcon className="w-6 h-6" /> : isProof ? <ClockIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />}
          </div>
          <div>
            <p className={`text-[8px] font-black tracking-[0.4em] text-white/30 uppercase`}>Processing_Result</p>
            <h3 className={`text-xl font-black font-['Cinzel_Decorative'] ${statusColor} tracking-widest leading-none`}>
              {statusLabel}
            </h3>
          </div>
        </div>

        <div className='flex items-center gap-6 bg-black/40 px-5 py-2 rounded-lg border border-white/5'>
          {result !== 'proof' && timeTaken !== null && (
            <div className='flex flex-col items-center'>
              <span className='text-[7px] text-cyan-900 font-black uppercase'>Latency</span>
              <div className="flex items-center gap-1 text-white font-mono leading-none">
                <span className="text-lg font-black">{timeTaken.toFixed(2)}<span className="text-[10px] ml-0.5 opacity-50">s</span></span>
              </div>
            </div>
          )}
          
          {isCorrect && score !== null && (
            <>
              <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
              <div className='flex flex-col items-center'>
                <span className='text-[7px] text-cyan-900 font-black uppercase'>Salvage</span>
                <div className="flex items-center gap-1 text-cyan-400 font-mono leading-none">
                  <span className="text-lg font-black">+{score}<span className="text-[10px] ml-0.5 opacity-50">MP</span></span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-black/50 border-t border-white/5 font-mono text-[11px] leading-relaxed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[8px] text-cyan-900 mb-1 uppercase tracking-widest font-black italic">User_Transmission</p>
            <p className="text-white/80 bg-slate-950/80 p-2.5 rounded border border-white/5 break-all">
              {problemData.type === 'graphing' ? userAnswer : (userAnswer || 'NULL').replace(/;/g, ' | ')}
            </p>
          </div>
          <div>
            <p className="text-[8px] text-cyan-900 mb-1 uppercase tracking-widest font-black italic">Validated_Data</p>
            <p className="text-cyan-400 bg-slate-950/80 p-2.5 rounded border border-cyan-400/20 break-all">
              {problemData.answer.replace(/;/g, ' | ')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
    </div>
  );
};

export default ProblemResultDisplay;
