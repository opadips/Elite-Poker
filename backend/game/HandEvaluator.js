export class HandEvaluator {
  evaluate(hole, community) {
    const allCards = [...hole, ...community];
    const combinations = this.getCombinations(allCards, 5);
    let bestHand = null;
    for (const combo of combinations) {
      const hand = this.evaluateFiveCards(combo);
      if (!bestHand || this.compareHands(hand, bestHand) > 0) {
        bestHand = hand;
      }
    }
    return bestHand;
  }

  getCombinations(arr, k) {
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

  evaluateFiveCards(cards) {
    const ranks = cards.map(c => this.rankValue(c.rank)).sort((a, b) => a - b);
    const suits = cards.map(c => c.suit);
    const isFlush = suits.every(s => s === suits[0]);
    const isStraight = this.isStraight(ranks);
    const rankCounts = this.getRankCounts(ranks);
    const counts = Object.values(rankCounts).sort((a, b) => b - a);

    let rankType;
    let kickers = [];

    if (isFlush && isStraight && ranks[4] === 14 && ranks[0] === 10) {
      rankType = 1;
      kickers = [14];
    } else if (isFlush && isStraight) {
      rankType = 2;
      kickers = [this.getStraightHigh(ranks)];
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
      rankType = 5;
      kickers = [...ranks].reverse();
    } else if (isStraight) {
      rankType = 6;
      kickers = [this.getStraightHigh(ranks)];
    } else if (counts[0] === 3) {
      rankType = 7;
      const threeRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 3));
      const otherRanks = ranks.filter(r => r !== threeRank).sort((a, b) => b - a);
      kickers = [threeRank, ...otherRanks];
    } else if (counts[0] === 2 && counts[1] === 2) {
      rankType = 8;
      const pairs = Object.keys(rankCounts).filter(r => rankCounts[r] === 2).map(Number).sort((a, b) => b - a);
      const kicker = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 1));
      kickers = [...pairs, kicker];
    } else if (counts[0] === 2) {
      rankType = 9;
      const pairRank = parseInt(Object.keys(rankCounts).find(r => rankCounts[r] === 2));
      const otherRanks = ranks.filter(r => r !== pairRank).sort((a, b) => b - a);
      kickers = [pairRank, ...otherRanks];
    } else {
      rankType = 10;
      kickers = [...ranks].reverse();
    }

    const name = this.getHandName(rankType);
    return {
      rank: rankType,
      name: name,
      kickers: kickers,
      cmp: (other) => this.compareHands({ rank: rankType, kickers }, other)
    };
  }

  rankValue(rank) {
    const map = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
    return map[rank];
  }

  isStraight(ranks) {
    let unique = [...new Set(ranks)].sort((a, b) => a - b);
    if (unique.length < 5) return false;
    for (let i = 0; i <= unique.length - 5; i++) {
      if (unique[i + 4] - unique[i] === 4) return true;
    }
    if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) return true;
    return false;
  }

  getStraightHigh(ranks) {
    let unique = [...new Set(ranks)].sort((a, b) => a - b);
    for (let i = unique.length - 1; i >= 4; i--) {
      if (unique[i] - unique[i - 4] === 4) return unique[i];
    }
    if (unique.includes(14) && unique.includes(2) && unique.includes(3) && unique.includes(4) && unique.includes(5)) return 5;
    return 0;
  }

  getRankCounts(ranks) {
    const counts = {};
    for (let r of ranks) {
      counts[r] = (counts[r] || 0) + 1;
    }
    return counts;
  }

  compareHands(hand1, hand2) {
    if (hand1.rank !== hand2.rank) return hand2.rank - hand1.rank;
    for (let i = 0; i < hand1.kickers.length; i++) {
      if (hand1.kickers[i] !== hand2.kickers[i]) return hand2.kickers[i] - hand1.kickers[i];
    }
    return 0;
  }

  getHandName(rankType) {
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
      10: 'High Card'
    };
    return names[rankType];
  }
}