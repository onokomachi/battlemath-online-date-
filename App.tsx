
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { ProblemCard, TurnPhase, GameState, TurnInitiative } from './types';
import { CARD_DEFINITIONS, HAND_SIZE, DECK_SIZE, MAX_SCORE } from './constants';
import GameBoard from './components/GameBoard';
import DeckBuilder from './components/DeckBuilder';
import MainMenu from './components/MainMenu';
import PracticeMode from './components/PracticeMode';
import CardShop from './components/CardShop';
import LevelUpModal from './components/LevelUpModal';
import GravityBackground from './components/GravityBackground';

const shuffleDeck = (deck: ProblemCard[]): ProblemCard[] => {
  return [...deck].sort(() => Math.random() - 0.5);
};

const normalizeAnswer = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, '')
    .replace(/[°度円枚個m分]/g, '')
    .replace(/＝/g, '=')
    .replace(/／/g, '/')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/pi/gi, 'π')
    .replace(/0\.5x/g, '1/2x')
    .replace(/([+-])0\.5x/g, '$11/2x')
    .toLowerCase();
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('main_menu');
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('selecting_card');
  const [initiative, setInitiative] = useState<TurnInitiative>('player');
  
  const [mathPoints, setMathPoints] = useState<number>(() => {
    try {
      const savedPoints = localStorage.getItem('battleMathPoints');
      return savedPoints ? JSON.parse(savedPoints) : 1000; 
    } catch (error) { return 1000; }
  });

  const [ownedCardIds, setOwnedCardIds] = useState<Set<number>>(() => {
    try {
      const savedCardIds = localStorage.getItem('battleMathOwnedCardIds');
      if (savedCardIds) return new Set(JSON.parse(savedCardIds));
    } catch (error) {}
    return new Set(CARD_DEFINITIONS.slice(0, 20).map(c => c.id));
  });
  
  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    try {
      const savedLevel = localStorage.getItem('battleMathPlayerLevel');
      return savedLevel ? JSON.parse(savedLevel) : 1;
    } catch (error) { return 1; }
  });
  
  const [playerExp, setPlayerExp] = useState<number>(() => {
    try {
      const savedExp = localStorage.getItem('battleMathPlayerExp');
      return savedExp ? JSON.parse(savedExp) : 0;
    } catch (error) { return 0; }
  });

  // Level-specific Stats for DDA
  const [userLevelStats, setUserLevelStats] = useState<Record<number, { avgTime: number, count: number }>>(() => {
    try {
      const saved = localStorage.getItem('battleMathUserLevelStats');
      return saved ? JSON.parse(saved) : {
          1: { avgTime: 5000, count: 0 },
          2: { avgTime: 10000, count: 0 },
          3: { avgTime: 20000, count: 0 },
          4: { avgTime: 40000, count: 0 },
          5: { avgTime: 60000, count: 0 }
      };
    } catch (error) { return { 1: { avgTime: 5000, count: 0 }, 2: { avgTime: 10000, count: 0 }, 3: { avgTime: 20000, count: 0 }, 4: { avgTime: 40000, count: 0 }, 5: { avgTime: 60000, count: 0 } }; }
  });

  const [levelUpInfo, setLevelUpInfo] = useState<{ oldLevel: number; newLevel: number; mpReward: number; newCard: ProblemCard | null; } | null>(null);

  useEffect(() => {
    localStorage.setItem('battleMathPoints', JSON.stringify(mathPoints));
    localStorage.setItem('battleMathOwnedCardIds', JSON.stringify(Array.from(ownedCardIds)));
    localStorage.setItem('battleMathPlayerLevel', JSON.stringify(playerLevel));
    localStorage.setItem('battleMathPlayerExp', JSON.stringify(playerExp));
    localStorage.setItem('battleMathUserLevelStats', JSON.stringify(userLevelStats));
  }, [mathPoints, ownedCardIds, playerLevel, playerExp, userLevelStats]);

  const ownedCards = useMemo(() => {
    return CARD_DEFINITIONS.filter(card => ownedCardIds.has(card.id));
  }, [ownedCardIds]);
  
  const [playerDeck, setPlayerDeck] = useState<ProblemCard[]>([]);
  const [pcDeck, setPcDeck] = useState<ProblemCard[]>([]);
  const [playerHand, setPlayerHand] = useState<ProblemCard[]>([]);
  const [pcHand, setPcHand] = useState<ProblemCard[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [pcScore, setPcScore] = useState(0);
  const [playerPlayedCard, setPlayerPlayedCard] = useState<ProblemCard | null>(null);
  const [pcPlayedCard, setPcPlayedCard] = useState<ProblemCard | null>(null);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<string | null>(null);
  const [playerAnswered, setPlayerAnswered] = useState(false);
  const [pcAnswered, setPcAnswered] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(0);

  const addLog = useCallback((message: string) => {
    setGameLog(prev => [...prev.slice(-10), message]);
  }, []);

  const expForNextLevel = useCallback((level: number) => 100 + (level - 1) * 50, []);

  const addExp = useCallback((amount: number) => {
    let currentExp = playerExp + amount;
    let currentLevel = playerLevel;
    let totalMpReward = 0;
    while (currentExp >= expForNextLevel(currentLevel)) {
      currentExp -= expForNextLevel(currentLevel);
      currentLevel++;
      totalMpReward += currentLevel * 100;
    }
    if (currentLevel > playerLevel) {
      let newlyAcquiredCard: ProblemCard | null = null;
      const unownedCards = CARD_DEFINITIONS.filter(card => !ownedCardIds.has(card.id));
      if (unownedCards.length > 0) {
        newlyAcquiredCard = shuffleDeck(unownedCards)[0];
        setOwnedCardIds(prev => new Set(prev).add(newlyAcquiredCard!.id));
      } else { totalMpReward += 500; }
      setMathPoints(prev => prev + totalMpReward);
      setLevelUpInfo({ oldLevel: playerLevel, newLevel: currentLevel, mpReward: totalMpReward, newCard: newlyAcquiredCard });
      setPlayerLevel(currentLevel);
    }
    setPlayerExp(currentExp);
  }, [playerLevel, playerExp, expForNextLevel, ownedCardIds]);

  const startGame = useCallback((playerDeckSetup: ProblemCard[]) => {
    const pcDeckSetup = shuffleDeck([...CARD_DEFINITIONS]).slice(0, DECK_SIZE);
    const shuffledPlayerDeck = shuffleDeck(playerDeckSetup);
    const shuffledPcDeck = shuffleDeck(pcDeckSetup);
    setPlayerHand(shuffledPlayerDeck.slice(0, HAND_SIZE));
    setPlayerDeck(shuffledPlayerDeck.slice(HAND_SIZE));
    setPcHand(shuffledPcDeck.slice(0, HAND_SIZE));
    setPcDeck(shuffledPcDeck.slice(HAND_SIZE));
    setPlayerScore(0); setPcScore(0);
    setWinner(null);
    setRoundResult(null);
    setPlayerAnswered(false);
    setPcAnswered(false);
    setInitiative(Math.random() > 0.5 ? 'player' : 'pc');
    setTurnPhase('selecting_card');
    setGameState('in_game');
  }, []);

  const handleAutoDraw = useCallback((hand: ProblemCard[], deck: ProblemCard[], targetLevel: number) => {
    const matchingInDeckIdx = deck.findIndex(c => c.difficulty === targetLevel);
    if (matchingInDeckIdx !== -1) {
        const newCard = deck[matchingInDeckIdx];
        const newDeck = [...deck];
        newDeck.splice(matchingInDeckIdx, 1);
        const oldCard = hand[Math.floor(Math.random() * hand.length)];
        const newHand = [...hand.filter(c => c.id !== oldCard.id), newCard];
        newDeck.push(oldCard);
        return { newHand, newDeck, success: true };
    }
    return { newHand: hand, newDeck: deck, success: false };
  }, []);

  const handlePlayerAnswer = (answer: string) => {
    if (playerAnswered || pcAnswered || !pcPlayedCard) return;
    setPlayerAnswered(true);
    
    const solveTime = Date.now() - roundStartTime;
    const normalizedUser = normalizeAnswer(answer);
    const normalizedTarget = normalizeAnswer(pcPlayedCard.problem.answer);

    if (normalizedUser === normalizedTarget) {
      addLog("SYNC_STATUS: Success");
      
      // Update Level-Specific DDA stats
      const diff = pcPlayedCard.difficulty;
      setUserLevelStats(prev => {
          const stats = prev[diff] || { avgTime: 20000, count: 0 };
          return {
              ...prev,
              [diff]: {
                  avgTime: (stats.avgTime * stats.count + solveTime) / (stats.count + 1),
                  count: stats.count + 1
              }
          };
      });

      if (!pcAnswered) {
        let scoreGained = 1;
        if (playerPlayedCard?.ability?.type === 'SCORE_BOOST') scoreGained += playerPlayedCard.ability.value || 1;
        setPlayerScore(s => s + scoreGained);
        setRoundResult("== ROUND_VICTORY ==");
      }
      setTurnPhase('round_end');
    } else {
      addLog("SYNC_STATUS: Failed");
      if (!pcAnswered) {
         if (playerPlayedCard?.ability?.type === 'DEFENSIVE_STANCE') {
           addLog("[DEF_STANCE] Active - Shield Depleted");
         } else {
           setPcScore(s => s + 1);
         }
         setRoundResult(">> ROUND_DEFEAT <<");
      }
      setPcAnswered(true); 
      setTurnPhase('round_end');
    }
  };

  const handleCardClickInHand = (card: ProblemCard) => {
    if (turnPhase !== 'selecting_card') return;
    if (initiative === 'pc' && pcPlayedCard !== null) {
        if (card.difficulty !== pcPlayedCard.difficulty) {
            addLog("LEVEL_MISMATCH: Must match protocol level.");
            return;
        }
    }
    if (selectedCardId === card.id) {
        setPlayerPlayedCard(card);
        setPlayerHand(prev => prev.filter(c => c.id !== card.id));
        if (initiative === 'player') {
            let pcMatchingCard = pcHand.find(c => c.difficulty === card.difficulty);
            if (!pcMatchingCard) {
                const res = handleAutoDraw(pcHand, pcDeck, card.difficulty);
                if (res.success) {
                    addLog("PC: RE-DRAWIING MODULE...");
                    setPcHand(res.newHand);
                    setPcDeck(res.newDeck);
                    pcMatchingCard = res.newHand.find(c => c.difficulty === card.difficulty);
                }
            }
            const pcCardToPlay = pcMatchingCard || pcHand[Math.floor(Math.random() * pcHand.length)];
            setPcPlayedCard(pcCardToPlay);
            setPcHand(prev => prev.filter(c => c.id !== pcCardToPlay.id));
            setTurnPhase('solving_problem');
            setRoundStartTime(Date.now());
        } else {
            setTurnPhase('solving_problem');
            setRoundStartTime(Date.now());
        }
    } else { setSelectedCardId(card.id); }
  };

  useEffect(() => {
      if (gameState === 'in_game' && turnPhase === 'selecting_card' && initiative === 'pc' && pcPlayedCard === null) {
          const timer = setTimeout(() => {
              const pcCard = pcHand[Math.floor(Math.random() * pcHand.length)];
              setPcPlayedCard(pcCard);
              setPcHand(prev => prev.filter(c => c.id !== pcCard.id));
              addLog("PC: INITIATING PROTOCOL LEVEL " + pcCard.difficulty);
              const hasMatch = playerHand.some(c => c.difficulty === pcCard.difficulty);
              if (!hasMatch) {
                  const res = handleAutoDraw(playerHand, playerDeck, pcCard.difficulty);
                  if (res.success) {
                      addLog("SYNC_ERROR: RE-DRAWING YOUR MODULE...");
                      setPlayerHand(res.newHand);
                      setPlayerDeck(res.newDeck);
                  }
              }
          }, 1500);
          return () => clearTimeout(timer);
      }
  }, [gameState, turnPhase, initiative, pcPlayedCard, pcHand, playerHand, playerDeck, handleAutoDraw, addLog]);
  
  useEffect(() => {
    if (turnPhase !== 'solving_problem' || pcAnswered || !pcPlayedCard) return;
    
    // Level-Aware DDA: Use the user's average for THIS difficulty level
    const diff = pcPlayedCard.difficulty;
    const stats = userLevelStats[diff] || { avgTime: diff * 12000, count: 0 };
    
    // If user hasn't played this level enough, use a default scaling
    const baseTime = stats.count > 2 ? stats.avgTime : (diff * 12000);
    
    // PC answer speed = User Avg * 1.25 (give user a slight edge)
    // Applying ability constraints (TIME_PRESSURE)
    let finalTime = baseTime * 1.25;
    if (pcPlayedCard.ability?.type === 'TIME_PRESSURE') finalTime -= (pcPlayedCard.ability.value || 3) * 1000;

    const solveTime = Math.max(3000, Math.min(120000, finalTime));

    const timer = setTimeout(() => {
        if (!playerAnswered) {
            if (playerPlayedCard?.ability?.type !== 'DEFENSIVE_STANCE') setPcScore(s => s + 1);
            setRoundResult(">> ROUND_DEFEAT <<");
            setTurnPhase('round_end');
        }
        setPcAnswered(true);
    }, solveTime);
    return () => clearTimeout(timer);
  }, [turnPhase, pcAnswered, playerAnswered, pcPlayedCard, playerPlayedCard, userLevelStats]);

  useEffect(() => {
    if (turnPhase !== 'round_end') return;
    const timer = setTimeout(() => {
      if (playerScore >= MAX_SCORE) {
        setWinner("PLAYER_LINK_ESTABLISHED\nMISSION_COMPLETE");
        addExp(500);
        setMathPoints(p => p + 300);
        setGameState('end');
        return;
      } else if (pcScore >= MAX_SCORE) {
        setWinner("NETWORK_BREACH_DETECTED\nTERMINATED");
        addExp(100);
        setGameState('end');
        return;
      }
      const isPlayerDefeated = roundResult?.includes('DEFEAT');
      setInitiative(isPlayerDefeated ? 'player' : 'pc');
      setPlayerHand(prev => {
        const needed = HAND_SIZE - prev.length;
        if (needed <= 0 || playerDeck.length === 0) return prev;
        const newCards = playerDeck.slice(0, needed);
        setPlayerDeck(d => d.slice(needed));
        return [...prev, ...newCards];
      });
      setPcHand(prev => {
        const needed = HAND_SIZE - prev.length;
        if (needed <= 0 || pcDeck.length === 0) return prev;
        const newCards = pcDeck.slice(0, needed);
        setPcDeck(d => d.slice(needed));
        return [...prev, ...newCards];
      });
      setPlayerPlayedCard(null);
      setPcPlayedCard(null);
      setRoundResult(null);
      setPlayerAnswered(false);
      setPcAnswered(false);
      setSelectedCardId(null);
      setTurnPhase('selecting_card');
    }, 3000);
    return () => clearTimeout(timer);
  }, [turnPhase, playerScore, pcScore, playerDeck, pcDeck, addExp, roundResult, setMathPoints]);

  const renderContent = () => {
    switch (gameState) {
      case 'main_menu': return <MainMenu onSelectMode={(mode) => setGameState(mode)} playerLevel={playerLevel} playerExp={playerExp} expForNextLevel={expForNextLevel(playerLevel)} />;
      case 'practice_mode': return <PracticeMode onSessionComplete={(pts) => {setMathPoints(p => p + pts); setGameState('main_menu');}} />;
      case 'deck_building': return <DeckBuilder ownedCards={ownedCards} onDeckSubmit={startGame} onBack={() => setGameState('main_menu')} />;
      case 'card_shop': return <CardShop mathPoints={mathPoints} onBuyPack={(m, c, t) => {
          const cards = CARD_DEFINITIONS.filter(card => !ownedCardIds.has(card.id) && card.mainCategory === m);
          if (mathPoints < c || cards.length === 0) return cards.length === 0 ? [] : null;
          const newCards = [...cards].sort(() => Math.random() - 0.5).slice(0, 3);
          setMathPoints(p => p - c);
          setOwnedCardIds(prev => {
            const next = new Set(prev);
            newCards.forEach(card => next.add(card.id));
            return next;
          });
          return newCards;
        }} onExit={() => setGameState('main_menu')} />;
      case 'in_game': return <GameBoard turnPhase={turnPhase} playerScore={playerScore} pcScore={pcScore} playerHand={playerHand} pcHandSize={pcHand.length} playerDeckSize={playerDeck.length} pcDeckSize={pcDeck.length} playerPlayedCard={playerPlayedCard} pcPlayedCard={pcPlayedCard} onCardSelect={handleCardClickInHand} onAnswerSubmit={handlePlayerAnswer} selectedCardId={selectedCardId} gameLog={gameLog} roundResult={roundResult} maxScore={MAX_SCORE} initiative={initiative} />;
      case 'end': return (
        <div className="text-center flex flex-col items-center justify-center h-full animate-level-up-reveal">
          <h1 className="text-7xl font-bold text-hologram mb-4 whitespace-pre-line uppercase tracking-widest leading-tight">{winner}</h1>
          <button onClick={() => setGameState('main_menu')} className="mt-12 btn-tactical py-4 px-12 rounded-lg text-2xl tracking-[0.4em]">DISCONNECT</button>
        </div>
      );
    }
  };

  return (
    <main className="w-screen h-screen relative flex flex-col items-center justify-center font-sans">
      <GravityBackground />
      <div className="relative z-10 w-full h-full">
        {renderContent()}
        {levelUpInfo && <LevelUpModal {...levelUpInfo} onClose={() => setLevelUpInfo(null)} />}
      </div>
    </main>
  );
};

export default App;
