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
import { getCurrentEventPointGenMult } from './cosmicEvents.js';
import { getAchievementBonus } from './achievements.js';
import { getBadgeUpgradePointGenMult } from './badgeUpgrades.js';

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
    return Math.floor(def.baseCost * Math.pow(scaling, currentLevel));
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
 * - Reality Engine (+15%) & Infinite Singularity (+50%)
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

    const rebirthUpgrades = currentState.rebirthUpgrades || {};
    const hasEfficientInstinct = (rebirthCount >= 2) || !!rebirthUpgrades.efficient_instinct;
    const instinctPointGenMult = hasEfficientInstinct ? 1.25 : 1.00;

    const rebirthMultiplier = currentState.rebirthMultiplier || 1;
    const burstMultiplier = isSingularityActive() ? 10 : 1;
    const badgeUpgradePointGenMult = 1 + getBadgeUpgradePointGenMult(currentState);

    return baseGen * rebirthMultiplier * burstMultiplier * cosmicEventMultiplier * accumBonus * velBonus * upgradeGenMult * instinctPointGenMult * badgeUpgradePointGenMult;
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
    const newCurrency = currentCurrency - multiInfo.totalCost;
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
    if (multiInfo.levelsToBuy === 1) {
        showNotification(`Upgraded ${def.name} to Level ${newLevel}!`);
    } else {
        showNotification(`Upgraded ${def.name} +${multiInfo.levelsToBuy} Levels (Now Level ${newLevel})!`);
    }
    return true;
}
