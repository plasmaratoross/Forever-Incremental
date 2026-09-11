/**
 * ============================================================================
 * POINT GENERATOR SYSTEM (REBIRTH 2 PROGRESSION LAYER)
 * ============================================================================
 * Location: /js/systems/generators.js
 * Purpose: Defines the 5 Point Generators unlocked after Rebirth 2, cost/generation
 *          formulas, total passive Points generation stacking with player buffs,
 *          and purchase/upgrade validation.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { saveGame } from '../save/save.js';
import { isSingularityActive } from '../upgrades/upgrades.js';
import { showNotification } from '../ui/notifications.js';
import { getCurrentEventPointGenMult, getCurrentEventCostDiscountMult, isCurrentEventCreationFrenzy } from './cosmicEvents.js';
import { getAchievementBonus } from './achievements.js';
import { getBadgeUpgradePointGenMult, getBadgeUpgradeCostDiscountMult } from './badgeUpgrades.js';
import { getStardustPointMult } from './stardust.js';

/**
 * Definitions for the 5 Point Generators (10 levels max per generator)
 */
export const GENERATOR_DEFS = [
    // Rebirth 2 Generators (10 levels max each)
    {
        id: 'condenser',
        name: 'Point Condenser',
        tier: 'basic',
        baseGen: 100000,          // 100K Points/sec at Level 1
        baseCost: 1000000,        // 1M Points at Level 1
        maxLevel: 10,
        genScaling: 1.6,
        costScaling: 2.0,
        reqRebirth: 2,
        description: 'Basic generator that condenses ambient energy into Points.'
    },
    {
        id: 'extractor',
        name: 'Point Extractor',
        tier: 'advanced',
        baseGen: 10000000,        // 10M Points/sec at Level 1
        baseCost: 100000000,      // 100M Points at Level 1
        maxLevel: 10,
        genScaling: 1.6,
        costScaling: 2.0,
        reqRebirth: 2,
        description: 'Advanced generator extracting raw Points from space-time.'
    },
    {
        id: 'reactor',
        name: 'Point Reactor',
        tier: 'superior',
        baseGen: 1000000000,       // 1B Points/sec at Level 1
        baseCost: 10000000000,     // 10B Points at Level 1
        maxLevel: 10,
        genScaling: 1.6,
        costScaling: 2.0,
        reqRebirth: 2,
        description: 'Superior reactor fusing particles into concentrated Points.'
    },
    {
        id: 'core',
        name: 'Point Core',
        tier: 'elite',
        baseGen: 100000000000,     // 100B Points/sec at Level 1
        baseCost: 1000000000000,   // 1T Points at Level 1
        maxLevel: 10,
        genScaling: 1.6,
        costScaling: 2.0,
        reqRebirth: 2,
        description: 'Elite core generating high-density Point flows.'
    },
    {
        id: 'singularity',
        name: 'Point Singularity',
        tier: 'legendary',
        baseGen: 10000000000000,    // 10T Points/sec at Level 1
        baseCost: 100000000000000,  // 100T Points at Level 1
        maxLevel: 10,
        genScaling: 1.6,
        costScaling: 2.0,
        reqRebirth: 2,
        description: 'Legendary ultimate generator producing immense Point cascades.'
    },

    // Rebirth 3 Cosmic Generators (15 levels max each)
    {
        id: 'stellar_reactor',
        name: 'Stellar Reactor',
        tier: 'cosmic',
        baseGen: 100000000000000,     // 100T Pts/sec at Level 1
        baseCost: 1000000000000000,   // 1 Qa Points at Level 1
        maxLevel: 15,
        genScaling: 1.7,
        costScaling: 2.3,
        reqRebirth: 3,
        description: 'Harnesses stellar core fusion to generate vast streams of Points.'
    },
    {
        id: 'void_engine',
        name: 'Void Engine',
        tier: 'cosmic',
        baseGen: 10000000000000000,     // 10 Qi Pts/sec at Level 1
        baseCost: 100000000000000000,   // 100 Qa Points at Level 1
        maxLevel: 15,
        genScaling: 1.7,
        costScaling: 2.3,
        reqRebirth: 3,
        description: 'Siphons vacuum energy directly from the cosmic void.'
    },
    {
        id: 'reality_core',
        name: 'Reality Core',
        tier: 'cosmic',
        baseGen: 1000000000000000000,     // 1 Qn Pts/sec at Level 1
        baseCost: 10000000000000000000,   // 10 Qi Points at Level 1
        maxLevel: 15,
        genScaling: 1.7,
        costScaling: 2.3,
        reqRebirth: 3,
        description: 'Distorts spacetime fabric to catalyze continuous Point creation.'
    },
    {
        id: 'paradox_furnace',
        name: 'Paradox Furnace',
        tier: 'cosmic',
        baseGen: 100000000000000000000,     // 100 Qn Pts/sec at Level 1
        baseCost: 1000000000000000000000,   // 1 Sx Points at Level 1
        maxLevel: 15,
        genScaling: 1.7,
        costScaling: 2.3,
        reqRebirth: 3,
        description: 'Incinerates temporal paradoxes into concentrated Point flux.'
    },
    {
        id: 'infinity_nexus',
        name: 'Infinity Nexus',
        tier: 'cosmic',
        baseGen: 10000000000000000000000,     // 10 Sx Pts/sec at Level 1
        baseCost: 100000000000000000000000,   // 100 Sx Points at Level 1
        maxLevel: 15,
        genScaling: 1.7,
        costScaling: 2.3,
        reqRebirth: 3,
        description: 'The ultimate nexus channeling infinite dimensional energy into Points.'
    },

    // Rebirth 4 Transcendent Generators (20 levels max each)
    {
        id: 'chrono_condenser',
        name: 'Chrono Condenser',
        tier: 'transcendent',
        baseGen: 100000000000000000000000,       // 100 Sx Pts/sec at Level 1
        baseCost: 1000000000000000000000000,     // 1 Sp Points at Level 1
        maxLevel: 20,
        genScaling: 1.8,
        costScaling: 2.5,
        reqRebirth: 4,
        description: 'Compresses localized temporal fabric into vast Point fields.'
    },
    {
        id: 'dimensional_extractor',
        name: 'Dimensional Extractor',
        tier: 'transcendent',
        baseGen: 100000000000000000000000000,     // 100 Sp Pts/sec at Level 1
        baseCost: 1000000000000000000000000000,   // 1 Oc Points at Level 1
        maxLevel: 20,
        genScaling: 1.8,
        costScaling: 2.5,
        reqRebirth: 4,
        description: 'Siphons Point energy across multiversal dimensional walls.'
    },
    {
        id: 'quantum_reactor',
        name: 'Quantum Reactor',
        tier: 'transcendent',
        baseGen: 100000000000000000000000000000,   // 100 Oc Pts/sec at Level 1
        baseCost: 1000000000000000000000000000000, // 1 No Points at Level 1
        maxLevel: 20,
        genScaling: 1.8,
        costScaling: 2.5,
        reqRebirth: 4,
        description: 'Fuses subatomic quantum states into immense Point cascades.'
    },
    {
        id: 'singularity_core',
        name: 'Singularity Core',
        tier: 'transcendent',
        baseGen: 100000000000000000000000000000000,   // 100 No Pts/sec at Level 1
        baseCost: 1000000000000000000000000000000000, // 1 Dc Points at Level 1
        maxLevel: 20,
        genScaling: 1.8,
        costScaling: 2.5,
        reqRebirth: 4,
        description: 'Gravitational singularity core radiating unyielding Point pressure.'
    },
    {
        id: 'cosmic_nexus',
        name: 'Cosmic Nexus',
        tier: 'transcendent',
        baseGen: 100000000000000000000000000000000000,   // 100 Dc Pts/sec at Level 1
        baseCost: 1000000000000000000000000000000000000, // 1 Ud Points at Level 1
        maxLevel: 20,
        genScaling: 1.8,
        costScaling: 2.5,
        reqRebirth: 4,
        description: 'Central focal nexus binding stellar clusters directly to Points.'
    },
    {
        id: 'reality_weaver',
        name: 'Reality Weaver',
        tier: 'transcendent',
        baseGen: 100000000000000000000000000000000000000,   // 100 Ud Pts/sec at Level 1
        baseCost: 1000000000000000000000000000000000000000, // 1 Dd Points at Level 1
        maxLevel: 20,
        genScaling: 1.8,
        costScaling: 2.5,
        reqRebirth: 4,
        description: 'Weaves fundamental laws of physics into raw Point matter.'
    },
    {
        id: 'omniverse_matrix',
        name: 'Omniverse Matrix',
        tier: 'transcendent',
        baseGen: 100000000000000000000000000000000000000000,   // 100 Dd Pts/sec at Level 1
        baseCost: 1000000000000000000000000000000000000000000, // 1 Td Points at Level 1
        maxLevel: 20,
        genScaling: 1.8,
        costScaling: 2.5,
        reqRebirth: 4,
        description: 'The supreme matrix spanning all realities, generating endless Points.'
    },

    // Rebirth 5 Multiplicity Generators (#18 - #27, 30 levels max each)
    {
        id: 'stardust_collector',
        name: 'Stardust Collector',
        tier: 'multiplicity',
        baseGen: 1000000000000000000000000000000000000000000,   // 1 Td Pts/sec at Level 1 (1e42)
        baseCost: 100000000000000000000000000000000000000000000, // 100 Td Points at Level 1 (1e44)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Condenses celestial stardust directly into concentrated Point cascades.'
    },
    {
        id: 'astral_harvester',
        name: 'Astral Harvester',
        tier: 'multiplicity',
        baseGen: 1000000000000000000000000000000000000000000000, // 1 QaD Pts/sec at Level 1 (1e45)
        baseCost: 100000000000000000000000000000000000000000000000, // 100 QaD Points at Level 1 (1e47)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Harvests primordial astral leylines, reducing creation costs.'
    },
    {
        id: 'chronal_hyperprism',
        name: 'Chronal Hyperprism',
        tier: 'multiplicity',
        baseGen: 1000000000000000000000000000000000000000000000000, // 1 QiD Pts/sec at Level 1 (1e48)
        baseCost: 100000000000000000000000000000000000000000000000000, // 100 QiD Points at Level 1 (1e50)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Refracts localized timelines through a hyper-dimensional prism.'
    },
    {
        id: 'subatomic_annihilator',
        name: 'Subatomic Annihilator',
        tier: 'multiplicity',
        baseGen: 1000000000000000000000000000000000000000000000000000, // 1 SxD Pts/sec at Level 1 (1e51)
        baseCost: 100000000000000000000000000000000000000000000000000000, // 100 SxD Points at Level 1 (1e53)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Collides antimatter matrices at relativistic velocities to release Point energy.'
    },
    {
        id: 'hyperdimensional_crucible',
        name: 'Hyperdimensional Crucible',
        tier: 'multiplicity',
        baseGen: 1000000000000000000000000000000000000000000000000000000, // 1 SpD Pts/sec at Level 1 (1e54)
        baseCost: 100000000000000000000000000000000000000000000000000000000, // 100 SpD Points at Level 1 (1e56)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Smelts higher-dimensional geometries into pure Point matter.'
    },
    {
        id: 'tachyon_forge',
        name: 'Tachyon Forge',
        tier: 'multiplicity',
        baseGen: 10000000000000000000000000000000000000000000000000000000000, // 1 OcD Pts/sec at Level 1 (1e57)
        baseCost: 1000000000000000000000000000000000000000000000000000000000000, // 100 OcD Points at Level 1 (1e59)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Forges faster-than-light particles to hyper-charge systemic automation.'
    },
    {
        id: 'entropy_inverter',
        name: 'Entropy Inverter',
        tier: 'multiplicity',
        baseGen: 10000000000000000000000000000000000000000000000000000000000000, // 1 NoD Pts/sec at Level 1 (1e60)
        baseCost: 1000000000000000000000000000000000000000000000000000000000000000, // 100 NoD Points at Level 1 (1e62)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Reverses thermodynamic decay, stabilizing fleeting cosmic anomalies.'
    },
    {
        id: 'mycelial_world_tree',
        name: 'Mycelial World Tree',
        tier: 'multiplicity',
        baseGen: 10000000000000000000000000000000000000000000000000000000000000000, // 1 Vg Pts/sec at Level 1 (1e63)
        baseCost: 1000000000000000000000000000000000000000000000000000000000000000000, // 100 Vg Points at Level 1 (1e65)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'An organic cosmic root system intertwining life and points across dimensions.'
    },
    {
        id: 'void_singularity_matrix',
        name: 'Void Singularity Matrix',
        tier: 'multiplicity',
        baseGen: 10000000000000000000000000000000000000000000000000000000000000000000, // 1 UVg Pts/sec at Level 1 (1e66)
        baseCost: 1000000000000000000000000000000000000000000000000000000000000000000000, // 100 UVg Points at Level 1 (1e68)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'Harnesses supermassive singularity horizons to amplify all generator output.'
    },
    {
        id: 'multiplicity_core',
        name: 'Multiplicity Core',
        tier: 'multiplicity',
        baseGen: 10000000000000000000000000000000000000000000000000000000000000000000000, // 1 DVg Pts/sec at Level 1 (1e69)
        baseCost: 1000000000000000000000000000000000000000000000000000000000000000000000000, // 100 DVg Points at Level 1 (1e71)
        maxLevel: 30,
        genScaling: 1.85,
        costScaling: 2.6,
        reqRebirth: 5,
        description: 'The supreme nexus of multiplicity, exponentially multiplying all powers of creation.'
    }
];

/**
 * Maximum level allowed per generator (default fallback for classic generators)
 */
export const MAX_GENERATOR_LEVEL = 10;

/**
 * Calculate Point generation per second for a specific generator level
 * Formula: Generation = Base Generation × genScaling^(Level - 1)
 * @param {Object} def - Generator definition
 * @param {number} level - Current generator level
 * @returns {number} Points generated per second
 */
export function getGeneratorGen(def, level) {
    if (!def || !level || level <= 0) return 0;
    const scaling = def.genScaling || 1.6;
    return def.baseGen * Math.pow(scaling, level - 1);
}

/**
 * Calculate next level Point generation boost for a generator
 * @param {Object} def - Generator definition
 * @param {number} level - Current generator level
 * @returns {number} Increase in Points/sec for leveling up
 */
export function getNextLevelGenBoost(def, level) {
    const maxLevel = def ? (def.maxLevel || 10) : 10;
    if (!def || level >= maxLevel) return 0;
    const currentGen = getGeneratorGen(def, level);
    const nextGen = getGeneratorGen(def, level + 1);
    return nextGen - currentGen;
}

/**
 * Calculate multi-level upgrade information (cost, count, boost) for a generator
 * @param {Object} def - Generator definition
 * @param {number} currentLevel - Current generator level
 * @param {number|string} mode - Buy mode multiplier (1, 5, 10, 'MAX')
 * @param {number} currentCurrency - Player's current Points currency
 * @returns {Object} { levelsToBuy, totalCost, nextGenBoost }
 */
export function getMultiLevelInfo(def, currentLevel, mode, currentCurrency) {
    const maxLevel = def ? (def.maxLevel || 10) : 10;
    const remaining = maxLevel - currentLevel;
    if (!def || remaining <= 0) {
        return { levelsToBuy: 0, totalCost: 0, nextGenBoost: 0 };
    }

    let targetCount = 0;
    let totalCost = 0;

    if (mode === 'MAX') {
        let tempCost = 0;
        let count = 0;
        let currencyLeft = currentCurrency;

        for (let i = 0; i < remaining; i++) {
            const levelCost = getGeneratorCost(def, currentLevel + i);
            if (currencyLeft >= levelCost) {
                currencyLeft -= levelCost;
                tempCost += levelCost;
                count++;
            } else {
                break;
            }
        }

        if (count > 0) {
            targetCount = count;
            totalCost = tempCost;
        } else {
            // Cannot afford even 1 level
            targetCount = 1;
            totalCost = getGeneratorCost(def, currentLevel);
        }
    } else {
        const requested = typeof mode === 'number' ? mode : (parseInt(mode, 10) || 1);
        targetCount = Math.min(requested, remaining);
        
        for (let i = 0; i < targetCount; i++) {
            totalCost += getGeneratorCost(def, currentLevel + i);
        }
    }

    const currentGen = getGeneratorGen(def, currentLevel);
    const targetGen = getGeneratorGen(def, currentLevel + targetCount);
    const nextGenBoost = targetGen - currentGen;

    return {
        levelsToBuy: targetCount,
        totalCost,
        nextGenBoost
    };
}

/**
 * Calculate upgrade cost to upgrade generator to the next level
 * Formula: Cost = Math.floor(Base Cost × costScaling^(Level))
 * @param {Object} def - Generator definition
 * @param {number} currentLevel - Current generator level
 * @returns {number} Points cost for next upgrade
 */
export function getGeneratorCost(def, currentLevel) {
    const maxLevel = def ? (def.maxLevel || 10) : 10;
    if (!def || currentLevel >= maxLevel) return Infinity;
    const scaling = def.costScaling || 2.0;
    const baseCost = Math.floor(def.baseCost * Math.pow(scaling, currentLevel));
    const eventDiscount = getCurrentEventCostDiscountMult();
    const badgeDiscount = getBadgeUpgradeCostDiscountMult();

    const state = stateManager.getState();
    // Multiplicity: Entropy Dissolution (-25% discount)
    const hasEntropyDissolution = !!(state.upgrades && state.upgrades['entropy_dissolution']);
    const multiplicityDiscount = hasEntropyDissolution ? 0.75 : 1.00;

    // Multiplicity: Astral Harvester perk (-2% per 5 levels, up to -12%)
    const astralLvl = (state.generators && state.generators.astral_harvester) || 0;
    const astralDiscount = Math.max(0.70, 1.0 - (Math.floor(astralLvl / 5) * 0.02));

    return Math.max(1, Math.floor(baseCost * eventDiscount * badgeDiscount * multiplicityDiscount * astralDiscount));
}

/**
 * Calculate base total passive Points/sec generated by all player generators (un-multiplied)
 * @param {Object} [state] - Current state (or stateManager state)
 * @returns {number} Base un-multiplied Points/sec
 */
export function getBasePointGeneration(state) {
    const currentState = state || stateManager.getState();
    const generators = currentState.generators || {};
    let totalBaseGen = 0;

    GENERATOR_DEFS.forEach(def => {
        const level = generators[def.id] || 0;
        totalBaseGen += getGeneratorGen(def, level);
    });

    return totalBaseGen;
}

/**
 * Calculate actual final passive Points/sec stacking with player multipliers
 * Stacks with:
 * - Rebirth Multiplier (state.rebirthMultiplier)
 * - Singularity 10x Global Production Burst (isSingularityActive)
 * - Reality Engine (+15%), Infinite Singularity (+50%), Fractal Multiplier (x2.5), Celestial Cataclysm (x2), Apex of Multiplicity (x10)
 * - Cosmic Event Point Generation Multiplier (getCurrentEventPointGenMult)
 * - Point Accumulator Achievement Bonus
 * - Efficient Instinct Permanent Rebirth 2 Perk (+25%)
 * - Rebirth 4 Permanent Power Bonus (x2.0 Point Generation)
 * - Rebirth 5 Permanent Power Bonus (x4.0 Point Generation)
 * - Stardust Point Multiplier (x1, x2, x4, x8, x16, x32)
 * - Generator perks (Hyperdimensional Crucible, Void Singularity Matrix, Multiplicity Core)
 * - Badge Upgrades Multipliers
 * @param {Object} [state] - Current state (or stateManager state)
 * @returns {number} Final actual Points/sec
 */
export function getTotalPointGeneration(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount < 2) return 0;

    const baseGen = getBasePointGeneration(currentState);
    if (baseGen <= 0) return 0;

    const purchased = currentState.upgrades || {};
    let upgradeGenMult = 1;
    if (purchased['reality_engine']) upgradeGenMult *= 1.15;
    if (purchased['infinite_singularity']) upgradeGenMult *= 1.50;

    // Multiplicity upgrades multipliers
    if (purchased['fractal_multiplier']) upgradeGenMult *= 2.50;
    if (purchased['celestial_cataclysm']) upgradeGenMult *= 2.00;
    if (purchased['apex_of_multiplicity']) upgradeGenMult *= 10.00;

    // Multiplicity generator perks:
    // Hyperdimensional Crucible: +5% Point Multiplier per 5 levels
    const crucibleLvl = (currentState.generators && currentState.generators.hyperdimensional_crucible) || 0;
    if (crucibleLvl >= 5) {
        upgradeGenMult *= (1 + (Math.floor(crucibleLvl / 5) * 0.05));
    }

    // Void Singularity Matrix: +15% per 5 levels
    const voidMatLvl = (currentState.generators && currentState.generators.void_singularity_matrix) || 0;
    if (voidMatLvl >= 5) {
        upgradeGenMult *= (1 + (Math.floor(voidMatLvl / 5) * 0.15));
    }

    // Multiplicity Core: 2x Generator Output per 5 levels
    const multiplicityCoreLvl = (currentState.generators && currentState.generators.multiplicity_core) || 0;
    if (multiplicityCoreLvl >= 5) {
        upgradeGenMult *= Math.pow(2, Math.floor(multiplicityCoreLvl / 5));
    }

    const rebirthUpgrades = currentState.rebirthUpgrades || {};
    const hasEfficientInstinct = (rebirthCount >= 2) || !!rebirthUpgrades.efficient_instinct;
    const instinctPointGenMult = hasEfficientInstinct ? 1.25 : 1.00;

    // Layer: Rebirth 4 Permanent Power Bonus (x2 Generator Production)
    const currentStats = currentState.stats || {};
    const hasR4PowerBonus = (rebirthCount >= 4) || ((currentStats.highestRebirth || 0) >= 4) || !!rebirthUpgrades.r4_power_bonus;
    const r4PowerPointGenMult = hasR4PowerBonus ? 2.00 : 1.00;

    // Layer: Rebirth 5 Permanent Power Bonus (x4 Generator Production)
    const hasR5PowerBonus = (rebirthCount >= 5) || ((currentStats.highestRebirth || 0) >= 5) || !!rebirthUpgrades.r5_power_bonus;
    const r5PowerPointGenMult = hasR5PowerBonus ? 4.00 : 1.00;

    // Layer: Stardust Point Multiplier (x1, x2, x4, x8, x16, x32)
    const stardustPointMult = getStardustPointMult(currentState);

    const rebirthMultiplier = currentState.rebirthMultiplier || 1;
    const burstMultiplier = isSingularityActive() ? 10 : 1;
    const cosmicEventMultiplier = getCurrentEventPointGenMult();
    const accumBonus = 1 + (getAchievementBonus(currentState, 'point_accumulator') / 100);
    const badgeUpgradePointGenMult = 1 + getBadgeUpgradePointGenMult(currentState);
    const towerPointGenMult = 1 + ((currentState.tower && currentState.tower.bonuses && currentState.tower.bonuses.pointGen) || 0);

    return baseGen * rebirthMultiplier * burstMultiplier * cosmicEventMultiplier * accumBonus * upgradeGenMult * instinctPointGenMult * badgeUpgradePointGenMult * r4PowerPointGenMult * r5PowerPointGenMult * stardustPointMult * towerPointGenMult;
}

/**
 * Purchase/Upgrade a Point Generator by a specified mode multiplier
 * @param {string} generatorId - Generator identifier
 * @param {number|string} [mode=1] - Buy multiplier (1, 5, 10, 'MAX')
 * @returns {boolean} True if purchase succeeded
 */
export function purchaseGenerator(generatorId, mode = 1) {
    const currentState = stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount < 2) {
        showNotification('Point Generators require Rebirth 2!');
        return false;
    }

    const def = GENERATOR_DEFS.find(g => g.id === generatorId);
    if (!def) return false;

    if (def.reqRebirth && def.reqRebirth > rebirthCount) {
        showNotification(`${def.name} requires Rebirth ${def.reqRebirth}!`);
        return false;
    }

    const maxLevel = def.maxLevel || 10;
    const generators = currentState.generators || {};
    const currentLevel = generators[generatorId] || 0;

    if (currentLevel >= maxLevel) {
        showNotification(`${def.name} is already at Max Level (${maxLevel}/${maxLevel})!`);
        return false;
    }

    const currentCurrency = currentState.currency || 0;
    const multiInfo = getMultiLevelInfo(def, currentLevel, mode, currentCurrency);

    if (multiInfo.levelsToBuy <= 0 || currentCurrency < multiInfo.totalCost) {
        showNotification('Insufficient Points to upgrade generator!');
        return false;
    }

    // Deduct total cost and increment generator level by levelsToBuy
    const isFree = isCurrentEventCreationFrenzy() && Math.random() < 0.25;
    const finalCost = isFree ? 0 : multiInfo.totalCost;
    const newCurrency = currentCurrency - finalCost;
    const newLevel = currentLevel + multiInfo.levelsToBuy;
    const newGenerators = {
        ...generators,
        [generatorId]: newLevel
    };

    stateManager.setState({
        currency: newCurrency,
        generators: newGenerators
    });

    saveGame();
    if (isFree) {
        showNotification(`🌟 CREATION FRENZY! Upgraded ${def.name} +${multiInfo.levelsToBuy} Level(s) completely FREE!`);
    } else if (multiInfo.levelsToBuy === 1) {
        showNotification(`Upgraded ${def.name} to Level ${newLevel}!`);
    } else {
        showNotification(`Upgraded ${def.name} +${multiInfo.levelsToBuy} Levels (Now Level ${newLevel})!`);
    }
    return true;
}
