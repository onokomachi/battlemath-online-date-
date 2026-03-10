
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ProblemCard, TurnPhase, ProblemViewRef, TurnInitiative } from '../types';
import Card, { CardBack } from './Card';
import GameLog from './GameLog';
import AngleDiagramView from './AngleDiagramView';
import BentTransversalDiagramView from './BentTransversalDiagramView';
import FillInProofProblemView from './FillInProofProblemView';
import DrawingCanvas from './DrawingCanvas';
import { PencilIcon } from './Icons';
import GraphingProblemView from './GraphingProblemView';
import GraphingWithTableProblemView from './GraphingWithTableProblemView';
import GraphToEquationProblemView from './GraphToEquationProblemView';
import GraphWithDomainProblemView from './GraphWithDomainProblemView';
import GraphProblemView from './GraphProblemView';
import Keypad from './Keypad';


// --- ProblemSolver Component ---
interface ProblemSolverProps {
  problemCard: ProblemCard;
  onAnswerSubmit: (answer: string) => void;
  isSolving: boolean;
  turnPhase: TurnPhase;
}

const ProblemSolver: React.FC<ProblemSolverProps> = ({ problemCard, onAnswerSubmit, isSolving, turnPhase }) => {
  const [answer, setAnswer] = useState('');
  const problemViewRef = useRef<ProblemViewRef>(null);

  useEffect(() => {
    if (isSolving) {
      setAnswer('');
    }
  }, [isSolving, problemCard]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (answer.trim() || problemCard.problem.type === 'graphing') {
      onAnswerSubmit(answer.trim());
    }
  }, [answer, onAnswerSubmit, problemCard]);

  const handleKeypadClick = useCallback((key: string) => {
    if (!isSolving || turnPhase !== 'solving_problem') return;
    
    const problemType = problemCard?.problem?.type;
    const interactiveTypes = ['fill_in_proof', 'graphing', 'graphing_with_table', 'vertical_calculation', 'guided_equation', 'simultaneous_equation'];

    if (interactiveTypes.includes(problemType)) {
       problemViewRef.current?.handleKeyClick(key);
       return;
    }

    if (key === 'BACKSPACE') {
      setAnswer(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setAnswer('');
    } else {
      setAnswer(prev => prev + key);
    }
  }, [isSolving, turnPhase, problemCard]);

  // Physical keyboard support for Battle Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isSolving || turnPhase !== 'solving_problem') return;

      const keyMap: Record<string, string> = {
        'Backspace': 'BACKSPACE',
        'Escape': 'CLEAR',
        'Delete': 'CLEAR',
        '*': '×',
        'p': 'π',
        '^': '^',
        'd': '°',
        '<': '<',
        '>': '>',
      };

      if (keyMap[e.key]) {
        handleKeypadClick(keyMap[e.key]);
      } else if (/^[0-9xya b=+\-/,().]$/.test(e.key)) {
        handleKeypadClick(e.key);
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeypadClick, isSolving, turnPhase, handleSubmit]);

  const getOptimizedKeypadLayout = (): string[][] => {
    const type = problemCard.problem.type;

    // Geometry angle problems
    if (['angle_diagram', 'bent_transversal_diagram', 'triangle_in_parallel_lines', 'multi_transversal_angle'].includes(type)) {
      return [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['0', '.', '°']];
    }
    if (type === 'graph_with_domain') {
      return [['7', '8', '9', 'y'], ['4', '5', '6', '≤', '≥'], ['1', '2', '3', '<', '>'], ['0', '.', '-', ' ']];
    }

    // Default algebraic layout for battle mode (consistent, doesn't leak answer)
    return [
      ['7', '8', '9', 'x', 'y'],
      ['4', '5', '6', '+', '-'],
      ['1', '2', '3', '/', '^'],
      ['0', '.', '=', '(', ')']
    ];
  };

  const problemType = problemCard.problem.type;
  const problemData = problemCard.problem.data as any;

  return (
    <div className="w-full max-w-4xl bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-8 flex flex-col items-center shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
      <h3 className="text-cyan-400 font-black text-xs tracking-[0.4em] uppercase mb-6 opacity-60">Intercepted_Transmission</h3>

      <div className="w-full">
      {problemType === 'angle_diagram' && <AngleDiagramView data={problemData} userAnswer={answer} isSubmitted={false} />}
      {problemType === 'bent_transversal_diagram' && <BentTransversalDiagramView data={problemData} userAnswer={answer} isSubmitted={false} />}
      {problemType === 'fill_in_proof' && <FillInProofProblemView data={problemData} onAnswerChange={setAnswer} isSubmitted={false} submittedAnswer="" correctAnswer={problemCard.problem.answer} ref={problemViewRef} />}
      {problemType === 'graphing' && <GraphingProblemView data={problemData} onAnswerChange={setAnswer} ref={problemViewRef} />}
      {problemType === 'graphing_with_table' && <GraphingWithTableProblemView data={problemData} onAnswerChange={setAnswer} ref={problemViewRef} />}
      {problemType === 'graph_to_equation' && <GraphToEquationProblemView data={problemData} />}
      {problemType === 'graph_with_domain' && <GraphWithDomainProblemView data={problemData} isVisualHintVisible={false} />}
      {problemType === 'graph_with_area' && 
          <div className="text-center w-full">
            <p className="text-2xl mb-4 font-mono">{problemData?.question || "面積を求めよ"}</p>
            <div className="w-full max-w-sm mx-auto aspect-square bg-slate-900 rounded-xl p-2 border border-cyan-500/10">
             <GraphProblemView lines={problemData?.graphLines || []} polygon={problemData?.polygon} />
            </div>
          </div>
      }
      {(problemType === 'text' || !problemType) && (
        <div className="w-full min-h-[12rem] bg-slate-900/50 border border-cyan-500/5 rounded-xl p-6 mb-6 flex flex-col items-center justify-center text-center text-white text-3xl font-mono tracking-tight">
          <p>{problemData?.question || problemData?.questionText || "数式を解析せよ"}</p>
          {problemData?.imageUrl && <img src={problemData.imageUrl} alt="DOC" className="max-w-full max-h-48 mx-auto rounded-lg border border-cyan-500/10 p-1 bg-slate-900 my-4" />}
          {problemData?.svg && (
            <div className="w-full max-w-md h-auto my-6 p-4 bg-slate-950 rounded-lg border border-cyan-500/10" dangerouslySetInnerHTML={{ __html: problemData.svg }} />
          )}
          {problemData?.options && (
            <div className="grid gap-2 w-full max-w-lg mt-4 text-lg">
              {(problemData.options as string[]).map((opt: string, i: number) => {
                const isSelected = problemData.multiple
                  ? answer.split(',').map((s: string) => s.trim()).includes(opt)
                  : answer === opt;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (turnPhase !== 'solving_problem') return;
                      if (problemData.multiple) {
                        const current = answer ? answer.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                        if (current.includes(opt)) {
                          setAnswer(current.filter((s: string) => s !== opt).join(','));
                        } else {
                          setAnswer([...current, opt].join(','));
                        }
                      } else {
                        setAnswer(opt);
                      }
                    }}
                    disabled={turnPhase !== 'solving_problem'}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all
                      ${isSelected
                        ? 'border-cyan-400 bg-cyan-900/30 text-cyan-200'
                        : 'border-cyan-900/30 bg-slate-900/60 text-white hover:border-cyan-600/50'}
                      disabled:opacity-50`}
                  >
                    <span className="text-cyan-500 mr-2 font-bold">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        {!['proof'].includes(problemType) && (
          <div className="w-full flex flex-col items-center mt-6">
             {!problemData?.options && !['fill_in_proof', 'graphing', 'graphing_with_table', 'vertical_calculation', 'guided_equation', 'simultaneous_equation'].includes(problemType) && (
                 <div className="w-full max-w-xl mb-4">
                    <div className={`min-h-[4rem] p-4 border-b-4 bg-slate-950 flex items-center border-cyan-500 shadow-inner`}>
                        <span className="text-2xl font-mono text-cyan-900 mr-4 font-black">A_STREAM:</span>
                        <span className="text-4xl font-mono text-cyan-300 flex-grow font-black drop-shadow-[0_0_10px_cyan]" style={{ wordBreak: 'break-all' }}>{answer}</span>
                    </div>
                </div>
             )}
            {!problemData?.options && <Keypad onKeyClick={handleKeypadClick} layout={getOptimizedKeypadLayout()} disabled={turnPhase !== 'solving_problem'} />}
             <button
              type="submit"
              disabled={!isSolving || turnPhase !== 'solving_problem'}
              className="w-full mt-8 bg-blue-700 text-white font-black py-4 px-10 rounded-xl hover:bg-blue-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all text-xl tracking-[0.4em] border border-blue-400/30 shadow-2xl"
            >
              COMMIT_SEQUENCE
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

// --- HP Bar Component (aicardbattle2 integration) ---
const HpBar: React.FC<{ hp: number; maxHp: number; label: string; isPlayer: boolean }> = ({ hp, maxHp, label, isPlayer }) => {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const color = pct > 50 ? (isPlayer ? 'bg-cyan-400' : 'bg-red-500') : pct > 25 ? 'bg-amber-400' : 'bg-red-600';
  return (
    <div className={`p-4 rounded-2xl border-2 flex flex-col gap-2 w-80 shadow-2xl backdrop-blur-md ${isPlayer ? 'bg-blue-900/20 border-cyan-500/40' : 'bg-slate-900/40 border-slate-700'}`}>
      <div className="flex justify-between items-center">
        <span className={`text-[10px] font-black uppercase tracking-widest ${isPlayer ? 'text-cyan-400' : 'text-gray-500'}`}>{label}</span>
        <span className="text-xl font-black font-mono text-white">{hp} <span className="text-sm opacity-30">/ {maxHp} HP</span></span>
      </div>
      <div className="bg-slate-950/80 h-3 rounded-full overflow-hidden p-[1px] border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(34,211,238,0.4)] ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// --- GameBoard Component ---
interface GameBoardProps {
  turnPhase: TurnPhase;
  playerScore: number;
  pcScore: number;
  playerHP: number;
  pcHP: number;
  initialHP: number;
  playerHand: ProblemCard[];
  pcHandSize: number;
  playerDeckSize: number;
  pcDeckSize: number;
  playerPlayedCard: ProblemCard | null;
  pcPlayedCard: ProblemCard | null;
  onCardSelect: (card: ProblemCard) => void;
  onAnswerSubmit: (answer: string) => void;
  selectedCardId: number | null;
  gameLog: string[];
  roundResult: string | null;
  maxScore: number;
  initiative: TurnInitiative;
}

const ScoreDisplay: React.FC<{ score: number; label: string; maxScore: number; isPlayer: boolean }> = ({ score, label, maxScore, isPlayer }) => (
  <div className={`p-5 rounded-2xl border-2 flex items-center justify-between gap-6 w-80 shadow-2xl backdrop-blur-md ${isPlayer ? 'bg-blue-900/20 border-cyan-500/40' : 'bg-slate-900/40 border-slate-700'}`}>
    <div className="flex flex-col">
      <span className={`text-[10px] font-black uppercase tracking-widest ${isPlayer ? 'text-cyan-400' : 'text-gray-500'}`}>{label}</span>
      <span className="text-3xl font-black font-mono text-white leading-none mt-1">{score} <span className="text-sm opacity-30">/ {maxScore}</span></span>
    </div>
    <div className="flex-grow bg-slate-950/80 h-3 rounded-full overflow-hidden p-[1px] border border-white/5">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)] ${isPlayer ? 'bg-cyan-400' : 'bg-slate-600'}`}
          style={{ width: `${(score / maxScore) * 100}%` }}
        ></div>
    </div>
  </div>
);

const GameBoard: React.FC<GameBoardProps> = ({
  turnPhase,
  playerScore,
  pcScore,
  playerHP,
  pcHP,
  initialHP,
  playerHand,
  pcHandSize,
  playerDeckSize,
  pcDeckSize,
  playerPlayedCard,
  pcPlayedCard,
  onCardSelect,
  onAnswerSubmit,
  selectedCardId,
  gameLog,
  roundResult,
  maxScore,
  initiative
}) => {
  const [isDrawing, setIsDrawing] = useState(false);

  const isPlayerSecond = initiative === 'pc';
  const playerMustMatchLevel = isPlayerSecond && pcPlayedCard !== null && playerPlayedCard === null;

  return (
    <div className="w-full h-full flex flex-col justify-between items-center p-6 relative overflow-hidden">
      {/* Star Field Decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/5 blur-[60px] rounded-full"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-cyan-500/5 blur-[80px] rounded-full"></div>

      {/* PC Area */}
      <div className="w-full flex justify-center items-center flex-col space-y-6">
        <HpBar hp={pcHP} maxHp={initialHP} label={`Enemy_HP  |  正解: ${pcScore}`} isPlayer={false} />
        <div className="flex justify-center items-center h-48 space-x-2">
          {[...Array(pcHandSize)].map((_, i) => (
            <div key={i} className="opacity-40 hover:opacity-60 transition-opacity relative group transform -translate-y-4">
              <CardBack />
              {i === 0 && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Stack: {pcDeckSize}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Battle Field */}
      <div className="w-full flex justify-center items-center h-[28rem] gap-12 relative">
        <div className="w-56 h-80 flex items-center justify-center relative">
          {playerPlayedCard ? (
            <div className="animate-math-fade-in"><Card card={playerPlayedCard} isSelected={true} /></div>
          ) : (
            <div className="w-full h-full rounded-2xl border-2 border-dashed border-cyan-500/10 flex items-center justify-center">
                <span className="text-cyan-900 text-xs font-black uppercase tracking-[0.5em] animate-pulse">
                    {initiative === 'player' ? 'Pick Protocol' : 'Sync Awaiting'}
                </span>
            </div>
          )}
          {playerPlayedCard && <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-cyan-400 text-[10px] font-black tracking-widest uppercase">Deployed</div>}
        </div>

        <div className="flex-grow flex flex-col items-center justify-center max-w-4xl z-20">
          {turnPhase === 'solving_problem' && pcPlayedCard ? (
            <ProblemSolver 
              problemCard={pcPlayedCard} 
              onAnswerSubmit={onAnswerSubmit}
              isSolving={turnPhase === 'solving_problem'}
              turnPhase={turnPhase}
            />
          ) : (
             <div className="text-center bg-slate-950/40 backdrop-blur-md p-10 rounded-full border border-cyan-500/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                {turnPhase === 'selecting_card' ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                        <p className="text-cyan-200 text-3xl font-black tracking-[0.3em] uppercase italic">
                            {initiative === 'player' ? (playerPlayedCard ? 'PC SYNCING...' : 'YOUR INITIATIVE') : (pcPlayedCard ? 'SYNC YOUR MODULE' : 'PC INITIATIVE')}
                        </p>
                        {playerMustMatchLevel && (
                             <div className="bg-amber-500/20 border border-amber-500/40 px-4 py-1 rounded text-[10px] text-amber-300 font-black uppercase tracking-widest animate-pulse">
                                Required Level: {pcPlayedCard.difficulty}
                             </div>
                        )}
                    </div>
                ) : (
                    <div className="text-cyan-500 text-6xl font-black tracking-widest animate-pulse font-['Cinzel_Decorative']">VS</div>
                )}
            </div>
          )}
          {roundResult && <div className={`mt-8 text-5xl font-black text-center animate-math-fade-in tracking-tighter drop-shadow-[0_0_20px_rgba(34,211,238,0.5)] ${roundResult.includes('VICTORY') ? 'text-cyan-300' : 'text-red-500'}`}>{roundResult}</div>}
        </div>

        <div className="w-56 h-80 flex items-center justify-center relative">
          {pcPlayedCard ? (
            <div className="animate-math-fade-in"><Card card={pcPlayedCard} isSelected={true} /></div>
          ) : (
            <div className="w-full h-full rounded-2xl border-2 border-dashed border-slate-700/30 flex items-center justify-center">
                <span className="text-slate-800 text-xs font-black uppercase tracking-[0.5em]">
                    {initiative === 'pc' ? 'Analyzing...' : 'Standby'}
                </span>
            </div>
          )}
          {pcPlayedCard && <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-slate-500 text-[10px] font-black tracking-widest uppercase">Detected</div>}
        </div>
      </div>

      {/* Player Area */}
      <div className="w-full flex justify-center items-center flex-col space-y-6">
       <div className="h-80 flex justify-center items-end space-x-[-3rem] pb-6" onClick={(e) => e.stopPropagation()}>
          {turnPhase === 'selecting_card' && (
            <>
              <div className="relative mr-8 group transform translate-y-4">
                <CardBack />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-blue-900 border border-cyan-500/40 text-cyan-200 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Memory: {playerDeckSize}</div>
              </div>
              {playerHand.map(card => {
                const isForbidden = playerMustMatchLevel && card.difficulty !== pcPlayedCard.difficulty;
                return (
                  <Card
                    key={card.id}
                    card={card}
                    onClick={() => onCardSelect(card)}
                    isPlayable={turnPhase === 'selecting_card'}
                    inHand={true}
                    isSelected={selectedCardId === card.id}
                    isDisabled={isForbidden}
                  />
                );
              })}
            </>
          )}
        </div>
        <HpBar hp={playerHP} maxHp={initialHP} label={`Player_HP  |  正解: ${playerScore}`} isPlayer={true} />
      </div>

      <DrawingCanvas isVisible={isDrawing} />
      
      <button 
        onClick={() => setIsDrawing(prev => !prev)}
        className={`fixed top-8 right-8 p-5 rounded-full shadow-2xl transition-all transform hover:scale-110 z-30 backdrop-blur-md ${isDrawing ? 'bg-cyan-500 text-slate-950 border-white border-4' : 'bg-slate-900/80 text-cyan-400 border border-cyan-500/40'}`}
        aria-label="Toggle Drawing Memo"
      >
        <PencilIcon className="w-8 h-8" />
      </button>

      <div className="fixed bottom-8 right-8">
        <GameLog messages={gameLog} />
      </div>
    </div>
  );
};

export default GameBoard;
