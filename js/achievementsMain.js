/**
 * ============================================================================
 * ACHIEVEMENTS PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/achievementsMain.js
 * Purpose: Entry point for the Achievements webpage (pages/achievements.html).
 * ============================================================================
 */

import { renderMenu } from './ui/menu.js';
import { renderAchievementsUI } from './ui/achievementsUI.js';
import { optionsManager } from './options/options.js';
import { loadGame } from './save/load.js';
import { saveGame } from './save/save.js';
import { gameEngine } from './core/game.js';

/**
 * Initialize Achievements Page
 */
function init() {
    // 1. Apply user preference settings
    optionsManager.applySettings();

    // 2. Restore saved game state from storage
    loadGame();

    // 3. Start game ticker engine for passive background processing
    gameEngine.start();

    // 4. Render header navigation bar
    renderMenu('menu-container');

    // 5. Render Achievements UI container
    renderAchievementsUI('achievements-ui-container');

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
