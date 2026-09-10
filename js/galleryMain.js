/**
 * ============================================================================
 * GALLERY PAGE BOOTSTRAP SCRIPT
 * ============================================================================
 * Location: /js/galleryMain.js
 * Purpose: Entry point for the Gallery webpage (pages/gallery.html).
 *          Loads save data, renders top menu and Cosmic Occasions chance UI.
 * ============================================================================
 */

import { renderMenu } from './ui/menu.js';
import { renderGalleryUI } from './ui/galleryUI.js';
import { optionsManager } from './options/options.js';
import { loadGame } from './save/load.js';
import { saveGame } from './save/save.js';
import { gameEngine } from './core/game.js';

/**
 * Initialize Gallery Page
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

    // 5. Render Gallery UI container
    renderGalleryUI('gallery-ui-container');

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
