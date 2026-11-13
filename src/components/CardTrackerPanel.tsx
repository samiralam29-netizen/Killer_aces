import React, { useState } from 'react';
import { Player, PlayingCard, Suit, CardValue } from '../types/game';
import { CARD_VALUES, SUITS, SUIT_COLORS, SUIT_SYMBOLS, VALUE_LABELS } from '../game/constants';
import { CheckCircle2, XCircle, Trash2, X, Users, Tag } from 'lucide-react';

interface CardTrackerPanelProps {
  me: Player;
  allPlayers: Player[];
  centralCards: PlayingCard[];
  playerCount?: 6 | 8;
  onSetTag: (cardKey: string, tag: { player: string; mode: 'suspect' | 'not' } | null) => void;
  onCycleTag?: (cardKey: string) => void;
  onToggleTagMode?: (cardKey: string) => void;
}

export const CardTrackerPanel: React.FC<CardTrackerPanelProps> = ({
  me,
  allPlayers,
  centralCards,
  playerCount = 8,
  onSetTag,
}) => {
  const [selectedCardForTag, setSelectedCardForTag] = useState<{
    cardKey: string;
    suit: Suit;
    value: CardValue;
  } | null>(null);
  const [activeMode, setActiveMode] = useState<'suspect' | 'not'>('suspect');

  const opponents = allPlayers.filter((p) => p.id !== me.id);

  // Returns owner info if card is known to this player
  function knownInfo(suit: Suit, value: CardValue): { owner: string | null } | null {
    // 1. Revealed in a player's hand publicly
    for (const p of allPlayers) {
      for (const c of p.cards) {
        if (c.isRevealed && c.suit === suit && c.value === value) {
          return { owner: p.id === me.id ? 'You' : p.name };
        }
      }
    }

    // 2. Revealed in the central pile
    for (const c of centralCards) {
      if (c.isRevealed && c.suit === suit && c.value === value) {
        return { owner: 'Centre' };
      }
    }

    // 3. One of your own two cards (you already know it's yours)
    if (me.cards.some((c) => c.suit === suit && c.value === value)) {
      return { owner: 'You' };
    }

    return null;
  }

  const handleCardClick = (cardKey: string, suit: Suit, value: CardValue, isRevealedOrOwn: boolean) => {
    if (isRevealedOrOwn) return;
    const currentTag = me.cardTags?.[cardKey];
    setActiveMode(currentTag ? currentTag.mode : 'suspect');
    setSelectedCardForTag({ cardKey, suit, value });
  };

  const currentModalTag = selectedCardForTag ? me.cardTags?.[selectedCardForTag.cardKey] : undefined;

  return (
    <div className="bg-[#111724] border border-slate-800 rounded-2xl p-4 shadow-md text-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-slate-100 font-serif">
            Deduction Card Tracker ({playerCount === 6 ? 24 : 32} Cards)
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            · Private Ledger
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span>Click any card to tag suspect or confirmed non-holder</span>
        </span>
      </div>

      {/* Grid of all 4 suits × values */}
      <div className="space-y-2 overflow-x-auto pb-1">
        {SUITS.map((suit) => {
          const isRed = SUIT_COLORS[suit] === 'red';
          const symbol = SUIT_SYMBOLS[suit];

          return (
            <div key={suit} className="flex items-center gap-1.5 min-w-[560px]">
              <span className={`w-6 font-bold text-base text-center ${isRed ? 'text-rose-500' : 'text-slate-300'}`}>
                {symbol}
              </span>

              <div className="flex gap-1.5 flex-1">
                {CARD_VALUES.filter((val) => val <= (playerCount === 6 ? 6 : 8)).map((val) => {
                  const cardKey = `${suit}_${val}`;
                  const known = knownInfo(suit, val);
                  const isRevealedOrOwn = !!known;
                  const tag = me.cardTags?.[cardKey];

                  return (
                    <div key={cardKey} className="relative flex-1">
                      <button
                        type="button"
                        onClick={() => handleCardClick(cardKey, suit, val, isRevealedOrOwn)}
                        disabled={isRevealedOrOwn}
                        className={`w-full h-12 rounded-lg flex flex-col items-center justify-center font-bold transition-all ${
                          isRevealedOrOwn
                            ? 'bg-[#0d121c] text-slate-600 line-through border border-slate-800/80 cursor-default'
                            : `bg-[#182133] hover:bg-slate-750 border border-slate-700/80 hover:border-slate-500 cursor-pointer shadow-xs ${
                                isRed ? 'text-rose-400' : 'text-slate-200'
                              }`
                        }`}
                        title={
                          isRevealedOrOwn
                            ? `Revealed: ${known?.owner}`
                            : tag
                            ? `${tag.mode === 'suspect' ? 'Suspect' : 'Confirmed NOT'}: ${tag.player} (Click to change)`
                            : `Click to assign player tag`
                        }
                      >
                        <span className="text-xs font-mono font-bold">{VALUE_LABELS[val]}</span>
                        <span className="text-[10px] opacity-75">{symbol}</span>
                      </button>

                      {/* Known owner badge */}
                      {known && (
                        <span
                          className={`absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-semibold px-1 rounded shadow-xs pointer-events-none ${
                            known.owner === 'You'
                              ? 'bg-slate-200 text-slate-900'
                              : known.owner === 'Centre'
                              ? 'bg-slate-700 text-slate-300'
                              : 'bg-slate-800 text-rose-300 border border-slate-700'
                          }`}
                        >
                          {known.owner}
                        </span>
                      )}

                      {/* Private suspect / confirmed-not tag badge */}
                      {tag && !isRevealedOrOwn && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(cardKey, suit, val, isRevealedOrOwn);
                          }}
                          title={`Tagged: ${tag.mode === 'not' ? 'Confirmed NOT ' : 'Suspect '}${tag.player}. Click to edit.`}
                          className={`absolute -bottom-1.5 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md transition-transform active:scale-95 cursor-pointer ${
                            tag.mode === 'not'
                              ? 'bg-red-800 text-red-100 border border-red-500/60'
                              : 'bg-indigo-700 text-indigo-100 border border-indigo-400/60'
                          }`}
                        >
                          {tag.mode === 'not' ? '¬' : ''}
                          {tag.player.slice(0, 3)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-[11px] text-slate-400 border-t border-slate-800/60">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-800 border border-slate-700 rounded-sm inline-block" />
            <span>Unknown card</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-900 border border-slate-800 rounded-sm inline-block line-through text-[9px] text-center" />
            <span>Revealed card</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-indigo-700 text-indigo-100 text-[9px] font-bold px-1 rounded-xs">Aar</span>
            <span>Suspect player</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-red-800 text-red-100 text-[9px] font-bold px-1 rounded-xs">¬Aar</span>
            <span>Confirmed NOT this player</span>
          </span>
        </div>
        <span className="text-[10px] text-slate-500 italic">
          Tags are strictly private notes visible only to you.
        </span>
      </div>

      {/* Player List Popover / Modal when a card is clicked */}
      {selectedCardForTag && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-100">
          <div className="bg-slate-900 border border-amber-600/40 rounded-2xl w-full max-w-md text-amber-50 shadow-2xl p-5 space-y-4 my-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-bold ${
                    SUIT_COLORS[selectedCardForTag.suit] === 'red' ? 'text-red-400' : 'text-slate-200'
                  }`}
                >
                  <span className="text-sm font-mono font-black">
                    {VALUE_LABELS[selectedCardForTag.value]}
                  </span>
                  <span className="text-xs">{SUIT_SYMBOLS[selectedCardForTag.suit]}</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base font-serif">
                    {selectedCardForTag.suit} {VALUE_LABELS[selectedCardForTag.value]}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentModalTag ? (
                      <span>
                        Current Tag:{' '}
                        <strong
                          className={
                            currentModalTag.mode === 'not' ? 'text-red-300' : 'text-indigo-300'
                          }
                        >
                          {currentModalTag.mode === 'not' ? '¬ Not ' : 'Suspect '}
                          {currentModalTag.player}
                        </strong>
                      </span>
                    ) : (
                      'No player tagged yet'
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardForTag(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Deduction Tag Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tag Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveMode('suspect')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeMode === 'suspect'
                      ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Suspect (Holds Card)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('not')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    activeMode === 'not'
                      ? 'bg-red-700 border-red-400 text-white shadow-md shadow-red-700/30'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Confirmed NOT (¬)</span>
                </button>
              </div>
            </div>

            {/* Players List */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select Player to Tag:</span>
                </label>
                <span className="text-[10px] text-slate-400">Click to apply tag</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {opponents.map((p) => {
                  const isCurrentTag =
                    currentModalTag?.player === p.name && currentModalTag?.mode === activeMode;

                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        onSetTag(selectedCardForTag.cardKey, {
                          player: p.name,
                          mode: activeMode,
                        });
                        setSelectedCardForTag(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isCurrentTag
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 ring-1 ring-amber-500 shadow-sm'
                          : 'bg-slate-800/90 border-slate-700 hover:bg-slate-700/90 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-7 h-7 rounded-lg bg-slate-700 shrink-0"
                        />
                        <span className="font-semibold text-xs truncate">{p.name}</span>
                      </div>
                      {isCurrentTag && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 shrink-0">
                          Tagged
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              {currentModalTag ? (
                <button
                  type="button"
                  onClick={() => {
                    onSetTag(selectedCardForTag.cardKey, null);
                    setSelectedCardForTag(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Clear Tag</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedCardForTag(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
