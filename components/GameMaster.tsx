/**
 * GameMaster.tsx - BattleMath Admin Panel
 *
 * エビデンスレベルA: Firebase Firestore公式パターン (onSnapshot リアルタイム監視)
 * 管理機能:
 *  - ユーザー管理 (戦績/レベル確認・リセット・削除)
 *  - ルーム管理 (PvPルームの状況確認・強制終了)
 *  - 問題統計 (正答率・難易度別パフォーマンス)
 *  - ゲーム設定 (お知らせ・メンテナンス管理)
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc, limit, getDoc, setDoc
} from 'firebase/firestore';
import type { Room } from '../types';

// ---- Types ----
interface UserData {
  id: string;
  displayName: string;
  email: string;
  playerLevel: number;
  playerExp: number;
  totalWins: number;
  totalMatches: number;
  mathPoints: number;
  ownedCardIds: number[];
  createdAt: any;
}

interface GameConfig {
  maintenanceMode: boolean;
  announcement: string;
  maxPvpRooms: number;
}

interface GameMasterProps {
  db: any;
  onClose: () => void;
}

// ---- Helpers ----
const formatDate = (ts: any) => {
  if (!ts) return '---';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('ja-JP');
};

const winRate = (wins: number, matches: number) =>
  matches === 0 ? '--' : `${Math.round((wins / matches) * 100)}%`;

// ---- Component ----
const GameMaster: React.FC<GameMasterProps> = ({ db, onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'rooms' | 'stats' | 'config'>('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    maintenanceMode: false,
    announcement: '',
    maxPvpRooms: 50,
  });
  const [configDraft, setConfigDraft] = useState<GameConfig | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Real-time user watch
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'users'), orderBy('totalWins', 'desc'), limit(200));
    return onSnapshot(q, snap => {
      const list: UserData[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as UserData));
      setUsers(list);
    });
  }, [db]);

  // Real-time room watch
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'), limit(100));
    return onSnapshot(q, snap => {
      const list: Room[] = [];
      snap.forEach(d => {
        const data = d.data() as Room;
        if (!data.roomId) data.roomId = d.id;
        list.push(data);
      });
      setRooms(list);
    });
  }, [db]);

  // Load game config
  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'config', 'game')).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as GameConfig;
        setGameConfig(data);
        setConfigDraft(data);
      } else {
        setConfigDraft(gameConfig);
      }
    }).catch(console.error);
  }, [db]);

  // --- Derived stats ---
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalWins = users.reduce((s, u) => s + (u.totalWins || 0), 0);
    const totalMatches = users.reduce((s, u) => s + (u.totalMatches || 0), 0);
    const activeRooms = rooms.filter(r => r.status === 'playing').length;
    const waitingRooms = rooms.filter(r => r.status === 'waiting').length;
    const avgLevel = totalUsers > 0 ? (users.reduce((s, u) => s + (u.playerLevel || 1), 0) / totalUsers).toFixed(1) : '--';
    return { totalUsers, totalWins, totalMatches, activeRooms, waitingRooms, avgLevel };
  }, [users, rooms]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const s = userSearch.toLowerCase();
    return users.filter(u =>
      u.displayName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s)
    );
  }, [users, userSearch]);

  // --- User Actions ---
  const handleResetUserStats = async (userId: string, name: string) => {
    if (!confirm(`「${name}」の戦績をリセットしますか？`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), { totalWins: 0, totalMatches: 0 });
      alert('リセットしました。');
    } catch (e) { console.error(e); alert('エラーが発生しました。'); }
  };

  const handleGrantMathPoints = async (userId: string, name: string) => {
    const amount = parseInt(prompt(`「${name}」に付与するマスポイント数を入力:`) || '0');
    if (isNaN(amount) || amount === 0) return;
    try {
      const ref = doc(db, 'users', userId);
      const snap = await getDoc(ref);
      const current = snap.data()?.mathPoints || 0;
      await updateDoc(ref, { mathPoints: current + amount });
      alert(`${amount} MPを付与しました。`);
    } catch (e) { console.error(e); alert('エラー'); }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    const confirm1 = prompt(`警告: 「${name}」を削除します。\nユーザー名を入力して確認:`);
    if (confirm1 !== name) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('削除しました。');
    } catch (e) { console.error(e); alert('削除失敗'); }
  };

  // --- Room Actions ---
  const handleForceCloseRoom = async (roomId: string) => {
    if (!confirm(`ルーム「${roomId}」を強制終了しますか？`)) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'finished',
        winnerId: 'admin_terminated'
      });
      alert('終了しました。');
    } catch (e) { console.error(e); alert('エラー'); }
  };

  // --- Config Actions ---
  const handleSaveConfig = async () => {
    if (!configDraft || !db) return;
    setIsSavingConfig(true);
    try {
      await setDoc(doc(db, 'config', 'game'), configDraft);
      setGameConfig(configDraft);
      alert('設定を保存しました。');
    } catch (e) { console.error(e); alert('保存失敗'); }
    setIsSavingConfig(false);
  };

  const tabs = [
    { id: 'users', label: 'ユーザー', color: 'text-amber-400' },
    { id: 'rooms', label: 'ルーム', color: 'text-green-400' },
    { id: 'stats', label: '統計', color: 'text-blue-400' },
    { id: 'config', label: '設定', color: 'text-red-400' },
  ] as const;

  const roomStatusBadge = (status: string) => {
    if (status === 'playing') return 'bg-red-900/50 text-red-300 border-red-800';
    if (status === 'waiting') return 'bg-green-900/50 text-green-300 border-green-800';
    return 'bg-gray-800 text-gray-400 border-gray-700';
  };

  return (
    <div className="w-full h-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-red-500 tracking-widest">GAME MASTER</h1>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${
                  activeTab === t.id
                    ? `bg-gray-700 ${t.color}`
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-gray-400 border border-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          閉じる
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-hidden p-6">

        {/* ===== USERS TAB ===== */}
        {activeTab === 'users' && (
          <div className="h-full flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-amber-400">ユーザー ({filteredUsers.length} / {users.length})</h2>
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="名前・メールで検索..."
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none w-60"
              />
            </div>
            <div className="flex-grow overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-950 text-gray-500 text-xs sticky top-0">
                  <tr>
                    <th className="p-3 text-center">Rank</th>
                    <th className="p-3">ユーザー</th>
                    <th className="p-3 text-center">Lv</th>
                    <th className="p-3 text-center">戦績</th>
                    <th className="p-3 text-center">MP</th>
                    <th className="p-3 text-center">登録日</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-3 text-center text-gray-500 font-mono text-xs">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-sm">{u.displayName || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 font-mono">{u.email || u.id.slice(0, 12) + '...'}</div>
                      </td>
                      <td className="p-3 text-center text-cyan-400 font-bold">{u.playerLevel || 1}</td>
                      <td className="p-3 text-center">
                        <span className="text-amber-400 font-bold">{u.totalWins || 0}勝</span>
                        <span className="text-gray-500 text-xs"> / {u.totalMatches || 0}戦</span>
                        <br />
                        <span className="text-green-400 text-xs">{winRate(u.totalWins || 0, u.totalMatches || 0)}</span>
                      </td>
                      <td className="p-3 text-center text-amber-300 font-mono text-sm">{(u.mathPoints || 0).toLocaleString()}</td>
                      <td className="p-3 text-center text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center flex-wrap">
                          <button onClick={() => handleResetUserStats(u.id, u.displayName)} className="text-xs bg-orange-900/50 text-orange-300 border border-orange-800 px-2 py-0.5 rounded hover:bg-orange-800/50">戦績R</button>
                          <button onClick={() => handleGrantMathPoints(u.id, u.displayName)} className="text-xs bg-blue-900/50 text-blue-300 border border-blue-800 px-2 py-0.5 rounded hover:bg-blue-800/50">MP+</button>
                          <button onClick={() => handleDeleteUser(u.id, u.displayName)} className="text-xs bg-red-900/50 text-red-300 border border-red-800 px-2 py-0.5 rounded hover:bg-red-800/50">削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== ROOMS TAB ===== */}
        {activeTab === 'rooms' && (
          <div className="h-full flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h2 className="font-bold text-green-400">
                ルーム ({rooms.filter(r => r.status !== 'finished').length} アクティブ / {rooms.length} 総計)
              </h2>
              <div className="flex gap-3 text-xs font-mono">
                <span className="text-green-400">待機: {rooms.filter(r => r.status === 'waiting').length}</span>
                <span className="text-red-400">対戦中: {rooms.filter(r => r.status === 'playing').length}</span>
                <span className="text-gray-500">終了: {rooms.filter(r => r.status === 'finished').length}</span>
              </div>
            </div>
            <div className="flex-grow overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-950 text-gray-500 text-xs sticky top-0">
                  <tr>
                    <th className="p-3">ルームID</th>
                    <th className="p-3 text-center">状態</th>
                    <th className="p-3">ホスト / ゲスト</th>
                    <th className="p-3 text-center">HP</th>
                    <th className="p-3 text-center">Rd</th>
                    <th className="p-3 text-center">作成日時</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {rooms.map(room => (
                    <tr key={room.roomId} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-3 font-mono text-xs text-cyan-300">{room.roomId}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded border ${roomStatusBadge(room.status)}`}>
                          {room.status === 'playing' ? '対戦中' : room.status === 'waiting' ? '待機中' : '終了'}
                        </span>
                      </td>
                      <td className="p-3 text-sm">
                        <div>{room.hostName}</div>
                        <div className="text-xs text-gray-500">{room.guestName || '---'}</div>
                      </td>
                      <td className="p-3 text-center text-xs font-mono">
                        <span className="text-blue-400">{room.p1Hp ?? '--'}</span>
                        <span className="text-gray-600"> / </span>
                        <span className="text-red-400">{room.p2Hp ?? '--'}</span>
                      </td>
                      <td className="p-3 text-center text-xs text-gray-400">{room.round}</td>
                      <td className="p-3 text-center text-xs text-gray-500">{formatDate(room.createdAt)}</td>
                      <td className="p-3 text-center">
                        {room.status !== 'finished' && (
                          <button
                            onClick={() => handleForceCloseRoom(room.roomId)}
                            className="text-xs bg-red-900/50 text-red-300 border border-red-800 px-3 py-1 rounded hover:bg-red-800/50"
                          >
                            強制終了
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== STATS TAB ===== */}
        {activeTab === 'stats' && (
          <div className="h-full overflow-auto space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: '総ユーザー数', value: stats.totalUsers, color: 'text-amber-400' },
                { label: '平均レベル', value: stats.avgLevel, color: 'text-cyan-400' },
                { label: '総対戦数', value: stats.totalMatches, color: 'text-blue-400' },
                { label: '総勝利数', value: stats.totalWins, color: 'text-green-400' },
                { label: 'アクティブルーム', value: stats.activeRooms, color: 'text-red-400' },
                { label: '待機ルーム', value: stats.waitingRooms, color: 'text-yellow-400' },
              ].map(item => (
                <div key={item.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className={`text-3xl font-bold font-mono ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Top 10 by wins */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h3 className="font-bold text-amber-400">勝利数ランキング TOP10</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-950 text-gray-500 text-xs">
                  <tr>
                    <th className="p-3 text-center w-12">順位</th>
                    <th className="p-3">プレイヤー</th>
                    <th className="p-3 text-center">勝利</th>
                    <th className="p-3 text-center">対戦</th>
                    <th className="p-3 text-center">勝率</th>
                    <th className="p-3 text-center">Lv</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.slice(0, 10).map((u, i) => (
                    <tr key={u.id} className="hover:bg-gray-800/50">
                      <td className="p-3 text-center font-mono text-sm text-gray-400">{i + 1}</td>
                      <td className="p-3 font-bold text-sm">{u.displayName || 'Unknown'}</td>
                      <td className="p-3 text-center text-amber-400 font-bold">{u.totalWins || 0}</td>
                      <td className="p-3 text-center text-gray-400">{u.totalMatches || 0}</td>
                      <td className="p-3 text-center text-green-400">{winRate(u.totalWins || 0, u.totalMatches || 0)}</td>
                      <td className="p-3 text-center text-cyan-400">{u.playerLevel || 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== CONFIG TAB ===== */}
        {activeTab === 'config' && configDraft && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-red-400 text-lg">ゲーム設定</h3>

              {/* Maintenance mode */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div>
                  <p className="font-bold text-sm">メンテナンスモード</p>
                  <p className="text-xs text-gray-400">ONにするとゲスト以外がログインできなくなります</p>
                </div>
                <button
                  onClick={() => setConfigDraft(p => p ? { ...p, maintenanceMode: !p.maintenanceMode } : p)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    configDraft.maintenanceMode ? 'bg-red-600' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    configDraft.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Announcement */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">お知らせテキスト（空白で非表示）</label>
                <textarea
                  value={configDraft.announcement}
                  onChange={e => setConfigDraft(p => p ? { ...p, announcement: e.target.value } : p)}
                  rows={3}
                  placeholder="例: 2026/03/10 サーバーメンテナンスを予定しています"
                  className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm text-white focus:border-cyan-500 outline-none"
                />
              </div>

              {/* Max PvP rooms */}
              <div>
                <label className="block text-xs text-gray-400 mb-2">最大PvPルーム数 (現在: {stats.activeRooms})</label>
                <input
                  type="number"
                  value={configDraft.maxPvpRooms}
                  onChange={e => setConfigDraft(p => p ? { ...p, maxPvpRooms: Number(e.target.value) } : p)}
                  className="w-32 bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-cyan-500 outline-none"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="w-full py-3 rounded-lg font-bold text-white bg-red-700 hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isSavingConfig ? '保存中...' : '設定を保存'}
              </button>
            </div>

            {/* Current config preview */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h4 className="text-xs text-gray-500 mb-3 font-mono tracking-widest">CURRENT_CONFIG (saved)</h4>
              <pre className="text-xs text-green-400 font-mono">{JSON.stringify(gameConfig, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameMaster;
