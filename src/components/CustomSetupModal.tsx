import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Layers,
  Sparkles,
  Check,
  RotateCcw,
  AlertCircle,
  Shuffle,
  Shield,
  Star,
  Clock,
} from 'lucide-react';
import { CharacterId, PowerId, PlayerCountMode, CustomGameSetup } from '../types/game';
import {
  CHARACTER_DEFS,
  POWER_DEFS,
  MANDATORY_CHARACTERS,
  OPTIONAL_CHARACTERS,
  ALL_POWER_IDS,
  ALL_CHARACTER_IDS,
} from '../game/constants';

interface CustomSetupModalProps {
  isOpen: boolean;
  initialSetup?: CustomGameSetup;
  onClose: () => void;
  onApply: (setup: CustomGameSetup) => void;
}

export const CustomSetupModal: React.FC<CustomSetupModalProps> = ({
  isOpen,
  initialSetup,
  onClose,
  onApply,
}) => {
  if (!isOpen) return null;

  const [playerCount, setPlayerCount] = useState<PlayerCountMode>(
    initialSetup?.playerCount || 8
  );

  const [selectedCharacters, setSelectedCharacters] = useState<CharacterId[]>(() => {
    if (initialSetup?.characterOverride && initialSetup.characterOverride.length === (initialSetup.playerCount || 8)) {
      return [...initialSetup.characterOverride];
    }
    // Default 8 or 6
    const count = initialSetup?.playerCount || 8;
    const optionalNeeded = count - MANDATORY_CHARACTERS.length;
    return [...MANDATORY_CHARACTERS, ...OPTIONAL_CHARACTERS.slice(0, optionalNeeded)];
  });

  const [selectedPowers, setSelectedPowers] = useState<PowerId[]>(() => {
    if (initialSetup?.powerOverride && initialSetup.powerOverride.length === (initialSetup.playerCount || 8)) {
      return [...initialSetup.powerOverride];
    }
    const count = initialSetup?.playerCount || 8;
    return ALL_POWER_IDS.slice(0, count);
  });

  const [activeTab, setActiveTab] = useState<'mode' | 'characters' | 'powers'>('mode');
  const [validationError, setValidationError] = useState<string>('');

  // Handle player count change
  const handlePlayerCountChange = (newCount: PlayerCountMode) => {
    setPlayerCount(newCount);
    // Adjust character selection if count changed
    if (newCount === 6 && selectedCharacters.length > 6) {
      // Keep mandatory, keep 2 optional
      const mandatories = selectedCharacters.filter((c) => MANDATORY_CHARACTERS.includes(c));
      const optionals = selectedCharacters.filter((c) => !MANDATORY_CHARACTERS.includes(c));
      setSelectedCharacters([...mandatories, ...optionals.slice(0, 6 - mandatories.length)]);
    } else if (newCount === 8 && selectedCharacters.length < 8) {
      const remainingNeeded = 8 - selectedCharacters.length;
      const unselected = ALL_CHARACTER_IDS.filter((c) => !selectedCharacters.includes(c));
      setSelectedCharacters([...selectedCharacters, ...unselected.slice(0, remainingNeeded)]);
    }

    // Adjust power selection
    if (newCount === 6 && selectedPowers.length > 6) {
      setSelectedPowers(selectedPowers.slice(0, 6));
    } else if (newCount === 8 && selectedPowers.length < 8) {
      const unselected = ALL_POWER_IDS.filter((p) => !selectedPowers.includes(p));
      setSelectedPowers([...selectedPowers, ...unselected.slice(0, 8 - selectedPowers.length)]);
    }
    setValidationError('');
  };

  // Toggle Character
  const toggleCharacter = (charId: CharacterId) => {
    if (selectedCharacters.includes(charId)) {
      // Don't allow deselecting mandatory if needed, or allow but warn
      setSelectedCharacters(selectedCharacters.filter((c) => c !== charId));
    } else {
      if (selectedCharacters.length >= playerCount) {
        setValidationError(`You can only select exactly ${playerCount} characters for this ${playerCount}-player match.`);
        return;
      }
      setSelectedCharacters([...selectedCharacters, charId]);
    }
    setValidationError('');
  };

  // Toggle Power
  const togglePower = (powerId: PowerId) => {
    if (selectedPowers.includes(powerId)) {
      setSelectedPowers(selectedPowers.filter((p) => p !== powerId));
    } else {
      if (selectedPowers.length >= playerCount) {
        setValidationError(`You can only select exactly ${playerCount} powers for this ${playerCount}-player match.`);
        return;
      }
      setSelectedPowers([...selectedPowers, powerId]);
    }
    setValidationError('');
  };

  // Preset actions
  const randomizeCharacters = () => {
    const shuffledOptional = [...OPTIONAL_CHARACTERS].sort(() => 0.5 - Math.random());
    const needed = playerCount - MANDATORY_CHARACTERS.length;
    setSelectedCharacters([...MANDATORY_CHARACTERS, ...shuffledOptional.slice(0, needed)]);
    setValidationError('');
  };

  const randomizePowers = () => {
    const shuffled = [...ALL_POWER_IDS].sort(() => 0.5 - Math.random());
    setSelectedPowers(shuffled.slice(0, playerCount));
    setValidationError('');
  };

  const handleApply = () => {
    if (selectedCharacters.length !== playerCount) {
      setValidationError(`Please select exactly ${playerCount} characters (currently ${selectedCharacters.length}).`);
      setActiveTab('characters');
      return;
    }
    if (selectedPowers.length !== playerCount) {
      setValidationError(`Please select exactly ${playerCount} powers (currently ${selectedPowers.length}).`);
      setActiveTab('powers');
      return;
    }

    onApply({
      playerCount,
      characterOverride: selectedCharacters,
      powerOverride: selectedPowers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl bg-[#111724] border border-amber-600/50 rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#161f31] border-b border-slate-800 p-5 px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-amber-100 flex items-center gap-2">
                <span>Room Setup & Custom Deck</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 font-mono font-semibold">
                  Curator Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose 6 or 8 players, select specific Character Cards, and curate Power abilities.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="bg-[#141b2a] border-b border-slate-800 px-6 flex items-center gap-2 pt-2 pb-0 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('mode')}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'mode'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Player Count & Rules ({playerCount}P)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'characters'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>2. Characters ({selectedCharacters.length}/{playerCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('powers')}
            className={`px-4 py-2.5 font-semibold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'powers'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3. Powers ({selectedPowers.length}/{playerCount})</span>
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="bg-rose-950/70 border-b border-rose-500/50 p-2.5 px-6 text-rose-200 text-xs flex items-center gap-2 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PLAYER COUNT & RULES */}
          {activeTab === 'mode' && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Select Game Format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 6 Players Card */}
                  <div
                    onClick={() => handlePlayerCountChange(6)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      playerCount === 6
                        ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-lg shadow-amber-950/50'
                        : 'bg-[#151c2c] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif font-bold text-lg text-slate-100">
                        6 Players (Fast Edition)
                      </span>
                      {playerCount === 6 && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-300 font-semibold mb-3">
                      24 Total Cards · Values 1 to 6 (A, 2, 3, 4, 5, 6)
                    </div>
                    <ul className="text-[11px] space-y-1.5 text-slate-300/90 leading-relaxed">
                      <li>• <strong>Deck:</strong> 24 cards (12 dealt to players, 12 in central table)</li>
                      <li>• <strong>Table Reveals:</strong> Round 1: <strong>5</strong> · Round 2: <strong>3</strong> · Round 3: <strong>2</strong> · Round 4: <strong>0</strong></li>
                      <li>• <strong>Round Timers:</strong> 30 min, 20 min, 10 min, 10 min</li>
                      <li>• <strong>Characters & Powers:</strong> Exactly 6 in play</li>
                      <li>• <strong>Secret Partners:</strong> 3 bonded pairs</li>
                    </ul>
                  </div>

                  {/* 8 Players Card */}
                  <div
                    onClick={() => handlePlayerCountChange(8)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      playerCount === 8
                        ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-lg shadow-amber-950/50'
                        : 'bg-[#151c2c] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif font-bold text-lg text-slate-100">
                        8 Players (Classic Edition)
                      </span>
                      {playerCount === 8 && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-amber-300 font-semibold mb-3">
                      32 Total Cards · Values 1 to 8 (A, 2, 3, 4, 5, 6, 7, 8)
                    </div>
                    <ul className="text-[11px] space-y-1.5 text-slate-300/90 leading-relaxed">
                      <li>• <strong>Deck:</strong> 32 cards (16 dealt to players, 16 in central table)</li>
                      <li>• <strong>Table Reveals:</strong> Round 1: <strong>6</strong> · Round 2: <strong>4</strong> · Round 3: <strong>2</strong> · Round 4: <strong>0</strong></li>
                      <li>• <strong>Round Timers:</strong> 40 min, 20 min, 10 min, 10 min</li>
                      <li>• <strong>Characters & Powers:</strong> Exactly 8 in play</li>
                      <li>• <strong>Secret Partners:</strong> 4 bonded pairs</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Summary breakdown banner */}
              <div className="p-4 bg-[#161f31] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400 font-medium">Selected Configuration:</div>
                  <div className="font-bold text-amber-300 font-serif text-sm">
                    {playerCount} Players · {selectedCharacters.length} Characters · {selectedPowers.length} Powers
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('characters')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Configure Characters →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHARACTERS SELECTION */}
          {activeTab === 'characters' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-sm">
                    Select exactly {playerCount} Characters
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Rama, Ravana, Lakshmana, and Sita are the core dramatic cast.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                      selectedCharacters.length === playerCount
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedCharacters.length} / {playerCount} Chosen
                  </span>
                  <button
                    type="button"
                    onClick={randomizeCharacters}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3 text-amber-400" />
                    <span>Auto Core + Random</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ALL_CHARACTER_IDS.map((charId) => {
                  const def = CHARACTER_DEFS[charId];
                  const isSelected = selectedCharacters.includes(charId);
                  const isCore = MANDATORY_CHARACTERS.includes(charId);

                  return (
                    <div
                      key={charId}
                      onClick={() => toggleCharacter(charId)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-sm'
                          : 'bg-[#151c2c] border-slate-800 text-slate-400 hover:border-slate-700 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-serif font-bold text-sm text-slate-100 truncate">
                            {def.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {isCore && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
                                Core
                              </span>
                            )}
                            <div
                              className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'border border-slate-600 bg-slate-800'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] text-amber-300 font-medium mb-1">
                          {def.title} (+{def.maxPoints} pts)
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
                          {def.objectiveSummary}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: POWERS SELECTION */}
          {activeTab === 'powers' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="font-serif font-bold text-slate-100 text-sm">
                    Select exactly {playerCount} Powers
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Powers are dealt independently of character cards.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                      selectedPowers.length === playerCount
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {selectedPowers.length} / {playerCount} Chosen
                  </span>
                  <button
                    type="button"
                    onClick={randomizePowers}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3 text-amber-400" />
                    <span>Randomize Powers</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {ALL_POWER_IDS.map((powerId) => {
                  const def = POWER_DEFS[powerId];
                  const isSelected = selectedPowers.includes(powerId);

                  return (
                    <div
                      key={powerId}
                      onClick={() => togglePower(powerId)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 text-amber-100 shadow-sm'
                          : 'bg-[#151c2c] border-slate-800 text-slate-400 hover:border-slate-700 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-serif font-bold text-sm text-slate-100 truncate">
                            {def.name}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950'
                                : 'border border-slate-600 bg-slate-800'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </div>
                        </div>

                        <div className="text-[10px] text-amber-400/90 font-mono capitalize mb-1">
                          Target: {def.targetType.replace(/_/g, ' ')}
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-3 leading-snug">
                          {def.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#141b2a] border-t border-slate-800 p-4 px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>
              Format: <strong className="text-slate-200">{playerCount} Players ({playerCount === 6 ? '24' : '32'} Cards)</strong>
            </span>
            <span>•</span>
            <span className={selectedCharacters.length === playerCount ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {selectedCharacters.length}/{playerCount} Characters
            </span>
            <span>•</span>
            <span className={selectedPowers.length === playerCount ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {selectedPowers.length}/{playerCount} Powers
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Room Setup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
