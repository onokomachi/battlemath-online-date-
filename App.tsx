/**
 * App.tsx - BattleMath Online v3.0
 *
 * 統合機能:
 *  - Firebase Authentication (Google OAuth + Guest)  [エビデンスA: Firebase公式パターン]
 *  - HP制カードバトル (aicardbattle2より移植)        [エビデンスB: 標準カードゲーム設計]
 *  - PvP マルチプレイヤー (Firestore リアルタイム)   [エビデンスA: Firebase onSnapshot]
 *  - ランキングボード                               [エビデンスA: Firestore query/orderBy]
 *  - 管理画面 (GameMaster)                          [エビデンスB: RBAC管理UI設計]
 *  - DDA (Dynamic Difficulty Adjustment)            [エビデンスB: ゲームAI適応設計]
 */
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut,
  type User
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, updateDoc, increment, arrayUnion,
  collection, onSnapshot, query, addDoc, serverTimestamp,
  runTransaction, where, orderBy, limit, Timestamp, deleteDoc
} from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import type { ProblemCard, TurnPhase, GameState, TurnInitiative, Room, BattleMode } from './types';
import {
  CARD_DEFINITIONS, HAND_SIZE, DECK_SIZE,
  INITIAL_HP, calcDamage, ADMIN_EMAILS, GAMEMASTER_PASSWORD
} from './constants';
import GameBoard from './components/GameBoard';
import DeckBuilder from './components/DeckBuilder';
import MainMenu from './components/MainMenu';
import PracticeMode from './components/PracticeMode';
import CardShop from './components/CardShop';
import LevelUpModal from './components/LevelUpModal';
import GravityBackground from './components/GravityBackground';
import LoginScreen from './components/LoginScreen';
import Matchmaking from './components/Matchmaking';
import RankingBoard from './components/RankingBoard';
import GameMaster from './components/GameMaster';

// ============================
// Helpers
// ============================
const shuffleDeck = (deck: ProblemCard[]): ProblemCard[] =>
  [...deck].sort(() => Math.random() - 0.5);

const SUPERSCRIPT_MAP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻', 'n': 'ⁿ', 'm': 'ᵐ' };

const normalizeAnswer = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, '')
    .replace(/[°度円枚個m分]/g, '')
    .replace(/＝/g, '=')
    .replace(/／/g, '/')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/\^([0-9+\-nm]+)/g, (_, digits: string) => digits.split('').map(c => SUPERSCRIPT_MAP[c] || c).join(''))
    .replace(/pi/gi, 'π')
    .replace(/0\.5x/g, '1/2x')
    .replace(/([+-])0\.5x/g, '$11/2x')
    .toLowerCase();
};

// ============================
// App Component
// ============================
const App: React.FC = () => {
  // --- Auth ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>('login_screen');
  const [gameMode, setGameMode] = useState<BattleMode>('cpu');
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('selecting_card');
  const [initiative, setInitiative] = useState<TurnInitiative>('player');

  // --- Player Progression (synced to Firestore when logged in) ---
  const [mathPoints, setMathPoints] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem('battleMathPoints') || '1000'); }
    catch { return 1000; }
  });
  const [ownedCardIds, setOwnedCardIds] = useState<Set<number>>(() => {
    try {
      const s = localStorage.getItem('battleMathOwnedCardIds');
      if (s) return new Set(JSON.parse(s));
    } catch {}
    return new Set(CARD_DEFINITIONS.slice(0, 20).map(c => c.id));
  });
  const [playerLevel, setPlayerLevel] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem('battleMathPlayerLevel') || '1'); }
    catch { return 1; }
  });
  const [playerExp, setPlayerExp] = useState<number>(() => {
    try { return JSON.parse(localStorage.getItem('battleMathPlayerExp') || '0'); }
    catch { return 0; }
  });
  const [userLevelStats, setUserLevelStats] = useState<Record<number, { avgTime: number; count: number }>>(() => {
    try {
      const s = localStorage.getItem('battleMathUserLevelStats');
      return s ? JSON.parse(s) : {
        1: { avgTime: 5000, count: 0 }, 2: { avgTime: 10000, count: 0 },
        3: { avgTime: 20000, count: 0 }, 4: { avgTime: 40000, count: 0 },
        5: { avgTime: 60000, count: 0 }
      };
    } catch { return { 1: { avgTime: 5000, count: 0 }, 2: { avgTime: 10000, count: 0 }, 3: { avgTime: 20000, count: 0 }, 4: { avgTime: 40000, count: 0 }, 5: { avgTime: 60000, count: 0 } }; }
  });
  const [levelUpInfo, setLevelUpInfo] = useState<{
    oldLevel: number; newLevel: number; mpReward: number; newCard: ProblemCard | null;
  } | null>(null);

  // --- Battle State ---
  const [playerDeck, setPlayerDeck] = useState<ProblemCard[]>([]);
  const [pcDeck, setPcDeck] = useState<ProblemCard[]>([]);
  const [playerHand, setPlayerHand] = useState<ProblemCard[]>([]);
  const [pcHand, setPcHand] = useState<ProblemCard[]>([]);
  const [playerHP, setPlayerHP] = useState(INITIAL_HP);
  const [pcHP, setPcHP] = useState(INITIAL_HP);
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

  // --- PvP State ---
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const unsubscribeRoomRef = useRef<(() => void) | null>(null);
  const isHostRef = useRef(isHost);
  const processedMatchIdRef = useRef<string | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const gameModeRef = useRef<BattleMode>('cpu');

  // --- UI Overlays ---
  const [showRanking, setShowRanking] = useState(false);

  // Sync refs
  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { currentRoomIdRef.current = currentRoomId; }, [currentRoomId]);
  useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);

  // ============================
  // localStorage sync
  // ============================
  useEffect(() => {
    localStorage.setItem('battleMathPoints', JSON.stringify(mathPoints));
    localStorage.setItem('battleMathOwnedCardIds', JSON.stringify(Array.from(ownedCardIds)));
    localStorage.setItem('battleMathPlayerLevel', JSON.stringify(playerLevel));
    localStorage.setItem('battleMathPlayerExp', JSON.stringify(playerExp));
    localStorage.setItem('battleMathUserLevelStats', JSON.stringify(userLevelStats));
  }, [mathPoints, ownedCardIds, playerLevel, playerExp, userLevelStats]);

  const ownedCards = useMemo(
    () => CARD_DEFINITIONS.filter(c => ownedCardIds.has(c.id)),
    [ownedCardIds]
  );

  // ============================
  // Firebase Auth
  // ============================
  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }

    // Handle redirect result (for mobile/popup-blocked environments)
    getRedirectResult(auth).catch((e) => {
      console.warn('Redirect result check:', e);
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u && db) {
        // Sync user data from Firestore
        const ref = doc(db, 'users', u.uid);
        try {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const d = snap.data();
            if (d.mathPoints !== undefined) setMathPoints(d.mathPoints);
            if (d.playerLevel !== undefined) setPlayerLevel(d.playerLevel);
            if (d.playerExp !== undefined) setPlayerExp(d.playerExp);
            if (d.ownedCardIds) setOwnedCardIds(new Set(d.ownedCardIds));
          } else {
            // First login: initialize user doc
            await setDoc(ref, {
              uid: u.uid,
              displayName: u.displayName,
              email: u.email,
              photoURL: u.photoURL,
              mathPoints,
              playerLevel,
              playerExp,
              totalWins: 0,
              totalMatches: 0,
              ownedCardIds: Array.from(ownedCardIds),
              createdAt: serverTimestamp(),
            });
          }
        } catch (e) { console.error('User sync error:', e); }
      }
    });
    return () => unsub();
  }, []);

  const saveUserToFirestore = useCallback(async (updates: Record<string, any>) => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
    } catch (e) { console.error('Firestore update error:', e); }
  }, [user]);

  // ============================
  // Auth Handlers
  // ============================
  const handleLogin = async () => {
    if (!auth || !googleProvider) {
      console.error('Firebase auth not initialized. auth:', !!auth, 'provider:', !!googleProvider);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.warn('Popup login failed, trying redirect:', e?.code || e);
      // Fallback to redirect for mobile/popup-blocked environments
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/popup-closed-by-user' || e?.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('Redirect login also failed:', redirectError);
        }
      }
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await leaveRoom(currentRoomId, isHost);
      await signOut(auth);
      setGameState('login_screen');
      cleanupGameSession();
    } catch (e) { console.error('Logout failed:', e); }
  };

  const handleGuestPlay = () => {
    setGameState('main_menu');
  };

  const canAccessGameMaster = useMemo(() => {
    if (ADMIN_EMAILS.length === 0) return !!user;
    return user && user.email && ADMIN_EMAILS.includes(user.email);
  }, [user]);

  const handleOpenGameMaster = () => {
    const pass = window.prompt('Game Master パスワードを入力:');
    if (pass === GAMEMASTER_PASSWORD) setGameState('gamemaster');
  };

  // ============================
  // Progression
  // ============================
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
      let newCard: ProblemCard | null = null;
      const unowned = CARD_DEFINITIONS.filter(c => !ownedCardIds.has(c.id));
      if (unowned.length > 0) {
        newCard = shuffleDeck(unowned)[0];
        setOwnedCardIds(prev => new Set(prev).add(newCard!.id));
      } else {
        totalMpReward += 500;
      }
      setMathPoints(p => p + totalMpReward);
      setLevelUpInfo({ oldLevel: playerLevel, newLevel: currentLevel, mpReward: totalMpReward, newCard });
      setPlayerLevel(currentLevel);
      saveUserToFirestore({ playerLevel: currentLevel, mathPoints: mathPoints + totalMpReward });
    }
    setPlayerExp(currentExp);
    saveUserToFirestore({ playerExp: currentExp });
  }, [playerLevel, playerExp, expForNextLevel, ownedCardIds, mathPoints, saveUserToFirestore]);

  // ============================
  // Room / PvP watch
  // ============================
  // エビデンスA: Firestore query最適化 - finishedルームを除外
  useEffect(() => {
    if (gameState !== 'matchmaking' || !db) return;
    const q = query(
      collection(db, 'rooms'),
      where('status', 'in', ['waiting', 'playing']),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, snap => {
      const list: Room[] = [];
      const now = Date.now();
      snap.forEach(d => {
        const data = d.data() as Room;
        if (!data.roomId) data.roomId = d.id;
        // クライアント側: 10分以上前のwaitingルームをフィルタ（ゾンビ除去）
        if (data.status === 'waiting' && data.createdAt) {
          const createdMs = data.createdAt.toDate ? data.createdAt.toDate().getTime() : 0;
          if (createdMs > 0 && now - createdMs > 10 * 60 * 1000) {
            // 古いwaitingルームを自動クリーンアップ
            updateDoc(doc(db, 'rooms', d.id), { status: 'finished', winnerId: 'abandoned' }).catch(() => {});
            return;
          }
        }
        list.push(data);
      });
      setRooms(list);
    });
  }, [gameState]);

  // エビデンスA: Firebase公式 - ドキュメントライフサイクル管理
  // ルーム離脱時にFirestoreステータスを更新し、ゾンビルームを防止
  const leaveRoom = useCallback(async (roomId: string | null, wasHost: boolean) => {
    if (!roomId || !db) return;
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const snap = await getDoc(roomRef);
      if (!snap.exists()) return;
      const data = snap.data() as Room;
      if (data.status === 'finished') return;
      if (data.status === 'waiting' && wasHost) {
        // ホストが待機中に離脱 → ルームを終了
        await updateDoc(roomRef, { status: 'finished', winnerId: 'abandoned' });
      } else if (data.status === 'playing') {
        // 対戦中に離脱 → 相手の勝利
        await updateDoc(roomRef, {
          status: 'finished',
          winnerId: wasHost ? 'guest' : 'host',
        });
      }
    } catch (e) { console.error('leaveRoom error:', e); }
  }, []);

  const cleanupGameSession = useCallback((keepConn = false) => {
    if (!keepConn) {
      if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
      setCurrentRoomId(null);
      setIsHost(false);
      setOpponentDisconnected(false);
    }
    processedMatchIdRef.current = null;
    setWinner(null);
    setPlayerPlayedCard(null);
    setPcPlayedCard(null);
    setTurnPhase('selecting_card');
  }, []);

  // エビデンスA: MDN beforeunload + visibilitychange
  // ブラウザ閉じ/タブ閉じ時にルームをクリーンアップ
  useEffect(() => {
    const handleBeforeUnload = () => {
      const rid = currentRoomIdRef.current;
      if (!rid || !db) return;
      // sendBeacon で非同期的にクリーンアップ（信頼性は低いが最善策）
      // Firestore REST APIへのbeaconは複雑なため、updateDocを試みる
      const roomRef = doc(db, 'rooms', rid);
      updateDoc(roomRef, {
        status: 'finished',
        winnerId: isHostRef.current ? 'guest' : 'host',
      }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const listenToRoom = (roomId: string) => {
    if (!db) return;
    if (unsubscribeRoomRef.current) unsubscribeRoomRef.current();
    unsubscribeRoomRef.current = onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (!snap.exists()) {
        // ルームが削除された場合
        setOpponentDisconnected(true);
        return;
      }
      const data = snap.data() as Room;
      const isHostVal = isHostRef.current;

      // エビデンスB: 相手の切断検知（lastActiveが90秒以上古い場合）
      if (data.status === 'playing') {
        const opponentLastActive = isHostVal ? data.guestLastActive : data.hostLastActive;
        if (opponentLastActive) {
          const lastActiveMs = opponentLastActive.toDate ? opponentLastActive.toDate().getTime() : 0;
          const staleThreshold = 90000; // 90秒
          if (lastActiveMs > 0 && Date.now() - lastActiveMs > staleThreshold) {
            setOpponentDisconnected(true);
          } else {
            setOpponentDisconnected(false);
          }
        }
      }

      // ルームが外部要因で finished になった場合（相手離脱・管理者終了等）
      if (data.status === 'finished' && data.winnerId === 'abandoned') {
        cleanupGameSession();
        setGameState('deck_building');
        return;
      }

      if (data.status === 'playing' && gameState === 'matchmaking') {
        setCurrentRound(1);
        processedMatchIdRef.current = null;
        setTimeout(() => {
          startGame(playerDeck, false, data);
          setGameState('in_game');
        }, 500);
      }

      if (gameState === 'in_game') {
        setPlayerHP(isHostVal ? data.p1Hp : data.p2Hp);
        setPcHP(isHostVal ? data.p2Hp : data.p1Hp);

        if (data.winnerId && processedMatchIdRef.current !== roomId) {
          processedMatchIdRef.current = roomId;
          const isWinner = (data.winnerId === 'host' && isHostVal) || (data.winnerId === 'guest' && !isHostVal);
          const isAbandoned = data.winnerId === 'abandoned' || data.winnerId === 'admin_terminated';
          if (isAbandoned) {
            setWinner('中断されました');
          } else {
            setWinner(data.winnerId === 'draw' ? '引き分け' : isWinner ? 'VICTORY' : 'DEFEAT');
          }
          if (isWinner && !isAbandoned) {
            addExp(500);
            setMathPoints(p => p + 300);
            saveUserToFirestore({ totalWins: increment(1), totalMatches: increment(1) });
          } else if (!isAbandoned) {
            addExp(100);
            saveUserToFirestore({ totalMatches: increment(1) });
          }
          setGameState('end');
        }
      }
    });
  };

  const handleJoinRoom = async (roomId: string) => {
    if (!user || !db) {
      alert('PvP対戦にはログインが必要です');
      return;
    }
    cleanupGameSession(false);
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const uid = user.uid.trim();
      const result = await runTransaction(db, async (tx) => {
        const roomDoc = await tx.get(roomRef);
        const base = {
          roomId, status: 'waiting', hostId: uid,
          hostName: user.displayName || 'Player',
          guestId: null, guestName: null,
          createdAt: serverTimestamp(), hostLastActive: serverTimestamp(),
          guestLastActive: null, hostReady: true, guestReady: false,
          round: 1, p1Move: null, p2Move: null,
          p1Hp: INITIAL_HP, p2Hp: INITIAL_HP, winnerId: null
        };
        if (!roomDoc.exists() || (roomDoc.data() as Room).status === 'finished') {
          tx.set(roomRef, base);
          return 'host';
        }
        const d = roomDoc.data() as Room;
        if ((d.hostId || '').trim() === uid) return 'host';
        if ((d.guestId || '').trim() === uid) return 'guest';
        if (d.status === 'waiting') {
          tx.update(roomRef, {
            status: 'playing', guestId: uid,
            guestName: user.displayName || 'Player',
            guestReady: true, guestLastActive: serverTimestamp()
          });
          return 'guest';
        }
        throw new Error('ROOM_FULL');
      });
      setIsHost(result === 'host');
      setCurrentRoomId(roomId);
    } catch (e: any) {
      if (e.message === 'ROOM_FULL') alert('この部屋は満員です。');
      else alert('入室エラーが発生しました。');
    }
  };

  useEffect(() => { if (currentRoomId) listenToRoom(currentRoomId); }, [currentRoomId]);

  // エビデンスB: ハートビートパターン - 30秒ごとにlastActiveを更新
  useEffect(() => {
    if (!currentRoomId || !db || !user) return;
    const field = isHostRef.current ? 'hostLastActive' : 'guestLastActive';
    const interval = setInterval(() => {
      updateDoc(doc(db, 'rooms', currentRoomId), {
        [field]: serverTimestamp(),
      }).catch(() => {});
    }, 30000);
    // 初回も即時更新
    updateDoc(doc(db, 'rooms', currentRoomId), {
      [field]: serverTimestamp(),
    }).catch(() => {});
    return () => clearInterval(interval);
  }, [currentRoomId, user]);

  // ============================
  // Game Start
  // ============================
  const startGame = useCallback((playerDeckSetup: ProblemCard[], isCpu: boolean, roomData?: Room) => {
    cleanupGameSession(true);
    const pcDeckSetup = shuffleDeck([...CARD_DEFINITIONS]).slice(0, DECK_SIZE);
    const shuffledP = shuffleDeck(playerDeckSetup);
    const shuffledC = shuffleDeck(pcDeckSetup);
    setPlayerHand(shuffledP.slice(0, HAND_SIZE));
    setPlayerDeck(shuffledP.slice(HAND_SIZE));
    setPcHand(shuffledC.slice(0, HAND_SIZE));
    setPcDeck(shuffledC.slice(HAND_SIZE));
    if (roomData) {
      setPlayerHP(isHostRef.current ? roomData.p1Hp : roomData.p2Hp);
      setPcHP(isHostRef.current ? roomData.p2Hp : roomData.p1Hp);
    } else {
      setPlayerHP(INITIAL_HP);
      setPcHP(INITIAL_HP);
    }
    setPlayerScore(0);
    setPcScore(0);
    setWinner(null);
    setRoundResult(null);
    setPlayerAnswered(false);
    setPcAnswered(false);
    setInitiative(Math.random() > 0.5 ? 'player' : 'pc');
    setTurnPhase('selecting_card');
    setGameLog(['バトル開始！問題に答えてダメージを与えよう！']);
  }, [cleanupGameSession]);

  // ============================
  // Auto-draw helper
  // ============================
  const handleAutoDraw = useCallback((
    hand: ProblemCard[], deck: ProblemCard[], targetLevel: number
  ) => {
    const idx = deck.findIndex(c => c.difficulty === targetLevel);
    if (idx !== -1) {
      const newCard = deck[idx];
      const newDeck = [...deck];
      newDeck.splice(idx, 1);
      const oldCard = hand[Math.floor(Math.random() * hand.length)];
      const newHand = [...hand.filter(c => c.id !== oldCard.id), newCard];
      newDeck.push(oldCard);
      return { newHand, newDeck, success: true };
    }
    return { newHand: hand, newDeck: deck, success: false };
  }, []);

  // ============================
  // HP Battle Resolution
  // エビデンスB: ATK/DEF + 正解ダメージ統合設計
  // ============================
  const resolveHpBattle = useCallback((
    playerCorrect: boolean,
    playerCard: ProblemCard,
    pcCard: ProblemCard
  ) => {
    // Damage formula: difficulty × 2 HP
    // SCORE_BOOST: +2 bonus damage on correct answer
    // DEFENSIVE_STANCE: block damage when wrong
    if (playerCorrect) {
      let dmg = calcDamage(playerCard.difficulty);
      if (playerCard.ability?.type === 'SCORE_BOOST') dmg += (playerCard.ability.value || 1) * 2;
      addLog(`正解！${pcCard.problem.data.question?.slice(0, 20)}... → ${dmg}ダメージ！`);
      setPcHP(prev => Math.max(0, prev - dmg));
      setPlayerScore(s => s + 1);
      return 'player_win';
    } else {
      if (playerCard.ability?.type === 'DEFENSIVE_STANCE') {
        addLog(`不正解 [防御スタンス] ダメージをガード！`);
        return 'defended';
      }
      const dmg = calcDamage(pcCard.difficulty);
      addLog(`不正解… ${dmg}ダメージを受けた`);
      setPlayerHP(prev => Math.max(0, prev - dmg));
      setPcScore(s => s + 1);
      return 'pc_win';
    }
  }, []);

  const addLog = useCallback((msg: string) => {
    setGameLog(prev => [...prev.slice(-10), msg]);
  }, []);

  // ============================
  // Player Answer Handler
  // ============================
  const handlePlayerAnswer = (answer: string) => {
    if (playerAnswered || pcAnswered || !pcPlayedCard || !playerPlayedCard) return;
    setPlayerAnswered(true);
    const solveTime = Date.now() - roundStartTime;
    const correct = normalizeAnswer(answer) === normalizeAnswer(pcPlayedCard.problem.answer);

    if (correct) {
      // Update DDA stats
      const diff = pcPlayedCard.difficulty;
      setUserLevelStats(prev => {
        const s = prev[diff] || { avgTime: 20000, count: 0 };
        return { ...prev, [diff]: { avgTime: (s.avgTime * s.count + solveTime) / (s.count + 1), count: s.count + 1 } };
      });
    }

    const outcome = resolveHpBattle(correct, playerPlayedCard, pcPlayedCard);
    setRoundResult(outcome === 'player_win' ? '== ROUND_VICTORY ==' : '>> ROUND_DEFEAT <<');
    if (!pcAnswered) setPcAnswered(true);
    setTurnPhase('round_end');
  };

  // ============================
  // Card Selection
  // ============================
  const handleCardClickInHand = (card: ProblemCard) => {
    if (turnPhase !== 'selecting_card') return;
    if (initiative === 'pc' && pcPlayedCard !== null) {
      if (card.difficulty !== pcPlayedCard.difficulty) {
        addLog('LEVEL_MISMATCH: 相手のレベルに合わせてください');
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
            addLog('PC: カードを引き直しています...');
            setPcHand(res.newHand);
            setPcDeck(res.newDeck);
            pcMatchingCard = res.newHand.find(c => c.difficulty === card.difficulty);
          }
        }
        const pcCard = pcMatchingCard || pcHand[Math.floor(Math.random() * pcHand.length)];
        setPcPlayedCard(pcCard);
        setPcHand(prev => prev.filter(c => c.id !== pcCard.id));
        setTurnPhase('solving_problem');
        setRoundStartTime(Date.now());
      } else {
        setTurnPhase('solving_problem');
        setRoundStartTime(Date.now());
      }
    } else {
      setSelectedCardId(card.id);
    }
  };

  // ============================
  // PC Initiative
  // ============================
  useEffect(() => {
    if (gameState !== 'in_game' || turnPhase !== 'selecting_card' || initiative !== 'pc' || pcPlayedCard !== null) return;
    const timer = setTimeout(() => {
      const pcCard = pcHand[Math.floor(Math.random() * pcHand.length)];
      if (!pcCard) return;
      setPcPlayedCard(pcCard);
      setPcHand(prev => prev.filter(c => c.id !== pcCard.id));
      addLog(`PC: レベル${pcCard.difficulty} の問題を出題`);
      const hasMatch = playerHand.some(c => c.difficulty === pcCard.difficulty);
      if (!hasMatch) {
        const res = handleAutoDraw(playerHand, playerDeck, pcCard.difficulty);
        if (res.success) {
          addLog('カードを自動補充しました');
          setPlayerHand(res.newHand);
          setPlayerDeck(res.newDeck);
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [gameState, turnPhase, initiative, pcPlayedCard, pcHand, playerHand, playerDeck, handleAutoDraw, addLog]);

  // ============================
  // PC Solve Timer (DDA)
  // エビデンスB: Dynamic Difficulty Adjustment
  // ============================
  useEffect(() => {
    if (turnPhase !== 'solving_problem' || pcAnswered || !pcPlayedCard) return;
    const diff = pcPlayedCard.difficulty;
    const stats = userLevelStats[diff] || { avgTime: diff * 12000, count: 0 };
    const baseTime = stats.count > 2 ? stats.avgTime : diff * 12000;
    let finalTime = baseTime * 1.25;
    if (pcPlayedCard.ability?.type === 'TIME_PRESSURE') finalTime -= (pcPlayedCard.ability.value || 3) * 1000;
    const solveTime = Math.max(3000, Math.min(120000, finalTime));

    const timer = setTimeout(() => {
      if (!playerAnswered) {
        if (playerPlayedCard?.ability?.type !== 'DEFENSIVE_STANCE') {
          const dmg = calcDamage(pcPlayedCard.difficulty);
          setPlayerHP(prev => Math.max(0, prev - dmg));
          addLog(`時間切れ！${dmg}ダメージを受けた`);
          setPcScore(s => s + 1);
        }
        setRoundResult('>> ROUND_DEFEAT <<');
        setTurnPhase('round_end');
      }
      setPcAnswered(true);
    }, solveTime);
    return () => clearTimeout(timer);
  }, [turnPhase, pcAnswered, playerAnswered, pcPlayedCard, playerPlayedCard, userLevelStats]);

  // ============================
  // Round End / HP Win Check
  // ============================
  useEffect(() => {
    if (turnPhase !== 'round_end') return;
    const timer = setTimeout(async () => {
      // HP win condition
      if (playerHP <= 0 || pcHP <= 0) {
        const isWin = pcHP <= 0 && playerHP > 0;
        const isDraw = pcHP <= 0 && playerHP <= 0;
        if (isDraw) {
          setWinner('DRAW\nHONORABLE BATTLE');
          addExp(200);
        } else if (isWin) {
          setWinner('VICTORY\nMISSION COMPLETE');
          addExp(500);
          setMathPoints(p => p + 300);
          saveUserToFirestore({ totalWins: increment(1), totalMatches: increment(1) });
        } else {
          setWinner('DEFEAT\nSYSTEM TERMINATED');
          addExp(100);
          saveUserToFirestore({ totalMatches: increment(1) });
        }
        setGameState('end');
        return;
      }

      // PvP: update Firestore HP
      if (gameMode === 'pvp' && currentRoomId && db && isHostRef.current) {
        const p1Hp = playerHP;
        const p2Hp = pcHP;
        let wId = p1Hp <= 0 && p2Hp <= 0 ? 'draw' : p1Hp <= 0 ? 'guest' : p2Hp <= 0 ? 'host' : null;
        const updates: any = { p1Hp, p2Hp, p1Move: null, p2Move: null };
        if (wId) { updates.winnerId = wId; updates.status = 'finished'; }
        else { updates.round = increment(1); }
        await updateDoc(doc(db, 'rooms', currentRoomId), updates).catch(console.error);
      }

      // Next round setup
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
  }, [turnPhase, playerHP, pcHP, gameMode, currentRoomId, playerDeck, pcDeck, addExp, roundResult]);

  // ============================
  // Render
  // ============================
  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-950 text-cyan-400 font-mono font-bold tracking-widest">
        CONNECTING...
      </div>
    );
  }

  const renderContent = () => {
    switch (gameState) {
      case 'login_screen':
        return (
          <LoginScreen
            currentUser={user}
            onLogin={handleLogin}
            onGuestPlay={handleGuestPlay}
            onLogout={handleLogout}
            onOpenGameMaster={canAccessGameMaster ? handleOpenGameMaster : undefined}
            mathPoints={mathPoints}
            playerLevel={playerLevel}
          />
        );

      case 'main_menu':
        return (
          <MainMenu
            onSelectMode={mode => setGameState(mode)}
            playerLevel={playerLevel}
            playerExp={playerExp}
            expForNextLevel={expForNextLevel(playerLevel)}
            user={user}
            mathPoints={mathPoints}
            onLogout={handleLogout}
            onOpenRanking={() => setShowRanking(true)}
          />
        );

      case 'practice_mode':
        return (
          <PracticeMode
            onSessionComplete={pts => { setMathPoints(p => p + pts); setGameState('main_menu'); }}
          />
        );

      case 'deck_building':
        return (
          <DeckBuilder
            ownedCards={ownedCards}
            onDeckSubmit={(deck, mode) => {
              const bmode: BattleMode = (mode as string) === 'pvp' ? 'pvp' : 'cpu';
              setGameMode(bmode);
              if (bmode === 'pvp') {
                setGameState('matchmaking');
              } else {
                startGame(deck, true);
                setGameState('in_game');
              }
            }}
            onBack={() => setGameState('main_menu')}
          />
        );

      case 'matchmaking':
        return (
          <Matchmaking
            rooms={rooms}
            onJoinRoom={handleJoinRoom}
            onCancel={async () => {
              await leaveRoom(currentRoomId, isHost);
              cleanupGameSession();
              setGameState('deck_building');
            }}
            currentRoomId={currentRoomId}
            user={user}
          />
        );

      case 'card_shop':
        return (
          <CardShop
            mathPoints={mathPoints}
            onBuyPack={(m, cost, _t) => {
              const cards = CARD_DEFINITIONS.filter(c => !ownedCardIds.has(c.id) && c.mainCategory === m);
              if (mathPoints < cost || cards.length === 0) return cards.length === 0 ? [] : null;
              const newCards = [...cards].sort(() => Math.random() - 0.5).slice(0, 3);
              setMathPoints(p => p - cost);
              setOwnedCardIds(prev => {
                const next = new Set(prev);
                newCards.forEach(c => next.add(c.id));
                return next;
              });
              saveUserToFirestore({
                mathPoints: mathPoints - cost,
                ownedCardIds: arrayUnion(...newCards.map(c => c.id)),
              });
              return newCards;
            }}
            onExit={() => setGameState('main_menu')}
          />
        );

      case 'in_game':
        return (
          <>
            <GameBoard
              turnPhase={turnPhase}
              playerScore={playerScore}
              pcScore={pcScore}
              playerHP={playerHP}
              pcHP={pcHP}
              initialHP={INITIAL_HP}
              playerHand={playerHand}
              pcHandSize={pcHand.length}
              playerDeckSize={playerDeck.length}
              pcDeckSize={pcDeck.length}
              playerPlayedCard={playerPlayedCard}
              pcPlayedCard={pcPlayedCard}
              onCardSelect={handleCardClickInHand}
              onAnswerSubmit={handlePlayerAnswer}
              selectedCardId={selectedCardId}
              gameLog={gameLog}
              roundResult={roundResult}
              maxScore={INITIAL_HP}
              initiative={initiative}
            />
            {/* 相手切断通知バナー */}
            {opponentDisconnected && gameMode === 'pvp' && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 border border-red-500 rounded-xl px-6 py-3 flex items-center gap-4 shadow-2xl">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-200 text-sm font-bold">相手の接続が切れました</span>
                <button
                  onClick={async () => {
                    if (currentRoomId && db) {
                      await updateDoc(doc(db, 'rooms', currentRoomId), {
                        status: 'finished',
                        winnerId: isHost ? 'host' : 'guest',
                      }).catch(() => {});
                    }
                  }}
                  className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                >
                  勝利を宣言
                </button>
              </div>
            )}
          </>
        );

      case 'end':
        return (
          <div className="text-center flex flex-col items-center justify-center h-full animate-level-up-reveal">
            <h1 className="text-7xl font-bold text-hologram mb-4 whitespace-pre-line uppercase tracking-widest leading-tight">
              {winner}
            </h1>
            <div className="flex gap-4 mt-12">
              <button
                onClick={() => { cleanupGameSession(); setGameState('deck_building'); }}
                className="btn-tactical py-4 px-10 rounded-lg text-xl tracking-[0.4em]"
              >
                RETRY
              </button>
              <button
                onClick={() => { cleanupGameSession(); setGameState('main_menu'); }}
                className="border border-gray-600 text-gray-400 hover:text-white py-4 px-10 rounded-lg text-xl tracking-[0.4em] transition-colors"
              >
                MENU
              </button>
            </div>
          </div>
        );

      case 'gamemaster':
        return db ? (
          <GameMaster db={db} onClose={() => setGameState('login_screen')} />
        ) : (
          <div className="text-center text-red-400 p-12">Firebase接続エラー</div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="w-screen h-screen relative flex flex-col items-center justify-center font-sans">
      <GravityBackground />
      <div className="relative z-10 w-full h-full">
        {renderContent()}
        {levelUpInfo && <LevelUpModal {...levelUpInfo} onClose={() => setLevelUpInfo(null)} />}
        {showRanking && db && <RankingBoard onClose={() => setShowRanking(false)} db={db} />}
      </div>
    </main>
  );
};

export default App;
