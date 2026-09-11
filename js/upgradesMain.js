/**
 * ============================================================================
 * UPGRADES PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/upgradesMain.js
 * Purpose: Entry point for the Clicking Upgrades webpage (pages/upgrades.html).
 * ============================================================================
 */

import { renderMenu } from './ui/menu.js';
import { renderUpgradesUI } from './ui/upgradesUI.js';
import { optionsManager } from './options/options.js';
import { loadGame } from './save/load.js';
import { saveGame } from './save/save.js';
import { gameEngine } from './core/game.js';

/**
 * Initialize Upgrades Page
 */
function init() {
    // 1. Apply user preference settings
    optionsManager.applySettings();

    // 2. Restore saved points balance and upgrades state from LocalStorage
    loadGame();

    // 3. Start game loop ticker so points continue generating passively
    gameEngine.start();

    // 4. Render header banner with navigation
    renderMenu('menu-container');

    // 5. Render Clicking Upgrades UI container
    renderUpgradesUI('upgrades-ui-container');

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

