
markdown
# 🃏 Elite Texas Holdem Poker - game server and web client

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-live-orange)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[برای مطالعه فارسی به پایین بروید](#-نسخه-فارسی)**

---

## 🇬🇧 English Version

### 🎮 About the Game

A fully functional online Texas Hold'em poker game that supports **2–9 real players**.  
All features are implemented from scratch without any external images or sounds – only pure CSS, HTML, and JavaScript.

**Main Features:**

- ✅ Standard Texas Hold'em rules (Pre‑flop, Flop, Turn, River, Showdown)  
- ✅ Real‑time multiplayer via WebSocket (server‑authoritative)  
- ✅ **Side betting** for folded players (50% profit on won bets)  
- ✅ Tournament scoring system – chips reset & score increment when one player takes all  
- ✅ Modern animated table, chat system, turn timer, hand analyzer (beginner mode), chip animations, winner effects  
- ✅ No external images or sounds – 100% self‑contained  

---

### 🚀 Quick Start / 1 click install & run!

#### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher  
- A terminal / command prompt  

#### Installation & Running

**1. Clone the repository**

```bash
git clone https://github.com/opadips/Elite-Poker
cd Elite-Poker
```
2. Install dependencies & run (Windows)
Simply double‑click start-poker.bat

3. Run on Linux/macOS

```bash
chmod +x start-poker.sh
./start-poker.sh
```
4. Open your browser
Go to http://localhost:5173

  Note: The first run may take a few minutes to install dependencies.
  Two terminal windows will appear (backend + frontend). Do not close them while playing.

 ### 🕹️ How to Play
Step	Action
- 1️⃣	Enter a name (max 15 characters) and join the table.
- 2️⃣	First hand: all players must click Ready to start.
- 3️⃣	After the first hand, next hands start automatically.
- 4️⃣	Use the action buttons: Fold, Check, Call, Raise (percentage of pot), All‑in.
- 5️⃣	Side bet: If you fold, you can bet on another active player to win the hand (max 50% of your chips, profit 50%).
- 6️⃣	Chat: Click the 💬 button to toggle – messages auto‑hide after 5 seconds.
- 7️⃣	Beginner mode: Check "🐶 من نوب سگم" to get simple hand advice.
- 8️⃣	Turn timer: 15 seconds – auto‑check or auto‑fold if you don't act in time.

### 📂 Project Structure
```text
Elite-Poker/
├── backend/           # Node.js + WebSocket server
│   ├── game/          # Poker game logic (hand evaluation, side pots, scoring)
│   └── server.js      # WebSocket server, auto‑fold timer, chat broadcast
├── frontend/          # React + Vite + Tailwind CSS
│   └── src/           # Components, styles, WebSocket integration
├── start-poker.bat    # Windows one‑click start script
├── start-poker.sh     # Linux/macOS start script
└── README.md          # This file
```
### 🛠️ Manual Run (if scripts do not work)
Backend:

```bash
cd backend
npm install
npm start
```
Frontend (in another terminal):

```bash
cd frontend
npm install
npm run dev
```
Then open http://localhost:5173

### 🌐 Multiplayer on Local Network / VPN

- 1-Find your local IP address (e.g., 192.168.1.100 via ipconfig on Windows or ifconfig on Linux).

- 2-On other devices, open http://YOUR_IP:5173 (e.g., http://192.168.1.100:5173).

- 3-Firewall: Make sure Windows Firewall (or your OS firewall) allows incoming connections on ports 3000 and 5173.

- 4-You can also use VPN software like Radmin VPN, Packet Raft, Electro, etc. They create a virtual network and give you an IP address from a certain range.
- 
### 🤝 Contributing
Feel free to fork the repo, open issues, or submit pull requests.
All contributions are welcome – whether bug fixes, new features, or documentation improvements.

### 📄 License
This project is licensed under the MIT License – see the LICENSE file for details.

## 🇮🇷 نسخه-فارسی
### 🎮 درباره بازی

از ۲ تا ۹ بازیکن واقعی پشتیبانی می‌کند. بیشتر هم میشه اما باگ ظاهری داره حوصلم نمیشه درستش کنم ولی میتونید بیشتر هم بیارید

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


### والبته اینکه بدون من بازی نکنید 😄 ممنون





