import React from 'react';
import {
  Shield,
  HelpCircle,
  Target,
  AlertTriangle,
  Zap,
  Layers,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Award,
  Crown,
} from 'lucide-react';
import { Player, PlayingCard, QuestionLogEntry } from '../types/game';
import { CardView } from './CardView';
import { CardTrackerPanel } from './CardTrackerPanel';
import { computeRunningScore } from '../game/scoring';

interface GameBoardProps {
  me: Player;
  allPlayers: Player[];
  otherPlayers: Player[];
  centralCards: PlayingCard[];
  questionLogs: QuestionLogEntry[];
  activePlayerId: string;
  currentRound: number;
  playerCount?: 6 | 8;
  onAskPlayer: (targetId: string) => void;
  onGuessPlayer: (targetId: string) => void;
  onCycleCardTag?: (cardKey: string) => void;
  onToggleCardTagMode?: (cardKey: string) => void;
  onSetCardTag?: (cardKey: string, tag: { player: string; mode: 'suspect' | 'not' } | null) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  me,
  allPlayers,
  otherPlayers,
  centralCards,
  questionLogs,
  activePlayerId,
  currentRound,
  playerCount,
  onAskPlayer,
  onGuessPlayer,
  onCycleCardTag,
  onToggleCardTagMode,
  onSetCardTag,
}) => {
  const effectivePlayerCount: 6 | 8 = playerCount || (allPlayers.length === 6 ? 6 : 8);
  const revealedCentralCount = centralCards.filter((c) => c.isRevealed).length;
  const hiddenCentralCount = centralCards.length - revealedCentralCount;

  return (
    <div className="space-y-6">
      {/* 1. Interactive Deduction Tracker */}
      <CardTrackerPanel
        me={me}
        allPlayers={allPlayers}
        centralCards={centralCards}
        playerCount={effectivePlayerCount}
        onSetTag={onSetCardTag || (() => {})}
        onCycleTag={onCycleCardTag}
        onToggleTagMode={onToggleCardTagMode}
      />

      {/* Character Roster Reference */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-4 shadow-md text-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-100 text-sm font-serif">
              Character Roster & Objectives
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Ram, Ravana, Laxmana & Sita Guaranteed</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          {/* Guaranteed 4 */}
          <div className="p-3 bg-[#151d2c] border border-slate-750 rounded-xl space-y-2">
            <div className="font-semibold text-slate-200 flex items-center justify-between">
              <span>⭐ Guaranteed in Every Game (4):</span>
              <span className="text-[10px] text-emerald-400 font-mono">Present</span>
            </div>
            <div className="space-y-1.5 text-slate-400">
              <div>
                <strong className="text-slate-200">Ram (Rama):</strong> Vanquish Ravana — Make a correct guess on Ravana (+8).
              </div>
              <div>
                <strong className="text-slate-200">Ravana:</strong> The Abductor — Both cards of Sita must be exposed by end (+8).
              </div>
              <div>
                <strong className="text-slate-200">Laxmana:</strong> Brother's Vow — Ram must have at least 1 hidden card at end (+5).
              </div>
              <div>
                <strong className="text-slate-200">Sita:</strong> The Unbroken Spirit — 1 card unrevealed (+5), both unrevealed (+8).
              </div>
            </div>
          </div>

          {/* Random Pool 4 */}
          <div className="p-3 bg-[#131926] border border-slate-800 rounded-xl space-y-2">
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>🎲 4 Dealt from Pool of 9:</span>
              <span className="text-[10px] text-slate-400 font-mono">In play</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Vibhishana (+10 partner exposed), Hanuman (+2 per correct guess player, max +8), Patakha (+8 if exposed by R2), Narada (+4 for 5+ public & 0 private Qs), Shabari (+2 per chosen suit guess, max +8), Angad (Gambits ±3), Jambavan (+2 per suit guessed, max +8), Sugriva (+2 per shared guess, max +6), Kumbhakarna (+2 per miss against self, max +6).
            </p>
          </div>
        </div>
      </div>

      {/* 2. Central Pile Board */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h3 className="text-base font-bold text-slate-100 font-serif tracking-wide">
              Central Pile ({centralCards.length} Cards)
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              · {revealedCentralCount} Revealed, {hiddenCentralCount} Hidden
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {effectivePlayerCount === 6 ? (
              <>
                {currentRound === 1 && 'Round 1: 5 cards revealed'}
                {currentRound === 2 && 'Round 2: +3 cards revealed (8 total)'}
                {currentRound === 3 && 'Round 3: +2 cards revealed (10 total)'}
                {currentRound === 4 && 'Round 4: 2 cards remain hidden'}
              </>
            ) : (
              <>
                {currentRound === 1 && 'Round 1: 6 cards revealed'}
                {currentRound === 2 && 'Round 2: +4 cards revealed (10 total)'}
                {currentRound === 3 && 'Round 3: +2 cards revealed (12 total)'}
                {currentRound === 4 && 'Round 4: 4 cards remain hidden'}
              </>
            )}
          </div>
        </div>

        {/* Central Cards Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-8 lg:grid-cols-16 gap-2 sm:gap-2.5 justify-items-center">
          {centralCards.map((card, idx) => (
            <div key={`central_${idx}`} className="flex flex-col items-center">
              <CardView
                card={card}
                isFaceDown={!card.isRevealed}
                size="sm"
                revealedInRound={card.revealedInRound}
                label={!card.isRevealed ? `#${idx + 1}` : undefined}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Table of Opponents with Revealed Info & Q&A Records */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-serif">
              Opponents at the Table ({otherPlayers.length} Players)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Review exposed cards and all revealed Q&A to deduce hidden hands
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {otherPlayers.map((p) => {
            const runningScore = computeRunningScore(p);
            const isProtected = p.lakshmanRekhaActiveThisRound;
            const isNagpash = p.nagpashBlockedThisRound;
            const hasGuessed = !!p.submittedGuess;

            // All questions asked to this player that are public OR that you privately asked them
            const visibleQuestions = questionLogs.filter(
              (q) => q.targetId === p.id && (q.isPublic || q.askerId === activePlayerId)
            );

            return (
              <div
                key={p.id}
                className={`bg-slate-900 border rounded-xl p-3.5 flex flex-col justify-between transition-all shadow-md ${
                  isProtected
                    ? 'border-amber-500/80 ring-1 ring-amber-400/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Player header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 p-0.5"
                      />
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.isBot && (
                            <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                              BOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-amber-300 font-mono font-medium">
                          {runningScore} pts
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasGuessed && (
                        <span
                          className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center"
                          title="Guess locked in for this round"
                        >
                          ✓
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1 text-[10px] mb-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Tokens: {p.questionTokens}
                    </span>
                  </div>

                  {/* Cards status */}
                  <div className="flex items-center justify-center gap-2 py-2 bg-slate-950/60 rounded-lg border border-slate-800/80 mb-2.5">
                    {p.cards.map((c, idx) => (
                      <div key={`opp_card_${idx}`} className="flex flex-col items-center">
                        <CardView
                          card={c}
                          isFaceDown={!c.isRevealed}
                          size="sm"
                          revealedInRound={c.revealedInRound}
                        />
                        <span className="text-[9px] mt-1 text-slate-400 font-medium">
                          {c.isRevealed ? (
                            <span className="text-red-400 font-bold">Exposed R{c.revealedInRound}</span>
                          ) : (
                            'Hidden'
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Revealed Q&A Info for this player */}
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 pb-1 border-b border-slate-800/80">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-amber-400" />
                        <span>Revealed Q&A ({visibleQuestions.length})</span>
                      </span>
                    </div>

                    {visibleQuestions.length === 0 ? (
                      <div className="text-[10px] text-slate-500 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 text-center">
                        No answers revealed yet for {p.name}.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-0.5">
                        {visibleQuestions.map((q) => {
                          const asker = allPlayers.find((a) => a.id === q.askerId);
                          return (
                            <div
                              key={q.id}
                              className={`p-1.5 rounded-lg text-[10px] border flex items-center justify-between gap-1.5 ${
                                q.isPublic
                                  ? 'bg-slate-950/80 border-slate-800'
                                  : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200'
                              }`}
                              title={`Round ${q.round} • Asked by ${asker?.name || 'Player'}: "${q.questionText}"`}
                            >
                              <span className="truncate text-slate-300 font-medium max-w-[160px]">
                                {q.questionText}
                              </span>
                              <span
                                className={`shrink-0 px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${
                                  q.answerBoolean
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {q.answerBoolean ? 'YES' : 'NO'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => onAskPlayer(p.id)}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <HelpCircle className="w-3 h-3 text-slate-400" />
                    <span>Ask</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onGuessPlayer(p.id)}
                    disabled={isProtected}
                    className="py-1.5 px-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-medium transition-all flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Target className="w-3 h-3" />
                    <span>Guess</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
