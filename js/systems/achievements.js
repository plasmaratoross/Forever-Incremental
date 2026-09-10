/**
 * ============================================================================
 * ACHIEVEMENT SYSTEM
 * ============================================================================
 * Location: /js/systems/achievements.js
 * Purpose: Defines 4 achievement categories (30 levels each), milestone thresholds,
 *          tier evolution (Basic -> Bronze -> Gold -> Diamond -> Emerald -> Ruby -> Sapphire),
 *          permanent category bonus getters, and lore dialogue triggers.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { saveGame } from '../save/save.js';

export const MAX_ACHIEVEMENT_LEVEL = 30;
export const BONUS_PER_LEVEL = 0.5; // +0.5% per completed level

export const ACHIEVEMENT_TIERS = [
    { name: 'Basic', minLevel: 0, maxLevel: 0, frameClass: 'tier-frame-basic', badgeClass: 'tier-badge-basic' },
    { name: 'Bronze', minLevel: 1, maxLevel: 5, frameClass: 'tier-frame-bronze', badgeClass: 'tier-badge-bronze' },
    { name: 'Gold', minLevel: 6, maxLevel: 10, frameClass: 'tier-frame-gold', badgeClass: 'tier-badge-gold' },
    { name: 'Diamond', minLevel: 11, maxLevel: 15, frameClass: 'tier-frame-diamond', badgeClass: 'tier-badge-diamond' },
    { name: 'Emerald', minLevel: 16, maxLevel: 20, frameClass: 'tier-frame-emerald', badgeClass: 'tier-badge-emerald' },
    { name: 'Ruby', minLevel: 21, maxLevel: 25, frameClass: 'tier-frame-ruby', badgeClass: 'tier-badge-ruby' },
    { name: 'Sapphire', minLevel: 26, maxLevel: 30, frameClass: 'tier-frame-sapphire', badgeClass: 'tier-badge-sapphire' }
];

export function getAchievementTier(level) {
    if (!level || level <= 0) return ACHIEVEMENT_TIERS[0];
    return ACHIEVEMENT_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) || ACHIEVEMENT_TIERS[ACHIEVEMENT_TIERS.length - 1];
}

/**
 * Definitions for the 4 Achievement Categories
 */
export const ACHIEVEMENT_DEFS = [
    {
        id: 'point_accumulator',
        name: 'Point Accumulator',
        statKey: 'totalPointsEarned',
        bonusType: 'Point Generation',
        icon: '💎',
        description: 'Accumulate total lifetime Points across your journey.',
        thresholds: [
            1000, 10000, 100000, 1000000, 10000000,                // L1-5: 1K, 10K, 100K, 1M, 10M
            100000000, 1000000000, 10000000000, 100000000000, 1e12,  // L6-10: 100M, 1B, 10B, 100B, 1T
            1e13, 1e14, 1e15, 1e16, 1e17,                           // L11-15: 10T, 100T, 1Qa, 10Qa, 100Qa
            1e18, 1e19, 1e20, 1e21, 1e22,                           // L16-20: 1Qi, 10Qi, 100Qi, 1Sx, 10Sx
            1e23, 1e24, 1e25, 1e26, 1e27,                           // L21-25: 100Sx, 1Sp, 10Sp, 100Sp, 1Oc
            1e28, 1e29, 1e30, 1e31, 1e32                            // L26-30: 10Oc, 100Oc, 1No, 10No, 100No
        ],
        lore: {
            5: { title: "THE SPARK OF ACCUMULATION", text: "Points are not merely numbers. They are tiny crystallization drops of intention in the endless vacuum." },
            10: { title: "DENSITY RISING", text: "As your hoard expands, ambient reality curves around your concentrated focus. Gravity begins to whisper." },
            15: { title: "THE WEIGHT OF NUMBERS", text: "You have accumulated enough force to bend local causality. The universe asks: why do you collect?" },
            20: { title: "SINGULAR MASS", text: "Matter and energy pale in comparison to pure numerical density. Whole star systems collapse into your vault." },
            25: { title: "THE GRAND VAULT", text: "Dimensions buckle under your reserves. Infinite potential slumbers within your count." },
            30: { title: "OMNIPRESENT MASS", text: "You do not collect Points; Points assemble the foundation of all reality. You are the source of value." }
        }
    },
    {
        id: 'timekeeper',
        name: 'Timekeeper',
        statKey: 'playtime',
        bonusType: 'Game Speed',
        icon: '⏳',
        description: 'Spend active time contemplating the flow of existence.',
        thresholds: [
            60, 300, 900, 1800, 3600,            // 1m, 5m, 15m, 30m, 1h
            7200, 14400, 28800, 43200, 86400,    // 2h, 4h, 8h, 12h, 24h (1d)
            172800, 259200, 432000, 604800, 864000, // 2d, 3d, 5d, 7d (1w), 10d
            1209600, 1814400, 2592000, 3888000, 5184000, // 14d, 21d, 30d (1m), 45d, 60d
            7776000, 10368000, 15552000, 20736000, 31536000, // 90d, 120d, 180d, 240d, 365d (1y)
            47304000, 63072000, 94608000, 126144000, 157680000 // 1.5y, 2y, 3y, 4y, 5y
        ],
        lore: {
            5: { title: "TICKING SECONDS", text: "Seconds drop into eternity like pebbles in a bottomless well." },
            10: { title: "THE CLOCK REMEMBERS", text: "You have measured time, but time has also been measuring you." },
            15: { title: "TEMPORAL RESONANCE", text: "Past and future blur. You begin to feel the rhythm of moments that have not yet occurred." },
            20: { title: "CHRONOS UNBOUND", text: "Hours collapse into brief pulses. You stand outside the steady stream of duration." },
            25: { title: "ETERNAL PRESENCE", text: "Days flow past like rivers of light. You remain still while time dances around you." },
            30: { title: "MASTER OF CHRONOLOGY", text: "Time does not pass for you; you permit time to exist so that change can unfold." }
        }
    },
    {
        id: 'clicker',
        name: 'Clicker',
        statKey: 'totalClicks',
        bonusType: 'Click Power',
        icon: '🖱️',
        description: 'Perform genuine manual clicks with your own hands.',
        thresholds: [
            100, 500, 1500, 3000, 5000,
            10000, 20000, 35000, 50000, 75000,
            100000, 150000, 250000, 400000, 600000,
            1000000, 1500000, 2500000, 4000000, 6000000,
            10000000, 15000000, 25000000, 40000000, 60000000,
            100000000, 250000000, 500000000, 1000000000, 2500000000
        ],
        lore: {
            5: { title: "THE DIRECT TOUCH", text: "Your finger connects with the button. A simple action, yet universe-altering." },
            10: { title: "RHYTHMIC CAUSALITY", text: "Click. Click. Click. Each press sends ripple-waves through quantum fields." },
            15: { title: "WILL MADE MANIFEST", text: "Automations can simulate work, but only conscious intent creates true causality." },
            20: { title: "KINETIC HARMONY", text: "Your clicks resonate at the fundamental frequency of creation itself." },
            25: { title: "THE ARCHITECT'S TOUCH", text: "Millions of intentional strokes have carved new laws into the cosmos." },
            30: { title: "THE FIRST CAUSE", text: "In the beginning was the Click. And from that single touch, infinity bloomed." }
        }
    },
    {
        id: 'point_velocity',
        name: 'Point Velocity',
        statKey: 'highestPPS',
        bonusType: 'Point Generation',
        icon: '⚡',
        description: 'Reach high peak Points-Per-Second (PPS) rates.',
        thresholds: [
            10, 100, 1000, 10000, 100000,
            1000000, 10000000, 100000000, 1000000000, 10000000000,
            100000000000, 1e12, 1e13, 1e14, 1e15,
            1e16, 1e17, 1e18, 1e19, 1e20,
            1e21, 1e22, 1e23, 1e24, 1e25,
            1e26, 1e27, 1e28, 1e29, 1e30
        ],
        lore: {
            5: { title: "ACCELERATION", text: "Velocity increases. Points flow faster than quiet thoughts." },
            10: { title: "STREAM OF INTENSITY", text: "A cascade of value pours through your sensors at breakneck speeds." },
            15: { title: "RELATIVISTIC CASCADE", text: "The stream moves so fast that time around the generators dilates visibly." },
            20: { title: "LIGHT-SPEED FLOW", text: "Points no longer flow; they arrive instantaneously across all dimensions." },
            25: { title: "SUPERLUMINAL IMPACT", text: "Your velocity exceeds light, reaching destinations before generation even begins." },
            30: { title: "INFINITE VELOCITY", text: "Speed ceases to have meaning. You exist at every rate, everywhere, simultaneously." }
        }
    }
];

/**
 * Get current stat value for an achievement category
 */
export function getAchievementCurrentValue(state, categoryId) {
    const currentState = state || stateManager.getState();
    const stats = currentState.stats || {};

    if (categoryId === 'point_accumulator') {
        return (stats.totalCurrencyEarned || 0) + (stats.totalPointsEarned || 0);
    }
    if (categoryId === 'timekeeper') {
        return stats.playtime || 0;
    }
    if (categoryId === 'clicker') {
        return stats.totalClicks || 0;
    }
    if (categoryId === 'point_velocity') {
        return stats.highestPPS || 0;
    }
    return 0;
}

/**
 * Calculate current completed level (0 to 30) for a given achievement category
 */
export function getAchievementLevel(state, categoryId) {
    const def = ACHIEVEMENT_DEFS.find(a => a.id === categoryId);
    if (!def) return 0;

    const val = getAchievementCurrentValue(state, categoryId);
    let level = 0;
    for (let i = 0; i < def.thresholds.length; i++) {
        if (val >= def.thresholds[i]) {
            level = i + 1;
        } else {
            break;
        }
    }
    return Math.min(MAX_ACHIEVEMENT_LEVEL, level);
}

/**
 * Calculate permanent percentage bonus for a given achievement category
 * Formula: level * 0.5% (max 15%)
 */
export function getAchievementBonus(state, categoryId) {
    const level = getAchievementLevel(state, categoryId);
    return Math.min(15.0, level * BONUS_PER_LEVEL);
}

/**
 * Calculate total combined percentage bonus across all 4 achievement categories
 */
export function getTotalAchievementBonus(state) {
    let total = 0;
    ACHIEVEMENT_DEFS.forEach(def => {
        total += getAchievementBonus(state, def.id);
    });
    return total;
}

/**
 * Check if there is any unviewed lore milestone dialogue ready for display
 * Returns lore milestone object or null if none pending
 */
export function checkPendingLoreMilestones(state) {
    const currentState = state || stateManager.getState();
    const achievementsState = currentState.achievements || { loreUnlocked: {} };
    const loreUnlocked = achievementsState.loreUnlocked || {};

    for (const def of ACHIEVEMENT_DEFS) {
        const currentLevel = getAchievementLevel(currentState, def.id);
        const milestoneLevels = [5, 10, 15, 20, 25, 30];

        for (const mLevel of milestoneLevels) {
            if (currentLevel >= mLevel) {
                const loreKey = `${def.id}_${mLevel}`;
                if (!loreUnlocked[loreKey]) {
                    const loreDef = def.lore[mLevel];
                    if (loreDef) {
                        return {
                            categoryId: def.id,
                            categoryName: def.name,
                            level: mLevel,
                            loreKey,
                            title: loreDef.title,
                            text: loreDef.text
                        };
                    }
                }
            }
        }
    }
    return null;
}

/**
 * Mark a lore milestone dialogue as viewed in state
 */
export function markLoreMilestoneViewed(loreKey) {
    const currentState = stateManager.getState();
    const achievementsState = currentState.achievements || { loreUnlocked: {} };
    const newLoreUnlocked = {
        ...(achievementsState.loreUnlocked || {}),
        [loreKey]: true
    };

    stateManager.setState({
        achievements: {
            ...achievementsState,
            loreUnlocked: newLoreUnlocked
        }
    });

    saveGame();
}
