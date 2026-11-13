import type {
  CharacterId,
  GameScoreBreakdown,
  Player,
  Suit,
} from '../types/game.ts';

export interface ScoreContext {
  players: Player[];
  currentRound: number;
  isGameOver: boolean;
  sugrivaSharedRoundsCount?: number; // Times Sugriva alliance triggered
}

export function computeRunningScore(player: Player, baseGuessPoints = 0): number {
  // Public running score includes:
  // 1. Correct guess points (accumulated on player.correctGuesses or baseGuessPoints)
  // 2. Angad gambit adjustments (accumulated in angadGambitScore)
  // 3. Public question points (+1 per public question)
  // 4. Bonus token purchases (-3 per token)
  // Points can never go negative:
  const raw =
    baseGuessPoints +
    player.publicQuestionsAsked * 1 -
    player.bonusTokensBought * 3 +
    player.angadGambitScore;

  return Math.max(0, raw);
}

export function evaluateCharacterObjective(
  player: Player,
  allPlayers: Player[],
  sugrivaSharedCount: number
): { points: number; explanation: string } {
  const charId = player.characterId;

  switch (charId) {
    case 'Rama': {
      // Find Ravana
      const ravana = allPlayers.find((p) => p.characterId === 'Ravana');
      if (!ravana) {
        return {
          points: 0,
          explanation: 'Ravana is active in the game · Vanquish Ravana by making a correct guess (+8)',
        };
      }
      const guessedRavana = player.correctGuesses.some((g) => g.targetPlayerId === ravana.id);
      if (guessedRavana) {
        return { points: 8, explanation: 'Achieved: Successfully guessed Ravana (+8)' };
      }
      return { points: 0, explanation: 'Did not correctly guess Ravana yet (0/8)' };
    }

    case 'Ravana': {
      // Find Sita
      const sita = allPlayers.find((p) => p.characterId === 'Sita');
      if (!sita) {
        return {
          points: 0,
          explanation: "Sita is active in the game · Expose both of Sita's cards (+8)",
        };
      }
      const sitaExposed = sita.cards.every((c) => c.isRevealed);
      if (sitaExposed) {
        return { points: 8, explanation: "Achieved: Both of Sita's cards were exposed (+8)" };
      }
      return { points: 0, explanation: "Sita still has unrevealed card(s) (0/8)" };
    }

    case 'Lakshmana': {
      // Find Rama
      const rama = allPlayers.find((p) => p.characterId === 'Rama');
      if (!rama) {
        return {
          points: 5,
          explanation: 'Rama is active in the game · Keep Rama protected through Round 4 (+5 if protected)',
        };
      }
      const ramaProtected = rama.cards.some((c) => !c.isRevealed);
      if (ramaProtected) {
        return { points: 5, explanation: 'Achieved: Rama has at least one unrevealed card (+5)' };
      }
      return { points: 0, explanation: "Both of Rama's cards were exposed (0/5)" };
    }

    case 'Sita': {
      const unrevealedCount = player.cards.filter((c) => !c.isRevealed).length;
      if (unrevealedCount === 2) {
        return { points: 8, explanation: 'Achieved: Both cards unrevealed at game end (+8)' };
      }
      if (unrevealedCount === 1) {
        return { points: 5, explanation: 'Achieved: One card unrevealed at game end (+5)' };
      }
      return { points: 0, explanation: 'Both cards were exposed (0/8)' };
    }

    case 'Vibhishana': {
      const partner = allPlayers.find((p) => p.id === player.secretPartnerId);
      if (!partner) return { points: 0, explanation: 'Partner not found.' };
      const partnerExposed = partner.cards.every((c) => c.isRevealed);
      if (partnerExposed) {
        return { points: 10, explanation: "Achieved: Both of secret partner's cards exposed (+10)" };
      }
      return { points: 0, explanation: "Partner has unrevealed card(s) (0/10)" };
    }

    case 'Hanuman': {
      const uniqueTargets = new Set(player.correctGuesses.map((g) => g.targetPlayerId));
      const points = Math.min(8, uniqueTargets.size * 2);
      return {
        points,
        explanation: `Achieved: Correctly guessed ${uniqueTargets.size} different player(s) (+${points}/8)`,
      };
    }

    case 'Patakha': {
      // Both cards exposed by end of Round 2
      const bothExposedInR1OrR2 =
        player.cards.every((c) => c.isRevealed && c.revealedInRound !== undefined && c.revealedInRound <= 2);
      if (bothExposedInR1OrR2) {
        return { points: 8, explanation: 'Achieved: Both cards exposed by end of Round 2 (+8)' };
      }
      return { points: 0, explanation: 'Cards were not both exposed by Round 2 (0/8)' };
    }

    case 'Narada': {
      if (player.publicQuestionsAsked >= 5 && player.privateQuestionsAsked === 0) {
        return { points: 4, explanation: `Achieved: ${player.publicQuestionsAsked} public questions & 0 private (+4)` };
      }
      return {
        points: 0,
        explanation: `Requirement not met: ${player.publicQuestionsAsked} public, ${player.privateQuestionsAsked} private (0/4)`,
      };
    }

    case 'Shabari': {
      if (!player.shabariChosenSuit) {
        return { points: 0, explanation: 'No suit chosen (0/8)' };
      }
      const matchingGuesses = player.correctGuesses.filter((g) => g.suit === player.shabariChosenSuit);
      const points = Math.min(8, matchingGuesses.length * 2);
      return {
        points,
        explanation: `Achieved: ${matchingGuesses.length} correct guess(es) of chosen suit (${player.shabariChosenSuit}) (+${points}/8)`,
      };
    }

    case 'Angad': {
      // Gambits bonus is tracked during play and added directly
      return {
        points: 0, // already included in gambit score breakdown
        explanation: `Gambits score: ${player.angadGambitScore >= 0 ? '+' : ''}${player.angadGambitScore} (${player.angadGambitsUsed}/3 gambits used)`,
      };
    }

    case 'Jambavan': {
      const uniqueSuits = new Set<Suit>(player.correctGuesses.map((g) => g.suit));
      const points = Math.min(8, uniqueSuits.size * 2);
      return {
        points,
        explanation: `Achieved: Correct guesses across ${uniqueSuits.size} different suit(s) (+${points}/8)`,
      };
    }

    case 'Sugriva': {
      const points = Math.min(6, sugrivaSharedCount * 2);
      return {
        points,
        explanation: `Achieved: ${sugrivaSharedCount} shared-guess round(s) (+${points}/6)`,
      };
    }

    case 'Kumbhakarna': {
      const points = Math.min(6, player.kumbhakarnaTotalBonus);
      return {
        points,
        explanation: `Achieved: ${points / 2} incorrect guesses against your cards (+${points}/6)`,
      };
    }

    default:
      return { points: 0, explanation: '' };
  }
}

export function computeFinalScores(
  players: Player[],
  sugrivaSharedCount: number,
  playerPointsMap: Record<string, number>
): GameScoreBreakdown[] {
  return players.map((p) => {
    // 1. Base guess points
    const baseGuessPoints = playerPointsMap[p.id] || 0;

    // 2. Angad gambit points
    const angadGambitPoints = p.angadGambitScore;

    // 3. Public question points
    const publicQuestionPoints = p.publicQuestionsAsked * 1;

    // 4. Bonus tokens deduction
    const bonusTokensBoughtDeduction = p.bonusTokensBought * 3;

    // Running score (never negative)
    const runningScore = Math.max(
      0,
      baseGuessPoints + angadGambitPoints + publicQuestionPoints - bonusTokensBoughtDeduction
    );

    // End-of-game survival:
    // Own survival: 1 unrevealed card +2; both +5.
    const ownUnrevealed = p.cards.filter((c) => !c.isRevealed).length;
    let ownSurvivalPoints = 0;
    if (ownUnrevealed === 2) ownSurvivalPoints = 5;
    else if (ownUnrevealed === 1) ownSurvivalPoints = 2;

    // Partner survival: 1 unrevealed card +2; both +3.
    const partner = players.find((other) => other.id === p.secretPartnerId);
    let partnerSurvivalPoints = 0;
    if (partner) {
      const partnerUnrevealed = partner.cards.filter((c) => !c.isRevealed).length;
      if (partnerUnrevealed === 2) partnerSurvivalPoints = 3;
      else if (partnerUnrevealed === 1) partnerSurvivalPoints = 2;
    }

    // Unused tokens: +1 each
    const unusedTokenPoints = p.questionTokens * 1;

    // Character objective points
    const { points: charPoints, explanation: charDesc } = evaluateCharacterObjective(
      p,
      players,
      sugrivaSharedCount
    );

    // Total score (never negative)
    const totalScore = Math.max(
      0,
      runningScore +
      ownSurvivalPoints +
      partnerSurvivalPoints +
      unusedTokenPoints +
      charPoints
    );

    return {
      playerId: p.id,
      playerName: p.name,
      characterId: p.characterId,
      baseGuessPoints,
      angadGambitPoints,
      publicQuestionPoints,
      bonusTokensBoughtDeduction,
      runningScore,
      ownSurvivalPoints,
      partnerSurvivalPoints,
      unusedTokenPoints,
      characterObjectivePoints: charPoints,
      characterObjectiveDetails: charDesc,
      totalScore,
    };
  });
}
