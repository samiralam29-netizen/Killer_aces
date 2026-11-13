import React, { useState } from 'react';
import {
  X,
  Target,
  Sparkles,
  AlertTriangle,
  Check,
  Flame,
} from 'lucide-react';
import { CardValue, Player, Suit } from '../types/game';
import { CARD_VALUES, SUITS, SUIT_COLORS, VALUE_LABELS } from '../game/constants';

interface GuessModalProps {
  isOpen: boolean;
  guesser: Player;
  otherPlayers: Player[];
  defaultTargetId?: string;
  currentRound: number;
  playerCount?: 6 | 8;
  onClose: () => void;
  onSubmitGuess: (
    targetPlayerId: string,
    suit: Suit,
    value: CardValue,
    isGambit?: boolean
  ) => void;
}

export const GuessModal: React.FC<GuessModalProps> = ({
  isOpen,
  guesser,
  otherPlayers,
  defaultTargetId,
  currentRound,
  playerCount = 8,
  onClose,
  onSubmitGuess,
}) => {
  if (!isOpen) return null;

  const existing = guesser.submittedGuess;
  const [targetId, setTargetId] = useState<string>(
    defaultTargetId || existing?.targetPlayerId || otherPlayers[0]?.id || ''
  );
  const [suit, setSuit] = useState<Suit>(existing?.suit || 'Hearts');
  const [value, setValue] = useState<CardValue>(existing?.value || 1);
  const [isGambit, setIsGambit] = useState<boolean>(existing?.isGambit || false);

  const isAngad = guesser.characterId === 'Angad';
  const angadCanGambit = isAngad && (guesser.angadGambitsUsed < 3 || existing?.isGambit);

  const targetPlayer = otherPlayers.find((p) => p.id === targetId);
  const isTargetProtected = targetPlayer?.lakshmanRekhaActiveThisRound;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || isTargetProtected) return;
    onSubmitGuess(targetId, suit, value, isGambit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-orange-500/40 rounded-2xl w-full max-w-lg text-amber-50 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-950 border border-orange-500/40 text-orange-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">
                {existing ? 'Edit Submitted Guess' : `Submit Round ${currentRound} Guess`}
              </h3>
              <p className="text-xs text-slate-400">
                Identifies 1 player, 1 suit, and 1 value. Resolved simultaneously.
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
          {/* Target Player */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Select Target Opponent:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {otherPlayers.map((p) => {
                const selected = p.id === targetId;
                const protectedByRekha = p.lakshmanRekhaActiveThisRound;
                return (
                  <button
                    type="button"
                    key={p.id}
                    disabled={protectedByRekha}
                    onClick={() => setTargetId(p.id)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      protectedByRekha
                        ? 'opacity-40 bg-slate-900 border-slate-800 cursor-not-allowed'
                        : selected
                        ? 'bg-orange-500/20 border-orange-500 text-orange-200 ring-1 ring-orange-500'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-md bg-slate-700" />
                    <div className="truncate">
                      <div className="font-medium truncate">{p.name}</div>
                      {protectedByRekha && (
                        <div className="text-[9px] text-amber-400 font-semibold">Protected</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suit Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Card Suit:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SUITS.map((s) => {
                const isRed = SUIT_COLORS[s] === 'red';
                const selected = suit === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSuit(s)}
                    className={`py-2 px-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
                      selected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 ' +
                          (isRed ? 'text-red-400' : 'text-slate-200')
                    }`}
                  >
                    <span>{s === 'Hearts' ? '♥' : s === 'Diamonds' ? '♦' : s === 'Clubs' ? '♣' : '♠'}</span>
                    <span>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
              Card Value (A to {playerCount === 6 ? 6 : 8}):
            </label>
            <div className={`grid gap-1.5 ${playerCount === 6 ? 'grid-cols-6' : 'grid-cols-8'}`}>
              {CARD_VALUES.filter((v) => v <= (playerCount === 6 ? 6 : 8)).map((v) => {
                const selected = value === v;
                return (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setValue(v)}
                    className={`py-2 rounded-xl border font-mono font-bold text-base transition-all ${
                      selected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {VALUE_LABELS[v]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Angad Gambit Option */}
          {isAngad && (
            <div className="p-3.5 bg-gradient-to-r from-purple-950/70 via-slate-900 to-purple-950/70 border-2 border-purple-500/60 rounded-xl space-y-2 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-400 text-purple-300 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block font-serif">
                      Angad's Heroic Gambit
                    </span>
                    <span className="text-[10px] text-purple-300">
                      {3 - guesser.angadGambitsUsed > 0
                        ? `${3 - guesser.angadGambitsUsed} of 3 Gambits remaining`
                        : 'All 3 Gambits used'}
                    </span>
                  </div>
                </div>
                <label className="flex items-center gap-2 bg-purple-900/60 hover:bg-purple-800/80 px-3 py-1.5 rounded-lg border border-purple-400/50 cursor-pointer transition-all">
                  <span className="text-xs font-bold text-purple-100">
                    {isGambit ? 'Gambit Active!' : 'Enable Gambit'}
                  </span>
                  <input
                    type="checkbox"
                    disabled={!angadCanGambit}
                    checked={isGambit}
                    onChange={(e) => setIsGambit(e.target.checked)}
                    className="rounded border-purple-400 text-purple-500 focus:ring-purple-400 w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
              <p className="text-[11px] text-purple-200/90 leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-purple-900/40">
                Marking this guess as a Gambit risks points on conviction: <strong className="text-emerald-300 font-bold">+3 bonus</strong> if correct, but <strong className="text-red-300 font-bold">−3 penalty</strong> if incorrect!
              </p>
            </div>
          )}

          {/* Partner Notice reminder */}
          <div className="p-2.5 bg-[#0e1320] rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-200">Secret Partner Rule:</span> If this guess hits your secret partner, you privately discover their identity, 0 points are awarded, and the card remains hidden.
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!targetId || isTargetProtected}
              className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white font-medium text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{existing ? 'Update Guess' : 'Lock in Guess'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
