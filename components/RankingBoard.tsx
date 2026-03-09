import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface RankingEntry {
  id: string;
  displayName: string;
  totalWins: number;
  totalMatches: number;
  playerLevel: number;
  photoURL?: string;
}

interface RankingBoardProps {
  onClose: () => void;
  db: any;
}

const RankingBoard: React.FC<RankingBoardProps> = ({ onClose, db }) => {
  const [entries, setEntries] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) { setIsLoading(false); return; }
    const q = query(collection(db, 'users'), orderBy('totalWins', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const list: RankingEntry[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        list.push({
          id: doc.id,
          displayName: d.displayName || 'Unknown',
          totalWins: d.totalWins || 0,
          totalMatches: d.totalMatches || 0,
          playerLevel: d.playerLevel || 1,
          photoURL: d.photoURL,
        });
      });
      setEntries(list);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [db]);

  const winRate = (wins: number, matches: number) => {
    if (matches === 0) return '--';
    return `${Math.round((wins / matches) * 100)}%`;
  };

  const rankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl hud-panel rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-cyan-900/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-hologram tracking-[0.2em]">RANKING BOARD</h2>
            <p className="text-xs text-cyan-500 font-mono tracking-widest">GLOBAL_LEADERBOARD</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white border border-gray-700 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            閉じる
          </button>
        </div>

        {/* Table */}
        <div className="flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="p-12 text-center text-cyan-400 font-mono animate-pulse">LOADING...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              <p>まだランキングデータがありません</p>
              <p className="text-xs mt-2 text-gray-600">PvP対戦に勝利してランキングに入ろう！</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-900/80 text-gray-400 text-xs sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3">プレイヤー</th>
                  <th className="p-3 text-center">Lv</th>
                  <th className="p-3 text-center">勝利</th>
                  <th className="p-3 text-center">勝率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {entries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={`hover:bg-cyan-900/10 transition-colors ${
                      idx === 0 ? 'bg-amber-900/10' : idx === 1 ? 'bg-gray-700/5' : idx === 2 ? 'bg-amber-900/5' : ''
                    }`}
                  >
                    <td className="p-3 text-center font-bold text-lg">
                      {typeof rankIcon(idx + 1) === 'string' && isNaN(Number(rankIcon(idx + 1))) ? (
                        <span>{rankIcon(idx + 1)}</span>
                      ) : (
                        <span className="text-gray-400 text-sm font-mono">{idx + 1}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {entry.photoURL ? (
                          <img src={entry.photoURL} alt="" className="w-8 h-8 rounded-full border border-cyan-800/50" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-cyan-900/40 border border-cyan-800/50 flex items-center justify-center text-xs text-cyan-400">
                            {entry.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className={`font-bold text-sm ${idx < 3 ? 'text-white' : 'text-gray-300'}`}>
                          {entry.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-cyan-400 font-mono text-sm font-bold">
                      {entry.playerLevel}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-amber-400 font-bold">{entry.totalWins}</span>
                      <span className="text-gray-500 text-xs"> / {entry.totalMatches}戦</span>
                    </td>
                    <td className="p-3 text-center text-sm font-mono text-green-400">
                      {winRate(entry.totalWins, entry.totalMatches)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingBoard;
