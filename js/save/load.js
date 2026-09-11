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
import { calculateAndApplyOfflineProgress } from '../systems/offlineProgress.js';
import { checkAndShowOfflineModal } from '../ui/offlineModal.js';

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
        const isR4PowerBonusActive = (rebirthCount >= 4) || (parsedState.rebirthUpgrades && parsedState.rebirthUpgrades.r4_power_bonus) || false;
        const isR5PowerBonusActive = (rebirthCount >= 5) || (parsedState.rebirthUpgrades && parsedState.rebirthUpgrades.r5_power_bonus) || false;

        const loadedCurrency = (typeof parsedState.currency === 'number' && !isNaN(parsedState.currency))
            ? parsedState.currency
            : (typeof parsedState.points === 'number' && !isNaN(parsedState.points) ? parsedState.points : 0);

        const loadedStardust = (typeof parsedState.stardust === 'number' && !isNaN(parsedState.stardust))
            ? parsedState.stardust
            : 0;

        const safeState = {
            rebirthCount: 0,
            currency: loadedCurrency,
            points: loadedCurrency,
            stardust: loadedStardust,
            stardustUpgrades: parsedState.stardustUpgrades || {},
            generators: { condenser: 0, extractor: 0, reactor: 0, core: 0, singularity: 0 },
            advancedClickingUnlocked: (rebirthCount >= 1 || parsedState.advancedClickingUnlocked || false),
            autoclickUnlocked: true,
            autoclickEnabled: parsedState.autoclickEnabled || false,
            cosmicEventsUnlocked: (rebirthCount >= 3 || parsedState.cosmicEventsUnlocked || false),
            rebirthUpgrades: { 
                efficient_instinct: isEfficientInstinctActive,
                r4_power_bonus: isR4PowerBonusActive,
                r5_power_bonus: isR5PowerBonusActive
            },
            ...parsedState,
            currency: loadedCurrency,
            points: loadedCurrency,
            stardust: loadedStardust,
            stardustUpgrades: parsedState.stardustUpgrades || {},
            generators: {
                condenser: 0,
                extractor: 0,
                reactor: 0,
                core: 0,
                singularity: 0,
                ...(parsedState.generators || {})
            },
            advancedClickingUnlocked: (rebirthCount >= 1 || parsedState.advancedClickingUnlocked || false),
            autoclickUnlocked: true,
            autoclickEnabled: parsedState.autoclickEnabled || false,
            cosmicEventsUnlocked: (rebirthCount >= 3 || parsedState.cosmicEventsUnlocked || false),
            cosmicEventState: parsedState.cosmicEventState || null,
            rebirthUpgrades: {
                efficient_instinct: isEfficientInstinctActive,
                r4_power_bonus: isR4PowerBonusActive,
                r5_power_bonus: isR5PowerBonusActive,
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
            },
            badges: parsedState.badges || {},
            badgeUpgrades: parsedState.badgeUpgrades || {},
            tower: {
                unlocked: (rebirthCount >= 5) || (parsedState.tower && parsedState.tower.unlocked) || false,
                currentFloor: (parsedState.tower && parsedState.tower.currentFloor) || 1,
                highestFloor: (parsedState.tower && parsedState.tower.highestFloor) || 1,
                damageUpgradeLevel: (parsedState.tower && parsedState.tower.damageUpgradeLevel) || 0,
                tickets: (parsedState.tower && typeof parsedState.tower.tickets === 'number') ? parsedState.tower.tickets : 10,
                maxTickets: 10,
                lastTicketRecoveryTime: (parsedState.tower && parsedState.tower.lastTicketRecoveryTime) || Date.now(),
                floor1BaseHP: (parsedState.tower && parsedState.tower.floor1BaseHP) || 0,
                enemy: (parsedState.tower && parsedState.tower.enemy) || null,
                bonuses: {
                    clickPower: 0,
                    pointGen: 0,
                    stardust: 0,
                    ...((parsedState.tower && parsedState.tower.bonuses) || {})
                },
                combatLog: (parsedState.tower && Array.isArray(parsedState.tower.combatLog)) ? parsedState.tower.combatLog : []
            }
        };

        // Calculate and apply offline ticket recovery for Infinity Tower (1 ticket every 15 min up to 10 max)
        if (safeState.tower) {
            const now = Date.now();
            const lastTime = safeState.tower.lastTicketRecoveryTime || now;
            const elapsed = Math.max(0, now - lastTime);
            const intervalMs = 15 * 60 * 1000;
            const gained = Math.floor(elapsed / intervalMs);
            if (gained > 0 && safeState.tower.tickets < safeState.tower.maxTickets) {
                const newTickets = Math.min(safeState.tower.maxTickets, safeState.tower.tickets + gained);
                safeState.tower.tickets = newTickets;
                if (newTickets >= safeState.tower.maxTickets) {
                    safeState.tower.lastTicketRecoveryTime = now;
                } else {
                    safeState.tower.lastTicketRecoveryTime = lastTime + (gained * intervalMs);
                }
            }
        }

        // Process and apply offline progress gains (max 24 hours) from Generators and Autoclicker
        calculateAndApplyOfflineProgress(safeState);

        stateManager.setState(safeState);
        console.log('Game Progress Loaded Successfully.');

        // Trigger Offline Progress Modal popup if offline gains occurred
        if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => checkAndShowOfflineModal());
            } else {
                setTimeout(checkAndShowOfflineModal, 150);
            }
        }

        return true;
    } catch (err) {
        console.error('Failed to load game state from storage:', err);
        return false;
    }
}
