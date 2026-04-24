
const rankOrder = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const rankValue = (rank) => rankOrder.indexOf(rank) + 2;

function evaluateHand(cards) {
  if (cards.length < 5) return { score: 0 }; // 
  const ranks = cards.map(c => rankValue(c.rank)).sort((a,b)=>a-b);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = isStraightFn(ranks);
  const counts = {};
  ranks.forEach(r => counts[r] = (counts[r]||0)+1);
  const countVals = Object.values(counts).sort((a,b)=>b-a);
  
  let score = 0;
  if (isFlush && isStraight && ranks[4]===14 && ranks[0]===10) score = 9e15; // Royal Flush
  else if (isFlush && isStraight) score = 8e15 + getStraightHigh(ranks)*1e10;
  else if (countVals[0]===4) score = 7e15 + getFourRank(counts)*1e10 + getKickers(counts,1)[0]*1e5;
  else if (countVals[0]===3 && countVals[1]===2) score = 6e15 + getThreeRank(counts)*1e10 + getPairRank(counts,2)[0]*1e5;
  else if (isFlush) score = 5e15 + ranks[4]*1e12 + ranks[3]*1e8 + ranks[2]*1e4 + ranks[1]*100 + ranks[0];
  else if (isStraight) score = 4e15 + getStraightHigh(ranks)*1e10;
  else if (countVals[0]===3) score = 3e15 + getThreeRank(counts)*1e10 + getKickers(counts,1)[0]*1e5 + getKickers(counts,1)[1]*100;
  else if (countVals[0]===2 && countVals[1]===2) score = 2e15 + getPairRank(counts,2)[0]*1e10 + getPairRank(counts,2)[1]*1e8 + getKickers(counts,1)[0]*1e4;
  else if (countVals[0]===2) score = 1e15 + getPairRank(counts,2)[0]*1e10 + getKickers(counts,1)[0]*1e8 + getKickers(counts,1)[1]*1e6 + getKickers(counts,1)[2]*1e4;
  else score = ranks[4]*1e12 + ranks[3]*1e8 + ranks[2]*1e4 + ranks[1]*100 + ranks[0]*1;
  return { score };
}

function isStraightFn(ranks) {
  const unique = [...new Set(ranks)].sort((a,b)=>a-b);
  if (unique.length < 5) return false;
  for (let i=0; i<=unique.length-5; i++) if (unique[i+4]-unique[i]===4) return true;
  if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) return true;
  return false;
}
function getStraightHigh(ranks) {
  const unique = [...new Set(ranks)].sort((a,b)=>a-b);
  for (let i=unique.length-1; i>=4; i--) if (unique[i]-unique[i-4]===4) return unique[i];
  if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) return 5;
  return 0;
}
function getFourRank(c) { return +Object.keys(c).find(k=>c[k]===4); }
function getThreeRank(c) { return +Object.keys(c).find(k=>c[k]===3); }
function getPairRank(c, num) { return Object.keys(c).filter(k=>c[k]===2).map(Number).sort((a,b)=>b-a).slice(0,num); }
function getKickers(c, count) { return Object.keys(c).filter(k=>c[k]===count).map(Number).sort((a,b)=>b-a); }

function createDeck() {
  const suits = ['♠','♥','♦','♣'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck = [];
  for (let s of suits) for (let r of ranks) deck.push({ rank: r, suit: s });
  return deck;
}

export function calculateEquity(holeCards, communityCards, opponentsCount, trials = 2000) {
  if (!holeCards || holeCards.length < 2) return 0;
  const deck = createDeck();
  const knownCards = [...holeCards, ...communityCards];
  const remainingDeck = deck.filter(c => !knownCards.some(oc => oc.rank === c.rank && oc.suit === c.suit));
  let wins = 0;
  const commNeeded = 5 - communityCards.length;
  for (let i = 0; i < trials; i++) {
    const shuffled = shuffle([...remainingDeck]);
    let idx = 0;
    const simCommunity = [...communityCards, ...shuffled.slice(idx, idx + commNeeded)];
    idx += commNeeded;
    const myHand = evaluateBest([...holeCards, ...simCommunity]);
    const opponentHands = [];
    for (let o = 0; o < opponentsCount; o++) {
      const oppCards = [shuffled[idx], shuffled[idx+1]];
      idx += 2;
      opponentHands.push(evaluateBest([...oppCards, ...simCommunity]));
    }
    const myScore = myHand.score;
    const allScores = [myScore, ...opponentHands.map(h => h.score)];
    const maxScore = Math.max(...allScores);
    if (allScores[0] === maxScore) wins++;
  }
  return Math.round((wins / trials) * 100);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function evaluateBest(cards) {
  const combos = [];
  const combine = (start, chosen) => {
    if (chosen.length === 5) { combos.push(chosen.slice()); return; }
    for (let i = start; i < cards.length; i++) { chosen.push(cards[i]); combine(i+1, chosen); chosen.pop(); }
  };
  combine(0, []);
  let best = null;
  for (const combo of combos) {
    const hand = evaluateHand(combo);
    if (!best || hand.score > best.score) best = hand;
  }
  return best;
}