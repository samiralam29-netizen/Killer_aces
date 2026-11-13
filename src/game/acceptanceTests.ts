import {
  CharacterId,
  PlayingCard,
  PowerId,
  Suit,
  CardValue,
} from '../types/game.ts';
import {
  MANDATORY_CHARACTERS,
  OPTIONAL_CHARACTERS,
  ALL_POWER_IDS,
} from './constants.ts';
import {
  createInitialGame,
  askQuestion,
  submitOrEditGuess,
  activatePower,
  resolveRoundGuesses,
  advanceToNextRound,
  setCardTag,
  GameState,
} from './engine.ts';
import { validateQuestion } from './questionValidator.ts';
import { evaluateQuestion } from './questionEvaluator.ts';
import { computeFinalScores, computeRunningScore, evaluateCharacterObjective } from './scoring.ts';

export interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  details: string;
}

export function runAllAcceptanceTests(): TestResult[] {
  const results: TestResult[] = [];

  // Helper to assert
  const assert = (condition: boolean, passMsg: string, failMsg: string) => {
    return { passed: condition, details: condition ? passMsg : failMsg };
  };

  // -------------------------------------------------------------
  // Test 1: Four mandatory characters and four random characters are dealt
  // -------------------------------------------------------------
  try {
    let allValid = true;
    for (let i = 0; i < 20; i++) {
      const g = createInitialGame();
      const chars = g.players.map((p) => p.characterId);
      const hasMandatory = MANDATORY_CHARACTERS.every((c) => chars.includes(c));
      const optionalChosen = chars.filter((c) => OPTIONAL_CHARACTERS.includes(c));
      if (!hasMandatory || optionalChosen.length !== 4) {
        allValid = false;
        break;
      }
    }
    results.push({
      id: 1,
      name: 'Mandatory & Random Character Distribution',
      passed: allValid,
      details: allValid
        ? 'Verified over 20 iterations: Every game contains Rama, Ravana, Lakshmana, Sita + exactly 4 from the remaining 9.'
        : 'Failed to deal 4 mandatory and 4 random characters.',
    });
  } catch (err: any) {
    results.push({ id: 1, name: 'Mandatory & Random Character Distribution', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 2: Eight unique characters are assigned
  // -------------------------------------------------------------
  try {
    let unique = true;
    for (let i = 0; i < 20; i++) {
      const g = createInitialGame();
      const set = new Set(g.players.map((p) => p.characterId));
      if (set.size !== 8) {
        unique = false;
        break;
      }
    }
    results.push({
      id: 2,
      name: 'Eight Unique Characters Assigned',
      passed: unique,
      details: unique
        ? 'Verified: All 8 players receive distinct Character Cards with no duplicates.'
        : 'Duplicate characters found across players.',
    });
  } catch (err: any) {
    results.push({ id: 2, name: 'Eight Unique Characters Assigned', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 3: Eight unique Power Cards are assigned from the 12-card pool
  // -------------------------------------------------------------
  try {
    let powersUnique = true;
    for (let i = 0; i < 20; i++) {
      const g = createInitialGame();
      const powers = g.players.map((p) => p.powerId);
      const set = new Set(powers);
      const allInPool = powers.every((p) => ALL_POWER_IDS.includes(p));
      if (set.size !== 8 || !allInPool) {
        powersUnique = false;
        break;
      }
    }
    results.push({
      id: 3,
      name: 'Eight Unique Power Cards From 12-Card Pool',
      passed: powersUnique,
      details: powersUnique
        ? 'Verified: Exactly 8 unique powers dealt from the 12-power pool without duplicates.'
        : 'Invalid or duplicated powers detected.',
    });
  } catch (err: any) {
    results.push({ id: 3, name: 'Eight Unique Power Cards From 12-Card Pool', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 4: Ravana is never Rama's partner
  // -------------------------------------------------------------
  try {
    let neverPartner = true;
    for (let i = 0; i < 100; i++) {
      const g = createInitialGame();
      const rama = g.players.find((p) => p.characterId === 'Rama')!;
      const ravana = g.players.find((p) => p.characterId === 'Ravana')!;
      if (rama.secretPartnerId === ravana.id || ravana.secretPartnerId === rama.id) {
        neverPartner = false;
        break;
      }
    }
    results.push({
      id: 4,
      name: "Ravana Is Never Rama's Partner",
      passed: neverPartner,
      details: neverPartner
        ? 'Verified across 100 random game setups: Ravana was never paired with Rama.'
        : "Violation detected: Rama and Ravana were paired as secret partners.",
    });
  } catch (err: any) {
    results.push({ id: 4, name: "Ravana Is Never Rama's Partner", passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 5: Rama's objective detects correct guesses against Ravana
  // -------------------------------------------------------------
  try {
    const g = createInitialGame();
    const rama = g.players.find((p) => p.characterId === 'Rama')!;
    const ravana = g.players.find((p) => p.characterId === 'Ravana')!;

    // Initial check (no guesses)
    const initObj = evaluateCharacterObjective(rama, g.players, 0);
    const initPassed = initObj.points === 0;

    // Simulate Rama guessing Ravana correctly
    const updatedRama = {
      ...rama,
      correctGuesses: [
        {
          targetPlayerId: ravana.id,
          cardId: 'Hearts_4',
          suit: 'Hearts' as Suit,
          value: 4 as const,
          round: 1,
        },
      ],
    };
    const scoredObj = evaluateCharacterObjective(updatedRama, g.players, 0);
    const passed = initPassed && scoredObj.points === 8;

    results.push({
      id: 5,
      name: "Rama Objective: Vanquish Ravana (+8)",
      passed,
      details: passed
        ? 'Verified: Scored 0 before guessing Ravana, and +8 once Rama correctly guessed Ravana.'
        : `Expected 8 points for Rama guessing Ravana, got ${scoredObj.points}.`,
    });
  } catch (err: any) {
    results.push({ id: 5, name: "Rama Objective", passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 6: Ravana's objective detects exposure of both Sita cards
  // -------------------------------------------------------------
  try {
    const g = createInitialGame();
    const ravana = g.players.find((p) => p.characterId === 'Ravana')!;
    const sita = g.players.find((p) => p.characterId === 'Sita')!;

    // Case 1: Sita has cards unrevealed
    const objBefore = evaluateCharacterObjective(ravana, g.players, 0);

    // Case 2: Expose both of Sita's cards
    const modifiedPlayers = g.players.map((p) => {
      if (p.id === sita.id) {
        return {
          ...p,
          cards: [
            { ...p.cards[0], isRevealed: true },
            { ...p.cards[1], isRevealed: true },
          ] as [PlayingCard, PlayingCard],
        };
      }
      return p;
    });

    const objAfter = evaluateCharacterObjective(ravana, modifiedPlayers, 0);
    const passed = objBefore.points === 0 && objAfter.points === 8;

    results.push({
      id: 6,
      name: "Ravana Objective: Abductor (+8 on both Sita cards exposed)",
      passed,
      details: passed
        ? 'Verified: Scored 0 when Sita cards were hidden, and +8 when both cards were exposed.'
        : `Objective scored incorrectly: before=${objBefore.points}, after=${objAfter.points}.`,
    });
  } catch (err: any) {
    results.push({ id: 6, name: "Ravana Objective", passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 7: Character objectives remain hidden from the public running score
  // -------------------------------------------------------------
  try {
    const g = createInitialGame();
    const rama = g.players.find((p) => p.characterId === 'Rama')!;
    const ravana = g.players.find((p) => p.characterId === 'Ravana')!;

    // Rama has achieved objective in player state
    const ramaWithAchieved = {
      ...rama,
      correctGuesses: [
        {
          targetPlayerId: ravana.id,
          cardId: 'Hearts_4',
          suit: 'Hearts' as Suit,
          value: 4 as const,
          round: 1,
        },
      ],
      publicQuestionsAsked: 2,
    };

    const runningScore = computeRunningScore(ramaWithAchieved);
    // Running score should ONLY include public questions (2 * 1 = 2) and guess points, NOT +8 objective!
    const passed = runningScore === 2; // 0 base guess pts + 2 public question pts

    results.push({
      id: 7,
      name: 'Character Objectives Hidden From Running Score',
      passed,
      details: passed
        ? `Verified: Running score is ${runningScore} (only public questions/base points), omitting the +8 character objective until game end.`
        : `Character objective leaked into running score: got ${runningScore}.`,
    });
  } catch (err: any) {
    results.push({ id: 7, name: 'Character Objectives Hidden', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 8: Correct guesses against partners reveal partner identity privately, award zero points and do not reveal card
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const p1 = g.players[0];
    const partner = g.players.find((p) => p.id === p1.secretPartnerId)!;
    const partnerCard = partner.cards[0];

    // Submit guess by p1 against partner's actual card
    const subRes = submitOrEditGuess(g, p1.id, partner.id, partnerCard.suit, partnerCard.value);
    g = subRes.state;

    // Resolve round
    const resolved = resolveRoundGuesses(g);
    const p1Updated = resolved.players.find((p) => p.id === p1.id)!;
    const partnerUpdated = resolved.players.find((p) => p.id === partner.id)!;

    // Check conditions:
    // 1. 0 points awarded to p1
    const p1Points = resolved.playerRunningPoints[p1.id] || 0;
    // 2. Card remains unrevealed
    const cardStillHidden = !partnerUpdated.cards[0].isRevealed;
    // 3. Private partner log created
    const privatePartnerLog = resolved.gameLogs.find(
      (l) => l.type === 'partner_hit' && l.isPrivateTo === p1.id
    );

    const passed =
      p1Points === 0 &&
      cardStillHidden &&
      !!privatePartnerLog &&
      p1Updated.partnerKnownToMe === true;

    results.push({
      id: 8,
      name: 'Partner Guess: Private Reveal, 0 Points & Hidden Card',
      passed,
      details: passed
        ? 'Verified: Correct guess against partner awarded 0 points, card remained hidden, partnerKnownToMe marked true, and guesser privately learned partner identity.'
        : `Failed partner check: points=${p1Points}, cardHidden=${cardStillHidden}, logFound=${!!privatePartnerLog}, partnerKnown=${p1Updated.partnerKnownToMe}`,
    });
  } catch (err: any) {
    results.push({ id: 8, name: 'Partner Guess Rules', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 9: Guess editing works until resolution
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const p1 = g.players[0];
    const p2 = g.players[1];

    // Submit first guess: Spades 4
    let res = submitOrEditGuess(g, p1.id, p2.id, 'Spades', 4);
    const guess1 = res.state.players[0].submittedGuess;

    // Edit guess to: Diamonds 7
    res = submitOrEditGuess(res.state, p1.id, p2.id, 'Diamonds', 7);
    const guess2 = res.state.players[0].submittedGuess;

    const passed =
      guess1?.suit === 'Spades' &&
      guess1.value === 4 &&
      guess2?.suit === 'Diamonds' &&
      guess2.value === 7;

    results.push({
      id: 9,
      name: 'Guess Editing Until Resolution',
      passed,
      details: passed
        ? 'Verified: Player successfully modified their submitted guess before round resolution.'
        : 'Guess editing failed to update submitted parameters.',
    });
  } catch (err: any) {
    results.push({ id: 9, name: 'Guess Editing', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 10: Nagpash cancels an existing guess and blocks guessing
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const user = g.players[0];
    const target = g.players[1];

    // Give user Nagpash
    g.players[0].powerId = 'Nagpash';
    g.players[0].powerUsed = false;

    // Target submits a guess
    let res = submitOrEditGuess(g, target.id, g.players[2].id, 'Hearts', 3);
    g = res.state;
    const hadGuessBefore = !!g.players.find((p) => p.id === target.id)?.submittedGuess;

    // User uses Nagpash on target
    const nagRes = activatePower(g, user.id, target.id);
    g = nagRes.state;

    const targetAfter = g.players.find((p) => p.id === target.id)!;
    const guessCancelled = targetAfter.submittedGuess === undefined;
    const isBlocked = targetAfter.nagpashBlockedThisRound === true;

    // Target attempts to submit a new guess (should be rejected)
    const tryNewGuess = submitOrEditGuess(g, target.id, g.players[2].id, 'Clubs', 5);
    const rejected = !tryNewGuess.success;

    const passed = hadGuessBefore && guessCancelled && isBlocked && rejected;

    results.push({
      id: 10,
      name: 'Nagpash: Cancels Guess & Blocks Round Submission',
      passed,
      details: passed
        ? 'Verified: Nagpash cancelled existing guess, marked target blocked, and rejected subsequent submissions.'
        : `Failed Nagpash verification: hadBefore=${hadGuessBefore}, cancelled=${guessCancelled}, blocked=${isBlocked}, rejected=${rejected}`,
    });
  } catch (err: any) {
    results.push({ id: 10, name: 'Nagpash Verification', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 11: Lakshman Rekha cancels guesses against its user
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const user = g.players[0];
    const attacker = g.players[1];

    user.powerId = 'Lakshman Rekha';
    user.powerUsed = false;

    // Attacker submits a guess targeting user
    let res = submitOrEditGuess(g, attacker.id, user.id, 'Hearts', 2);
    g = res.state;
    const attackerHadGuess = !!g.players.find((p) => p.id === attacker.id)?.submittedGuess;

    // User activates Lakshman Rekha
    const rekhaRes = activatePower(g, user.id);
    g = rekhaRes.state;

    const attackerAfter = g.players.find((p) => p.id === attacker.id)!;
    const userAfter = g.players.find((p) => p.id === user.id)!;
    const cancelled = attackerAfter.submittedGuess === undefined;
    const userProtected = userAfter.lakshmanRekhaActiveThisRound === true;

    // Another player attempts to submit guess against protected user (should fail)
    const newAttacker = g.players[2];
    const tryGuess = submitOrEditGuess(g, newAttacker.id, user.id, 'Clubs', 1);
    const blockedNew = !tryGuess.success;

    const passed = attackerHadGuess && cancelled && userProtected && blockedNew;

    results.push({
      id: 11,
      name: 'Lakshman Rekha: Cancels Existing & Blocks New Guesses',
      passed,
      details: passed
        ? 'Verified: Lakshman Rekha cancelled incoming guesses and blocked new guesses against the user.'
        : `Lakshman Rekha check failed: attackerHad=${attackerHadGuess}, cancelled=${cancelled}, protected=${userProtected}, blockedNew=${blockedNew}`,
    });
  } catch (err: any) {
    results.push({ id: 11, name: 'Lakshman Rekha Verification', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 12: Hanuman's Leap grants a guess in the following round
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const user = g.players[0];
    user.powerId = "Hanuman's Leap";
    user.powerUsed = false;
    user.hanumanLeapTriggered = false;

    // Target a non-partner player with a definitely incorrect guess
    const target = g.players.find((p) => p.id !== user.id && p.id !== user.secretPartnerId)!;
    const targetCardKeys = new Set(target.cards.map((c) => `${c.suit}_${c.value}`));
    let wrongSuit: Suit = 'Spades';
    let wrongVal: CardValue = 8;
    for (const s of ['Spades', 'Hearts', 'Diamonds', 'Clubs'] as Suit[]) {
      for (const v of [1, 2, 3, 4, 5, 6, 7, 8] as CardValue[]) {
        if (!targetCardKeys.has(`${s}_${v}`)) {
          wrongSuit = s;
          wrongVal = v;
          break;
        }
      }
    }
    const sub = submitOrEditGuess(g, user.id, target.id, wrongSuit, wrongVal);
    g = sub.state;

    // Resolve Round 1
    const resolved = resolveRoundGuesses(g);
    const userInNextRound = resolved.players.find((p) => p.id === user.id)!;

    const passed =
      userInNextRound.hanumanExtraGuessAvailable === true &&
      userInNextRound.hanumanLeapTriggered === true;

    results.push({
      id: 12,
      name: "Hanuman's Leap: Automatic Extra Guess In Following Round",
      passed,
      details: passed
        ? 'Verified: After resolving an incorrect guess, player was granted an extra guess for the following round.'
        : `Failed: extraGuess=${userInNextRound.hanumanExtraGuessAvailable}, triggered=${userInNextRound.hanumanLeapTriggered}`,
    });
  } catch (err: any) {
    results.push({ id: 12, name: "Hanuman's Leap", passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 13: Angad's correct and incorrect Gambits score +3 and −3
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const angad = g.players[0];
    angad.characterId = 'Angad';
    angad.angadGambitsUsed = 0;
    angad.angadGambitScore = 0;

    // Target a non-partner player
    const nonPartner = g.players.find((p) => p.id !== angad.id && p.id !== angad.secretPartnerId)!;
    const correctCard = nonPartner.cards[0];

    // 1. Submit correct gambit
    let sub1 = submitOrEditGuess(g, angad.id, nonPartner.id, correctCard.suit, correctCard.value, true);
    let resolved1 = resolveRoundGuesses(sub1.state);
    const angadR1 = resolved1.players.find((p) => p.id === angad.id)!;
    const correctBonus = angadR1.angadGambitScore; // should be +3

    // 2. Submit incorrect gambit in next round
    const wrongSuit: Suit = nonPartner.cards[1].suit === 'Hearts' ? 'Spades' : 'Hearts';
    let sub2 = submitOrEditGuess(resolved1, angad.id, nonPartner.id, wrongSuit, 8, true);
    let resolved2 = resolveRoundGuesses(sub2.state);
    const angadR2 = resolved2.players.find((p) => p.id === angad.id)!;
    const netBonus = angadR2.angadGambitScore; // (+3) + (-3) = 0

    const passed = correctBonus === 3 && netBonus === 0 && angadR2.angadGambitsUsed === 2;

    results.push({
      id: 13,
      name: "Angad Gambits: Correct (+3) and Incorrect (−3)",
      passed,
      details: passed
        ? 'Verified: Correct Gambit awarded +3 points; subsequent Incorrect Gambit deducted 3 points (net 0).'
        : `Gambit scoring mismatch: correct=${correctBonus}, net=${netBonus}, used=${angadR2.angadGambitsUsed}`,
    });
  } catch (err: any) {
    results.push({ id: 13, name: 'Angad Gambits', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 14: New question types return correct answers
  // -------------------------------------------------------------
  try {
    // Test cards: Card 1: Hearts 3 (odd, red), Card 2: Diamonds 5 (odd, red)
    const testCards: [PlayingCard, PlayingCard] = [
      { id: 'Hearts_3', suit: 'Hearts', value: 3, isRevealed: false },
      { id: 'Diamonds_5', suit: 'Diamonds', value: 5, isRevealed: false },
    ];

    // Higher card suit: higher is 5 (Diamonds)
    const qHigher = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'suit_position', cardPosition: 'higher', suitQuery: 'Diamonds' },
      testCards
    );
    const qLower = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'suit_position', cardPosition: 'lower', suitQuery: 'Hearts' },
      testCards
    );

    // Toggles
    const qSameColor = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'toggle', toggleType: 'Both cards are the same colour' },
      testCards
    );
    const qSumOdd = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'toggle', toggleType: 'Sum of both cards is odd' },
      testCards
    ); // 3+5=8 (even) -> should be false
    const qSumEven = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'toggle', toggleType: 'Sum of both cards is even' },
      testCards
    ); // true
    const qBothOdd = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'toggle', toggleType: 'Both cards are odd' },
      testCards
    ); // 3 and 5 are odd -> true
    const qBothEven = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'toggle', toggleType: 'Both cards are even' },
      testCards
    ); // false

    // Equal value edge-case for suit position: either card counts as higher or lower
    const equalCards: [PlayingCard, PlayingCard] = [
      { id: 'Clubs_4', suit: 'Clubs', value: 4, isRevealed: false },
      { id: 'Spades_4', suit: 'Spades', value: 4, isRevealed: false },
    ];
    const qEqualHigherClubs = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'suit_position', cardPosition: 'higher', suitQuery: 'Clubs' },
      equalCards
    ); // true
    const qEqualHigherSpades = evaluateQuestion(
      { askerId: 'p1', targetId: 'p2', isPublic: true, kind: 'suit_position', cardPosition: 'higher', suitQuery: 'Spades' },
      equalCards
    ); // true

    const passed =
      qHigher.result === true &&
      qLower.result === true &&
      qSameColor.result === true &&
      qSumOdd.result === false &&
      qSumEven.result === true &&
      qBothOdd.result === true &&
      qBothEven.result === false &&
      qEqualHigherClubs.result === true &&
      qEqualHigherSpades.result === true;

    results.push({
      id: 14,
      name: 'New Question Types & Equal Value Position Handling',
      passed,
      details: passed
        ? 'Verified: Higher/lower suit questions, equal value rule, and all 5 new toggle questions evaluate accurately.'
        : 'Discrepancy in question evaluation answers.',
    });
  } catch (err: any) {
    results.push({ id: 14, name: 'New Question Types', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 15: Invalid numeric ranges are blocked before token deduction
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const p1 = g.players[0];
    const initialTokens = p1.questionTokens;

    // Test invalid Sum: 1 (min is 2)
    const inv1 = askQuestion(g, {
      askerId: p1.id,
      targetId: g.players[1].id,
      isPublic: true,
      kind: 'numeric',
      numericMetric: 'Sum',
      comparator: '=',
      numericValue: 1, // Invalid!
    });

    // Test invalid Sum: 17 (max is 16)
    const inv2 = askQuestion(g, {
      askerId: p1.id,
      targetId: g.players[1].id,
      isPublic: true,
      kind: 'numeric',
      numericMetric: 'Sum',
      comparator: '=',
      numericValue: 17, // Invalid!
    });

    // Test invalid Product: 65 (max is 64)
    const inv3 = askQuestion(g, {
      askerId: p1.id,
      targetId: g.players[1].id,
      isPublic: true,
      kind: 'numeric',
      numericMetric: 'Product',
      comparator: '>',
      numericValue: 65, // Invalid!
    });

    const passed =
      !inv1.success &&
      !inv2.success &&
      !inv3.success &&
      inv1.state.players[0].questionTokens === initialTokens;

    results.push({
      id: 15,
      name: 'Numerical Range Validation & Token Protection',
      passed,
      details: passed
        ? 'Verified: Numbers outside allowed ranges were blocked and Question Tokens remained intact.'
        : 'Out-of-range questions were not rejected or tokens were improperly deducted.',
    });
  } catch (err: any) {
    results.push({ id: 15, name: 'Range Validation', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 16: Kumbhakarna's accumulated bonus is revealed at round end
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    // Assign Kumbhakarna to player 2
    g.players[1].characterId = 'Kumbhakarna';
    g.players[1].kumbhakarnaTotalBonus = 0;
    const kumbh = g.players[1];

    // Submit two incorrect guesses against Kumbhakarna from other players
    const wrongSuit1: Suit = kumbh.cards[0].suit === 'Hearts' ? 'Clubs' : 'Hearts';
    const subA = submitOrEditGuess(g, g.players[2].id, kumbh.id, wrongSuit1, 8);
    g = subA.state;
    const subB = submitOrEditGuess(g, g.players[3].id, kumbh.id, wrongSuit1, 7);
    g = subB.state;

    const resolved = resolveRoundGuesses(g);
    const kumbhAfter = resolved.players.find((p) => p.id === kumbh.id)!;

    const roundAnnounce = resolved.kumbhakarnaAnnouncements.find((a) => a.round === 1);
    const passed =
      kumbhAfter.kumbhakarnaRoundBonus === 4 &&
      kumbhAfter.kumbhakarnaTotalBonus === 4 &&
      !!roundAnnounce;

    results.push({
      id: 16,
      name: 'Kumbhakarna: Slumber Bonus (+2 per miss) Revealed at Round End',
      passed,
      details: passed
        ? `Verified: Earned +4 from 2 incorrect guesses against them, revealed in round summary: "${roundAnnounce?.message}"`
        : `Kumbhakarna bonus mismatch: round=${kumbhAfter.kumbhakarnaRoundBonus}, total=${kumbhAfter.kumbhakarnaTotalBonus}`,
    });
  } catch (err: any) {
    results.push({ id: 16, name: 'Kumbhakarna Bonus', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 17: Sugriva's shared-guess bonus has a maximum of +6
  // -------------------------------------------------------------
  try {
    const sugrivaPlayer: any = {
      id: 'p1',
      characterId: 'Sugriva',
      correctGuesses: [],
      cards: [],
      secretPartnerId: 'p2',
    };

    const count0 = evaluateCharacterObjective(sugrivaPlayer, [], 0);
    const count2 = evaluateCharacterObjective(sugrivaPlayer, [], 2);
    const count3 = evaluateCharacterObjective(sugrivaPlayer, [], 3);
    const count5 = evaluateCharacterObjective(sugrivaPlayer, [], 5);

    const passed =
      count0.points === 0 &&
      count2.points === 4 &&
      count3.points === 6 &&
      count5.points === 6; // capped at +6

    results.push({
      id: 17,
      name: 'Sugriva: Vanara Alliance Shared Guess Bonus (Capped at +6)',
      passed,
      details: passed
        ? 'Verified: Sugriva earns +2 per shared exact-card round, strictly capped at +6 (tested at 0, 2, 3, and 5 shared rounds).'
        : `Cap mismatch: count3=${count3.points}, count5=${count5.points}`,
    });
  } catch (err: any) {
    results.push({ id: 17, name: 'Sugriva Objective', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 18: Jambavan's suit bonus has a maximum of +8
  // -------------------------------------------------------------
  try {
    const jambavan: any = {
      id: 'p1',
      characterId: 'Jambavan',
      cards: [],
      secretPartnerId: 'p2',
      correctGuesses: [
        { suit: 'Hearts' as Suit, targetPlayerId: 'p3' },
        { suit: 'Diamonds' as Suit, targetPlayerId: 'p4' },
        { suit: 'Clubs' as Suit, targetPlayerId: 'p5' },
        { suit: 'Spades' as Suit, targetPlayerId: 'p6' },
        { suit: 'Hearts' as Suit, targetPlayerId: 'p7' }, // duplicate suit
      ],
    };

    const obj = evaluateCharacterObjective(jambavan, [], 0);
    const passed = obj.points === 8;

    results.push({
      id: 18,
      name: 'Jambavan: Wisdom of Ages Suit Diversity Bonus (Capped at +8)',
      passed,
      details: passed
        ? 'Verified: 4 distinct suits correctly guessed scored +8 (2 per suit, capped at +8).'
        : `Jambavan score mismatch: got ${obj.points}`,
    });
  } catch (err: any) {
    results.push({ id: 18, name: 'Jambavan Objective', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 19: All final scores are calculated correctly
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    // Set up a mock end state for p1 (Rama)
    const p1 = g.players[0];
    const partner = g.players.find((p) => p.id === p1.secretPartnerId)!;
    p1.characterId = 'Rama';
    const nonPartner = g.players.find((p) => p.id !== p1.id && p.id !== p1.secretPartnerId)!;
    nonPartner.characterId = 'Ravana';
    const ravana = nonPartner;

    p1.questionTokens = 2; // +2 pts
    p1.publicQuestionsAsked = 3; // +3 pts
    p1.bonusTokensBought = 1; // -3 pts
    p1.angadGambitScore = 0;

    // Correct guess on Ravana: +8 objective points
    p1.correctGuesses = [
      {
        targetPlayerId: ravana.id,
        cardId: 'Hearts_2',
        suit: 'Hearts',
        value: 2,
        round: 1,
      },
    ];

    // Survival:
    // p1 has both cards unrevealed: +5 pts
    p1.cards[0].isRevealed = false;
    p1.cards[1].isRevealed = false;
    // partner has 1 unrevealed: +2 pts
    partner.cards[0].isRevealed = false;
    partner.cards[1].isRevealed = true;

    // Base guess points map: p1 has 10 base guess points from R1
    const baseMap = { [p1.id]: 10 };

    const breakdowns = computeFinalScores(g.players, 0, baseMap);
    const p1Breakdown = breakdowns.find((b) => b.playerId === p1.id)!;

    // Calculation:
    // Base guess: 10
    // Public questions: 3
    // Bonus tokens: -3
    // Running score: 10 + 3 - 3 = 10
    // Own survival: 5
    // Partner survival: 2
    // Unused tokens: 2
    // Rama objective: 8
    // Total: 10 + 5 + 2 + 2 + 8 = 27
    const expectedTotal = 27;
    const passed =
      p1Breakdown.runningScore === 10 &&
      p1Breakdown.ownSurvivalPoints === 5 &&
      p1Breakdown.partnerSurvivalPoints === 2 &&
      p1Breakdown.unusedTokenPoints === 2 &&
      p1Breakdown.characterObjectivePoints === 8 &&
      p1Breakdown.totalScore === expectedTotal;

    results.push({
      id: 19,
      name: 'Comprehensive Final Score Calculation',
      passed,
      details: passed
        ? `Verified: Calculated total score of ${p1Breakdown.totalScore} matching exact breakdown (Base: 10, Running: 10, Own: 5, Partner: 2, Tokens: 2, Objective: 8).`
        : `Final score mismatch: expected ${expectedTotal}, got ${p1Breakdown.totalScore}`,
    });
  } catch (err: any) {
    results.push({ id: 19, name: 'Final Score Calculation', passed: false, details: err.message });
  }

  // -------------------------------------------------------------
  // Test 20: Max 2 normal questions per player; 3rd requires Bonus Token
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const asker = g.players[0];
    const targetA = g.players[1];
    const targetB = g.players[2];

    // Initial state: 10 normal question tokens, 0 bonus tokens
    const initialNormal = asker.normalQuestionTokens;
    const initialBonus = asker.bonusTokensAvailable;

    // Question 1 to Target A (should succeed, normal: 9, used on A: 1)
    const q1 = askQuestion(g, {
      askerId: asker.id,
      targetId: targetA.id,
      isPublic: true,
      kind: 'toggle',
      toggleType: 'Both cards are the same colour',
    });
    g = q1.state;
    const pAfterQ1 = g.players.find((p) => p.id === asker.id)!;

    // Question 2 to Target A (should succeed, normal: 8, used on A: 2)
    const q2 = askQuestion(g, {
      askerId: asker.id,
      targetId: targetA.id,
      isPublic: true,
      kind: 'toggle',
      toggleType: 'Both cards are the same colour',
    });
    g = q2.state;
    const pAfterQ2 = g.players.find((p) => p.id === asker.id)!;

    // Question 3 to Target A WITHOUT bonus token (should FAIL)
    const q3Fail = askQuestion(g, {
      askerId: asker.id,
      targetId: targetA.id,
      isPublic: true,
      kind: 'toggle',
      toggleType: 'Both cards are the same colour',
    });

    // Question to Target B (has 0 questions so far, should SUCCEED)
    const qTargetB = askQuestion(g, {
      askerId: asker.id,
      targetId: targetB.id,
      isPublic: true,
      kind: 'toggle',
      toggleType: 'Both cards are the same colour',
    });
    g = qTargetB.state;

    // Now give asker a Bonus Token (e.g. via bonusTokensAvailable = 1, or Sanjeevani)
    g = {
      ...g,
      players: g.players.map((p) =>
        p.id === asker.id
          ? { ...p, bonusTokensAvailable: 1, questionTokens: p.normalQuestionTokens + 1 }
          : p
      ),
    };

    // Question 3 to Target A WITH bonus token (should SUCCEED and consume bonus token)
    const q3Success = askQuestion(g, {
      askerId: asker.id,
      targetId: targetA.id,
      isPublic: true,
      kind: 'toggle',
      toggleType: 'Both cards are the same colour',
    });
    g = q3Success.state;
    const pAfterBonusQ = g.players.find((p) => p.id === asker.id)!;

    const test20Passed =
      initialNormal === 10 &&
      initialBonus === 0 &&
      q1.success &&
      pAfterQ1.normalQuestionTokens === 9 &&
      pAfterQ1.baseQuestionsUsed[targetA.id] === 1 &&
      q2.success &&
      pAfterQ2.normalQuestionTokens === 8 &&
      pAfterQ2.baseQuestionsUsed[targetA.id] === 2 &&
      !q3Fail.success &&
      (q3Fail.error || '').includes('Maximum 2 normal questions') &&
      qTargetB.success &&
      q3Success.success &&
      pAfterBonusQ.bonusTokensAvailable === 0 &&
      pAfterBonusQ.baseQuestionsUsed[targetA.id] === 2; // normal count didn't increase past 2

    results.push({
      id: 20,
      name: 'Normal Question Limit (Max 2 per Target) and Bonus Token Requirement',
      passed: test20Passed,
      details: test20Passed
        ? 'Verified: 1st & 2nd normal questions to target succeeded; 3rd question without bonus token was correctly rejected; question to fresh target succeeded; 3rd question to original target succeeded once bonus token was available.'
        : `Test 20 failed: q1=${q1.success}, q2=${q2.success}, q3Blocked=${!q3Fail.success}, qB=${qTargetB.success}, q3WithBonus=${q3Success.success}`,
    });
  } catch (err: any) {
    results.push({
      id: 20,
      name: 'Normal Question Limit (Max 2 per Target) and Bonus Token Requirement',
      passed: false,
      details: err.message,
    });
  }

  // -------------------------------------------------------------
  // Test 21: Deduction Card Tag Setting & Power Secrecy From Other Players
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const p1 = g.players[0];
    const p2 = g.players[1];

    // 1. Test setCardTag directly assigning player & mode
    g = setCardTag(g, p1.id, 'Hearts_7', { player: p2.name, mode: 'suspect' });
    const tag1 = g.players.find((p) => p.id === p1.id)?.cardTags?.['Hearts_7'];

    g = setCardTag(g, p1.id, 'Hearts_7', { player: p2.name, mode: 'not' });
    const tag2 = g.players.find((p) => p.id === p1.id)?.cardTags?.['Hearts_7'];

    g = setCardTag(g, p1.id, 'Hearts_7', null);
    const tag3 = g.players.find((p) => p.id === p1.id)?.cardTags?.['Hearts_7'];

    // 2. Test Power secrecy: Sanjeevani and Lakshman Rekha logs are private to user, not public to other players
    p1.powerId = 'Sanjeevani';
    p1.powerUsed = false;
    const sanjRes = activatePower(g, p1.id);
    const sanjLogs = sanjRes.state.gameLogs.filter((l) => l.type === 'power' && !l.isPrivateTo);

    p2.powerId = 'Lakshman Rekha';
    p2.powerUsed = false;
    const lakRes = activatePower(sanjRes.state, p2.id);
    const lakPublicLogs = lakRes.state.gameLogs.filter(
      (l) => l.type === 'power' && !l.isPrivateTo
    );

    const test21Passed =
      tag1?.player === p2.name &&
      tag1?.mode === 'suspect' &&
      tag2?.mode === 'not' &&
      tag3 === undefined &&
      sanjLogs.length === 0 &&
      lakPublicLogs.length === 0;

    results.push({
      id: 21,
      name: 'Deduction Card Tag Assignment & Power Privacy (Hidden from Other Players)',
      passed: test21Passed,
      details: test21Passed
        ? 'Verified: Card tag directly assigns player and suspect/not mode via list, clears cleanly, and power activation logs remain strictly private without public broadcasting.'
        : `Test 21 failed: tag1=${JSON.stringify(tag1)}, tag2=${JSON.stringify(tag2)}, tag3=${tag3}, sanjLogs=${sanjLogs.length}, lakLogs=${lakPublicLogs.length}`,
    });
  } catch (err: any) {
    results.push({
      id: 21,
      name: 'Deduction Card Tag Assignment & Power Privacy (Hidden from Other Players)',
      passed: false,
      details: err.message,
    });
  }

  // -------------------------------------------------------------
  // Test 22: Ten Heads 3-Player Question for 1 Token & Consumption
  // -------------------------------------------------------------
  try {
    let g = createInitialGame();
    const user = g.players[0];
    user.powerId = 'Ten Heads';
    user.powerUsed = false;
    user.powerDisabled = false;
    const initialTokens = user.questionTokens;

    // 1. Activate power in modal
    const actRes = activatePower(g, user.id);
    const userAfterAct = actRes.state.players.find((p) => p.id === user.id)!;
    const armedCorrectly = userAfterAct.tenHeadsArmed === true && userAfterAct.powerUsed === false;

    // 2. Ask question to 3 targets (p1=target, p2 & p3 = secondary targets)
    const t1 = g.players[1].id;
    const t2 = g.players[2].id;
    const t3 = g.players[3].id;

    const qRes = askQuestion(actRes.state, {
      askerId: user.id,
      targetId: t1,
      secondaryTargetIds: [t2, t3],
      isPublic: false,
      kind: 'numeric',
      numericMetric: 'Sum',
      comparator: '>=',
      numericValue: 10,
    });

    const userAfterQuestion = qRes.state.players.find((p) => p.id === user.id)!;
    const tokensSpent = initialTokens - userAfterQuestion.questionTokens;
    const powerNowSpent = userAfterQuestion.powerUsed === true;
    const secondaryLogs = qRes.state.questionLogs.filter((l) => l.askerId === user.id);
    const hasThreeLogs = secondaryLogs.length >= 3;

    const passed =
      actRes.success &&
      armedCorrectly &&
      qRes.success &&
      tokensSpent === 1 &&
      powerNowSpent &&
      hasThreeLogs;

    results.push({
      id: 22,
      name: 'Ten Heads: 3 Opponents Queried for 1 Token & Power Expended on Question',
      passed,
      details: passed
        ? 'Verified: Ten Heads remained available upon activation, queried 3 opponents for only 1 token, produced 3 private evaluations, and marked powerUsed only upon question completion.'
        : `Test 22 failed: armed=${armedCorrectly}, success=${qRes.success}, tokensSpent=${tokensSpent}, powerSpent=${powerNowSpent}, logs=${secondaryLogs.length}`,
    });
  } catch (err: any) {
    results.push({
      id: 22,
      name: 'Ten Heads: 3 Opponents Queried for 1 Token & Power Expended on Question',
      passed: false,
      details: err.message,
    });
  }

  // -------------------------------------------------------------
  // Test 23: 6-Player Mode (24 Cards, 5/3/2 Reveals, 30/20/10/10 Timers, 3 Partner Bonds)
  // -------------------------------------------------------------
  try {
    const g6 = createInitialGame({ playerCount: 6 });
    const playerCountCorrect = g6.players.length === 6 && g6.playerCount === 6;
    const centralCountCorrect = g6.centralCards.length === 12;
    const allCardsInGame = [
      ...g6.players.flatMap((p) => p.cards),
      ...g6.centralCards,
    ];
    const totalCardsCount = allCardsInGame.length === 24;
    const maxValCorrect = allCardsInGame.every((c) => c.value >= 1 && c.value <= 6);
    const r1Revealed = g6.centralCards.filter((c) => c.isRevealed).length === 5;
    const r1Timer = g6.roundTimeRemainingSeconds === 1800; // 30m

    // Advance to round 2
    const g6_r2 = advanceToNextRound(g6);
    const r2Revealed = g6_r2.centralCards.filter((c) => c.isRevealed).length === 8; // 5 + 3
    const r2Timer = g6_r2.roundTimeRemainingSeconds === 1200; // 20m
    const r2TimerAutoStarted = g6_r2.isTimerRunning === true;

    // Advance to round 3
    const g6_r3 = advanceToNextRound(g6_r2);
    const r3Revealed = g6_r3.centralCards.filter((c) => c.isRevealed).length === 10; // 8 + 2
    const r3Timer = g6_r3.roundTimeRemainingSeconds === 600; // 10m

    // Advance to round 4
    const g6_r4 = advanceToNextRound(g6_r3);
    const r4HiddenRemaining = g6_r4.centralCards.filter((c) => !c.isRevealed).length === 2; // exactly 2 face-down

    // Bonded pairs check
    const partnerPairsCount = new Set(
      g6.players.map((p) => [p.id, p.secretPartnerId].sort().join('-'))
    ).size;
    const partnerPairsCorrect = partnerPairsCount === 3;

    const passed23 =
      playerCountCorrect &&
      centralCountCorrect &&
      totalCardsCount &&
      maxValCorrect &&
      r1Revealed &&
      r1Timer &&
      r2Revealed &&
      r2Timer &&
      r2TimerAutoStarted &&
      r3Revealed &&
      r3Timer &&
      r4HiddenRemaining &&
      partnerPairsCorrect;

    results.push({
      id: 23,
      name: '6-Player Format: 24 Cards (1-6), 5/3/2 Reveals, 30/20/10/10 Timers & 3 Partner Pairs',
      passed: passed23,
      details: passed23
        ? 'Verified: 6-player match creates 24 cards (values 1–6), 12 player cards, 12 table cards, reveals 5 in R1 (30m), 3 in R2 (20m, auto-start), 2 in R3 (10m), leaves 2 face-down in R4, and establishes 3 reciprocal secret partner bonds.'
        : `Test 23 failed: playerCount=${playerCountCorrect}, central=${centralCountCorrect}, totalCards=${totalCardsCount}, maxVal=${maxValCorrect}, r1=${r1Revealed}/${r1Timer}, r2=${r2Revealed}/${r2Timer}/${r2TimerAutoStarted}, r3=${r3Revealed}/${r3Timer}, r4Hidden=${r4HiddenRemaining}, partnerPairs=${partnerPairsCount}`,
    });
  } catch (err: any) {
    results.push({
      id: 23,
      name: '6-Player Format: 24 Cards (1-6), 5/3/2 Reveals, 30/20/10/10 Timers & 3 Partner Pairs',
      passed: false,
      details: err.message,
    });
  }

  // -------------------------------------------------------------
  // Test 24: Curator Custom Setup (Character & Power Overrides)
  // -------------------------------------------------------------
  try {
    const customChars: CharacterId[] = ['Rama', 'Ravana', 'Lakshmana', 'Sita', 'Hanuman', 'Angad'];
    const customPowers: PowerId[] = ['Divine Sight', 'Nagpash', 'Lakshman Rekha', 'Sanjeevani', 'Ten Heads', 'Sudarshan Chakra'];

    const gCurator = createInitialGame({
      playerCount: 6,
      characterOverride: customChars,
      powerOverride: customPowers,
    });

    const charsMatch = gCurator.players.every((p) => customChars.includes(p.characterId));
    const powersMatch = gCurator.players.every((p) => customPowers.includes(p.powerId));

    const passed24 = charsMatch && powersMatch;

    results.push({
      id: 24,
      name: 'Curator Custom Setup: Explicit Character & Power Overrides Assigned',
      passed: passed24,
      details: passed24
        ? 'Verified: Host-selected character roster and power pool are accurately applied to seated players in the game engine.'
        : `Test 24 failed: charsMatch=${charsMatch}, powersMatch=${powersMatch}`,
    });
  } catch (err: any) {
    results.push({
      id: 24,
      name: 'Curator Custom Setup: Explicit Character & Power Overrides Assigned',
      passed: false,
      details: err.message,
    });
  }

  return results;
}

