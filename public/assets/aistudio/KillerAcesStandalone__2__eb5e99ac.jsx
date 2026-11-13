import React, { useState, useEffect, useCallback, useRef } from "react";

/* ===================== Constants ===================== */

const RANKS = ["A", "2", "3", "4", "5", "6"];
const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_NAME = { "♠": "Spades", "♥": "Hearts", "♦": "Diamonds", "♣": "Clubs" };
const STATE_KEY_PREFIX = "killeraces-state-";
const NAME_KEY = "killeraces-myname";
const HOST_UNLOCK_KEY = "killeraces-host-unlocked";
const HOST_PASSCODE = "killeraces"; // change this to whatever you want — only tell the host
const GAME_CODE_KEY = "killeraces-gamecode";

const ROUND_POINTS = { 1: 10, 2: 8, 3: 6, 4: 4 };
const INTERROGATION_THRESHOLDS = [4, 6, 8];
const BONUS_TOKEN_COST = 3;
const DEFAULT_BUDGET = 7;

const METRIC_OPTIONS = [
  { value: "sum", label: "The sum of your two cards" },
  { value: "diff", label: "The difference between your two cards" },
  { value: "product", label: "The product of your two cards" },
  { value: "higher", label: "Your higher card" },
  { value: "lower", label: "Your lower card" },
  { value: "sumRed", label: "The sum of your red cards" },
  { value: "sumBlack", label: "The sum of your black cards" },
  { value: "countRed", label: "The number of red cards you have" },
  { value: "countBlack", label: "The number of black cards you have" },
  { value: "sumSpade", label: "The sum of your Spades" },
  { value: "sumHeart", label: "The sum of your Hearts" },
  { value: "sumDiamond", label: "The sum of your Diamonds" },
  { value: "sumClub", label: "The sum of your Clubs" },
  { value: "countSpade", label: "The number of Spades you have" },
  { value: "countHeart", label: "The number of Hearts you have" },
  { value: "countDiamond", label: "The number of Diamonds you have" },
  { value: "countClub", label: "The number of Clubs you have" },
  { value: "countAces", label: "The number of Aces you have" },
  { value: "oneCard", label: "One of your cards (locked to 'is equal to')" },
  { value: "higherSuit", label: "Your higher card's suit (locked to 'is')" },
  { value: "lowerSuit", label: "Your lower card's suit (locked to 'is')" },
];
const METRIC_LABEL = Object.fromEntries(METRIC_OPTIONS.map((m) => [m.value, m.label]));

// Valid [min, max] a player's two cards can actually produce for each metric (A=1..6, 2 cards).
const METRIC_RANGE = {
  sum: [2, 12], diff: [0, 5], product: [1, 36], higher: [1, 6], lower: [1, 6],
  sumRed: [0, 12], sumBlack: [0, 12], countRed: [0, 2], countBlack: [0, 2],
  sumSpade: [0, 12], sumHeart: [0, 12], sumDiamond: [0, 12], sumClub: [0, 12],
  countSpade: [0, 2], countHeart: [0, 2], countDiamond: [0, 2], countClub: [0, 2],
  countAces: [0, 2], oneCard: [1, 6],
};

const COMPARATOR_OPTIONS = [
  { value: "gt", label: "is greater than" },
  { value: "gte", label: "is greater than or equal to" },
  { value: "lt", label: "is less than" },
  { value: "lte", label: "is less than or equal to" },
  { value: "eq", label: "is equal to" },
  { value: "neq", label: "is not equal to" },
  { value: "divisibleBy", label: "is divisible by" },
];
const COMPARATOR_LABEL = Object.fromEntries(COMPARATOR_OPTIONS.map((c) => [c.value, c.label]));

const TOGGLE_OPTIONS = [
  { value: "bothRed", label: "Both your cards are red" },
  { value: "bothBlack", label: "Both your cards are black" },
  { value: "bothSameSuit", label: "Both your cards are the same suit" },
  { value: "bothSameColor", label: "Both your cards are the same colour" },
  { value: "bothSameValue", label: "Both your cards have the same value" },
  { value: "bothConsecutive", label: "Both your cards are consecutive values" },
  { value: "sumOdd", label: "The sum of your two cards is odd" },
  { value: "sumEven", label: "The sum of your two cards is even" },
  { value: "bothOdd", label: "Both your cards are odd values" },
  { value: "bothEven", label: "Both your cards are even values" },
];
const TOGGLE_LABEL = Object.fromEntries(TOGGLE_OPTIONS.map((t) => [t.value, t.label]));

const SUIT_BY_KEY = { sumSpade: "♠", sumHeart: "♥", sumDiamond: "♦", sumClub: "♣",
  countSpade: "♠", countHeart: "♥", countDiamond: "♦", countClub: "♣" };

/* ===================== Helpers ===================== */

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function freshDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardVal(c) {
  return RANKS.indexOf(c.rank) + 1;
}
function isRedSuit(s) {
  return s === "♥" || s === "♦";
}

function isCracked(p) {
  return p.cardsRevealed[0] && p.cardsRevealed[1];
}
function unrevealedCount(p) {
  return (p.cardsRevealed[0] ? 0 : 1) + (p.cardsRevealed[1] ? 0 : 1);
}
function questionsSpent(p) {
  const base = Object.values(p.baseQuestionsUsed).reduce((a, b) => a + b, 0);
  const bonus = Object.values(p.bonusQuestionsUsed).reduce((a, b) => a + b, 0);
  return base + bonus;
}
function bonusUsedTotal(p) {
  return Object.values(p.bonusQuestionsUsed).reduce((a, b) => a + b, 0);
}
function baseUsedTotal(p) {
  return Object.values(p.baseQuestionsUsed).reduce((a, b) => a + b, 0);
}

/* ---- Question engine ---- */

function metricValue(cards, metric) {
  const [a, b] = cards;
  const va = cardVal(a), vb = cardVal(b);
  switch (metric) {
    case "sum": return va + vb;
    case "diff": return Math.abs(va - vb);
    case "product": return va * vb;
    case "higher": return Math.max(va, vb);
    case "lower": return Math.min(va, vb);
    case "sumRed": return (isRedSuit(a.suit) ? va : 0) + (isRedSuit(b.suit) ? vb : 0);
    case "sumBlack": return (!isRedSuit(a.suit) ? va : 0) + (!isRedSuit(b.suit) ? vb : 0);
    case "countRed": return (isRedSuit(a.suit) ? 1 : 0) + (isRedSuit(b.suit) ? 1 : 0);
    case "countBlack": return (!isRedSuit(a.suit) ? 1 : 0) + (!isRedSuit(b.suit) ? 1 : 0);
    case "sumSpade": case "sumHeart": case "sumDiamond": case "sumClub": {
      const suit = SUIT_BY_KEY[metric];
      return (a.suit === suit ? va : 0) + (b.suit === suit ? vb : 0);
    }
    case "countSpade": case "countHeart": case "countDiamond": case "countClub": {
      const suit = SUIT_BY_KEY[metric];
      return (a.suit === suit ? 1 : 0) + (b.suit === suit ? 1 : 0);
    }
    case "countAces": return (a.rank === "A" ? 1 : 0) + (b.rank === "A" ? 1 : 0);
    default: return null;
  }
}

function evaluateQuestion(cards, q) {
  if (q.family === "B") {
    return cards.some((c) => c.rank === q.value && c.suit === q.suit);
  }
  if (q.family === "C") {
    const [a, b] = cards;
    switch (q.toggle) {
      case "bothRed": return isRedSuit(a.suit) && isRedSuit(b.suit);
      case "bothBlack": return !isRedSuit(a.suit) && !isRedSuit(b.suit);
      case "bothSameSuit": return a.suit === b.suit;
      case "bothSameColor": return isRedSuit(a.suit) === isRedSuit(b.suit);
      case "bothSameValue": return a.rank === b.rank;
      case "bothConsecutive": return Math.abs(cardVal(a) - cardVal(b)) === 1;
      case "sumOdd": return (cardVal(a) + cardVal(b)) % 2 === 1;
      case "sumEven": return (cardVal(a) + cardVal(b)) % 2 === 0;
      case "bothOdd": return cardVal(a) % 2 === 1 && cardVal(b) % 2 === 1;
      case "bothEven": return cardVal(a) % 2 === 0 && cardVal(b) % 2 === 0;
      default: return null;
    }
  }
  // family A
  if (q.metric === "oneCard") {
    const n = Number(q.number);
    return cards.some((c) => cardVal(c) === n);
  }
  if (q.metric === "higherSuit" || q.metric === "lowerSuit") {
    const [a, b] = cards;
    const va = cardVal(a), vb = cardVal(b);
    if (va === vb) return a.suit === q.suit || b.suit === q.suit; // tied value — either card counts
    const higherCard = va > vb ? a : b;
    const lowerCard = va > vb ? b : a;
    const target = q.metric === "higherSuit" ? higherCard : lowerCard;
    return target.suit === q.suit;
  }
  const mv = metricValue(cards, q.metric);
  const n = Number(q.number);
  switch (q.comparator) {
    case "gt": return mv > n;
    case "gte": return mv >= n;
    case "lt": return mv < n;
    case "lte": return mv <= n;
    case "eq": return mv === n;
    case "neq": return mv !== n;
    case "divisibleBy": return n !== 0 && mv % n === 0;
    default: return null;
  }
}

const METRIC_ABBR = {
  sum: "Sum", diff: "Diff", product: "Prod", higher: "High", lower: "Low",
  sumRed: "RedΣ", sumBlack: "BlkΣ", countRed: "#Red", countBlack: "#Blk",
  sumSpade: "♠Σ", sumHeart: "♥Σ", sumDiamond: "♦Σ", sumClub: "♣Σ",
  countSpade: "#♠", countHeart: "#♥", countDiamond: "#♦", countClub: "#♣",
  countAces: "#A",
};
const COMPARATOR_SYMBOL = { gt: ">", gte: "≥", lt: "<", lte: "≤", eq: "=", neq: "≠", divisibleBy: "÷" };
const NEGATE_COMPARATOR = { gt: "lte", gte: "lt", lt: "gte", lte: "gt", eq: "neq", neq: "eq" };
const TOGGLE_TRUE_LABEL = { bothRed: "Both Red", bothBlack: "Both Black", bothSameSuit: "Same Suit", bothSameColor: "Same Colour", bothSameValue: "Same Value", bothConsecutive: "Consecutive", sumOdd: "Odd Sum", sumEven: "Even Sum", bothOdd: "Both Odd", bothEven: "Both Even" };
const TOGGLE_FALSE_LABEL = { bothRed: "Not Both Red", bothBlack: "Not Both Black", bothSameSuit: "Diff Suits", bothSameColor: "Diff Colours", bothSameValue: "Diff Values", bothConsecutive: "Not Consecutive", sumOdd: "Even Sum", sumEven: "Odd Sum", bothOdd: "Not Both Odd", bothEven: "Not Both Even" };

// Turns a resolved question into a short clue tag — negated correctly when the answer was NO,
// so the tag always reads as the true fact learned, not just the question asked.
function shortLabel(q) {
  if (q.family === "B") {
    const tag = `${q.value}${q.suit}`;
    return q.answer ? tag : `¬${tag}`;
  }
  if (q.family === "C") {
    return q.answer ? TOGGLE_TRUE_LABEL[q.toggle] : TOGGLE_FALSE_LABEL[q.toggle];
  }
  if (q.metric === "oneCard") {
    return q.answer ? `Card=${q.number}` : `Card≠${q.number}`;
  }
  if (q.metric === "higherSuit" || q.metric === "lowerSuit") {
    const tag = q.metric === "higherSuit" ? "High" : "Low";
    return q.answer ? `${tag}=${q.suit}` : `${tag}≠${q.suit}`;
  }
  const abbr = METRIC_ABBR[q.metric] || q.metric;
  if (!q.answer && q.comparator === "divisibleBy") return `${abbr}¬÷${q.number}`;
  const comparator = q.answer ? q.comparator : (NEGATE_COMPARATOR[q.comparator] || q.comparator);
  return `${abbr}${COMPARATOR_SYMBOL[comparator]}${q.number}`;
}

function questionText(q) {
  if (q.family === "B") return `One of your cards is the ${q.value} of ${SUIT_NAME[q.suit]}`;
  if (q.family === "C") return TOGGLE_LABEL[q.toggle];
  if (q.metric === "oneCard") return `One of your cards is equal to ${q.number}`;
  if (q.metric === "higherSuit") return `Your higher card is a ${SUIT_NAME[q.suit]} card`;
  if (q.metric === "lowerSuit") return `Your lower card is a ${SUIT_NAME[q.suit]} card`;
  return `${METRIC_LABEL[q.metric]} ${COMPARATOR_LABEL[q.comparator]} ${q.number}`;
}

/* ---- Partner / Prey assignment ---- */

function assignPairs(names) {
  // Mutual 1:1 pairing. Requires an even player count.
  const shuffled = shuffle(names);
  const map = {};
  for (let i = 0; i < shuffled.length; i += 2) {
    const a = shuffled[i], b = shuffled[i + 1];
    if (b === undefined) continue; // odd leftover, no partner (edge case)
    map[a] = b;
    map[b] = a;
  }
  return map;
}

function assignPrey(names, partnerMap) {
  // A random derangement where prey(n) !== n and prey(n) !== partner(n).
  for (let attempt = 0; attempt < 5000; attempt++) {
    const perm = shuffle(names);
    const preyMap = {};
    let valid = true;
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      const p = perm[i];
      if (p === n || p === partnerMap[n]) { valid = false; break; }
      preyMap[n] = p;
    }
    if (valid) return preyMap;
  }
  return null; // couldn't find a valid assignment (shouldn't happen at 6 players)
}

function predatorOf(preyMap, name) {
  for (const [k, v] of Object.entries(preyMap)) {
    if (v === name) return k;
  }
  return null;
}

/* ===================== State shape ===================== */

function normalizePlayer(p) {
  return {
    name: p.name,
    cards: p.cards || [],
    cardsRevealed: p.cardsRevealed || [false, false],
    points: p.points ?? 0,
    partner: p.partner || null,
    partnerKnownToMe: p.partnerKnownToMe || false,
    prey: p.prey || null,
    baseQuestionsUsed: p.baseQuestionsUsed || {},
    bonusTokens: p.bonusTokens ?? 0,
    bonusQuestionsUsed: p.bonusQuestionsUsed || {},
    askedCount: p.askedCount ?? 0,
    interrogationBonusesGiven: p.interrogationBonusesGiven ?? 0,
    predatorGuess: p.predatorGuess || null,
    cardTags: p.cardTags || {}, // private per-player deduction notes: { "A♠": { player, mode: "suspect"|"not" } }
    lastRoundNotice: p.lastRoundNotice || null,
    notifications: p.notifications || [],
  };
}

function normalizeState(parsed) {
  return {
    phase: parsed.phase || "setup", // setup | playing | predatorGuess | ended
    players: (parsed.players || []).map(normalizePlayer),
    centrePile: parsed.centrePile || [],
    revealedCentreCount: parsed.revealedCentreCount ?? 0,
    round: parsed.round ?? 1,
    guesses: parsed.guesses || {},
    questions: parsed.questions || [],
    log: parsed.log || [],
    questionBudget: parsed.questionBudget ?? DEFAULT_BUDGET,
    earlyEnd: parsed.earlyEnd || false,
    timer: parsed.timer || null, // { label, endsAt } — purely informational, host still drives round advancement
  };
}

const defaultState = {
  phase: "setup",
  players: [],
  centrePile: [],
  revealedCentreCount: 0,
  round: 1,
  guesses: {},
  questions: [],
  log: [],
  questionBudget: DEFAULT_BUDGET,
  earlyEnd: false,
  timer: null,
};

const ROUND_TIMER_PRESETS = {
  1: [
    { label: "Round 1 — Discussion & Questions", minutes: 30 },
    { label: "Round 1 — Submit Guesses", minutes: 5 },
  ],
  2: [{ label: "Round 2", minutes: 20 }],
  3: [{ label: "Round 3", minutes: 10 }],
  4: [{ label: "Round 4 — Final Questioning & Guessing", minutes: 10 }],
};

/* ===================== Main component ===================== */

export default function KillerAcesStandalone() {
  const [gameCode, setGameCode] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [state, setState] = useState(null);
  const [myName, setMyName] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [view, setView] = useState("player");
  const [loading, setLoading] = useState(true);
  const [setupNames, setSetupNames] = useState("Alice\nBob\nCharlie\nDana\nEli\nFay");
  const [questionBudgetInput, setQuestionBudgetInput] = useState(DEFAULT_BUDGET);
  const [guessTarget, setGuessTarget] = useState("");
  const [guessRank, setGuessRank] = useState(RANKS[0]);
  const [guessSuit, setGuessSuit] = useState(SUITS[0]);
  const [hostUnlocked, setHostUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    if (!gameCode) return;
    try {
      const res = await window.storage.get(STATE_KEY_PREFIX + gameCode, true);
      if (res && res.value) setState(normalizeState(JSON.parse(res.value)));
      else setState(defaultState);
    } catch (e) {
      setState(defaultState);
    }
    setLoading(false);
  }, [gameCode]);

  const save = useCallback(
    async (newState) => {
      if (!gameCode) return;
      setState(newState);
      try {
        await window.storage.set(STATE_KEY_PREFIX + gameCode, JSON.stringify(newState), true);
      } catch (e) {
        console.error("save failed", e);
      }
    },
    [gameCode]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(NAME_KEY, false);
        if (res && res.value) setMyName(res.value);
      } catch (e) {}
      try {
        const res2 = await window.storage.get(HOST_UNLOCK_KEY, false);
        if (res2 && res2.value === "true") setHostUnlocked(true);
      } catch (e) {}
      try {
        const res3 = await window.storage.get(GAME_CODE_KEY, false);
        if (res3 && res3.value) setGameCode(res3.value);
        else setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!gameCode) return;
    setLoading(true);
    load();
    pollRef.current = setInterval(load, 2500);
    return () => clearInterval(pollRef.current);
  }, [gameCode, load]);

  async function joinGameCode(rawCode) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    setGameCode(code);
    try { await window.storage.set(GAME_CODE_KEY, code, false); } catch (e) {}
  }
  async function leaveGameCode() {
    setGameCode(null); setState(null); setCodeInput("");
    try { await window.storage.delete(GAME_CODE_KEY, false); } catch (e) {}
  }
  async function tryUnlockHost() {
    if (passcodeInput === HOST_PASSCODE) {
      setHostUnlocked(true); setPasscodeInput("");
      try { await window.storage.set(HOST_UNLOCK_KEY, "true", false); } catch (e) {}
    } else setPasscodeInput("");
  }
  async function chooseName(name) {
    setMyName(name);
    try { await window.storage.set(NAME_KEY, name, false); } catch (e) {}
  }

  function startGame() {
    const names = setupNames.split("\n").map((n) => n.trim()).filter(Boolean);
    if (names.length < 2) return;
    const partnerMap = assignPairs(names);
    const preyMap = assignPrey(names, partnerMap);
    const deck = shuffle(freshDeck());
    const players = names.map((name) => ({
      name,
      cards: [deck.pop(), deck.pop()],
      cardsRevealed: [false, false],
      points: 0,
      partner: partnerMap[name] || null,
      partnerKnownToMe: false,
      prey: preyMap ? preyMap[name] : null,
      baseQuestionsUsed: {},
      bonusTokens: 0,
      bonusQuestionsUsed: {},
      askedCount: 0,
      interrogationBonusesGiven: 0,
      predatorGuess: null,
      lastRoundNotice: null,
      notifications: [],
    }));
    const budget = Number(questionBudgetInput) || DEFAULT_BUDGET;
    const newState = {
      phase: "playing",
      players,
      centrePile: deck,
      revealedCentreCount: 5,
      round: 1,
      guesses: {},
      questions: [],
      log: [`Game started. ${names.length} players, partners and prey assigned. ${budget} Question Tokens each. Round 1 begins — 5 centre cards revealed.`],
      questionBudget: budget,
      earlyEnd: false,
    };
    save(newState);
  }

  function askQuestion(targetName, isPublic, q) {
    if (!state || !myName || !targetName) return;
    const s = JSON.parse(JSON.stringify(state));
    const asker = s.players.find((p) => p.name === myName);
    const target = s.players.find((p) => p.name === targetName);
    if (!asker || !target) return;

    const baseUsed = baseUsedTotal(asker);
    const baseForTarget = asker.baseQuestionsUsed[targetName] || 0;
    const canUseBase = baseUsed < s.questionBudget && baseForTarget < 2;
    const bonusAvailable = asker.bonusTokens - bonusUsedTotal(asker);
    const canUseBonus = bonusAvailable > 0;
    if (!canUseBase && !canUseBonus) return;

    const text = questionText(q);
    const answer = evaluateQuestion(target.cards, q);

    if (canUseBase) {
      asker.baseQuestionsUsed[targetName] = baseForTarget + 1;
    } else {
      asker.bonusQuestionsUsed[targetName] = (asker.bonusQuestionsUsed[targetName] || 0) + 1;
    }

    target.askedCount += 1;
    target.notifications = [
      `${myName} asked you (${isPublic ? "publicly" : "privately"}): "${text}"`,
      ...target.notifications,
    ];

    for (const threshold of INTERROGATION_THRESHOLDS) {
      const already = target.interrogationBonusesGiven;
      const idx = INTERROGATION_THRESHOLDS.indexOf(threshold);
      if (target.askedCount === threshold && already === idx) {
        target.bonusTokens += 1;
        target.interrogationBonusesGiven = idx + 1;
        s.log.unshift(`${targetName} has now been asked ${threshold} questions — Interrogation Bonus: +1 Bonus Question Token.`);
      }
    }

    s.questions.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      asker: myName,
      target: targetName,
      isPublic,
      text,
      answer,
      round: s.round,
      ...q, // carries family/metric/comparator/number/toggle/value/suit through for shortLabel()
    });

    if (isPublic) {
      asker.points += 1;
      s.log.unshift(`${myName} publicly asked ${targetName}: "${text}" → ${answer ? "YES" : "NO"} (+1 point to ${myName}).`);
    } else {
      s.log.unshift(`${myName} asked ${targetName} a private question.`);
    }
    save(s);
  }

  function buyBonusToken() {
    const s = JSON.parse(JSON.stringify(state));
    const p = s.players.find((pl) => pl.name === myName);
    if (!p || p.points < BONUS_TOKEN_COST) return;
    p.points -= BONUS_TOKEN_COST;
    p.bonusTokens += 1;
    s.log.unshift(`${myName} spent ${BONUS_TOKEN_COST} points to buy a Bonus Question Token.`);
    save(s);
  }

  function submitGuess() {
    if (!state || !myName || !guessTarget) return;
    const s = JSON.parse(JSON.stringify(state));
    s.guesses[myName] = { target: guessTarget, rank: guessRank, suit: guessSuit };
    save(s);
  }

  function dismissNotice() {
    const s = JSON.parse(JSON.stringify(state));
    const p = s.players.find((pl) => pl.name === myName);
    if (p) p.lastRoundNotice = null;
    save(s);
  }
  function dismissNotification(idx) {
    const s = JSON.parse(JSON.stringify(state));
    const p = s.players.find((pl) => pl.name === myName);
    if (p) p.notifications = p.notifications.filter((_, i) => i !== idx);
    save(s);
  }

  // Private per-player card tracker: clicking a card cycles who you suspect holds it (then clears).
  function cycleCardTag(cardKey) {
    const s = JSON.parse(JSON.stringify(state));
    const p = s.players.find((pl) => pl.name === myName);
    if (!p) return;
    const others = s.players.filter((pl) => pl.name !== myName).map((pl) => pl.name);
    const current = p.cardTags[cardKey];
    if (!current) {
      p.cardTags[cardKey] = { player: others[0], mode: "suspect" };
    } else {
      const idx = others.indexOf(current.player);
      if (idx === -1 || idx === others.length - 1) delete p.cardTags[cardKey];
      else p.cardTags[cardKey] = { player: others[idx + 1], mode: current.mode };
    }
    save(s);
  }
  // Clicking the tag itself flips it between "I suspect this" and "I've confirmed this is NOT theirs".
  function toggleCardTagMode(cardKey) {
    const s = JSON.parse(JSON.stringify(state));
    const p = s.players.find((pl) => pl.name === myName);
    if (!p || !p.cardTags[cardKey]) return;
    p.cardTags[cardKey].mode = p.cardTags[cardKey].mode === "suspect" ? "not" : "suspect";
    save(s);
  }

  function resolveGuesses() {
    if (!state) return;
    const s = JSON.parse(JSON.stringify(state));
    if (Object.keys(s.guesses).length === 0) return;

    // Group correct guesses by target+card
    const groups = {}; // key -> [guesserName,...]
    for (const [guesserName, g] of Object.entries(s.guesses)) {
      const target = s.players.find((p) => p.name === g.target);
      if (!target) continue;
      const idx = target.cards.findIndex((c, i) => !target.cardsRevealed[i] && c.rank === g.rank && c.suit === g.suit);
      if (idx === -1) continue; // incorrect guess, no info
      const key = `${g.target}|${g.rank}${g.suit}`;
      if (!groups[key]) groups[key] = { target: g.target, idx, rank: g.rank, suit: g.suit, guessers: [] };
      groups[key].guessers.push(guesserName);
    }

    for (const key of Object.keys(groups)) {
      const grp = groups[key];
      const target = s.players.find((p) => p.name === grp.target);
      const scoringGuessers = [];
      for (const guesserName of grp.guessers) {
        const guesser = s.players.find((p) => p.name === guesserName);
        if (!guesser) continue;
        if (guesser.partner === target.name) {
          // Accidental correct guess on your own partner's card
          guesser.partnerKnownToMe = true;
          s.log.unshift(`${guesserName} correctly guessed their secret partner's card — identity revealed privately, no points, card stays hidden.`);
        } else {
          scoringGuessers.push(guesserName);
        }
      }
      if (scoringGuessers.length > 0) {
        target.cardsRevealed[grp.idx] = true;
        const base = ROUND_POINTS[s.round] || 0;
        const share = Math.round(base / scoringGuessers.length); // whole points, rounded to nearest
        for (const guesserName of scoringGuessers) {
          const guesser = s.players.find((p) => p.name === guesserName);
          guesser.points += share;
        }
        s.log.unshift(
          `${grp.target}'s ${grp.rank}${grp.suit} revealed! Correctly guessed by ${scoringGuessers.join(", ")} (${base} points${scoringGuessers.length > 1 ? `, ${share} each` : ""}).`
        );
      }
    }

    s.guesses = {};

    const stillActive = s.players.filter((p) => unrevealedCount(p) > 0).length;
    if (stillActive <= 2) s.earlyEnd = true;

    save(s);
  }

  function advancePhase() {
    if (!state) return;
    const s = JSON.parse(JSON.stringify(state));
    const shouldMoveToPredatorPhase = s.round >= 4 || s.earlyEnd;
    if (!shouldMoveToPredatorPhase) {
      if (s.round === 1) { s.revealedCentreCount = 8; s.round = 2; s.log.unshift("Round 2 begins — 3 more centre cards revealed (8 total)."); }
      else if (s.round === 2) { s.revealedCentreCount = 10; s.round = 3; s.log.unshift("Round 3 begins — 2 more centre cards revealed (10 total)."); }
      else if (s.round === 3) { s.round = 4; s.log.unshift("Round 4 begins — final round, no new centre reveal."); }
      s.guesses = {};
      for (const p of s.players) p.lastRoundNotice = null;
    } else {
      s.phase = "predatorGuess";
      s.guesses = {};
      s.log.unshift("Guessing is over. Every player now gets one free guess at who their Predator is.");
    }
    save(s);
  }

  function submitPredatorGuess(guessName) {
    const s = JSON.parse(JSON.stringify(state));
    const p = s.players.find((pl) => pl.name === myName);
    if (!p) return;
    p.predatorGuess = guessName;
    save(s);
  }

  function finalizeGame() {
    const s = JSON.parse(JSON.stringify(state));
    const preyMap = {};
    for (const p of s.players) preyMap[p.name] = p.prey;

    // Predator guesses
    for (const p of s.players) {
      const actualPredatorName = predatorOf(preyMap, p.name);
      if (p.predatorGuess && p.predatorGuess === actualPredatorName) {
        p.points += 5;
        s.log.unshift(`${p.name} correctly identified their Predator! +5 points.`);
      } else if (isCracked(p) && actualPredatorName) {
        const predator = s.players.find((pl) => pl.name === actualPredatorName);
        if (predator) {
          predator.points += 5;
          s.log.unshift(`${p.name} was fully cracked and didn't identify their Predator — ${actualPredatorName} earns +5 points.`);
        }
      }
    }

    // Leftover tokens
    for (const p of s.players) {
      const baseLeft = Math.max(0, s.questionBudget - baseUsedTotal(p));
      const bonusLeft = Math.max(0, p.bonusTokens - bonusUsedTotal(p));
      const leftover = baseLeft + bonusLeft;
      if (leftover > 0) {
        p.points += leftover;
        s.log.unshift(`${p.name} had ${leftover} unused Question Token(s) — +${leftover} points.`);
      }
    }

    // Survival / partner bonus
    for (const p of s.players) {
      // Own cards: 1 surviving = +2, both surviving = +5 (2 + 2 + 1 for keeping both)
      const ownAlive = unrevealedCount(p);
      const ownBonus = ownAlive === 2 ? 5 : ownAlive === 1 ? 2 : 0;
      // Partner's cards: 1 surviving = +2, both = +3. Applies even if you are fully cracked yourself.
      let partnerBonus = 0;
      if (p.partner) {
        const partner = s.players.find((pl) => pl.name === p.partner);
        if (partner) {
          const partnerAlive = unrevealedCount(partner);
          partnerBonus = partnerAlive === 2 ? 3 : partnerAlive === 1 ? 2 : 0;
        }
      }
      if (ownBonus > 0) { p.points += ownBonus; s.log.unshift(`${p.name}: +${ownBonus} points for own surviving cards.`); }
      if (partnerBonus > 0) { p.points += partnerBonus; s.log.unshift(`${p.name}: +${partnerBonus} points for partner's surviving cards.`); }
    }

    for (const p of s.players) p.points = Math.round(p.points);

    s.phase = "ended";
    s.log.unshift("Game ended — final scores are in!");
    save(s);
  }

  function startTimer(label, minutes) {
    const s = JSON.parse(JSON.stringify(state));
    s.timer = { label, endsAt: Date.now() + minutes * 60000 };
    s.log.unshift(`Timer started: ${label} (${minutes} min).`);
    save(s);
  }
  function stopTimer() {
    const s = JSON.parse(JSON.stringify(state));
    s.timer = null;
    save(s);
  }

  function resetGame() { save(defaultState); }

  /* ---- Render ---- */

  if (!gameCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
        <div className="max-w-sm w-full bg-slate-800 rounded-lg p-5">
          <h1 className="text-lg font-bold mb-1">Killer Aces — Standalone</h1>
          <p className="text-sm text-slate-400 mb-4">Enter a game code to join, or create a new one if you're the host.</p>
          <div className="flex gap-2 mb-3">
            <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinGameCode(codeInput)}
              placeholder="e.g. 7K2Q" maxLength={8}
              className="flex-1 bg-slate-700 rounded px-3 py-2 text-sm tracking-widest font-mono uppercase" />
            <button onClick={() => joinGameCode(codeInput)} disabled={!codeInput.trim()}
              className="bg-amber-600 disabled:bg-slate-700 px-4 py-2 rounded text-sm font-medium">Join</button>
          </div>
          <button onClick={() => setCodeInput(randomCode())} className="text-xs text-amber-400 underline">
            Hosting? Generate a new code
          </button>
        </div>
      </div>
    );
  }

  if (loading || !state) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">Loading...</div>;
  }

  const me = state.players.find((p) => p.name === myName);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold tracking-tight">Killer Aces — Standalone</h1>
          <div className="flex gap-2 text-sm">
            <button onClick={() => setView("player")} className={`px-3 py-1 rounded ${view === "player" ? "bg-amber-600" : "bg-slate-700"}`}>Player</button>
            <button onClick={() => setView("host")} className={`px-3 py-1 rounded ${view === "host" ? "bg-amber-600" : "bg-slate-700"}`}>Host</button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-slate-500 font-mono">Game code: <span className="text-amber-400 tracking-widest">{gameCode}</span></span>
          <button onClick={leaveGameCode} className="text-xs text-slate-500 underline">Not your game? Switch code</button>
        </div>

        {!myName && view === "player" && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4">
            <p className="text-sm mb-2 text-slate-300">Enter your name exactly as the host set it up:</p>
            <div className="flex gap-2">
              <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="flex-1 bg-slate-700 rounded px-3 py-2 text-sm" placeholder="Your name" />
              <button onClick={() => chooseName(nameInput.trim())} className="bg-amber-600 px-4 py-2 rounded text-sm font-medium">Join</button>
            </div>
          </div>
        )}

        {view === "player" && myName && state.phase === "setup" && (
          <div className="bg-slate-800 rounded-lg p-4 text-slate-300 text-sm">Waiting for the host to start the game...</div>
        )}

        {view === "player" && myName && state.phase !== "setup" && (
          <PlayerView
            state={state} me={me} myName={myName}
            guessTarget={guessTarget} setGuessTarget={setGuessTarget}
            guessRank={guessRank} setGuessRank={setGuessRank}
            guessSuit={guessSuit} setGuessSuit={setGuessSuit}
            submitGuess={submitGuess} askQuestion={askQuestion}
            buyBonusToken={buyBonusToken} dismissNotice={dismissNotice}
            dismissNotification={dismissNotification}
            submitPredatorGuess={submitPredatorGuess}
            timer={state.timer}
            cycleCardTag={cycleCardTag} toggleCardTagMode={toggleCardTagMode}
          />
        )}

        {view === "host" && !hostUnlocked && (
          <div className="bg-slate-800 rounded-lg p-4 max-w-sm">
            <h3 className="font-semibold mb-2 text-sm">Host access</h3>
            <p className="text-xs text-slate-400 mb-3">Enter the host passcode. This unlocks the Host tab on this device only.</p>
            <div className="flex gap-2">
              <input type="password" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && tryUnlockHost()} className="flex-1 bg-slate-700 rounded px-3 py-2 text-sm" placeholder="Passcode" />
              <button onClick={tryUnlockHost} className="bg-amber-600 px-4 py-2 rounded text-sm font-medium">Unlock</button>
            </div>
          </div>
        )}

        {view === "host" && hostUnlocked && (
          <HostView
            state={state} setupNames={setupNames} setSetupNames={setSetupNames}
            questionBudgetInput={questionBudgetInput} setQuestionBudgetInput={setQuestionBudgetInput}
            startGame={startGame} advancePhase={advancePhase} resolveGuesses={resolveGuesses}
            finalizeGame={finalizeGame} resetGame={resetGame}
            startTimer={startTimer} stopTimer={stopTimer}
          />
        )}
      </div>
    </div>
  );
}

/* ===================== Timer ===================== */

// Ticks once a second on its own so the countdown is smooth between the 2.5s state polls.
function CountdownTimer({ timer }) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer && timer.endsAt, timer && timer.label]);

  if (!timer) return null;
  const remainingMs = timer.endsAt - Date.now();
  const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const done = remaining <= 0;
  const urgent = !done && remaining <= 30;

  return (
    <div className={`rounded-lg p-4 text-center ${done ? "bg-red-900/50 border border-red-600" : urgent ? "bg-amber-900/40 border border-amber-500 animate-pulse" : "bg-slate-800"}`}>
      <div className="text-xs text-slate-400 mb-1">{timer.label}</div>
      <div className={`text-4xl font-mono font-bold tabular-nums ${done ? "text-red-400" : "text-amber-400"}`}>
        {done ? "Time's up!" : `${mm}:${ss}`}
      </div>
    </div>
  );
}

function RoundTimerPanel({ state, startTimer, stopTimer }) {
  const [customMinutes, setCustomMinutes] = useState(10);
  const presets = ROUND_TIMER_PRESETS[state.round] || [];
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2">Round timer (visual only — you still control when the round actually advances)</h3>
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map((pr) => (
          <button key={pr.label} onClick={() => startTimer(pr.label, pr.minutes)} className="bg-amber-600 px-3 py-1 rounded text-sm">
            Start "{pr.label}" ({pr.minutes}m)
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input type="number" min={1} value={customMinutes} onChange={(e) => setCustomMinutes(Number(e.target.value))} className="bg-slate-700 rounded px-2 py-1 w-16 text-sm" />
        <button onClick={() => startTimer(`Custom — ${customMinutes}m`, customMinutes)} className="bg-slate-700 px-3 py-1 rounded text-sm">Start custom timer</button>
        {state.timer && <button onClick={stopTimer} className="bg-red-700 px-3 py-1 rounded text-sm">Stop timer</button>}
      </div>
    </div>
  );
}

/* ===================== Player view ===================== */

function AskQuestionPanel({ me, others, askQuestion }) {
  const [target, setTarget] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [family, setFamily] = useState("A");
  const [metric, setMetric] = useState("sum");
  const [comparator, setComparator] = useState("gt");
  const [number, setNumber] = useState(7);
  const [value, setValue] = useState(RANKS[0]);
  const [suit, setSuit] = useState(SUITS[0]);
  const [toggle, setToggle] = useState(TOGGLE_OPTIONS[0].value);

  const baseUsed = baseUsedTotal(me);
  const bonusAvail = me.bonusTokens - bonusUsedTotal(me);
  const baseForTarget = target ? (me.baseQuestionsUsed[target] || 0) : 0;
  const canUseBase = baseUsed < 999 && baseForTarget < 2; // budget check happens server-side too
  const hasAnyTokenLeft = canUseBase || bonusAvail > 0;

  const range = family === "A" ? METRIC_RANGE[metric] : null;
  const numberOutOfRange = range && (Number(number) < range[0] || Number(number) > range[1]);

  function submit() {
    if (!target) return;
    let q;
    if (family === "A") {
      if (metric === "oneCard") q = { family: "A", metric: "oneCard", number };
      else if (metric === "higherSuit" || metric === "lowerSuit") q = { family: "A", metric, suit };
      else q = { family: "A", metric, comparator, number };
    } else if (family === "B") {
      q = { family: "B", value, suit };
    } else {
      q = { family: "C", toggle };
    }
    askQuestion(target, isPublic, q);
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2">Ask a question</h3>
      <div className="flex flex-wrap gap-2 mb-2">
        <select value={target} onChange={(e) => setTarget(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
          <option value="">Who?</option>
          {others.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <label className="flex items-center gap-1 text-xs"><input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} /> Public (+1 pt)</label>
        <label className="flex items-center gap-1 text-xs"><input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} /> Private</label>
      </div>
      <div className="flex gap-2 mb-2 text-xs">
        {["A", "B", "C"].map((f) => (
          <button key={f} onClick={() => setFamily(f)} className={`px-2 py-1 rounded ${family === f ? "bg-amber-600" : "bg-slate-700"}`}>
            {f === "A" ? "Numeric" : f === "B" ? "Exact card" : "Toggle"}
          </button>
        ))}
      </div>
      {family === "A" && (
        <div className="flex flex-wrap gap-2 mb-2">
          <select value={metric} onChange={(e) => setMetric(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
            {METRIC_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {metric !== "oneCard" && metric !== "higherSuit" && metric !== "lowerSuit" && (
            <select value={comparator} onChange={(e) => setComparator(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
              {COMPARATOR_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}
          {metric === "oneCard" && <span className="text-xs text-slate-400 self-center">is equal to</span>}
          {(metric === "higherSuit" || metric === "lowerSuit") && <span className="text-xs text-slate-400 self-center">is</span>}
          {metric !== "higherSuit" && metric !== "lowerSuit" && (
            <input type="number" value={number} onChange={(e) => setNumber(e.target.value)}
              className={`bg-slate-700 rounded px-2 py-1 w-16 text-sm ${numberOutOfRange ? "ring-1 ring-red-500" : ""}`} />
          )}
          {(metric === "higherSuit" || metric === "lowerSuit") && (
            <select value={suit} onChange={(e) => setSuit(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
              {SUITS.map((s) => <option key={s} value={s}>{SUIT_NAME[s]}</option>)}
            </select>
          )}
        </div>
      )}
      {family === "B" && (
        <div className="flex flex-wrap gap-2 mb-2">
          <span className="text-xs text-slate-400 self-center">One of your cards is the</span>
          <select value={value} onChange={(e) => setValue(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
            {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <span className="text-xs text-slate-400 self-center">of</span>
          <select value={suit} onChange={(e) => setSuit(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
            {SUITS.map((s) => <option key={s} value={s}>{SUIT_NAME[s]}</option>)}
          </select>
        </div>
      )}
      {family === "C" && (
        <div className="flex flex-wrap gap-2 mb-2">
          <select value={toggle} onChange={(e) => setToggle(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
            {TOGGLE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      )}
      {numberOutOfRange && (
        <p className="text-xs text-red-400 mb-2">
          ⚠ {METRIC_LABEL[metric]} can only be between {range[0]} and {range[1]} with this deck — this question would have a guaranteed answer and waste a token.
        </p>
      )}
      <button onClick={submit} disabled={!target || !hasAnyTokenLeft || numberOutOfRange} className="bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 px-3 py-1 rounded text-sm">
        Ask (uses {canUseBase ? "a regular" : "a bonus"} token)
      </button>
      <p className="text-xs text-slate-500 mt-2">Base tokens used: {baseUsed} · Bonus tokens available: {bonusAvail}</p>
    </div>
  );
}

function CardTrackerPanel({ state, me, myName, cycleCardTag, toggleCardTagMode }) {
  // Returns null if the card is still unknown to you, otherwise { owner } — owner is the player
  // holding it, or null for a revealed centre-pile card (no owner to show).
  function knownInfo(rank, suit) {
    // Publicly revealed in a player's hand...
    for (const p of state.players) {
      for (let i = 0; i < 2; i++) {
        if (p.cardsRevealed[i] && p.cards[i].rank === rank && p.cards[i].suit === suit) return { owner: p.name };
      }
    }
    // ...or in the revealed part of the centre pile (no owner)...
    for (let i = 0; i < state.revealedCentreCount; i++) {
      const c = state.centrePile[i];
      if (c && c.rank === rank && c.suit === suit) return { owner: null };
    }
    // ...or one of your own two cards — you already know it's yours.
    if (me.cards.some((c) => c.rank === rank && c.suit === suit)) return { owner: myName };
    return null;
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex flex-wrap justify-between items-baseline gap-1 mb-3">
        <h3 className="text-sm font-semibold">Card tracker</h3>
        <span className="text-xs text-slate-500">Click a card to cycle a suspect; click their tag to flip suspect / confirmed-not. Private to you.</span>
      </div>
      <div className="space-y-1.5">
        {SUITS.map((suit) => (
          <div key={suit} className="flex gap-1.5">
            {RANKS.map((rank) => {
              const key = `${rank}${suit}`;
              const known = knownInfo(rank, suit);
              const revealed = !!known;
              const tag = me.cardTags[key];
              return (
                <div key={key} className="relative">
                  <button
                    onClick={() => !revealed && cycleCardTag(key)}
                    disabled={revealed}
                    className={`w-11 h-14 rounded flex items-center justify-center text-xs font-bold ${
                      revealed
                        ? "bg-slate-700 text-slate-500 line-through cursor-default"
                        : `bg-slate-100 ${isRedSuit(suit) ? "text-red-600" : "text-slate-900"} hover:ring-2 hover:ring-amber-500 cursor-pointer`
                    }`}
                  >
                    {rank}{suit}
                  </button>
                  {known && known.owner && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold rounded px-1 bg-slate-600 text-slate-200">
                      {known.owner === myName ? "You" : known.owner}
                    </span>
                  )}
                  {tag && !revealed && (
                    <button
                      onClick={() => toggleCardTagMode(key)}
                      title="Click to toggle suspect / confirmed-not"
                      className={`absolute -bottom-1.5 -right-1.5 text-[9px] font-bold rounded px-1 ${
                        tag.mode === "not" ? "bg-red-900 text-red-300" : "bg-indigo-800 text-indigo-200"
                      }`}
                    >
                      {tag.mode === "not" ? "¬" : ""}{tag.player}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-700 inline-block rounded" /> Already revealed (name shows who holds it; centre cards have none)</span>
        <span className="flex items-center gap-1"><span className="bg-indigo-800 text-indigo-200 text-[9px] font-bold rounded px-1">B</span> Suspected</span>
        <span className="flex items-center gap-1"><span className="bg-red-900 text-red-300 text-[9px] font-bold rounded px-1">¬B</span> Confirmed not</span>
      </div>
    </div>
  );
}

function PlayerView({ state, me, myName, guessTarget, setGuessTarget, guessRank, setGuessRank, guessSuit, setGuessSuit,
  submitGuess, askQuestion, buyBonusToken, dismissNotice, dismissNotification, submitPredatorGuess, timer,
  cycleCardTag, toggleCardTagMode }) {
  if (!me) {
    return <div className="bg-red-900/40 rounded-lg p-4 text-sm">No player named "{myName}" found in this game. Check spelling with the host.</div>;
  }
  const others = state.players.filter((p) => p.name !== myName);
  const myGuessThisRound = state.guesses[myName];
  const [editingGuess, setEditingGuess] = useState(false);
  const myPublicAndMine = state.questions.filter((q) => q.isPublic || q.asker === myName);

  return (
    <div className="space-y-4">
      <CountdownTimer timer={timer} />
      {me.lastRoundNotice && (
        <div className="bg-amber-900/40 border border-amber-600 rounded-lg p-3 text-sm flex items-start justify-between gap-3">
          <span>{me.lastRoundNotice}</span>
          <button onClick={dismissNotice} className="text-xs text-amber-300 underline whitespace-nowrap">Got it</button>
        </div>
      )}
      {me.notifications.map((n, i) => (
        <div key={i} className="bg-indigo-900/40 border border-indigo-600 rounded-lg p-3 text-sm flex items-start justify-between gap-3">
          <span>{n}</span>
          <button onClick={() => dismissNotification(i)} className="text-xs text-indigo-300 underline whitespace-nowrap">Got it</button>
        </div>
      ))}

      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">{myName} {isCracked(me) && <span className="text-red-400 text-sm">(Cracked)</span>}</h2>
          <span className="text-sm text-amber-400 font-mono">{me.points} pts</span>
        </div>
        <div className="flex gap-2">
          {me.cards.map((c, i) => (
            <div key={i} className={`w-14 h-20 rounded flex items-center justify-center text-lg font-bold ${me.cardsRevealed[i] ? `bg-slate-600 ${isRedSuit(c.suit) ? "text-red-400" : "text-slate-300"}` : `bg-slate-100 ${isRedSuit(c.suit) ? "text-red-600" : "text-slate-900"}`}`}>
              {c.rank}{c.suit}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 text-sm space-y-1">
        <h3 className="font-semibold mb-1">Your secrets</h3>
        <p className="text-slate-300">
          Your prey: <span className="text-amber-400">{me.prey}</span> — get them fully cracked by game's end.
        </p>
        <p className="text-slate-300">
          Your partner's suits: <span className="text-amber-400">
            {(() => {
              const partner = state.players.find((p) => p.name === me.partner);
              const suits = partner ? partner.cards.map((c) => SUIT_NAME[c.suit]).join(" and ") : "unknown";
              return me.partnerKnownToMe ? `${suits} — and now you know it's ${me.partner}!` : suits;
            })()}
          </span>
        </p>
        <p className="text-slate-500 text-xs">Your own predator — the person whose prey you are — stays unknown until the end-game guess.</p>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">Centre pile ({state.revealedCentreCount}/12 revealed)</h3>
        <div className="flex gap-2 flex-wrap">
          {state.centrePile.slice(0, state.revealedCentreCount).map((c, i) => (
            <div key={i} className={`w-10 h-14 rounded flex items-center justify-center text-sm font-bold bg-slate-100 ${isRedSuit(c.suit) ? "text-red-600" : "text-slate-900"}`}>{c.rank}{c.suit}</div>
          ))}
          {state.revealedCentreCount === 0 && <span className="text-slate-500 text-sm">None yet</span>}
        </div>
      </div>

      <CardTrackerPanel state={state} me={me} myName={myName} cycleCardTag={cycleCardTag} toggleCardTagMode={toggleCardTagMode} />

      {state.phase === "playing" && (
        <>
          <AskQuestionPanel me={me} others={others} askQuestion={askQuestion} />

          <button onClick={buyBonusToken} disabled={me.points < BONUS_TOKEN_COST}
            className="w-full bg-slate-700 disabled:opacity-50 px-3 py-2 rounded text-sm">
            Buy a Bonus Question Token for {BONUS_TOKEN_COST} points ({me.points} available)
          </button>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Your secret guess this round</h3>
            {myGuessThisRound && !editingGuess ? (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-emerald-400">Guess locked in: {myGuessThisRound.target} holds {myGuessThisRound.rank}{myGuessThisRound.suit}. Waiting for the host to resolve this round.</p>
                <button
                  onClick={() => {
                    setGuessTarget(myGuessThisRound.target);
                    setGuessRank(myGuessThisRound.rank);
                    setGuessSuit(myGuessThisRound.suit);
                    setEditingGuess(true);
                  }}
                  className="text-xs text-amber-400 underline whitespace-nowrap">
                  Edit guess
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center">
                <select value={guessTarget} onChange={(e) => setGuessTarget(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
                  <option value="">Player</option>
                  {others.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
                <select value={guessRank} onChange={(e) => setGuessRank(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
                  {RANKS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={guessSuit} onChange={(e) => setGuessSuit(e.target.value)} className="bg-slate-700 rounded px-2 py-1 text-sm">
                  {SUITS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={() => { submitGuess(); setEditingGuess(false); }}
                  disabled={!guessTarget}
                  className="bg-amber-600 disabled:bg-slate-700 px-3 py-1 rounded text-sm">
                  {myGuessThisRound ? "Update guess" : "Submit guess"}
                </button>
                {myGuessThisRound && (
                  <button onClick={() => setEditingGuess(false)} className="text-xs text-slate-400 underline">Cancel</button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {state.phase === "predatorGuess" && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Who is your Predator?</h3>
          {me.predatorGuess ? (
            <p className="text-xs text-emerald-400">You guessed: {me.predatorGuess}. Waiting for the host to finalize scores.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {others.map((p) => (
                <button key={p.name} onClick={() => submitPredatorGuess(p.name)} className="bg-slate-700 hover:bg-amber-700 px-3 py-1 rounded text-sm">{p.name}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {state.phase === "ended" && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Final Scores</h3>
          <div className="space-y-1">
            {[...state.players].sort((a, b) => b.points - a.points).map((p, i) => (
              <div key={p.name} className="flex justify-between text-sm">
                <span>{i === 0 ? "🏆 " : ""}{p.name}</span>
                <span className="font-mono text-amber-400">{p.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">Players</h3>
        <div className="space-y-2">
          {state.players.map((p) => {
            const visibleQs = state.questions.filter((q) => q.target === p.name && (q.isPublic || q.asker === myName));
            return (
              <div key={p.name} className="text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>{p.name}{isCracked(p) ? " — cracked" : ""}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {p.cards.map((c, i) => (
                        <span key={i} className={`w-8 h-11 rounded flex items-center justify-center text-xs font-bold ${p.cardsRevealed[i] ? `bg-slate-100 ${isRedSuit(c.suit) ? "text-red-600" : "text-slate-900"}` : "bg-slate-600 text-slate-500"}`}>
                          {p.cardsRevealed[i] ? `${c.rank}${c.suit}` : "?"}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-amber-400">{p.points}pt</span>
                  </div>
                </div>
                {visibleQs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {visibleQs.map((q) => (
                      <span key={q.id} title={`${q.asker}: ${q.text}`}
                        className={`text-[10px] rounded px-1.5 py-0.5 ${q.isPublic ? "bg-slate-700 text-slate-200" : "bg-indigo-900/60 text-indigo-200"}`}>
                        {shortLabel(q)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">Questions asked of you</h3>
        <div className="space-y-1 text-xs text-slate-400 max-h-48 overflow-y-auto">
          {state.questions.filter((q) => q.target === myName).length === 0 && (
            <span className="text-slate-500">No one has asked you anything yet.</span>
          )}
          {[...state.questions].filter((q) => q.target === myName).reverse().map((q) => (
            <div key={q.id}>
              <span className="text-slate-300">{q.asker}</span>{q.isPublic ? " (public)" : " (private)"}: "{q.text}" → <span className={q.answer ? "text-emerald-400" : "text-red-400"}>{q.answer ? "YES" : "NO"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">Public Q&amp;A / your own questions</h3>
        <div className="space-y-1 text-xs text-slate-400 max-h-48 overflow-y-auto">
          {myPublicAndMine.map((q) => (
            <div key={q.id}>
              <span className="text-slate-300">{q.asker} → {q.target}{q.isPublic ? " (public)" : " (private)"}:</span> "{q.text}" → <span className={q.answer ? "text-emerald-400" : "text-red-400"}>{q.answer ? "YES" : "NO"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2">Log</h3>
        <div className="space-y-1 text-xs text-slate-400 max-h-40 overflow-y-auto">
          {state.log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}

/* ===================== Host view ===================== */

function HostView({ state, setupNames, setSetupNames, questionBudgetInput, setQuestionBudgetInput,
  startGame, advancePhase, resolveGuesses, finalizeGame, resetGame, startTimer, stopTimer }) {
  const setupNamesList = setupNames.split("\n").map((n) => n.trim()).filter(Boolean);
  const [confirmDialog, setConfirmDialog] = useState(null);

  function requestAdvance() {
    const pending = Object.keys(state.guesses).length;
    const movingToPredator = state.round >= 4 || state.earlyEnd;
    const action = movingToPredator ? "move to the Predator-guess phase" : `advance to Round ${state.round + 1}`;
    const warning = pending > 0 ? ` ${pending} guess(es) haven't been resolved yet and will be discarded.` : "";
    setConfirmDialog(`Are you sure you want to ${action}?${warning}`);
  }

  return (
    <div className="space-y-4">
      {state.phase === "setup" && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Set up players (one name per line, even number for partner pairing)</h3>
          <textarea value={setupNames} onChange={(e) => setSetupNames(e.target.value)} className="w-full h-32 bg-slate-700 rounded p-2 text-sm font-mono" />
          <div className="mt-3 flex items-center gap-2">
            <label className="text-sm">Base question tokens per player:</label>
            <input type="number" min={0} value={questionBudgetInput} onChange={(e) => setQuestionBudgetInput(Number(e.target.value))} className="bg-slate-700 rounded px-2 py-1 w-16 text-sm" />
          </div>
          <button onClick={startGame} className="mt-3 bg-amber-600 px-4 py-2 rounded font-medium text-sm">
            Deal cards, assign partners &amp; prey, start game
          </button>
        </div>
      )}

      {state.phase !== "setup" && (
        <>
          <CountdownTimer timer={state.timer} />
          {state.phase === "playing" && <RoundTimerPanel state={state} startTimer={startTimer} stopTimer={stopTimer} />}
          <div className="bg-slate-800 rounded-lg p-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm mr-auto">
              {state.phase === "predatorGuess" ? "Predator-guess phase" : state.phase === "ended" ? "Game ended" : `Round ${state.round} of 4`}
              {state.earlyEnd && state.phase === "playing" ? " — early-end condition met (≤2 players with cards left)" : ""}
            </span>
            {state.phase === "playing" && (
              <button onClick={resolveGuesses} className="bg-emerald-600 px-3 py-1 rounded text-sm">Resolve this round's guesses ({Object.keys(state.guesses).length})</button>
            )}
            {state.phase === "playing" && (
              <button onClick={requestAdvance} className="bg-amber-600 px-3 py-1 rounded text-sm">
                {state.round < 4 && !state.earlyEnd ? "Advance to next round" : "Move to Predator-guess phase"}
              </button>
            )}
            {state.phase === "predatorGuess" && (
              <button onClick={finalizeGame} className="bg-amber-600 px-3 py-1 rounded text-sm">Finalize scores &amp; end game</button>
            )}
            <button onClick={resetGame} className="bg-red-700 px-3 py-1 rounded text-sm">Reset game</button>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm">Centre pile (host view — {state.revealedCentreCount}/12 revealed to players)</h3>
            <div className="flex gap-2 flex-wrap">
              {state.centrePile.map((c, i) => {
                const revealed = i < state.revealedCentreCount;
                return (
                  <div key={i} className={`w-10 h-14 rounded flex items-center justify-center text-sm font-bold ${revealed ? `bg-slate-100 ${isRedSuit(c.suit) ? "text-red-600" : "text-slate-900"}` : `bg-slate-600 ${isRedSuit(c.suit) ? "text-red-400" : "text-slate-400"} border border-dashed border-slate-500`}`}>
                    {c.rank}{c.suit}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
            <h3 className="font-semibold mb-2 text-sm">All players (host only)</h3>
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-left">
                <tr><th className="pb-1">Player</th><th className="pb-1">Cards</th><th className="pb-1">Points</th><th className="pb-1">Partner</th><th className="pb-1">Prey</th><th className="pb-1">Predator</th><th className="pb-1">Status</th><th className="pb-1">Clues known about them</th></tr>
              </thead>
              <tbody>
                {state.players.map((p) => {
                  const preyMap = {}; for (const pl of state.players) preyMap[pl.name] = pl.prey;
                  const predator = predatorOf(preyMap, p.name);
                  const clues = state.questions.filter((q) => q.target === p.name);
                  return (
                    <tr key={p.name} className="border-t border-slate-700 align-top">
                      <td className="py-1">{p.name}</td>
                      <td className="py-1 font-mono">{p.cards.map((c, i) => <span key={i} className={p.cardsRevealed[i] ? (isRedSuit(c.suit) ? "text-red-900" : "text-slate-500") : (isRedSuit(c.suit) ? "text-red-400" : "text-slate-100")}>{c.rank}{c.suit} </span>)}</td>
                      <td className="py-1 font-mono text-amber-400">{p.points}</td>
                      <td className="py-1 text-xs">{p.partner || "—"}</td>
                      <td className="py-1 text-xs">{p.prey || "—"}</td>
                      <td className="py-1 text-xs">{predator || "—"}</td>
                      <td className="py-1 text-xs">{isCracked(p) ? <span className="text-red-400">Cracked</span> : "Active"}</td>
                      <td className="py-1">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {clues.map((q) => (
                            <span key={q.id} title={q.text}
                              className={`text-[10px] rounded px-1.5 py-0.5 ${q.isPublic ? "bg-slate-700 text-slate-200" : "bg-indigo-900/60 text-indigo-200"}`}>
                              {shortLabel(q)} ({q.asker})
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 overflow-x-auto">
            <h3 className="font-semibold mb-2 text-sm">Question token tracker</h3>
            <p className="text-xs text-slate-400 mb-2">Base budget: {state.questionBudget} per player (max 2 to the same target). Bonus tokens (earned via Interrogation Bonus or bought for {BONUS_TOKEN_COST} points) can go past the cap.</p>
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-left"><tr><th className="pb-1">Player</th><th className="pb-1">Base used</th><th className="pb-1">Bonus used / available</th><th className="pb-1">Asked count</th></tr></thead>
              <tbody>
                {state.players.map((p) => (
                  <tr key={p.name} className="border-t border-slate-700 align-top">
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5 font-mono">{baseUsedTotal(p)}/{state.questionBudget}</td>
                    <td className="py-1.5 font-mono">{bonusUsedTotal(p)}/{p.bonusTokens}</td>
                    <td className="py-1.5 font-mono">{p.askedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm">Pending guesses this round</h3>
            {Object.keys(state.guesses).length === 0 && <p className="text-xs text-slate-400">No guesses submitted yet.</p>}
            {Object.entries(state.guesses).map(([name, g]) => (
              <div key={name} className="text-sm text-slate-300">{name} guesses {g.target} holds {g.rank}{g.suit}</div>
            ))}
          </div>

          {state.phase === "predatorGuess" && (
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">Predator guesses submitted</h3>
              {state.players.map((p) => (
                <div key={p.name} className="text-sm text-slate-300">{p.name}: {p.predatorGuess || <span className="text-slate-500">not submitted</span>}</div>
              ))}
            </div>
          )}

          <div className="bg-slate-800 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm">Log</h3>
            <div className="space-y-1 text-xs text-slate-400 max-h-40 overflow-y-auto">
              {state.log.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        </>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-5 max-w-sm w-full border border-slate-600">
            <p className="text-sm mb-4">{confirmDialog}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDialog(null)} className="px-3 py-1.5 rounded text-sm bg-slate-600">Cancel</button>
              <button onClick={() => { advancePhase(); setConfirmDialog(null); }} className="px-3 py-1.5 rounded text-sm bg-amber-600 font-medium">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
