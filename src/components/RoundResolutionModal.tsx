import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight,
  X,
  Sparkles,
  Users,
} from 'lucide-react';
import { GuessResolutionResult, Player } from '../types/game';
import { CardView } from './CardView';

interface RoundResolutionModalProps {
  isOpen: boolean;
  result?: GuessResolutionResult;
  players: Player[];
  activePlayerId: string;
  isHost: boolean;
  isGameOver: boolean;
  currentRound: number;
  onClose: () => void;
  onAdvanceRound?: () => void;
}

export const RoundResolutionModal: React.FC<RoundResolutionModalProps> = ({
  isOpen,
  result,
  players,
  activePlayerId,
  isHost,
  isGameOver,
  currentRound,
  onClose,
  onAdvanceRound,
}) => {
  if (!isOpen || !result) return null;

  // Filter ONLY correct guesses and private partner hits (No incorrect guess announcement)
  const announcedResolutions = result.resolutions.filter((r) => {
    if (r.isPartnerHit) {
      // Private to the guesser only
      return r.guesserId === activePlayerId;
    }
    return r.isCorrect;
  });

  const nextRoundNumber = currentRound < 4 ? currentRound + 1 : 4;
  const activePlayer = players.find((p) => p.id === activePlayerId);
  const isKumbhakarna = activePlayer?.characterId === 'Kumbhakarna';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111724] border border-slate-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0e1320] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base font-serif">
                Round {result.round} Resolution
              </h3>
              <p className="text-xs text-slate-400">
                Only correct guesses and card reveals are announced publicly
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

        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Kumbhakarna Round Announcement - PRIVATE: Only visible to Kumbhakarna so opponents cannot deduce their identity */}
          {isKumbhakarna && result.kumbhakarnaRoundPoints.length > 0 && result.kumbhakarnaRoundPoints[0].pointsThisRound > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-purple-950/70 to-indigo-950/70 border border-purple-500/50 rounded-xl flex items-center gap-3 shadow-md">
              <span className="text-2xl">💤</span>
              <div>
                <div className="font-bold text-purple-200 text-sm">
                  Kumbhakarna's Slumber Bonus Revealed!
                </div>
                <p className="text-purple-300 text-xs mt-0.5">
                  Kumbhakarna earned{' '}
                  <strong className="text-amber-300">
                    +{result.kumbhakarnaRoundPoints[0].pointsThisRound} points
                  </strong>{' '}
                  this round from incorrect guesses against their cards (Total accumulated bonus:{' '}
                  {result.kumbhakarnaRoundPoints[0].totalSoFar}/6).
                </p>
              </div>
            </div>
          )}

          {/* Correct Guesses List */}
          <div>
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Correct Guesses & Card Reveals</span>
            </h4>

            {announcedResolutions.length === 0 ? (
              <div className="p-5 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">No cards were exposed this round.</p>
                <p className="text-[11px] text-slate-500">
                  Guesses that did not match an opponent card remain secret with no announcements.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {announcedResolutions.map((res, idx) => {
                  const guesser = players.find((p) => p.id === res.guesserId);
                  const target = players.find((p) => p.id === res.targetPlayerId);

                  return (
                    <div
                      key={`res_${idx}`}
                      className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                        res.isPartnerHit
                          ? 'bg-amber-950/40 border-amber-500/50'
                          : 'bg-emerald-950/30 border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={guesser?.avatar}
                          alt={guesser?.name}
                          className="w-7 h-7 rounded-lg bg-slate-800"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{guesser?.name}</span>
                            <span className="text-slate-400 font-normal">correctly guessed</span>
                            <span className="text-amber-300 font-semibold">{target?.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {res.value === 1 ? 'A' : res.value} of {res.suit}
                            {res.isGambit && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-sans font-bold border border-purple-500/30">
                                Gambit (+3)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {res.isPartnerHit ? (
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Partner Hit (0 pts)
                            </span>
                            <div className="text-[10px] text-amber-200 mt-0.5">
                              Private: {target?.name} is your partner! Card stays hidden.
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Correct (+{res.pointsAwarded} pts)
                            </span>
                            {res.splitWithGuesserIds && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Split with {res.splitWithGuesserIds.length} other player(s)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cards Exposed this round */}
          {result.revealedCards.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Cards Exposed This Round</span>
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {result.revealedCards.map((rc, idx) => {
                  const owner = players.find((p) => p.id === rc.playerId);
                  return (
                    <div
                      key={`rev_${idx}`}
                      className="flex items-center gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800"
                    >
                      <CardView card={rc.card} isFaceDown={false} size="sm" />
                      <div className="text-xs">
                        <div className="font-bold text-white">{owner?.name}</div>
                        <div className="text-[10px] text-red-400 font-semibold uppercase">Exposed Card</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            Back to Table
          </button>

          {isHost && onAdvanceRound && (
            <button
              type="button"
              onClick={() => {
                onAdvanceRound();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
            >
              <span>
                {currentRound >= 4 ? 'Finalize Game & View Scores' : `Move to Round ${nextRoundNumber}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {!isHost && (
            <span className="text-xs text-slate-400 italic">
              Review table notes. Host will advance to the next round.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

