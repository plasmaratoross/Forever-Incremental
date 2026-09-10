# Systems Architecture

## 1. Core Engine (`js/core/`)
- `game.js`: Controls main ticker and engine execution loop.
- `state.js`: Centralized pub/sub state container (`StateManager`).
- `constants.js`: System configuration and initial values.

## 2. Game Systems (`js/systems/`)
- `click.js`: Click input calculation and dispatcher.
- `currency.js`: Currency increments and tick rate generators.
- `rebirth.js`: Prestige threshold validation and state reset logic.
- `progression.js`: Achievements and feature unlocking rules.

## 3. Persistence (`js/save/`)
- `save.js`: LocalStorage serialization and auto-save timer.
- `load.js`: LocalStorage deserialization and state restoration.

## 4. UI Layer (`js/ui/`)
- `menu.js`: Navigation UI.
- `gameUI.js`: Primary interactive game dashboard.
- `notifications.js`: Toast notification overlay manager.
