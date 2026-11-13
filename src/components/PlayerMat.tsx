import React from 'react';
import {
  Shield,
  Zap,
  HelpCircle,
  Target,
  PlusCircle,
  AlertTriangle,
  Flame,
  Award,
  Lock,
  Crown,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HeartHandshake,
  MessageSquare,
  CheckCircle,
  XCircle,
  Users,
  FlaskConical,
} from 'lucide-react';
import { Player, PlayingCard, QuestionLogEntry, Suit } from '../types/game';
import { CHARACTER_DEFS, POWER_DEFS, SUITS, SUIT_COLORS, SUIT_SYMBOLS } from '../game/constants';
import { CardView } from './CardView';
import { computeRunningScore, evaluateCharacterObjective } from '../game/scoring';

interface PlayerMatProps {
  player: Player;
  allPlayers: Player[];
  centralCards: PlayingCard[];
  questionLogs?: QuestionLogEntry[];
  sugrivaSharedCount: number;
  currentRound: number;
  baseGuessPoints?: number;
  isHost?: boolean;
  roundGuessesResolved?: boolean;
  onOpenQuestionModal: () => void;
  onOpenGuessModal: () => void;
  onOpenPowerModal: () => void;
  onBuyBonusToken: () => void;
  onSelectShabariSuit: (suit: Suit) => void;
  onOpenSubmittedGuesses?: () => void;
  onOpenPowerLab?: () => void;
  onOpenQuestionWithTenHeads?: () => void;
  // Host facilitator actions (facilitator controls directly on host's screen)
  onResolveRound?: () => void;
  onAdvanceRound?: () => void;
  onSimulateBots?: () => void;
  onNewGame?: () => void;
}

export const PlayerMat: React.FC<PlayerMatProps> = ({
  player,
  allPlayers,
  centralCards,
  questionLogs = [],
  sugrivaSharedCount,
  currentRound,
  baseGuessPoints = 0,
  isHost = false,
  roundGuessesResolved = false,
  onOpenQuestionModal,
  onOpenGuessModal,
  onOpenPowerModal,
  onBuyBonusToken,
  onSelectShabariSuit,
  onOpenSubmittedGuesses,
  onOpenPowerLab,
  onOpenQuestionWithTenHeads,
  onResolveRound,
  onAdvanceRound,
  onSimulateBots,
  onNewGame,
}) => {
  const charDef = CHARACTER_DEFS[player.characterId];
  const powerDef = POWER_DEFS[player.powerId];
  const runningScore = computeRunningScore(player, baseGuessPoints);
  const evaluatedObj = evaluateCharacterObjective(
    player,
    allPlayers,
    sugrivaSharedCount
  );
  const currentPotentialObjPoints = player.objectivePotentialPoints !== undefined
    ? player.objectivePotentialPoints
    : evaluatedObj.points;
  const objProgress = player.objectiveProgress || evaluatedObj.explanation;

  const hasSubmittedGuess = !!player.submittedGuess;
  const partnerPlayer = allPlayers.find((p) => p.id === player.secretPartnerId);
  const submittedCount = allPlayers.filter((p) => p.submittedGuess !== undefined).length;

  const questionsToMe = questionLogs.filter((q) => q.targetId === player.id);
  const questionsByMe = questionLogs.filter((q) => q.askerId === player.id);

  return (
    <div className="space-y-4">
      {/* Host Facilitator Bar (Rendered directly on host's player screen) */}
      {isHost && (
        <div className="bg-[#141b29] border border-slate-700/80 rounded-xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 font-bold flex items-center justify-center shadow-xs">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                <span>Host Facilitator Controls</span>
                <span className="text-[10px] text-amber-400 font-medium">
                  Active Host
                </span>
                {roundGuessesResolved && (
                  <span className="text-[10px] text-emerald-400 font-medium">
                    · Round {currentRound} Resolved
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Facilitate the game directly from your player mat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenSubmittedGuesses && (
              <button
                type="button"
                onClick={onOpenSubmittedGuesses}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition-all shadow-xs flex items-center gap-1.5"
                title="View all submitted guesses for this round without spoilers"
              >
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>Pending Guesses ({submittedCount}/8)</span>
              </button>
            )}

            {onSimulateBots && (
              <button
                type="button"
                onClick={onSimulateBots}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 font-medium transition-all shadow-xs flex items-center gap-1.5"
                title="Automatically submit guesses and questions for all bot players"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Simulate Bots</span>
              </button>
            )}

            {onResolveRound && !roundGuessesResolved && (
              <button
                type="button"
                onClick={onResolveRound}
                className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium transition-all shadow-sm flex items-center gap-1.5"
                title="Resolve all submitted guesses and expose correct cards"
              >
                <span>Resolve Guesses ({submittedCount}/8)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onAdvanceRound && roundGuessesResolved && (
              <button
                type="button"
                onClick={onAdvanceRound}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition-all shadow-sm flex items-center gap-1.5"
                title="Advance to next round and reveal scheduled central cards"
              >
                <span>
                  {currentRound >= 4 ? 'Finalize Game & View Scores' : `Move to Round ${currentRound + 1}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onNewGame && (
              <button
                type="button"
                onClick={onNewGame}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-1"
                title="Reset game to Round 1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Player Screen Box */}
      <div className="bg-[#111724] border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-100 shadow-xl relative overflow-hidden">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={player.avatar}
              alt={player.name}
              className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 p-0.5 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-slate-100">{player.name}</h2>
                <span className="text-[10px] font-semibold text-emerald-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-750">
                  Your Screen
                </span>
                {isHost && (
                  <span className="text-[10px] font-semibold text-amber-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-750">
                    Host
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Running Score:</span>
                <span className="font-mono font-bold text-slate-100 text-sm">{runningScore} pts</span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-slate-300">
                  Question Tokens: <strong className="text-slate-100">{player.questionTokens}</strong>
                  <span className="text-slate-400 text-[10px] ml-1">
                    ({player.normalQuestionTokens ?? (player.questionTokens - (player.bonusTokensAvailable || 0))} normal, {player.bonusTokensAvailable || 0} bonus)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons for Player */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onBuyBonusToken}
              disabled={runningScore < 3}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
              title={
                runningScore < 3
                  ? 'Points cannot go negative! You need at least 3 points to purchase a bonus token.'
                  : 'Buy a Bonus Question Token for −3 score penalty (allows asking more than 2 questions to any target player)'
              }
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Buy Bonus Token (−3 pts)</span>
            </button>

            <button
              onClick={onOpenQuestionModal}
              disabled={player.questionTokens < 1}
              className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask Question ({player.questionTokens} left)</span>
            </button>

            <button
              onClick={onOpenGuessModal}
              disabled={player.nagpashBlockedThisRound}
              className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition-all flex items-center gap-1.5 shadow-xs ${
                hasSubmittedGuess
                  ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                  : 'bg-rose-700 hover:bg-rose-600 text-white'
              } ${player.nagpashBlockedThisRound ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{hasSubmittedGuess ? 'Edit Submitted Guess' : 'Submit Round Guess'}</span>
            </button>
          </div>
        </div>

        {/* Partner Suits & Secrets Banner */}
        <div className="mt-3.5 p-3 bg-[#151d2c] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 font-medium">Your Partner's Secret Suits: </span>
              <span className="font-semibold text-slate-100 text-sm">
                {player.partnerSuits ? `${player.partnerSuits[0]} and ${player.partnerSuits[1]}` : 'Unknown'}
              </span>
              {player.partnerKnownToMe && partnerPlayer ? (
                <span className="ml-2 font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                  — Partner Identified: {partnerPlayer.name}!
                </span>
              ) : (
                <span className="ml-2 text-slate-400 text-[11px] italic">
                  (Who holds these suits is secret until discovered!)
                </span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Starting Budget: 10 Tokens
          </div>
        </div>

        {/* Warnings & In-round banners */}
        {player.nagpashBlockedThisRound && (
          <div className="mt-3 p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl flex items-center gap-2 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Nagpash Ensnarement:</strong> You cannot submit a guess this round. Your questions and discussions remain active.
            </span>
          </div>
        )}

        {player.lakshmanRekhaActiveThisRound && (
          <div className="mt-3 p-2.5 bg-amber-950/80 border border-amber-500/50 rounded-xl flex items-center gap-2 text-xs text-amber-200">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Lakshman Rekha Active:</strong> No player can submit a guess against your cards this round!
            </span>
          </div>
        )}

        {player.hanumanExtraGuessAvailable && (
          <div className="mt-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs text-emerald-200">
            <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Hanuman's Leap Bonus:</strong> You receive an extra guess opportunity this round due to your previous miss!
            </span>
          </div>
        )}

        {/* Main Grid: Hand, Character, Power */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* Your 2 Cards (3 cols) */}
          <div className="lg:col-span-3 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Your Secret Hand
              </span>
              <span className="text-[10px] text-slate-400">
                {player.cards.filter((c) => !c.isRevealed).length} hidden
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 py-2">
              {player.cards.map((card, idx) => (
                <div key={card.id || `own_c_${idx}`} className="flex flex-col items-center">
                  <CardView card={card} isFaceDown={false} size="md" />
                  <span className="text-[10px] mt-1 font-medium text-slate-400">
                    {card.isRevealed ? (
                      <span className="text-red-400 font-bold">Exposed R{card.revealedInRound}</span>
                    ) : (
                      <span className="text-emerald-400">Unrevealed</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80 text-center">
              Survival: 1 unrevealed = +2 pts; both = +5 pts
            </div>
          </div>

          {/* Character Card & Private Objective (5 cols) */}
          <div className="lg:col-span-5 bg-[#141b29] border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    Character Card
                  </span>
                  <span className="text-sm font-bold text-slate-100 font-serif">{charDef.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {charDef.isMandatory && (
                    <span className="text-[10px] text-amber-400 font-medium">
                      ⭐ Core (Guaranteed)
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-normal">
                    · {charDef.title}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 italic mb-2">"{charDef.lore}"</p>

              <div className="bg-[#182133] border border-slate-700/70 rounded-lg p-2.5 mb-2.5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider flex items-center justify-between">
                  <span>Secret Objective:</span>
                  {charDef.isMandatory && (
                    <span className="text-[10px] text-emerald-400 font-normal">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-200 font-medium mt-0.5">
                  {charDef.objectiveSummary}
                </p>
              </div>

              {/* Real-time private objective tracker */}
              <div className="bg-[#0e1320] border border-slate-800 rounded-lg p-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Your Objective Status:</span>
                  <span className="text-[11px] font-semibold text-slate-200">
                    {charDef.id === 'Angad'
                      ? `${player.angadGambitsUsed}/3 Gambits`
                      : `+${currentPotentialObjPoints} pts (at end)`}
                  </span>
                </div>
                <p className="text-xs text-emerald-400 font-mono">{objProgress}</p>

                {/* Shabari suit selector */}
                {player.characterId === 'Shabari' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-300">Chosen Suit:</span>
                    <div className="flex gap-1">
                      {SUITS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => onSelectShabariSuit(s)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                            player.shabariChosenSuit === s
                              ? 'bg-slate-200 text-slate-900 shadow-xs'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Angad Gambit Explainer */}
                {player.characterId === 'Angad' && (
                  <div className="mt-2.5 p-2 rounded-lg bg-slate-850 border border-slate-750 text-[11px] text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                        <span>Angad's Gambit:</span>
                      </span>
                      <span className="font-mono text-slate-300 font-semibold">
                        {3 - player.angadGambitsUsed} left
                      </span>
                    </div>
                    <p className="leading-relaxed text-slate-400">
                      To use a Gambit, open <strong>"Submit Round Guess"</strong> and check the <strong>Angad's Gambit</strong> box. Correct: <strong className="text-emerald-400">+3</strong>; Miss: <strong className="text-rose-400">−3</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-right">
              *Objective points remain secret and are calculated at the end of Round 4.
            </p>
          </div>

          {/* Power Card (4 cols) */}
          <div className="lg:col-span-4 bg-[#141b29] border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  Power Card
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                    player.powerDisabled
                      ? 'bg-red-950/60 text-red-300 border border-red-500/40'
                      : player.powerUsed
                      ? 'bg-slate-800 text-slate-500 border border-slate-700'
                      : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {player.powerDisabled ? 'Disabled' : player.powerUsed ? 'Used' : 'Ready'}
                </span>
              </div>

              <h3 className="font-bold text-slate-100 text-sm">{powerDef.name}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {powerDef.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              {powerDef.isAutomatic ? (
                <div className="text-[11px] text-slate-400 bg-slate-850 p-2 rounded-lg border border-slate-750 text-center font-medium">
                  Passive / Triggers automatically on first incorrect guess.
                </div>
              ) : player.powerId === 'Ten Heads' && !player.powerUsed && !player.powerDisabled ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={onOpenQuestionWithTenHeads || onOpenPowerModal}
                    className="w-full py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-medium text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Ask 3 Players for 1 Token (Ten Heads)</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenPowerModal}
                    className="w-full py-1 text-[11px] text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                  >
                    View Ten Heads Details
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPowerModal}
                  disabled={player.powerUsed || player.powerDisabled}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-40 text-slate-100 font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {player.powerDisabled
                      ? 'Power Disabled'
                      : player.powerUsed
                      ? 'Already Used'
                      : `Activate ${powerDef.name}`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submitted Guess Status bar */}
        {player.submittedGuess && (
          <div className="mt-3 p-3 bg-[#141b29] border border-slate-700/80 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Locked Guess for Round {currentRound}:</span>
              <span className="font-medium text-slate-100">
                Target: {allPlayers.find((p) => p.id === player.submittedGuess?.targetPlayerId)?.name} •{' '}
                {player.submittedGuess.value === 1 ? 'A' : player.submittedGuess.value} of{' '}
                {player.submittedGuess.suit}
              </span>
              {player.submittedGuess.isGambit && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                  Gambit Active
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onOpenGuessModal}
              className="text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
            >
              Change / Edit Guess
            </button>
          </div>
        )}
      </div>

      {/* Player Q&A Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Questions Asked to You */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm font-serif">
                  Questions Asked to You
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">
                {questionsToMe.length} received
              </span>
            </div>

            {questionsToMe.length === 0 ? (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 italic">
                No players have questioned your hand yet this game.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {questionsToMe.map((q) => {
                  const asker = allPlayers.find((p) => p.id === q.askerId);
                  return (
                    <div
                      key={q.id}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                        q.isPublic
                          ? 'bg-slate-950/70 border-slate-800'
                          : 'bg-indigo-950/30 border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{asker?.name || 'Opponent'}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                              q.isPublic
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-indigo-900/60 text-indigo-300'
                            }`}
                          >
                            {q.isPublic ? 'Public' : 'Private'}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Round {q.round}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">{q.questionText}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-400">Your Answer:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            q.answerBoolean
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {q.answerBoolean ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Questions You Asked */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm font-serif">
                  Questions You Asked
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold">
                {questionsByMe.length} asked
              </span>
            </div>

            {questionsByMe.length === 0 ? (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-400 italic">
                You haven't asked any questions yet. Use your Question Tokens to investigate!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {questionsByMe.map((q) => {
                  const target = allPlayers.find((p) => p.id === q.targetId);
                  return (
                    <div
                      key={q.id}
                      className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                        q.isPublic
                          ? 'bg-slate-950/70 border-slate-800'
                          : 'bg-indigo-950/30 border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          <span>Target: {target?.name || 'Player'}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold ${
                              q.isPublic
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-indigo-900/60 text-indigo-300'
                            }`}
                          >
                            {q.isPublic ? 'Public (+1 pt)' : 'Private'}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Round {q.round}
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">{q.questionText}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                        <span className="text-slate-400">{target?.name}'s Answer:</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            q.answerBoolean
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {q.answerBoolean ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
