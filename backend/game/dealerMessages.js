const messages = {
  playerJoined: [
    (p) => `${p.name} graces us with their presence.`,
    (p) => `${p.name} slides in like they own the place.`,
    (p) => `Look who decided to show up — ${p.name}.`,
  ],
  playerLeft: [
    (p) => `${p.name} rage-quits the table. Just kidding... maybe.`,
    (p) => `${p.name} racks up and vanishes. Don't forget your chips!`,
    (p) => `And... ${p.name} is out. No refunds.`,
  ],
  playerKicked: [
    (p) => `${p.name} was kindly escorted out by the admin.`,
  ],
  lobbyCreated: [
    (p) => `${p.name} opens a new table. Fresh meat!`,
  ],
  gameStarted: [
    () => `Shuffle up and deal! Let's make some poor decisions.`,
    () => `Cards are in the air. May the odds be ever in your favour... or not.`,
  ],
  handComplete: [
    (p) => `${p.names} scoops ${p.winnings.toLocaleString()} chips with ${p.hand}. Beginner's luck?`,
    (p) => `${p.hand}! ${p.names} rakes in ${p.winnings.toLocaleString()}. Tell us how you did it.`,
    (p) => `With ${p.hand}, ${p.names} proves that fortune favours the brave.`,
  ],
  fold: [
    (p) => `${p.name} mucks like a pro.`,
    (p) => `${p.name} folds faster than a cheap suit.`,
    (p) => `${p.name} decides it's not worth the pain.`,
  ],
  check: [
    (p) => `${p.name} taps the felt. Living dangerously with a check.`,
  ],
  call: [
    (p) => `${p.name} calls ${p.amount.toLocaleString()}. That's the spirit!`,
    (p) => `${p.name} matches the bet. Good luck, you'll need it.`,
  ],
  raise: [
    (p) => `${p.name} raises to ${p.amount.toLocaleString()}. Big move, let's see if it pays off.`,
    (p) => `${p.name} puts ${p.amount.toLocaleString()} more on the line. Confidence or bluff?`,
  ],
  allin: [
    (p) => `${p.name} shoves all-in for ${p.amount.toLocaleString()}! All or nothing!`,
    (p) => `ALL IN! ${p.name} risks it all for ${p.amount.toLocaleString()}. Heart rate spiking.`,
  ],
  sideBetPlaced: [
    (p) => `${p.bettor} bets ${p.amount.toLocaleString()} on ${p.target}. Side action, the real gamble.`,
    (p) => `Side bet: ${p.bettor} thinks ${p.target} will win. We'll see.`,
  ],
  sideBetWin: [
    (p) => `Side bet cashes! ${p.bettor} pockets ${(p.amount + p.profit).toLocaleString()} on ${p.target}. Maybe they're psychic.`,
  ],
  sideBetRefund: [
    (p) => `${p.bettor}'s side bet of ${p.amount.toLocaleString()} is refunded — opponent chickened out.`,
  ],
  achievementEarned: [
    (p) => `🏆 ${p.player} earned "${p.name}" — ${p.desc}. Bragging rights activated.`,
  ],
  pause: [
    (p) => `${p.name} paused the game. Time for a snack break.`,
  ],
  resume: [
    (p) => `${p.name} resumes the action. Chop chop!`,
  ],
  reset: [
    (p) => `Table reset by ${p.name}. Everyone starts equal... again.`,
  ],
  sitIn: [
    (p) => `${p.name} buys in. Let's see if their wallet matches their mouth.`,
  ],
  communityFlop: [
    () => `Dealer spreads the flop. Three cards, endless possibilities.`,
  ],
  communityTurn: [
    () => `The turn burns and turns. Things are heating up.`,
  ],
  communityRiver: [
    () => `River! Last chance to cry.`,
  ],
};

export function getDealerMessage(event, params = {}) {
  const pool = messages[event];
  if (!pool || pool.length === 0) return null;
  const fn = pool[Math.floor(Math.random() * pool.length)];
  if (typeof fn !== 'function') return null;
  try {
    return fn(params);
  } catch (e) {
    return null;
  }
}