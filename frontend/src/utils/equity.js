import { MONTE_CARLO_TRIALS } from '../constants.js';

function rankValue(rank) {
  const map = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };
  return map[rank];
}

function evaluateHand(cards) {
  const ranks = cards.map(c => rankValue(c.rank)).sort((a,b)=>a-b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
  const countValues = Object.values(counts).sort((a,b)=>b-a);
  
  if (isFlush && isStraight && ranks[4] === 14 && ranks[0] === 10) return 1;
  if (isFlush && isStraight) return 2;
  if (countValues[0] === 4) return 3;
  if (countValues[0] === 3 && countValues[1] === 2) return 4;
  if (isFlush) return 5;
  if (isStraight) return 6;
  if (countValues[0] === 3) return 7;
  if (countValues[0] === 2 && countValues[1] === 2) return 8;
  if (countValues[0] === 2) return 9;
  return 10;
}

function checkStraight(ranks) {
  const unique = [...new Set(ranks)].sort((a,b)=>a-b);
  if (unique.length < 5) return false;
  for (let i = 0; i <= unique.length-5; i++) {
    if (unique[i+4] - unique[i] === 4) return true;
  }
  if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) return true;
  return false;
}

function getCombinations(arr, k) {
  const result = [];
  const combine = (start, current) => {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      combine(i + 1, current);
      current.pop();
    }
  };
  combine(0, []);
  return result;
}

function evaluateBestHand(cards) {
  const combos = getCombinations(cards, 5);
  let best = 999;
  for (const combo of combos) {
    const rank = evaluateHand(combo);
    if (rank < best) best = rank;
  }
  return best;
}

export function getBestHandName(holeCards, communityCards) {
  const allCards = [...holeCards, ...communityCards];
  const combos = getCombinations(allCards, 5);
  let bestRank = 999;
  let bestCombo = null;
  for (const combo of combos) {
    const rank = evaluateHand(combo);
    if (rank < bestRank) {
      bestRank = rank;
      bestCombo = combo;
    }
  }
  if (!bestCombo) return 'High Card';
  const names = {
    1: 'Royal Flush',
    2: 'Straight Flush',
    3: 'Four of a Kind',
    4: 'Full House',
    5: 'Flush',
    6: 'Straight',
    7: 'Three of a Kind',
    8: 'Two Pair',
    9: 'One Pair',
    10: 'High Card',
  };
  return names[bestRank] || 'High Card';
}

function buildDeckExcluding(...excludedCards) {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck = [];
  for (let s of suits) {
    for (let r of ranks) {
      if (!excludedCards.some(c => c.rank === r && c.suit === s)) {
        deck.push({ rank: r, suit: s });
      }
    }
  }
  return deck;
}

function calculateExactEquity(holeCards, communityCards, knownOpponentHands) {
  const knownCards = [...holeCards, ...communityCards, ...knownOpponentHands.flat()];
  const remainingCardsNeeded = 5 - communityCards.length;
  const deck = buildDeckExcluding(...knownCards);
  const combinations = getCombinations(deck, remainingCardsNeeded);

  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (const remaining of combinations) {
    const fullCommunity = [...communityCards, ...remaining];
    const playerBest = evaluateBestHand([...holeCards, ...fullCommunity]);
    let bestOpp = 999;
    for (const oppHand of knownOpponentHands) {
      const oppBest = evaluateBestHand([...oppHand, ...fullCommunity]);
      if (oppBest < bestOpp) bestOpp = oppBest;
    }
    if (playerBest < bestOpp) wins++;
    else if (playerBest === bestOpp) ties++;
    else losses++;
  }

  const total = wins + losses + ties;
  return { win: wins / total, lose: losses / total, tie: ties / total };
}

export function calculateEquity(holeCards, communityCards, opponents, knownOpponentHands = null) {
  if (knownOpponentHands && knownOpponentHands.length > 0) {
    return calculateExactEquity(holeCards, communityCards, knownOpponentHands);
  }
  const deck = [];
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  for (let s of suits) {
    for (let r of ranks) {
      const card = { rank: r, suit: s };
      if (!holeCards.some(c => c.rank === r && c.suit === s) &&
          !communityCards.some(c => c.rank === r && c.suit === s)) {
        deck.push(card);
      }
    }
  }

  let wins = 0;
  let losses = 0;
  let ties = 0;

  for (let t = 0; t < MONTE_CARLO_TRIALS; t++) {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    const remainingCommunity = 5 - communityCards.length;
    const simCommunity = [...communityCards, ...shuffled.slice(0, remainingCommunity)];
    const playerBest = evaluateBestHand([...holeCards, ...simCommunity]);
    let allOpponentsBetter = true;
    let tieDetected = false;

    let offset = remainingCommunity;
    for (let o = 0; o < opponents; o++) {
      const oppCards = [shuffled[offset], shuffled[offset+1]];
      offset += 2;
      const oppBest = evaluateBestHand([...oppCards, ...simCommunity]);
      if (oppBest === playerBest) {
        tieDetected = true;
        allOpponentsBetter = false;
      } else if (oppBest < playerBest) {
        allOpponentsBetter = false;
      }
    }

    if (tieDetected) ties++;
    else if (allOpponentsBetter) losses++;
    else wins++;
  }

  const total = wins + losses + ties;
  return { win: wins / total, lose: losses / total, tie: ties / total };
}