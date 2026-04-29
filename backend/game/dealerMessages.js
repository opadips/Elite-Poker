const messages = {
  playerJoined: [
    (p) => `${p.name} graces us with their presence.`,
    (p) => `${p.name} slides in like they own the place.`,
    (p) => `Look who decided to show up — ${p.name}.`,
    (p) => `A new challenger appears: ${p.name}.`,
    (p) => `${p.name} takes a seat. Let's see some cards.`,
    (p) => `${p.name} has entered the arena.`,
    (p) => `Oh great, another victim. Welcome, ${p.name}.`,
    (p) => `${p.name} joins. Someone's chip stack is about to shrink.`,
  ],
  playerLeft: [
    (p) => `${p.name} rage-quits the table. Just kidding... maybe.`,
    (p) => `${p.name} racks up and vanishes. Don't forget your chips!`,
    (p) => `And... ${p.name} is out. No refunds.`,
    (p) => `${p.name} had enough. Smart or scared?`,
    (p) => `${p.name} exits. The game continues without mercy.`,
    (p) => `${p.name} left. More chips for us.`,
    (p) => `Good riddance, ${p.name}. The table feels lighter.`,
    (p) => `${p.name} is gone. Saved themselves from further embarrassment.`,
  ],
  playerKicked: [
    (p) => `${p.name} was kindly escorted out by the admin.`,
    (p) => `Admin showed ${p.name} the door.`,
    (p) => `${p.name} got the boot. Table justice.`,
    (p) => `And it's curtains for ${p.name}.`,
  ],
  lobbyCreated: [
    (p) => `${p.name} opens a new table. Fresh meat!`,
    (p) => `A new arena is born. ${p.name} is the host.`,
    (p) => `Welcome to ${p.name}'s table. Good luck!`,
    (p) => `A new table for the hopeful. Let the misery begin.`,
    (p) => `${p.name} created a lobby. Let's see who complains first.`,
  ],
  gameStarted: [
    () => `Shuffle up and deal! Let's make some poor decisions.`,
    () => `Cards are in the air. May the odds be ever in your favour... or not.`,
    () => `The first hand begins. Nerves of steel required.`,
    () => `Dealer spreads the cards. Time to gamble.`,
    () => `Time to separate the fish from the bait.`,
    () => `Let the comedy of errors begin.`,
  ],
  handComplete: [
    (p) => `${p.names} scoops ${p.winnings.toLocaleString()} chips with ${p.hand}. Beginner's luck?`,
    (p) => `${p.hand}! ${p.names} rakes in ${p.winnings.toLocaleString()}. Tell us how you did it.`,
    (p) => `With ${p.hand}, ${p.names} proves that fortune favours the brave.`,
    (p) => `${p.names} drags the pot — ${p.winnings.toLocaleString()}. The rich get richer.`,
    (p) => `${p.hand} does the job. ${p.names} collects ${p.winnings.toLocaleString()}.`,
    (p) => `${p.names} wins ${p.winnings.toLocaleString()} with ${p.hand}. That's how it's done.`,
    (p) => `Boom! ${p.names} takes it down — ${p.hand} for ${p.winnings.toLocaleString()}.`,
    (p) => `Even a blind squirrel finds a nut sometimes. ${p.names} wins.`,
    (p) => `${p.names} actually won. Did anyone see that coming?`,
  ],
  fold: [
    (p) => `${p.name} mucks like a pro.`,
    (p) => `${p.name} folds faster than a cheap suit.`,
    (p) => `${p.name} decides it's not worth the pain.`,
    (p) => `${p.name} bails out. Live to fight another hand.`,
    (p) => `${p.name} throws it away. Discretion is the better part of valour.`,
    (p) => `Fold! ${p.name} wants no part of this.`,
    (p) => `${p.name} retreats. Even a scared rabbit lasts longer.`,
    (p) => `${p.name} folds. You could have won with that, just kidding.`,
  ],
  check: [
    (p) => `${p.name} taps the felt. Living dangerously with a check.`,
    (p) => `${p.name} checks. No guts, no glory.`,
    (p) => `Check from ${p.name}. Playing it cool.`,
    (p) => `${p.name} checks. Let's see another card.`,
    (p) => `Weakness detected — ${p.name} checks.`,
    (p) => `${p.name} checks. Praying for a free card?`,
  ],
  call: [
    (p) => `${p.name} calls ${p.amount.toLocaleString()}. That's the spirit!`,
    (p) => `${p.name} matches the bet. Good luck, you'll need it.`,
    (p) => `${p.name} puts in ${p.amount.toLocaleString()}. The plot thickens.`,
    (p) => `${p.name} calls. Hope those cards are worth it.`,
    (p) => `${p.name} throws away ${p.amount.toLocaleString()} on that hand. Bold move, Cotton.`,
    (p) => `${p.name} calls. Might as well tip the dealer.`,
  ],
  raise: [
    (p) => `${p.name} raises to ${p.amount.toLocaleString()}. Big move, let's see if it pays off.`,
    (p) => `${p.name} puts ${p.amount.toLocaleString()} more on the line. Confidence or bluff?`,
    (p) => `Raise! ${p.name} makes it ${p.amount.toLocaleString()}. Someone's feeling brave.`,
    (p) => `${p.name} bumps it up to ${p.amount.toLocaleString()}. The pressure mounts.`,
    (p) => `${p.name} increases the stakes — ${p.amount.toLocaleString()} to go.`,
    (p) => `Raising with garbage? ${p.name} just made it ${p.amount.toLocaleString()}.`,
    (p) => `${p.name} raises. Trying to buy respect?`,
  ],
  allin: [
    (p) => `${p.name} shoves all-in for ${p.amount.toLocaleString()}! All or nothing!`,
    (p) => `ALL IN! ${p.name} risks it all for ${p.amount.toLocaleString()}. Heart rate spiking.`,
    (p) => `${p.name} pushes the stack — ${p.amount.toLocaleString()} chips. This is it!`,
    (p) => `${p.name} goes all-in. Sweat check!`,
    (p) => `${p.name} empties the clip — ${p.amount.toLocaleString()} in the middle.`,
    (p) => `Desperation shove! ${p.name} bets everything.`,
    (p) => `${p.name} says goodbye to ${p.amount.toLocaleString()} chips. All in!`,
  ],
  sideBetPlaced: [
    (p) => `${p.bettor} bets ${p.amount.toLocaleString()} on ${p.target}. Side action, the real gamble.`,
    (p) => `Side bet: ${p.bettor} thinks ${p.target} will win. We'll see.`,
    (p) => `${p.bettor} backs ${p.target} with ${p.amount.toLocaleString()}. Loyalty or stupidity?`,
    (p) => `Another side bet from ${p.bettor}. Donating chips to the cause.`,
    (p) => `${p.bettor} throws ${p.amount.toLocaleString()} on ${p.target}. Let's hope luck exists.`,
  ],
  sideBetWin: [
    (p) => `Side bet cashes! ${p.bettor} pockets ${(p.amount + p.profit).toLocaleString()} on ${p.target}. Maybe they're psychic.`,
    (p) => `${p.bettor} wins ${(p.amount + p.profit).toLocaleString()} from the side bet. Winner winner!`,
    (p) => `Side bet pays off for ${p.bettor}. Even a broken clock is right twice a day.`,
  ],
  sideBetRefund: [
    (p) => `${p.bettor}'s side bet of ${p.amount.toLocaleString()} is refunded — opponent chickened out.`,
    (p) => `The fold saves ${p.bettor}'s side bet. ${p.amount.toLocaleString()} returned.`,
    (p) => `${p.bettor} gets a refund. Lucky escape.`,
  ],
  achievementEarned: [
    (p) => `🏆 ${p.player} earned "${p.name}" — ${p.desc}. Bragging rights activated.`,
    (p) => `Achievement unlocked: ${p.name}. ${p.player} is slightly less terrible.`,
  ],
  pause: [
    (p) => `${p.name} paused the game. Time for a snack break.`,
    (p) => `Break time! ${p.name} hit pause.`,
    (p) => `⏸️ ${p.name} stops the clock. Coffee run?`,
    (p) => `${p.name} paused. Probably checking their bankroll.`,
  ],
  resume: [
    (p) => `${p.name} resumes the action. Chop chop!`,
    (p) => `And we're back! ${p.name} restarts the clock.`,
    (p) => `▶️ ${p.name} says game on.`,
    (p) => `${p.name} resumes. More bad decisions incoming.`,
  ],
  reset: [
    (p) => `Table reset by ${p.name}. Everyone starts equal... again.`,
    (p) => `${p.name} cleaned the slate. Fresh chips for all.`,
    (p) => `${p.name} hit reset. Someone must have been losing.`,
  ],
  sitIn: [
    (p) => `${p.name} buys in. Let's see if their wallet matches their mouth.`,
    (p) => `${p.name} joins the game. Chips loaded.`,
    (p) => `${p.name} takes a seat. The game grows.`,
    (p) => `Fresh blood! ${p.name} sits down.`,
    (p) => `${p.name} sits in. Get the chips ready to donate.`,
  ],
  communityFlop: [
    () => `Dealer spreads the flop. Three cards, endless possibilities.`,
    () => `Flop! The board begins to tell a story.`,
    () => `The flop reveals who the real donkeys are.`,
  ],
  communityTurn: [
    () => `The turn burns and turns. Things are heating up.`,
    () => `Turn card. Now we're getting somewhere.`,
    () => `The turn of pain.`,
  ],
  communityRiver: [
    () => `River! Last chance to cry.`,
    () => `The river completes the board. All over.`,
    () => `The river of tears.`,
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