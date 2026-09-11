import { stateManager } from '../core/state.js';
import { INITIAL_STATE } from '../core/constants.js';
import { saveGame } from '../save/save.js';
import { showNotification } from '../ui/notifications.js';
import { CLICK_UPGRADES, runtimeState } from '../upgrades/upgrades.js';
import { GENERATOR_DEFS } from './generators.js';
import { R3_COSMIC_EVENT_IDS } from './cosmicEvents.js';
import { getStardustPointMult } from './stardust.js';

/**
 * Complete list of the 5 Rebirth 4 Cosmic Occasions (at least 4 required for Rebirth 5 progression)
 */
export const R4_COSMIC_EVENT_IDS = [
    'solitary_star',
    'supernova',
    'quantum_hyper_surge',
    'infinity_convergence',
    'genesis_singularity'
];

/**
 * Calculate dynamic Rebirth difficulty multiplier based on rebirthCount
 * Rebirth 0: 1.00x
 * Rebirth 1: 1.10x
 * Rebirth 2: 1.20x
 * Rebirth 3: 1.30x
 * Rebirth 4: 1.40x
 * Rebirth 5: 1.50x
 * @param {number} rebirthCount - Total rebirths performed
 * @returns {number} Dynamic upgrade cost difficulty multiplier
 */
export function getRebirthDifficultyMultiplier(rebirthCount = 0) {
    if (rebirthCount === 0) return 1.00;
    if (rebirthCount === 1) return 1.10;
    if (rebirthCount === 2) return 1.20;
    if (rebirthCount === 3) return 1.30;
    if (rebirthCount === 4) return 1.40;
    return 1.0 + (rebirthCount * 0.10);
}

/**
 * Get total required click upgrades & generator levels needed for current Rebirth tier
 * Rebirth 0 -> 10 (10 Basic Upgrades)
 * Rebirth 1 -> 13 (10 Basic + 3 Advanced Upgrades)
 * Rebirth 2 -> 50 (Sum of 5 Point Generator levels, 10 levels each)
 * Rebirth 3 -> 145 (20 Click Upgrades + 125 Generator levels + all 7 R3 Cosmic Events)
 * Rebirth 4 -> 291 (26 Click Upgrades + 265 Generator levels + 4 distinct R4 Cosmic Occasions)
 * Rebirth 5+ -> 606 (41 Click Upgrades + 565 Generator levels + 4 R4 Events + x32 Point Multiplier)
 * @param {Object} [state] - Optional state snapshot
 * @returns {Object} Requirements details object
 */
export function getRebirthRequirements(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;

    if (rebirthCount === 0) {
        return { clickTarget: 10, genTarget: 0, distinctEventsTarget: 0, r3EventsRequired: false, r4EventsRequired: false, stardustMultTarget: 0 };
    }
    if (rebirthCount === 1) {
        return { clickTarget: 13, genTarget: 0, distinctEventsTarget: 0, r3EventsRequired: false, r4EventsRequired: false, stardustMultTarget: 0 };
    }
    if (rebirthCount === 2) {
        return { clickTarget: 0, genTarget: 50, distinctEventsTarget: 0, r3EventsRequired: false, r4EventsRequired: false, stardustMultTarget: 0 };
    }
    if (rebirthCount === 3) {
        return { clickTarget: 20, genTarget: 125, distinctEventsTarget: 7, r3EventsRequired: true, r4EventsRequired: false, stardustMultTarget: 0 };
    }
    if (rebirthCount === 4) {
        // Rebirth 4 -> 5: 26 Click Upgrades, 265 Generator levels, and at least 4 distinct R4 Cosmic Occasions
        return { clickTarget: 26, genTarget: 265, distinctEventsTarget: 4, r3EventsRequired: false, r4EventsRequired: true, stardustMultTarget: 0 };
    }
    // Rebirth 5+ Mastery / Ascension
    return { clickTarget: 41, genTarget: 565, distinctEventsTarget: 4, r3EventsRequired: false, r4EventsRequired: true, stardustMultTarget: 32 };
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
    if (rebirthCount === 4) return 26;
    return 41; // 10 Basic + 3 Advanced + 7 Cosmic + 6 Transcendent + 15 Multiplicity
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
 * Rebirth 4 -> 265 (5x10 + 5x15 + 7x20)
 * Rebirth 5+ -> 565 (5x10 + 5x15 + 7x20 + 10x30)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Total generator levels available
 */
export function getTotalGenLevelsCount(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount < 2) return 0;
    if (rebirthCount === 2) return 50;
    if (rebirthCount === 3) return 125;
    if (rebirthCount === 4) return 265;
    return 565;
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
 * Get total number of distinct R3 Cosmic Events encountered by player (out of 7)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Unique R3 events count
 */
export function getR3CosmicEventsDiscoveredCount(state) {
    const currentState = state || stateManager.getState();
    const stats = currentState.stats || {};
    const discovered = stats.eventsDiscovered || {};
    return R3_COSMIC_EVENT_IDS.filter(id => !!discovered[id]).length;
}

/**
 * Check if player has encountered ALL 7 existing Rebirth 3 Cosmic Occasions
 * @param {Object} [state] - Optional state snapshot
 * @returns {boolean} True if all 7 R3 events are discovered
 */
export function hasEncounteredAllR3Events(state) {
    const currentState = state || stateManager.getState();
    const stats = currentState.stats || {};
    const discovered = stats.eventsDiscovered || {};
    return R3_COSMIC_EVENT_IDS.every(id => !!discovered[id]);
}

/**
 * Get total number of distinct R4 Cosmic Events encountered by player (out of 5)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Unique R4 events count
 */
export function getR4CosmicEventsDiscoveredCount(state) {
    const currentState = state || stateManager.getState();
    const stats = currentState.stats || {};
    const discovered = stats.eventsDiscovered || {};
    return R4_COSMIC_EVENT_IDS.filter(id => !!discovered[id]).length;
}

/**
 * Check if player has encountered at least 4 distinct Rebirth 4 Cosmic Occasions
 * @param {Object} [state] - Optional state snapshot
 * @returns {boolean} True if at least 4 distinct R4 events discovered
 */
export function hasEncounteredRequiredR4Events(state) {
    return getR4CosmicEventsDiscoveredCount(state) >= 4;
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

    // Check Distinct R3 Cosmic Events requirement (for Rebirth 3 -> 4: Must encounter ALL 7 R3 Cosmic Occasions)
    if (rebirthCount === 3) {
        if (!hasEncounteredAllR3Events(currentState)) return false;
    }

    // Check Distinct R4 Cosmic Events requirement (for Rebirth 4 -> 5: Must encounter at least 4 distinct R4 Occasions)
    if (rebirthCount === 4) {
        if (!hasEncounteredRequiredR4Events(currentState)) return false;
    }

    // Check Rebirth 5+ Mastery requirements (all R5 Click Upgrades, all R5 Generators, 4 R4 Occasions, and x32 Point Multiplier)
    if (rebirthCount >= 5 && reqs.stardustMultTarget > 0) {
        if (!hasEncounteredRequiredR4Events(currentState)) return false;
        if (getStardustPointMult(currentState) < reqs.stardustMultTarget) return false;
    }

    return true;
}

/**
 * Perform Rebirth reset:
 * - Increments Rebirth Count (0 -> 1 -> 2 -> 3 -> 4 -> 5)
 * - Rebirth 1: Permanently unlocks Advanced Clicking System
 * - Rebirth 2: Permanently unlocks Efficient Instinct (-15% Upgrade Costs, +25% Click & Gen)
 * - Rebirth 3: Permanently unlocks Cosmic Events System
 * - Rebirth 4: Permanently unlocks x2 Clicking Power, x2 Generator Production, Cosmic Acceleration (150s cooldown),
 *             +6% Event Chance Boost, 5 R4 Events, 6 Transcendent Click Upgrades, and 7 Transcendent Generators
 * - Rebirth 5: MULTIPLICITY. Permanently unlocks x4 Clicking Power, x4 Generator Production, 0.1% Super Crit (x100),
 *             Multiplicity Section, Stardust Manual Clicking, Stardust Upgrades (x32 Point Multiplier),
 *             15 Multiplicity Click Upgrades, 10 Multiplicity Generators (30 levels each), 3 R5 Catastrophic Nature Occasions,
 *             and Cosmic Anomaly Cooldown reduction to 75s
 * - Resets run currency & non-persistent upgrades
 * - Preserves Rebirth Count, Permanent Unlocks, Stardust, Stardust Upgrades, Points, Generators, Cosmic/Transcendent/Multiplicity Upgrades, and Lifetime stats
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
    const isAutoclickUnlocked = true;
    const isCosmicEventsUnlocked = newRebirthCount >= 3 || !!currentState.cosmicEventsUnlocked;
    const isR4PowerBonusUnlocked = newRebirthCount >= 4 || (currentState.rebirthUpgrades && currentState.rebirthUpgrades.r4_power_bonus);
    const isR5PowerBonusUnlocked = newRebirthCount >= 5 || (currentState.rebirthUpgrades && currentState.rebirthUpgrades.r5_power_bonus);

    // Preserve upgrades with survivesRebirth: true (e.g. Rebirth 3+ Cosmic, R4 Transcendent, & R5 Multiplicity Upgrades)
    const oldUpgrades = currentState.upgrades || {};
    const newUpgrades = {};
    CLICK_UPGRADES.forEach(u => {
        if (u.survivesRebirth && oldUpgrades[u.id]) {
            newUpgrades[u.id] = true;
        }
    });

    const currentStats = currentState.stats || {};

    // Apply Rebirth reset state (Preserving Generators, Cosmic, Transcendent & Multiplicity Upgrades, Stardust, and Lifetime stats)
    stateManager.setState({
        ...INITIAL_STATE,
        rebirthCount: newRebirthCount,
        advancedClickingUnlocked: isAdvancedUnlocked,
        autoclickUnlocked: isAutoclickUnlocked,
        autoclickEnabled: currentState.autoclickEnabled || false,
        cosmicEventsUnlocked: isCosmicEventsUnlocked,
        stardust: currentState.stardust || 0,
        stardustUpgrades: currentState.stardustUpgrades || {},
        rebirthUpgrades: {
            ...currentState.rebirthUpgrades,
            efficient_instinct: isEfficientInstinctUnlocked,
            r4_power_bonus: isR4PowerBonusUnlocked,
            r5_power_bonus: isR5PowerBonusUnlocked
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
        badgeUpgrades: currentState.badgeUpgrades || {},
        tower: {
            unlocked: (newRebirthCount >= 5) || (currentState.tower && currentState.tower.unlocked) || false,
            currentFloor: (currentState.tower && currentState.tower.currentFloor) || 1,
            highestFloor: (currentState.tower && currentState.tower.highestFloor) || 1,
            damageUpgradeLevel: (currentState.tower && currentState.tower.damageUpgradeLevel) || 0,
            tickets: (currentState.tower && typeof currentState.tower.tickets === 'number') ? currentState.tower.tickets : 10,
            maxTickets: 10,
            lastTicketRecoveryTime: (currentState.tower && currentState.tower.lastTicketRecoveryTime) || Date.now(),
            floor1BaseHP: (currentState.tower && currentState.tower.floor1BaseHP) || 0,
            enemy: (currentState.tower && currentState.tower.enemy) || null,
            bonuses: {
                clickPower: 0,
                pointGen: 0,
                stardust: 0,
                ...((currentState.tower && currentState.tower.bonuses) || {})
            },
            combatLog: (currentState.tower && Array.isArray(currentState.tower.combatLog)) ? currentState.tower.combatLog : []
        }
    });

    saveGame();
    showNotification(`Rebirth ${newRebirthCount} Complete!`);
    return true;
}



