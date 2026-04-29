// frontend/src/utils/equity.js
import { MONTE_CARLO_TRIALS } from '../constants.js';

function rankValue(rank) {
  const map = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };
  return map[rank] || 0;
}

function evaluateFiveCards(cards) {
  if (!cards || cards.length < 5) return { rank: 10, kickers: [] };
  const ranks = cards.map(c => rankValue(c.rank)).sort((a,b)=>a-b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = isStraightFn(ranks);
  const rankCounts = getRankCounts(ranks);
  const counts = Object.values(rankCounts).sort((a,b)=>b-a);

  let rankType, kickers = [];

  if (isFlush && isStraight && ranks[4] === 14 && ranks[0] === 10) {
    rankType = 1; kickers = [14];
  } else if (isFlush && isStraight) {
    rankType = 2; kickers = [getStraightHigh(ranks)];
  } else if (counts[0] === 4) {
    rankType = 3;
    const fourRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 4));
    const kicker = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 1));
    kickers = [fourRank, kicker];
  } else if (counts[0] === 3 && counts[1] === 2) {
    rankType = 4;
    const threeRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 3));
    const pairRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 2));
    kickers = [threeRank, pairRank];
  } else if (isFlush) {
    rankType = 5; kickers = [...ranks].reverse();
  } else if (isStraight) {
    rankType = 6; kickers = [getStraightHigh(ranks)];
  } else if (counts[0] === 3) {
    rankType = 7;
    const threeRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 3));
    const otherRanks = ranks.filter(r => r !== threeRank).sort((a,b)=>b-a);
    kickers = [threeRank, ...otherRanks];
  } else if (counts[0] === 2 && counts[1] === 2) {
    rankType = 8;
    const pairs = Object.keys(rankCounts).filter(r => rankCounts[r] === 2).map(Number).sort((a,b)=>b-a);
    const kicker = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 1));
    kickers = [...pairs, kicker];
  } else if (counts[0] === 2) {
    rankType = 9;
    const pairRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 2));
    const otherRanks = ranks.filter(r => r !== pairRank).sort((a,b)=>b-a);
    kickers = [pairRank, ...otherRanks];
  } else {
    rankType = 10; kickers = [...ranks].reverse();
  }

  return { rank: rankType, kickers };
}

function getRankCounts(ranks) {
  const counts = {};
  for (let r of ranks) counts[r] = (counts[r] || 0) + 1;
  return counts;
}

function isStraightFn(ranks) {
  const unique = [...new Set(ranks)].sort((a,b)=>a-b);
  if (unique.length < 5) return false;
  for (let i = 0; i <= unique.length-5; i++) {
    if (unique[i+4] - unique[i] === 4) return true;
  }
  return unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5);
}

function getStraightHigh(ranks) {
  const unique = [...new Set(ranks)].sort((a,b)=>a-b);
  for (let i = unique.length-1; i >= 4; i--) {
    if (unique[i] - unique[i-4] === 4) return unique[i];
  }
  return 5;
}

function compareHands(h1, h2) {
  if (h1.rank !== h2.rank) return h2.rank - h1.rank;
  for (let i = 0; i < h1.kickers.length; i++) {
    if (h1.kickers[i] !== h2.kickers[i]) return h2.kickers[i] - h1.kickers[i];
  }
  return 0;
}

function getBestHand(cards) {
  if (!cards || cards.length < 5) return null;
  const combos = getCombinations(cards, 5);
  let best = null;
  for (const combo of combos) {
    const hand = evaluateFiveCards(combo);
    if (!best || compareHands(hand, best) > 0) best = hand;
  }
  return best;
}

function getCombinations(arr, k) {
  const result = [];
  const combine = (start, current) => {
    if (current.length === k) { result.push([...current]); return; }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      combine(i + 1, current);
      current.pop();
    }
  };
  combine(0, []);
  return result;
}

function buildDeckExcluding(...excludedCards) {
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck = [];
  for (let s of suits) {
    for (let r of ranks) {
      if (!excludedCards.some(c => c && c.rank === r && c.suit === s)) {
        deck.push({ rank: r, suit: s });
      }
    }
  }
  return deck;
}

function calculateExactEquity(holeCards, communityCards, knownOpponentHands) {
  if (!holeCards || holeCards.length < 2) return { win: 0, lose: 0, tie: 0 };
  const knownCards = [...holeCards, ...communityCards, ...knownOpponentHands.flat()];
  const remainingNeeded = 5 - communityCards.length;
  const deck = buildDeckExcluding(...knownCards);
  const combos = getCombinations(deck, remainingNeeded);

  let wins = 0, losses = 0, ties = 0;
  for (const remaining of combos) {
    const fullCommunity = [...communityCards, ...remaining];
    const myBest = getBestHand([...holeCards, ...fullCommunity]);
    if (!myBest) continue;
    let bestOpp = null;
    for (const oppHand of knownOpponentHands) {
      const oppBest = getBestHand([...oppHand, ...fullCommunity]);
      if (!oppBest) continue;
      if (!bestOpp || compareHands(oppBest, bestOpp) > 0) bestOpp = oppBest;
    }
    if (!bestOpp) continue;
    const cmp = compareHands(myBest, bestOpp);
    if (cmp > 0) wins++;
    else if (cmp === 0) ties++;
    else losses++;
  }
  const total = wins + losses + ties;
  return total ? { win: wins/total, lose: losses/total, tie: ties/total } : { win: 0, lose: 0, tie: 0 };
}

function calculateMonteCarloEquity(holeCards, communityCards, opponents) {
  if (!holeCards || holeCards.length < 2) return { win: 0, lose: 0, tie: 0 };
  const excluded = [...holeCards, ...communityCards];
  const deck = buildDeckExcluding(...excluded);
  let wins = 0, losses = 0, ties = 0;

  for (let t = 0; t < MONTE_CARLO_TRIALS; t++) {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    const remainingNeeded = 5 - communityCards.length;
    const simCommunity = [...communityCards, ...shuffled.slice(0, remainingNeeded)];
    const myBest = getBestHand([...holeCards, ...simCommunity]);
    if (!myBest) continue;
    let allWorse = true, tieFlag = false;
    let offset = remainingNeeded;
    for (let o = 0; o < opponents; o++) {
      const oppHand = [shuffled[offset], shuffled[offset+1]];
      offset += 2;
      const oppBest = getBestHand([...oppHand, ...simCommunity]);
      if (!oppBest) continue;
      const cmp = compareHands(myBest, oppBest);
      if (cmp === 0) { tieFlag = true; allWorse = false; }
      else if (cmp > 0) allWorse = false;
    }
    if (tieFlag) ties++;
    else if (!allWorse) wins++;
    else losses++;
  }
  const total = wins + losses + ties;
  return total ? { win: wins/total, lose: losses/total, tie: ties/total } : { win: 0, lose: 0, tie: 0 };
}

export function getBestHandName(holeCards, communityCards) {
  if (!holeCards || holeCards.length < 2) return '...';
  const allCards = [...holeCards, ...communityCards];
  const best = getBestHand(allCards);
  if (!best) return 'High Card';
  const names = {
    1:'Royal Flush',2:'Straight Flush',3:'Four of a Kind',4:'Full House',
    5:'Flush',6:'Straight',7:'Three of a Kind',8:'Two Pair',9:'One Pair',10:'High Card'
  };
  return names[best.rank] || 'High Card';
}

export function calculateEquity(holeCards, communityCards, opponents, knownOpponentHands = null) {
  if (!holeCards || holeCards.length < 2) return { win: 0, lose: 0, tie: 0 };
  if (knownOpponentHands && knownOpponentHands.length > 0) {
    return calculateExactEquity(holeCards, communityCards, knownOpponentHands);
  }
  return calculateMonteCarloEquity(holeCards, communityCards, opponents);
}

export function getRelativeStrength(holeCards, communityCards, opponentHands) {
  if (!holeCards || holeCards.length < 2 || !opponentHands || opponentHands.length === 0) return null;
  const allCards = [...holeCards, ...communityCards];
  const myBest = getBestHand(allCards);
  if (!myBest) return null;
  let weaker = 0;
  let total = 0;
  for (const oppHand of opponentHands) {
    if (!oppHand || oppHand.length < 2) continue;
    const oppCards = [...oppHand, ...communityCards];
    const oppBest = getBestHand(oppCards);
    if (!oppBest) continue;
    total++;
    if (compareHands(myBest, oppBest) > 0) weaker++;
    else if (compareHands(myBest, oppBest) === 0) weaker += 0.5;
  }
  if (total === 0) return null;
  return Math.round((weaker / total) * 100);
}