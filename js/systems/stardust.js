/**
 * ============================================================================
 * STARDUST & MULTIPLICITY SYSTEM (REBIRTH 5 EXPANSION)
 * ============================================================================
 * Location: /js/systems/stardust.js
 * Purpose: Implements the Rebirth 5 Multiplicity mechanics:
 *          - Stardust manual clicking object (0.001 base + logarithmic points scaling)
 *          - Strict manual-only generation (Autoclick cannot generate Stardust)
 *          - Immunity to standard Click Power multipliers & Super Crit
 *          - Stardust Upgrades shop: Point Multiplier (x1 -> x2 -> x4 -> x8 -> x16 -> x32)
 *          - Multiplicity modal and Stardust Upgrades UI managers
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { saveGame } from '../save/save.js';
import { audioManager } from '../audio/audioManager.js';
import { showNotification } from '../ui/notifications.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';
import { cosmicEventRuntime } from './cosmicEvents.js';

/**
 * Base manual yield per Stardust click
 */
export const BASE_STARDUST_PER_CLICK = 0.001;

/**
 * Stardust Upgrades Definitions
 */
export const STARDUST_UPGRADES_DEFS = {
    point_multiplier: {
        id: 'point_multiplier',
        nameKey: 'stardust_upg_point_multiplier_name',
        descKey: 'stardust_upg_point_multiplier_desc',
        maxLevel: 5,
        costs: [10, 25, 75, 250, 1000],
        multipliers: [1, 2, 4, 8, 16, 32]
    }
};

let lastStardustClickTime = 0;
const STARDUST_CLICK_THROTTLE_MS = 80;

/**
 * Calculate the Points Economy scaling factor for Stardust clicking
 * Small logarithmic bonus: 1 + 0.05 * log10(max(1, points))
 * @param {Object} [state] 
 * @returns {number} Multiplier
 */
export function getStardustPointsScaling(state) {
    const currentState = state || stateManager.getState();
    const points = Math.max(1, currentState.points || currentState.currency || 0);
    return 1.0 + (0.05 * Math.log10(points));
}

/**
 * Calculate the exact Stardust yield per manual click
 * @param {Object} [state] 
 * @returns {number} Stardust per manual click
 */
export function getStardustClickYield(state) {
    const currentState = state || stateManager.getState();
    const pointsScaling = getStardustPointsScaling(currentState);

    // Active Cosmic Event Synergy: Tectonic Rupture grants 5x Stardust yield
    let eventMult = 1.0;
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.id === 'tectonic_rupture') {
        eventMult = 5.0;
    }

    // Permanent Infinity Tower Stacking Stardust Bonus
    const towerStardustMult = 1 + ((currentState.tower && currentState.tower.bonuses && currentState.tower.bonuses.stardust) || 0);

    return BASE_STARDUST_PER_CLICK * pointsScaling * eventMult * towerStardustMult;
}

/**
 * Handle manual Stardust click event
 * Strictly manual only, immune to Super Crit and Click Power multipliers
 * @returns {Object|null} Result object or null if throttled
 */
export function handleStardustClick() {
    const now = Date.now();
    if (now - lastStardustClickTime < STARDUST_CLICK_THROTTLE_MS) {
        return null;
    }
    lastStardustClickTime = now;

    const state = stateManager.getState();
    const rebirthCount = state.rebirthCount || 0;
    if (rebirthCount < 5) return null;

    const yieldAmount = getStardustClickYield(state);
    const currentStardust = state.stardust || 0;
    const newStardust = currentStardust + yieldAmount;

    // Check if player has Stardust Infusion (#30 Click Upgrade) - temporary 10s click power boost
    const purchased = state.upgrades || {};
    if (purchased['stardust_infusion']) {
        window.__stardustInfusionEndTime = Date.now() + 10000;
    }

    const currentStats = state.stats || {};
    const totalStardustClicks = (currentStats.totalStardustClicks || 0) + 1;
    const totalStardustEarned = (currentStats.totalStardustEarned || 0) + yieldAmount;

    stateManager.setState({
        stardust: newStardust,
        stats: {
            ...currentStats,
            totalStardustClicks,
            totalStardustEarned
        }
    });

    audioManager.playClickSFX();

    return {
        yieldAmount,
        totalStardust: newStardust
    };
}

/**
 * Get current level of a Stardust Upgrade
 * @param {string} upgradeId 
 * @param {Object} [state] 
 * @returns {number} Current level (0 to maxLevel)
 */
export function getStardustUpgradeLevel(upgradeId, state) {
    const currentState = state || stateManager.getState();
    const upgrades = currentState.stardustUpgrades || {};
    return upgrades[upgradeId] || 0;
}

/**
 * Get current Point Multiplier granted by Stardust Upgrades (x1, x2, x4, x8, x16, x32)
 * @param {Object} [state] 
 * @returns {number} Multiplier (1 to 32)
 */
export function getStardustPointMult(state) {
    const level = getStardustUpgradeLevel('point_multiplier', state);
    const def = STARDUST_UPGRADES_DEFS.point_multiplier;
    return def.multipliers[Math.min(level, def.maxLevel)] || 1;
}

/**
 * Get next cost for a Stardust Upgrade
 * @param {string} upgradeId 
 * @param {Object} [state] 
 * @returns {number} Next cost or Infinity if maxed
 */
export function getStardustUpgradeCost(upgradeId, state) {
    const def = STARDUST_UPGRADES_DEFS[upgradeId];
    if (!def) return Infinity;
    const level = getStardustUpgradeLevel(upgradeId, state);
    if (level >= def.maxLevel) return Infinity;
    return def.costs[level];
}

/**
 * Buy a Stardust Upgrade
 * @param {string} upgradeId 
 * @returns {boolean} True if purchased
 */
export function buyStardustUpgrade(upgradeId) {
    const def = STARDUST_UPGRADES_DEFS[upgradeId];
    if (!def) return false;

    const state = stateManager.getState();
    const currentLevel = getStardustUpgradeLevel(upgradeId, state);
    if (currentLevel >= def.maxLevel) return false;

    const cost = def.costs[currentLevel];
    const currentStardust = state.stardust || 0;
    if (currentStardust < cost) {
        showNotification(t('stardustNotEnough', 'Not enough Stardust!'));
        return false;
    }

    const newLevel = currentLevel + 1;
    const newStardust = currentStardust - cost;
    const currentUpgrades = state.stardustUpgrades || {};

    stateManager.setState({
        stardust: newStardust,
        stardustUpgrades: {
            ...currentUpgrades,
            [upgradeId]: newLevel
        }
    });

    saveGame();
    audioManager.playRebirthSFX();

    const mult = def.multipliers[newLevel];
    showNotification(`✨ ${t('stardustUpgSuccess', 'Stardust Upgrade Complete!')} (${mult}x Point Multiplier)`);
    return true;
}

/**
 * Format Stardust number with up to 3-4 decimal precision
 * @param {number} val 
 * @returns {string} Formatted Stardust
 */
export function formatStardust(val) {
    if (val === null || val === undefined || isNaN(val)) return '0.000';
    if (val < 0.0001 && val > 0) return val.toFixed(4);
    if (val < 10) return val.toFixed(3);
    if (val < 1000) return val.toFixed(2);
    return formatNumber(val, 2);
}
