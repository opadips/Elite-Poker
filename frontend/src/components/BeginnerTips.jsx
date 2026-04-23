import React, { useEffect, useState } from 'react';

export default function BeginnerTips({ holeCards, communityCards, round, playerName, pot, toCall }) {
  const [tip, setTip] = useState('');

  useEffect(() => {
    if (!holeCards || holeCards.length === 0) {
      setTip('کارت‌های خود را بررسی کنید.');
      return;
    }

    let message = '';
    const ranks = holeCards.map(c => c.rank);
    const suited = holeCards[0].suit === holeCards[1].suit;

    if (round === 'preflop') {
      if (ranks[0] === ranks[1]) message = '📌 شما یک جفت دارید. قوی است!';
      else if (suited && (ranks.includes('A') || ranks.includes('K'))) message = '🔥 کارت‌های هم‌رنگ بالا، شانس فلاش دارید.';
      else if (ranks.includes('A') && ranks.includes('K')) message = '💪 AK دست بسیار قوی، حتماً بریزید.';
      else if (ranks.includes('A')) message = '🃏 تک آس، ارزش دیدن فلاپ را دارد.';
      else message = '⚠️ دست ضعیف، فقط در موقعیت خوب بازی کنید.';
    } 
    else {
      // بررسی دست ساخته شده روی فلاپ/ترن/ریور
      const allCards = [...holeCards, ...communityCards];
      const rankCounts = {};
      const suitCounts = {};
      for (let c of allCards) {
        rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
        suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
      }
      const maxRankCount = Math.max(...Object.values(rankCounts), 0);
      const maxSuitCount = Math.max(...Object.values(suitCounts), 0);
      let handDesc = '';
      if (maxRankCount === 4) handDesc = 'چهارتایی!!! 🔥';
      else if (maxRankCount === 3) handDesc = 'ست (سه‌تایی) ✅';
      else if (maxRankCount === 2) {
        const pairs = Object.values(rankCounts).filter(v => v === 2).length;
        handDesc = pairs === 2 ? 'دو جفت 🟢' : 'یک جفت 🟡';
      } else handDesc = 'کارت بلند 🟠';
      
      let drawDesc = '';
      if (maxSuitCount >= 4) drawDesc = '✨ فلاش دراو دارید!';
      // بررسی ساده استریت
      const rankMap = { 'J':11,'Q':12,'K':13,'A':14 };
      const numericRanks = [...new Set(allCards.map(c => rankMap[c.rank] || parseInt(c.rank)))].sort((a,b)=>a-b);
      let straightDraw = false;
      for (let i = 0; i <= numericRanks.length-4; i++) {
        if (numericRanks[i+3] - numericRanks[i] === 3) straightDraw = true;
      }
      if (straightDraw) drawDesc += (drawDesc ? ' و ' : '') + '🌟 استریت دراو دارید!';
      
      message = `دست فعلی: ${handDesc}. ${drawDesc}`;
    }

    // نکته اضافه بر اساس پات
    const potOdds = toCall > 0 ? (toCall / pot * 100).toFixed(0) : 0;
    if (toCall > 0 && potOdds < 30) {
      message += ` شانس پات خوب (${potOdds}٪ از پات)، ارزش کال دارد.`;
    } else if (toCall > 0) {
      message += ` مبلغ کال زیاد (${potOdds}٪ از پات)، فقط با دست قوی کال کنید.`;
    }

    setTip(message);
  }, [holeCards, communityCards, round, pot, toCall]);

  return (
    <div className="fixed bottom-24 left-4 z-20 bg-black/80 backdrop-blur-md rounded-xl p-3 shadow-2xl border border-green-500/50 w-72 text-white text-sm">
      <div className="text-green-400 font-bold text-center border-b border-green-700 pb-1 mb-2">🐣 نکته نوب سگم</div>
      <div className="text-xs leading-relaxed">{tip}</div>
    </div>
  );
}