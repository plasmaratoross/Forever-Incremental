/**
 * ============================================================================
 * SAVE SYSTEM (WEB STORAGE & CACHE SERIALIZER)
 * ============================================================================
 * Location: /js/save/save.js
 * Purpose: Serializes stateManager state to JSON and persists it to browser
 *          LocalStorage with fallback to SessionStorage / Web Cache.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { GAME_CONFIG } from '../core/constants.js';
import { optionsManager } from '../options/options.js';

const SAVE_KEY = 'forever_incremental_save';
let autoSaveIntervalId = null;

/**
 * Helper to check Web Storage availability
 */
function isLocalStorageAvailable() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Save current state to Web LocalStorage or SessionStorage Cache fallback
 */
export function saveGame() {
    try {
        const state = stateManager.getState();
        const data = JSON.stringify(state);

        if (isLocalStorageAvailable()) {
            localStorage.setItem(SAVE_KEY, data);
        } else {
            // Web Cache / SessionStorage fallback if LocalStorage is disabled
            sessionStorage.setItem(SAVE_KEY, data);
        }
        console.log('Game Progress Saved Successfully.');
        return true;
    } catch (err) {
        console.error('Failed to save game state to web storage:', err);
        return false;
    }
}

/**
 * Start recurring background auto-save interval timer (controlled by options)
 */
export function autoSaveGame() {
    if (autoSaveIntervalId) clearInterval(autoSaveIntervalId);

    autoSaveIntervalId = setInterval(() => {
        // Check if Auto-Save is enabled in user settings
        const isAutoSaveOn = optionsManager.get('autoSaveEnabled');
        if (isAutoSaveOn !== false) {
            saveGame();
        }
    }, GAME_CONFIG.AUTO_SAVE_INTERVAL);
}
