import type {
  CardValue,
  Player,
  QuestionRequest,
  Suit,
} from '../types/game.ts';
import { SUITS } from './constants.ts';
import type { GameState } from './engine.ts';
import {
  activatePower,
  askQuestion,
  submitOrEditGuess,
} from './engine.ts';

export function runBotTurn(state: GameState, botId: string): GameState {
  let currentState = state;
  const bot = currentState.players.find((p) => p.id === botId);
  if (!bot || !bot.isBot) return currentState;

  // 1. Consider using Power if unused
  if (!bot.powerUsed && !bot.powerDisabled && Math.random() < 0.3) {
    const otherPlayers = currentState.players.filter((p) => p.id !== bot.id);
    const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

    if (
      bot.powerId === 'Sanjeevani' ||
      bot.powerId === 'Lakshman Rekha' ||
      bot.powerId === 'Divya Shrishti'
    ) {
      const powRes = activatePower(currentState, bot.id);
      if (powRes.success) currentState = powRes.state;
    } else if (
      bot.powerId === 'Divine Sight' ||
      bot.powerId === 'Nagpash' ||
      bot.powerId === 'Secret of Lanka' ||
      bot.powerId === 'Brahma Gyan' ||
      bot.powerId === 'Vanara Sena' ||
      bot.powerId === 'Sudarshan Chakra' ||
      bot.powerId === 'Makhan Chori'
    ) {
      const powRes = activatePower(currentState, bot.id, randomTarget.id);
      if (powRes.success) currentState = powRes.state;
    }
  }

  // 2. Consider asking a question if tokens available
  const updatedBot = currentState.players.find((p) => p.id === botId)!;
  if (updatedBot.questionTokens > 0 && Math.random() < 0.6) {
    const normalRemaining =
      updatedBot.normalQuestionTokens !== undefined
        ? updatedBot.normalQuestionTokens
        : Math.max(0, updatedBot.questionTokens - (updatedBot.bonusTokensAvailable || 0));
    const bonusAvailable = updatedBot.bonusTokensAvailable || 0;

    const candidates = currentState.players.filter(
      (p) =>
        p.id !== bot.id &&
        p.cards.some((c) => !c.isRevealed) &&
        ((updatedBot.baseQuestionsUsed?.[p.id] || 0) < 2 ? normalRemaining > 0 : bonusAvailable > 0)
    );
    if (candidates.length > 0) {
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      const isPublic = Math.random() < 0.5;

      const questionTypeChoice = Math.random();
      let req: QuestionRequest | null = null;

      if (questionTypeChoice < 0.4) {
        // Suit position question
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        const pos = Math.random() < 0.5 ? 'higher' : 'lower';
        req = {
          askerId: bot.id,
          targetId: target.id,
          isPublic,
          kind: 'suit_position',
          cardPosition: pos,
          suitQuery: suit,
        };
      } else if (questionTypeChoice < 0.7) {
        // Toggle question
        const toggles = [
          'Both cards are the same colour',
          'Sum of both cards is odd',
          'Sum of both cards is even',
          'Both cards are odd',
          'Both cards are even',
          'Consecutive values',
          'Both red',
          'Both black',
        ] as const;
        const toggle = toggles[Math.floor(Math.random() * toggles.length)];
        req = {
          askerId: bot.id,
          targetId: target.id,
          isPublic,
          kind: 'toggle',
          toggleType: toggle,
        };
      } else {
        // Numeric question with valid range
        const numVal = Math.floor(Math.random() * 9) + 4; // 4 to 12 (valid sum: 2-16)
        req = {
          askerId: bot.id,
          targetId: target.id,
          isPublic,
          kind: 'numeric',
          numericMetric: 'Sum',
          comparator: '>=',
          numericValue: numVal,
        };
      }

      if (req) {
        const qRes = askQuestion(currentState, req);
        if (qRes.success) currentState = qRes.state;
      }
    }
  }

  // 3. Submit a guess if not already submitted and not blocked by Nagpash
  const currentBotState = currentState.players.find((p) => p.id === botId)!;
  if (!currentBotState.submittedGuess && !currentBotState.nagpashBlockedThisRound) {
    const targets = currentState.players.filter(
      (p) => p.id !== bot.id && !p.lakshmanRekhaActiveThisRound && p.cards.some((c) => !c.isRevealed)
    );

    if (targets.length > 0) {
      const chosenTarget = targets[Math.floor(Math.random() * targets.length)];

      // Pick a reasonable unrevealed card guess
      // Get all revealed card IDs
      const revealedIds = new Set<string>();
      currentState.players.forEach((p) => {
        p.cards.forEach((c) => {
          if (c.isRevealed) revealedIds.add(c.id);
        });
      });
      currentState.centralCards.forEach((c) => {
        if (c.isRevealed) revealedIds.add(c.id);
      });
      // Also exclude bot's own cards
      bot.cards.forEach((c) => revealedIds.add(c.id));

      const candidateCards: { suit: Suit; value: CardValue }[] = [];
      for (const suit of SUITS) {
        for (let v = 1; v <= 8; v++) {
          const id = `${suit}_${v}`;
          if (!revealedIds.has(id)) {
            candidateCards.push({ suit, value: v as CardValue });
          }
        }
      }

      const pick =
        candidateCards.length > 0
          ? candidateCards[Math.floor(Math.random() * candidateCards.length)]
          : { suit: 'Hearts' as Suit, value: 5 as CardValue };

      // If bot is Angad and has gambits remaining, occasionally use gambit
      let isGambit = false;
      if (
        currentBotState.characterId === 'Angad' &&
        currentBotState.angadGambitsUsed < 3 &&
        Math.random() < 0.4
      ) {
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

export function autoPlayAllBots(state: GameState): GameState {
  let s = state;
  for (const p of s.players) {
    if (p.isBot) {
      s = runBotTurn(s, p.id);
    }
  }
  return s;
}
