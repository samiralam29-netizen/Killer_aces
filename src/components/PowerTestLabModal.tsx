import React, { useState } from 'react';
import {
  X,
  Zap,
  FlaskConical,
  Award,
  Check,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  Shield,
  Flame,
  Eye,
  Lock,
  ArrowRight,
  HelpCircle,
  Crown,
} from 'lucide-react';
import {
  CharacterId,
  PowerId,
  Suit,
  CardValue,
  PlayingCard,
} from '../types/game';
import {
  CHARACTER_DEFS,
  POWER_DEFS,
  ALL_POWER_IDS,
  SUITS,
  CARD_VALUES,
  VALUE_LABELS,
} from '../game/constants';

interface PowerTestLabModalProps {
  isOpen: boolean;
  activePowerId?: PowerId;
  activeCharacterId?: CharacterId;
  onClose: () => void;
  onEquipPower?: (powerId: PowerId) => void;
  onEquipCharacter?: (characterId: CharacterId) => void;
  onLaunchTenHeadsComposer?: () => void;
}

interface MockPlayer {
  id: string;
  name: string;
  avatar: string;
  cards: [PlayingCard, PlayingCard];
  characterId: CharacterId;
  powerId: PowerId;
  powerUsed: boolean;
  powerDisabled: boolean;
  isSecretPartner?: boolean;
}

const MOCK_OPPONENTS: MockPlayer[] = [
  {
    id: 'mock_1',
    name: 'Devadatta',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Devadatta',
    cards: [
      { id: 'm1_c1', suit: 'Spades', value: 7, isRevealed: false },
      { id: 'm1_c2', suit: 'Hearts', value: 3, isRevealed: false },
    ],
    characterId: 'Ravana',
    powerId: 'Nagpash',
    powerUsed: false,
    powerDisabled: false,
    isSecretPartner: false,
  },
  {
    id: 'mock_2',
    name: 'Ananya',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ananya',
    cards: [
      { id: 'm2_c1', suit: 'Diamonds', value: 5, isRevealed: false },
      { id: 'm2_c2', suit: 'Clubs', value: 2, isRevealed: false },
    ],
    characterId: 'Sita',
    powerId: 'Lakshman Rekha',
    powerUsed: false,
    powerDisabled: false,
    isSecretPartner: false,
  },
  {
    id: 'mock_3',
    name: 'Karan (Secret Partner)',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Karan',
    cards: [
      { id: 'm3_c1', suit: 'Hearts', value: 8, isRevealed: false },
      { id: 'm3_c2', suit: 'Diamonds', value: 4, isRevealed: false },
    ],
    characterId: 'Hanuman',
    powerId: 'Divya Shrishti',
    powerUsed: false,
    powerDisabled: false,
    isSecretPartner: true,
  },
  {
    id: 'mock_4',
    name: 'Pooja',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Pooja',
    cards: [
      { id: 'm4_c1', suit: 'Clubs', value: 6, isRevealed: false },
      { id: 'm4_c2', suit: 'Spades', value: 1, isRevealed: false },
    ],
    characterId: 'Vibhishana',
    powerId: 'Sanjeevani',
    powerUsed: true,
    powerDisabled: false,
    isSecretPartner: false,
  },
  {
    id: 'mock_5',
    name: 'Rohan',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Rohan',
    cards: [
      { id: 'm5_c1', suit: 'Hearts', value: 4, isRevealed: false },
      { id: 'm5_c2', suit: 'Spades', value: 5, isRevealed: false },
    ],
    characterId: 'Angad',
    powerId: 'Makhan Chori',
    powerUsed: false,
    powerDisabled: false,
    isSecretPartner: false,
  },
];

export const PowerTestLabModal: React.FC<PowerTestLabModalProps> = ({
  isOpen,
  activePowerId = 'Ten Heads',
  activeCharacterId = 'Ravana',
  onClose,
  onEquipPower,
  onEquipCharacter,
  onLaunchTenHeadsComposer,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'powers' | 'characters'>('powers');
  const [selectedPowerId, setSelectedPowerId] = useState<PowerId>(activePowerId);
  const [selectedCharId, setSelectedCharId] = useState<CharacterId>(activeCharacterId);

  // Simulation state
  const [targetMockId, setTargetMockId] = useState<string>(MOCK_OPPONENTS[0].id);
  const [secondaryMockIds, setSecondaryMockIds] = useState<string[]>([
    MOCK_OPPONENTS[1].id,
    MOCK_OPPONENTS[2].id,
  ]);
  const [tenHeadsQuestionKind, setTenHeadsQuestionKind] = useState<string>('Sum >= 10');
  const [simOutput, setSimOutput] = useState<{
    title: string;
    message: string;
    details?: string;
    logText: string;
    type: 'success' | 'info' | 'warn';
  } | null>(null);

  // Angad simulation state
  const [angadGuessResult, setAngadGuessResult] = useState<'correct' | 'incorrect'>('correct');
  const [angadGambitsRun, setAngadGambitsRun] = useState<number>(0);
  const [angadScore, setAngadScore] = useState<number>(0);

  const selectedPowerDef = POWER_DEFS[selectedPowerId];
  const selectedCharDef = CHARACTER_DEFS[selectedCharId];
  const selectedTargetMock = MOCK_OPPONENTS.find((m) => m.id === targetMockId);

  const handleRunPowerSimulation = () => {
    switch (selectedPowerId) {
      case 'Ten Heads': {
        const p1 = selectedTargetMock;
        const p2 = MOCK_OPPONENTS.find((m) => m.id === secondaryMockIds[0]);
        const p3 = MOCK_OPPONENTS.find((m) => m.id === secondaryMockIds[1]);
        if (!p1 || !p2 || !p3) {
          setSimOutput({
            title: 'Ten Heads Error',
            message: 'Please ensure 3 unique opponents are selected.',
            logText: 'Simulation error',
            type: 'warn',
          });
          return;
        }

        const evalSum10 = (cards: PlayingCard[]) => cards[0].value + cards[1].value >= 10;
        const evalHasSpades = (cards: PlayingCard[]) =>
          cards[0].suit === 'Spades' || cards[1].suit === 'Spades';
        const evalRedCount = (cards: PlayingCard[]) =>
          cards.filter((c) => c.suit === 'Hearts' || c.suit === 'Diamonds').length;

        let a1 = '';
        let a2 = '';
        let a3 = '';

        if (tenHeadsQuestionKind === 'Sum >= 10') {
          a1 = `${p1.name} (Cards: ${p1.cards[0].value}+${p1.cards[1].value}=${p1.cards[0].value + p1.cards[1].value}) -> ${evalSum10(p1.cards) ? 'YES' : 'NO'}`;
          a2 = `${p2.name} (Cards: ${p2.cards[0].value}+${p2.cards[1].value}=${p2.cards[0].value + p2.cards[1].value}) -> ${evalSum10(p2.cards) ? 'YES' : 'NO'}`;
          a3 = `${p3.name} (Cards: ${p3.cards[0].value}+${p3.cards[1].value}=${p3.cards[0].value + p3.cards[1].value}) -> ${evalSum10(p3.cards) ? 'YES' : 'NO'}`;
        } else if (tenHeadsQuestionKind === 'Has Spades') {
          a1 = `${p1.name} -> ${evalHasSpades(p1.cards) ? 'YES' : 'NO'}`;
          a2 = `${p2.name} -> ${evalHasSpades(p2.cards) ? 'YES' : 'NO'}`;
          a3 = `${p3.name} -> ${evalHasSpades(p3.cards) ? 'YES' : 'NO'}`;
        } else {
          a1 = `${p1.name} -> ${evalRedCount(p1.cards)} Red card(s)`;
          a2 = `${p2.name} -> ${evalRedCount(p2.cards)} Red card(s)`;
          a3 = `${p3.name} -> ${evalRedCount(p3.cards)} Red card(s)`;
        }

        setSimOutput({
          title: 'Ten Heads Executed! (1 Token Cost for 3 Answers)',
          message: `All 3 answers generated privately:\n1) ${a1}\n2) ${a2}\n3) ${a3}`,
          details: 'Only you receive these answers. Other players do NOT see the question or the answers.',
          logText: `[Ten Heads] Privately queried ${p1.name}, ${p2.name}, and ${p3.name} for "${tenHeadsQuestionKind}".`,
          type: 'success',
        });
        break;
      }

      case 'Nagpash': {
        if (!selectedTargetMock) return;
        setSimOutput({
          title: `Nagpash Cast on ${selectedTargetMock.name}!`,
          message: `Any guess submitted by ${selectedTargetMock.name} for this round was cancelled. They cannot submit a guess this round.`,
          details: 'Their question asking and discussion remain unaffected, but their deduction attack is disabled.',
          logText: `[Nagpash] Bound ${selectedTargetMock.name}. Their round guess was voided.`,
          type: 'success',
        });
        break;
      }

      case 'Lakshman Rekha': {
        setSimOutput({
          title: 'Lakshman Rekha Barrier Drawn!',
          message: 'An inviolable golden line surrounds your cards for this entire round. No opponent can guess your cards.',
          details: 'Any opponent guess already locked against either of your cards is instantly cancelled and refunded.',
          logText: `[Lakshman Rekha] Active! Protected from all incoming round guesses.`,
          type: 'success',
        });
        break;
      }

      case 'Sanjeevani': {
        setSimOutput({
          title: 'Sanjeevani Herb Consumed!',
          message: '+2 Question Tokens added immediately to your inventory!',
          details: 'These are Bonus Question Tokens that can be used to query any opponent, even if you already asked them 2 questions.',
          logText: `[Sanjeevani] +2 Question Tokens gained.`,
          type: 'success',
        });
        break;
      }

      case 'Secret of Lanka': {
        if (!selectedTargetMock) return;
        if (selectedTargetMock.isSecretPartner) {
          setSimOutput({
            title: 'Partner Hit! (Secret Partner Discovery)',
            message: `⚠️ ${selectedTargetMock.name} is your Secret Partner! Per Rule 19, your power is spent and you only learn their partner identity. No suits are revealed.`,
            details: 'Now that you know your partner, protect them and coordinate to maximize partner survival (+5 pts)!',
            logText: `[Secret of Lanka] Discovered secret partner: ${selectedTargetMock.name}.`,
            type: 'warn',
          });
        } else {
          const suits = selectedTargetMock.cards.map((c) => c.suit).join(', ');
          setSimOutput({
            title: `Secret of Lanka: Suits of ${selectedTargetMock.name}`,
            message: `Unrevealed Card Suits: ${suits}`,
            details: 'This information is 100% private. Use it in your Deduction Sheet to eliminate other suits for this opponent.',
            logText: `[Secret of Lanka] ${selectedTargetMock.name}'s card suits are: ${suits}.`,
            type: 'success',
          });
        }
        break;
      }

      case 'Brahma Gyan': {
        if (!selectedTargetMock) return;
        if (selectedTargetMock.isSecretPartner) {
          setSimOutput({
            title: 'Partner Hit! (Secret Partner Discovery)',
            message: `⚠️ ${selectedTargetMock.name} is your Secret Partner! Per Rule 19, your power is spent and you only learn their partner identity. No card value is revealed.`,
            details: 'Now that you know your partner, protect them and coordinate to maximize partner survival (+5 pts)!',
            logText: `[Brahma Gyan] Discovered secret partner: ${selectedTargetMock.name}.`,
            type: 'warn',
          });
        } else {
          const val = selectedTargetMock.cards[0].value;
          const displayVal = val === 1 ? 'A (Ace)' : `${val}`;
          setSimOutput({
            title: `Brahma Gyan: Card Value for ${selectedTargetMock.name}`,
            message: `One of their unrevealed cards has Value: ${displayVal}`,
            details: 'You now know the exact value of one card in their hand! Check against the suits you have tracked to pinpoint the card.',
            logText: `[Brahma Gyan] One card of ${selectedTargetMock.name} has value ${displayVal}.`,
            type: 'success',
          });
        }
        break;
      }

      case 'Vanara Sena': {
        if (!selectedTargetMock) return;
        setSimOutput({
          title: `Vanara Sena Alliance with ${selectedTargetMock.name}!`,
          message: `Both you and ${selectedTargetMock.name} receive +1 Question Token immediately!`,
          details: 'A mutually beneficial alliance power. You gain intel capacity while building rapport with a key player.',
          logText: `[Vanara Sena] You and ${selectedTargetMock.name} each received 1 Question Token.`,
          type: 'success',
        });
        break;
      }

      case 'Sudarshan Chakra': {
        if (!selectedTargetMock) return;
        setSimOutput({
          title: `Sudarshan Chakra Severed ${selectedTargetMock.name}'s Power!`,
          message: `Their Power Card (${selectedTargetMock.powerId}) has been permanently disabled and cannot be activated for the rest of the game.`,
          details: 'A devastating counter-measure against aggressive powers like Nagpash, Ten Heads, or Makhan Chori.',
          logText: `[Sudarshan Chakra] Permanently disabled ${selectedTargetMock.name}'s Power Card.`,
          type: 'success',
        });
        break;
      }

      case 'Makhan Chori': {
        if (!selectedTargetMock) return;
        if (!selectedTargetMock.powerUsed) {
          setSimOutput({
            title: `Makhan Chori Success! Stole ${selectedTargetMock.powerId}`,
            message: `You stole ${selectedTargetMock.name}'s unused Power Card: "${selectedTargetMock.powerId}"!`,
            details: 'You may now invoke this stolen power once. The original owner permanently loses access to it.',
            logText: `[Makhan Chori] Stole ${selectedTargetMock.name}'s unused ${selectedTargetMock.powerId}.`,
            type: 'success',
          });
        } else {
          setSimOutput({
            title: 'Makhan Chori Failed: Power Already Spent',
            message: `${selectedTargetMock.name} had already used their power card (${selectedTargetMock.powerId}). You acquired nothing.`,
            details: 'Makhan Chori only captures unused power cards. Target opponents who hold high-value unspent powers.',
            logText: `[Makhan Chori] ${selectedTargetMock.name}'s power was already spent.`,
            type: 'warn',
          });
        }
        break;
      }

      case 'Divya Shrishti': {
        setSimOutput({
          title: 'Divya Shrishti: Vision of the Central Pile',
          message: 'Top 3 Hidden Central Cards: 1) Ace of Spades, 2) 6 of Hearts, 3) 2 of Diamonds',
          details: 'These cards are in the central pile, meaning NO opponent holds them! Mark them off in your Deduction Sheet immediately.',
          logText: `[Divya Shrishti] Peered into central draw pile (A♠, 6♥, 2♦).`,
          type: 'success',
        });
        break;
      }

      case "Hanuman's Leap": {
        setSimOutput({
          title: "Hanuman's Leap (Automatic Passive)",
          message: 'Triggers automatically on your first incorrect round guess! You are granted 1 Extra Guess in the following round.',
          details: 'No manual activation required. If your Round 1 guess misses, you get 2 guesses in Round 2!',
          logText: `[Hanuman's Leap] Passive ability active. Will grant extra guess on first miss.`,
          type: 'info',
        });
        break;
      }

      case 'Divine Sight': {
        if (!selectedTargetMock) return;
        setSimOutput({
          title: `Divine Sight Revealed ${selectedTargetMock.name}'s Character!`,
          message: `${selectedTargetMock.name} holds the Character Card: "${selectedTargetMock.characterId}"!`,
          details: `Their secret objective is "${CHARACTER_DEFS[selectedTargetMock.characterId].title}" (${CHARACTER_DEFS[selectedTargetMock.characterId].objectiveSummary}).`,
          logText: `[Divine Sight] Revealed ${selectedTargetMock.name}'s Character: ${selectedTargetMock.characterId}.`,
          type: 'success',
        });
        break;
      }
    }
  };

  const handleSimulateAngadGambit = () => {
    if (angadGambitsRun >= 3) {
      setSimOutput({
        title: 'Angad Gambit Limit Reached',
        message: 'Angad can only mark up to 3 round guesses as Gambits during the entire game.',
        logText: 'Angad gambit limit reached',
        type: 'warn',
      });
      return;
    }

    const isCorrect = angadGuessResult === 'correct';
    const delta = isCorrect ? 3 : -3;
    const newScore = angadScore + delta;
    const newCount = angadGambitsRun + 1;
    setAngadGambitsRun(newCount);
    setAngadScore(newScore);

    setSimOutput({
      title: isCorrect ? '🔥 Angad Gambit Correct! (+3 Bonus)' : '❌ Angad Gambit Missed! (−3 Penalty)',
      message: isCorrect
        ? `Correct Gambit! You earned the base round points + 3 bonus Gambit points! (Gambit score: ${newScore > 0 ? `+${newScore}` : newScore})`
        : `Missed Gambit! A 3-point penalty has been applied to your Gambit score. (Gambit score: ${newScore > 0 ? `+${newScore}` : newScore})`,
      details: `Gambits used: ${newCount}/3. Angad's Gambit score ranges from −9 to +9, added to final score at game end.`,
      logText: `[Angad's Gambit] Guess #${newCount}: ${isCorrect ? 'Correct (+3)' : 'Incorrect (−3)'}. Total: ${newScore}.`,
      type: isCorrect ? 'success' : 'warn',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0f1420] border border-slate-800 rounded-2xl w-full max-w-5xl text-slate-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#141b29]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 text-indigo-400 flex items-center justify-center shadow-inner">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-lg font-serif">
                  Powers & Abilities Interactive Test Lab
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700">
                  Sandbox Simulator
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test and understand how Ten Heads, Angad's Gambit, and every power and character mechanic works.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('powers');
              setSimOutput(null);
            }}
            className={`px-4 py-2 text-xs font-bold font-serif rounded-t-xl transition-all flex items-center gap-2 border-t-2 ${
              activeTab === 'powers'
                ? 'bg-slate-900 text-purple-200 border-purple-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>12 Power Cards (Ten Heads, Nagpash, Sanjeevani, etc.)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('characters');
              setSimOutput(null);
            }}
            className={`px-4 py-2 text-xs font-bold font-serif rounded-t-xl transition-all flex items-center gap-2 border-t-2 ${
              activeTab === 'characters'
                ? 'bg-slate-900 text-amber-200 border-amber-500 border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>13 Character Objectives (Angad's Gambit, Ram, Ravana, etc.)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Selector list */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeTab === 'powers' ? 'Select Power to Inspect & Test:' : 'Select Character to Inspect & Test:'}
            </span>

            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
              {activeTab === 'powers'
                ? ALL_POWER_IDS.map((pid) => {
                    const isSelected = pid === selectedPowerId;
                    const def = POWER_DEFS[pid];
                    return (
                      <button
                        type="button"
                        key={pid}
                        onClick={() => {
                          setSelectedPowerId(pid);
                          setSimOutput(null);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600/20 border-purple-500 text-purple-100 ring-1 ring-purple-500'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Zap className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`} />
                          <div className="truncate">
                            <div className="font-bold text-xs truncate">{def.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {def.targetType === 'none'
                                ? 'No target'
                                : def.targetType === 'three_players'
                                ? '3 Players (1 Token)'
                                : 'Target opponent'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                : Object.values(CHARACTER_DEFS).map((cdef) => {
                    const isSelected = cdef.id === selectedCharId;
                    return (
                      <button
                        type="button"
                        key={cdef.id}
                        onClick={() => {
                          setSelectedCharId(cdef.id);
                          setSimOutput(null);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600/20 border-amber-500 text-amber-100 ring-1 ring-amber-500'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Award className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                          <div className="truncate">
                            <div className="font-bold text-xs truncate">{cdef.name}</div>
                            <div className="text-[10px] text-slate-400 truncate">{cdef.title}</div>
                          </div>
                        </div>
                        {cdef.isMandatory ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold shrink-0">
                            Core
                          </span>
                        ) : cdef.id === 'Angad' ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold shrink-0">
                            Gambit (+3/−3)
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Right Column: Interactive Sandbox & Details */}
          <div className="lg:col-span-8 space-y-4">
            {activeTab === 'powers' ? (
              <>
                {/* Power Header Card */}
                <div className="p-4 bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-950 border border-purple-500/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-900/60 border border-purple-400 text-purple-300 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-serif font-black text-white text-base">
                          {selectedPowerDef.name}
                        </h3>
                        <span className="text-[11px] text-purple-300 font-medium">
                          {selectedPowerDef.isAutomatic
                            ? 'Passive Power (Triggers Automatically)'
                            : 'Active Power Card (One-Time Use)'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onEquipPower && (
                        <button
                          type="button"
                          onClick={() => {
                            onEquipPower(selectedPowerId);
                            setSimOutput({
                              title: `Equipped ${selectedPowerDef.name}!`,
                              message: `You now hold "${selectedPowerDef.name}" on your player mat in the game with power status READY.`,
                              logText: `Equipped ${selectedPowerDef.name} in active game.`,
                              type: 'success',
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          title="Equip this power card directly on your player in the current game"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Equip In Current Game</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed pt-1">
                    {selectedPowerDef.description}
                  </p>
                </div>

                {/* Interactive Sandbox Test Runner */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-purple-400" />
                      <span>Live Sandbox Test Simulation</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Simulates exact engine response and privacy rules
                    </span>
                  </div>

                  {/* Sandbox Configuration based on Power */}
                  {selectedPowerId === 'Ten Heads' ? (
                    <div className="space-y-3 bg-purple-950/30 p-3 rounded-xl border border-purple-500/30">
                      <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>Ten Heads Multi-Target Configuration:</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                            Primary Target (1 of 3):
                          </label>
                          <select
                            value={targetMockId}
                            onChange={(e) => setTargetMockId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          >
                            {MOCK_OPPONENTS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                            Secondary Target (2 of 3):
                          </label>
                          <select
                            value={secondaryMockIds[0]}
                            onChange={(e) =>
                              setSecondaryMockIds([e.target.value, secondaryMockIds[1]])
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          >
                            {MOCK_OPPONENTS.filter((m) => m.id !== targetMockId).map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                            Secondary Target (3 of 3):
                          </label>
                          <select
                            value={secondaryMockIds[1]}
                            onChange={(e) =>
                              setSecondaryMockIds([secondaryMockIds[0], e.target.value])
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          >
                            {MOCK_OPPONENTS.filter(
                              (m) => m.id !== targetMockId && m.id !== secondaryMockIds[0]
                            ).map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                          Private Question to Send to All 3 Players:
                        </label>
                        <select
                          value={tenHeadsQuestionKind}
                          onChange={(e) => setTenHeadsQuestionKind(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="Sum >= 10">Sum of your two cards &gt;= 10?</option>
                          <option value="Has Spades">Do you hold at least one Spades card?</option>
                          <option value="Red Count">How many Red cards (Hearts/Diamonds) do you hold?</option>
                        </select>
                      </div>

                      <div className="flex gap-2 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={handleRunPowerSimulation}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Simulate Ten Heads Query (Test 1-Token Multi-Ask)</span>
                        </button>

                        {onLaunchTenHeadsComposer && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onLaunchTenHeadsComposer();
                            }}
                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Launch Live Question Composer with Ten Heads</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedPowerDef.targetType !== 'none' && (
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                            Choose Test Opponent:
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {MOCK_OPPONENTS.map((m) => {
                              const isSelected = m.id === targetMockId;
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => setTargetMockId(m.id)}
                                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-purple-600/30 border-purple-400 text-white ring-1 ring-purple-400'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                  }`}
                                >
                                  <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-md bg-slate-700" />
                                  <div className="truncate text-xs">
                                    <div className="font-semibold truncate">{m.name}</div>
                                    <div className="text-[10px] text-slate-400">
                                      Power: {m.powerId} {m.powerUsed ? '(Used)' : '(Unused)'}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleRunPowerSimulation}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Test Simulation for {selectedPowerDef.name}</span>
                      </button>
                    </div>
                  )}

                  {/* Simulation Output Card */}
                  {simOutput && (
                    <div
                      className={`p-3.5 rounded-xl border space-y-2 text-xs animate-in fade-in ${
                        simOutput.type === 'success'
                          ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                          : simOutput.type === 'warn'
                          ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                          : 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200'
                      }`}
                    >
                      <div className="font-bold text-sm flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>{simOutput.title}</span>
                      </div>
                      <p className="whitespace-pre-line text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-slate-200">
                        {simOutput.message}
                      </p>
                      {simOutput.details && (
                        <p className="text-[11px] text-slate-300 italic">
                          ℹ️ {simOutput.details}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 font-mono">
                        Engine Log: {simOutput.logText}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Character Header Card */}
                <div className="p-4 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-400 text-amber-300 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-black text-white text-base">
                            {selectedCharDef.name}
                          </h3>
                          {selectedCharDef.isMandatory && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                              ⭐ Core (In Every Game)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-amber-300 font-medium">
                          {selectedCharDef.title} (Max: +{selectedCharDef.maxPoints} pts)
                        </span>
                      </div>
                    </div>

                    {onEquipCharacter && (
                      <button
                        type="button"
                        onClick={() => {
                          onEquipCharacter(selectedCharId);
                          setSimOutput({
                            title: `Switched Character to ${selectedCharDef.name}!`,
                            message: `You are now playing as ${selectedCharDef.name}. Your secret objective has been updated on your player screen.`,
                            logText: `Equipped ${selectedCharDef.name} character.`,
                            type: 'success',
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        title="Play as this character in the current game"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play As This Character</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 italic">
                    "{selectedCharDef.lore}"
                  </p>

                  <div className="p-3 bg-amber-950/50 border border-amber-600/40 rounded-xl space-y-1">
                    <div className="text-[10px] text-amber-300 uppercase font-bold tracking-wider">
                      Secret Objective (Calculated at End of Game):
                    </div>
                    <p className="text-xs text-amber-100 font-medium">
                      {selectedCharDef.objectiveSummary}
                    </p>
                  </div>
                </div>

                {/* Angad Featured Interactive Simulator or Character Explainer */}
                {selectedCharId === 'Angad' ? (
                  <div className="p-4 bg-purple-950/40 border-2 border-purple-500/50 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                          Interactive Angad's Gambit Simulator
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        Current Score: {angadScore > 0 ? `+${angadScore}` : angadScore} pts ({angadGambitsRun}/3 used)
                      </span>
                    </div>

                    <p className="text-xs text-purple-200/90 leading-relaxed">
                      Angad does not have an active power card button. Instead, Angad's ability is built into the <strong>"Submit Round Guess"</strong> modal as a special toggle! Up to 3 times per game, you can declare a guess as a <em>Gambit</em>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-purple-800/40">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                          Simulate Guess Resolution Outcome:
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAngadGuessResult('correct')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                              angadGuessResult === 'correct'
                                ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                                : 'bg-slate-900 text-slate-300 border-slate-700'
                            }`}
                          >
                            Correct Guess (+3)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAngadGuessResult('incorrect')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                              angadGuessResult === 'incorrect'
                                ? 'bg-red-600 text-white border-red-400 shadow-xs'
                                : 'bg-slate-900 text-slate-300 border-slate-700'
                            }`}
                          >
                            Incorrect Guess (−3)
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          onClick={handleSimulateAngadGambit}
                          disabled={angadGambitsRun >= 3}
                          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Simulate Gambit Guess ({angadGambitsRun}/3)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAngadGambitsRun(0);
                            setAngadScore(0);
                            setSimOutput(null);
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
                          title="Reset Gambit Test"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Output */}
                    {simOutput && (
                      <div
                        className={`p-3.5 rounded-xl border space-y-1 text-xs animate-in fade-in ${
                          simOutput.type === 'success'
                            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                            : 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{simOutput.title}</span>
                        </div>
                        <p className="text-slate-200">{simOutput.message}</p>
                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          {simOutput.details}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                      Objective Scoring Mechanics & Strategy:
                    </span>
                    <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                      {selectedCharId === 'Rama' && (
                        <p>
                          <strong>Ram's Mission:</strong> You earn <strong className="text-emerald-400">+8 points</strong> if you personally make at least one correct round guess against the player holding Ravana. Use your questions to deduce who holds Ravana!
                        </p>
                      )}
                      {selectedCharId === 'Ravana' && (
                        <p>
                          <strong>Ravana's Mission:</strong> You earn <strong className="text-emerald-400">+8 points</strong> if BOTH cards belonging to the player holding Sita are revealed before the game concludes. Help coordinate attacks against Sita's hand!
                        </p>
                      )}
                      {selectedCharId === 'Lakshmana' && (
                        <p>
                          <strong>Laxmana's Vow:</strong> You earn <strong className="text-emerald-400">+5 points</strong> if Ram finishes the game with at least 1 card unrevealed (survives). Protect Ram and deflect suspicion away from him!
                        </p>
                      )}
                      {selectedCharId === 'Sita' && (
                        <p>
                          <strong>Sita's Endurance:</strong> Survive with 1 hidden card for <strong className="text-emerald-400">+5 points</strong>, or with both cards hidden for a massive <strong className="text-emerald-400">+8 points</strong>! Keep answers tricky and use deduction notes carefully.
                        </p>
                      )}
                      {selectedCharId === 'Hanuman' && (
                        <p>
                          <strong>Lanka Dahan:</strong> Earn <strong className="text-emerald-400">+2 points</strong> for every different opponent you personally guess correctly (up to 4 different opponents = <strong className="text-emerald-400">+8 points</strong> max). Spread your attacks!
                        </p>
                      )}
                      {selectedCharId === 'Kumbhakarna' && (
                        <p>
                          <strong>The Great Sleep:</strong> Earn <strong className="text-emerald-400">+2 points</strong> for every incorrect guess made by opponents against either of your cards (max <strong className="text-emerald-400">+6 points</strong>). Confuse your attackers into guessing wrong!
                        </p>
                      )}
                      {selectedCharId === 'Sugriva' && (
                        <p>
                          <strong>Vanara Alliance:</strong> Earn <strong className="text-emerald-400">+2 points</strong> each time at least 2 players make the same correct exact-card guess in a round (max <strong className="text-emerald-400">+6 points</strong>).
                        </p>
                      )}
                      {selectedCharId === 'Jambavan' && (
                        <p>
                          <strong>Wisdom of Ages:</strong> Earn <strong className="text-emerald-400">+2 points</strong> for each different suit (Hearts, Diamonds, Clubs, Spades) you personally make a correct guess in (max <strong className="text-emerald-400">+8 points</strong>).
                        </p>
                      )}
                      {selectedCharId === 'Shabari' && (
                        <p>
                          <strong>Sacred Offering:</strong> Choose a suit at game start. You earn <strong className="text-emerald-400">+2 points</strong> for every correct guess of that specific suit (max <strong className="text-emerald-400">+8 points</strong>).
                        </p>
                      )}
                      {selectedCharId === 'Vibhishana' && (
                        <p>
                          <strong>Betrayal of Lanka:</strong> Earn <strong className="text-emerald-400">+10 points</strong> if both cards belonging to your secret partner are exposed by the end. A high-risk betrayal objective!
                        </p>
                      )}
                      {selectedCharId === 'Patakha' && (
                        <p>
                          <strong>The Great Explosion:</strong> Both of your cards must be exposed by the end of Round 2 for <strong className="text-emerald-400">+8 points</strong>. Give revealing answers early to tempt opponents to guess you!
                        </p>
                      )}
                      {selectedCharId === 'Narada' && (
                        <p>
                          <strong>The Divine Messenger:</strong> Ask at least 5 public questions and zero private questions across the entire game for <strong className="text-emerald-400">+4 points</strong>!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Click <strong>"Equip In Current Game"</strong> to test any power or character live on your board!
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all cursor-pointer"
          >
            Close Lab
          </button>
        </div>
      </div>
    </div>
  );
};
