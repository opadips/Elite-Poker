# 🃏 Elite Poker – Texas Hold'em Real‑Time Multiplayer

A full‑featured Texas Hold'em poker game with **real‑time multiplayer**,  
advanced animations, dynamic sound, multi‑theme support, and a live hand‑equity tracker.

[![License](https://img.shields.io/badge/license-MIT-green)](https://img.shields.io/badge/license-MIT-green)
[![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)](https://img.shields.io/badge/node-%3E%3D16-brightgreen)
[![React](https://img.shields.io/badge/react-18-blue)](https://img.shields.io/badge/react-18-blue)

---

## ✨ Features

### 🎮 Core Gameplay
* Full Texas Hold'em rules (preflop/flop/turn/river, blinds, side pots)
* Real‑time multiplayer via **WebSocket** (2–9 players)
* **Spectator mode** – watch the game and sit in with 1000 chips
* **Side betting** – folded players can bet on active players to win extra chips
* **Tournament scoring** – rounds won are displayed on a leaderboard

### 🎨 Visual & UX
* **6 stunning themes** with dynamic CSS backgrounds (no external files):
    * `Classic` · `Cyberpunk` · `Fantasy` · `Midnight` · `Neon Jungle` · `Void Pulse`
* **Card back customization** (6 designs) – saved in `localStorage`
* **Advanced animations**:
    * Card reveal with 3D spin (community cards)
    * Chip movement with parabolic arc and bounce
    * Winner hand text with per‑theme font & color, fade‑in‑out effect
    * FOLD / ALL‑IN visual indicators, action tracker for last move

### 🔊 Sound Effects
* **Pure Web Audio API** – no audio files required
* Sounds for card dealing, chips clicking, winning fanfare, and timer beep
* Sound on/off toggle in settings (with visual feedback)

### ⏯️ Game Control
* **Pause / Resume** – pause the game anytime (pauses auto‑fold timers)
* **Auto‑action timer** (20s) – auto‑check or auto‑fold if a player times out, visible to all players
* **Reset lobby** – admin can reset all chips and scores

### 📊 Live Hand Equity (Noob Mode)
* When "Noob Mode" is enabled, a **live probability bar** appears showing your chance of winning the hand
* Monte Carlo simulation with 2000 trials, runs entirely on the client
* Color‑coded: **green** (low equity) → **orange** (medium) → **red** (high) with glowing pulse effect
* Panel background adapts to the active theme

### 🏆 Achievements
* 8 unique achievements (First Blood, Hat Trick, High Roller, Royal Touch, Bluff Master, All‑In King, Sheriff, Veteran)
* Toast notifications when an achievement is unlocked, stored per player

### 💬 Chat & History
* Table chat with persistent history (messages stay even when you close the chat panel)
* System messages for joins, wins, side bets, and achievements

### 👤 Player Stats
* Expandable leaderboard with full stats (hands played, pots won, losses, biggest pot, best hand)

---

## 🚀 Quick Start

### Prerequisites
* Node.js ≥ 16
* npm or yarn

### Installation

**Backend (WebSocket server)**
```bash
cd backend
npm install   # or yarn
node server.js
```
Server runs on `ws://localhost:3000`.

**Frontend (React + Vite)**
```bash
cd ../frontend   # if separate directory, or where package.json is
npm install
npm run dev
```
Open `http://localhost:5173` and start playing.

---

## 🕹️ How to Play

1. Open the game in multiple browser tabs (or share the network URL).
2. Enter a name (max 15 characters) and click **Join Table**.
3. By default you're a spectator; click **Sit In** to join with 1000 chips.
4. Click **Ready** and wait for all players to ready up → first hand starts.
5. Use the action buttons (**Fold**, **Check**, **Call**, **Raise**, **All‑in**) on your turn.
6. Enable **"🐶 من نوب سگم" (Noob Mode)** to see your hand strength and live equity bar.
7. Use the ⚙️ Settings menu to switch themes, card backs, sound, pause the game, or reset the lobby.

---

## 📂 Project Structure

```text
Elite-Poker/
├── backend/
│   ├── server.js              # WebSocket server
│   └── game/
│       ├── Game.js            # Core poker logic
│       ├── Player.js          # Player model & stats
│       ├── Deck.js            # Card deck
│       ├── HandEvaluator.js   # Hand ranking
│       └── PotManager.js
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── GameTable.jsx      # Main game component
│   │   ├── components/        # React components (Card, Chat, Leaderboard, etc.)
│   │   ├── hooks/             # useSound (Web Audio), useWebSocket
│   │   ├── utils/             # equity.js (Monte Carlo simulation)
│   │   └── styles/            # themes.css, animations.css
│   └── index.html
└── README.md
```

---

## 🔧 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, ws |
| **Audio** | Web Audio API (no files) |
| **Animations** | CSS keyframes, cubic‑bezier transitions |
| **Real‑time** | WebSocket (bi‑directional) |

---

## 🌈 Customisation

You can easily add new themes by editing `themes.css` and adding a new entry in the `themes` array inside `GameTable.jsx`.  
All theme‑dependent colors are controlled by CSS custom properties (`--table-bg`, `--winner-text`, etc.).

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## 🇮🇷 نسخه-فارسی
### 🎮 درباره بازی

از ۲ تا ۹ بازیکن واقعی پشتیبانی می‌کند. فعلا البته باگ داره هیچ محدودیتی نداره برای جویین دادن اگه دیدم نیازه اپدیت میشه

## ویژگی‌های اصلی:

- ✅ قوانین استاندارد پوکر 

- ✅ چندنفره زنده با WebSocket (معماری server‑authoritative)

- ✅ شرط‌بندی جانبی برای بازیکنانی که فولد کرده‌اند 

- ✅ سیستم امتیازدهی تورنمنتی – وقتی یک بازیکن همه چیپ‌ها را می‌برد، چیپ‌ها ریست و +۱ امتیاز می‌گیرد

- ✅ میز مدرن انیمیشن‌دار، سیستم چت، تایمر نوبت، تحلیلگر دست (حالت مبتدی)، انیمیشن چیپ و افکت برنده

- ✅ بدون عکس یا صدای خارجی – کاملاً مستقل

### 🚀 شروع سریع
پیش‌نیازها
Node.js نسخه ۱۸ یا بالاتر

ترمینال یا خط فرمان

نصب و اجرا
1. کلون مخزن

```bash
git clone https://github.com/opadips/Elite-Poker
cd Elite-Poker
```
راستش بقیه اینم حوصله ترجمه ندارم راه اندازیش اون بالا نوشتم خودتون بخونید خیلی ساده شده

### چند تا از از قابلیت هایی که خودم حس کردم جالبه ادد کردم : 

- side bet : کسانی که فولد دادن میتونن روی برنده راند از بین افرادی که هنوز توی میز هستن بت ببندن 

- حالت "🐶 من نوب سگم" رو میتونید روشن کنید اگه نوب سگید برای افراد نوب سگ

- قابلیت چت!!!! چی از این شاهکار تر

- تست شده با نت ملی، الکترو، پکت رفت

- اگه باگ یا ایده ای یا هرچیزی هم بود بگید برای بهتر شدن 


### البته اینکه بدون من بازی نکنید 😄 ممنون