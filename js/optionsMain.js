/**
 * ============================================================================
 * OPTIONS PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/optionsMain.js
 * Purpose: Entry point for the Options & Settings webpage (pages/options.html).
 * ============================================================================
 */

import { renderMenu } from './ui/menu.js';
import { renderOptionsUI } from './ui/optionsUI.js';
import { optionsManager } from './options/options.js';
import { loadGame } from './save/load.js';
import { saveGame } from './save/save.js';

/**
 * Initialize Options Page
 */
function init() {
    // 1. Apply user preference settings
    optionsManager.applySettings();

    // 2. Load saved game state
    loadGame();

    // 3. Render header banner with "⬅ Back to Main Menu" return button
    renderMenu('menu-container');

    // 4. Render Settings controls (Audio, Particles, Language selector)
    renderOptionsUI('options-ui-container');

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

