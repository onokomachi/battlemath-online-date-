
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Problem, SessionStats, ProblemViewRef } from '../types';
import { getShuffledProblemSet } from '../services/problemService';
import { difficultyMap, MATH_CATEGORIES } from '../constants';
import DrawingCanvas from './DrawingCanvas';
import Keypad from './Keypad';
import ProblemControls from './ProblemControls';
import ProblemResultDisplay from './ProblemResultDisplay';
import { BackIcon, PencilIcon, HomeIcon, TrophyIcon, ClockIcon } from './Icons';

// Sub-views
import AngleDiagramView from './AngleDiagramView';
import BentTransversalDiagramView from './BentTransversalDiagramView';
import FillInProofProblemView from './FillInProofProblemView';
import GraphingProblemView from './GraphingProblemView';
import GraphingWithTableProblemView from './GraphingWithTableProblemView';
import GraphToEquationProblemView from './GraphToEquationProblemView';
import GraphWithDomainProblemView from './GraphWithDomainProblemView';
import GuidedEquationProblemView from './GuidedEquationProblemView';
import IntersectionGuidedEquationView from './IntersectionGuidedEquationView';
import MultiTransversalAngleDiagramView from './MultiTransversalAngleDiagramView';
import VerticalCalculationProblemView from './VerticalCalculationProblemView';
import ProofProblemView from './ProofProblemView';
import SimultaneousEquationProblemView from './SimultaneousEquationProblemView';
import TriangleInParallelLinesView from './TriangleInParallelLinesView';
import GraphProblemView from './GraphProblemView';

interface ProblemScreenProps {
  category: string;
  subTopic: string;
  onBack: (stats: SessionStats) => void;
  onHome: () => void;
}

const HintModal: React.FC<{ hint: string | string[]; onClose: () => void }> = ({ hint, onClose }) => (
  <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
    <div className="hud-panel rounded-2xl p-8 max-w-xl w-full shadow-2xl border-cyan-400/40 animate-math-fade-in relative">
      <div className="corner-accent lt border-cyan-400"></div>
      <div className="corner-accent rb border-cyan-400"></div>
      <h3 className="text-cyan-400 text-2xl font-black mb-4 flex items-center gap-3 font-['Cinzel_Decorative'] tracking-widest">
        ◈ ANALYSIS_HINT
      </h3>
      <div className="text-white/90 text-lg space-y-3 font-['Inter'] leading-relaxed border-l-2 border-cyan-500/20 pl-4">
        {Array.isArray(hint) ? hint.map((h, i) => <p key={i}>{h}</p>) : <p>{hint}</p>}
      </div>
      <button
        onClick={onClose}
        className="mt-8 w-full btn-tactical py-3 rounded-lg font-black text-cyan-400 border-cyan-400/40 hover:bg-cyan-400/20 text-lg tracking-widest"
      >
        DISMISS
      </button>
    </div>
  </div>
);

const PracticeSummary: React.FC<{ stats: SessionStats, subTopic: string, onBack: () => void }> = ({ stats, subTopic, onBack }) => {
    const accuracy = (stats.correct / stats.problemCount) * 100;
    const diff = difficultyMap[subTopic] || 3;
    
    // ランク計算ロジック
    let rank = 'D';
    if (accuracy === 100) rank = 'A';
    else if (accuracy >= 75) rank = 'B';
    else if (accuracy >= 50) rank = 'C';

    if (rank === 'A') {
        const totalPoints = stats.totalScore;
        const maxPossiblePoints = stats.problemCount * 20;
        if (totalPoints > maxPossiblePoints * 0.85) rank = 'S';
    }

    return (
        <div className="flex flex-col items-center animate-level-up-reveal w-full max-w-2xl mx-auto">
             <div className="text-center mb-8">
                <p className="text-cyan-500 font-black tracking-[0.5em] text-xs uppercase mb-2">Analysis_Complete</p>
                <h2 className="text-5xl font-black font-['Cinzel_Decorative'] text-white tracking-widest">SUMMARY</h2>
             </div>
             
             <div className="hud-panel w-full rounded-2xl p-10 flex flex-col items-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full"></div>
                
                <div className="text-8xl font-black mb-8 drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                    <span className={rank === 'S' ? 'text-amber-400' : rank === 'A' ? 'text-cyan-400' : 'text-slate-400'}>{rank}</span>
                    <span className="text-xs text-white/30 uppercase tracking-widest block text-center font-sans mt-2">Evaluation_Rank</span>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full font-mono mb-10 border-t border-cyan-500/10 pt-10">
                    <div className="text-center">
                        <p className="text-[10px] text-cyan-800 font-black uppercase mb-1">Synchronization</p>
                        <p className="text-3xl text-white">{stats.correct} / {stats.problemCount}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-cyan-800 font-black uppercase mb-1">Energy_Salvage</p>
                        <p className="text-3xl text-cyan-400">{stats.totalScore} MP</p>
                    </div>
                </div>

                <button onClick={onBack} className="btn-tactical w-full py-4 rounded-xl font-black text-xl tracking-[0.3em] text-cyan-400 border-cyan-400/40">
                    CONFIRM_AND_EXIT
                </button>
             </div>
        </div>
    );
};

const ProblemScreen: React.FC<ProblemScreenProps> = ({ category, subTopic, onBack, onHome }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | 'proof' | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0, totalScore: 0, problemCount: 0 });
  const [isMemoVisible, setIsMemoVisible] = useState(false);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [vfxClass, setVfxClass] = useState('');

  const problemViewRef = useRef<ProblemViewRef>(null);

  // 現在の階層パスを取得
  const getHierarchyLabel = useCallback(() => {
    const cat = MATH_CATEGORIES.find(c => c.name === category);
    if (!cat) return category;
    const group = cat.groups.find(g => g.subtopics.includes(subTopic));
    return group ? `${category} / ${group.name}` : category;
  }, [category, subTopic]);

  useEffect(() => {
    const loadedProblems = getShuffledProblemSet(category, subTopic);
    setProblems(loadedProblems);
    setIsLoading(false);
    setStartTime(Date.now());
  }, [category, subTopic]);

  const currentProblem = problems[currentIndex] || null;
  const isProof = currentProblem?.type === 'proof';
  const problemData = currentProblem?.data as any;
  const problemHint = currentProblem?.data?.hint;

  const handleNextProblem = useCallback(() => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setShowAnswer(false);
      setResult(null);
      setTimeTaken(null);
      setScore(null);
      setStartTime(Date.now());
      setVfxClass('');
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, problems.length]);

  const checkAnswer = useCallback(() => {
    if (!currentProblem || result !== null) return;

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    setTimeTaken(duration);

    if (isProof) {
      setResult('proof');
      setShowAnswer(true);
      setSessionStats(prev => ({ ...prev, correct: prev.correct + 1, totalScore: prev.totalScore + 10, problemCount: prev.problemCount + 1 }));
      return;
    }

    // Normalize power notation: ^N → superscript for all digits
    const superscriptMap: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'm': 'ᵐ' };
    const normalizePowers = (s: string) => s.replace(/\^([0-9+\-nm]+)/g, (_, digits: string) => digits.split('').map(c => superscriptMap[c] || c).join(''));
    const normalizeAnswer = (s: string) => normalizePowers(s.trim().replace(/[°度]/g, '').replace(/pi/gi, 'π').replace(/\s+/g, ''));
    const cleanUser = normalizeAnswer(userAnswer);
    const cleanTarget = normalizeAnswer(currentProblem.answer);

    // For multiple-choice questions, compare as sorted sets
    const isCorrect = problemData?.multiple
      ? cleanUser.split(',').sort().join(',') === cleanTarget.split(',').sort().join(',')
      : cleanUser === cleanTarget;

    if (isCorrect) {
      setResult('correct');
      setVfxClass('vfx-success ring-2 ring-cyan-500');
      const points = Math.max(5, Math.floor(25 - duration));
      setScore(points);
      setSessionStats(prev => ({
        ...prev,
        correct: prev.correct + 1,
        totalScore: prev.totalScore + points,
        problemCount: prev.problemCount + 1
      }));
    } else {
      setResult('incorrect');
      setVfxClass('vfx-shake ring-2 ring-red-500');
      setSessionStats(prev => ({
        ...prev,
        incorrect: prev.incorrect + 1,
        problemCount: prev.problemCount + 1
      }));
    }
    setShowAnswer(true);
  }, [currentProblem, result, startTime, userAnswer, isProof]);

  const handleKeypadClick = useCallback((key: string) => {
    if (showAnswer) return;
    
    const interactiveTypes = ['fill_in_proof', 'graphing', 'graphing_with_table', 'vertical_calculation', 'guided_equation', 'intersection_guided_equation', 'simultaneous_equation'];
    if (interactiveTypes.includes(currentProblem?.type || '')) {
       problemViewRef.current?.handleKeyClick(key);
       return;
    }

    if (key === 'BACKSPACE') {
      setUserAnswer(prev => prev.slice(0, -1));
    } else if (key === 'CLEAR') {
      setUserAnswer('');
    } else {
      setUserAnswer(prev => prev + key);
    }
  }, [showAnswer, currentProblem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showAnswer) {
         if (e.key === 'Enter') handleNextProblem();
         return;
      }
      
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
        if (userAnswer) checkAnswer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeypadClick, showAnswer, handleNextProblem, checkAnswer, userAnswer]);

  const getOptimizedKeypadLayout = (): string[][] => {
    if (!currentProblem) return [[]];
    const type = currentProblem.type;

    // Geometry angle problems - consistent layout
    if (['angle_diagram', 'bent_transversal_diagram', 'triangle_in_parallel_lines', 'multi_transversal_angle'].includes(type)) {
      return [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['0', '.', '°']];
    }

    // Probability - consistent layout with fraction support
    if (category === '確率') {
      return [['7', '8', '9'], ['4', '5', '6'], ['1', '2', '3'], ['0', '/', ' ']];
    }

    // Graph with domain
    if (type === 'graph_with_domain') {
      return [['7', '8', '9', 'y'], ['4', '5', '6', '≤', '≥'], ['1', '2', '3', '<', '>'], ['0', '.', '-', ' ']];
    }

    // Category-based layouts (don't leak answer info)
    if (category === '式の計算') {
      // Always show full set of variables and operators for expressions
      return [
        ['7', '8', '9', 'x', 'y'],
        ['4', '5', '6', 'a', 'b'],
        ['1', '2', '3', '^', '/'],
        ['0', '.', '-', '(', ')']
      ];
    }

    if (category === '連立方程式') {
      return [
        ['7', '8', '9', 'x', 'y'],
        ['4', '5', '6', '=', ','],
        ['1', '2', '3', '+', '/'],
        ['0', '.', '-', '(', ')']
      ];
    }

    if (category === '一次関数') {
      return [
        ['7', '8', '9', 'x', 'y'],
        ['4', '5', '6', '=', '/'],
        ['1', '2', '3', '+', '-'],
        ['0', '.', ' ', '(', ')']
      ];
    }

    // Default algebraic layout
    return [
      ['7', '8', '9', 'x', 'y'],
      ['4', '5', '6', '+', '-'],
      ['1', '2', '3', '/', '^'],
      ['0', '.', '=', '(', ')']
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-cyan-400 font-mono">
        <div className="w-16 h-16 border-2 border-cyan-900 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
        <p className="animate-pulse tracking-[0.2em]">INITIALIZING_HUD...</p>
      </div>
    );
  }

  if (isFinished) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-black/40 backdrop-blur-xl">
            <PracticeSummary stats={sessionStats} subTopic={subTopic} onBack={() => onBack(sessionStats)} />
        </div>
      );
  }

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 flex items-center justify-center relative overflow-hidden font-['Inter'] text-white">
      {isHintVisible && problemHint && <HintModal hint={problemHint} onClose={() => setIsHintVisible(false)} />}
      <DrawingCanvas isVisible={isMemoVisible} />
      
      <div className="relative w-full max-w-6xl">
        <div className={`w-full hud-panel rounded-2xl p-6 md:p-10 z-10 relative transition-all duration-300 ${vfxClass}`}>
           <div className="corner-accent lt border-cyan-500/40"></div>
           <div className="corner-accent rt border-cyan-500/40"></div>
           <div className="corner-accent lb border-cyan-500/40"></div>
           <div className="corner-accent rb border-cyan-500/40"></div>

           <header className='flex justify-between items-center mb-8 border-b border-cyan-500/10 pb-4'>
              <div className='flex items-center gap-4'>
                <button onClick={() => onBack(sessionStats)} className='text-cyan-500 hover:text-white transition-all transform hover:scale-110 p-2 bg-blue-900/10 rounded-lg border border-cyan-500/20' title="前の画面へ">
                  <BackIcon className='w-6 h-6' />
                </button>
                <button onClick={onHome} className='text-cyan-500 hover:text-white transition-all transform hover:scale-110 p-2 bg-blue-900/10 rounded-lg border border-cyan-500/20' title="メインメニューへ">
                  <HomeIcon className='w-6 h-6' />
                </button>
                <div>
                  <h2 className='text-[9px] text-cyan-400 uppercase tracking-[0.4em] font-black opacity-60'>{getHierarchyLabel()}</h2>
                  <h1 className='text-2xl font-bold font-["Cinzel_Decorative"] tracking-widest'>{subTopic}</h1>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-[8px] text-cyan-700 font-mono tracking-widest uppercase'>SYNC_NODES</p>
                <p className='text-2xl font-bold font-mono text-cyan-300'>{currentIndex + 1} <span className="text-xs text-cyan-900">/ {problems.length}</span></p>
              </div>
           </header>

           <main className='grid lg:grid-cols-[1fr_280px] gap-10'>
              <div className='space-y-8'>
                <div className='w-full min-h-[18rem] flex items-center justify-center bg-slate-950/40 rounded-xl p-8 border border-cyan-500/5 shadow-inner relative'>
                    <div className="w-full">
                    {currentProblem?.type === 'angle_diagram' && <AngleDiagramView data={problemData} userAnswer={userAnswer} isSubmitted={showAnswer} />}
                    {currentProblem?.type === 'bent_transversal_diagram' && <BentTransversalDiagramView data={problemData} userAnswer={userAnswer} isSubmitted={showAnswer} />}
                    {currentProblem?.type === 'fill_in_proof' && <FillInProofProblemView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} isSubmitted={showAnswer} submittedAnswer={userAnswer} correctAnswer={currentProblem.answer} />}
                    {currentProblem?.type === 'graphing' && <GraphingProblemView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} />}
                    {currentProblem?.type === 'graphing_with_table' && <GraphingWithTableProblemView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} />}
                    {currentProblem?.type === 'graph_to_equation' && <GraphToEquationProblemView data={problemData} />}
                    {currentProblem?.type === 'graph_with_domain' && <GraphWithDomainProblemView data={problemData} isVisualHintVisible={showAnswer} />}
                    {currentProblem?.type === 'guided_equation' && <GuidedEquationProblemView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} isSubmitted={showAnswer} submittedAnswer={userAnswer} correctAnswer={currentProblem.answer} />}
                    {currentProblem?.type === 'intersection_guided_equation' && <IntersectionGuidedEquationView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} isSubmitted={showAnswer} submittedAnswer={userAnswer} correctAnswer={currentProblem.answer} />}
                    {currentProblem?.type === 'multi_transversal_angle' && <MultiTransversalAngleDiagramView data={problemData} userAnswer={userAnswer} isSubmitted={showAnswer} />}
                    {currentProblem?.type === 'vertical_calculation' && <VerticalCalculationProblemView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} isSubmitted={showAnswer} submittedAnswer={userAnswer} correctAnswer={currentProblem.answer} />}
                    {currentProblem?.type === 'proof' && <ProofProblemView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} isSubmitted={showAnswer} />}
                    {currentProblem?.type === 'simultaneous_equation' && <SimultaneousEquationProblemView ref={problemViewRef} data={problemData} onAnswerChange={setUserAnswer} isSubmitted={showAnswer} />}
                    {currentProblem?.type === 'triangle_in_parallel_lines' && <TriangleInParallelLinesView data={problemData} userAnswer={userAnswer} isSubmitted={showAnswer} />}
                    {currentProblem?.type === 'graph_with_area' && 
                        <div className="text-center w-full">
                          <p className="text-xl mb-4 font-mono">{problemData?.question || "面積を求めよ"}</p>
                          <div className="w-full max-w-xs mx-auto aspect-square">
                            <GraphProblemView lines={problemData?.graphLines || []} polygon={problemData?.polygon} />
                          </div>
                        </div>
                    }
                    {(currentProblem?.type === 'text' || !currentProblem?.type) && (
                      <div className="w-full text-center">
                        <p className="text-3xl leading-snug mb-8 font-mono tracking-tight">{problemData?.question || problemData?.questionText || "問題文の解析に失敗しました"}</p>
                        {problemData?.imageUrl && <img src={problemData.imageUrl} alt="DOC" className="max-w-full max-h-64 mx-auto rounded-lg shadow-xl border border-cyan-500/10 p-1 bg-slate-900 mb-6" />}
                        {problemData?.options && (
                          <div className="grid gap-3 max-w-lg mx-auto mt-4">
                            {(problemData.options as string[]).map((opt: string, i: number) => {
                              const isSelected = problemData.multiple
                                ? userAnswer.split(',').map((s: string) => s.trim()).includes(opt)
                                : userAnswer === opt;
                              return (
                                <button
                                  key={i}
                                  onClick={() => {
                                    if (showAnswer) return;
                                    if (problemData.multiple) {
                                      const current = userAnswer ? userAnswer.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
                                      if (current.includes(opt)) {
                                        setUserAnswer(current.filter((s: string) => s !== opt).join(','));
                                      } else {
                                        setUserAnswer([...current, opt].join(','));
                                      }
                                    } else {
                                      setUserAnswer(opt);
                                    }
                                  }}
                                  disabled={showAnswer}
                                  className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all text-lg font-mono
                                    ${isSelected
                                      ? 'border-cyan-400 bg-cyan-900/30 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                                      : 'border-cyan-900/30 bg-slate-900/60 text-white hover:border-cyan-600/50 hover:bg-slate-800/60'}
                                    ${showAnswer ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span className="text-cyan-500 mr-3 font-bold">{String.fromCharCode(65 + i)}.</span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                </div>

                {!['proof'].includes(currentProblem?.type || '') && !problemData?.options && (
                  <div className='flex flex-col items-center gap-6'>
                    {!['fill_in_proof', 'graphing', 'graphing_with_table', 'vertical_calculation', 'guided_equation', 'intersection_guided_equation', 'simultaneous_equation'].includes(currentProblem?.type || '') && (
                        <div className='w-full max-w-lg'>
                           <div className={`min-h-[4.5rem] p-4 bg-slate-950/60 rounded-lg border-b-2 border-cyan-500/40 flex items-center shadow-inner`}>
                              <span className='text-xs font-mono text-cyan-800 mr-4 font-black'>RESULT_BUFFER:</span>
                              <span className='text-3xl font-mono text-cyan-300 flex-grow font-black drop-shadow-[0_0_8px_cyan]'>{userAnswer}</span>
                           </div>
                        </div>
                    )}
                    <div className="w-full max-w-lg">
                      <Keypad onKeyClick={handleKeypadClick} layout={getOptimizedKeypadLayout()} disabled={showAnswer} />
                    </div>
                  </div>
                )}

                <ProblemResultDisplay
                  showAnswer={showAnswer}
                  problemData={currentProblem}
                  result={result}
                  userAnswer={userAnswer}
                  timeTaken={timeTaken}
                  score={score}
                  getResultRingColor={() => showAnswer ? (result === 'correct' ? 'border-cyan-400' : 'border-red-500') : 'border-transparent'}
                />
              </div>

              <div className="flex flex-col gap-4">
                <ProblemControls
                  isProof={isProof}
                  isLoading={isLoading}
                  userAnswer={userAnswer}
                  result={result}
                  isSessionComplete={currentIndex >= problems.length}
                  hasHint={!!problemHint}
                  onCheckAnswer={checkAnswer}
                  onLoadNextProblem={handleNextProblem}
                  onShowHint={() => setIsHintVisible(true)}
                />
                
                <div className="hud-panel p-4 rounded-xl font-mono text-[10px] text-cyan-500/50 space-y-2 mt-auto border-cyan-500/5">
                   <div className="flex justify-between"><span>LINK:</span><span className="text-cyan-400">ENCRYPTED</span></div>
                   <div className="flex justify-between"><span>SYNC:</span><span className="text-white">ACTIVE</span></div>
                   <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-2">
                     <div className="bg-cyan-500 h-full w-[92%] animate-pulse"></div>
                   </div>
                </div>
              </div>
           </main>
        </div>

        <button 
          onClick={() => setIsMemoVisible(prev => !prev)}
          className={`fixed bottom-8 right-8 p-5 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 ${isMemoVisible ? 'bg-cyan-500 text-slate-950 ring-2 ring-white' : 'bg-slate-900/80 text-cyan-400 border border-cyan-500/40'}`}
        >
          <PencilIcon className='w-8 h-8' />
        </button>
      </div>
    </div>
  );
};

export default ProblemScreen;
