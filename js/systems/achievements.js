/**
 * ============================================================================
 * ACHIEVEMENT SYSTEM
 * ============================================================================
 * Location: /js/systems/achievements.js
 * Purpose: Defines 8 achievement categories (40 levels each), milestone thresholds,
 *          tier evolution (Basic -> Bronze -> Gold -> Diamond -> Emerald -> Ruby -> Sapphire -> Celestial -> Multiplicity),
 *          permanent category bonus getters, and lore dialogue triggers.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { saveGame } from '../save/save.js';

export const MAX_ACHIEVEMENT_LEVEL = 40;
export const BONUS_PER_LEVEL = 0.5; // +0.5% per completed level (up to +20.0% per category)

export const ACHIEVEMENT_TIERS = [
    { name: 'Basic', minLevel: 0, maxLevel: 0, frameClass: 'tier-frame-basic', badgeClass: 'tier-badge-basic' },
    { name: 'Bronze', minLevel: 1, maxLevel: 5, frameClass: 'tier-frame-bronze', badgeClass: 'tier-badge-bronze' },
    { name: 'Gold', minLevel: 6, maxLevel: 10, frameClass: 'tier-frame-gold', badgeClass: 'tier-badge-gold' },
    { name: 'Diamond', minLevel: 11, maxLevel: 15, frameClass: 'tier-frame-diamond', badgeClass: 'tier-badge-diamond' },
    { name: 'Emerald', minLevel: 16, maxLevel: 20, frameClass: 'tier-frame-emerald', badgeClass: 'tier-badge-emerald' },
    { name: 'Ruby', minLevel: 21, maxLevel: 25, frameClass: 'tier-frame-ruby', badgeClass: 'tier-badge-ruby' },
    { name: 'Sapphire', minLevel: 26, maxLevel: 30, frameClass: 'tier-frame-sapphire', badgeClass: 'tier-badge-sapphire' },
    { name: 'Celestial', minLevel: 31, maxLevel: 35, frameClass: 'tier-frame-celestial', badgeClass: 'tier-badge-celestial' },
    { name: 'Multiplicity', minLevel: 36, maxLevel: 40, frameClass: 'tier-frame-multiplicity', badgeClass: 'tier-badge-multiplicity' }
];

export function getAchievementTier(level) {
    if (!level || level <= 0) return ACHIEVEMENT_TIERS[0];
    return ACHIEVEMENT_TIERS.find(t => level >= t.minLevel && level <= t.maxLevel) || ACHIEVEMENT_TIERS[ACHIEVEMENT_TIERS.length - 1];
}

/**
 * Definitions for the 8 Achievement Categories
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
            1e28, 1e29, 1e30, 1e31, 1e32,                           // L26-30: 10Oc, 100Oc, 1No, 10No, 100No
            1e34, 1e38, 1e42, 1e46, 1e50,                           // L31-35 (Celestial): 10Dc, 100Ud, 1Td, 10QaD, 100QiD
            1e54, 1e58, 1e62, 1e67, 1e72                            // L36-40 (Multiplicity): 1SpD, 10OcD, 100NoD, 10UVg, 1DVg
        ],
        lore: {
            5: { title: "THE SPARK OF ACCUMULATION", text: "Points are not merely numbers. They are tiny crystallization drops of intention in the endless vacuum." },
            10: { title: "DENSITY RISING", text: "As your hoard expands, ambient reality curves around your concentrated focus. Gravity begins to whisper." },
            15: { title: "THE WEIGHT OF NUMBERS", text: "You have accumulated enough force to bend local causality. The universe asks: why do you collect?" },
            20: { title: "SINGULAR MASS", text: "Matter and energy pale in comparison to pure numerical density. Whole star systems collapse into your vault." },
            25: { title: "THE GRAND VAULT", text: "Dimensions buckle under your reserves. Infinite potential slumbers within your count." },
            30: { title: "OMNIPRESENT MASS", text: "You do not collect Points; Points assemble the foundation of all reality. You are the source of value." },
            35: { title: "HYPER-DIMENSIONAL RESERVES", text: "Hundred Quindecillions flow effortlessly through your conduits. Entire galaxies pale before your boundless hoard." },
            40: { title: "DUOVIGINTILLION APEX", text: "One Duovigintillion points. The ultimate numerical singularity. Existence bends entirely to your concentrated will." }
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
            47304000, 63072000, 94608000, 126144000, 157680000, // 1.5y, 2y, 3y, 4y, 5y
            189345600, 220896000, 252446400, 283996800, 315576000, // L31-35 (Celestial): 6y, 7y, 8y, 9y, 10y
            394470000, 473364000, 631152000, 788940000, 946728000  // L36-40 (Multiplicity): 12.5y, 15y, 20y, 25y, 30y
        ],
        lore: {
            5: { title: "TICKING SECONDS", text: "Seconds drop into eternity like pebbles in a bottomless well." },
            10: { title: "THE CLOCK REMEMBERS", text: "You have measured time, but time has also been measuring you." },
            15: { title: "TEMPORAL RESONANCE", text: "Past and future blur. You begin to feel the rhythm of moments that have not yet occurred." },
            20: { title: "CHRONOS UNBOUND", text: "Hours collapse into brief pulses. You stand outside the steady stream of duration." },
            25: { title: "ETERNAL PRESENCE", text: "Days flow past like rivers of light. You remain still while time dances around you." },
            30: { title: "MASTER OF CHRONOLOGY", text: "Time does not pass for you; you permit time to exist so that change can unfold." },
            35: { title: "DECADE OF AEONS", text: "Ten virtual years of unwavering persistence. The temporal river forms an oxbow lake around your monument." },
            40: { title: "TIMELESS ETERNITY", text: "Linear time ceases to function in your domain. You are the clockmaker, the hour, and the endless ticking itself." }
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
            100000000, 250000000, 500000000, 1000000000, 2500000000,
            5000000000, 10000000000, 20000000000, 35000000000, 50000000000,      // L31-35: 5B, 10B, 20B, 35B, 50B
            75000000000, 100000000000, 150000000000, 200000000000, 250000000000  // L36-40: 75B, 100B, 150B, 200B, 250B
        ],
        lore: {
            5: { title: "THE DIRECT TOUCH", text: "Your finger connects with the button. A simple action, yet universe-altering." },
            10: { title: "RHYTHMIC CAUSALITY", text: "Click. Click. Click. Each press sends ripple-waves through quantum fields." },
            15: { title: "WILL MADE MANIFEST", text: "Automations can simulate work, but only conscious intent creates true causality." },
            20: { title: "KINETIC HARMONY", text: "Your clicks resonate at the fundamental frequency of creation itself." },
            25: { title: "THE ARCHITECT'S TOUCH", text: "Millions of intentional strokes have carved new laws into the cosmos." },
            30: { title: "THE FIRST CAUSE", text: "In the beginning was the Click. And from that single touch, infinity bloomed." },
            35: { title: "KINETIC DEMIURGE", text: "Fifty billion manual impacts. Every strike causes reality to shimmer with raw potential." },
            40: { title: "SUPREME PRIME MOVER", text: "A quarter of a trillion clicks. You have literally beaten a new multiverse into physical shape with your bare hands." }
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
            1e26, 1e27, 1e28, 1e29, 1e30,
            1e33, 1e37, 1e41, 1e45, 1e49, // L31-35: 1Dc, 10Ud, 100Dd, 1QaD, 10QiD
            1e53, 1e57, 1e61, 1e65, 1e70  // L36-40: 100SxD, 1OcD, 10NoD, 100Vg, 10DVg
        ],
        lore: {
            5: { title: "ACCELERATION", text: "Velocity increases. Points flow faster than quiet thoughts." },
            10: { title: "STREAM OF INTENSITY", text: "A cascade of value pours through your sensors at breakneck speeds." },
            15: { title: "RELATIVISTIC CASCADE", text: "The stream moves so fast that time around the generators dilates visibly." },
            20: { title: "LIGHT-SPEED FLOW", text: "Points no longer flow; they arrive instantaneously across all dimensions." },
            25: { title: "SUPERLUMINAL IMPACT", text: "Your velocity exceeds light, reaching destinations before generation even begins." },
            30: { title: "INFINITE VELOCITY", text: "Speed ceases to have meaning. You exist at every rate, everywhere, simultaneously." },
            35: { title: "HYPER-DIMENSIONAL VELOCITY", text: "Ten Quindecillion points per second. Spacetime shatters under the supersonic rush of raw value." },
            40: { title: "OMNIPRESENT CASCADE", text: "Ten Duovigintillion points every second. Production and reality have become synonymous." }
        }
    },
    {
        id: 'stardust_harvester',
        name: 'Stardust Harvester',
        statKey: 'totalStardustEarned',
        bonusType: 'Point Generation',
        icon: '✨',
        description: 'Gather concentrated Stardust from the celestial Multiplicity Crucible.',
        thresholds: [
            0.01, 0.05, 0.1, 0.25, 0.5,
            1, 2, 5, 10, 20,
            35, 50, 75, 100, 150,
            200, 250, 300, 400, 500,
            650, 800, 1000, 1200, 1400,
            1600, 1800, 2000, 2250, 2500,
            2800, 3100, 3500, 4000, 4500,
            5000, 6000, 7500, 9000, 10000
        ],
        lore: {
            5: { title: "CELESTIAL CONDENSATION", text: "Tiny motes of primordial stardust cling to your fingertips. The crucible begins to warm." },
            10: { title: "STELLAR ALCHEMY", text: "Stardust responds to your intent, condensing into radiant crystals of pure multiplicative power." },
            15: { title: "COSMIC NURSERY", text: "You harvest matter forged in the hearts of collapsing hyper-giants. The crucible hums with life." },
            20: { title: "ASTRAL WEAVER", text: "Hundreds of stardust units align into sacred geometric lattices, warping point economy exponentially." },
            25: { title: "STELLAR PROMETHEUS", text: "You have drawn enough stardust from the void to ignite thousands of new solar cores." },
            30: { title: "CRUCIBLE OF THE GODS", text: "Two thousand five hundred stardust grains. The boundary between material points and celestial light vanishes." },
            35: { title: "GALACTIC EMBERS", text: "Five thousand stardust units. You hold the smoldering ash of dead multiverses, breathing life into new realities." },
            40: { title: "STELLAR OVERMIND", text: "Ten thousand units of concentrated stardust. You are the architect of constellations and the sovereign of multiplicity." }
        }
    },
    {
        id: 'super_crit_sunderer',
        name: 'Super Crit Sunderer',
        statKey: 'totalSuperCrits',
        bonusType: 'Click Power',
        icon: '💥',
        description: 'Trigger catastrophic Super Critical strikes dealing massive damage.',
        thresholds: [
            1, 3, 5, 10, 15,
            20, 30, 45, 60, 80,
            100, 130, 170, 220, 280,
            350, 430, 520, 620, 730,
            850, 1000, 1200, 1450, 1750,
            2100, 2500, 3000, 3600, 4300,
            5000, 6000, 7200, 8500, 10000,
            12000, 15000, 18000, 22000, 25000
        ],
        lore: {
            5: { title: "CATASTROPHIC SPARK", text: "A sudden fracture in spacetime! The 100x strike leaves reality ringing like a struck bell." },
            10: { title: "ANOMALOUS IMPACT", text: "Super Critical strikes become familiar friends, tearing open brief vistas into the core of creation." },
            15: { title: "SEISMIC RUPTURE", text: "Over a hundred catastrophic impacts have permanently softened the fabric of space around your clicker." },
            20: { title: "TEMPEST OF SUNDERING", text: "Hundreds of reality-shattering blows rain down in rapid succession. Casualties: physics itself." },
            25: { title: "SUPERCRITICAL FRACTURE", text: "Over a thousand Super Crits. The click button glows incandescent with suppressed catastrophic pressure." },
            30: { title: "WRATH OF MULTIPLICITY", text: "Thousands of apocalyptic strikes. Each impact detonates like a supernova across the dimensional boundary." },
            35: { title: "HYPER-CATASTROPHE", text: "Ten thousand Super Critical hits. You do not merely damage numbers; you vaporize entire continuum matrices." },
            40: { title: "OMNIVERSAL SUNDERER", text: "Twenty-five thousand Super Crits. Every stroke tears reality down to its raw quantum bedrock." }
        }
    },
    {
        id: 'rebirth_ascendant',
        name: 'Rebirth Ascendant',
        statKey: 'totalRebirths',
        bonusType: 'Point Generation',
        icon: '🌟',
        description: 'Surpass reality through recurring Rebirth cycles of destruction and renewal.',
        thresholds: [
            1, 2, 3, 4, 5,
            6, 7, 8, 9, 10,
            12, 14, 16, 18, 20,
            22, 25, 28, 31, 35,
            39, 43, 48, 53, 60,
            67, 75, 83, 92, 100,
            110, 125, 140, 160, 180,
            200, 230, 260, 300, 350
        ],
        lore: {
            5: { title: "CYCLE INITIATION", text: "The universe burns and is reborn. You step out of the ashes stronger than before." },
            10: { title: "SAMSARA UNBOUND", text: "Ten cycles completed. The boundaries between past lives blur into a single continuous awakening." },
            15: { title: "PHOENIX OF REALITY", text: "Destruction holds no fear for you. Each rebirth is merely a change of celestial garments." },
            20: { title: "ETERNAL RECURRENCE", text: "Thirty cycles. You remember when the physical constants were different, and when numbers had names." },
            25: { title: "WHEEL OF DESTINY", text: "Sixty reincarnations. You manipulate the rules of rebirth itself, carrying forward absolute mastery." },
            30: { title: "TRANSCENDENT IMMORTAL", text: "One hundred rebirths. Death is an illusion; rebirth is merely punctuation in your eternal sentence." },
            35: { title: "MULTIVERSE SOVEREIGN", text: "Two hundred cycles of cosmic destruction. Realities rise, flourish, and collapse within your palm." },
            40: { title: "THE ETERNAL CONSTANT", text: "Three hundred and fifty rebirths. The multiverse has dissolved and re-crystallized hundreds of times. Only you remain." }
        }
    },
    {
        id: 'cosmic_voyager',
        name: 'Cosmic Voyager',
        statKey: 'eventsDiscovered',
        bonusType: 'Click Power',
        icon: '🌌',
        description: 'Witness and catalogue rare Cosmic Occasions across all Rebirth tiers.',
        thresholds: [
            1, 2, 3, 4, 5,
            6, 7, 8, 9, 10,
            11, 12, 13, 14, 15,
            18, 22, 26, 30, 35,
            40, 46, 52, 60, 70,
            80, 90, 100, 115, 130,
            145, 160, 180, 200, 225,
            250, 280, 320, 360, 400
        ],
        lore: {
            5: { title: "STARGAZER", text: "You have catalogued your first cosmic occurrences. The heavens are not silent; they sing." },
            10: { title: "ANOMALY CARTOGRAPHER", text: "Ten distinct cosmic anomalies charted. Space bends in predictable, majestic harmonies." },
            15: { title: "PAN-GALACTIC CODEX", text: "Fifteen unique cosmic phenomena recorded. From gentle Time Pulses to the 1-in-9,999 Supercell Devourer." },
            20: { title: "VOYAGER OF DEEP SPACE", text: "Dozens of encounters. You navigate temporal anomalies with effortless serenity." },
            25: { title: "CELESTIAL CHRONICLER", text: "Seventy anomalies weathered. The cosmic winds no longer buffet you; they carry you forward." },
            30: { title: "HARBINGER OF OCCASIONS", text: "Over one hundred cosmic events summoned and tamed. You are attuned to the rhythm of the stars." },
            35: { title: "ASTRAL NAVIGATOR", text: "Two hundred and twenty-five cosmic events. The stars re-align themselves in tribute to your passage." },
            40: { title: "EYE OF THE MULTIVERSE", text: "Four hundred cosmic anomalies chronicled. You see all things: every genesis, every collapse, every infinite convergence." }
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
    if (categoryId === 'stardust_harvester') {
        return stats.totalStardustEarned || 0;
    }
    if (categoryId === 'super_crit_sunderer') {
        return stats.totalSuperCrits || 0;
    }
    if (categoryId === 'rebirth_ascendant') {
        return Math.max(stats.totalRebirths || 0, stats.highestRebirth || 0, currentState.rebirthCount || 0);
    }
    if (categoryId === 'cosmic_voyager') {
        const eventsDiscoveredCount = Object.keys(stats.eventsDiscovered || {}).length;
        const totalEncounters = stats.totalEventsActivated || 0;
        return Math.max(eventsDiscoveredCount, totalEncounters);
    }
    return 0;
}

/**
 * Calculate current completed level (0 to 40) for a given achievement category
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
 * Formula: level * 0.5% (max 20.0%)
 */
export function getAchievementBonus(state, categoryId) {
    const level = getAchievementLevel(state, categoryId);
    return Math.min(20.0, level * BONUS_PER_LEVEL);
}

/**
 * Calculate total combined percentage bonus across all achievement categories
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
        const milestoneLevels = [5, 10, 15, 20, 25, 30, 35, 40];

        for (const mLevel of milestoneLevels) {
            if (currentLevel >= mLevel) {
                const loreKey = `${def.id}_${mLevel}`;
                if (!loreUnlocked[loreKey]) {
                    const loreDef = def.lore && def.lore[mLevel];
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
