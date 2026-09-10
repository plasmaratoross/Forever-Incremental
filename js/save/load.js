/**
 * ============================================================================
 * LOAD SYSTEM (WEB STORAGE DESERIALIZER)
 * ============================================================================
 * Location: /js/save/load.js
 * Purpose: Deserializes saved JSON data from browser LocalStorage / SessionStorage
 *          into stateManager.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';

const SAVE_KEY = 'forever_incremental_save';

/**
 * Load saved game state from LocalStorage or SessionStorage fallback
 */
export function loadGame() {
    try {
        let rawData = null;

        // Try primary LocalStorage first
        try {
            rawData = localStorage.getItem(SAVE_KEY);
        } catch (e) {
            console.warn('LocalStorage unavailable, attempting SessionStorage fallback...');
        }

        // Fallback to SessionStorage if LocalStorage returned nothing
        if (!rawData) {
            try {
                rawData = sessionStorage.getItem(SAVE_KEY);
            } catch (e) {
                // Ignore fallback error
            }
        }

        if (!rawData) return false;

        const parsedState = JSON.parse(rawData);

        // Remove deprecated rebirthPoints property if present in parsed save
        if ('rebirthPoints' in parsedState) {
            delete parsedState.rebirthPoints;
        }

        const rebirthCount = parsedState.rebirthCount || 0;
        const isEfficientInstinctActive = (rebirthCount >= 2) || (parsedState.rebirthUpgrades && parsedState.rebirthUpgrades.efficient_instinct) || false;

        const safeState = {
            rebirthCount: 0,
            points: 0,
            generators: { condenser: 0, extractor: 0, reactor: 0, core: 0, singularity: 0 },
            advancedClickingUnlocked: (rebirthCount >= 1 || parsedState.advancedClickingUnlocked || false),
            autoclickUnlocked: (rebirthCount >= 3 || parsedState.autoclickUnlocked || false),
            autoclickEnabled: parsedState.autoclickEnabled || false,
            cosmicEventsUnlocked: (rebirthCount >= 3 || parsedState.cosmicEventsUnlocked || false),
            rebirthUpgrades: { efficient_instinct: isEfficientInstinctActive },
            ...parsedState,
            points: parsedState.points || 0,
            generators: {
                condenser: 0,
                extractor: 0,
                reactor: 0,
                core: 0,
                singularity: 0,
                ...(parsedState.generators || {})
            },
            advancedClickingUnlocked: (rebirthCount >= 1 || parsedState.advancedClickingUnlocked || false),
            autoclickUnlocked: (rebirthCount >= 3 || parsedState.autoclickUnlocked || false),
            autoclickEnabled: parsedState.autoclickEnabled || false,
            cosmicEventsUnlocked: (rebirthCount >= 3 || parsedState.cosmicEventsUnlocked || false),
            rebirthUpgrades: {
                efficient_instinct: isEfficientInstinctActive,
                ...(parsedState.rebirthUpgrades || {})
            },
            stats: {
                totalClicks: 0,
                totalClicksAll: 0,
                totalCurrencyEarned: 0,
                totalPointsEarned: 0,
                playtime: 0,
                highestPPS: 0,
                highestRebirth: rebirthCount,
                totalRebirths: rebirthCount,
                eventsActivated: 0,
                timeInEvents: 0,
                ...(parsedState.stats || {})
            },
            achievements: {
                loreUnlocked: {},
                ...(parsedState.achievements || {})
            }
        };

        stateManager.setState(safeState);
        console.log('Game Progress Loaded Successfully.');
        return true;
    } catch (err) {
        console.error('Failed to load game state from storage:', err);
        return false;
    }
}
