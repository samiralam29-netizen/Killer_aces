// server.ts
import http from "http";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";

// src/game/constants.ts
var SUITS = ["Hearts", "Diamonds", "Clubs", "Spades"];
var SUIT_COLORS = {
  Hearts: "red",
  Diamonds: "red",
  Clubs: "black",
  Spades: "black"
};
var MANDATORY_CHARACTERS = ["Rama", "Ravana", "Lakshmana", "Sita"];
var OPTIONAL_CHARACTERS = [
  "Vibhishana",
  "Hanuman",
  "Patakha",
  "Narada",
  "Shabari",
  "Angad",
  "Jambavan",
  "Sugriva",
  "Kumbhakarna"
];
var ALL_POWER_IDS = [
  "Divine Sight",
  "Nagpash",
  "Lakshman Rekha",
  "Sanjeevani",
  "Ten Heads",
  "Secret of Lanka",
  "Hanuman's Leap",
  "Brahma Gyan",
  "Vanara Sena",
  "Sudarshan Chakra",
  "Makhan Chori",
  "Divya Shrishti"
];
var METRIC_RANGES = {
  Sum: { min: 2, max: 16 },
  Difference: { min: 0, max: 7 },
  Product: { min: 1, max: 64 },
  "Higher card": { min: 1, max: 8 },
  "Lower card": { min: 1, max: 8 },
  "One of your cards": { min: 1, max: 8 },
  "Red sum": { min: 0, max: 16 },
  "Black sum": { min: 0, max: 16 },
  "Hearts sum": { min: 0, max: 16 },
  "Diamonds sum": { min: 0, max: 16 },
  "Clubs sum": { min: 0, max: 16 },
  "Spades sum": { min: 0, max: 16 },
  "Card count": { min: 0, max: 2 },
  "Red count": { min: 0, max: 2 },
  "Black count": { min: 0, max: 2 },
  "Hearts count": { min: 0, max: 2 },
  "Diamonds count": { min: 0, max: 2 },
  "Clubs count": { min: 0, max: 2 },
  "Spades count": { min: 0, max: 2 },
  "Ace count": { min: 0, max: 2 }
};
var DEFAULT_QUESTION_BUDGET = 10;
var ROUND_SCHEDULE = {
  1: { durationMinutes: 40, centralCardsToReveal: 6, guessPoints: 10 },
  2: { durationMinutes: 20, centralCardsToReveal: 4, guessPoints: 8 },
  3: { durationMinutes: 10, centralCardsToReveal: 2, guessPoints: 6 },
  4: { durationMinutes: 10, centralCardsToReveal: 0, guessPoints: 4 }
};

// src/game/questionEvaluator.ts
function compareValues(actual, comparator, target) {
  switch (comparator) {
    case "=":
      return actual === target;
    case ">":
      return actual > target;
    case "<":
      return actual < target;
    case ">=":
      return actual >= target;
    case "<=":
      return actual <= target;
    case "!=":
      return actual !== target;
    default:
      return false;
  }
}
function evaluateQuestion(req, cards) {
  const [c1, c2] = cards;
  const col1 = SUIT_COLORS[c1.suit];
  const col2 = SUIT_COLORS[c2.suit];
  if (req.kind === "numeric") {
    const metric = req.numericMetric;
    const op = req.comparator;
    const val = req.numericValue;
    let actual = 0;
    let questionText = `${metric} ${op} ${val}?`;
    switch (metric) {
      case "Sum":
        actual = c1.value + c2.value;
        break;
      case "Difference":
        actual = Math.abs(c1.value - c2.value);
        break;
      case "Product":
        actual = c1.value * c2.value;
        break;
      case "Higher card":
        actual = Math.max(c1.value, c2.value);
        break;
      case "Lower card":
        actual = Math.min(c1.value, c2.value);
        break;
      case "One of your cards":
        const match1 = compareValues(c1.value, op, val);
        const match2 = compareValues(c2.value, op, val);
        const resOne = match1 || match2;
        return {
          result: resOne,
          formattedQuestion: `Is one of your cards ${op} ${val}?`,
          formattedAnswer: resOne ? "YES" : "NO"
        };
      case "Red sum":
        actual = (col1 === "red" ? c1.value : 0) + (col2 === "red" ? c2.value : 0);
        break;
      case "Black sum":
        actual = (col1 === "black" ? c1.value : 0) + (col2 === "black" ? c2.value : 0);
        break;
      case "Hearts sum":
        actual = (c1.suit === "Hearts" ? c1.value : 0) + (c2.suit === "Hearts" ? c2.value : 0);
        break;
      case "Diamonds sum":
        actual = (c1.suit === "Diamonds" ? c1.value : 0) + (c2.suit === "Diamonds" ? c2.value : 0);
        break;
      case "Clubs sum":
        actual = (c1.suit === "Clubs" ? c1.value : 0) + (c2.suit === "Clubs" ? c2.value : 0);
        break;
      case "Spades sum":
        actual = (c1.suit === "Spades" ? c1.value : 0) + (c2.suit === "Spades" ? c2.value : 0);
        break;
      case "Card count":
        actual = 2;
        break;
      case "Red count":
        actual = (col1 === "red" ? 1 : 0) + (col2 === "red" ? 1 : 0);
        break;
      case "Black count":
        actual = (col1 === "black" ? 1 : 0) + (col2 === "black" ? 1 : 0);
        break;
      case "Hearts count":
        actual = (c1.suit === "Hearts" ? 1 : 0) + (c2.suit === "Hearts" ? 1 : 0);
        break;
      case "Diamonds count":
        actual = (c1.suit === "Diamonds" ? 1 : 0) + (c2.suit === "Diamonds" ? 1 : 0);
        break;
      case "Clubs count":
        actual = (c1.suit === "Clubs" ? 1 : 0) + (c2.suit === "Clubs" ? 1 : 0);
        break;
      case "Spades count":
        actual = (c1.suit === "Spades" ? 1 : 0) + (c2.suit === "Spades" ? 1 : 0);
        break;
      case "Ace count":
        actual = (c1.value === 1 ? 1 : 0) + (c2.value === 1 ? 1 : 0);
        break;
    }
    const result = compareValues(actual, op, val);
    return {
      result,
      formattedQuestion: `Is ${metric} ${op} ${val}?`,
      formattedAnswer: result ? "YES" : "NO"
    };
  }
  if (req.kind === "suit_position") {
    const pos = req.cardPosition;
    const suit = req.suitQuery;
    let result = false;
    if (c1.value > c2.value) {
      const targetCard = pos === "higher" ? c1 : c2;
      result = targetCard.suit === suit;
    } else if (c2.value > c1.value) {
      const targetCard = pos === "higher" ? c2 : c1;
      result = targetCard.suit === suit;
    } else {
      result = c1.suit === suit || c2.suit === suit;
    }
    return {
      result,
      formattedQuestion: `Is your ${pos} card a ${suit}?`,
      formattedAnswer: result ? "YES" : "NO"
    };
  }
  if (req.kind === "toggle") {
    const toggle = req.toggleType;
    let result = false;
    switch (toggle) {
      case "Both cards are the same colour":
        result = col1 === col2;
        break;
      case "Sum of both cards is odd":
        result = (c1.value + c2.value) % 2 !== 0;
        break;
      case "Sum of both cards is even":
        result = (c1.value + c2.value) % 2 === 0;
        break;
      case "Both cards are odd":
        result = c1.value % 2 !== 0 && c2.value % 2 !== 0;
        break;
      case "Both cards are even":
        result = c1.value % 2 === 0 && c2.value % 2 === 0;
        break;
      case "Both red":
        result = col1 === "red" && col2 === "red";
        break;
      case "Both black":
        result = col1 === "black" && col2 === "black";
        break;
      case "Same suit":
        result = c1.suit === c2.suit;
        break;
      case "Same value":
        result = c1.value === c2.value;
        break;
      case "Consecutive values":
        result = Math.abs(c1.value - c2.value) === 1;
        break;
    }
    return {
      result,
      formattedQuestion: `Are ${toggle.toLowerCase()}?`,
      formattedAnswer: result ? "YES" : "NO"
    };
  }
  return {
    result: false,
    formattedQuestion: "Invalid question",
    formattedAnswer: "NO"
  };
}

// src/game/questionValidator.ts
function validateQuestion(req) {
  if (!req.askerId || !req.targetId) {
    return { isValid: false, errorMessage: "Both asker and target player must be selected." };
  }
  if (req.askerId === req.targetId) {
    return { isValid: false, errorMessage: "You cannot ask a question to yourself." };
  }
  if (req.kind === "numeric") {
    if (!req.numericMetric) {
      return { isValid: false, errorMessage: "A numeric metric must be chosen." };
    }
    if (!req.comparator) {
      return { isValid: false, errorMessage: "A comparator (=, >, <, >=, <=, !=) must be chosen." };
    }
    if (req.numericValue === void 0 || req.numericValue === null || isNaN(req.numericValue)) {
      return { isValid: false, errorMessage: "A valid number must be provided." };
    }
    const range = METRIC_RANGES[req.numericMetric];
    if (!range) {
      return { isValid: false, errorMessage: `Unknown metric ${req.numericMetric}.` };
    }
    if (req.numericValue < range.min || req.numericValue > range.max) {
      return {
        isValid: false,
        errorMessage: `Value ${req.numericValue} is out of allowed range [${range.min}\u2013${range.max}] for metric "${req.numericMetric}".`
      };
    }
    return { isValid: true };
  }
  if (req.kind === "suit_position") {
    if (!req.cardPosition || req.cardPosition !== "higher" && req.cardPosition !== "lower") {
      return { isValid: false, errorMessage: "Select whether you are asking about the higher card or lower card." };
    }
    if (!req.suitQuery) {
      return { isValid: false, errorMessage: "Select a suit to query." };
    }
    return { isValid: true };
  }
  if (req.kind === "toggle") {
    if (!req.toggleType) {
      return { isValid: false, errorMessage: "Select a toggle question type." };
    }
    return { isValid: true };
  }
  return { isValid: false, errorMessage: "Unsupported question kind." };
}

// src/game/scoring.ts
function computeRunningScore(player, baseGuessPoints = 0) {
  const raw = baseGuessPoints + player.publicQuestionsAsked * 1 - player.bonusTokensBought * 3 + player.angadGambitScore;
  return Math.max(0, raw);
}

// src/game/engine.ts
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let val = 1; val <= 8; val++) {
      deck.push({
        id: `${suit}_${val}`,
        suit,
        value: val,
        isRevealed: false
      });
    }
  }
  return deck;
}
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function assignPartners(playerIds, characterAssignments) {
  const ramaId = Object.keys(characterAssignments).find((id) => characterAssignments[id] === "Rama");
  const ravanaId = Object.keys(characterAssignments).find((id) => characterAssignments[id] === "Ravana");
  let partners = {};
  let valid = false;
  let attempts = 0;
  while (!valid && attempts < 1e3) {
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
function createInitialGame(seed) {
  const roomCode = seed?.roomCode || Math.random().toString(36).substring(2, 7).toUpperCase();
  let chosenCharacters = [];
  if (seed?.characterOverride && seed.characterOverride.length === 8) {
    chosenCharacters = [...seed.characterOverride];
  } else {
    const shuffledOptional = shuffle([...OPTIONAL_CHARACTERS]);
    chosenCharacters = [...MANDATORY_CHARACTERS, ...shuffledOptional.slice(0, 4)];
  }
  chosenCharacters = shuffle(chosenCharacters);
  const mandatoryChars = ["Rama", "Ravana", "Lakshmana", "Sita"];
  for (const m of mandatoryChars) {
    if (!chosenCharacters.includes(m)) {
      const replaceIdx = chosenCharacters.findIndex((c) => !mandatoryChars.includes(c));
      if (replaceIdx !== -1) {
        chosenCharacters[replaceIdx] = m;
      } else {
        chosenCharacters.push(m);
      }
    }
  }
  let chosenPowers = [];
  if (seed?.powerOverride && seed.powerOverride.length === 8) {
    chosenPowers = [...seed.powerOverride];
  } else {
    const shuffledPowers = shuffle([...ALL_POWER_IDS]);
    chosenPowers = shuffledPowers.slice(0, 8);
  }
  const deck = shuffle(createDeck());
  const playerCards = [];
  for (let i = 0; i < 8; i++) {
    playerCards.push([deck[i * 2], deck[i * 2 + 1]]);
  }
  const centralCards = deck.slice(16, 32);
  for (let i = 0; i < 6; i++) {
    centralCards[i].isRevealed = true;
    centralCards[i].revealedInRound = 1;
  }
  const playerNames = [
    "Aarav",
    "Diya",
    "Kabir",
    "Ananya",
    "Rohan",
    "Meera",
    "Dev",
    "Ishaan"
  ];
  const playerIds = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
  const charMap = {};
  playerIds.forEach((id, idx) => {
    charMap[id] = chosenCharacters[idx];
  });
  const partnerMap = assignPartners(playerIds, charMap);
  const players = playerIds.map((id, index) => {
    const charId = chosenCharacters[index];
    const partnerId = partnerMap[id];
    const partnerIdx = playerIds.indexOf(partnerId);
    const partnerCards = playerCards[partnerIdx];
    return {
      id,
      name: playerNames[index],
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${playerNames[index]}`,
      isBot: index !== 0,
      // p1 is user by default
      cards: playerCards[index],
      secretPartnerId: partnerId,
      partnerSuits: [partnerCards[0].suit, partnerCards[1].suit],
      partnerKnownToMe: false,
      cardTags: {},
      characterId: charId,
      powerId: chosenPowers[index],
      powerUsed: false,
      powerDisabled: false,
      questionTokens: DEFAULT_QUESTION_BUDGET,
      // 10 tokens for the entire game
      normalQuestionTokens: DEFAULT_QUESTION_BUDGET,
      bonusTokensAvailable: 0,
      baseQuestionsUsed: {},
      bonusTokensBought: 0,
      publicQuestionsAsked: 0,
      privateQuestionsAsked: 0,
      shabariChosenSuit: charId === "Shabari" ? "Hearts" : void 0,
      angadGambitsUsed: 0,
      angadGambitScore: 0,
      hanumanExtraGuessAvailable: false,
      hanumanLeapTriggered: false,
      kumbhakarnaRoundBonus: 0,
      kumbhakarnaTotalBonus: 0,
      correctGuesses: [],
      incorrectGuessesCount: 0
    };
  });
  const initialPointsMap = {};
  players.forEach((p) => {
    initialPointsMap[p.id] = 0;
  });
  const initialLogs = [
    {
      id: `log_init_${Date.now()}`,
      round: 1,
      timestamp: Date.now(),
      type: "system",
      text: `Diwali BLINDS started! Round 1 is live. 6 central cards revealed. 8 characters and 8 powers assigned.`
    }
  ];
  return {
    roomCode,
    round: 1,
    roundTimeRemainingSeconds: ROUND_SCHEDULE[1].durationMinutes * 60,
    isTimerRunning: false,
    isGameOver: false,
    roundGuessesResolved: false,
    activePlayerId: "p1",
    players,
    centralCards,
    playerRunningPoints: initialPointsMap,
    sugrivaSharedCount: 0,
    questionLogs: [],
    gameLogs: initialLogs,
    kumbhakarnaAnnouncements: []
  };
}
function askQuestion(state, req) {
  const asker = state.players.find((p) => p.id === req.askerId);
  const target = state.players.find((p) => p.id === req.targetId);
  if (!asker || !target) {
    return { success: false, error: "Player not found.", state };
  }
  if (asker.questionTokens < 1) {
    return { success: false, error: "Not enough Question Tokens remaining.", state };
  }
  const targetNormalUsed = asker.baseQuestionsUsed?.[target.id] || 0;
  const normalAvailable = asker.normalQuestionTokens !== void 0 ? asker.normalQuestionTokens : Math.max(0, asker.questionTokens - (asker.bonusTokensAvailable || 0));
  const bonusAvailable = asker.bonusTokensAvailable || 0;
  const canUseNormal = targetNormalUsed < 2 && normalAvailable > 0;
  const canUseBonus = bonusAvailable > 0;
  if (!canUseNormal && !canUseBonus) {
    if (targetNormalUsed >= 2) {
      return {
        success: false,
        error: `Maximum 2 normal questions reached for ${target.name}. You must use a Bonus Question Token to ask them additional questions.`,
        state
      };
    }
    return { success: false, error: "Not enough Question Tokens remaining.", state };
  }
  const valResult = validateQuestion(req);
  if (!valResult.isValid) {
    return { success: false, error: valResult.errorMessage, state };
  }
  const usedBonusToken = !canUseNormal && canUseBonus;
  const newNormalTokens = usedBonusToken ? normalAvailable : normalAvailable - 1;
  const newBonusTokens = usedBonusToken ? bonusAvailable - 1 : bonusAvailable;
  const updatedBaseQuestionsUsed = {
    ...asker.baseQuestionsUsed || {},
    [target.id]: usedBonusToken ? targetNormalUsed : targetNormalUsed + 1
  };
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
        privateQuestionsAsked: p.privateQuestionsAsked + (req.isPublic ? 0 : 1)
      };
    }
    return p;
  });
  const { result, formattedQuestion, formattedAnswer } = evaluateQuestion(req, target.cards);
  const questionLog = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    round: state.round,
    timestamp: Date.now(),
    askerId: asker.id,
    targetId: target.id,
    isPublic: req.isPublic,
    questionText: formattedQuestion,
    answerText: formattedAnswer,
    answerBoolean: result
  };
  const newLogs = [
    {
      id: `log_q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      round: state.round,
      timestamp: Date.now(),
      type: "question",
      text: req.isPublic ? `${asker.name} publicly asked ${target.name}: "${formattedQuestion}" -> ${formattedAnswer} (+1 pt)` : `${asker.name} privately asked ${target.name}: "${formattedQuestion}" -> ${formattedAnswer}`,
      isPrivateTo: req.isPublic ? void 0 : asker.id
    }
  ];
  const secondaryLogs = [];
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
          answerBoolean: secEval.result
        });
        newLogs.push({
          id: `log_sec_${Date.now()}_${secId}`,
          round: state.round,
          timestamp: Date.now(),
          type: "question",
          text: `[Ten Heads] ${asker.name} privately asked ${secTarget.name}: "${secEval.formattedQuestion}" -> ${secEval.formattedAnswer}`,
          isPrivateTo: asker.id
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
      gameLogs: [...newLogs, ...state.gameLogs]
    }
  };
}
function buyBonusToken(state, playerId) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, error: "Player not found.", state };
  const basePoints = state.playerRunningPoints[playerId] || 0;
  const currentRunningScore = computeRunningScore(player, basePoints);
  if (currentRunningScore < 3) {
    return {
      success: false,
      error: "Points cannot go negative! You must have at least 3 points to purchase a bonus token.",
      state
    };
  }
  const newPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      const normalTokens = p.normalQuestionTokens !== void 0 ? p.normalQuestionTokens : p.questionTokens;
      const bonusTokens = (p.bonusTokensAvailable || 0) + 1;
      return {
        ...p,
        normalQuestionTokens: normalTokens,
        bonusTokensAvailable: bonusTokens,
        questionTokens: normalTokens + bonusTokens,
        bonusTokensBought: p.bonusTokensBought + 1
      };
    }
    return p;
  });
  const log = {
    id: `log_token_${Date.now()}`,
    round: state.round,
    timestamp: Date.now(),
    type: "system",
    text: `${player.name} bought a Bonus Question Token (\u22123 pts).`
  };
  return {
    success: true,
    state: {
      ...state,
      players: newPlayers,
      gameLogs: [log, ...state.gameLogs]
    }
  };
}
function submitOrEditGuess(state, guesserId, targetPlayerId, suit, value, isGambit) {
  const guesser = state.players.find((p) => p.id === guesserId);
  const target = state.players.find((p) => p.id === targetPlayerId);
  if (!guesser || !target) {
    return { success: false, error: "Player not found.", state };
  }
  if (guesserId === targetPlayerId) {
    return { success: false, error: "You cannot guess your own card.", state };
  }
  if (guesser.nagpashBlockedThisRound) {
    return { success: false, error: "You are bound by Nagpash and cannot submit a guess this round.", state };
  }
  if (target.lakshmanRekhaActiveThisRound) {
    return { success: false, error: `${target.name} is protected by Lakshman Rekha this round.`, state };
  }
  if (isGambit) {
    if (guesser.characterId !== "Angad") {
      return { success: false, error: "Only Angad can mark a guess as a Gambit.", state };
    }
    if (guesser.angadGambitsUsed >= 3 && !guesser.submittedGuess?.isGambit) {
      return { success: false, error: "Angad can mark at most 3 Gambits in a game.", state };
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
          submittedAtRound: state.round
        }
      };
    }
    return p;
  });
  const log = {
    id: `log_guess_sub_${Date.now()}_${guesserId}`,
    round: state.round,
    timestamp: Date.now(),
    type: "guess",
    text: isEditing ? `${guesser.name} updated their submitted guess.` : `${guesser.name} locked in a guess.`,
    isPrivateTo: guesserId
  };
  return {
    success: true,
    state: {
      ...state,
      players: newPlayers,
      gameLogs: [log, ...state.gameLogs]
    }
  };
}
function activatePower(state, playerId, targetPlayerId) {
  const user = state.players.find((p) => p.id === playerId);
  if (!user) return { success: false, message: "Player not found.", state };
  if (user.powerDisabled) {
    return { success: false, message: "Your power has been permanently disabled by Sudarshan Chakra.", state };
  }
  if (user.powerUsed) {
    return { success: false, message: "Your Power Card has already been used.", state };
  }
  const target = targetPlayerId ? state.players.find((p) => p.id === targetPlayerId) : void 0;
  const powerId = user.powerId;
  let newPlayers = [...state.players];
  let newCentralCards = [...state.centralCards];
  const newLogs = [];
  let userMessage = "";
  switch (powerId) {
    case "Divine Sight": {
      if (!target) return { success: false, message: "Target player required.", state };
      userMessage = `Divine Sight revealed that ${target.name} holds the Character Card: ${target.characterId}.`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: "power",
        text: `${user.name} used Divine Sight to peer into ${target.name}'s character.`,
        isPrivateTo: user.id
      });
      break;
    }
    case "Nagpash": {
      if (!target) return { success: false, message: "Target player required.", state };
      newPlayers = newPlayers.map((p) => {
        if (p.id === target.id) {
          return {
            ...p,
            nagpashBlockedThisRound: true,
            submittedGuess: void 0
            // cancel existing guess
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
          type: "power",
          text: `You have been bound by Nagpash! Your submitted guess has been cancelled and you cannot guess this round.`,
          isPrivateTo: target.id
        },
        {
          id: `log_pow_${Date.now()}_usr`,
          round: state.round,
          timestamp: Date.now(),
          type: "power",
          text: `You cast Nagpash on ${target.name}! They cannot guess this round.`,
          isPrivateTo: user.id
        }
      );
      break;
    }
    case "Lakshman Rekha": {
      newPlayers = newPlayers.map((p) => {
        if (p.id === user.id) {
          return { ...p, lakshmanRekhaActiveThisRound: true };
        }
        if (p.submittedGuess?.targetPlayerId === user.id) {
          return { ...p, submittedGuess: void 0 };
        }
        return p;
      });
      userMessage = `Lakshman Rekha drawn! No player can guess your cards this round, and any guesses against you were cancelled.`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: "power",
        text: `You drew the inviolable Lakshman Rekha! No cards can be guessed against you this round.`,
        isPrivateTo: user.id
      });
      break;
    }
    case "Sanjeevani": {
      newPlayers = newPlayers.map((p) => {
        if (p.id === user.id) {
          const normalTokens = p.normalQuestionTokens !== void 0 ? p.normalQuestionTokens : p.questionTokens;
          const bonusTokens = (p.bonusTokensAvailable || 0) + 2;
          return {
            ...p,
            normalQuestionTokens: normalTokens,
            bonusTokensAvailable: bonusTokens,
            questionTokens: normalTokens + bonusTokens
          };
        }
        return p;
      });
      userMessage = `Sanjeevani herb consumed! You received 2 extra Question Tokens.`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: "power",
        text: `You consumed Sanjeevani and received 2 Question Tokens.`,
        isPrivateTo: user.id
      });
      break;
    }
    case "Ten Heads": {
      userMessage = `Ten Heads is ready! Open the Question Composer to privately ask three opponents simultaneously for just 1 Question Token.`;
      break;
    }
    case "Secret of Lanka": {
      if (!target) return { success: false, message: "Target player required.", state };
      if (target.id === user.secretPartnerId) {
        userMessage = `Partner Revealed! ${target.name} is your secret partner! Because they are your partner, no suit information is revealed.`;
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: "partner_hit",
          text: `Secret of Lanka targeted your secret partner ${target.name}!`,
          isPrivateTo: user.id
        });
      } else {
        const unrevealed = target.cards.filter((c) => !c.isRevealed);
        const suits = unrevealed.map((c) => c.suit).join(", ");
        userMessage = `Secret of Lanka revealed: ${target.name}'s unrevealed card suit(s) are: ${suits || "None (all revealed)"}.`;
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: "power",
          text: `Secret of Lanka revealed ${target.name}'s card suits to you: ${suits}`,
          isPrivateTo: user.id
        });
      }
      break;
    }
    case "Brahma Gyan": {
      if (!target) return { success: false, message: "Target player required.", state };
      if (target.id === user.secretPartnerId) {
        userMessage = `Partner Revealed! ${target.name} is your secret partner! Because they are your partner, no card value is revealed.`;
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: "partner_hit",
          text: `Brahma Gyan targeted your secret partner ${target.name}!`,
          isPrivateTo: user.id
        });
      } else {
        const unrevealed = target.cards.filter((c) => !c.isRevealed);
        if (unrevealed.length > 0) {
          const val = unrevealed[0].value === 1 ? "A (1)" : unrevealed[0].value;
          userMessage = `Brahma Gyan revealed that one of ${target.name}'s unrevealed cards has value ${val}.`;
        } else {
          userMessage = `${target.name} has no unrevealed cards.`;
        }
        newLogs.push({
          id: `log_pow_${Date.now()}`,
          round: state.round,
          timestamp: Date.now(),
          type: "power",
          text: userMessage,
          isPrivateTo: user.id
        });
      }
      break;
    }
    case "Vanara Sena": {
      if (!target) return { success: false, message: "Target player required.", state };
      newPlayers = newPlayers.map((p) => {
        if (p.id === user.id || p.id === target.id) {
          const normalTokens = p.normalQuestionTokens !== void 0 ? p.normalQuestionTokens : p.questionTokens;
          const bonusTokens = (p.bonusTokensAvailable || 0) + 1;
          return {
            ...p,
            normalQuestionTokens: normalTokens,
            bonusTokensAvailable: bonusTokens,
            questionTokens: normalTokens + bonusTokens
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
          type: "power",
          text: `You united Vanara Sena with ${target.name}! You each received 1 Question Token.`,
          isPrivateTo: user.id
        },
        {
          id: `log_pow_${Date.now()}_tgt`,
          round: state.round,
          timestamp: Date.now(),
          type: "power",
          text: `Vanara Sena was called! You and an ally each received 1 Question Token.`,
          isPrivateTo: target.id
        }
      );
      break;
    }
    case "Sudarshan Chakra": {
      if (!target) return { success: false, message: "Target player required.", state };
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
          type: "power",
          text: `You cast Sudarshan Chakra on ${target.name}, permanently disabling their power card.`,
          isPrivateTo: user.id
        },
        {
          id: `log_pow_${Date.now()}_tgt`,
          round: state.round,
          timestamp: Date.now(),
          type: "power",
          text: `Your Power Card has been permanently disabled by Sudarshan Chakra!`,
          isPrivateTo: target.id
        }
      );
      break;
    }
    case "Makhan Chori": {
      if (!target) return { success: false, message: "Target player required.", state };
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
            type: "power",
            text: `${user.name} used Makhan Chori on ${target.name}!`,
            isPrivateTo: user.id
          },
          {
            id: `log_pow_${Date.now()}_tgt`,
            round: state.round,
            timestamp: Date.now(),
            type: "power",
            text: `Your Power Card was stolen by Makhan Chori!`,
            isPrivateTo: target.id
          }
        );
        return {
          success: true,
          message: userMessage,
          state: {
            ...state,
            players: newPlayers,
            gameLogs: [...newLogs, ...state.gameLogs]
          }
        };
      } else {
        userMessage = `${target.name}'s Power Card was already used or disabled. You received nothing.`;
      }
      break;
    }
    case "Divya Shrishti": {
      const unrevealedCentral = newCentralCards.filter((c) => !c.isRevealed).slice(0, 3);
      const cardNames = unrevealedCentral.map((c) => `${c.value === 1 ? "A" : c.value} of ${c.suit}`).join(", ");
      userMessage = `Divya Shrishti revealed the next 3 central pile cards: ${cardNames}`;
      newLogs.push({
        id: `log_pow_${Date.now()}`,
        round: state.round,
        timestamp: Date.now(),
        type: "power",
        text: userMessage,
        isPrivateTo: user.id
      });
      break;
    }
    case "Hanuman's Leap": {
      userMessage = "Hanuman's Leap is an automatic passive power. It activates when your first guess is incorrect.";
      return { success: false, message: userMessage, state };
    }
  }
  newPlayers = newPlayers.map((p) => {
    if (p.id === user.id) {
      if (powerId === "Ten Heads") {
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
      gameLogs: [...newLogs, ...state.gameLogs]
    }
  };
}
function resolveRoundGuesses(state) {
  const currentRound = state.round;
  const basePoints = ROUND_SCHEDULE[currentRound].guessPoints;
  const submitted = state.players.filter((p) => p.submittedGuess !== void 0).map((p) => ({
    guesserId: p.id,
    ...p.submittedGuess
  }));
  const cardGuessMap = {};
  const partnerHitGuesses = [];
  for (const g of submitted) {
    const guesser = state.players.find((p) => p.id === g.guesserId);
    const target = state.players.find((p) => p.id === g.targetPlayerId);
    const matchingCard = target.cards.find(
      (c) => c.suit === g.suit && c.value === g.value && !c.isRevealed
    );
    if (matchingCard) {
      if (target.id === guesser.secretPartnerId) {
        partnerHitGuesses.push({ guesserId: guesser.id, targetPlayerId: target.id });
      } else {
        const key = `${target.id}_${g.suit}_${g.value}`;
        if (!cardGuessMap[key]) cardGuessMap[key] = [];
        cardGuessMap[key].push(guesser.id);
      }
    }
  }
  let roundHadSharedCorrectGuess = false;
  for (const key of Object.keys(cardGuessMap)) {
    if (cardGuessMap[key].length >= 2) {
      roundHadSharedCorrectGuess = true;
      break;
    }
  }
  const newSugrivaCount = state.sugrivaSharedCount + (roundHadSharedCorrectGuess ? 1 : 0);
  const updatedRunningPoints = { ...state.playerRunningPoints };
  const newLogs = [];
  const revealedCardsList = [];
  const resolutionDetails = [];
  for (const ph of partnerHitGuesses) {
    const guesser = state.players.find((p) => p.id === ph.guesserId);
    const target = state.players.find((p) => p.id === ph.targetPlayerId);
    const guess = guesser.submittedGuess;
    resolutionDetails.push({
      guesserId: guesser.id,
      targetPlayerId: target.id,
      suit: guess.suit,
      value: guess.value,
      isGambit: !!guess.isGambit,
      isPartnerHit: true,
      isCorrect: true,
      // It matched the card, but it's partner
      pointsAwarded: 0
    });
    newLogs.push({
      id: `log_partner_hit_${Date.now()}_${guesser.id}`,
      round: currentRound,
      timestamp: Date.now(),
      type: "partner_hit",
      text: `Private Revelation: ${target.name} is your secret partner! Card remains hidden and 0 points awarded.`,
      isPrivateTo: guesser.id
    });
  }
  const cardsToRevealKeys = /* @__PURE__ */ new Set();
  for (const [key, guesserIds] of Object.entries(cardGuessMap)) {
    cardsToRevealKeys.add(key);
    const count = guesserIds.length;
    const splitPoints = Math.round(basePoints / count);
    for (const gId of guesserIds) {
      const guesser = state.players.find((p) => p.id === gId);
      const guess = guesser.submittedGuess;
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
        splitWithGuesserIds: count > 1 ? guesserIds.filter((id) => id !== gId) : void 0
      });
      const target = state.players.find((p) => p.id === guess.targetPlayerId);
      const cardStr = `${guess.value === 1 ? "A" : guess.value} of ${guess.suit}`;
      const splitNotice = count > 1 ? ` (Split ${count} ways: +${splitPoints} pts)` : ` (+${splitPoints} pts)`;
      newLogs.push({
        id: `log_res_cor_${Date.now()}_${gId}`,
        round: currentRound,
        timestamp: Date.now(),
        type: "guess",
        text: `${guesser.name} correctly guessed ${target.name}'s card: ${cardStr}!${splitNotice}`
      });
    }
  }
  const incorrectGuessesAgainstTarget = {};
  const incorrectGuesserIds = /* @__PURE__ */ new Set();
  for (const g of submitted) {
    const isPartnerHit = partnerHitGuesses.some((ph) => ph.guesserId === g.guesserId);
    const key = `${g.targetPlayerId}_${g.suit}_${g.value}`;
    const isCorrectNonPartner = cardGuessMap[key]?.includes(g.guesserId);
    if (!isPartnerHit && !isCorrectNonPartner) {
      incorrectGuesserIds.add(g.guesserId);
      incorrectGuessesAgainstTarget[g.targetPlayerId] = (incorrectGuessesAgainstTarget[g.targetPlayerId] || 0) + 1;
    }
  }
  let newPlayers = state.players.map((p) => {
    let correctGuesses = [...p.correctGuesses];
    let incorrectCount = p.incorrectGuessesCount;
    let angadScore = p.angadGambitScore;
    let angadUsed = p.angadGambitsUsed;
    let extraGuess = false;
    let leapTriggered = p.hanumanLeapTriggered;
    let kumbhakarnaRoundBonus = 0;
    let kumbhakarnaTotal = p.kumbhakarnaTotalBonus;
    let partnerKnown = p.partnerKnownToMe;
    const guess = p.submittedGuess;
    if (guess) {
      const isPartnerHit = partnerHitGuesses.some((ph) => ph.guesserId === p.id);
      const key = `${guess.targetPlayerId}_${guess.suit}_${guess.value}`;
      const isCorrect = cardGuessMap[key]?.includes(p.id);
      if (isPartnerHit) {
        partnerKnown = true;
      } else if (isCorrect) {
        correctGuesses.push({
          targetPlayerId: guess.targetPlayerId,
          cardId: `${guess.suit}_${guess.value}`,
          suit: guess.suit,
          value: guess.value,
          round: currentRound,
          wasGambit: guess.isGambit
        });
        if (guess.isGambit) {
          angadUsed += 1;
          angadScore += 3;
        }
      } else {
        incorrectCount += 1;
        if (guess.isGambit) {
          angadUsed += 1;
          angadScore -= 3;
        }
        if (p.powerId === "Hanuman's Leap" && !p.powerDisabled && !leapTriggered) {
          extraGuess = true;
          leapTriggered = true;
        }
      }
    }
    if (p.characterId === "Kumbhakarna") {
      const missesAgainstMe = incorrectGuessesAgainstTarget[p.id] || 0;
      const potential = missesAgainstMe * 2;
      const currentTotal = p.kumbhakarnaTotalBonus;
      const canGain = Math.max(0, 6 - currentTotal);
      const pointsThisRound = Math.min(potential, canGain);
      kumbhakarnaRoundBonus = pointsThisRound;
      kumbhakarnaTotal = currentTotal + pointsThisRound;
    }
    const updatedCards = p.cards.map((c) => {
      const key = `${p.id}_${c.suit}_${c.value}`;
      if (cardsToRevealKeys.has(key)) {
        revealedCardsList.push({ playerId: p.id, card: { ...c, isRevealed: true, revealedInRound: currentRound } });
        return {
          ...c,
          isRevealed: true,
          revealedInRound: currentRound
        };
      }
      return c;
    });
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
      submittedGuess: void 0,
      // Clear submitted guess after resolution
      nagpashBlockedThisRound: false,
      // Reset Nagpash
      lakshmanRekhaActiveThisRound: false
      // Reset Lakshman Rekha
    };
  });
  const kumbhakarnaAnnouncements = [...state.kumbhakarnaAnnouncements];
  const kumbhPlayer = newPlayers.find((p) => p.characterId === "Kumbhakarna");
  if (kumbhPlayer) {
    const annMsg = `Kumbhakarna's Slumber: Earned +${kumbhPlayer.kumbhakarnaRoundBonus} bonus points from incorrect guesses this round (Total hidden bonus: ${kumbhPlayer.kumbhakarnaTotalBonus}/6).`;
    kumbhakarnaAnnouncements.push({ round: currentRound, message: annMsg });
    newLogs.push({
      id: `log_kumbh_${Date.now()}`,
      round: currentRound,
      timestamp: Date.now(),
      type: "system",
      text: annMsg
    });
  }
  const resolutionResult = {
    round: currentRound,
    resolutions: resolutionDetails,
    revealedCards: revealedCardsList,
    sugrivaBonusAwardedTo: roundHadSharedCorrectGuess ? ["Sugriva"] : [],
    kumbhakarnaRoundPoints: kumbhPlayer ? [{ playerId: kumbhPlayer.id, pointsThisRound: kumbhPlayer.kumbhakarnaRoundBonus, totalSoFar: kumbhPlayer.kumbhakarnaTotalBonus }] : []
  };
  const correctCount = resolutionDetails.filter((r) => r.isCorrect && !r.isPartnerHit).length;
  newLogs.push({
    id: `log_res_done_${Date.now()}`,
    round: currentRound,
    timestamp: Date.now(),
    type: "system",
    text: `Round ${currentRound} guesses resolved! ${correctCount > 0 ? `${correctCount} correct guess(es) announced and card(s) revealed.` : "No cards were successfully exposed."} Review the table or advance to the next round when ready.`
  });
  return {
    ...state,
    roundGuessesResolved: true,
    players: newPlayers,
    playerRunningPoints: updatedRunningPoints,
    sugrivaSharedCount: newSugrivaCount,
    lastResolutionResult: resolutionResult,
    kumbhakarnaAnnouncements,
    gameLogs: [...newLogs, ...state.gameLogs]
  };
}
function advanceToNextRound(state) {
  const currentRound = state.round;
  const isGameOver = currentRound >= 4;
  if (isGameOver) {
    const finalLog = {
      id: `log_game_over_${Date.now()}`,
      round: 4,
      timestamp: Date.now(),
      type: "system",
      text: "The 4th and final round has ended! The game is over. Calculating final scores and character objectives."
    };
    return {
      ...state,
      isGameOver: true,
      roundGuessesResolved: false,
      roundTimeRemainingSeconds: 0,
      isTimerRunning: false,
      gameLogs: [finalLog, ...state.gameLogs]
    };
  }
  const nextRound = currentRound + 1;
  const newCentralCards = state.centralCards.map((c, idx) => {
    if (nextRound === 2 && idx >= 6 && idx < 10) {
      return { ...c, isRevealed: true, revealedInRound: 2 };
    }
    if (nextRound === 3 && idx >= 10 && idx < 12) {
      return { ...c, isRevealed: true, revealedInRound: 3 };
    }
    return c;
  });
  const durationSec = ROUND_SCHEDULE[nextRound].durationMinutes * 60;
  const advanceLog = {
    id: `log_round_start_${Date.now()}`,
    round: nextRound,
    timestamp: Date.now(),
    type: "system",
    text: `Advanced to Round ${nextRound}! Timer set to ${ROUND_SCHEDULE[nextRound].durationMinutes} minutes. Question tokens and abilities are open.`
  };
  return {
    ...state,
    round: nextRound,
    roundGuessesResolved: false,
    roundTimeRemainingSeconds: durationSec,
    isTimerRunning: false,
    centralCards: newCentralCards,
    gameLogs: [advanceLog, ...state.gameLogs]
  };
}
function setShabariSuit(state, playerId, suit) {
  const newPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return { ...p, shabariChosenSuit: suit };
    }
    return p;
  });
  return { ...state, players: newPlayers };
}
function cycleCardTag(state, playerId, cardKey) {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) return state;
  const others = state.players.filter((pl) => pl.id !== playerId).map((pl) => pl.name);
  const currentTags = { ...p.cardTags || {} };
  const current = currentTags[cardKey];
  if (!current) {
    currentTags[cardKey] = { player: others[0], mode: "suspect" };
  } else {
    const idx = others.indexOf(current.player);
    if (idx === -1 || idx === others.length - 1) {
      delete currentTags[cardKey];
    } else {
      currentTags[cardKey] = { player: others[idx + 1], mode: current.mode };
    }
  }
  const newPlayers = state.players.map(
    (pl) => pl.id === playerId ? { ...pl, cardTags: currentTags } : pl
  );
  return { ...state, players: newPlayers };
}
function toggleCardTagMode(state, playerId, cardKey) {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p || !p.cardTags?.[cardKey]) return state;
  const currentTags = { ...p.cardTags || {} };
  const current = currentTags[cardKey];
  currentTags[cardKey] = {
    ...current,
    mode: current.mode === "suspect" ? "not" : "suspect"
  };
  const newPlayers = state.players.map(
    (pl) => pl.id === playerId ? { ...pl, cardTags: currentTags } : pl
  );
  return { ...state, players: newPlayers };
}
function setCardTag(state, playerId, cardKey, tag) {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p) return state;
  const currentTags = { ...p.cardTags || {} };
  if (!tag) {
    delete currentTags[cardKey];
  } else {
    currentTags[cardKey] = tag;
  }
  const newPlayers = state.players.map(
    (pl) => pl.id === playerId ? { ...pl, cardTags: currentTags } : pl
  );
  return { ...state, players: newPlayers };
}
function equipPower(state, playerId, powerId) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: "Player not found", state };
  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        powerId,
        powerUsed: false,
        powerDisabled: false,
        tenHeadsArmed: false
      };
    }
    return p;
  });
  return {
    success: true,
    message: `Equipped ${powerId} on ${player.name}! Power is ready to use.`,
    state: { ...state, players: updatedPlayers }
  };
}
function equipCharacter(state, playerId, characterId) {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { success: false, message: "Player not found", state };
  const updatedPlayers = state.players.map((p) => {
    if (p.id === playerId) {
      return {
        ...p,
        characterId,
        angadGambitsUsed: 0,
        angadGambitScore: 0
      };
    }
    return p;
  });
  return {
    success: true,
    message: `Equipped Character ${characterId} for ${player.name}!`,
    state: { ...state, players: updatedPlayers }
  };
}

// src/game/botAI.ts
function runBotTurn(state, botId) {
  let currentState = state;
  const bot = currentState.players.find((p) => p.id === botId);
  if (!bot || !bot.isBot) return currentState;
  if (!bot.powerUsed && !bot.powerDisabled && Math.random() < 0.3) {
    const otherPlayers = currentState.players.filter((p) => p.id !== bot.id);
    const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    if (bot.powerId === "Sanjeevani" || bot.powerId === "Lakshman Rekha" || bot.powerId === "Divya Shrishti") {
      const powRes = activatePower(currentState, bot.id);
      if (powRes.success) currentState = powRes.state;
    } else if (bot.powerId === "Divine Sight" || bot.powerId === "Nagpash" || bot.powerId === "Secret of Lanka" || bot.powerId === "Brahma Gyan" || bot.powerId === "Vanara Sena" || bot.powerId === "Sudarshan Chakra" || bot.powerId === "Makhan Chori") {
      const powRes = activatePower(currentState, bot.id, randomTarget.id);
      if (powRes.success) currentState = powRes.state;
    }
  }
  const updatedBot = currentState.players.find((p) => p.id === botId);
  if (updatedBot.questionTokens > 0 && Math.random() < 0.6) {
    const normalRemaining = updatedBot.normalQuestionTokens !== void 0 ? updatedBot.normalQuestionTokens : Math.max(0, updatedBot.questionTokens - (updatedBot.bonusTokensAvailable || 0));
    const bonusAvailable = updatedBot.bonusTokensAvailable || 0;
    const candidates = currentState.players.filter(
      (p) => p.id !== bot.id && p.cards.some((c) => !c.isRevealed) && ((updatedBot.baseQuestionsUsed?.[p.id] || 0) < 2 ? normalRemaining > 0 : bonusAvailable > 0)
    );
    if (candidates.length > 0) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const isPublic = Math.random() < 0.5;
      const questionTypeChoice = Math.random();
      let req = null;
      if (questionTypeChoice < 0.4) {
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        const pos = Math.random() < 0.5 ? "higher" : "lower";
        req = {
          askerId: bot.id,
          targetId: target.id,
          isPublic,
          kind: "suit_position",
          cardPosition: pos,
          suitQuery: suit
        };
      } else if (questionTypeChoice < 0.7) {
        const toggles = [
          "Both cards are the same colour",
          "Sum of both cards is odd",
          "Sum of both cards is even",
          "Both cards are odd",
          "Both cards are even",
          "Consecutive values",
          "Both red",
          "Both black"
        ];
        const toggle = toggles[Math.floor(Math.random() * toggles.length)];
        req = {
          askerId: bot.id,
          targetId: target.id,
          isPublic,
          kind: "toggle",
          toggleType: toggle
        };
      } else {
        const numVal = Math.floor(Math.random() * 9) + 4;
        req = {
          askerId: bot.id,
          targetId: target.id,
          isPublic,
          kind: "numeric",
          numericMetric: "Sum",
          comparator: ">=",
          numericValue: numVal
        };
      }
      if (req) {
        const qRes = askQuestion(currentState, req);
        if (qRes.success) currentState = qRes.state;
      }
    }
  }
  const currentBotState = currentState.players.find((p) => p.id === botId);
  if (!currentBotState.submittedGuess && !currentBotState.nagpashBlockedThisRound) {
    const targets = currentState.players.filter(
      (p) => p.id !== bot.id && !p.lakshmanRekhaActiveThisRound && p.cards.some((c) => !c.isRevealed)
    );
    if (targets.length > 0) {
      const chosenTarget = targets[Math.floor(Math.random() * targets.length)];
      const revealedIds = /* @__PURE__ */ new Set();
      currentState.players.forEach((p) => {
        p.cards.forEach((c) => {
          if (c.isRevealed) revealedIds.add(c.id);
        });
      });
      currentState.centralCards.forEach((c) => {
        if (c.isRevealed) revealedIds.add(c.id);
      });
      bot.cards.forEach((c) => revealedIds.add(c.id));
      const candidateCards = [];
      for (const suit of SUITS) {
        for (let v = 1; v <= 8; v++) {
          const id = `${suit}_${v}`;
          if (!revealedIds.has(id)) {
            candidateCards.push({ suit, value: v });
          }
        }
      }
      const pick = candidateCards.length > 0 ? candidateCards[Math.floor(Math.random() * candidateCards.length)] : { suit: "Hearts", value: 5 };
      let isGambit = false;
      if (currentBotState.characterId === "Angad" && currentBotState.angadGambitsUsed < 3 && Math.random() < 0.4) {
        isGambit = true;
      }
      const guessRes = submitOrEditGuess(
        currentState,
        bot.id,
        chosenTarget.id,
        pick.suit,
        pick.value,
        isGambit
      );
      if (guessRes.success) currentState = guessRes.state;
    }
  }
  return currentState;
}
function autoPlayAllBots(state) {
  let s = state;
  for (const p of s.players) {
    if (p.isBot) {
      s = runBotTurn(s, p.id);
    }
  }
  return s;
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var server = http.createServer(app);
var wss = new WebSocketServer({ server, path: "/ws" });
app.use(express.json());
var rooms = /* @__PURE__ */ new Map();
function sanitizeStateForPlayer(room, viewerPlayerId) {
  const state = room.state;
  const isGameOver = state.isGameOver;
  const knownCharacters = room.divineSightKnown[viewerPlayerId] || [];
  const sanitizedPlayers = state.players.map((p) => {
    const isSelf = p.id === viewerPlayerId;
    const sanitizedCards = p.cards.map((c) => {
      if (isSelf || c.isRevealed) {
        return c;
      }
      return {
        id: `hidden_${p.id}_card`,
        suit: "Hearts",
        // dummy placeholder, won't be shown
        value: 1,
        isRevealed: false
      };
    });
    const canSeeCharacter = isSelf || isGameOver || knownCharacters.includes(p.id);
    const charId = canSeeCharacter ? p.characterId : "Hidden";
    const canSeePower = isSelf || isGameOver;
    const powerId = canSeePower ? p.powerId : "Hidden";
    let sanitizedGuess = void 0;
    if (p.submittedGuess) {
      if (isSelf) {
        sanitizedGuess = p.submittedGuess;
      } else {
        sanitizedGuess = {
          targetPlayerId: "hidden",
          suit: "Hearts",
          value: 1,
          isGambit: false,
          submittedAtRound: p.submittedGuess.submittedAtRound
        };
      }
    }
    return {
      ...p,
      cards: sanitizedCards,
      characterId: charId,
      powerId,
      partnerSuits: isSelf ? p.partnerSuits : void 0,
      partnerKnownToMe: isSelf ? p.partnerKnownToMe : false,
      cardTags: isSelf ? p.cardTags : void 0,
      secretPartnerId: isSelf && (isGameOver || p.partnerKnownToMe) ? p.secretPartnerId : "",
      submittedGuess: sanitizedGuess
    };
  });
  const sanitizedCentral = state.centralCards.map((c, idx) => {
    if (c.isRevealed) {
      return c;
    }
    return {
      id: `central_hidden_${idx}`,
      suit: "Hearts",
      value: 1,
      isRevealed: false
    };
  });
  const sanitizedGameLogs = state.gameLogs.filter(
    (l) => !l.isPrivateTo || l.isPrivateTo === viewerPlayerId
  );
  const sanitizedQuestionLogs = state.questionLogs.filter(
    (q) => q.isPublic || q.askerId === viewerPlayerId || q.targetId === viewerPlayerId
  );
  return {
    ...state,
    activePlayerId: viewerPlayerId,
    players: sanitizedPlayers,
    centralCards: sanitizedCentral,
    gameLogs: sanitizedGameLogs,
    questionLogs: sanitizedQuestionLogs
  };
}
function broadcastRoom(room) {
  for (const [sessionToken, client] of room.clients.entries()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      const sanitized = sanitizeStateForPlayer(room, client.playerId);
      client.ws.send(
        JSON.stringify({
          type: "SYNC_STATE",
          roomCode: room.roomCode,
          playerId: client.playerId,
          playerName: client.playerName,
          isHost: sessionToken === room.hostSessionToken,
          gameStarted: room.gameStarted,
          state: sanitized
        })
      );
    }
  }
}
app.get("/api/room/:code", (req, res) => {
  const code = req.params.code.toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    return res.status(404).json({ exists: false });
  }
  return res.json({
    exists: true,
    roomCode: room.roomCode,
    gameStarted: room.gameStarted,
    playersCount: room.clients.size,
    players: Array.from(room.clients.values()).map((c) => ({
      playerId: c.playerId,
      name: c.playerName
    }))
  });
});
wss.on("connection", (ws) => {
  let currentRoomCode = null;
  let currentSessionToken = null;
  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      switch (msg.type) {
        case "JOIN_ROOM": {
          const roomCode = (msg.roomCode || "DEFAULT").toUpperCase();
          const playerName = (msg.playerName || "Player").trim();
          const sessionToken = msg.sessionToken || Math.random().toString(36).substring(2);
          let room = rooms.get(roomCode);
          if (!room) {
            const initialGame = createInitialGame({ roomCode });
            room = {
              roomCode,
              hostSessionToken: sessionToken,
              gameStarted: false,
              state: initialGame,
              clients: /* @__PURE__ */ new Map(),
              divineSightKnown: {}
            };
            rooms.set(roomCode, room);
          }
          currentRoomCode = roomCode;
          currentSessionToken = sessionToken;
          let assignedPlayerId = "";
          const existingSession = room.clients.get(sessionToken);
          if (existingSession) {
            assignedPlayerId = existingSession.playerId;
            existingSession.ws = ws;
            existingSession.playerName = playerName;
          } else {
            const claimedPlayerIds = new Set(
              Array.from(room.clients.values()).map((c) => c.playerId)
            );
            const availablePlayer = room.state.players.find(
              (p) => !claimedPlayerIds.has(p.id)
            );
            if (availablePlayer) {
              assignedPlayerId = availablePlayer.id;
              room.state.players = room.state.players.map((p) => {
                if (p.id === assignedPlayerId) {
                  return { ...p, name: playerName, isBot: false };
                }
                return p;
              });
            } else {
              assignedPlayerId = "p1";
            }
            room.clients.set(sessionToken, {
              ws,
              sessionToken,
              playerId: assignedPlayerId,
              playerName
            });
          }
          ws.send(
            JSON.stringify({
              type: "JOINED_SUCCESS",
              sessionToken,
              playerId: assignedPlayerId,
              roomCode,
              isHost: sessionToken === room.hostSessionToken
            })
          );
          broadcastRoom(room);
          break;
        }
        case "START_GAME": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.gameStarted = true;
          broadcastRoom(room);
          break;
        }
        case "ASK_QUESTION": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const req = msg.request;
          const res = askQuestion(room.state, req);
          if (res.success) {
            room.state = res.state;
            broadcastRoom(room);
          } else {
            ws.send(JSON.stringify({ type: "ERROR", message: res.error }));
          }
          break;
        }
        case "BUY_TOKEN": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          const res = buyBonusToken(room.state, client.playerId);
          if (res.success) {
            room.state = res.state;
            broadcastRoom(room);
          }
          break;
        }
        case "SUBMIT_GUESS": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          const res = submitOrEditGuess(
            room.state,
            client.playerId,
            msg.targetPlayerId,
            msg.suit,
            msg.value,
            msg.isGambit
          );
          if (res.success) {
            room.state = res.state;
            broadcastRoom(room);
          } else {
            ws.send(JSON.stringify({ type: "ERROR", message: res.error }));
          }
          break;
        }
        case "ACTIVATE_POWER": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          if (room.state.players.find((p) => p.id === client.playerId)?.powerId === "Divine Sight" && msg.targetPlayerId) {
            if (!room.divineSightKnown[client.playerId]) {
              room.divineSightKnown[client.playerId] = [];
            }
            room.divineSightKnown[client.playerId].push(msg.targetPlayerId);
          }
          const res = activatePower(room.state, client.playerId, msg.targetPlayerId);
          if (res.success) {
            room.state = res.state;
            ws.send(JSON.stringify({ type: "POWER_FEEDBACK", message: res.message }));
            broadcastRoom(room);
          } else {
            ws.send(JSON.stringify({ type: "ERROR", message: res.message }));
          }
          break;
        }
        case "EQUIP_POWER": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          const res = equipPower(room.state, client.playerId, msg.powerId);
          if (res.success) {
            room.state = res.state;
            ws.send(JSON.stringify({ type: "POWER_FEEDBACK", message: res.message }));
            broadcastRoom(room);
          }
          break;
        }
        case "EQUIP_CHARACTER": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          const res = equipCharacter(room.state, client.playerId, msg.characterId);
          if (res.success) {
            room.state = res.state;
            ws.send(JSON.stringify({ type: "POWER_FEEDBACK", message: res.message }));
            broadcastRoom(room);
          }
          break;
        }
        case "RESOLVE_ROUND": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          let state = room.state;
          state = autoPlayAllBots(state);
          const resolved = resolveRoundGuesses(state);
          room.state = resolved;
          broadcastRoom(room);
          break;
        }
        case "ADVANCE_ROUND": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.state = advanceToNextRound(room.state);
          broadcastRoom(room);
          break;
        }
        case "SIMULATE_BOTS": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.state = autoPlayAllBots(room.state);
          broadcastRoom(room);
          break;
        }
        case "SELECT_SHABARI_SUIT": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          room.state = setShabariSuit(room.state, client.playerId, msg.suit);
          broadcastRoom(room);
          break;
        }
        case "RESET_GAME": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          room.state = createInitialGame({ roomCode: room.roomCode });
          room.divineSightKnown = {};
          broadcastRoom(room);
          break;
        }
        case "CYCLE_CARD_TAG": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          room.state = cycleCardTag(room.state, client.playerId, msg.cardKey);
          broadcastRoom(room);
          break;
        }
        case "TOGGLE_CARD_TAG_MODE": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          room.state = toggleCardTagMode(room.state, client.playerId, msg.cardKey);
          broadcastRoom(room);
          break;
        }
        case "SET_CARD_TAG": {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const client = room.clients.get(currentSessionToken || "");
          if (!client) return;
          room.state = setCardTag(room.state, client.playerId, msg.cardKey, msg.tag);
          broadcastRoom(room);
          break;
        }
        case "PING": {
          ws.send(JSON.stringify({ type: "PONG" }));
          break;
        }
      }
    } catch (err) {
      console.error("WebSocket error:", err);
    }
  });
  ws.on("close", () => {
  });
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  const port = process.env.PORT || 3e3;
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  server.listen(port, () => {
    console.log(`BLINDS Diwali Server running on http://localhost:${port}`);
  });
}
startServer();
