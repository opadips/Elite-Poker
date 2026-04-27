# 🃏 Elite Poker – Texas Hold'em Real‑Time Multiplayer

➡️ **click here for English Version:** [English Version](README.md)

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D16-brightgreen)
![React](https://img.shields.io/badge/react-18-blue)
---
## ✨ Features
### 🏠 سیستم لابی (Lobby System)
- **لیست لابی** – بگردید بین میزهای موجود با تعداد بازیکن، بالاترین امتیاز، حالت بازی و وضعیت قفل
- **ایجاد میز خصوصی/عمومی** – اسم، توضیحات، رمز عبور، میزان بلیز، چیپ اولیه (تا 1,000,000)، و حالت بازی (مسابقات / نقدی)
- **چت عمومی** – قبل از رفتن به میز، با همه بازیکنان آنلاین چت کنید
- **پنل بازیکنان آنلاین** – ببینید کی توی لابی هست
- **صف انتظار (Waitlist)** – اگه یه میز پر بود (حداکثر 10 نفر)، می‌تونید توی صف انتظار باشید و وقتی جایی خالی شد، خودتون رو نشون بدید
- **کنترل‌های ادمین** – فقط سازنده میز می‌تونه لابی رو ریست کنه یا بازیکن‌ها رو کیک کنه
- **کیک کردن بازیکن** – ادمین می‌تونه با دکمه ❌ کنار اسمشون بازیکن‌ها رو از میز بیرون کنه
- **بازگشت به لابی** – از میز خارج بشید و بدون قطع شدن برگردید به لیست لابی

### 🎮 گیم‌پلی اصلی (Core Gameplay)
- قوانین کامل تگزاس هولدم 
- چندنفره **Real‑time** از طریق **WebSocket** (2 تا 10 بازیکن در هر میز)
- **حالت تماشاچی (Spectator mode)** – بازی رو تماشا کنید و با چیپ‌های اولیه قابل تنظیم بشینید (به صورت `1000`، `100K`، `1M` نمایش داده میشه)
- ** (Side betting)** – بازیکن‌هایی که فولد دادن می‌تونن روی بازیکن‌های فعال شرط ببنن (50% سود) سیستم طوری طراحی شده که تا جای ممکن اجازه سواستفاد از این مورد رو نده مثل اگه پلیری که برنده میشه با fold دادم حریف برنده بشه کسی چیزی برنده نمیشه از side bet (در اینده توی این سناریو مقدار چیپ به بازیکن برمیگرده فعلا هیچی بر نمیگرده)
- **حالت مسابقه‌ای (Tournament mode)** – چیپ‌ها فقط وقتی یه نفر مونده ریست میشن؛ برنده یک امتیاز می‌گیره و همه با چیپ‌های تازه شروع می‌کنن (هنوز یه سری تغییرات لازم داره و کامل نیست)
- **حالت نقدی (Cash mode)** – چیپ‌ها در طول بازی جمع میشن (بدون ریست اجباری) اما هنوز فرق زیادی با مود تورنومنت نداره 
- **تایمر اکشن خودکار** – 20 ثانیه برای هر دور، چک یا فولد خودکار وقتی تایم تمام شد، از طریق یک نوار رنگی عمودی کنار بازیکن فعال قابل مشاهده است
- **نوار تایمر رنگی** – نوار عمودی کنار بازیکن فعال (آبی >15s، سبز >10s، زرد >5s، قرمز ≤5s)
- **مکث / ادامه** – هر وقت دوست داشتید بازی رو متوقف کنید (تایمرهای فولد خودکار متوقف میشن)

### 🎨 ظاهر و تجربه کاربری (Visual & UX)
- **6 تم خفن** با پس‌زمینه خالص CSS (بدون فایل خارجی):
  - `Classic` · `Cyberpunk` · `Fantasy` · `Midnight` · `Neon Jungle` · `Void Pulse`
- **شخصی‌سازی پشت کارت** (6 طرح) – توی `localStorage` ذخیره میشه
- **زاویه دید** – ثابت (صندلی شما همیشه پایین)، یا پویا (چرخنده)، قابل تنظیم در تنظیمات
- **انیمیشن‌های پیشرفته**:
  - نمایش کارت‌های مشترک با اسپین 3D
  - حرکت چیپ‌ها با مسیر پارابولیک و پرش (ادد شده اما یکم باگ های ظاهری داره بعضی وقتا به زودی فیکس میشه)
  - متن دست برنده با فونت و رنگ مخصوص تم، محو شدن نرم
  - نمایش کارت‌های مشترک All‑in با تأخیر (2 ثانیه بین فلوپ، ترن، ریور برای هیجان)
- **اندازه میز** بهینه شده برای دید تمیز (شکل بیضی، واکنش‌گرا)
### 🔊 جلوه‌های صوتی (Web Audio API)
- **نیازی به فایل صوتی نیست** – همه صداها زنده با Web Audio API تولید میشن
- و مطمعنا دکمه قطع صدا XD 
### 📊Noob Mode
- وقتی **حالت من نوب سگم** فعال باشه، یک **نوار احتمال زنده** ظاهر میشه که شانس بردن دست رو نشون میده
- شبیه‌سازی مونت کارلو با **2000 بار اجرا**، کاملاً روی کلاینت اجرا میشه
- نوار رنگی: **سبز** (احتمال کم) → **نارنجی** (متوسط) → **قرمز** (احتمال زیاد)
- پنل مستقیماً داخل کارت بازیکن خودتون ظاهر میشه، بدون اینکه میز رو بپوشونه
### 🏆 دستاوردها (Achievements)
- **8 دستاورد منحصر به فرد** که باز میشن و یک نوتیفیکیشن نمایش میدن:
  - `First Blood` – اولین پات رو ببرید
  - `Hat Trick` – 3 پات پشت سر هم ببرید
  - `High Roller` – یه پات بالای 500 چیپ ببرید
  - `Royal Touch` – با یک Royal Flush ببرید
  - `Bluff Master` – با یک High Card ببرید
  - `All‑In King` – وقتی All‑in هستید برنده بشید
  - `Sheriff` – یه بازیکن رو حذف کنید
  - `Veteran` – 10 دور بازی کنید
### 💬 چت و حباب‌های گفتار (Chat & Speech Bubbles)
- چت میز با **تاریخچه دائمی** 
- **حباب‌های گفتار** چند ثانیه بالای صندلی فرستنده ظاهر میشن
- پیام‌های سیستمی برای ورود، بردها، شرط‌های جانبی، مکث‌ها، دستاوردها و غیره
- **باز/بستن خودکار** چت وقتی یک پیام سیستمی میاد (تایم‌اوت 5 ثانیه)
### 👤 آمار و تاریخچه بازیکن (Player Stats & History)
- با کلیک روی اسامی لیدر بورد در بالا سمت چپ که موارد زیر رو نشون میده:
  - دورهای بازی شده، پات‌های برده، باخت‌ها، بزرگترین پات، بهترین دست، نرخ برد
- آمار بعد از هر دور بازی به‌روز میشن
- **تاریخچه دست های میز** – دورهای اخیر رو از منوی تنظیمات ببینید
### 🛡️ بهبودهای دیگر (Other Improvements)
- نام‌های تکراری بازیکن جلوگیری میشه
- پیام‌های مکث/ادامه نشون میدن چه کسی کار رو انجام داده
- پنل تنظیمات وقتی محتوا زیاد میشه اسکرول میشه
- چت و تنظیمات حتی وقتی بازی متوقف شده هم کاملاً قابل مشاهده هستن
- لابی‌ها وقتی خالی میشن به طور خودکار حذف میشن
---
## 🚀 راه شروع سریع (Quick Start)
### پیش‌نیازها (Prerequisites)
- Node.js ≥ 16
- npm یا yarn
### نصب (Installation)
```bash
git clone https://github.com/opadips/Elite-Poker.git
cd Elite-Poker
```
**بک‌اند (سرور WebSocket)**
```bash
cd backend
npm install   # یا yarn
node server.js
```
سرور روی `ws://0.0.0.0:3000` اجرا میشه.
**فرانت‌اند (React + Vite)**
```bash
cd ../frontend
npm install
npm run dev
```
به `http://localhost:5173` (یا آدرس LAN خودتون) بروید و شروع به بازی کنید.
---
## 🕹️ نحوه بازی (How to Play)

### 1. ورود و پیوستن
- **یک نام کاربری** (حداکثر 15 کاراکتر) وارد کنید و روی **Enter Lobby** کلیک کنید.
- لیست لابی رو چک کنید یا یک **میز جدید بسازید**.
  - اسم میز، رمز عبور اختیاری، بلیزها، چیپ اولیه (تا 1M)، و حالت بازی (مسابقه/نقدی) رو تنظیم کنید.
- روی یه میز کلیک کنید تا بهش بپیونید. اگه رمز عبورتون هست، وارد کنید.

### 2. شروع بازی
- شما به عنوان **تماشاچی** وارد میشید – روی **Sit In** (پایین سمت راست) کلیک کنید تا با چیپ‌های اولیه میز به بازی بپیونید.
- وقتی توی دور بازی نیستید، از دکمه **Ready** (پایین سمت راست) استفاده کنید تا نشون بدید آماده‌اید.
  - وقتی آماده بودید، یه نور سبز دور صندلی شما ظاهر میشه.
  - وقتی همه بازیکن‌های فعال آماده بودن، اولین دور بازی به طور خودکار شروع میشه.

### 3. انجام حرکت
- توی نوبت خودتون، از دکمه‌های اکشن (Fold, Check, Call, Raise, All‑in) استفاده کنید.
- بازیکن‌های خسته میتونن از طریق پنلی که ظاهر میشه، روی بازیکن‌های فعال شرط جانبی ببنن.

### 4. بررسی و تنظیمات
- از منوی **⚙️ Settings** برای:
  - تغییر تم، پشت کارت، نمای صندلی، صدا، حالت مبتدی (Noob Mode)، متوقف کردن بازی، دیدن تاریخچه دست، یا برگشت به لابی استفاده کنید.
- بعد از پایان یه دور بازی، روی **👁️ Show Cards** کلیک کنید تا کارت‌های دستتون رو ببینید.

### 5. کنترل ادمین
- خالق میز میتونه لابی رو ریست کنه یا بازیکن‌ها رو بیرون کنه.

---
## 📂 ساختار پروژه (Project Structure)
```text
Elite-Poker/
├── backend/
│   ├── server.js              # WebSocket server & lobby management
│   ├── LobbyManager.js        # Multi‑table management, waitlist, chat, history
│   ├── handlers/
│   │   ├── lobbyHandlers.js   # WS handlers for lobby operations (create, join, leave, kick, password)
│   │   └── gameHandlers.js    # WS handlers for game actions (action, ready, sitIn, chat, sideBet, pause, resume)
│   ├── utils/
│   │   └── timerUtils.js      # 20s turn timer, auto‑check/fold, time remaining broadcast
│   └── game/
│       ├── Game.js            # Core poker logic, achievements, side pots
│       ├── Player.js          # Player model, stats & state
│       ├── Deck.js            # Card deck
│       ├── HandEvaluator.js   # 7‑card hand evaluation
│       ├── BettingRound.js    # Turn management, betting round logic, all‑in detection, auto‑reveal
│       └── PotManager.js      # Side‑pot calculation, pot distribution, side bet payouts
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Login / Lobby / Game flow, theme control
│   │   ├── LobbyList.jsx      # Lobby list, general chat, online players
│   │   ├── CreateLobbyModal.jsx # Table creation form
│   │   ├── GameTable.jsx      # Main game component (table, players, timer, chat)
│   │   ├── components/
│   │   │   ├── Card.jsx           # Single playing card (face or hidden)
│   │   │   ├── Chat.jsx           # Table chat interface
│   │   │   ├── Leaderboard.jsx    # Expandable player statistics
│   │   │   ├── ActionButtons.jsx  # Fold, Check, Call, Raise, All‑in, Reveal
│   │   │   ├── BettingPanel.jsx   # Side bet panel for folded players
│   │   │   ├── HandInfo.jsx       # Noob‑mode info: hand rank + equity bar
│   │   │   ├── AnimatedChip.jsx   # Chip animation component
│   │   │   ├── PlayerSeat.jsx     # Single player seat (cards, timer, chips, kick button)
│   │   │   ├── SettingsPanel.jsx  # Settings dropdown (theme, card back, sound, etc.)
│   │   │   └── Table.jsx          # Oval table, community cards, pot amount
│   │   ├── hooks/
│   │   │   ├── useSound.js        # Web Audio API sound effects
│   │   │   └── useGameSocket.js   # Central WS listener, processes all incoming messages
│   │   ├── utils/
│   │   │   └── equity.js          # Monte Carlo simulation (2000 trials)
│   │   └── styles/
│   │       ├── themes.css         # 6 visual themes
│   │       └── animations.css     # CSS keyframe animations
│   └── index.html
├── README.md                  # This file (English)
└── README_FA.md               # Persian version
```
---
## 🔧 تکنولوژی‌های استفاده شده (Tech Stack)
| لایه | تکنولوژی |
|---|---|
| فرانت‌اند | React 18, Vite, Tailwind CSS |
| بک‌اند | Node.js, Express, ws |
| صدا | Web Audio API (بدون فایل) |
| انیمیشن‌ها | CSS keyframes, cubic‑bezier transitions |
| Real‑time | WebSocket (دو طرفه) |
---
## 🌈 شخصی‌سازی (Customisation)
- **افزودن تم جدید** – `themes.css` رو ویرایش کنید و یک ورودی جدید توی آرایه `themes` داخل `GameTable.jsx` اضافه کنید.
- همه رنگ‌های وابسته به تم توسط پراپرتی‌های سفارشی CSS کنترل میشن (`--table-bg`, `--winner-text`, و غیره).
- پشت کارت‌ها و گزینه‌های شخصی‌سازی دیگه توی `localStorage` ذخیره میشن تا باقی بمونن.

---
و اینکه من برای ساخت این پروژه تا اینحا از مدل های خیلی زیادی کمک گرفتم مثل:
`Qwen3.6` `gemma-4` `deepseek` 
---
## 🤝 مشارکت (Contributing)
مشکل برایت پیش امده کسکم؟؟
1 - ببین ایا اخرین اپدیت رو داری؟ میتونی با 'update-Elite-poker.bat' اپدیت کنی 
احتمالا مشکل با اپدیت رفع شده بشه چون خیلی سریع باگ هارو پیدا و فیکس میکنم معمولا و همیشه یه نسخه هست که اپدیت نکردی 
2 - هنوز مشکلت وجود داره؟؟ هممم گزارش بده توی سریع ترین مدت فیکسش میکنم
با گزارش دادن باگ ها یا پیشنهاداتون کمک کنید پروژه رو بی نقص کنیم :)
