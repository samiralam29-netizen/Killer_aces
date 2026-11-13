import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  Share2,
  Crown,
  BookOpen,
  ArrowLeft,
  Sparkles,
  Lock,
  Eye,
  Key,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { getPublicShareUrl, isDevPreviewOrigin } from '../utils/shareUrl';
import { CustomGameSetup, PlayerCountMode } from '../types/game';
import { CustomSetupModal } from './CustomSetupModal';

export interface ConnectedPlayer {
  id: string;
  name: string;
  isHost: boolean;
  avatar?: string;
  isArchives?: boolean;
  isSpectator?: boolean;
  isConnected?: boolean;
}

interface LobbyScreenProps {
  roomCode: string;
  myPlayerName: string;
  myPlayerId: string;
  isHost: boolean;
  isArchives: boolean;
  playerCount?: PlayerCountMode;
  customSetup?: CustomGameSetup;
  hostArchivesPassword?: string;
  connectedPlayers: ConnectedPlayer[];
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onOpenRules: () => void;
  onSelectSeat?: (seatId: string) => void;
  onUnlockArchives?: (password: string, relinquishSeat: boolean) => void;
  onOpenArchives?: () => void;
  onUpdateArchivesPassword?: (password: string) => void;
  onUpdateRoomSetup?: (setup: CustomGameSetup) => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode,
  myPlayerName,
  myPlayerId,
  isHost,
  isArchives,
  playerCount = 8,
  customSetup,
  hostArchivesPassword = '',
  connectedPlayers,
  onStartGame,
  onLeaveRoom,
  onOpenRules,
  onSelectSeat,
  onUnlockArchives,
  onOpenArchives,
  onUpdateArchivesPassword,
  onUpdateRoomSetup,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showHostPass, setShowHostPass] = useState(false);
  const [isEditingPass, setIsEditingPass] = useState(false);
  const [newPassInput, setNewPassInput] = useState(hostArchivesPassword);
  const [isCustomSetupOpen, setIsCustomSetupOpen] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [archivesPass, setArchivesPass] = useState('');
  const [relinquishSeat, setRelinquishSeat] = useState(myPlayerId === 'spectator');
  const [passError, setPassError] = useState('');

  const shareUrl = getPublicShareUrl(roomCode);

  const handleCopyCode = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleArchivesSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!archivesPass.trim()) {
      setPassError('Please enter the password.');
      return;
    }
    setPassError('');
    if (onUnlockArchives) {
      onUnlockArchives(archivesPass.trim(), relinquishSeat);
    }
    setShowPasswordModal(false);
  };

  const getSeatedPlayer = (seatNum: number) => {
    const seatId = `p${seatNum}`;
    return connectedPlayers.find((p) => p.id === seatId);
  };

  const mySeatNumber = myPlayerId?.startsWith('p') ? myPlayerId.replace('p', '') : null;
  const isSpectator = myPlayerId === 'spectator';

  return (
    <div className="min-h-screen bg-[#0a0e17] flex flex-col items-center justify-center p-4 selection:bg-slate-800 selection:text-slate-100">
      <div className="w-full max-w-xl bg-[#131926] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <button
            type="button"
            onClick={onLeaveRoom}
            className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-all font-semibold shadow-xs"
            title="Leave this game and create or join a new room"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Leave & Create New Room</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-medium text-slate-400">
              Lobby · In Preparation
            </span>
            <button
              type="button"
              onClick={onOpenRules}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rules</span>
            </button>
          </div>
        </div>

        {/* Room Code Display & Share Box */}
        <div className="bg-[#182133] border border-slate-700/80 rounded-2xl p-5 text-center space-y-3">
          <div className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
            Game Room Code
          </div>
          <div className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-slate-100 select-all">
            {roomCode}
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer shadow-xs"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-1.5 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Share the invite link or give players the code so everyone joins on their own phone or screen.
          </p>
          {isDevPreviewOrigin() && (
            <p className="text-[10px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 rounded-lg px-2.5 py-1.5 leading-relaxed">
              Dev Preview Note: This invite link connects to your Dev server. To play with friends on separate devices, open the Shared App URL in a browser first and create the room there.
            </p>
          )}
        </div>

        {/* Host Secret Key Panel (Visible ONLY to the Host) */}
        {isHost && (
          <div className="p-4 rounded-2xl bg-[#141d2c] border border-amber-500/40 space-y-2.5 shadow-md animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
                <Key className="w-4 h-4 text-amber-400" />
                <span>The Archives Password (Host Secret)</span>
              </div>
              <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-600/40 font-mono font-semibold">
                Only You Can See This
              </span>
            </div>

            {isEditingPass ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Set new password"
                  className="flex-1 bg-[#1b2334] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPassInput.trim() && onUpdateArchivesPassword) {
                      onUpdateArchivesPassword(newPassInput.trim());
                      setIsEditingPass(false);
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingPass(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 flex-wrap bg-[#1b2334] px-3 py-2 rounded-xl border border-slate-700/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-300 tracking-wider">
                    {showHostPass ? (hostArchivesPassword || '••••••••') : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHostPass(!showHostPass)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline font-medium cursor-pointer"
                  >
                    {showHostPass ? 'Hide' : 'Reveal'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (hostArchivesPassword && navigator.clipboard) {
                        navigator.clipboard.writeText(hostArchivesPassword);
                        setCopiedPass(true);
                        setTimeout(() => setCopiedPass(false), 2000);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer shadow-xs"
                  >
                    {copiedPass ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                    <span>{copiedPass ? 'Copied!' : 'Copy Password'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewPassInput(hostArchivesPassword || '');
                      setIsEditingPass(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold border border-slate-700 cursor-pointer shadow-xs"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Only you (the host) know this password. Share it privately with anyone you choose to grant Archives access to.
            </p>
          </div>
        )}

        {/* The Archives Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#182133] to-amber-950/20 border border-amber-600/40 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="font-serif font-bold text-sm text-amber-200 tracking-wide">
                The Archives
              </span>
              {isArchives && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold">
                  Access Granted
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 max-w-sm leading-relaxed">
              Complete unmasked view of all players' characters, powers, held cards, and the {playerCount === 6 ? 12 : 16} central cards. (Opens once game starts).
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isArchives ? (
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-600/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Enter Password for Archives</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenArchives}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open The Archives</span>
              </button>
            )}
          </div>
        </div>

        {/* Format & Custom Deck Banner */}
        <div className="p-3 bg-[#182133] border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <span>{playerCount} Players Match</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-mono font-semibold">
                  {playerCount === 6 ? '24 Cards (1–6)' : '32 Cards (1–8)'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {playerCount === 6
                  ? 'Table Reveals: 5, 3, 2 · Timers: 30m, 20m, 10m, 10m'
                  : 'Table Reveals: 6, 4, 2 · Timers: 40m, 20m, 10m, 10m'}
              </div>
            </div>
          </div>

          {isHost && onUpdateRoomSetup && (
            <button
              type="button"
              onClick={() => setIsCustomSetupOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              title="Customize player count, characters, and powers"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Format / Cards</span>
            </button>
          )}
        </div>

        {/* Live Players in Room Roster (Shows all seated & spectating players immediately) */}
        <div className="p-3.5 rounded-2xl bg-[#101624] border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Players in Room ({connectedPlayers.length})</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {connectedPlayers.filter((p) => !p.isSpectator).length} / {playerCount} Seated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {connectedPlayers.map((p, idx) => {
              const isSelf = p.name === myPlayerName && p.id === myPlayerId;
              const seatLabel =
                p.isSpectator || p.id === 'spectator'
                  ? 'Spectator'
                  : `Seat ${p.id.replace('p', '')}`;
              return (
                <div
                  key={`${p.id}-${p.name}-${idx}`}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isSelf
                      ? 'bg-[#18253b] border-amber-500/50'
                      : 'bg-[#161e2e] border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        p.isConnected === false ? 'bg-slate-500' : 'bg-emerald-400'
                      }`}
                      title={p.isConnected === false ? 'Reconnecting...' : 'Online'}
                    />
                    <span className="font-semibold text-slate-100 truncate">
                      {p.name}
                    </span>
                    {p.isHost && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 shrink-0">
                        Host
                      </span>
                    )}
                    {isSelf && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                        You
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-slate-300 shrink-0">
                    {seatLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seat Selection Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider">
              Seats ({playerCount})
            </span>
            <span className="text-[11px] text-slate-400">
              Your Status:{' '}
              <strong className="text-amber-300">
                {isSpectator ? 'Spectator (No Seat)' : `Seat ${mySeatNumber}`}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: playerCount }, (_, i) => {
              const seatNum = i + 1;
              const seatId = `p${seatNum}`;
              const player = getSeatedPlayer(seatNum);
              const isMySeat = myPlayerId === seatId;

              if (player) {
                return (
                  <div
                    key={seatId}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-xs transition-all ${
                      isMySeat
                        ? 'bg-[#18253b] border-amber-500/60 ring-1 ring-amber-500/30'
                        : 'bg-[#182133] border-slate-700/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                        {player.isHost ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : seatNum}
                      </div>
                      <span className="font-semibold text-slate-100 text-xs truncate">
                        {player.name}
                      </span>
                      {player.isHost && (
                        <span className="text-[9px] font-bold uppercase text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                          Host
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                      {isMySeat ? (
                        <span className="text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                          You
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Joined</span>
                      )}
                    </div>
                  </div>
                );
              }

              // Empty Seat
              return (
                <div
                  key={seatId}
                  className="p-2.5 rounded-xl bg-[#0e131f] border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-2 text-slate-400 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center text-xs">
                      {seatNum}
                    </div>
                    <span className="text-slate-400 text-[11px]">Seat {seatNum}: Open</span>
                  </div>

                  {onSelectSeat && (
                    <button
                      type="button"
                      onClick={() => onSelectSeat(seatId)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all border border-slate-700 cursor-pointer"
                    >
                      Take Seat
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spectator Option (Join without a seat) */}
          <div className="pt-1 flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 text-[11px]">
              {isSpectator
                ? 'You are spectating without a seat. Click Take Seat above anytime.'
                : 'Want to facilitate or observe without taking a player seat?'}
            </span>
            {onSelectSeat && !isSpectator && (
              <button
                type="button"
                onClick={() => onSelectSeat('spectator')}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer shrink-0 ml-2"
              >
                Switch to Spectator
              </button>
            )}
            {isSpectator && (
              <span className="text-[11px] text-emerald-400 font-medium shrink-0 ml-2">
                ✓ Spectating
              </span>
            )}
          </div>
        </div>

        {/* Action Button: Host vs Non-Host */}
        <div className="pt-2 border-t border-slate-800/80">
          {isHost ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onStartGame}
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-serif font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Game Now ({connectedPlayers.filter((p) => !p.isSpectator).length} Players Seated)</span>
              </button>
              <p className="text-[11px] text-center text-slate-500">
                You can start with any number of seated players. Unclaimed seats will be played by bots.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#182133] border border-slate-800 text-center space-y-1">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                <span>Waiting for Host to Start...</span>
              </div>
              <p className="text-[11px] text-slate-400">
                The host will launch the game once everyone has joined. You'll automatically transition to your screen.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal for The Archives */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#131926] border border-amber-600/50 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/50 flex items-center justify-center text-amber-300">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-amber-200">
                  Unlock The Archives
                </h3>
                <p className="text-[10px] text-slate-400">
                  Host & Facilitator Protected View
                </p>
              </div>
            </div>

            <form onSubmit={handleArchivesSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Facilitator Password:
                </label>
                <input
                  type="password"
                  autoFocus
                  value={archivesPass}
                  onChange={(e) => {
                    setArchivesPass(e.target.value);
                    if (passError) setPassError('');
                  }}
                  placeholder="Enter password"
                  className="w-full bg-[#1b2334] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50 transition-all font-mono"
                />
              </div>

              {passError && (
                <div className="text-xs text-rose-400 font-medium">
                  {passError}
                </div>
              )}

              {/* Checkbox: Relinquish seat and join purely as spectator */}
              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={relinquishSeat}
                  onChange={(e) => setRelinquishSeat(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-amber-600 focus:ring-amber-500"
                />
                <span className="leading-tight">
                  Join as spectator / facilitator only (do not take a player seat)
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Unlock Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Setup Modal for Host */}
      {isHost && onUpdateRoomSetup && (
        <CustomSetupModal
          isOpen={isCustomSetupOpen}
          initialSetup={
            customSetup || {
              playerCount,
            }
          }
          onClose={() => setIsCustomSetupOpen(false)}
          onApply={(newSetup) => {
            onUpdateRoomSetup(newSetup);
          }}
        />
      )}
    </div>
  );
};
