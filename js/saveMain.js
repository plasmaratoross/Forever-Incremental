/**
 * ============================================================================
 * DATA / SAVE PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/saveMain.js
 * Purpose: Entry point for Data & Storage webpage (pages/save.html).
 * ============================================================================
 */

import { renderMenu } from './ui/menu.js';
import { renderDataUI } from './ui/dataUI.js';
import { optionsManager } from './options/options.js';
import { loadGame } from './save/load.js';
import { saveGame } from './save/save.js';
import { gameEngine } from './core/game.js';

/**
 * Initialize Data Management Page
 */
function init() {
    // 1. Apply user preference settings
    optionsManager.applySettings();

    // 2. Load saved game state
    loadGame();

    // 3. Start game ticker engine
    gameEngine.start();

    // 4. Render header banner navigation
    renderMenu('menu-container');

    // 5. Render Data controls (Manual save, export/import code, hard reset)
    renderDataUI('data-ui-container');

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

