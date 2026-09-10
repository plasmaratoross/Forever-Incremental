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

/**
 * Initialize Data Management Page
 */
function init() {
    // 1. Apply user preference settings
    optionsManager.applySettings();

    // 2. Load saved game state
    loadGame();

    // 3. Render header banner with "⬅ Back to Main Menu" return button
    renderMenu('menu-container');

    // 4. Render Data controls (Manual save, export/import code, hard reset)
    renderDataUI('data-ui-container');

    // 5. Register auto-save on page unload/navigation
    window.addEventListener('beforeunload', () => saveGame());
    window.addEventListener('pagehide', () => saveGame());
}

// Ensure execution occurs whether DOM is loading or already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

