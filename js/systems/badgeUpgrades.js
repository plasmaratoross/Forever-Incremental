/**
 * ============================================================================
 * BADGE UPGRADES SYSTEM (PERMANENT PROGRESSION LAYER)
 * ============================================================================
 * Location: /js/systems/badgeUpgrades.js
 * Purpose: Defines data-driven Badge Upgrades unlocked by obtaining specific
 *          Cosmic Badges and purchasing with Points. Permanent across all Rebirths.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { isBadgeUnlocked } from './badges.js';
import { saveGame } from '../save/save.js';
import { showNotification } from '../ui/notifications.js';
import { t } from '../i18n/i18n.js';

/**
 * Data-driven array of Badge Upgrade definitions
 */
export const BADGE_UPGRADES_DEFS = [
    {
        id: 'tri_cosmic_harmony',
        name: 'Tri-Cosmic Harmony',
        cost: 5000000000000000, // 5.00 Qa Points (5 Quadrillion)
        requiredBadges: ['time_pulse', 'causal_shift', 'paradox_loop'],
        effectType: 'global_efficiency',
        effectValue: 0.08, // +8% Click Power & +8% Point Generation
        description: 'Harmonizes Time Pulse, Causal Shift, and Paradox Loop to grant a permanent +8% bonus to Click Power and Point Generation.',
        survivesRebirth: true
    }
];

/**
 * Check if player meets all badge requirements, point balance, and purchase state
 * @param {string} upgradeId - Badge upgrade ID
 * @param {Object} [state] - Optional state snapshot
 * @returns {boolean} True if purchase is valid
 */
export function canPurchaseBadgeUpgrade(upgradeId, state) {
    const currentState = state || stateManager.getState();
    const def = BADGE_UPGRADES_DEFS.find(u => u.id === upgradeId);
    if (!def) return false;

    const purchased = currentState.badgeUpgrades || {};
    if (purchased[upgradeId]) return false; // Already purchased

    if ((currentState.currency || 0) < def.cost) return false;

    // Check all required badges
    const hasBadges = def.requiredBadges.every(badgeId => isBadgeUnlocked(badgeId, currentState));
    if (!hasBadges) return false;

    return true;
}

/**
 * Purchase badge upgrade, deduct Points, set state flag, and save
 * @param {string} upgradeId - Badge upgrade ID
 * @returns {boolean} True if successfully purchased
 */
export function purchaseBadgeUpgrade(upgradeId) {
    const currentState = stateManager.getState();
    const def = BADGE_UPGRADES_DEFS.find(u => u.id === upgradeId);
    if (!def) return false;

    if (!canPurchaseBadgeUpgrade(upgradeId, currentState)) return false;

    const currentBadgeUpgrades = currentState.badgeUpgrades || {};
    stateManager.setState({
        currency: currentState.currency - def.cost,
        badgeUpgrades: {
            ...currentBadgeUpgrades,
            [upgradeId]: true
        }
    });

    saveGame();
    const nameText = t(`upgrade_${def.id}_name`, def.name);
    showNotification(`✨ ${nameText} Purchased!`);
    return true;
}

/**
 * Get total Click Power multiplier from purchased Badge Upgrades
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Click multiplier bonus (e.g., 0.08 for +8%)
 */
export function getBadgeUpgradeClickMult(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.badgeUpgrades || {};
    let bonus = 0;

    BADGE_UPGRADES_DEFS.forEach(def => {
        if (purchased[def.id]) {
            if (def.effectType === 'global_efficiency' || def.effectType === 'click_power') {
                bonus += (def.effectValue || 0);
            }
        }
    });

    return bonus;
}

/**
 * Get total Point Generation multiplier from purchased Badge Upgrades
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Point generation multiplier bonus (e.g., 0.08 for +8%)
 */
export function getBadgeUpgradePointGenMult(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.badgeUpgrades || {};
    let bonus = 0;

    BADGE_UPGRADES_DEFS.forEach(def => {
        if (purchased[def.id]) {
            if (def.effectType === 'global_efficiency' || def.effectType === 'point_generation') {
                bonus += (def.effectValue || 0);
            }
        }
    });

    return bonus;
}
