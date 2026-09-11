/**
 * ============================================================================
 * GAMEPLAY PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/gameMain.js
 * Purpose: Entry point for the active gameplay webpage (pages/game.html).
 *          Loads save data, initialises dashboard, and starts the game loop.
 * ============================================================================
 */

import { gameEngine } from './core/game.js';
import { loadGame } from './save/load.js';
import { saveGame } from './save/save.js';
import { renderMenu } from './ui/menu.js';
import { renderGameUI } from './ui/gameUI.js';
import { showNotification } from './ui/notifications.js';
import { optionsManager } from './options/options.js';
import { t } from './i18n/i18n.js';

/**
 * Initialize Gameplay Page
 */
function init() {
    // 1. Apply user preference settings
    optionsManager.applySettings();

    // 2. Restore saved progress from LocalStorage if available
    const loaded = loadGame();

    // 3. Render header banner with "⬅ Back to Main Menu" return button
    renderMenu('menu-container');

    // 4. Render active game dashboard (clicker, point counter, rebirth)
    renderGameUI('game-ui-container');

    if (loaded) {
        showNotification(t('saveLoadedMsg'));
    } else {
        showNotification(t('welcomeMsg'));
    }

    // 5. Start game loop ticker
    gameEngine.start();

    // 6. Register auto-save on page unload/navigation
    window.addEventListener('beforeunload', () => saveGame());
    window.addEventListener('pagehide', () => saveGame());
}

// Ensure execution occurs whether DOM is loading or already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
