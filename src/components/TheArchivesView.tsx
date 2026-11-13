import React, { useState } from 'react';
import {
  Shield,
  Eye,
  Crown,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Users,
  Lock,
  Layers,
  Award,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  HelpCircle,
  Copy,
  Check,
  PlusCircle,
} from 'lucide-react';
import { GameState } from '../game/engine';
import { CardView } from './CardView';
import { CHARACTER_DEFS, POWER_DEFS } from '../game/constants';
import { getPublicShareUrl } from '../utils/shareUrl';

interface TheArchivesViewProps {
  state: GameState;
  gameStarted: boolean;
  myPlayerId: string;
  myPlayerName: string;
  isHost: boolean;
  hasPlayerSeat: boolean;
  onSwitchToPlayerMat?: () => void;
  onLeaveRoom?: () => void;
  onResolveRound: () => void;
  onAdvanceRound: () => void;
  onSimulateBots: () => void;
  onNewGame: () => void;
  onOpenRules: () => void;
  onStartGame?: () => void;
}

export const TheArchivesView: React.FC<TheArchivesViewProps> = ({
  state,
  gameStarted,
  myPlayerId,
  myPlayerName,
  isHost,
  hasPlayerSeat,
  onSwitchToPlayerMat,
  onLeaveRoom,
  onResolveRound,
  onAdvanceRound,
  onSimulateBots,
  onNewGame,
  onOpenRules,
  onStartGame,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'central' | 'logs'>('roster');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInviteLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const url = getPublicShareUrl(state.roomCode);
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const minutes = Math.floor(state.roundTimeRemainingSeconds / 60);
  const seconds = state.roundTimeRemainingSeconds % 60;
  const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const submittedCount = state.players.filter((p) => p.submittedGuess !== undefined).length;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans selection:bg-amber-950 selection:text-amber-100">
      {/* Top Archives Command Bar */}
      <header className="bg-[#0c121e] border-b border-amber-900/40 text-slate-100 shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Mode */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-900 border border-amber-400/50 flex items-center justify-center text-amber-100 shadow-md">
              <Eye className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg tracking-wider text-amber-100">
                  THE ARCHIVES
                </h1>
                <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-500/40 font-semibold">
                  Host & Facilitator Codex
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                <span>Room: <strong className="font-mono text-slate-200">{state.roomCode}</strong></span>
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">
                  Viewing as: <strong className="text-amber-300">{myPlayerName}</strong> {isHost && '(Host)'}
                </span>
              </p>
            </div>
          </div>

          {/* Facilitator Status & Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {gameStarted && (
              <div className="flex items-center gap-2 bg-[#141b29] px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Round</span>
                  <span className="font-bold text-slate-100">{state.isGameOver ? 'End' : `${state.round}/4`}</span>
                </div>
                <div className="h-6 w-px bg-slate-800 mx-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Clock</span>
                  <span className="font-mono font-bold text-slate-200">{timeDisplay}</span>
                </div>
                <div className="h-6 w-px bg-slate-800 mx-1" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Guesses</span>
                  <span className="font-semibold text-emerald-400">{submittedCount}/{state.players.length} in</span>
                </div>
              </div>
            )}

            {/* New Room button */}
            {onLeaveRoom && (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Leave match and create or join a new room"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>New Room</span>
              </button>
            )}

            {/* Switch to Player Mat button if seated */}
            {hasPlayerSeat && (
              <button
                type="button"
                onClick={onSwitchToPlayerMat}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Go to My Player Mat</span>
              </button>
            )}

            {/* Host Controls */}
            {isHost && gameStarted && (
              <>
                <button
                  type="button"
                  onClick={onSimulateBots}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Let all bots submit their guesses for this round"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Simulate Bots</span>
                </button>

                {!state.roundGuessesResolved ? (
                  <button
                    type="button"
                    onClick={onResolveRound}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Resolve Round</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onAdvanceRound}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{state.round >= 4 ? 'End Match' : `Advance to Round ${state.round + 1}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={onNewGame}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Reset Game"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onOpenRules}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200 transition-colors cursor-pointer"
              title="Rulebook & Characters"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Archives Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 border-t border-slate-800/80 pt-2 pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All {state.players.length} Players & Secret Dossiers</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('central')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'central'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Central Table Cards ({state.centralCards.length} Total)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Unmasked Activity & Logs</span>
          </button>
        </div>
      </header>

      {/* Main Archives Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* If Game Has Not Started Yet */}
        {!gameStarted ? (
          <div className="bg-[#101726] border border-amber-500/30 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-amber-100">
                The Archives are Sealed
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                You have authorized Archives access. As soon as the match begins, all {state.players.length} players' secret characters, powers, cards in hand, secret partner bonds, and all {state.centralCards.length} central table cards will unlock here in real time.
              </p>
            </div>

            {/* Quick Player Count & Start Game */}
            <div className="p-4 bg-[#182133] rounded-2xl border border-slate-700/80 text-xs space-y-3">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span>Connected Room Participants:</span>
                <span className="text-amber-400 font-bold">
                  {state.players.filter((p) => !p.isBot).length} Real Players
                </span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {state.players.map((p, idx) => (
                  <span
                    key={p.id}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      !p.isBot
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    Seat {idx + 1}: {p.name} {!p.isBot && '✓'}
                  </span>
                ))}
              </div>
            </div>

            {isHost && onStartGame && (
              <button
                type="button"
                onClick={onStartGame}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-serif font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Match Now (Unseal The Archives)</span>
              </button>
            )}

            {onLeaveRoom && (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="w-full py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Leave & Create New Room</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 1. All 8 Players Secret Dossiers Tab */}
            {activeTab === 'roster' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                      <span>Live Player Dossiers (Unmasked View)</span>
                      <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-amber-950 border border-amber-600/40 text-amber-300">
                        {state.players.length} Active Seats
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      View each player's secret character role, hidden power, cards, and partner link.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {state.players.map((p, index) => {
                    const charDef = CHARACTER_DEFS[p.characterId as keyof typeof CHARACTER_DEFS];
                    const powerDef = POWER_DEFS[p.powerId as keyof typeof POWER_DEFS];
                    const partner = state.players.find((other) => other.id === p.secretPartnerId);

                    return (
                      <div
                        key={p.id}
                        className={`bg-[#121927] border rounded-2xl p-4 space-y-3.5 shadow-md transition-all ${
                          p.id === myPlayerId
                            ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Player Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                              {index + 1}
                            </div>
                            <span className="font-semibold text-slate-100 text-sm truncate">
                              {p.name}
                            </span>
                            {p.id === myPlayerId && (
                              <span className="text-[10px] text-amber-400 font-bold shrink-0">
                                (You)
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              p.isBot
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-emerald-950/80 border border-emerald-500/30 text-emerald-300'
                            }`}
                          >
                            {p.isBot ? 'Bot' : 'Human'}
                          </span>
                        </div>

                        {/* Cards in Hand (Both Cards Unmasked) */}
                        <div>
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Cards in Hand</span>
                            <span className="text-slate-500">2 Cards</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.cards.map((card, cIdx) => (
                              <div key={`${p.id}_c_${cIdx}`} className="flex flex-col items-center">
                                <CardView card={card} size="sm" isFaceDown={false} />
                                <span
                                  className={`text-[9px] mt-1 font-semibold ${
                                    card.isRevealed ? 'text-amber-400' : 'text-slate-400'
                                  }`}
                                >
                                  {card.isRevealed ? 'Revealed' : 'Secret'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Character Info */}
                        <div className="p-2.5 rounded-xl bg-[#172033] border border-slate-700/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-200">
                              {charDef?.name || p.characterId}
                            </span>
                            {charDef?.isMandatory && (
                              <span className="text-[9px] text-amber-400 font-medium font-mono">
                                Core
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 leading-tight line-clamp-2">
                            {charDef?.objectiveSummary}
                          </p>
                          {p.objectiveProgress && (
                            <div className="text-[10px] text-emerald-300 font-medium pt-1 border-t border-slate-700/60">
                              Objective: {p.objectiveProgress}
                            </div>
                          )}
                        </div>

                        {/* Power Info */}
                        <div className="p-2.5 rounded-xl bg-[#172033] border border-slate-700/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-200">
                              {powerDef?.name || p.powerId}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1 rounded ${
                                p.powerDisabled
                                  ? 'bg-red-950 text-red-300'
                                  : p.powerUsed
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-purple-950 text-purple-300'
                              }`}
                            >
                              {p.powerDisabled ? 'Disabled' : p.powerUsed ? 'Used' : 'Ready'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">
                            {powerDef?.description}
                          </p>
                        </div>

                        {/* Partner Link */}
                        <div className="text-[11px] text-slate-300 flex items-center justify-between bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800">
                          <span className="text-slate-400 text-[10px]">Partner:</span>
                          <span className="font-semibold text-slate-200">
                            {partner ? partner.name : 'Unknown'}
                          </span>
                        </div>

                        {/* Locked Guess if any */}
                        {p.submittedGuess ? (
                          <div className="p-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-[10px] text-emerald-200 flex items-center justify-between">
                            <span>Locked Guess:</span>
                            <strong className="text-white">
                              {state.players.find((target) => target.id === p.submittedGuess?.targetPlayerId)?.name || 'Target'}{' '}
                              · {p.submittedGuess.value} of {p.submittedGuess.suit}
                            </strong>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 text-center py-1">
                            No guess submitted yet
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Central Table Cards Tab */}
            {activeTab === 'central' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-slate-100 flex items-center gap-2">
                    <span>Central Pile Cards ({state.centralCards.length} Total)</span>
                    <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-amber-950 border border-amber-600/40 text-amber-300">
                      Unmasked Codex
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Revealed cards are publicly face-up on the main game board. Face-down cards are hidden from normal players, but fully revealed here.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {state.centralCards.map((card, idx) => (
                    <div
                      key={card.id || `central_${idx}`}
                      className="bg-[#121927] border border-slate-800 rounded-xl p-3 flex flex-col items-center text-center space-y-1.5 shadow-xs"
                    >
                      <span className="text-[10px] font-mono text-slate-400">
                        Pile #{idx + 1}
                      </span>
                      <CardView card={card} size="sm" isFaceDown={false} />
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                          card.isRevealed
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {card.isRevealed ? 'Public Face-Up' : 'Hidden from Board'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Activity & Secret Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-serif font-bold text-slate-100">
                    Live Question & Deduction Feed
                  </h2>
                  <p className="text-xs text-slate-400">
                    Complete transcript of public and private questions asked throughout the match.
                  </p>
                </div>

                <div className="space-y-2">
                  {state.questionLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-[#121927] border border-slate-800 rounded-2xl text-xs">
                      No questions asked yet in this match.
                    </div>
                  ) : (
                    state.questionLogs.map((q) => {
                      const asker = state.players.find((p) => p.id === q.askerId)?.name || q.askerId;
                      const target = state.players.find((p) => p.id === q.targetId)?.name || q.targetId;

                      return (
                        <div
                          key={q.id}
                          className="p-3 bg-[#121927] border border-slate-800 rounded-xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-amber-300">{asker}</span>
                              <span className="text-slate-500">asked</span>
                              <span className="font-semibold text-slate-200">{target}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                (Round {q.round})
                              </span>
                              {!q.isPublic && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                                  Private
                                </span>
                              )}
                            </div>
                            <div className="text-slate-300">
                              "{q.questionText}"
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono font-bold text-xs">
                              Answer: {q.answerText}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
