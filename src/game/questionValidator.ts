import { METRIC_RANGES, getMetricRanges, PlayerCountMode } from './constants.ts';
import type { QuestionRequest } from '../types/game.ts';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function validateQuestion(req: QuestionRequest, playerCount: PlayerCountMode = 8): ValidationResult {
  if (!req.askerId || !req.targetId) {
    return { isValid: false, errorMessage: 'Both asker and target player must be selected.' };
  }

  if (req.askerId === req.targetId) {
    return { isValid: false, errorMessage: 'You cannot ask a question to yourself.' };
  }

  if (req.kind === 'numeric') {
    if (!req.numericMetric) {
      return { isValid: false, errorMessage: 'A numeric metric must be chosen.' };
    }
    if (!req.comparator) {
      return { isValid: false, errorMessage: 'A comparator (=, >, <, >=, <=, !=) must be chosen.' };
    }
    if (req.numericValue === undefined || req.numericValue === null || isNaN(req.numericValue)) {
      return { isValid: false, errorMessage: 'A valid number must be provided.' };
    }

    const ranges = getMetricRanges(playerCount);
    const range = ranges[req.numericMetric] || METRIC_RANGES[req.numericMetric];
    if (!range) {
      return { isValid: false, errorMessage: `Unknown metric ${req.numericMetric}.` };
    }

    if (req.numericValue < range.min || req.numericValue > range.max) {
      return {
        isValid: false,
        errorMessage: `Value ${req.numericValue} is out of allowed range [${range.min}–${range.max}] for metric "${req.numericMetric}".`,
      };
    }
    return { isValid: true };
  }

  if (req.kind === 'suit_position') {
    if (!req.cardPosition || (req.cardPosition !== 'higher' && req.cardPosition !== 'lower')) {
      return { isValid: false, errorMessage: 'Select whether you are asking about the higher card or lower card.' };
    }
    if (!req.suitQuery) {
      return { isValid: false, errorMessage: 'Select a suit to query.' };
    }
    return { isValid: true };
  }

  if (req.kind === 'toggle') {
    if (!req.toggleType) {
      return { isValid: false, errorMessage: 'Select a toggle question type.' };
    }
    return { isValid: true };
  }

  return { isValid: false, errorMessage: 'Unsupported question kind.' };
}
