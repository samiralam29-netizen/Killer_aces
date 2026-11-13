import React from 'react';
import {
  X,
  Target,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  HelpCircle,
} from 'lucide-react';
import { Player } from '../types/game';
import { SUIT_COLORS, SUIT_SYMBOLS } from '../game/constants';

interface SubmittedGuessesModalProps {
  isOpen: boolean;
  players: Player[];
  currentRound: number;
  isHost: boolean;
  roundGuessesResolved: boolean;
  onClose: () => void;
  onResolveRound?: () => void;
  onAdvanceRound?: () => void;
  onSimulateBots?: () => void;
}

export const SubmittedGuessesModal: React.FC<SubmittedGuessesModalProps> = ({
  isOpen,
  players,
  currentRound,
  isHost,
  roundGuessesResolved,
  onClose,
  onResolveRound,
  onAdvanceRound,
  onSimulateBots,
}) => {
  if (!isOpen) return null;

  const submittedList = players
    .filter((p) => p.submittedGuess !== undefined)
    .map((p) => ({
      guesser: p,
      guess: p.submittedGuess!,
      target: players.find((t) => t.id === p.submittedGuess!.targetPlayerId)!,
    }));

  const pendingList = players.filter(
    (p) => p.submittedGuess === undefined && !p.nagpashBlockedThisRound
  );

  const blockedList = players.filter((p) => p.nagpashBlockedThisRound);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111724] border border-slate-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0e1320] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center shadow-xs">
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base font-serif">
                  Submitted Round {currentRound} Guesses
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  · {submittedList.length}/8 Locked In
                </span>
              </div>
              <p className="text-xs text-slate-400">
                All submitted guesses for this round. Guesses remain unverified until resolution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Table"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Submitted Guesses List */}
          <div>
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Locked-In Guesses ({submittedList.length})</span>
            </h4>

            {submittedList.length === 0 ? (
              <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400">
                No guesses have been submitted yet for Round {currentRound}.
              </div>
            ) : (
              <div className="space-y-2">
                {submittedList.map(({ guesser, guess, target }) => {
                  const suitColor = SUIT_COLORS[guess.suit];
                  const suitSymbol = SUIT_SYMBOLS[guess.suit];
                  const valDisplay = guess.value === 1 ? 'A' : guess.value;

                  return (
                    <div
                      key={guesser.id}
                      className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={guesser.avatar}
                          alt={guesser.name}
                          className="w-8 h-8 rounded-lg bg-slate-800 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{guesser.name}</span>
                            <span className="text-slate-400 font-normal">guesses</span>
                            <span className="text-amber-300 font-semibold">{target?.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>Target Card:</span>
                            <span className={`font-bold font-mono ${suitColor}`}>
                              {valDisplay} {suitSymbol} {guess.suit}
                            </span>
                            {guess.isGambit && (
                              <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                Angad Gambit (±3)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Submitted</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Players */}
          {pendingList.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Pending Submissions ({pendingList.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {pendingList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-400"
                  >
                    <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-md bg-slate-800" />
                    <span>{p.name}</span>
                    {p.isBot && <span className="text-[10px] text-indigo-400 font-mono">(Bot)</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocked by Nagpash */}
          {blockedList.length > 0 && (
            <div>
              <h4 className="font-semibold text-rose-400 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Blocked by Nagpash ({blockedList.length})</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {blockedList.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-rose-400">(Cannot Guess)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Back to Table
          </button>

          <div className="flex items-center gap-2">
            {isHost && onSimulateBots && pendingList.some((p) => p.isBot) && (
              <button
                type="button"
                onClick={onSimulateBots}
                className="px-3.5 py-2 rounded-xl bg-indigo-950 border border-indigo-500/40 hover:bg-indigo-900 text-indigo-200 font-semibold text-xs transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Simulate Bots</span>
              </button>
            )}

            {isHost && onResolveRound && !roundGuessesResolved && (
              <button
                type="button"
                onClick={() => {
                  onResolveRound();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Resolve Guesses ({submittedList.length}/8)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {isHost && onAdvanceRound && roundGuessesResolved && (
              <button
                type="button"
                onClick={() => {
                  onAdvanceRound();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>
                  {currentRound >= 4 ? 'Finalize Game & View Scores' : `Advance to Round ${currentRound + 1}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
