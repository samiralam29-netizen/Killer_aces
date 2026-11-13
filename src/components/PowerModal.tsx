import React, { useState } from 'react';
import {
  X,
  Zap,
  Check,
  AlertTriangle,
  Info,
  HelpCircle,
  FlaskConical,
  Users,
} from 'lucide-react';
import { Player } from '../types/game';
import { POWER_DEFS } from '../game/constants';

interface PowerModalProps {
  isOpen: boolean;
  user: Player;
  otherPlayers: Player[];
  onClose: () => void;
  onActivate: (targetPlayerId?: string) => void;
  onOpenQuestionWithTenHeads?: () => void;
  onOpenPowerLab?: () => void;
}

export const PowerModal: React.FC<PowerModalProps> = ({
  isOpen,
  user,
  otherPlayers,
  onClose,
  onActivate,
  onOpenQuestionWithTenHeads,
  onOpenPowerLab,
}) => {
  if (!isOpen) return null;

  const powerDef = POWER_DEFS[user.powerId];
  const isTenHeads = user.powerId === 'Ten Heads';
  const requiresTarget = powerDef.targetType !== 'none' && !isTenHeads;
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    otherPlayers[0]?.id || ''
  );

  const isPartnerWarningPower =
    user.powerId === 'Secret of Lanka' || user.powerId === 'Brahma Gyan';

  const handleActivate = () => {
    onActivate(requiresTarget ? selectedTargetId : undefined);
    onClose();
  };

  const handleLaunchTenHeadsQuestion = () => {
    onClose();
    if (onOpenQuestionWithTenHeads) {
      onOpenQuestionWithTenHeads();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-md text-amber-50 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-serif">
                {isTenHeads ? 'Ten Heads (Multi-Player Question)' : `Activate ${powerDef.name}`}
              </h3>
              <span className="text-xs text-amber-300 font-medium">One-Use Power Card</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Custom Ten Heads Guidance */}
          {isTenHeads ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-gradient-to-r from-purple-950/70 to-slate-900 border border-purple-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>How Ten Heads Works</span>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {powerDef.description}
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2 text-slate-300 text-[11px] leading-relaxed">
                <div className="font-semibold text-amber-300 uppercase tracking-wider text-[10px]">
                  Step-by-Step Instructions:
                </div>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Click <strong>"Compose 3-Target Question"</strong> below.</li>
                  <li>Pick your <strong>Primary Target</strong> + <strong>2 Secondary Targets</strong> (3 opponents total).</li>
                  <li>Choose the question you want answered (e.g., <em>Sum &ge; 10</em>, <em>Suit count</em>).</li>
                  <li>Submit for <strong>only 1 Question Token</strong>! All 3 answers will be returned to you in private logs.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleLaunchTenHeadsQuestion}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-600 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Compose 3-Target Question Now (1 Token)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Power Description Card */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <p className="text-slate-200 leading-relaxed text-xs">
                  {powerDef.description}
                </p>
              </div>

              {/* Partner Interaction Alert */}
              {isPartnerWarningPower && (
                <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <strong>Partner Interaction:</strong> You do not know who your partner is. If you accidentally select your secret partner, this power will be spent and will <em>only</em> reveal that they are your partner!
                  </div>
                </div>
              )}

              {/* Target Selection if needed */}
              {requiresTarget && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 uppercase tracking-wider text-[11px]">
                    Choose Target Player:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {otherPlayers.map((p) => {
                      const selected = p.id === selectedTargetId;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setSelectedTargetId(p.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                            selected
                              ? 'bg-[#182133] border-slate-600 text-slate-100 ring-1 ring-slate-500 shadow-xs'
                              : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <img src={p.avatar} alt={p.name} className="w-7 h-7 rounded-md bg-slate-700" />
                          <div className="truncate">
                            <div className="font-semibold text-slate-100 truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {p.cards.filter((c) => !c.isRevealed).length} cards hidden
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <span />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleActivate}
                    className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-medium text-xs transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Invoke Power</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
