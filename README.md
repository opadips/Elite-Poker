# 🃏 Elite Poker – Texas Hold'em Real‑Time Multiplayer

➡️ **برای دیدن نسخه فارسی کلیک کنید:[Perisan version](README_FA.md)

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)
![React](https://img.shields.io/badge/react-18-blue)
---
## ✨ Features
### 🏠 Lobby System
- **Lobby list** – browse available tables with player count, top score, mode, and lock status
- **Create private/public tables** – set a name, description, password, blinds, starting chips (up to 1,000,000), and game mode (Tournament / Cash)
- **General chat** – chat with all online players before joining a table
- **Online players panel** – see who is in the lobby
- **Waitlist** – if a table is full (max 10 players), you can join a waitlist and be auto‑seated when a spot opens
- **Admin controls** – only the table creator can reset the lobby or kick players
- **Return to lobby** – leave the table and go back to the lobby list without disconnecting
### 🎮 Core Gameplay
- Full Texas Hold'em rules (preflop, flop, turn, river, blinds, side pots)
- Real‑time multiplayer via **WebSocket** (2–10 players per table)
- **Spectator mode** – watch the game and sit in with adjustable starting chips (displayed as `1K`, `100K`, `1M`)
- **Side betting** – folded players can bet on active players to win extra chips (50% profit)
- **Tournament mode** – chips reset only when one player remains; winner gets a point and all players restart with fresh chips
- **Cash mode** – chips keep accumulating across hands (no forced reset)
- **Auto‑action timer** – 20s per turn, auto‑check or auto‑fold on time‑out, visible via a vertical color‑coded bar beside the active player
- **Pause / Resume** – pause the game anytime (pauses auto‑fold timers), with player attribution
### 🎨 Visual & UX
- **6 stunning themes** with pure CSS backgrounds (no external files):
  - `Classic` · `Cyberpunk` · `Fantasy` · `Midnight` · `Neon Jungle` · `Void Pulse`
- **Card back customization** (6 designs) – saved in `localStorage`
- **Seat view** – fixed (your seat always at the bottom) or dynamic (rotating), adjustable in settings
- **Ready / Unready system** – large button at bottom‑right, green glow ring around ready players
- **Advanced animations**:
  - Community card reveal with 3D spin
  - Chip movement with parabolic arc and bounce
  - Winner hand text with per‑theme font & color, smooth fade‑in‑out
  - Post‑hand card flip animation (manual show cards button after hand ends)
  - All‑in delayed community card reveal (2s between flop, turn, river for suspense)
- **Table size** optimized for a clean view (elliptical shape, responsive)
### 🔊 Sound Effects (Web Audio API)
- **No audio files required** – all sounds generated live with Web Audio API
- Card dealing, chip clicking, winner fanfare, timer beep, and a rich **all‑in coin‑machine sound**
- Sound on/off toggle in settings with visual feedback
### 📊 Live Hand Equity (Noob Mode)
- When **Noob Mode** is enabled, a **live probability bar** appears showing your chance of winning the hand
- Monte Carlo simulation with **2000 trials**, runs entirely on the client
- Color‑coded bar: **green** (low equity) → **orange** (medium) → **red** (high)
- The panel appears directly inside your own player card, without obstructing the table
### 🏆 Achievements
- **8 unique achievements** unlock and show a toast notification:
  - `First Blood` – Win your first pot
  - `Hat Trick` – Win 3 pots in a row
  - `High Roller` – Win a pot of 500+ chips
  - `Royal Touch` – Win with a Royal Flush
  - `Bluff Master` – Win with a High Card
  - `All‑In King` – Win while being all‑in
  - `Sheriff` – Eliminate a player
  - `Veteran` – Play 10 hands
- Achievements are stored per player and shown in real‑time
### 💬 Chat & Speech Bubbles
- Table chat with **persistent history** (messages stay even when you close the chat panel)
- **Speech bubbles** appear above the sender’s seat for a few seconds
- System messages for joins, wins, side bets, pauses, achievements, etc.
- **Auto‑open / close** chat when a system message arrives (5 second timeout)
### 👤 Player Stats & History
- Expandable leaderboard at top‑left showing:
  - Hands played, pots won, losses, biggest pot, best hand, win rate
- Stats are updated after every hand
- **Hand history** – view recent hands from the settings menu
### 🛡️ Other Improvements
- Duplicate player names are prevented
- Pause / Resume messages show who performed the action
- Settings panel scrolls when content overflows
- Chat and settings remain fully visible even when game is paused
- Lobbies automatically removed when empty
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
- You'll enter as a **spectator** – click **Sit In** (bottom‑right) to join the game with the table’s starting chips.
- When not in a hand, use the **Ready** button (bottom‑right) to signal you’re ready.
  - A green glow appears around your seat when ready.
  - When all active players are ready, the first hand starts automatically.

### 3. Take Action
- On your turn, use the action buttons (Fold, Check, Call, Raise, All‑in).
- Folded players can place **side bets** on active players via the panel that appears.

### 4. Review & Settings
- Use the **⚙️ Settings** menu to:
  - Change theme, card back, seat view, sound, Noob Mode, pause the game, view hand history, or return to the lobby.
- After a hand ends, press **👁️ Show Cards** to reveal your hole cards.

### 5. Admin Control
- The table creator can reset the lobby or kick players.

---
## 📂 Project Structure
```text
Elite-Poker/
├── backend/
│   ├── server.js              # WebSocket server & lobby management
│   ├── LobbyManager.js        # Multi‑table management, waitlist, chat, history
│   └── game/
│       ├── Game.js            # Core poker logic, achievements, side pots
│       ├── Player.js          # Player model, stats & state
│       ├── Deck.js            # Card deck
│       └── HandEvaluator.js   # 7‑card hand evaluation
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Login / Lobby / Game flow, theme control
│   │   ├── LobbyList.jsx      # Lobby list, general chat, online players
│   │   ├── CreateLobbyModal.jsx # Table creation form
│   │   ├── GameTable.jsx      # Main game component (table, players, timer, chat)
│   │   ├── components/        # Card, Chat, Leaderboard, ActionButtons, BettingPanel, HandInfo, AnimatedChip, etc.
│   │   ├── hooks/             # useSound (Web Audio)
│   │   ├── utils/             # equity.js (Monte Carlo simulation)
│   │   └── styles/            # themes.css, animations.css
│   └── index.html
└── README.md
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
- Card backs and other personalisation options are stored in `localStorage` for persistence.
---
## 🤝 Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
