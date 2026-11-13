import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  CardPosition,
  Comparator,
  NumericMetric,
  Player,
  QuestionKind,
  QuestionRequest,
  Suit,
  ToggleQuestionType,
} from '../types/game';
import { METRIC_RANGES, SUITS, getMetricRanges } from '../game/constants';
import { validateQuestion } from '../game/questionValidator';

interface QuestionComposerProps {
  isOpen: boolean;
  asker: Player;
  otherPlayers: Player[];
  defaultTargetId?: string;
  initialTenHeads?: boolean;
  playerCount?: 6 | 8;
  onClose: () => void;
  onSubmit: (request: QuestionRequest) => void;
}

export const QuestionComposer: React.FC<QuestionComposerProps> = ({
  isOpen,
  asker,
  otherPlayers,
  defaultTargetId,
  initialTenHeads,
  playerCount = 8,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [targetId, setTargetId] = useState<string>(
    defaultTargetId || (otherPlayers.length > 0 ? otherPlayers[0].id : '')
  );
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [kind, setKind] = useState<QuestionKind>('suit_position');

  // Numeric state
  const [metric, setMetric] = useState<NumericMetric>('Sum');
  const [comparator, setComparator] = useState<Comparator>('=');
  const [numValue, setNumValue] = useState<number>(7);

  // Suit Position state
  const [cardPos, setCardPos] = useState<CardPosition>('higher');
  const [suitQuery, setSuitQuery] = useState<Suit>('Hearts');

  // Toggle state
  const [toggleType, setToggleType] = useState<ToggleQuestionType>(
    'Both cards are the same colour'
  );

  // Ten Heads state
  const hasTenHeads =
    asker.powerId === 'Ten Heads' &&
    (!asker.powerUsed || !!asker.tenHeadsArmed) &&
    !asker.powerDisabled;
  const [useTenHeads, setUseTenHeads] = useState<boolean>(
    initialTenHeads || !!asker.tenHeadsArmed || false
  );
  const [secondaryTargets, setSecondaryTargets] = useState<string[]>([]);

  const metricRanges = getMetricRanges(playerCount);
  const currentRange = metricRanges[metric];

  // Token calculations
  const normalUsedOnTarget = asker.baseQuestionsUsed?.[targetId] || 0;
  const normalRemaining =
    asker.normalQuestionTokens !== undefined
      ? asker.normalQuestionTokens
      : Math.max(0, asker.questionTokens - (asker.bonusTokensAvailable || 0));
  const bonusAvailable = asker.bonusTokensAvailable || 0;
  const canUseNormal = normalUsedOnTarget < 2 && normalRemaining > 0;
  const canUseBonus = bonusAvailable > 0;
  const targetNeedsBonus = normalUsedOnTarget >= 2;
  const canAskTarget = canUseNormal || canUseBonus;
  const selectedTargetPlayer = otherPlayers.find((p) => p.id === targetId);

  // Validation
  const draftRequest: QuestionRequest = {
    askerId: asker.id,
    targetId,
    isPublic: useTenHeads ? false : isPublic,
    kind,
    numericMetric: kind === 'numeric' ? metric : undefined,
    comparator: kind === 'numeric' ? comparator : undefined,
    numericValue: kind === 'numeric' ? numValue : undefined,
    cardPosition: kind === 'suit_position' ? cardPos : undefined,
    suitQuery: kind === 'suit_position' ? suitQuery : undefined,
    toggleType: kind === 'toggle' ? toggleType : undefined,
    secondaryTargetIds: useTenHeads ? secondaryTargets : undefined,
  };

  const validation = validateQuestion(draftRequest, playerCount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid || !canAskTarget || asker.questionTokens < 1) return;
    onSubmit(draftRequest);
    onClose();
  };

  const handleToggleSecondary = (id: string) => {
    if (secondaryTargets.includes(id)) {
      setSecondaryTargets(secondaryTargets.filter((t) => t !== id));
    } else {
      if (secondaryTargets.length < 2) {
        setSecondaryTargets([...secondaryTargets, id]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-600/40 rounded-2xl w-full max-w-xl text-amber-50 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">Compose Question</h3>
              <p className="text-xs text-slate-400">
                Cost: <span className="text-amber-400 font-bold">1 Token</span> • Balance:{' '}
                <span className="text-white font-medium">{asker.questionTokens}</span>{' '}
                <span className="text-slate-400">
                  ({normalRemaining} normal, {bonusAvailable} bonus)
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                Select Target Player:
              </label>
              <span className="text-[10px] text-slate-400">
                Max 2 normal questions per player
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {otherPlayers.map((p) => {
                const selected = p.id === targetId;
                const normalUsed = asker.baseQuestionsUsed?.[p.id] || 0;
                const atNormalLimit = normalUsed >= 2;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setTargetId(p.id)}
                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      selected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-md bg-slate-700 shrink-0" />
                      <span className="font-medium truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] w-full">
                      <span
                        className={`px-1.5 py-0.2 rounded font-medium ${
                          atNormalLimit
                            ? bonusAvailable > 0
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                              : 'bg-red-950 text-red-300 border border-red-500/30'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {atNormalLimit ? (bonusAvailable > 0 ? 'Needs Bonus' : 'Limit Reached') : `${normalUsed}/2 Normal`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ten Heads Option */}
          {hasTenHeads && (
            <div className="p-3.5 bg-gradient-to-r from-purple-950/60 to-slate-900 border-2 border-purple-500/50 rounded-xl space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <div>
                    <span className="font-bold text-purple-200 text-xs block">
                      Invoke Ten Heads Power (Target 3 Players for 1 Token)
                    </span>
                    <span className="text-[10px] text-purple-300/80">
                      Private question sent to 3 players simultaneously. Only you see the 3 answers.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={useTenHeads}
                  onChange={(e) => setUseTenHeads(e.target.checked)}
                  className="rounded border-purple-400 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {useTenHeads && (
                <div className="pt-2 border-t border-purple-500/30 text-xs text-purple-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-amber-300">
                      Pick 2 additional opponents ({secondaryTargets.length}/2 selected):
                    </span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      secondaryTargets.length === 2
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {secondaryTargets.length === 2 ? '3 Players Ready' : `Need ${2 - secondaryTargets.length} more`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {otherPlayers
                      .filter((p) => p.id !== targetId)
                      .map((p) => {
                        const isPicked = secondaryTargets.includes(p.id);
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => handleToggleSecondary(p.id)}
                            className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                              isPicked
                                ? 'bg-purple-600/40 border-purple-400 text-white ring-1 ring-purple-400 shadow-sm'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-md bg-slate-700 shrink-0" />
                            <div className="truncate text-[11px] font-medium flex-1">
                              {p.name}
                            </div>
                            <span className="text-xs font-bold text-purple-300">
                              {isPicked ? '✓' : '+'}
                            </span>
                          </button>
                        );
                      })}
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-purple-900/40">
                    Primary Target: <strong className="text-white">{selectedTargetPlayer?.name}</strong> • Secondary Targets: <strong className="text-purple-300">{secondaryTargets.map(id => otherPlayers.find(p => p.id === id)?.name).filter(Boolean).join(', ') || 'None yet'}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visibility Option */}
          {!useTenHeads && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                Question Visibility & Scoring:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                    isPublic
                      ? 'bg-[#182133] border-slate-600 text-slate-100 shadow-xs'
                      : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Eye className="w-4 h-4 text-slate-300" />
                  <span>Public (+1 Point to you)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-medium transition-all ${
                    !isPublic
                      ? 'bg-[#182133] border-slate-600 text-slate-100 shadow-xs'
                      : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <EyeOff className="w-4 h-4 text-slate-400" />
                  <span>Private (Secret to you)</span>
                </button>
              </div>
            </div>
          )}

          {/* Question Mode Tabs */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Question Type:
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setKind('suit_position')}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  kind === 'suit_position'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Suit Position
              </button>
              <button
                type="button"
                onClick={() => setKind('toggle')}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  kind === 'toggle'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Special Toggles
              </button>
              <button
                type="button"
                onClick={() => setKind('numeric')}
                className={`py-1.5 rounded-lg font-bold transition-all ${
                  kind === 'numeric'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Numeric Metric
              </button>
            </div>
          </div>

          {/* Mode 1: Suit Position */}
          {kind === 'suit_position' && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div>
                <span className="block text-slate-400 mb-1 font-medium">Which card?</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardPos('higher')}
                    className={`py-2 rounded-lg border font-bold ${
                      cardPos === 'higher'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Higher Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardPos('lower')}
                    className={`py-2 rounded-lg border font-bold ${
                      cardPos === 'lower'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    Lower Card
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-slate-400 mb-1 font-medium">Is of suit:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {SUITS.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSuitQuery(s)}
                      className={`py-2 rounded-lg border font-bold text-center ${
                        suitQuery === s
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-amber-300/80 italic">
                *Rule: If both cards have the same value, either card counts as the higher or lower card for this question.
              </p>
            </div>
          )}

          {/* Mode 2: Special Toggles */}
          {kind === 'toggle' && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="block text-slate-400 mb-2 font-medium">Select a direct condition:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  'Both cards are the same colour',
                  'Sum of both cards is odd',
                  'Sum of both cards is even',
                  'Both cards are odd',
                  'Both cards are even',
                  'Both red',
                  'Both black',
                  'Same suit',
                  'Same value',
                  'Consecutive values',
                ].map((t) => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setToggleType(t as ToggleQuestionType)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      toggleType === t
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Odd values: A (1), 3, 5, 7. Even values: 2, 4, 6, 8.
              </p>
            </div>
          )}

          {/* Mode 3: Numeric Metric */}
          {kind === 'numeric' && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Metric dropdown */}
                <div className="sm:col-span-1">
                  <label className="block text-slate-400 mb-1 font-medium">Metric:</label>
                  <select
                    value={metric}
                    onChange={(e) => {
                      const newM = e.target.value as NumericMetric;
                      setMetric(newM);
                      // Reset default number within range
                      const rng = metricRanges[newM];
                      if (numValue < rng.min || numValue > rng.max) {
                        setNumValue(Math.floor((rng.min + rng.max) / 2));
                      }
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    {Object.keys(metricRanges).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comparator */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Comparator:</label>
                  <select
                    value={comparator}
                    onChange={(e) => setComparator(e.target.value as Comparator)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-medium focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="!=">!=</option>
                  </select>
                </div>

                {/* Value input */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Value ({currentRange.min}–{currentRange.max}):
                  </label>
                  <input
                    type="number"
                    min={currentRange.min}
                    max={currentRange.max}
                    value={numValue}
                    onChange={(e) => setNumValue(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Range Validation pill */}
              <div className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400">
                  Allowed rule range for "{metric}":
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {currentRange.min} to {currentRange.max}
                </span>
              </div>
            </div>
          )}

          {/* Target Limit Feedback */}
          {!canAskTarget && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Target Normal Question Limit Reached</strong>
                <span>
                  You have already asked 2 normal questions to {selectedTargetPlayer?.name || 'this player'}. You must obtain a Bonus Question Token (from your Player tab for 3 points, or via powers) to ask them more questions.
                </span>
              </div>
            </div>
          )}

          {canAskTarget && targetNeedsBonus && canUseBonus && (
            <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <span>
                <strong>Consuming Bonus Token:</strong> You have asked 2 normal questions to {selectedTargetPlayer?.name || 'this player'}. This question will use 1 of your {bonusAvailable} Bonus Question Tokens.
              </span>
            </div>
          )}

          {/* Ten Heads Target Requirement Feedback */}
          {useTenHeads && secondaryTargets.length !== 2 && (
            <div className="p-2.5 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-200 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Ten Heads:</strong> Please select {2 - secondaryTargets.length} more opponent(s) to complete all 3 targets ({secondaryTargets.length + 1}/3 chosen).
              </span>
            </div>
          )}

          {/* Validation Feedback */}
          {!validation.isValid && (
            <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{validation.errorMessage}</span>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !validation.isValid ||
                !canAskTarget ||
                asker.questionTokens < 1 ||
                (useTenHeads && secondaryTargets.length !== 2)
              }
              className="px-5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 text-white font-medium text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {useTenHeads
                  ? 'Ask 3 Players for 1 Token (Ten Heads)'
                  : targetNeedsBonus
                  ? 'Ask Using Bonus Token'
                  : 'Ask & Deduct 1 Token'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
