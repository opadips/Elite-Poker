# 🃏 Elite Poker – Texas Hold'em Real‑Time Multiplayer

➡️ **برای دیدن نسخه فارسی کلیک کنید:[Persian version](README_FA.md)

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)
![React](https://img.shields.io/badge/react-18-blue)
---
## ✨ Features
### 🏠 Lobby System
- **Lobby list** – browse available tables with player count, top score, mode, lock status, active players, blinds, and more.
- **Live table cards** – see active player count, blinds, starting chips, and—when a hand is in progress—the current pot size and round.
- **Create private/public tables** – set a name, description, password, blinds, starting chips (up to 1,000,000), and game mode (Tournament / Cash).
- **General chat** – chat with all online players before joining a table.
- **Online players panel** – see who is in the lobby.
- **Waitlist** – if a table is full (max 10 players), join the waitlist and be auto‑seated when a spot opens.
- **Admin controls** – only the table creator can reset the lobby or kick players.
- **Kick players** – admin can remove players from the table.
- **Return to lobby** – leave the table and go back to the lobby list without disconnecting.

### 🎤 A Dealer with Attitude
- A sarcastic, witty Dealer narrates every action—fold, call, raise, all‑in, and more—with over 100 unique lines.
- Dealer messages appear instantly at the top of the screen and fade after a moment.

### 🎮 Core Gameplay
- Full Texas Hold'em rules (preflop, flop, turn, river, blinds, side pots).
- Real‑time multiplayer via **WebSocket** (2–10 players per table).
- **Spectator mode** – watch the game and sit in with adjustable starting chips.
- **Side betting** – folded players can bet on active players (50% profit). In heads‑up scenarios where the opponent folds, the side bet is refunded to prevent abuse.
- **Tournament mode** – chips reset when one player remains; winner gets a point and everyone restarts with fresh chips.
- **Cash mode** – chips accumulate across hands (no forced reset).
- **Auto‑action timer** – 20 seconds per turn; auto‑check or auto‑fold on time‑out. The active player’s card is wrapped with a sleek neon progress ring that changes colour from blue → green → orange → red.
- **Pause / Resume** – pause the game anytime (pauses auto‑fold timers), with player attribution.

### 🎨 Visual & UX
- **6 polished themes** with pure CSS backgrounds (no external files):
  - `Classic` · `Royal Crimson` · `Emerald Luxe` · `Sapphire Noir` · `Neon Jungle` · `Void Pulse`
- **Card back customization** (6 designs) – saved in `localStorage`.
- **Seat view** – fixed (your seat always at the bottom) or dynamic (rotating), adjustable in settings.
- **Advanced animations**:
  - Community card reveal with 3D spin
  - Chip movement with parabolic arc
  - Winner hand text with per‑theme font & colour
  - All‑in delayed community card reveal (2s between streets)
- **Visual indicators** – admin crown, SB/BB badges, dealer badge (hidden until the first hand starts).

### 🔊 Sound Effects (Web Audio API)
- **No audio files required** – all sounds generated live with Web Audio API.
- Card dealing, chip clicking, winner fanfare, timer beep, and a rich all‑in coin‑machine sound.

### 📊 Noob Mode
- A live probability bar shows your chance of winning the hand (Monte Carlo simulation, 2000 trials).
- Colour‑coded: green (low) → orange (medium) → red (high).

### 🏆 Achievements
- Only ultra‑rare moments unlock achievements now—no more spammy notifications.
- Examples: winning with a Royal Flush, dragging a million‑chip pot, a 10‑hand win streak, or winning a hand after being reduced to exactly 1 chip.

### 💬 Chat & Quick Chat
- Table chat with persistent history.
- **Speech bubbles** appear above the sender’s seat.
- **Quick Chat pad** – one‑click emoji messages in three categories (Emotions, Game, Greetings).
- **Private messages** – use `/w PlayerName` to whisper directly to someone (purple styling, visible only to sender and receiver).
- Chat panel auto‑hides after a few seconds of inactivity.

### 👤 Player Stats & History
- Expandable leaderboard showing hands played, pots won, losses, biggest pot, best hand, and win rate.
- **Hand history** – view recent hands from the settings menu.

### 🛡️ Other Improvements
- Auto‑fold when the acting player disconnects—no more frozen tables.
- Structured JSON logger on the server for live debugging.
- Chat panel always stays on top of chips, seats, and cards.

---
## 🚀 Quick Start
### Prerequisites
- Node.js ≥ 16
- npm or yarn
### Installation
```bash
git clone https://github.com/opadips/Elite-Poker.git
cd Elite-Poker
```
**Backend (WebSocket server)**
```bash
cd backend
npm install   # or yarn
node server.js
```
Server runs on `ws://0.0.0.0:3000`.
**Frontend (React + Vite)**
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or your LAN IP) and start playing.
---
## 🕹️ How to Play

### 1. Enter & Join
- **Enter a username** (max 15 characters) and click **Enter Lobby**.
- Browse the lobby list or **create a new table**.
  - Set table name, optional password, blinds, starting chips (up to 1M), and mode (Tournament/Cash).
- Click on a table to join. If it’s password‑protected, enter the password.

### 2. Start Playing
- You'll enter as a **spectator** – click **Sit In** (bottom‑right) to join the game.
- When not in a hand, use the **Ready** button to signal you’re ready.
  - A green glow appears around your seat when ready.
  - When all active players are ready, the first hand starts automatically.

### 3. Take Action
- On your turn, use the action buttons (Fold, Check, Call, Raise, All‑in).
- Folded players can place **side bets** on active players.

### 4. Chat & Settings
- Use the **⚙️ Settings** menu to change theme, card back, seat view, sound, Noob Mode, pause, view hand history, or return to the lobby.
- Type in chat, use Quick Chat emojis, or whisper to someone with `/w PlayerName message`.

### 5. Admin Control
- The table creator can reset the lobby or kick players.

---
## 📂 Project Structure
```text
Elite-Poker/
├── backend/
│   ├── server.js
│   ├── LobbyManager.js
│   ├── ClientRegistry.js
│   ├── MessageRouter.js
│   ├── BroadcastScheduler.js
│   ├── WaitlistManager.js
│   ├── HandHistoryStore.js
│   ├── LobbyChatStore.js
│   ├── constants.js
│   ├── handlers/
│   │   ├── lobbyHandlers.js
│   │   └── gameHandlers.js
│   ├── utils/
│   │   ├── timerUtils.js
│   │   └── logger.js
│   └── game/
│       ├── Game.js
│       ├── Player.js
│       ├── Deck.js
│       ├── HandEvaluator.js
│       ├── HandLifecycle.js
│       ├── BettingRound.js
│       ├── PotManager.js
│       ├── PlayerActionValidator.js
│       ├── TournamentManager.js
│       ├── AchievementTracker.js
│       └── dealerMessages.js
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── LobbyList.jsx
│       ├── CreateLobbyModal.jsx
│       ├── GameTable.jsx
│       ├── components/
│       │   ├── Card.jsx
│       │   ├── Chat.jsx
│       │   ├── Leaderboard.jsx
│       │   ├── ActionButtons.jsx
│       │   ├── BettingPanel.jsx
│       │   ├── HandInfo.jsx
│       │   ├── AnimatedChip.jsx
│       │   ├── ChipStack.jsx
│       │   ├── TimerRing.jsx
│       │   ├── PlayerSeat.jsx
│       │   ├── SettingsPanel.jsx
│       │   ├── Table.jsx
│       │   └── GameOverlays.jsx
│       ├── context/
│       │   └── GameContext.js
│       ├── hooks/
│       │   ├── useSound.js
│       │   ├── useGameStateSync.js
│       │   ├── useTimerSync.js
│       │   ├── useChatSync.js
│       │   ├── useHandHistorySync.js
│       │   ├── usePlayerPositions.js
│       │   └── useGameActions.js
│       ├── utils/
│       │   └── equity.js
│       └── styles/
│           ├── themes.css
│           └── animations.css
├── README.md
├── README_FA.md
└── package.json
```
---
## 🔧 Tech Stack
| Layer       | Technology                          |
|-------------|--------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS        |
| Backend     | Node.js, Express, ws                |
| Audio       | Web Audio API (no files)            |
| Animations  | CSS keyframes, cubic‑bezier transitions |
| Real‑time   | WebSocket (bi‑directional)          |
---
## 🌈 Customisation
- **Add new themes** – edit `themes.css` and add a new entry in the `themes` array inside `GameTable.jsx`.
- All theme‑dependent colors are controlled by CSS custom properties (`--table-bg`, `--winner-text`, etc.).
- Card backs and other personalisation options are stored in `localStorage`.

---
And I would like you to know that I have used many models to build this project so far, such as:
`Qwen3.6` `gemma-4` `deepseek` 
---

## 🤝 Contributing
Found a bug or issue?
1 - just update by using 'update-Elite-poker.bat'
    It's probably fixed because I fix problems very quickly, there's usually always a version to update :)
2- The problem is still not fixed? It's strange, but be sure to report it so I can fix it quickly.

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
