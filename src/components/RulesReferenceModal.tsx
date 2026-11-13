import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Award,
  Zap,
  HelpCircle,
  Clock,
  Shield,
  Target,
  FlaskConical,
} from 'lucide-react';
import { CHARACTER_DEFS, POWER_DEFS, METRIC_RANGES } from '../game/constants';

interface RulesReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPowerLab?: () => void;
}

export const RulesReferenceModal: React.FC<RulesReferenceModalProps> = ({
  isOpen,
  onClose,
  onOpenPowerLab,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'characters' | 'powers' | 'questions' | 'scoring' | 'schedule'>('characters');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f1420] border border-slate-800 rounded-2xl w-full max-w-4xl text-slate-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#141b29] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 text-amber-400 flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">
                BLINDS · Rulebook & Dossier
              </h3>
              <p className="text-xs text-slate-400">
                Authoritative reference guide for characters, powers, questions & scoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-[#0a0e17] border-b border-slate-800 text-xs overflow-x-auto">
          {[
            { id: 'characters', label: '13 Characters', icon: Award },
            { id: 'powers', label: '12 Powers', icon: Zap },
            { id: 'questions', label: 'Questions & Limits', icon: HelpCircle },
            { id: 'scoring', label: 'Scoring Rules', icon: Target },
            { id: 'schedule', label: 'Rounds & Timer', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#1e2738] text-white border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {activeTab === 'characters' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#141b29] border border-slate-750 rounded-xl text-slate-300">
                <strong className="text-white">Character Distribution:</strong> 8 characters in each game. Always includes Rama, Ravana, Lakshmana, and Sita, plus 4 randomly chosen from the remaining 9. Ravana is never Rama's partner. Points are added at game end only.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(CHARACTER_DEFS).map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-[#141b29] border border-slate-800 rounded-xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm font-serif">{c.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                        {c.title}
                      </span>
                    </div>
                    <p className="text-slate-400 italic text-[11px]">"{c.lore}"</p>
                    <div className="bg-[#0e1320] p-2 rounded-lg border border-slate-800 text-slate-300 font-medium text-[11px]">
                      {c.objectiveSummary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'powers' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#141b29] border border-slate-750 rounded-xl text-slate-300 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs">
                  <strong className="text-white">Power Distribution & Partner Rules:</strong> 8 unique powers dealt from the 12-power pool. All powers are one-use. For powers selecting a non-partner (Secret of Lanka, Brahma Gyan), targeting a partner reveals only their partner status.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.values(POWER_DEFS).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm font-serif">{p.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {p.isAutomatic ? 'Passive' : 'Action'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#141b29] border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-sm">Suit of a Card Questions:</h4>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li>Is your higher card a [suit]?</li>
                  <li>Is your lower card a [suit]?</li>
                  <li><em className="text-slate-400">Rule: If both cards have the same value, either card counts as higher or lower card.</em></li>
                </ul>
              </div>

              <div className="p-3.5 bg-[#141b29] border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white text-sm">Strict Metric Number Limits (Blocked if outside):</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(METRIC_RANGES).map(([m, rng]) => (
                    <div key={m} className="p-2 bg-[#0e1320] rounded-lg border border-slate-800">
                      <span className="font-semibold text-white block truncate">{m}</span>
                      <span className="text-slate-300 font-mono text-[11px]">{rng.min}–{rng.max}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#141b29] border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-white text-sm">Correct Guess Points:</h4>
                  <ul className="space-y-1 text-slate-300">
                    <li>Round 1: +10 pts</li>
                    <li>Round 2: +8 pts</li>
                    <li>Round 3: +6 pts</li>
                    <li>Round 4: +4 pts</li>
                    <li className="text-slate-400 text-[11px] mt-1">
                      *Split points if multiple players make the exact same correct guess in a round.
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 bg-[#141b29] border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-white text-sm">Partner Knowledge & Suits:</h4>
                  <p className="text-slate-300">
                    At setup, you privately learn the <strong>suits of your secret partner's two cards</strong> (e.g. Hearts and Spades), but not who holds them!
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                    <li>Accidental guess on partner reveals partner identity privately.</li>
                    <li>0 points awarded for guessing partner; card remains hidden.</li>
                    <li>Partner survival gives +2 pts (1 card) or +3 pts (both cards).</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-[#141b29] border border-slate-800 rounded-xl space-y-2">
                  <h4 className="font-bold text-white text-sm">Tokens & Questions:</h4>
                  <ul className="space-y-1 text-slate-300">
                    <li><strong>Starting Budget: 10 Question Tokens</strong> for the entire game</li>
                    <li>Public question: +1 pt to asker</li>
                    <li>Buy Bonus Token: −3 pts penalty</li>
                    <li>Angad Gambit: +3 if correct; −3 if incorrect</li>
                    <li>Unused tokens at end: +1 pt each</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {[
                  { round: 'Round 1', time: '40 minutes', cards: 'Reveal 6 central cards', pts: '+10 pts/guess' },
                  { round: 'Round 2', time: '20 minutes', cards: 'Reveal 4 more central cards (10 total)', pts: '+8 pts/guess' },
                  { round: 'Round 3', time: '10 minutes', cards: 'Reveal 2 more central cards (12 total)', pts: '+6 pts/guess' },
                  { round: 'Round 4', time: '10 minutes', cards: 'No more cards (4 remain hidden)', pts: '+4 pts/guess' },
                ].map((s) => (
                  <div key={s.round} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="font-bold text-white text-sm font-serif">{s.round}</div>
                    <div className="text-amber-400 font-mono font-semibold mt-1">{s.time}</div>
                    <div className="text-slate-300 text-[11px] mt-1">{s.cards}</div>
                    <div className="text-emerald-400 font-semibold text-[11px] mt-1">{s.pts}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
