import React, { useState } from 'react';
import {
  Trophy,
  Award,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Users,
  Shield,
  HelpCircle,
  PlusCircle,
} from 'lucide-react';
import { GameScoreBreakdown, Player } from '../types/game';
import { CHARACTER_DEFS } from '../game/constants';

interface FinalScoreboardModalProps {
  isOpen: boolean;
  scores: GameScoreBreakdown[];
  players: Player[];
  onNewGame: () => void;
  onLeaveRoom?: () => void;
}

export const FinalScoreboardModal: React.FC<FinalScoreboardModalProps> = ({
  isOpen,
  scores,
  players,
  onNewGame,
  onLeaveRoom,
}) => {
  if (!isOpen) return null;

  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Sort descending by totalScore
  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f1420] border border-slate-800 rounded-2xl w-full max-w-4xl text-slate-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="bg-[#141b29] border-b border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700/80 text-amber-400 flex items-center justify-center shadow-inner">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif tracking-wide text-white">
                Final Leaderboard
              </h2>
              <p className="text-xs text-slate-400">
                All 4 rounds complete · Character Objectives & Survival revealed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onLeaveRoom && (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Leave this game and create or join a new room"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Create New Room</span>
              </button>
            )}

            <button
              onClick={onNewGame}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Winner Showcase */}
          {sorted.length > 0 && (
            <div className="p-4 bg-[#141b29] border border-slate-750 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👑</span>
                <div>
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                    Game Champion
                  </span>
                  <div className="text-lg font-bold font-serif text-white">
                    {sorted[0].playerName} <span className="text-slate-400 font-sans text-xs">({sorted[0].characterId})</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {sorted[0].characterObjectiveDetails}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Final Score</div>
                <div className="text-2xl font-bold font-mono text-white">
                  {sorted[0].totalScore} pts
                </div>
              </div>
            </div>
          )}

          {/* Full Standings List */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-4">Player & Character</div>
              <div className="col-span-2 text-center">Running</div>
              <div className="col-span-2 text-center">Survival & Tokens</div>
              <div className="col-span-2 text-center">Objective</div>
              <div className="col-span-1 text-right">Total</div>
            </div>

            <div className="divide-y divide-slate-800/80">
              {sorted.map((item, index) => {
                const player = players.find((p) => p.id === item.playerId);
                const charDef = CHARACTER_DEFS[item.characterId];
                const isExpanded = expandedPlayerId === item.playerId;
                const survivalTotal = item.ownSurvivalPoints + item.partnerSurvivalPoints + item.unusedTokenPoints;

                return (
                  <div key={item.playerId} className="hover:bg-slate-900/50 transition-colors">
                    <div
                      onClick={() =>
                        setExpandedPlayerId(isExpanded ? null : item.playerId)
                      }
                      className="grid grid-cols-12 gap-2 px-4 py-3 items-center cursor-pointer"
                    >
                      {/* Rank */}
                      <div className="col-span-1 text-center font-bold text-sm">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>

                      {/* Player */}
                      <div className="col-span-4 flex items-center gap-2.5">
                        <img
                          src={player?.avatar}
                          alt={item.playerName}
                          className="w-7 h-7 rounded-lg bg-slate-800"
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{item.playerName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({item.characterId})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                            {charDef?.title}
                          </div>
                        </div>
                      </div>

                      {/* Running */}
                      <div className="col-span-2 text-center font-mono font-medium text-slate-300">
                        {item.runningScore} pts
                      </div>

                      {/* Survival & Tokens */}
                      <div className="col-span-2 text-center font-mono font-medium text-emerald-400">
                        +{survivalTotal} pts
                      </div>

                      {/* Character Objective */}
                      <div className="col-span-2 text-center font-mono font-bold text-slate-200">
                        +{item.characterObjectivePoints} pts
                      </div>

                      {/* Total */}
                      <div className="col-span-1 text-right font-mono font-bold text-white text-sm flex items-center justify-end gap-1">
                        <span>{item.totalScore}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Breakdown */}
                    {isExpanded && (
                      <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800/80 text-[11px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">
                            Running Score Breakdown:
                          </span>
                          <div>Base Guess Points: +{item.baseGuessPoints}</div>
                          {item.angadGambitPoints !== 0 && (
                            <div>Angad Gambits: {item.angadGambitPoints >= 0 ? '+' : ''}{item.angadGambitPoints}</div>
                          )}
                          <div>Public Questions: +{item.publicQuestionPoints}</div>
                          {item.bonusTokensBoughtDeduction > 0 && (
                            <div className="text-red-400">Bonus Tokens: −{item.bonusTokensBoughtDeduction}</div>
                          )}
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">
                            Survival Points:
                          </span>
                          <div>Own Survival: +{item.ownSurvivalPoints} pts</div>
                          <div>Partner Survival: +{item.partnerSurvivalPoints} pts</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            Partner: {players.find((p) => p.id === player?.secretPartnerId)?.name}
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">
                            Unused Tokens:
                          </span>
                          <div>{item.unusedTokenPoints} Tokens remaining (+{item.unusedTokenPoints} pts)</div>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30">
                          <span className="text-amber-400 font-semibold block mb-1">
                            Objective Details:
                          </span>
                          <div className="text-amber-200">{item.characterObjectiveDetails}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#141b29] border-t border-slate-800 p-4 px-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-400">
            Want to start another match with friends or new players?
          </div>
          <div className="flex items-center gap-2">
            {onLeaveRoom && (
              <button
                type="button"
                onClick={onLeaveRoom}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Create New Room</span>
              </button>
            )}
            <button
              onClick={onNewGame}
              className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
