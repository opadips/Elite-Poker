# 🃏 Online Texas Hold'em Poker - Multiplayer Real-Time Game

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-live-orange)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[برای مطالعه فارسی به پایین بروید](#-نسخه-فارسی)**

## 🇬🇧 English Version

### 🎮 About the Game

A fully functional online Texas Hold'em poker game that supports 2–9 real players. It includes:
- Standard Texas Hold'em rules (Pre-flop, Flop, Turn, River, Showdown)
- Real-time multiplayer via WebSocket (server‑authoritative)
- Side betting for folded players (with 50% profit)
- Tournament scoring system (chip reset & score increment when one player takes all)
- Modern animated table, chat system, turn timer, hand analyzer (beginner mode), chip animations, and winner effects
- No external images or sounds – pure CSS, HTML, and JavaScript

### 🚀 Quick Start

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A terminal / command prompt

#### Installation & Running

**1. Clone the repository**

git clone https://github.com/YOUR_USERNAME/poker-online.git
cd poker-online
2. Install dependencies & run (Windows)
Simply double-click start-poker.bat

3. Run on Linux/macOS
chmod +x start-poker.sh
./start-poker.sh

4. Open your browser
Go to http://localhost:5173

Note: The first run may take a few minutes to install dependencies. Two terminal windows will appear (backend + frontend). Do not close them.

🕹️ How to Play
Enter a name (max 15 characters) and join the table.

First hand: all players must click Ready to start.

After the first hand, next hands start automatically.

Actions: Fold, Check, Call, Raise (percentage of pot), All-in.

Side bet: If you fold, you can bet on another player to win (max 50% of your chips, profit 50%).

Chat: Click the 💬 button to toggle, messages auto-hide after 5 seconds.

Beginner mode: Check "🐶 من نوب سگم" to get simple hand advice.

Turn timer: 15 seconds, auto-check or auto-fold.

📂 Project Structure
Elite-Poker/
├── backend/           # Node.js + WebSocket server
│   ├── game/          # Poker game logic (hand evaluation, side pots, scoring)
│   └── server.js      # WebSocket server, auto‑fold timer, chat broadcast
├── frontend/          # React + Vite + Tailwind CSS
│   └── src/           # Components, styles, WebSocket integration
├── start-poker.bat    # Windows one‑click start script
├── start-poker.sh     # Linux/macOS start script
└── README.md          # This file
🛠️ Manual Run (if scripts do not work)
cd backend
npm install
npm start
Frontend (in another terminal):
cd frontend
npm install
npm run dev
Then open http://localhost:5173.
🌐 Multiplayer on Local Network
Find your local IP (e.g., 192.168.1.100 via ipconfig or ifconfig).

(You can also use VPNs like 'Radmin VPN', 'Packet Raft', 'Electro', and many more. They work by creating virtual connections and giving you an IP address from a certain range.On other devices, open )

http://YOUR_IP:5173

Make sure Windows Firewall allows ports 3000 and 5173.

🤝 Contributing
Feel free to fork, open issues, or submit pull requests. All contributions are welcome.

📄 License
This project is licensed under the MIT License – see the LICENSE file.

-------------------------------------------
🇮🇷 نسخه فارسی

🚀شروع
پیش‌نیازها
Node.js (نسخه ۱۸ یا بالاتر)

ترمینال یا خط فرمان

 نصب و اجرا
 کلون مخزن 

git clone https://github.com/YOUR_USERNAME/poker-online.git
cd poker-online

2. نصب وابستگی‌ها و اجرا (ویندوز)
روی start-poker.bat دابل کلیک کنید.

3. اجرا در لینوکس/مک

chmod +x start-poker.sh
./start-poker.sh

4. مرورگر را باز کنید
به آدرس http://localhost:5173 بروید.

نکته: اولین بار چند دقیقه طول می‌کشد تا وابستگی‌ها نصب شوند. دو پنجره ترمینال باز می‌شود (بک‌اند + فرانت‌اند). آن‌ها را نبندید.

🕹️ نحوه بازی
نام (حداکثر ۱۵ کاراکتر) وارد کرده و به میز بپیوندید.

دست اول: همه بازیکنان باید دکمه Ready را بزنند.

بعد از دست اول، دست‌های بعدی خودکار شروع می‌شوند.

اقدامات: فولد، چک، کال، رایز (درصدی از پات)، آل‌این.

شرط جانبی: اگر فولد کنید، می‌توانید روی بازیکن دیگری شرط ببندید که برنده شود (حداکثر ۵۰٪ چیپ‌هایتان، سود ۵۰٪).

چت: با کلیک روی دکمه 💬 باز/بسته می‌شود، پیام‌ها پس از ۵ ثانیه محو می‌شوند.

حالت مبتدی: تیک «🐶 من نوب سگم» را بزنید تا راهنمایی دست بگیرید.

تایمر نوبت: ۱۵ ثانیه، در صورت عدم اقدام خودکار چک یا فولد می‌کند.

📂 ساختار پروژه

poker-online/
├── backend/           # سرور Node.js + WebSocket
│   ├── game/          # منطق بازی (ارزیابی دست، پات‌های جانبی، امتیازات)
│   └── server.js      # سرور WebSocket، تایمر خودکار، پخش چت
├── frontend/          # React + Vite + Tailwind CSS
│   └── src/           # کامپوننت‌ها، استایل‌ها، اتصال WebSocket
├── start-poker.bat    # اسکریپت یک‌کلیک ویندوز
├── start-poker.sh     # اسکریپت یک‌کلیک لینوکس/مک
└── README.md          # همین فایل

🛠️ اجرای دستی (اگر اسکریپت کار نکرد)
بک‌اند:

cd backend
npm install
npm start

فرانت‌اند (در ترمینال دیگر):

cd frontend
npm install
npm run dev
سپس http://localhost:5173 را باز کنید.

🌐 چندنفره در شبکه محلی

تست شده با نت ملی با الکترو و پکت رفت
در دستگاه‌های دیگر آدرس http://IP_SERVER:5173 را باز کنید.
فایروال ویندوز پورت‌های 3000 و 5173 را باز کند. یا خاموش کنید

🤝 مشارکت

اگه باگ یا ایده ای بود اطلاع بدید برای بهتر شدن بازی 
