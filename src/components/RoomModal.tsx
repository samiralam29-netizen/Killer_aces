import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  Sparkles,
  Shield,
  X,
  Share2,
  RefreshCw,
  PlusCircle,
  LogIn,
  Flame,
  ArrowRight,
} from 'lucide-react';

import { getPublicShareUrl, extractRoomCodeFromInput } from '../utils/shareUrl';
import { CustomGameSetup, PlayerCountMode } from '../types/game';

interface ConnectedPlayerInfo {
  id: string;
  name: string;
  isHost?: boolean;
}

interface RoomModalProps {
  isOpen: boolean;
  roomCode: string;
  playerName: string;
  isHost: boolean;
  gameStarted: boolean;
  connectedPlayersCount: number;
  connectedPlayers?: ConnectedPlayerInfo[];
  totalSeats: number;
  isOnlineMode: boolean;
  initialTab?: 'share' | 'create' | 'join';
  onClose: () => void;
  onStartGame: () => void;
  onJoinRoom: (roomCode: string, name: string) => void;
  onCreateRoom?: (roomCode: string, name: string, setup?: CustomGameSetup) => void;
  onLeaveRoom?: () => void;
  onSwitchToSolo: () => void;
}

const FESTIVE_PREFIXES = [
  'DIWALI',
  'RAMA',
  'SITA',
  'LANKA',
  'DEEPA',
  'SURYA',
  'AYODHYA',
  'AGNI',
  'JYOTI',
  'VIJAY',
];

function generateFestiveCode(): string {
  const prefix = FESTIVE_PREFIXES[Math.floor(Math.random() * FESTIVE_PREFIXES.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${prefix}${num}`;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  roomCode,
  playerName,
  isHost,
  gameStarted,
  connectedPlayersCount,
  connectedPlayers = [],
  totalSeats,
  isOnlineMode,
  initialTab = 'share',
  onClose,
  onStartGame,
  onJoinRoom,
  onCreateRoom,
  onLeaveRoom,
  onSwitchToSolo,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'share' | 'create' | 'join'>(initialTab);
  const [copied, setCopied] = useState(false);

  // Create state
  const [newRoomCode, setNewRoomCode] = useState(() => generateFestiveCode());
  const [hostName, setHostName] = useState(playerName);
  const [createPlayerCount, setCreatePlayerCount] = useState<PlayerCountMode>(8);

  // Join state
  const [joinCode, setJoinCode] = useState(roomCode);
  const [joinName, setJoinName] = useState(playerName);

  useEffect(() => {
    setJoinCode(roomCode);
    setJoinName(playerName);
    setHostName(playerName);
  }, [roomCode, playerName]);

  const shareUrl = getPublicShareUrl(roomCode);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my BLINDS (Diwali Edition) game!',
          text: `Join my Diwali BLINDS multiplayer game! Room Code: ${roomCode}`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to copy
      }
    }
    handleCopyLink();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = (newRoomCode.trim() || generateFestiveCode()).toUpperCase();
    const finalName = hostName.trim() || 'Host';
    if (onCreateRoom) {
      onCreateRoom(finalCode, finalName, { playerCount: createPlayerCount });
    } else {
      onJoinRoom(finalCode, finalName);
    }
    setActiveTab('share');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = extractRoomCodeFromInput(joinCode);
    if (!cleanCode || !joinName.trim()) return;
    onJoinRoom(cleanCode, joinName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl w-full max-w-lg text-amber-50 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/50 text-amber-400 flex items-center justify-center shadow-md">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">
                Multiplayer Game Setup
              </h3>
              <p className="text-xs text-amber-300">
                Share a link to invite players — each person sees their own private screen!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'share'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Invite & Lobby</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Game</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Join With Code</span>
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* TAB 1: SHARE & LOBBY */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              {/* Game Code & Copy Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-950/40 to-slate-950 border border-amber-500/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Current Game Code:
                  </span>
                  <span className="text-xl font-mono font-black text-amber-300 tracking-wider">
                    {roomCode}
                  </span>
                </div>

                {/* Direct Share Link Box */}
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Shareable Invite Link (Friends join directly):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 font-mono text-xs select-all focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-md"
                    >
                      {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-all shrink-0"
                      title="Share link"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Anyone who opens this link connects directly on their phone or computer and receives their own private seat, secret cards, and secret objective!
                </p>
              </div>

              {/* Connected Players in Room */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Connected Players ({connectedPlayersCount} / {totalSeats})</span>
                  </span>
                  <span className="text-[10px] text-amber-400/80">
                    {Math.max(0, totalSeats - connectedPlayersCount)} Bot(s) will fill remaining seats
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {connectedPlayers.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-md bg-amber-600/20 text-amber-300 font-bold text-[10px] flex items-center justify-center">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-white truncate">{p.name}</div>
                        {p.isHost && (
                          <div className="text-[9px] text-amber-400 font-bold uppercase">Host</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, totalSeats - connectedPlayersCount) }).map((_, idx) => (
                    <div
                      key={`bot_slot_${idx}`}
                      className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-500 flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-md bg-slate-800 text-slate-500 font-bold text-[10px] flex items-center justify-center">
                        🤖
                      </div>
                      <div className="text-[11px] truncate">Bot Slot</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Host Start Game Action */}
              {isOnlineMode && isHost && !gameStarted && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white text-xs">Ready to play?</div>
                    <div className="text-[10px] text-emerald-300">
                      You are the host. You can start the game with the current players now.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onStartGame();
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Game Now</span>
                  </button>
                </div>
              )}

              {/* Leave & Create New Room action */}
              {onLeaveRoom && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Want to exit this match and start fresh?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLeaveRoom();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Leave & Create New Room</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW GAME */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold text-xs">
                      Generated Game Code:
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewRoomCode(generateFestiveCode())}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Another Code</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newRoomCode}
                      onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                      placeholder="e.g. DIWALI42"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-amber-300 font-mono font-black text-sm uppercase tracking-wider focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Your Name (Host):
                  </label>
                  <input
                    type="text"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    placeholder="e.g. Samir"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Match Format Toggle */}
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                    Match Format:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCreatePlayerCount(8)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        createPlayerCount === 8
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-xs ring-1 ring-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">8 Players</div>
                      <div className="text-[10px] opacity-80">32 Cards (1–8) · 40m/20m/10m</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCreatePlayerCount(6)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        createPlayerCount === 6
                          ? 'bg-amber-950/80 border-amber-500 text-amber-200 shadow-xs ring-1 ring-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">6 Players</div>
                      <div className="text-[10px] opacity-80">24 Cards (1–6) · 30m/20m/10m</div>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Create Game Room & Get Share Link</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 3: JOIN WITH CODE */}
          {activeTab === 'join' && (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Enter Game Code:
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. DIWALI42"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-amber-300 font-mono font-bold text-sm uppercase tracking-wider focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold text-xs mb-1">
                    Your Name:
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="e.g. Diya"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-semibold text-xs focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Join Game Room</span>
              </button>
            </form>
          )}

          {/* Privacy Guarantee & Solo Toggle */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>Private screen guaranteed for each player</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onSwitchToSolo();
                onClose();
              }}
              className="text-slate-400 hover:text-amber-300 underline transition-colors"
            >
              Switch to Pass & Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
