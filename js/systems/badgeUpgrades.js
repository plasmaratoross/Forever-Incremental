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
        clickPowerBonus: 0.08,
        pointGenBonus: 0.08,
        costDiscount: 0,
        ppsSynergy: 0,
        description: 'Harmonizes Time Pulse, Causal Shift, and Paradox Loop to grant a permanent +8% bonus to Click Power and Point Generation.',
        survivesRebirth: true
    },
    {
        id: 'chronologia',
        name: 'Chronologia',
        cost: 1000000000000000000, // 1.00 Qi Points (1 Quintillion)
        requiredBadges: ['time_collapse', 'reality_fracture'],
        effectType: 'chronologia_efficiency',
        clickPowerBonus: 0.35, // +35% Click Power
        pointGenBonus: 0.35,   // +35% Point Generation
        costDiscount: 0.10,    // -10% Upgrade and Generator Costs
        ppsSynergy: 0,
        description: 'Combines the temporal instability of Time Collapse and the dimensional tears of Reality Fracture to permanently grant +35% Click Power, +35% Point Generation, and reduces all Upgrade and Generator costs by 10%.',
        survivesRebirth: true
    },
    {
        id: 'doom_of_nihility',
        name: 'Doom of Nihility',
        cost: 50000000000000000000000000000000, // 50.0 No Points (50 Nonillion)
        requiredBadges: ['null_paradox', 'omniversal_break'],
        reqRebirth: 4,         // Requires Rebirth 4
        effectType: 'nihility_doom',
        clickPowerBonus: 1.50, // +150% Click Power (x2.50)
        pointGenBonus: 1.50,   // +150% Point Generation (x2.50)
        costDiscount: 0.20,    // -20% Upgrade and Generator Costs
        ppsSynergy: 0.05,      // +5% of passive Points/sec added to every click
        description: 'Channeling the absolute void of Null Paradox and the cataclysm of Omniversal Break, permanently grants +150% Click Power, +150% Point Generation, -20% Upgrade & Generator costs, and channels 5% of passive Point generation into every click.',
        survivesRebirth: true
    }
];

/**
 * Check if player meets all badge requirements, point balance, rebirth level, and purchase state
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

    // Check Rebirth requirement if specified
    if (def.reqRebirth) {
        const currentR = currentState.rebirthCount || 0;
        const highestR = (currentState.stats && currentState.stats.highestRebirth) || 0;
        if (currentR < def.reqRebirth && highestR < def.reqRebirth) {
            return false;
        }
    }

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
 * @returns {number} Click multiplier bonus (e.g., 0.08 for +8%, 0.43 with Chronologia, 1.93 with all three)
 */
export function getBadgeUpgradeClickMult(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.badgeUpgrades || {};
    let bonus = 0;

    BADGE_UPGRADES_DEFS.forEach(def => {
        if (purchased[def.id]) {
            if (def.clickPowerBonus !== undefined) {
                bonus += def.clickPowerBonus;
            } else if (def.effectType === 'global_efficiency' || def.effectType === 'click_power') {
                bonus += (def.effectValue || 0);
            }
        }
    });

    return bonus;
}

/**
 * Get total Point Generation multiplier from purchased Badge Upgrades
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Point generation multiplier bonus (e.g., 0.08 for +8%, 0.43 with Chronologia, 1.93 with all three)
 */
export function getBadgeUpgradePointGenMult(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.badgeUpgrades || {};
    let bonus = 0;

    BADGE_UPGRADES_DEFS.forEach(def => {
        if (purchased[def.id]) {
            if (def.pointGenBonus !== undefined) {
                bonus += def.pointGenBonus;
            } else if (def.effectType === 'global_efficiency' || def.effectType === 'point_generation') {
                bonus += (def.effectValue || 0);
            }
        }
    });

    return bonus;
}

/**
 * Get cumulative Cost Discount factor from purchased Badge Upgrades
 * Multiplicative reduction: 10% discount means * 0.90; 20% discount means * 0.80
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Discount multiplier (1.0 default, 0.90 with Chronologia, 0.72 with both)
 */
export function getBadgeUpgradeCostDiscountMult(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.badgeUpgrades || {};
    let discountFactor = 1.0;

    BADGE_UPGRADES_DEFS.forEach(def => {
        if (purchased[def.id] && def.costDiscount) {
            discountFactor *= (1 - def.costDiscount);
        }
    });

    return discountFactor;
}

/**
 * Get passive Points/sec added to manual clicks from purchased Badge Upgrades
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Synergy ratio (e.g. 0.05 for +5% of PPS added to clicks)
 */
export function getBadgeUpgradePPSClickSynergy(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.badgeUpgrades || {};
    let synergy = 0;

    BADGE_UPGRADES_DEFS.forEach(def => {
        if (purchased[def.id] && def.ppsSynergy) {
            synergy += def.ppsSynergy;
        }
    });

    return synergy;
}
