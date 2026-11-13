import type { PlayingCard, QuestionRequest, Suit } from '../types/game.ts';
import { SUIT_COLORS } from './constants.ts';

export function compareValues(actual: number, comparator: string, target: number): boolean {
  switch (comparator) {
    case '=':
      return actual === target;
    case '>':
      return actual > target;
    case '<':
      return actual < target;
    case '>=':
      return actual >= target;
    case '<=':
      return actual <= target;
    case '!=':
      return actual !== target;
    default:
      return false;
  }
}

export function evaluateQuestion(
  req: QuestionRequest,
  cards: [PlayingCard, PlayingCard]
): { result: boolean; formattedQuestion: string; formattedAnswer: string } {
  const [c1, c2] = cards;
  const col1 = SUIT_COLORS[c1.suit];
  const col2 = SUIT_COLORS[c2.suit];

  if (req.kind === 'numeric') {
    const metric = req.numericMetric!;
    const op = req.comparator!;
    const val = req.numericValue!;

    let actual = 0;
    let questionText = `${metric} ${op} ${val}?`;

    switch (metric) {
      case 'Sum':
        actual = c1.value + c2.value;
        break;
      case 'Difference':
        actual = Math.abs(c1.value - c2.value);
        break;
      case 'Product':
        actual = c1.value * c2.value;
        break;
      case 'Higher card':
        actual = Math.max(c1.value, c2.value);
        break;
      case 'Lower card':
        actual = Math.min(c1.value, c2.value);
        break;
      case 'One of your cards':
        // True if at least one card satisfies the comparator with target
        const match1 = compareValues(c1.value, op, val);
        const match2 = compareValues(c2.value, op, val);
        const resOne = match1 || match2;
        return {
          result: resOne,
          formattedQuestion: `Is one of your cards ${op} ${val}?`,
          formattedAnswer: resOne ? 'YES' : 'NO',
        };
      case 'Red sum':
        actual = (col1 === 'red' ? c1.value : 0) + (col2 === 'red' ? c2.value : 0);
        break;
      case 'Black sum':
        actual = (col1 === 'black' ? c1.value : 0) + (col2 === 'black' ? c2.value : 0);
        break;
      case 'Hearts sum':
        actual = (c1.suit === 'Hearts' ? c1.value : 0) + (c2.suit === 'Hearts' ? c2.value : 0);
        break;
      case 'Diamonds sum':
        actual = (c1.suit === 'Diamonds' ? c1.value : 0) + (c2.suit === 'Diamonds' ? c2.value : 0);
        break;
      case 'Clubs sum':
        actual = (c1.suit === 'Clubs' ? c1.value : 0) + (c2.suit === 'Clubs' ? c2.value : 0);
        break;
      case 'Spades sum':
        actual = (c1.suit === 'Spades' ? c1.value : 0) + (c2.suit === 'Spades' ? c2.value : 0);
        break;
      case 'Card count':
        actual = 2;
        break;
      case 'Red count':
        actual = (col1 === 'red' ? 1 : 0) + (col2 === 'red' ? 1 : 0);
        break;
      case 'Black count':
        actual = (col1 === 'black' ? 1 : 0) + (col2 === 'black' ? 1 : 0);
        break;
      case 'Hearts count':
        actual = (c1.suit === 'Hearts' ? 1 : 0) + (c2.suit === 'Hearts' ? 1 : 0);
        break;
      case 'Diamonds count':
        actual = (c1.suit === 'Diamonds' ? 1 : 0) + (c2.suit === 'Diamonds' ? 1 : 0);
        break;
      case 'Clubs count':
        actual = (c1.suit === 'Clubs' ? 1 : 0) + (c2.suit === 'Clubs' ? 1 : 0);
        break;
      case 'Spades count':
        actual = (c1.suit === 'Spades' ? 1 : 0) + (c2.suit === 'Spades' ? 1 : 0);
        break;
      case 'Ace count':
        actual = (c1.value === 1 ? 1 : 0) + (c2.value === 1 ? 1 : 0);
        break;
    }

    const result = compareValues(actual, op, val);
    return {
      result,
      formattedQuestion: `Is ${metric} ${op} ${val}?`,
      formattedAnswer: result ? 'YES' : 'NO',
    };
  }

  if (req.kind === 'suit_position') {
    const pos = req.cardPosition!;
    const suit = req.suitQuery!;
    let result = false;

    if (c1.value > c2.value) {
      const targetCard = pos === 'higher' ? c1 : c2;
      result = targetCard.suit === suit;
    } else if (c2.value > c1.value) {
      const targetCard = pos === 'higher' ? c2 : c1;
      result = targetCard.suit === suit;
    } else {
      // Both cards have equal value: "either card counts as the higher or lower card for this question"
      result = c1.suit === suit || c2.suit === suit;
    }

    return {
      result,
      formattedQuestion: `Is your ${pos} card a ${suit}?`,
      formattedAnswer: result ? 'YES' : 'NO',
    };
  }

  if (req.kind === 'toggle') {
    const toggle = req.toggleType!;
    let result = false;

    switch (toggle) {
      case 'Both cards are the same colour':
        result = col1 === col2;
        break;
      case 'Sum of both cards is odd':
        result = (c1.value + c2.value) % 2 !== 0;
        break;
      case 'Sum of both cards is even':
        result = (c1.value + c2.value) % 2 === 0;
        break;
      case 'Both cards are odd':
        result = c1.value % 2 !== 0 && c2.value % 2 !== 0;
        break;
      case 'Both cards are even':
        result = c1.value % 2 === 0 && c2.value % 2 === 0;
        break;
      case 'Both red':
        result = col1 === 'red' && col2 === 'red';
        break;
      case 'Both black':
        result = col1 === 'black' && col2 === 'black';
        break;
      case 'Same suit':
        result = c1.suit === c2.suit;
        break;
      case 'Same value':
        result = c1.value === c2.value;
        break;
      case 'Consecutive values':
        result = Math.abs(c1.value - c2.value) === 1;
        break;
    }

    return {
      result,
      formattedQuestion: `Are ${toggle.toLowerCase()}?`,
      formattedAnswer: result ? 'YES' : 'NO',
    };
  }

  return {
    result: false,
    formattedQuestion: 'Invalid question',
    formattedAnswer: 'NO',
  };
}
