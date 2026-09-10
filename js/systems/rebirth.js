import { stateManager } from '../core/state.js';
import { INITIAL_STATE } from '../core/constants.js';
import { saveGame } from '../save/save.js';
import { showNotification } from '../ui/notifications.js';
import { CLICK_UPGRADES, runtimeState } from '../upgrades/upgrades.js';
import { GENERATOR_DEFS } from './generators.js';

/**
 * Calculate dynamic Rebirth difficulty multiplier based on rebirthCount
 * Rebirth 0: 1.00x
 * Rebirth 1: 1.10x
 * Rebirth 2: 1.20x
 * Rebirth 3: 1.30x
 * Rebirth 4: 1.40x
 * @param {number} rebirthCount - Total rebirths performed
 * @returns {number} Dynamic upgrade cost difficulty multiplier
 */
export function getRebirthDifficultyMultiplier(rebirthCount = 0) {
    if (rebirthCount === 0) return 1.00;
    if (rebirthCount === 1) return 1.10;
    if (rebirthCount === 2) return 1.20;
    if (rebirthCount === 3) return 1.30;
    return 1.0 + (rebirthCount * 0.10);
}

/**
 * Get total required click upgrades & generator levels needed for current Rebirth tier
 * Rebirth 0 -> 10 (10 Basic Upgrades)
 * Rebirth 1 -> 13 (10 Basic + 3 Advanced Upgrades)
 * Rebirth 2 -> 50 (Sum of 5 Point Generator levels, 10 levels each)
 * Rebirth 3 -> 145 (20 Click Upgrades + 125 Generator levels)
 * Rebirth 4+ -> 145 (or maximum target)
 * @param {Object} [state] - Optional state snapshot
 * @returns {Object} Requirements details object { clickTarget, genTarget, distinctEventsTarget }
 */
export function getRebirthRequirements(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;

    if (rebirthCount === 0) {
        return { clickTarget: 10, genTarget: 0, distinctEventsTarget: 0 };
    }
    if (rebirthCount === 1) {
        return { clickTarget: 13, genTarget: 0, distinctEventsTarget: 0 };
    }
    if (rebirthCount === 2) {
        return { clickTarget: 0, genTarget: 50, distinctEventsTarget: 0 };
    }
    // Rebirth 3 -> 4
    return { clickTarget: 20, genTarget: 125, distinctEventsTarget: 4 };
}

/**
 * Legacy support for total required upgrade target number
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Required numerical target
 */
export function getTotalRequiredUpgrades(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount === 0) return 10;
    if (rebirthCount === 1) return 13;
    if (rebirthCount === 2) return 50;
    return 145; // Sum of click & generator requirements for Rebirth 3 -> 4
}

/**
 * Count total purchased click upgrades ONLY (out of 26 max)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Count of purchased click upgrades
 */
export function getPurchasedClickUpgradesCount(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.upgrades || {};
    let count = 0;
    CLICK_UPGRADES.forEach(u => {
        if (purchased[u.id]) count++;
    });
    return count;
}

/**
 * Get total available click upgrades for player's current Rebirth tier
 * Rebirth 0 -> 10 (10 Basic)
 * Rebirth 1-2 -> 13 (10 Basic + 3 Advanced)
 * Rebirth 3 -> 20 (10 Basic + 3 Advanced + 7 Cosmic)
 * Rebirth 4+ -> 26 (10 Basic + 3 Advanced + 7 Cosmic + 6 Transcendent)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Total click upgrades target for current tier
 */
export function getTotalClickUpgradesCount(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount === 0) return 10;
    if (rebirthCount <= 2) return 13;
    if (rebirthCount === 3) return 20;
    return 26;
}

/**
 * Count total purchased generator levels
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Total generator levels
 */
export function getPurchasedGenLevelsCount(state) {
    const currentState = state || stateManager.getState();
    const gens = currentState.generators || {};
    let genTotal = 0;
    GENERATOR_DEFS.forEach(g => {
        genTotal += (gens[g.id] || 0);
    });
    return genTotal;
}

/**
 * Get total available generator levels for player's current Rebirth tier
 * Rebirth 0-1 -> 0
 * Rebirth 2 -> 50 (5 gens x 10 levels)
 * Rebirth 3 -> 125 (5x10 + 5x15)
 * Rebirth 4+ -> 265 (5x10 + 5x15 + 7x20)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Total generator levels available
 */
export function getTotalGenLevelsCount(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount < 2) return 0;
    if (rebirthCount === 2) return 50;
    if (rebirthCount === 3) return 125;
    return 265;
}

/**
 * Count total purchased click upgrades or generator levels for current Rebirth target
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Purchased count or generator total level
 */
export function getPurchasedUpgradesCount(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount === 2) return getPurchasedGenLevelsCount(currentState);
    if (rebirthCount >= 3) return getPurchasedClickUpgradesCount(currentState) + getPurchasedGenLevelsCount(currentState);
    return getPurchasedClickUpgradesCount(currentState);
}

/**
 * Get total number of distinct Cosmic Events encountered by player
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Unique events count
 */
export function getDistinctCosmicEventsCount(state) {
    const currentState = state || stateManager.getState();
    const stats = currentState.stats || {};
    const discovered = stats.eventsDiscovered || {};
    return Object.keys(discovered).length;
}

/**
 * Check if player meets all requirements to perform current Rebirth tier
 * @param {Object} [state] - Optional state snapshot
 * @returns {boolean} True if all requirements met
 */
export function canRebirth(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    const reqs = getRebirthRequirements(currentState);

    // Check Click Upgrades requirement
    if (reqs.clickTarget > 0) {
        const purchased = currentState.upgrades || {};
        let clickCount = 0;
        CLICK_UPGRADES.forEach(u => {
            if (purchased[u.id]) clickCount++;
        });
        if (clickCount < reqs.clickTarget) return false;
    }

    // Check Generator levels requirement
    if (reqs.genTarget > 0) {
        const gens = currentState.generators || {};
        let genTotal = 0;
        GENERATOR_DEFS.forEach(g => {
            // Only count generators available up to current Rebirth level
            if (g.reqRebirth <= rebirthCount) {
                genTotal += (gens[g.id] || 0);
            }
        });
        if (genTotal < reqs.genTarget) return false;
    }

    // Check Distinct Cosmic Events requirement (for Rebirth 3 -> 4)
    if (reqs.distinctEventsTarget > 0) {
        const distinctCount = getDistinctCosmicEventsCount(currentState);
        if (distinctCount < reqs.distinctEventsTarget) return false;
    }

    return true;
}

/**
 * Perform Rebirth reset:
 * - Increments Rebirth Count (0 -> 1 -> 2 -> 3 -> 4)
 * - Rebirth 1: Permanently unlocks Advanced Clicking System
 * - Rebirth 2: Permanently unlocks Efficient Instinct (-15% Upgrade Costs, +25% Click & Gen)
 * - Rebirth 3: Permanently unlocks Autoclick System (5 clicks/sec) & Cosmic Events System
 * - Rebirth 4: Permanently unlocks Cosmic Acceleration (100s cooldown), +14% Event Chance Boost, 2 New Events, 6 Transcendent Click Upgrades, and 7 Transcendent Generators (20 levels each)
 * - Resets run currency & non-persistent upgrades
 * - Preserves Rebirth Count, Permanent Unlocks, Points, Generators, Cosmic Upgrades, and Lifetime stats
 */
export function performRebirth() {
    const currentState = stateManager.getState();
    if (!canRebirth(currentState)) {
        showNotification('Must complete all requirements to Rebirth!');
        return false;
    }

    const currentRebirthCount = currentState.rebirthCount || 0;
    const newRebirthCount = currentRebirthCount + 1;

    // Temporary runtime stacks reset
    runtimeState.momentumStacks = 0;
    runtimeState.overclockStacks = 0;
    runtimeState.singularityEndTime = 0;

    // Permanent Unlocks logic
    const isAdvancedUnlocked = true;
    const isEfficientInstinctUnlocked = newRebirthCount >= 2 || (currentState.rebirthUpgrades && currentState.rebirthUpgrades.efficient_instinct);
    const isAutoclickUnlocked = newRebirthCount >= 3 || !!currentState.autoclickUnlocked;
    const isCosmicEventsUnlocked = newRebirthCount >= 3 || !!currentState.cosmicEventsUnlocked;

    // Preserve upgrades with survivesRebirth: true (e.g. Rebirth 3+ Cosmic Upgrades & Rebirth 4 Transcendent Upgrades)
    const oldUpgrades = currentState.upgrades || {};
    const newUpgrades = {};
    CLICK_UPGRADES.forEach(u => {
        if (u.survivesRebirth && oldUpgrades[u.id]) {
            newUpgrades[u.id] = true;
        }
    });

    const currentStats = currentState.stats || {};

    // Apply Rebirth reset state (Preserving Generators, Cosmic & Transcendent Upgrades, and Lifetime stats)
    stateManager.setState({
        ...INITIAL_STATE,
        rebirthCount: newRebirthCount,
        advancedClickingUnlocked: isAdvancedUnlocked,
        autoclickUnlocked: isAutoclickUnlocked,
        autoclickEnabled: currentState.autoclickEnabled || false,
        cosmicEventsUnlocked: isCosmicEventsUnlocked,
        rebirthUpgrades: {
            efficient_instinct: isEfficientInstinctUnlocked
        },
        upgrades: newUpgrades,
        generators: currentState.generators || {},
        stats: {
            ...currentStats,
            totalRebirths: (currentStats.totalRebirths || currentRebirthCount) + 1,
            highestRebirth: Math.max(currentStats.highestRebirth || currentRebirthCount, newRebirthCount)
        },
        achievements: currentState.achievements || {},
        badges: currentState.badges || {},
        badgeUpgrades: currentState.badgeUpgrades || {}
    });

    saveGame();
    showNotification(`Rebirth ${newRebirthCount} Complete!`);
    return true;
}



