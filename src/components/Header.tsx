import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Play,
  Pause,
  Users,
  Flame,
  ArrowRight,
  Copy,
  Check,
  Share2,
  FlaskConical,
  Eye,
  Lock,
  PlusCircle,
} from 'lucide-react';
import { GameState } from '../game/engine';
import { getPublicShareUrl } from '../utils/shareUrl';

interface HeaderProps {
  state: GameState;
  isOnlineMode: boolean;
  playerName: string;
  isHost: boolean;
  isArchives?: boolean;
  onOpenArchives?: () => void;
  onUnlockArchivesPrompt?: () => void;
  onLeaveRoom?: () => void;
  onNewGame: () => void;
  onOpenRules: () => void;
  onOpenTests?: () => void;
  onOpenPowerLab?: () => void;
  onOpenRoomModal: () => void;
  onOpenSubmittedGuesses: () => void;
  onToggleTimer: () => void;
  onSwitchActivePlayer: (playerId: string) => void;
  onResolveRound: () => void;
  onAdvanceRound: () => void;
  onSimulateBots: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  isOnlineMode,
  playerName,
  isHost,
  isArchives,
  onOpenArchives,
  onUnlockArchivesPrompt,
  onLeaveRoom,
  onNewGame,
  onOpenRules,
  onOpenTests,
  onOpenPowerLab,
  onOpenRoomModal,
  onOpenSubmittedGuesses,
  onToggleTimer,
  onSwitchActivePlayer,
  onResolveRound,
  onAdvanceRound,
  onSimulateBots,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInviteLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = getPublicShareUrl(state.roomCode);
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const activePlayer = state.players.find((p) => p.id === state.activePlayerId);
  const minutes = Math.floor(state.roundTimeRemainingSeconds / 60);
  const seconds = state.roundTimeRemainingSeconds % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const submittedCount = state.players.filter((p) => p.submittedGuess !== undefined).length;

  return (
    <header className="bg-[#0e1320] border-b border-slate-800 text-slate-100 shadow-md sticky top-0 z-40">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-serif font-bold shadow-xs">
            ♠
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-lg tracking-wider text-slate-100">
                BLINDS
              </h1>
              <span className="text-xs text-slate-400 font-normal">
                · Diwali Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span>Room:</span>
                <span className="font-mono font-semibold text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700/80">
                  {state.roomCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                  title="Copy shareable invite link for friends"
                >
                  {copiedLink ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400" />
                  )}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </span>
              <span className="text-slate-600">•</span>
              {isOnlineMode ? (
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <span>Player: {playerName || activePlayer?.name}</span>
                  <span className="text-emerald-400 text-[10px] font-semibold">
                    (Your Screen)
                  </span>
                </span>
              ) : (
                <span className="text-slate-300 font-medium">Pass & Play Mode</span>
              )}
            </p>
          </div>
        </div>

        {/* Round & Clock */}
        <div className="flex items-center gap-3 bg-slate-850 px-3 py-1.5 rounded-xl border border-slate-750 shadow-inner">
          <div className="text-center pr-3 border-r border-slate-750">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Round</div>
            <div className="text-lg font-bold text-slate-100 leading-tight">
              {state.isGameOver ? 'End' : `${state.round}/4`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Timer</div>
              <div className="text-base font-mono font-bold text-slate-200">{timeDisplay}</div>
            </div>
            <button
              onClick={onToggleTimer}
              disabled={state.isGameOver}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-40"
              title={state.isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
            >
              {state.isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          <div className="pl-3 border-l border-slate-750 hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Guesses</div>
            <div className="text-xs font-semibold text-emerald-400">
              {submittedCount}/{state.players.length} in
            </div>
          </div>
        </div>

        {/* Controls & Nav */}
        <div className="flex items-center gap-2 flex-wrap">
          {onLeaveRoom && (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-amber-200 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Leave this game and create or join a new room"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>New Room</span>
            </button>
          )}

          <button
            onClick={onOpenRoomModal}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
            title="Invite friends with share link or generate new room"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Invite & Room</span>
          </button>

          {!state.isGameOver && (
            <>
              <button
                type="button"
                onClick={onOpenSubmittedGuesses}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
                title="View all submitted guesses for this round without spoilers"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Pending ({submittedCount}/{state.players.length})</span>
              </button>

              {isArchives ? (
                <button
                  type="button"
                  onClick={onOpenArchives}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-950/80 to-amber-900/60 hover:from-amber-900 hover:to-amber-800 border border-amber-500/50 text-amber-200 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Open The Archives (Host & Facilitator unmasked view)"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>The Archives</span>
                </button>
              ) : (
                onUnlockArchivesPrompt && (
                  <button
                    type="button"
                    onClick={onUnlockArchivesPrompt}
                    className="px-2 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Enter passcode to unlock The Archives"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Archives</span>
                  </button>
                )
              )}

              {isHost && (
                <>
                  <button
                    type="button"
                    onClick={onSimulateBots}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Let all bots submit their guesses for this round"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Simulate Bots</span>
                  </button>

                  {!state.roundGuessesResolved ? (
                    <button
                      type="button"
                      onClick={onResolveRound}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Resolve Guesses</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onAdvanceRound}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {state.round >= 4 ? 'End Game' : `Move to Round ${state.round + 1}`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </>
          )}

          <button
            onClick={onOpenRules}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 transition-colors cursor-pointer"
            title="Rules & Character Reference"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {isHost && (
            <button
              onClick={onNewGame}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Reset Game (Host Only)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Player Perspective Switcher Bar (Only in Pass-and-Play Solo mode) */}
      {!isOnlineMode && (
        <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto text-xs py-0.5">
            <div className="flex items-center gap-1.5 text-slate-400 shrink-0 font-medium text-[11px]">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Pass & Play View:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {state.players.map((p) => {
                const isActive = p.id === state.activePlayerId;
                const hasGuessed = !!p.submittedGuess;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSwitchActivePlayer(p.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full inline-block bg-slate-400" />
                    <span>{p.name}</span>
                    {hasGuessed && (
                      <span className="text-[10px] text-emerald-400" title="Guess locked in">
                        ✓
                      </span>
                    )}
                    <span className="text-[10px] opacity-75 font-mono">
                      ({p.cards.filter((c) => !c.isRevealed).length}🂠)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
