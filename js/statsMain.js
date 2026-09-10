/**
 * ============================================================================
 * STATISTICS PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/statsMain.js
 * Purpose: Entry point for the Statistics webpage (pages/stats.html).
 *          Loads save data, renders header menu, mounts statistics UI dashboard,
 *          and starts the game loop engine for live telemetry updates.
 * ============================================================================
 */

import { gameEngine } from './core/game.js';
import { loadGame } from './save/load.js';
import { saveGame } from './save/save.js';
import { renderMenu } from './ui/menu.js';
import { renderStatsUI } from './ui/statsUI.js';
import { optionsManager } from './options/options.js';

/**
 * Initialize Statistics Page
 */
function init() {
    // 1. Apply user preference settings
    optionsManager.applySettings();

    // 2. Render header banner navigation
    renderMenu('menu-container');

    // 3. Mount Statistics dashboard UI
    renderStatsUI('stats-ui-container');

    // 4. Restore saved progress from LocalStorage
    loadGame();

    // 5. Start background game engine for live updates
    gameEngine.start();

    // 6. Register auto-save on page unload/navigation
    window.addEventListener('beforeunload', () => saveGame());
    window.addEventListener('pagehide', () => saveGame());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
