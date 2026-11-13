import type {
  CardValue,
  CharacterDef,
  CharacterId,
  NumericMetric,
  PowerDef,
  PowerId,
  Suit,
} from '../types/game.ts';

export const SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];

export const SUIT_COLORS: Record<Suit, 'red' | 'black'> = {
  Hearts: 'red',
  Diamonds: 'red',
  Clubs: 'black',
  Spades: 'black',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  Hearts: '♥',
  Diamonds: '♦',
  Clubs: '♣',
  Spades: '♠',
};

export const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const VALUE_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
};

export const MANDATORY_CHARACTERS: CharacterId[] = ['Rama', 'Ravana', 'Lakshmana', 'Sita'];

export const OPTIONAL_CHARACTERS: CharacterId[] = [
  'Vibhishana',
  'Hanuman',
  'Patakha',
  'Narada',
  'Shabari',
  'Angad',
  'Jambavan',
  'Sugriva',
  'Kumbhakarna',
];

export const ALL_CHARACTER_IDS: CharacterId[] = [
  ...MANDATORY_CHARACTERS,
  ...OPTIONAL_CHARACTERS,
];

export const CHARACTER_DEFS: Record<CharacterId, CharacterDef> = {
  Rama: {
    id: 'Rama',
    name: 'Ram (Rama)',
    title: 'Vanquish Ravana',
    objectiveSummary: 'Make at least one personally correct guess against the player holding Ravana. (+8)',
    maxPoints: 8,
    lore: 'The virtuous prince of Ayodhya on a divine quest to defeat darkness.',
    isMandatory: true,
  },
  Ravana: {
    id: 'Ravana',
    name: 'Ravana',
    title: 'The Abductor',
    objectiveSummary: 'Both cards belonging to the player holding Sita must be exposed by end of game. (+8)',
    maxPoints: 8,
    lore: 'The mighty ten-headed king of Lanka with immense knowledge and power.',
    isMandatory: true,
  },
  Lakshmana: {
    id: 'Lakshmana',
    name: 'Laxmana (Lakshmana)',
    title: "Brother's Vow",
    objectiveSummary: 'Ram must have at least one unrevealed card at the end of the game. (+5)',
    maxPoints: 5,
    lore: 'Loyal and fierce protector devoted to guarding his elder brother.',
    isMandatory: true,
  },
  Sita: {
    id: 'Sita',
    name: 'Sita',
    title: 'The Unbroken Spirit',
    objectiveSummary: 'One unrevealed card at end: +5. Both unrevealed cards at end: +8.',
    maxPoints: 8,
    lore: 'Embodiment of dignity, endurance, and unyielding fortitude.',
    isMandatory: true,
  },
  Vibhishana: {
    id: 'Vibhishana',
    name: 'Vibhishana',
    title: 'Betrayal of Lanka',
    objectiveSummary: 'Both cards belonging to your secret partner must be exposed by the end. (+10)',
    maxPoints: 10,
    lore: 'Seeker of dharma who allied with righteousness against tyranny.',
    isMandatory: false,
  },
  Hanuman: {
    id: 'Hanuman',
    name: 'Hanuman',
    title: 'Lanka Dahan',
    objectiveSummary: 'Earn +2 for every different player you personally guess correctly (Max +8).',
    maxPoints: 8,
    lore: 'Supreme devotee possessing boundless devotion and agility.',
    isMandatory: false,
  },
  Patakha: {
    id: 'Patakha',
    name: 'Patakha',
    title: 'The Great Explosion',
    objectiveSummary: 'Both your cards must be exposed by the end of Round 2. (+8)',
    maxPoints: 8,
    lore: 'The festival firecracker that flashes brightly and early.',
    isMandatory: false,
  },
  Narada: {
    id: 'Narada',
    name: 'Narada',
    title: 'The Divine Messenger',
    objectiveSummary: 'Ask at least 5 public questions and zero private questions during the game. (+4)',
    maxPoints: 4,
    lore: 'The celestial sage who sings the praises of the divine across the realms.',
    isMandatory: false,
  },
  Shabari: {
    id: 'Shabari',
    name: 'Shabari',
    title: 'The Sacred Offering',
    objectiveSummary: 'Choose one suit at start. Earn +2 for every card of that suit personally guessed correctly (Max +8).',
    maxPoints: 8,
    lore: 'Humble devotee who tasted each wild berry to offer only the sweetest.',
    isMandatory: false,
  },
  Angad: {
    id: 'Angad',
    name: 'Angad',
    title: 'The Unshakable Warrior',
    objectiveSummary: 'Mark up to 3 guesses as Gambits. Correct Gambit: +3; Incorrect: −3 (Range: −9 to +9).',
    maxPoints: 9,
    lore: 'Valiant vanara prince whose planted foot could not be moved by any warrior.',
    isMandatory: false,
  },
  Jambavan: {
    id: 'Jambavan',
    name: 'Jambavan',
    title: 'Wisdom of Ages',
    objectiveSummary: 'Earn +2 for every different suit in which you personally make a correct guess (Max +8).',
    maxPoints: 8,
    lore: 'Venerable bear king blessed with ancient wisdom and immense memory.',
    isMandatory: false,
  },
  Sugriva: {
    id: 'Sugriva',
    name: 'Sugriva',
    title: 'The Vanara Alliance',
    objectiveSummary: 'Earn +2 each time at least 2 players make the same correct exact-card guess in a round (Max +6).',
    maxPoints: 6,
    lore: 'King of Kishkindha who united the monkey army in common purpose.',
    isMandatory: false,
  },
  Kumbhakarna: {
    id: 'Kumbhakarna',
    name: 'Kumbhakarna',
    title: 'The Great Sleep',
    objectiveSummary: 'Earn +2 for every incorrect guess made against either of your cards (Max +6). Hidden until round end.',
    maxPoints: 6,
    lore: 'Colossal slumberer whose peaceful sleep confuses all attackers.',
    isMandatory: false,
  },
};

export const POWER_DEFS: Record<PowerId, PowerDef> = {
  'Divine Sight': {
    id: 'Divine Sight',
    name: 'Divine Sight',
    description: 'Privately learn the Character Card of one player. Their Power Card remains hidden.',
    targetType: 'player',
  },
  Nagpash: {
    id: 'Nagpash',
    name: 'Nagpash',
    description: 'Choose one player. They cannot submit a guess in the round when you use this power (cancels any already submitted).',
    targetType: 'player',
  },
  'Lakshman Rekha': {
    id: 'Lakshman Rekha',
    name: 'Lakshman Rekha',
    description: 'For the round when you use this power, no player can submit a guess against either of your cards (cancels any already submitted against you).',
    targetType: 'none',
  },
  Sanjeevani: {
    id: 'Sanjeevani',
    name: 'Sanjeevani',
    description: 'Receive two extra Question Tokens immediately.',
    targetType: 'none',
  },
  'Ten Heads': {
    id: 'Ten Heads',
    name: 'Ten Heads',
    description: 'Ask the same private question to three different players for one Question Token. Only you see the three answers.',
    targetType: 'three_players',
  },
  'Secret of Lanka': {
    id: 'Secret of Lanka',
    name: 'Secret of Lanka',
    description: 'Choose one player who is not your partner. Privately learn the suits of both their unrevealed cards. If partner is chosen, power is spent and you learn only that they are your partner.',
    targetType: 'player_not_partner',
  },
  "Hanuman's Leap": {
    id: "Hanuman's Leap",
    name: "Hanuman's Leap",
    description: 'Automatic: The first time one of your guesses is resolved as incorrect, you receive one extra guess in the following round.',
    targetType: 'none',
    isAutomatic: true,
  },
  'Brahma Gyan': {
    id: 'Brahma Gyan',
    name: 'Brahma Gyan',
    description: 'Choose one player who is not your partner. Privately learn the value of one of their unrevealed cards. If partner is chosen, power is spent and you learn only that they are your partner.',
    targetType: 'player_not_partner',
  },
  'Vanara Sena': {
    id: 'Vanara Sena',
    name: 'Vanara Sena',
    description: 'Choose one other player. You and that player each receive one extra Question Token.',
    targetType: 'player',
  },
  'Sudarshan Chakra': {
    id: 'Sudarshan Chakra',
    name: 'Sudarshan Chakra',
    description: 'Choose one player and permanently disable their Power Card.',
    targetType: 'player',
  },
  'Makhan Chori': {
    id: 'Makhan Chori',
    name: 'Makhan Chori',
    description: 'Steal another player\'s Power Card. If unused, you acquire it and may use it once; original owner loses it. If already used, receive nothing.',
    targetType: 'player',
  },
  'Divya Shrishti': {
    id: 'Divya Shrishti',
    name: 'Divya Shrishti',
    description: 'Privately view the next three unrevealed cards in the central pile without rearranging them.',
    targetType: 'none',
  },
};

export const ALL_POWER_IDS: PowerId[] = [
  'Divine Sight',
  'Nagpash',
  'Lakshman Rekha',
  'Sanjeevani',
  'Ten Heads',
  'Secret of Lanka',
  "Hanuman's Leap",
  'Brahma Gyan',
  'Vanara Sena',
  'Sudarshan Chakra',
  'Makhan Chori',
  'Divya Shrishti',
];

// Metric range restrictions based on Rule 6:
// Sum: 2–16
// Difference: 0–7
// Product: 1–64
// Higher card: 1–8
// Lower card: 1–8
// One of your cards: 1–8
// Red/black/suit sums: 0–16
// Card, colour, suit or Ace counts: 0–2
export type PlayerCountMode = 6 | 8;

export function getCardValues(playerCount: PlayerCountMode = 8): CardValue[] {
  return playerCount === 6 ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7, 8];
}

// Metric range restrictions based on Rule 6:
// In 8P: values 1–8 (sums 2–16, diff 0–7, prod 1–64)
// In 6P: values 1–6 (sums 2–12, diff 0–5, prod 1–36)
export function getMetricRanges(playerCount: PlayerCountMode = 8): Record<NumericMetric, { min: number; max: number }> {
  const maxVal = playerCount === 6 ? 6 : 8;
  const maxDiff = playerCount === 6 ? 5 : 7;
  const maxProd = playerCount === 6 ? 36 : 64;
  const maxTwoSum = maxVal * 2;

  return {
    Sum: { min: 2, max: maxTwoSum },
    Difference: { min: 0, max: maxDiff },
    Product: { min: 1, max: maxProd },
    'Higher card': { min: 1, max: maxVal },
    'Lower card': { min: 1, max: maxVal },
    'One of your cards': { min: 1, max: maxVal },
    'Red sum': { min: 0, max: maxTwoSum },
    'Black sum': { min: 0, max: maxTwoSum },
    'Hearts sum': { min: 0, max: maxTwoSum },
    'Diamonds sum': { min: 0, max: maxTwoSum },
    'Clubs sum': { min: 0, max: maxTwoSum },
    'Spades sum': { min: 0, max: maxTwoSum },
    'Card count': { min: 0, max: 2 },
    'Red count': { min: 0, max: 2 },
    'Black count': { min: 0, max: 2 },
    'Hearts count': { min: 0, max: 2 },
    'Diamonds count': { min: 0, max: 2 },
    'Clubs count': { min: 0, max: 2 },
    'Spades count': { min: 0, max: 2 },
    'Ace count': { min: 0, max: 2 },
  };
}

export const METRIC_RANGES = getMetricRanges(8);

export const DEFAULT_QUESTION_BUDGET = 10;

// 8-Player Schedule: 32 cards (16 player, 16 central), reveals 6, 4, 2, 0, durations 40, 20, 10, 10
export const ROUND_SCHEDULE_8P = {
  1: { durationMinutes: 40, centralCardsToReveal: 6, guessPoints: 10 },
  2: { durationMinutes: 20, centralCardsToReveal: 4, guessPoints: 8 },
  3: { durationMinutes: 10, centralCardsToReveal: 2, guessPoints: 6 },
  4: { durationMinutes: 10, centralCardsToReveal: 0, guessPoints: 4 },
} as const;

// 6-Player Schedule: 24 cards (12 player, 12 central), reveals 5, 3, 2, 0, durations 30, 20, 10, 10
export const ROUND_SCHEDULE_6P = {
  1: { durationMinutes: 30, centralCardsToReveal: 5, guessPoints: 10 },
  2: { durationMinutes: 20, centralCardsToReveal: 3, guessPoints: 8 },
  3: { durationMinutes: 10, centralCardsToReveal: 2, guessPoints: 6 },
  4: { durationMinutes: 10, centralCardsToReveal: 0, guessPoints: 4 },
} as const;

export const ROUND_SCHEDULE = ROUND_SCHEDULE_8P;

export function getRoundSchedule(playerCount: PlayerCountMode = 8) {
  return playerCount === 6 ? ROUND_SCHEDULE_6P : ROUND_SCHEDULE_8P;
}
