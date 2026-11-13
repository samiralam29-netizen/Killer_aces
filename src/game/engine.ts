import type {
  CardValue,
  CharacterId,
  CorrectGuessRecord,
  GameLogEntry,
  GameScoreBreakdown,
  GuessResolutionResult,
  Player,
  PlayingCard,
  PowerId,
  QuestionLogEntry,
  QuestionRequest,
  Suit,
} from '../types/game.ts';
import {
  ALL_POWER_IDS,
  DEFAULT_QUESTION_BUDGET,
  MANDATORY_CHARACTERS,
  OPTIONAL_CHARACTERS,
  ROUND_SCHEDULE,
  SUITS,
  PlayerCountMode,
  getRoundSchedule,
} from './constants.ts';
import { evaluateQuestion } from './questionEvaluator.ts';
import { validateQuestion } from './questionValidator.ts';
import { computeFinalScores, computeRunningScore } from './scoring.ts';

export interface GameState {
  roomCode: string;
  playerCount: PlayerCountMode;
  round: number; // 1, 2, 3, 4
  roundTimeRemainingSeconds: number;
  isTimerRunning: boolean;
  isGameOver: boolean;
  roundGuessesResolved: boolean; // True once current round guesses have been evaluated
  activePlayerId: string; // The player currently viewing/acting in UI
  players: Player[];
  centralCards: PlayingCard[]; // 16 cards total
  playerRunningPoints: Record<string, number>; // Base guess points map
  sugrivaSharedCount: number; // Count of shared exact-card guess occurrences
  questionLogs: QuestionLogEntry[];
  gameLogs: GameLogEntry[];
  lastResolutionResult?: GuessResolutionResult;
  kumbhakarnaAnnouncements: { round: number; message: string }[];
}

export function createDeck(playerCount: PlayerCountMode = 8): PlayingCard[] {
  const maxVal = playerCount === 6 ? 6 : 8;
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (let val = 1; val <= maxVal; val++) {
      deck.push({
        id: `${suit}_${val}`,
        suit,
        value: val as CardValue,
        isRevealed: false,
      });
    }
  }
  return deck;
}

export function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function assignPartners(playerIds: string[], characterAssignments: Record<string, CharacterId>): Record<string, string> {
  // Constraint: Ravana is NEVER Rama's partner.
  const ramaId = Object.keys(characterAssignments).find((id) => characterAssignments[id] === 'Rama');
  const ravanaId = Object.keys(characterAssignments).find((id) => characterAssignments[id] === 'Ravana');

  let partners: Record<string, string> = {};
  let valid = false;
  let attempts = 0;

  while (!valid && attempts < 1000) {
    attempts++;
    partners = {};
    const pool = shuffle([...playerIds]);
    for (let i = 0; i < pool.length; i += 2) {
      const p1 = pool[i];
      const p2 = pool[i + 1];
      partners[p1] = p2;
      partners[p2] = p1;
    }

    if (ramaId && ravanaId) {
      if (partners[ramaId] !== ravanaId) {
        valid = true;
      }
    } else {
      valid = true;
    }
  }

  return partners;
}

export function createInitialGame(seed?: {
  playerCount?: PlayerCountMode;
  characterOverride?: CharacterId[];
  powerOverride?: PowerId[];
  roomCode?: string;
}): GameState {
  const playerCount: PlayerCountMode = seed?.playerCount === 6 ? 6 : 8;
  const roomCode = seed?.roomCode || Math.random().toString(36).substring(2, 7).toUpperCase();

  // 1. Select characters: exactly playerCount characters
  let chosenCharacters: CharacterId[] = [];
  if (seed?.characterOverride && seed.characterOverride.length === playerCount) {
    chosenCharacters = [...seed.characterOverride];
  } else {
    const shuffledOptional = shuffle([...OPTIONAL_CHARACTERS]);
    const numOptional = playerCount === 6 ? 2 : 4;
    chosenCharacters = [...MANDATORY_CHARACTERS, ...shuffledOptional.slice(0, numOptional)];
  }
  chosenCharacters = shuffle(chosenCharacters);

  // Strict Guarantee: Ram, Ravana, Laxmana, and Sita MUST ALWAYS be in the game!
  const mandatoryChars: CharacterId[] = ['Rama', 'Ravana', 'Lakshmana', 'Sita'];
  for (const m of mandatoryChars) {
    if (!chosenCharacters.includes(m)) {
      const replaceIdx = chosenCharacters.findIndex((c) => !mandatoryChars.includes(c));
      if (replaceIdx !== -1) {
        chosenCharacters[replaceIdx] = m;
      } else if (chosenCharacters.length < playerCount) {
        chosenCharacters.push(m);
      }
    }
  }

  // 2. Select powers: exactly playerCount powers from ALL_POWER_IDS
  let chosenPowers: PowerId[] = [];
  if (seed?.powerOverride && seed.powerOverride.length === playerCount) {
    chosenPowers = [...seed.powerOverride];
  } else {
    const shuffledPowers = shuffle([...ALL_POWER_IDS]);
    chosenPowers = shuffledPowers.slice(0, playerCount);
  }

  // 3. Shuffle deck: 24 cards (if 6p) or 32 cards (if 8p)
  const deck = shuffle(createDeck(playerCount));
  const playerCards: [PlayingCard, PlayingCard][] = [];
  for (let i = 0; i < playerCount; i++) {
    playerCards.push([deck[i * 2], deck[i * 2 + 1]]);
  }

  const centralCards = deck.slice(playerCount * 2);
  // Round 1 reveals central cards: 5 cards for 6p (indices 0..4), 6 cards for 8p (indices 0..5)
  const initialCentralReveal = playerCount === 6 ? 5 : 6;
  for (let i = 0; i < initialCentralReveal; i++) {
    centralCards[i].isRevealed = true;
    centralCards[i].revealedInRound = 1;
  }

  const allNames = [
    'Aarav',
    'Diya',
    'Kabir',
    'Ananya',
    'Rohan',
    'Meera',
    'Dev',
    'Ishaan',
  ];
  const playerNames = allNames.slice(0, playerCount);
  const playerIds = Array.from({ length: playerCount }, (_, idx) => `p${idx + 1}`);

  const charMap: Record<string, CharacterId> = {};
  playerIds.forEach((id, idx) => {
    charMap[id] = chosenCharacters[idx];
  });

  const partnerMap = assignPartners(playerIds, charMap);

  const players: Player[] = playerIds.map((id, index) => {
    const charId = chosenCharacters[index];
    const partnerId = partnerMap[id];
    const partnerIdx = playerIds.indexOf(partnerId);
    const partnerCards = playerCards[partnerIdx];
    return {
      id,
      name: playerNames[index],
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${playerNames[index]}`,
      isBot: index !== 0, // p1 is user by default
      cards: playerCards[index],
      secretPartnerId: partnerId,
      partnerSuits: [partnerCards[0].suit, partnerCards[1].suit],
      partnerKnownToMe: false,
      cardTags: {},
      characterId: charId,
      powerId: chosenPowers[index],
      powerUsed: false,
      powerDisabled: false,
      questionTokens: DEFAULT_QUESTION_BUDGET, // 10 tokens for the entire game
      normalQuestionTokens: DEFAULT_QUESTION_BUDGET,
      bonusTokensAvailable: 0,
      baseQuestionsUsed: {},
      bonusTokensBought: 0,
      publicQuestionsAsked: 0,
      privateQuestionsAsked: 0,
      shabariChosenSuit: charId === 'Shabari' ? 'Hearts' : undefined,
      angadGambitsUsed: 0,
      angadGambitScore: 0,
      hanumanExtraGuessAvailable: false,
      hanumanLeapTriggered: false,
      kumbhakarnaRoundBonus: 0,
      kumbhakarnaTotalBonus: 0,
      correctGuesses: [],
      incorrectGuessesCount: 0,
    };
  });

  const initialPointsMap: Record<string, number> = {};
  players.forEach((p) => {
    initialPointsMap[p.id] = 0;
  });

  const initialLogs: GameLogEntry[] = [
    {
      id: `log_init_${Date.now()}`,
      round: 1,
      timestamp: Date.now(),
      type: 'system',
      text: `Diwali BLINDS started (${playerCount} Players)! Round 1 is live. ${initialCentralReveal} central cards revealed. ${playerCount} characters and powers in play.`,
    },
  ];

  const roundSchedule = getRoundSchedule(playerCount);

  return {
    roomCode,
    playerCount,
    round: 1,
    roundTimeRemainingSeconds: roundSchedule[1].durationMinutes * 60,
    isTimerRunning: false,
    isGameOver: false,
    roundGuessesResolved: false,
    activePlayerId: 'p1',
    players,
    centralCards,
    playerRunningPoints: initialPointsMap,
    sugrivaSharedCount: 0,
    questionLogs: [],
    gameLogs: initialLogs,
    kumbhakarnaAnnouncements: [],
  };
}

// -------------------------------------------------------------
// QUESTION HANDLING
// -------------------------------------------------------------
export function askQuestion(
  state: GameState,
  req: QuestionRequest
): { success: boolean; error?: string; state: GameState } {
  const asker = state.players.find((p) => p.id === req.askerId);
  const target = state.players.find((p) => p.id === req.targetId);

  if (!asker || !target) {
    return { success: false, error: 'Player not found.', state };
  }

  // Check token cost
  if (asker.questionTokens < 1) {
    return { success: false, error: 'Not enough Question Tokens remaining.', state };
  }

  // Token limit logic:
  // Normal tokens have a cap of 2 questions per target player.
  // Questions beyond 2 to the same target require a Bonus Question Token.
  const targetNormalUsed = asker.baseQuestionsUsed?.[target.id] || 0;
  const normalAvailable =
    asker.normalQuestionTokens !== undefined
      ? asker.normalQuestionTokens
      : Math.max(0, asker.questionTokens - (asker.bonusTokensAvailable || 0));
  const bonusAvailable = asker.bonusTokensAvailable || 0;

  const canUseNormal = targetNormalUsed < 2 && normalAvailable > 0;
  const canUseBonus = bonusAvailable > 0;

  if (!canUseNormal && !canUseBonus) {
    if (targetNormalUsed >= 2) {
      return {
        success: false,
        error: `Maximum 2 normal questions reached for ${target.name}. You must use a Bonus Question Token to ask them additional questions.`,
        state,
      };
    }
    return { success: false, error: 'Not enough Question Tokens remaining.', state };
  }

  // Strict Validation: Must validate before token deduction!
  const valResult = validateQuestion(req);
  if (!valResult.isValid) {
    return { success: false, error: valResult.errorMessage, state };
  }

  // Deduct token: use normal token if eligible, otherwise consume a bonus token
  const usedBonusToken = !canUseNormal && canUseBonus;
  const newNormalTokens = usedBonusToken ? normalAvailable : normalAvailable - 1;
  const newBonusTokens = usedBonusToken ? bonusAvailable - 1 : bonusAvailable;
  const updatedBaseQuestionsUsed = {
    ...(asker.baseQuestionsUsed || {}),
    [target.id]: usedBonusToken ? targetNormalUsed : targetNormalUsed + 1,
  };

  // Deduct token
  const isTenHeadsUsed = !!(req.secondaryTargetIds && req.secondaryTargetIds.length > 0);
  const newPlayers = state.players.map((p) => {
    if (p.id === asker.id) {
      return {
        ...p,
        powerUsed: isTenHeadsUsed ? true : p.powerUsed,
        tenHeadsArmed: false,
        questionTokens: newNormalTokens + newBonusTokens,
        normalQuestionTokens: newNormalTokens,
        bonusTokensAvailable: newBonusTokens,
        baseQuestionsUsed: updatedBaseQuestionsUsed,
        publicQuestionsAsked: p.publicQuestionsAsked + (req.isPublic ? 1 : 0),
        privateQuestionsAsked: p.privateQuestionsAsked + (req.isPublic ? 0 : 1),
      };
    }
    return p;
  });

  // Evaluate for primary target
  const { result, formattedQuestion, formattedAnswer } = evaluateQuestion(req, target.cards);

  const questionLog: QuestionLogEntry = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    round: state.round,
    timestamp: Date.now(),
    askerId: asker.id,
    targetId: target.id,
    isPublic: req.isPublic,
    questionText: formattedQuestion,
    answerText: formattedAnswer,
    answerBoolean: result,
  };

  const newLogs: GameLogEntry[] = [
    {
      id: `log_q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      round: state.round,
      timestamp: Date.now(),
      type: 'question',
      text: req.isPublic
        ? `${asker.name} publicly asked ${target.name}: "${formattedQuestion}" -> ${formattedAnswer} (+1 pt)`
        : `${asker.name} privately asked ${target.name}: "${formattedQuestion}" -> ${formattedAnswer}`,
      isPrivateTo: req.isPublic ? undefined : asker.id,
    },
  ];

  // Secondary targets (Ten Heads power)
  const secondaryLogs: QuestionLogEntry[] = [];
  if (req.secondaryTargetIds && req.secondaryTargetIds.length > 0) {
    for (const secId of req.secondaryTargetIds) {
      const secTarget = state.players.find((p) => p.id === secId);
      if (secTarget) {
        const secEval = evaluateQuestion(req, secTarget.cards);
        secondaryLogs.push({
          id: `q_sec_${Date.now()}_${secId}`,
          round: state.round,
          timestamp: Date.now(),
          askerId: asker.id,
          targetId: secTarget.id,
          isPublic: false,
          questionText: secEval.formattedQuestion,
          answerText: secEval.formattedAnswer,
          answerBoolean: secEval.result,
        });
        newLogs.push({
          id: `log_sec_${Date.now()}_${secId}`,
          round: state.round,
          timestamp: Date.now(),
          type: 'question',
          text: `[Ten Heads] ${asker.name} privately asked ${secTarget.name}: "${secEval.formattedQuestion}" -> ${secEval.formattedAnswer}`,
          isPrivateTo: asker.id,
        });
      }
    }
  }

  return {
    success: true,
    state: {
      ...state,
      players: newPlayers,
      questionLogs: [questionLog, ...secondaryLogs, ...state.questionLogs],
      gameLogs: [...newLogs, ...state.gameLogs],
    },
  };
}

export function buyBonusToken(
  state: GameState,
  playerId: string
): { success: boolean; error?: string; state: GameState } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: 'Player not found.', state };

  const basePoints = state.playerRunningPoints[playerId] || 0;
  const currentRunningScore = computeRunningScore(player, basePoints);
  if (currentRunningScore < 3) {
    return {
      success: false,
      error: 'Points cannot go negative! You must have at least 3 points to purchase a bonus token.',
      state,
    };
  }

  const newPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      const normalTokens = p.normalQuestionTokens !== undefined ? p.normalQuestionTokens : p.questionTokens;
      const bonusTokens = (p.bonusTokensAvailable || 0) + 1;
      return {
        ...p,
        normalQuestionTokens: normalTokens,
        bonusTokensAvailable: bonusTokens,
        questionTokens: normalTokens + bonusTokens,
        bonusTokensBought: p.bonusTokensBought + 1,
      };
    }
    return p;
  });

  const log: GameLogEntry = {
    id: `log_token_${Date.now()}`,
    round: state.round,
    timestamp: Date.now(),
    type: 'system',
    text: `${player.name} bought a Bonus Question Token (−3 pts).`,
  };

  return {
    success: true,
    state: {
      ...state,
      players: newPlayers,
      gameLogs: [log, ...state.gameLogs],
    },
  };
}

// -------------------------------------------------------------
// GUESS SUBMISSION & EDITING
// -------------------------------------------------------------
export function submitOrEditGuess(
  state: GameState,
  guesserId: string,
  targetPlayerId: string,
  suit: Suit,
  value: CardValue,
  isGambit?: boolean
): { success: boolean; error?: string; state: GameState } {
  const guesser = state.players.find((p) => p.id === guesserId);
  const target = state.players.find((p) => p.id === targetPlayerId);

  if (!guesser || !target) {
    return { success: false, error: 'Player not found.', state };
  }

  if (guesserId === targetPlayerId) {
    return { success: false, error: 'You cannot guess your own card.', state };
  }

  // Check Nagpash block
  if (guesser.nagpashBlockedThisRound) {
    return { success: false, error: 'You are bound by Nagpash and cannot submit a guess this round.', state };
  }

  // Check Lakshman Rekha block
  if (target.lakshmanRekhaActiveThisRound) {
    return { success: false, error: `${target.name} is protected by Lakshman Rekha this round.`, state };
  }

  // Check Angad gambit constraint
  if (isGambit) {
    if (guesser.characterId !== 'Angad') {
      return { success: false, error: 'Only Angad can mark a guess as a Gambit.', state };
    }
    if (guesser.angadGambitsUsed >= 3 && !guesser.submittedGuess?.isGambit) {
      return { success: false, error: 'Angad can mark at most 3 Gambits in a game.', state };
    }
  }

  const isEditing = !!guesser.submittedGuess;

  const newPlayers = state.players.map((p) => {
    if (p.id === guesserId) {
      return {
        ...p,
        submittedGuess: {
          targetPlayerId,
          suit,
          value,
          isGambit: !!isGambit,
          submittedAtRound: state.round,
        },
      };
    }
    return p;
  });

  const log: GameLogEntry = {
    id: `log_guess_sub_${Date.now()}_${guesserId}`,
    round: state.round,
    timestamp: Date.now(),
    type: 'guess',
    text: isEditing
      ? `${guesser.name} updated their submitted guess.`
      : `${guesser.name} locked in a guess.`,
    isPrivateTo: guesserId,
  };

  return {
    success: true,
    state: {
      ...state,
      players: newPlayers,
      gameLogs: [log, ...state.gameLogs],
    },
  };
}

// -------------------------------------------------------------
// POWER ACTIVATIONS
// -------------------------------------------------------------
export function activatePower(
  state: GameState,
  playerId: string,
  targetPlayerId?: string
): { success: boolean; message: string; state: GameState } {
  const user = state.players.find((p) => p.id === playerId);
  if (!user) return { success: false, message: 'Player not found.', state };

  if (user.powerDisabled) {
    return { success: false, message: 'Your power has been permanently disabled by Sudarshan Chakra.', state };
  }

  if (user.powerUsed) {
    return { success: false, message: 'Your Power Card has already been used.', state };
  }

  const target = targetPlayerId ? state.players.find((p) => p.id === targetPlayerId) : undefined;
  const powerId = user.powerId;

  let newPlayers = [...state.players];
  let newCentralCards = [...state.centralCards];
  const newLogs: GameLogEntry[] = [];
  let userMessage = '';

  switch (powerId) {
    case 'Divine Sight': {
      if (!target) return { success: false, message: 'Target player required.', state };
      userMessage = `Divine Sight revealed that ${target.name} holds the Character Card: ${target.characterId}.`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: 'power',
        text: `${user.name} used Divine Sight to peer into ${target.name}'s character.`,
        isPrivateTo: user.id,
      });
      break;
    }

    case 'Nagpash': {
      if (!target) return { success: false, message: 'Target player required.', state };
      newPlayers = newPlayers.map((p) => {
        if (p.id === target.id) {
          return {
            ...p,
            nagpashBlockedThisRound: true,
            submittedGuess: undefined, // cancel existing guess
          };
        }
        return p;
      });
      userMessage = `Nagpash cast upon ${target.name}! Any submitted guess was cancelled and they cannot guess this round.`;
      newLogs.push(
        {
          id: `log_pow_${Date.now()}_tgt`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: `You have been bound by Nagpash! Your submitted guess has been cancelled and you cannot guess this round.`,
          isPrivateTo: target.id,
        },
        {
          id: `log_pow_${Date.now()}_usr`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: `You cast Nagpash on ${target.name}! They cannot guess this round.`,
          isPrivateTo: user.id,
        }
      );
      break;
    }

    case 'Lakshman Rekha': {
      newPlayers = newPlayers.map((p) => {
        if (p.id === user.id) {
          return { ...p, lakshmanRekhaActiveThisRound: true };
        }
        // Cancel any guess targeting user
        if (p.submittedGuess?.targetPlayerId === user.id) {
          return { ...p, submittedGuess: undefined };
        }
        return p;
      });
      userMessage = `Lakshman Rekha drawn! No player can guess your cards this round, and any guesses against you were cancelled.`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: 'power',
        text: `You drew the inviolable Lakshman Rekha! No cards can be guessed against you this round.`,
        isPrivateTo: user.id,
      });
      break;
    }

    case 'Sanjeevani': {
      newPlayers = newPlayers.map((p) => {
        if (p.id === user.id) {
          const normalTokens = p.normalQuestionTokens !== undefined ? p.normalQuestionTokens : p.questionTokens;
          const bonusTokens = (p.bonusTokensAvailable || 0) + 2;
          return {
            ...p,
            normalQuestionTokens: normalTokens,
            bonusTokensAvailable: bonusTokens,
            questionTokens: normalTokens + bonusTokens,
          };
        }
        return p;
      });
      userMessage = `Sanjeevani herb consumed! You received 2 extra Question Tokens.`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: 'power',
        text: `You consumed Sanjeevani and received 2 Question Tokens.`,
        isPrivateTo: user.id,
      });
      break;
    }

    case 'Ten Heads': {
      userMessage = `Ten Heads is ready! Open the Question Composer to privately ask three opponents simultaneously for just 1 Question Token.`;
      break;
    }

    case 'Secret of Lanka': {
      if (!target) return { success: false, message: 'Target player required.', state };
      // Partner rule: "The player does not know their partner's identity. They may accidentally select their own partner.
      // If they do, the power is spent. They learn only that the selected player is their partner. No additional info."
      if (target.id === user.secretPartnerId) {
        userMessage = `Partner Revealed! ${target.name} is your secret partner! Because they are your partner, no suit information is revealed.`;
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: 'partner_hit',
          text: `Secret of Lanka targeted your secret partner ${target.name}!`,
          isPrivateTo: user.id,
        });
      } else {
        const unrevealed = target.cards.filter((c) => !c.isRevealed);
        const suits = unrevealed.map((c) => c.suit).join(', ');
        userMessage = `Secret of Lanka revealed: ${target.name}'s unrevealed card suit(s) are: ${suits || 'None (all revealed)'}.`;
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: `Secret of Lanka revealed ${target.name}'s card suits to you: ${suits}`,
          isPrivateTo: user.id,
        });
      }
      break;
    }

    case 'Brahma Gyan': {
      if (!target) return { success: false, message: 'Target player required.', state };
      if (target.id === user.secretPartnerId) {
        userMessage = `Partner Revealed! ${target.name} is your secret partner! Because they are your partner, no card value is revealed.`;
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: 'partner_hit',
          text: `Brahma Gyan targeted your secret partner ${target.name}!`,
          isPrivateTo: user.id,
        });
      } else {
        const unrevealed = target.cards.filter((c) => !c.isRevealed);
        if (unrevealed.length > 0) {
          const val = unrevealed[0].value === 1 ? 'A (1)' : unrevealed[0].value;
          userMessage = `Brahma Gyan revealed that one of ${target.name}'s unrevealed cards has value ${val}.`;
        } else {
          userMessage = `${target.name} has no unrevealed cards.`;
        }
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: userMessage,
          isPrivateTo: user.id,
        });
      }
      break;
    }

    case 'Vanara Sena': {
      if (!target) return { success: false, message: 'Target player required.', state };
      newPlayers = newPlayers.map((p) => {
        if (p.id === user.id || p.id === target.id) {
          const normalTokens = p.normalQuestionTokens !== undefined ? p.normalQuestionTokens : p.questionTokens;
          const bonusTokens = (p.bonusTokensAvailable || 0) + 1;
          return {
            ...p,
            normalQuestionTokens: normalTokens,
            bonusTokensAvailable: bonusTokens,
            questionTokens: normalTokens + bonusTokens,
          };
        }
        return p;
      });
      userMessage = `Vanara Sena united! You and ${target.name} each received 1 Question Token.`;
      newLogs.push(
        {
          id: `log_pow_${Date.now()}_usr`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: `You united Vanara Sena with ${target.name}! You each received 1 Question Token.`,
          isPrivateTo: user.id,
        },
        {
          id: `log_pow_${Date.now()}_tgt`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: `Vanara Sena was called! You and an ally each received 1 Question Token.`,
          isPrivateTo: target.id,
        }
      );
      break;
    }

    case 'Sudarshan Chakra': {
      if (!target) return { success: false, message: 'Target player required.', state };
      newPlayers = newPlayers.map((p) => {
        if (p.id === target.id) {
          return { ...p, powerDisabled: true };
        }
        return p;
      });
      userMessage = `Sudarshan Chakra severed ${target.name}'s power! Their Power Card (${target.powerId}) is permanently disabled.`;
      newLogs.push(
        {
          id: `log_pow_${Date.now()}_usr`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: `You cast Sudarshan Chakra on ${target.name}, permanently disabling their power card.`,
          isPrivateTo: user.id,
        },
        {
          id: `log_pow_${Date.now()}_tgt`,
          round: state.round,
          timestamp: Date.now(),
          type: 'power',
          text: `Your Power Card has been permanently disabled by Sudarshan Chakra!`,
          isPrivateTo: target.id,
        }
      );
      break;
    }

    case 'Makhan Chori': {
      if (!target) return { success: false, message: 'Target player required.', state };
      if (!target.powerUsed && !target.powerDisabled) {
        const stolenPower = target.powerId;
        newPlayers = newPlayers.map((p) => {
          if (p.id === target.id) {
            return { ...p, powerUsed: true };
          }
          if (p.id === user.id) {
            return { ...p, powerId: stolenPower, powerUsed: false };
          }
          return p;
        });
        userMessage = `Makhan Chori success! You stole ${target.name}'s unused Power Card: ${stolenPower}!`;
        newLogs.push(
          {
            id: `log_pow_${Date.now()}`,
            round: state.round,
            timestamp: Date.now(),
            type: 'power',
            text: `${user.name} used Makhan Chori on ${target.name}!`,
            isPrivateTo: user.id,
          },
          {
            id: `log_pow_${Date.now()}_tgt`,
            round: state.round,
            timestamp: Date.now(),
            type: 'power',
            text: `Your Power Card was stolen by Makhan Chori!`,
            isPrivateTo: target.id,
          }
        );
        return {
          success: true,
          message: userMessage,
          state: {
            ...state,
            players: newPlayers,
            gameLogs: [...newLogs, ...state.gameLogs],
          },
        };
      } else {
        userMessage = `${target.name}'s Power Card was already used or disabled. You received nothing.`;
      }
      break;
    }

    case 'Divya Shrishti': {
      const unrevealedCentral = newCentralCards.filter((c) => !c.isRevealed).slice(0, 3);
      const cardNames = unrevealedCentral.map((c) => `${c.value === 1 ? 'A' : c.value} of ${c.suit}`).join(', ');
      userMessage = `Divya Shrishti revealed the next 3 central pile cards: ${cardNames}`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: 'power',
        text: userMessage,
        isPrivateTo: user.id,
      });
      break;
    }

    case "Hanuman's Leap": {
      userMessage = "Hanuman's Leap is an automatic passive power. It activates when your first guess is incorrect.";
      return { success: false, message: userMessage, state };
    }
  }

  // Mark power used for non-steal cases (Ten Heads is spent only upon question submission)
  newPlayers = newPlayers.map((p) => {
    if (p.id === user.id) {
      if (powerId === 'Ten Heads') {
        return { ...p, tenHeadsArmed: true, powerUsed: false };
      }
      return { ...p, powerUsed: true };
    }
    return p;
  });

  return {
    success: true,
    message: userMessage,
    state: {
      ...state,
      players: newPlayers,
      centralCards: newCentralCards,
      gameLogs: [...newLogs, ...state.gameLogs],
    },
  };
}

// -------------------------------------------------------------
// ROUND GUESS RESOLUTION
// -------------------------------------------------------------
export function resolveRoundGuesses(state: GameState): GameState {
  const currentRound = state.round;
  const basePoints = ROUND_SCHEDULE[currentRound as 1 | 2 | 3 | 4].guessPoints;

  const submitted = state.players
    .filter((p) => p.submittedGuess !== undefined)
    .map((p) => ({
      guesserId: p.id,
      ...p.submittedGuess!,
    }));

  // Track correct guesses to detect splits
  // Map of `${targetPlayerId}_${suit}_${value}` -> guesserIds[]
  const cardGuessMap: Record<string, string[]> = {};
  const partnerHitGuesses: { guesserId: string; targetPlayerId: string }[] = [];

  for (const g of submitted) {
    const guesser = state.players.find((p) => p.id === g.guesserId)!;
    const target = state.players.find((p) => p.id === g.targetPlayerId)!;

    // Check if target has matching card and whether it was unrevealed
    const matchingCard = target.cards.find(
      (c) => c.suit === g.suit && c.value === g.value && !c.isRevealed
    );

    if (matchingCard) {
      // Is target the guesser's secret partner?
      // Rule 4: "When a guess is correct against the guesser's own partner:
      // Privately notify the guesser that the target player is their partner.
      // Award zero points for that guess.
      // Do not reveal the card publicly.
      // Do not award normal correct-guess points.
      // The partner's card remains hidden."
      if (target.id === guesser.secretPartnerId) {
        partnerHitGuesses.push({ guesserId: guesser.id, targetPlayerId: target.id });
      } else {
        const key = `${target.id}_${g.suit}_${g.value}`;
        if (!cardGuessMap[key]) cardGuessMap[key] = [];
        cardGuessMap[key].push(guesser.id);
      }
    }
  }

  // Check Sugriva's Alliance:
  // "Earn +2 each time at least two players make the same correct exact-card guess in a round. Maximum: +6."
  let roundHadSharedCorrectGuess = false;
  for (const key of Object.keys(cardGuessMap)) {
    if (cardGuessMap[key].length >= 2) {
      roundHadSharedCorrectGuess = true;
      break;
    }
  }
  const newSugrivaCount = state.sugrivaSharedCount + (roundHadSharedCorrectGuess ? 1 : 0);

  // New running points copy
  const updatedRunningPoints = { ...state.playerRunningPoints };
  const newLogs: GameLogEntry[] = [];
  const revealedCardsList: { playerId: string; card: PlayingCard }[] = [];
  const resolutionDetails: GuessResolutionResult['resolutions'] = [];

  // 1. Process partner hits
  for (const ph of partnerHitGuesses) {
    const guesser = state.players.find((p) => p.id === ph.guesserId)!;
    const target = state.players.find((p) => p.id === ph.targetPlayerId)!;
    const guess = guesser.submittedGuess!;

    resolutionDetails.push({
      guesserId: guesser.id,
      targetPlayerId: target.id,
      suit: guess.suit,
      value: guess.value,
      isGambit: !!guess.isGambit,
      isPartnerHit: true,
      isCorrect: true, // It matched the card, but it's partner
      pointsAwarded: 0,
    });

    newLogs.push({
      id: `log_partner_hit_${Date.now()}_${guesser.id}`,
      round: currentRound,
      timestamp: Date.now(),
      type: 'partner_hit',
      text: `Private Revelation: ${target.name} is your secret partner! Card remains hidden and 0 points awarded.`,
      isPrivateTo: guesser.id,
    });
  }

  // 2. Process non-partner correct guesses
  const cardsToRevealKeys = new Set<string>();

  for (const [key, guesserIds] of Object.entries(cardGuessMap)) {
    cardsToRevealKeys.add(key);
    const count = guesserIds.length;
    // Split points rounded to nearest whole point:
    const splitPoints = Math.round(basePoints / count);

    for (const gId of guesserIds) {
      const guesser = state.players.find((p) => p.id === gId)!;
      const guess = guesser.submittedGuess!;

      updatedRunningPoints[gId] = (updatedRunningPoints[gId] || 0) + splitPoints;

      resolutionDetails.push({
        guesserId: gId,
        targetPlayerId: guess.targetPlayerId,
        suit: guess.suit,
        value: guess.value,
        isGambit: !!guess.isGambit,
        isPartnerHit: false,
        isCorrect: true,
        pointsAwarded: splitPoints,
        splitWithGuesserIds: count > 1 ? guesserIds.filter((id) => id !== gId) : undefined,
      });

      const target = state.players.find((p) => p.id === guess.targetPlayerId)!;
      const cardStr = `${guess.value === 1 ? 'A' : guess.value} of ${guess.suit}`;
      const splitNotice = count > 1 ? ` (Split ${count} ways: +${splitPoints} pts)` : ` (+${splitPoints} pts)`;

      newLogs.push({
        id: `log_res_cor_${Date.now()}_${gId}`,
        round: currentRound,
        timestamp: Date.now(),
        type: 'guess',
        text: `${guesser.name} correctly guessed ${target.name}'s card: ${cardStr}!${splitNotice}`,
      });
    }
  }

  // 3. Process incorrect guesses internally (NO announcement or public log)
  // Track incorrect guesses against each player for Kumbhakarna and passive effects
  const incorrectGuessesAgainstTarget: Record<string, number> = {};
  const incorrectGuesserIds = new Set<string>();

  for (const g of submitted) {
    const isPartnerHit = partnerHitGuesses.some((ph) => ph.guesserId === g.guesserId);
    const key = `${g.targetPlayerId}_${g.suit}_${g.value}`;
    const isCorrectNonPartner = cardGuessMap[key]?.includes(g.guesserId);

    if (!isPartnerHit && !isCorrectNonPartner) {
      // It is incorrect: tracked internally, but NOT announced publicly
      incorrectGuesserIds.add(g.guesserId);
      incorrectGuessesAgainstTarget[g.targetPlayerId] =
        (incorrectGuessesAgainstTarget[g.targetPlayerId] || 0) + 1;
    }
  }

  // Update players state
  let newPlayers = state.players.map((p) => {
    let correctGuesses = [...p.correctGuesses];
    let incorrectCount = p.incorrectGuessesCount;
    let angadScore = p.angadGambitScore;
    let angadUsed = p.angadGambitsUsed;
    let extraGuess = false; // reset per round unless triggered
    let leapTriggered = p.hanumanLeapTriggered;
    let kumbhakarnaRoundBonus = 0;
    let kumbhakarnaTotal = p.kumbhakarnaTotalBonus;
    let partnerKnown = p.partnerKnownToMe;

    // Check guess submitted by this player
    const guess = p.submittedGuess;
    if (guess) {
      const isPartnerHit = partnerHitGuesses.some((ph) => ph.guesserId === p.id);
      const key = `${guess.targetPlayerId}_${guess.suit}_${guess.value}`;
      const isCorrect = cardGuessMap[key]?.includes(p.id);

      if (isPartnerHit) {
        partnerKnown = true;
      } else if (isCorrect) {
        // Record correct guess
        correctGuesses.push({
          targetPlayerId: guess.targetPlayerId,
          cardId: `${guess.suit}_${guess.value}`,
          suit: guess.suit,
          value: guess.value,
          round: currentRound,
          wasGambit: guess.isGambit,
        });

        if (guess.isGambit) {
          angadUsed += 1;
          angadScore += 3; // +3 additional points
        }
      } else {
        // Incorrect guess (no announcement)
        incorrectCount += 1;
        if (guess.isGambit) {
          angadUsed += 1;
          angadScore -= 3; // −3 points
        }

        // Hanuman's Leap power:
        // "The first time one of your guesses is resolved as incorrect,
        // you receive one extra guess in the following round, in addition to your normal guess."
        if (p.powerId === "Hanuman's Leap" && !p.powerDisabled && !leapTriggered) {
          extraGuess = true;
          leapTriggered = true;
        }
      }
    }

    // Kumbhakarna objective check:
    // "Earn +2 for every incorrect guess made against either of your cards. Maximum: +6."
    // "Keep these points hidden during the round and reveal accumulated points at the end of each round."
    if (p.characterId === 'Kumbhakarna') {
      const missesAgainstMe = incorrectGuessesAgainstTarget[p.id] || 0;
      const potential = missesAgainstMe * 2;
      const currentTotal = p.kumbhakarnaTotalBonus;
      const canGain = Math.max(0, 6 - currentTotal);
      const pointsThisRound = Math.min(potential, canGain);
      kumbhakarnaRoundBonus = pointsThisRound;
      kumbhakarnaTotal = currentTotal + pointsThisRound;
    }

    // Reveal exposed cards on target players
    const updatedCards = p.cards.map((c) => {
      const key = `${p.id}_${c.suit}_${c.value}`;
      if (cardsToRevealKeys.has(key)) {
        revealedCardsList.push({ playerId: p.id, card: { ...c, isRevealed: true, revealedInRound: currentRound } });
        return {
          ...c,
          isRevealed: true,
          revealedInRound: currentRound,
        };
      }
      return c;
    }) as [PlayingCard, PlayingCard];

    return {
      ...p,
      cards: updatedCards,
      correctGuesses,
      incorrectGuessesCount: incorrectCount,
      angadGambitsUsed: angadUsed,
      angadGambitScore: angadScore,
      hanumanExtraGuessAvailable: extraGuess,
      hanumanLeapTriggered: leapTriggered,
      kumbhakarnaRoundBonus,
      kumbhakarnaTotalBonus: kumbhakarnaTotal,
      partnerKnownToMe: partnerKnown,
      submittedGuess: undefined, // Clear submitted guess after resolution
      nagpashBlockedThisRound: false, // Reset Nagpash
      lakshmanRekhaActiveThisRound: false, // Reset Lakshman Rekha
    };
  });

  // Kumbhakarna announcements at round end (Rule 2 & 9)
  const kumbhakarnaAnnouncements = [...state.kumbhakarnaAnnouncements];
  const kumbhPlayer = newPlayers.find((p) => p.characterId === 'Kumbhakarna');
  if (kumbhPlayer) {
    const annMsg = `Kumbhakarna's Slumber: Earned +${kumbhPlayer.kumbhakarnaRoundBonus} bonus points from incorrect guesses this round (Total hidden bonus: ${kumbhPlayer.kumbhakarnaTotalBonus}/6).`;
    kumbhakarnaAnnouncements.push({ round: currentRound, message: annMsg });
    // CRITICAL: Kumbhakarna's slumber must remain PRIVATE to Kumbhakarna only so opponents cannot deduce their identity
    newLogs.push({
      id: `log_kumbh_${Date.now()}`,
      round: currentRound,
      timestamp: Date.now(),
      type: 'system',
      text: annMsg,
      isPrivateTo: kumbhPlayer.id,
    });
  }

  const resolutionResult: GuessResolutionResult = {
    round: currentRound,
    resolutions: resolutionDetails,
    revealedCards: revealedCardsList,
    sugrivaBonusAwardedTo: roundHadSharedCorrectGuess ? ['Sugriva'] : [],
    kumbhakarnaRoundPoints: kumbhPlayer
      ? [{ playerId: kumbhPlayer.id, pointsThisRound: kumbhPlayer.kumbhakarnaRoundBonus, totalSoFar: kumbhPlayer.kumbhakarnaTotalBonus }]
      : [],
  };

  const correctCount = resolutionDetails.filter((r) => r.isCorrect && !r.isPartnerHit).length;
  newLogs.push({
    id: `log_res_done_${Date.now()}`,
    round: currentRound,
    timestamp: Date.now(),
    type: 'system',
    text: `Round ${currentRound} guesses resolved! ${
      correctCount > 0
        ? `${correctCount} correct guess(es) announced and card(s) revealed.`
        : 'No cards were successfully exposed.'
    } Review the table or advance to the next round when ready.`,
  });

  return {
    ...state,
    roundGuessesResolved: true,
    isTimerRunning: false, // Pause timer while reviewing round resolution
    players: newPlayers,
    playerRunningPoints: updatedRunningPoints,
    sugrivaSharedCount: newSugrivaCount,
    lastResolutionResult: resolutionResult,
    kumbhakarnaAnnouncements,
    gameLogs: [...newLogs, ...state.gameLogs],
  };
}

// -------------------------------------------------------------
// ROUND ADVANCEMENT (Separate Action from Resolving Guesses)
// -------------------------------------------------------------
export function advanceToNextRound(state: GameState): GameState {
  const currentRound = state.round;
  const isGameOver = currentRound >= 4;

  if (isGameOver) {
    const finalLog: GameLogEntry = {
      id: `log_game_over_${Date.now()}`,
      round: 4,
      timestamp: Date.now(),
      type: 'system',
      text: 'The 4th and final round has ended! The game is over. Calculating final scores and character objectives.',
    };

    return {
      ...state,
      isGameOver: true,
      roundGuessesResolved: false,
      roundTimeRemainingSeconds: 0,
      isTimerRunning: false,
      gameLogs: [finalLog, ...state.gameLogs],
    };
  }

  const playerCount = state.playerCount || (state.players.length === 6 ? 6 : 8);
  const nextRound = (currentRound + 1) as 1 | 2 | 3 | 4;

  // Central pile cards reveal for NEXT round:
  // 8P: R1: 6 cards, R2: 4 cards (idx 6..9), R3: 2 cards (idx 10..11), R4: 0
  // 6P: R1: 5 cards, R2: 3 cards (idx 5..7), R3: 2 cards (idx 8..9), R4: 0
  const newCentralCards = state.centralCards.map((c, idx) => {
    if (playerCount === 6) {
      if (nextRound === 2 && idx >= 5 && idx < 8) {
        return { ...c, isRevealed: true, revealedInRound: 2 };
      }
      if (nextRound === 3 && idx >= 8 && idx < 10) {
        return { ...c, isRevealed: true, revealedInRound: 3 };
      }
    } else {
      if (nextRound === 2 && idx >= 6 && idx < 10) {
        return { ...c, isRevealed: true, revealedInRound: 2 };
      }
      if (nextRound === 3 && idx >= 10 && idx < 12) {
        return { ...c, isRevealed: true, revealedInRound: 3 };
      }
    }
    return c;
  });

  const schedule = getRoundSchedule(playerCount);
  const durationSec = schedule[nextRound].durationMinutes * 60;
  const advanceLog: GameLogEntry = {
    id: `log_round_start_${Date.now()}`,
    round: nextRound,
    timestamp: Date.now(),
    type: 'system',
    text: `Advanced to Round ${nextRound}! Timer set to ${schedule[nextRound].durationMinutes} minutes. Question tokens and abilities are open.`,
  };

  return {
    ...state,
    round: nextRound,
    roundGuessesResolved: false,
    roundTimeRemainingSeconds: durationSec,
    isTimerRunning: true, // Auto-start timer on every new round
    centralCards: newCentralCards,
    gameLogs: [advanceLog, ...state.gameLogs],
  };
}

export function setShabariSuit(state: GameState, playerId: string, suit: Suit): GameState {
  const newPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, shabariChosenSuit: suit };
    }
    return p;
  });
  return { ...state, players: newPlayers };
}

export function cycleCardTag(state: GameState, playerId: string, cardKey: string): GameState {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) return state;
  const others = state.players.filter((pl) => pl.id !== playerId).map((pl) => pl.name);
  const currentTags = { ...(p.cardTags || {}) };
  const current = currentTags[cardKey];
  if (!current) {
    currentTags[cardKey] = { player: others[0], mode: 'suspect' };
  } else {
    const idx = others.indexOf(current.player);
    if (idx === -1 || idx === others.length - 1) {
      delete currentTags[cardKey];
    } else {
      currentTags[cardKey] = { player: others[idx + 1], mode: current.mode };
    }
  }
  const newPlayers = state.players.map((pl) =>
    pl.id === playerId ? { ...pl, cardTags: currentTags } : pl
  );
  return { ...state, players: newPlayers };
}

export function toggleCardTagMode(state: GameState, playerId: string, cardKey: string): GameState {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p || !p.cardTags?.[cardKey]) return state;
  const currentTags = { ...(p.cardTags || {}) };
  const current = currentTags[cardKey];
  currentTags[cardKey] = {
    ...current,
    mode: current.mode === 'suspect' ? 'not' : 'suspect',
  };
  const newPlayers = state.players.map((pl) =>
    pl.id === playerId ? { ...pl, cardTags: currentTags } : pl
  );
  return { ...state, players: newPlayers };
}

export function setCardTag(
  state: GameState,
  playerId: string,
  cardKey: string,
  tag: { player: string; mode: 'suspect' | 'not' } | null
): GameState {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) return state;
  const currentTags = { ...(p.cardTags || {}) };
  if (!tag) {
    delete currentTags[cardKey];
  } else {
    currentTags[cardKey] = tag;
  }
  const newPlayers = state.players.map((pl) =>
    pl.id === playerId ? { ...pl, cardTags: currentTags } : pl
  );
  return { ...state, players: newPlayers };
}

export function equipPower(
  state: GameState,
  playerId: string,
  powerId: PowerId
): { success: boolean; message: string; state: GameState } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: 'Player not found', state };

  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        powerId,
        powerUsed: false,
        powerDisabled: false,
        tenHeadsArmed: false,
      };
    }
    return p;
  });

  return {
    success: true,
    message: `Equipped ${powerId} on ${player.name}! Power is ready to use.`,
    state: { ...state, players: updatedPlayers },
  };
}

export function equipCharacter(
  state: GameState,
  playerId: string,
  characterId: CharacterId
): { success: boolean; message: string; state: GameState } {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: 'Player not found', state };

  const oldCharacterId = player.characterId;
  if (oldCharacterId === characterId) {
    return { success: true, message: `Already equipped ${characterId}!`, state };
  }

  // 1. If another player already holds this character, swap them
  const otherPlayerWithChar = state.players.find((p) => p.id !== playerId && p.characterId === characterId);

  let updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        characterId,
        angadGambitsUsed: 0,
        angadGambitScore: 0,
      };
    }
    if (otherPlayerWithChar && p.id === otherPlayerWithChar.id) {
      return {
        ...p,
        characterId: oldCharacterId,
        angadGambitsUsed: 0,
        angadGambitScore: 0,
      };
    }
    return p;
  });

  // 2. Strict Guarantee: Ram, Ravana, Lakshmana, Sita MUST always be in the game!
  const mandatoryChars: CharacterId[] = ['Rama', 'Ravana', 'Lakshmana', 'Sita'];
  for (const m of mandatoryChars) {
    const hasMandatory = updatedPlayers.some((p) => p.characterId === m);
    if (!hasMandatory) {
      // Find a player holding an optional character (not the player who just equipped)
      const replaceable = updatedPlayers.find((p) => p.id !== playerId && !mandatoryChars.includes(p.characterId));
      if (replaceable) {
        updatedPlayers = updatedPlayers.map((p) => (p.id === replaceable.id ? { ...p, characterId: m } : p));
      }
    }
  }

  return {
    success: true,
    message: `Equipped Character ${characterId} for ${player.name}!`,
    state: { ...state, players: updatedPlayers },
  };
}

