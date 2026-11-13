export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // A is 1

export interface PlayingCard {
  id: string; // e.g. "Hearts_1"
  suit: Suit;
  value: CardValue;
  isRevealed: boolean;
  revealedBy?: string; // Player ID who revealed it
  revealedInRound?: number;
}

export type CharacterId =
  | 'Rama'
  | 'Ravana'
  | 'Lakshmana'
  | 'Sita'
  | 'Vibhishana'
  | 'Hanuman'
  | 'Patakha'
  | 'Narada'
  | 'Shabari'
  | 'Angad'
  | 'Jambavan'
  | 'Sugriva'
  | 'Kumbhakarna';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  objectiveSummary: string;
  maxPoints: number;
  lore: string;
  isMandatory: boolean;
}

export type PowerId =
  | 'Divine Sight'
  | 'Nagpash'
  | 'Lakshman Rekha'
  | 'Sanjeevani'
  | 'Ten Heads'
  | 'Secret of Lanka'
  | 'Hanuman\'s Leap'
  | 'Brahma Gyan'
  | 'Vanara Sena'
  | 'Sudarshan Chakra'
  | 'Makhan Chori'
  | 'Divya Shrishti';

export interface PowerDef {
  id: PowerId;
  name: string;
  description: string;
  targetType: 'none' | 'player' | 'player_not_partner' | 'three_players';
  isAutomatic?: boolean;
}

export interface Player {
  id: string; // 'p1' ... 'p8'
  name: string;
  avatar: string;
  isBot: boolean;
  cards: [PlayingCard, PlayingCard];
  secretPartnerId: string; // ID of secret partner
  partnerSuits: [Suit, Suit]; // The 2 suits belonging to secret partner (known from start)
  partnerKnownToMe: boolean; // Whether player has discovered partner's exact identity
  cardTags?: Record<string, { player: string; mode: 'suspect' | 'not' }>; // Private deduction tracker notes
  characterId: CharacterId;
  powerId: PowerId;
  powerUsed: boolean;
  powerDisabled: boolean; // Sudarshan Chakra
  tenHeadsArmed?: boolean; // When Ten Heads has been primed for the next question
  questionTokens: number; // total question tokens remaining (normal + bonus)
  normalQuestionTokens: number; // normal tokens remaining (max 2 per target player)
  bonusTokensAvailable: number; // bonus tokens remaining (usable on any target)
  baseQuestionsUsed: Record<string, number>; // targetPlayerId -> normal questions asked to them (max 2)
  bonusTokensBought: number;
  publicQuestionsAsked: number;
  privateQuestionsAsked: number;
  // Specific character states
  shabariChosenSuit?: Suit;
  angadGambitsUsed: number; // max 3
  angadGambitScore: number; // sum of +3 and -3
  hanumanExtraGuessAvailable: boolean; // from Hanuman's Leap
  hanumanLeapTriggered: boolean;
  kumbhakarnaRoundBonus: number; // accumulated bonus revealed each round
  kumbhakarnaTotalBonus: number; // total for end game
  // Round status
  submittedGuess?: SubmittedGuess;
  nagpashBlockedThisRound?: boolean;
  lakshmanRekhaActiveThisRound?: boolean;
  // Stats
  correctGuesses: CorrectGuessRecord[];
  incorrectGuessesCount: number;
  objectiveProgress?: string;
  objectivePotentialPoints?: number;
}

export interface CorrectGuessRecord {
  targetPlayerId: string;
  cardId: string;
  suit: Suit;
  value: CardValue;
  round: number;
  wasGambit?: boolean;
}

export interface SubmittedGuess {
  targetPlayerId: string;
  suit: Suit;
  value: CardValue;
  isGambit?: boolean; // Angad only
  submittedAtRound: number;
}

export type NumericMetric =
  | 'Sum'
  | 'Difference'
  | 'Product'
  | 'Higher card'
  | 'Lower card'
  | 'One of your cards'
  | 'Red sum'
  | 'Black sum'
  | 'Hearts sum'
  | 'Diamonds sum'
  | 'Clubs sum'
  | 'Spades sum'
  | 'Card count'
  | 'Red count'
  | 'Black count'
  | 'Hearts count'
  | 'Diamonds count'
  | 'Clubs count'
  | 'Spades count'
  | 'Ace count';

export type Comparator = '=' | '>' | '<' | '>=' | '<=' | '!=';

export type CardPosition = 'higher' | 'lower';

export type ToggleQuestionType =
  | 'Both cards are the same colour'
  | 'Sum of both cards is odd'
  | 'Sum of both cards is even'
  | 'Both cards are odd'
  | 'Both cards are even'
  | 'Both red'
  | 'Both black'
  | 'Same suit'
  | 'Same value'
  | 'Consecutive values';

export type QuestionKind = 'numeric' | 'suit_position' | 'toggle';

export interface QuestionRequest {
  askerId: string;
  targetId: string;
  isPublic: boolean;
  kind: QuestionKind;
  // If kind === 'numeric':
  numericMetric?: NumericMetric;
  comparator?: Comparator;
  numericValue?: number;
  // If kind === 'suit_position':
  cardPosition?: CardPosition;
  suitQuery?: Suit;
  // If kind === 'toggle':
  toggleType?: ToggleQuestionType;
  // Optional multi-target for Ten Heads
  secondaryTargetIds?: string[];
}

export interface QuestionLogEntry {
  id: string;
  round: number;
  timestamp: number;
  askerId: string;
  targetId: string;
  isPublic: boolean;
  questionText: string;
  answerText: string;
  answerBoolean: boolean;
}

export interface GameLogEntry {
  id: string;
  round: number;
  timestamp: number;
  type: 'question' | 'guess' | 'power' | 'system' | 'partner_hit';
  text: string;
  isPrivateTo?: string; // If set, only this player sees it
}

export interface GuessResolutionResult {
  round: number;
  resolutions: {
    guesserId: string;
    targetPlayerId: string;
    suit: Suit;
    value: CardValue;
    isGambit: boolean;
    isPartnerHit: boolean;
    isCorrect: boolean;
    pointsAwarded: number;
    splitWithGuesserIds?: string[];
  }[];
  revealedCards: { playerId: string; card: PlayingCard }[];
  sugrivaBonusAwardedTo: string[];
  kumbhakarnaRoundPoints: { playerId: string; pointsThisRound: number; totalSoFar: number }[];
}

export interface GameScoreBreakdown {
  playerId: string;
  playerName: string;
  characterId: CharacterId;
  baseGuessPoints: number;
  angadGambitPoints: number;
  publicQuestionPoints: number;
  bonusTokensBoughtDeduction: number;
  runningScore: number; // Visible during the game!
  // End of game additions:
  ownSurvivalPoints: number;
  partnerSurvivalPoints: number;
  unusedTokenPoints: number;
  characterObjectivePoints: number;
  characterObjectiveDetails: string;
  totalScore: number;
}

export type PlayerCountMode = 6 | 8;

export interface CustomGameSetup {
  playerCount: PlayerCountMode;
  characterOverride?: CharacterId[];
  powerOverride?: PowerId[];
}
