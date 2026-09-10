# Forever Incremental

A modular incremental game built with vanilla HTML, CSS, and modern JavaScript (ES Modules).

## Highlights & Features
- **Unified Currency ("Points")**: Standardized all game currency terminology across UI cards, upgrade descriptions, HUDs, and notifications.
- **Points Per Second (+X/s) Rate Counter**: Real-time Points Per Second rate display rendered next to the main points balance on [`pages/game.html`](file:///d:/Coding%20Project/Forever%20Incremental/pages/game.html).
- **Compact Number Notation Setting (1M, 1B, 1T... up to Qng & Scientific Notation)**: Central number formatting engine ([`js/utils/format.js`](file:///d:/Coding%20Project/Forever%20Incremental/js/utils/format.js)) supporting compact suffixes (`1.50K`, `2.30M`, `4.10B`, `10.00T`, `1.00Dc`, `1.00Ud`, `1.00Vg`, `1.00Qng`...) and automatic scientific notation fallback for astronomical numbers.
- **10 Conceptual Clicking Upgrades System**: Fully integrated progression system on [`pages/upgrades.html`](file:///d:/Coding%20Project/Forever%20Incremental/pages/upgrades.html):
  1. **Mechanical Advantage** (10 Points): +100% Click Power multiplier
  2. **Kinetic Transfer** (100 Points): +3 flat Click Power
  3. **Focused Impact** (1,000 Points): +15% Click Power multiplier
  4. **Resonant Force** (10,000 Points): Every 10th manual click deals 3x normal click damage
  5. **Momentum** (100,000 Points): Consecutive clicks increase Click Power by 1%, stacking up to 25x (+25% max)
  6. **Critical Mass** (1,000,000 Points): +5% Critical Chance, Critical Clicks deal 5x damage
  7. **Overclocking** (12,500,000 Points): Consecutive clicks increase click speed by 2%, stacking up to 15x (+30% max)
  8. **Feedback Loop** (150,000,000 Points): 5% of current passive income is added to every manual click
  9. **Singularity** (2,000,000,000 Points): Every 100th manual click triggers 10x global production burst for 5s
  10. **Conceptual Breakthrough** (50,000,000,000 Points): +1% Click Power for every 1,000 total lifetime manual clicks (persists through Rebirth)
- **Central Layered Stat Architecture**: Non-hardcoded stat calculator in `/js/upgrades/upgrades.js` (`calculateClickReward`) supporting base stats, flat bonuses, multipliers, runtime stacks decay, and special click events.
- **Lofi Background Music (BGM) System**: 3 procedurally synthesized lofi music tracks stored in `/assets/sounds/bgm/` (`track1.wav`, `track2.wav`, `track3.wav`) with soundtrack selector under Options.
- **Clean Main Menu & Sub-page Navigation**: Main menu buttons on `index.html` take the player to dedicated sub-pages (`pages/game.html`, `pages/upgrades.html`, `pages/options.html`, `pages/save.html`) with clear **`⬅ Back to Main Menu`** return navigation.
- **Web Cache & LocalStorage Persistence**: State is persisted in LocalStorage with automatic SessionStorage / Web Cache fallback.
- **Bilingual Internationalization (i18n)**: Switch between **English (🇬🇧)** and **Vietnamese (🇻🇳)** anytime under Options.

## Project Structure

```text
incremental-game/
│
├── index.html          # Main Menu landing webpage (Entry point)
├── README.md           # Detailed project documentation
├── run.bat             # 1-Click Windows Web Executor Launcher
├── server.ps1          # Native PowerShell Static HTTP Web Server
├── server.js           # Node.js Static HTTP Web Server (Optional)
├── package.json        # NPM package config & start script
│
├── pages/              # Categorized sub-pages directory
│   ├── game.html       # Active Gameplay page
│   ├── upgrades.html   # Clicking Upgrades shop page
│   ├── options.html    # Game Settings & Language Selection page
│   └── save.html       # Data Save, Load, Export/Import & Reset page
│
├── css/
│   ├── main.css        # Base design tokens, particles & header layout
│   ├── menu.css        # Header navigation & Return button styles
│   └── game.css        # Dashboard cards, hero landing, upgrade shop & options UI styles
│
├── js/
│   ├── main.js         # Main Menu page bootstrap script
│   ├── gameMain.js     # Gameplay page bootstrap script
│   ├── upgradesMain.js # Upgrades page bootstrap script
│   ├── optionsMain.js  # Options page bootstrap script
│   ├── saveMain.js     # Data Save/Load page bootstrap script
│   │
│   ├── utils/          # Utility functions
│   │   └── format.js   # Central number formatter (1K, 1M, 1B, 1T...)
│   │
│   ├── audio/          # Background Music & Sound FX System
│   │   └── audioManager.js # BGM soundtrack loops & click sound FX
│   │
│   ├── core/           # Core engine & state
│   │   ├── game.js     # Ticker loop & lifecycle
│   │   ├── state.js    # Central state container (pub/sub)
│   │   └── constants.js# Game configuration & initial values
│   │
│   ├── upgrades/       # Upgrade script system & central calculation engine
│   │   └── upgrades.js # 10 conceptual clicking upgrades, runtime decay & layered stat calculator
│   │
│   ├── i18n/           # Internationalization engine
│   │   ├── i18n.js     # Translation helper functions
│   │   └── translations.js # EN & VI translation dictionaries
│   │
│   ├── options/        # Options state manager
│   │   └── options.js  # Settings store (sound, BGM, particles, compact numbers, auto-save, language)
│   │
│   ├── systems/        # Game mechanics
│   │   ├── click.js    # Manual click handler & visual feedback
│   │   ├── currency.js # Resource points & ticks
│   │   ├── rebirth.js  # Rebirth prestige mechanics & upgrade reset filtering
│   │   └── progression.js # Achievements & milestone checks
│   │
│   ├── save/           # Persistence layer
│   │   ├── save.js     # LocalStorage save serializer
│   │   └── load.js     # LocalStorage deserializer
│   │
│   └── ui/             # UI Components
│       ├── homeUI.js   # Main menu landing page renderer
│       ├── gameUI.js   # Active game dashboard renderer with PPS (+X/s) rate counter
│       ├── upgradesUI.js# Upgrades shop panel renderer with HUD & purchase actions
│       ├── optionsUI.js# Settings panel renderer
│       ├── dataUI.js   # Data storage panel renderer
│       ├── menu.js     # Header navigation & Return button renderer
│       └── notifications.js # Toast notifications renderer
│
├── assets/             # Media assets
│   ├── images/
│   │   └── logo.png    # Minimalist AI-generated game logo
│   ├── icons/
│   └── sounds/
│       └── bgm/        # Lofi Background Music Soundtrack Files
│           ├── track1.wav # Midnight Lofi Chill
│           ├── track2.wav # Gentle Rain Clicks
│           └── track3.wav # Cosmic Idle Groove
│
└── docs/               # Technical & Design docs
    ├── game-design.md
    ├── systems.md
    ├── balance.md
    └── changelog.md
```

## How to Run

1. Double-click **`run.bat`** (or execute `powershell -ExecutionPolicy Bypass -File server.ps1` in terminal).
2. Open **[http://localhost:3000/](http://localhost:3000/)** in your browser.
