/**
 * ============================================================================
 * MAIN MENU PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/main.js
 * Purpose: Entry point for the root Main Menu landing page (index.html).
 * ============================================================================
 */

import { renderMenu } from './ui/menu.js';
import { renderHomeUI } from './ui/homeUI.js';
import { optionsManager } from './options/options.js';
import { loadGame } from './save/load.js';
import { syncCosmicRuntimeWithState, tickCosmicEventsEngine } from './systems/cosmicEvents.js';

/**
 * Initialize Main Menu Landing Page
 */
function init() {
    // 1. Apply user preference settings (e.g., particle FX)
    optionsManager.applySettings();

    // 2. Load saved game state & sync cosmic occasion visual themes to main menu
    loadGame();
    syncCosmicRuntimeWithState();
    tickCosmicEventsEngine();

    // Ticker to keep cosmic occasion state updated while on main menu
    setInterval(() => {
        tickCosmicEventsEngine();
    }, 1000);

    // 3. Render header banner navigation
    renderMenu('menu-container');

    // 4. Render Main Menu buttons and beginner guide
    renderHomeUI('home-ui-container');
}

// Ensure execution occurs whether DOM is loading or already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

