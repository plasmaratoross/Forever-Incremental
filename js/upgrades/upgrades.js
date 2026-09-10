/**
 * ============================================================================
 * CLICKING UPGRADES SYSTEM & CALCULATIONS
 * ============================================================================
 * Location: /js/upgrades/upgrades.js
 * Purpose: Defines the 10 conceptual clicking upgrades, purchase validation,
 *          runtime stack decay (Momentum/Overclocking/Singularity), and the
 *          centralized layered stat calculation system.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { saveGame } from '../save/save.js';
import { getRebirthDifficultyMultiplier } from '../systems/rebirth.js';
import { getCurrentEventClickPowerMult } from '../systems/cosmicEvents.js';
import { getAchievementBonus } from '../systems/achievements.js';

/**
 * Calculate actual dynamic cost of an upgrade based on player's Rebirth difficulty multiplier and permanent upgrades
 * @param {Object} upgradeDef - Upgrade definition object containing base cost
 * @param {Object} [state] - Current state (or stateManager state)
 * @returns {number} Dynamic actual upgrade cost
 */
export function getUpgradeCost(upgradeDef, state) {
    if (!upgradeDef) return 0;
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    const diffMult = getRebirthDifficultyMultiplier(rebirthCount);

    // Efficient Instinct permanent Rebirth upgrade gives -15% cost reduction (x0.85), active automatically at Rebirth 2+
    const rebirthUpgrades = currentState.rebirthUpgrades || {};
    const hasEfficientInstinct = (rebirthCount >= 2) || !!rebirthUpgrades.efficient_instinct;
    const costMult = hasEfficientInstinct ? 0.85 : 1.00;

    return Math.floor(upgradeDef.cost * diffMult * costMult);
}

/**
 * The 13 Conceptual Clicking Upgrades Definitions (10 Basic + 3 Advanced)
 */
export const CLICK_UPGRADES = [
    // ------------------------------------------------------------------------
    // BASIC CLICKING UPGRADES (#1 - #10)
    // ------------------------------------------------------------------------
    {
        id: 'mechanical_advantage',
        name: 'Mechanical Advantage',
        cost: 10,
        description: '+100% Click Power multiplier',
        effectType: 'click_multiplier',
        effectValue: 2,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'kinetic_transfer',
        name: 'Kinetic Transfer',
        cost: 100,
        description: '+3 flat Click Power',
        effectType: 'flat_click_power',
        effectValue: 3,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'focused_impact',
        name: 'Focused Impact',
        cost: 1000,
        description: '+15% Click Power multiplier',
        effectType: 'click_multiplier_percent',
        effectValue: 0.15,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'resonant_force',
        name: 'Resonant Force',
        cost: 10000,
        description: 'Every 10th manual click deals 3x normal click damage',
        effectType: 'resonant_click',
        effectValue: 3,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'momentum',
        name: 'Momentum',
        cost: 100000,
        description: 'Each consecutive click increases Click Power by +1%, stacking up to 25 times (+25% max)',
        effectType: 'momentum_stacks',
        effectValue: 0.01,
        maxStacks: 25,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'critical_mass',
        name: 'Critical Mass',
        cost: 1000000,
        description: '+5% Critical Chance; Critical Clicks deal 5x damage',
        effectType: 'critical_hits',
        critChance: 0.05,
        critMultiplier: 5,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'overclocking',
        name: 'Overclocking',
        cost: 12500000,
        description: 'Each consecutive click increases click speed bonus by 2%, stacking up to 15 times (+30% max)',
        effectType: 'overclocking_stacks',
        effectValue: 0.02,
        maxStacks: 15,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'feedback_loop',
        name: 'Feedback Loop',
        cost: 150000000,
        description: '5% of current passive income is added to every manual click',
        effectType: 'passive_income_feedback',
        effectValue: 0.05,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'singularity',
        name: 'Singularity',
        cost: 2000000000,
        description: 'Every 100th manual click triggers a 10x global production burst for 5 seconds',
        effectType: 'singularity_burst',
        burstMultiplier: 10,
        burstDuration: 5000,
        tier: 'basic',
        survivesRebirth: false
    },
    {
        id: 'conceptual_breakthrough',
        name: 'Conceptual Breakthrough',
        cost: 50000000000,
        description: '+1% Click Power for every 1,000 total lifetime manual clicks',
        effectType: 'breakthrough_scaling',
        effectValue: 0.01,
        clicksPerPercent: 1000,
        tier: 'basic',
        survivesRebirth: false
    },

    // ------------------------------------------------------------------------
    // ADVANCED CLICKING UPGRADES (#11 - #13) [Unlocked after Rebirth 1]
    // ------------------------------------------------------------------------
    {
        id: 'neural_resonance',
        name: 'Neural Resonance',
        cost: 250000000000, // 250 Billion
        description: 'Every 20th manual click creates a bonus click worth 5x current Click Power',
        effectType: 'neural_resonance_click',
        effectValue: 5,
        triggerFrequency: 20,
        tier: 'advanced',
        survivesRebirth: false
    },
    {
        id: 'quantum_momentum',
        name: 'Quantum Momentum',
        cost: 1500000000000, // 1.5 Trillion
        description: 'Increases Momentum max stack limit from 25 to 50, and each stack gives +1.5% Click Power',
        effectType: 'momentum_expansion',
        maxStacks: 50,
        effectValue: 0.015,
        tier: 'advanced',
        survivesRebirth: false
    },
    {
        id: 'causal_amplification',
        name: 'Causal Amplification',
        cost: 10000000000000, // 10 Trillion
        description: 'Every 1,000 Lifetime Clicks grants +1% Clicking Effectiveness',
        effectType: 'causal_scaling',
        effectValue: 0.01,
        clicksPerPercent: 1000,
        tier: 'advanced',
        survivesRebirth: false
    },

    // ------------------------------------------------------------------------
    // COSMIC CLICKING UPGRADES (#14 - #20) [Unlocked after Rebirth 3]
    // ------------------------------------------------------------------------
    {
        id: 'chrono_pulse',
        name: 'Chrono Pulse',
        cost: 50000000000000, // 50 Trillion
        description: '+10,000,000 Flat Click Power & +10% Autoclicker Output',
        effectType: 'chrono_power',
        effectValue: 10000000,
        tier: 'cosmic',
        survivesRebirth: true
    },
    {
        id: 'reality_engine',
        name: 'Reality Engine',
        cost: 500000000000000, // 500 Trillion
        description: 'Click Power ×1.50 Multiplier & +15% Passive Point Generation',
        effectType: 'reality_multiplier',
        effectValue: 1.50,
        tier: 'cosmic',
        survivesRebirth: true
    },
    {
        id: 'causality_drive',
        name: 'Causality Drive',
        cost: 5000000000000000, // 5 Quadrillion
        description: 'Increases Momentum max stack limit to 100 with +2.0% Click Power per stack (+200% max)',
        effectType: 'causality_momentum',
        maxStacks: 100,
        effectValue: 0.02,
        tier: 'cosmic',
        survivesRebirth: true
    },
    {
        id: 'entropy_breaker',
        name: 'Entropy Breaker',
        cost: 50000000000000000, // 50 Quadrillion
        description: '+10% Critical Hit Chance; Critical Clicks deal 10x damage',
        effectType: 'entropy_crit',
        critChance: 0.10,
        critMultiplier: 10,
        tier: 'cosmic',
        survivesRebirth: true
    },
    {
        id: 'dimensional_core',
        name: 'Dimensional Core',
        cost: 500000000000000000, // 500 Quadrillion
        description: '+5% Click Power for every 1,000 total lifetime manual clicks',
        effectType: 'dimensional_scaling',
        effectValue: 0.05,
        clicksPerPercent: 1000,
        tier: 'cosmic',
        survivesRebirth: true
    },
    {
        id: 'paradox_engine',
        name: 'Paradox Engine',
        cost: 5000000000000000000, // 5 Quintillion
        description: '+50% Active Cosmic Event Buff Power & Click Power ×2.50 Multiplier',
        effectType: 'paradox_boost',
        effectValue: 2.50,
        tier: 'cosmic',
        survivesRebirth: true
    },
    {
        id: 'infinite_singularity',
        name: 'Infinite Singularity',
        cost: 100000000000000000000, // 100 Quintillion
        description: 'Click Power ×5.00 Multiplier & +50% Global Point Generation',
        effectType: 'infinite_transcendence',
        effectValue: 5.00,
        tier: 'cosmic',
        survivesRebirth: true
    },

    // ------------------------------------------------------------------------
    // TRANSCENDENT CLICKING UPGRADES (#21 - #26) [Unlocked after Rebirth 4]
    // ------------------------------------------------------------------------
    {
        id: 'singularity_compression',
        name: 'Singularity Compression',
        cost: 1000000000000000000, // 1 Hexillion / 1 Qi
        description: 'Click Power ×2.00 Multiplier & Autoclicker output +25%',
        effectType: 'singularity_compression_mult',
        effectValue: 2.00,
        tier: 'transcendent',
        survivesRebirth: true
    },
    {
        id: 'quantum_entanglement',
        name: 'Quantum Entanglement',
        cost: 20000000000000000000, // 20 Hexillion / 20 Qi
        description: '15% of current passive Point generation is added to every manual click',
        effectType: 'passive_income_entanglement',
        effectValue: 0.15,
        tier: 'transcendent',
        survivesRebirth: true
    },
    {
        id: 'temporal_stasis',
        name: 'Temporal Stasis',
        cost: 500000000000000000000, // 500 Hexillion / 500 Qi
        description: 'Extends active Cosmic Event duration by +15 seconds',
        effectType: 'event_duration_stasis',
        durationBonus: 15,
        tier: 'transcendent',
        survivesRebirth: true
    },
    {
        id: 'aetheric_overcharge',
        name: 'Aetheric Overcharge',
        cost: 10000000000000000000000, // 10 Septillion / 10 Sx
        description: 'Increases Momentum max stack limit to 150 (+300% max) and extends decay timeout to 6 seconds',
        effectType: 'overcharge_momentum',
        maxStacks: 150,
        decayTimeout: 6000,
        tier: 'transcendent',
        survivesRebirth: true
    },
    {
        id: 'event_horizon',
        name: 'Event Horizon',
        cost: 2500000000000000000000000, // 2.5 Septillion / 2.5 Sp
        description: 'Every 50th manual click triggers an Event Horizon burst dealing 10x damage',
        effectType: 'event_horizon_click',
        triggerFrequency: 50,
        effectValue: 10,
        tier: 'transcendent',
        survivesRebirth: true
    },
    {
        id: 'transcendent_reality',
        name: 'Transcendent Reality',
        cost: 10000000000000000000000000000, // 10 Octillion / 10 Oc
        description: '+10% Click Power for every total Rebirth completed',
        effectType: 'transcendent_rebirth_scaling',
        effectValue: 0.10,
        tier: 'transcendent',
        survivesRebirth: true
    }
];

/**
 * Temporary Runtime Stack & Buff Tracker
 */
export const runtimeState = {
    momentumStacks: 0,
    lastMomentumTime: 0,
    overclockStacks: 0,
    lastOverclockTime: 0,
    singularityEndTime: 0
};

/**
 * Check if Singularity 10x Global Production Burst is currently active
 */
export function isSingularityActive() {
    return Date.now() < runtimeState.singularityEndTime;
}

/**
 * Get remaining duration of Singularity burst in seconds
 */
export function getSingularityRemainingSec() {
    if (!isSingularityActive()) return 0;
    return Math.max(0, Math.ceil((runtimeState.singularityEndTime - Date.now()) / 1000));
}

/**
 * Trigger Singularity Global Production Burst for durationMs
 */
export function triggerSingularityBurst(durationMs = 5000) {
    runtimeState.singularityEndTime = Date.now() + durationMs;
}

/**
 * Process runtime decay timers for Momentum and Overclocking stacks (3s default, 6s with Aetheric Overcharge)
 */
export function processRuntimeDecay() {
    const now = Date.now();
    const state = stateManager.getState();
    const purchased = state.upgrades || {};
    const decayTimeout = purchased['aetheric_overcharge'] ? 6000 : 3000;

    // Momentum decay after inactivity timeout
    if (runtimeState.momentumStacks > 0 && now - runtimeState.lastMomentumTime > decayTimeout) {
        runtimeState.momentumStacks = 0;
    }

    // Overclocking decay after inactivity timeout
    if (runtimeState.overclockStacks > 0 && now - runtimeState.lastOverclockTime > decayTimeout) {
        runtimeState.overclockStacks = 0;
    }
}

/**
 * Update Momentum & Overclocking stacks upon a manual click
 */
export function registerClickRuntimeStacks(purchasedUpgrades) {
    const now = Date.now();

    // 1. Momentum stack increment (Aetheric Overcharge cap 150; Causality Drive cap 100; Quantum Momentum cap 50; Default 25)
    if (purchasedUpgrades['momentum']) {
        const maxLimit = purchasedUpgrades['aetheric_overcharge'] ? 150 : (purchasedUpgrades['causality_drive'] ? 100 : (purchasedUpgrades['quantum_momentum'] ? 50 : 25));
        if (runtimeState.momentumStacks < maxLimit) {
            runtimeState.momentumStacks += 1;
        }
        runtimeState.lastMomentumTime = now;
    }

    // 2. Overclocking stack increment
    if (purchasedUpgrades['overclocking']) {
        if (runtimeState.overclockStacks < 15) {
            runtimeState.overclockStacks += 1;
        }
        runtimeState.lastOverclockTime = now;
    }
}

/**
 * Get current passive income per second from state for feedback calculation
 */
export function getPassiveIncomePerSec(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount < 2) return 0;
    const gens = currentState.generators || {};
    let totalGen = 0;
    // Basic estimation of Point generation
    totalGen += (gens.condenser || 0) * 100000;
    totalGen += (gens.extractor || 0) * 10000000;
    totalGen += (gens.reactor || 0) * 1000000000;
    totalGen += (gens.core || 0) * 100000000000;
    totalGen += (gens.singularity || 0) * 10000000000000;
    return totalGen * (currentState.rebirthMultiplier || 1);
}

/**
 * Central Layered Stat Calculation System for Click Rewards
 * @param {Object} state - Current global state
 * @param {boolean} isManualClick - True if triggered by player click
 */
export function calculateClickReward(state, isManualClick = false) {
    processRuntimeDecay();

    const purchased = state.upgrades || {};
    const rebirthUpgrades = state.rebirthUpgrades || {};
    const totalClicks = (state.stats && state.stats.totalClicks) || 0;

    // Layer 1: Base Click Power
    let baseClickPower = state.clickPower || 1;

    // Layer 2: Flat Bonuses (Kinetic Transfer: +3, Chrono Pulse: +10,000,000)
    let flatBonus = 0;
    if (purchased['kinetic_transfer']) {
        flatBonus += 3;
    }
    if (purchased['chrono_pulse']) {
        flatBonus += 10000000;
    }

    const flatTotal = baseClickPower + flatBonus;

    // Layer 3: Click Multipliers (Mechanical Advantage: x2, Focused Impact: +15%, Reality Engine: x1.50, Paradox Engine: x2.50, Infinite Singularity: x5.00, Singularity Compression: x2.00)
    let clickMultiplier = 1;
    if (purchased['mechanical_advantage']) {
        clickMultiplier *= 2;
    }
    if (purchased['focused_impact']) {
        clickMultiplier *= 1.15;
    }
    if (purchased['reality_engine']) {
        clickMultiplier *= 1.50;
    }
    if (purchased['paradox_engine']) {
        clickMultiplier *= 2.50;
    }
    if (purchased['infinite_singularity']) {
        clickMultiplier *= 5.00;
    }
    if (purchased['singularity_compression']) {
        clickMultiplier *= 2.00;
    }

    // Layer 4: Rebirth Multiplier & Transcendent Reality Scaling
    const rebirthCount = state.rebirthCount || 0;
    let rebirthMultiplier = state.rebirthMultiplier || 1;
    if (purchased['transcendent_reality']) {
        rebirthMultiplier *= (1 + (rebirthCount * 0.10));
    }

    // Layer 5: Momentum Multiplier (Aetheric Overcharge: up to 150 stacks; Causality Drive: +2.0% up to 100; Quantum Momentum: +1.5% up to 50; Default: +1.0% up to 25)
    let momentumMultiplier = 1;
    if (purchased['momentum']) {
        const momentumRate = purchased['aetheric_overcharge'] ? 0.02 : (purchased['causality_drive'] ? 0.02 : (purchased['quantum_momentum'] ? 0.015 : 0.01));
        momentumMultiplier = 1 + (runtimeState.momentumStacks * momentumRate);
    }

    // Layer 6: Conceptual Breakthrough Multiplier (+1% per 1,000 total lifetime clicks)
    let breakthroughMultiplier = 1;
    if (purchased['conceptual_breakthrough']) {
        const thousandClicks = Math.floor(totalClicks / 1000);
        breakthroughMultiplier = 1 + (thousandClicks * 0.01);
    }

    // Layer 6b: Causal Amplification Multiplier (+1% per 1,000 lifetime clicks)
    let causalMultiplier = 1;
    if (purchased['causal_amplification']) {
        const thousandClicks = Math.floor(totalClicks / 1000);
        causalMultiplier = 1 + (thousandClicks * 0.01);
    }

    // Layer 6c: Dimensional Core Multiplier (+5% per 1,000 lifetime clicks)
    let dimensionalMultiplier = 1;
    if (purchased['dimensional_core']) {
        const thousandClicks = Math.floor(totalClicks / 1000);
        dimensionalMultiplier = 1 + (thousandClicks * 0.05);
    }

    // Layer 6d: Clicker Achievement Permanent Bonus (+0.5% per level, up to +15%)
    const clickerAchBonus = 1 + (getAchievementBonus(state, 'clicker') / 100);

    // Layer 6e: Cosmic Events Multiplier (Paradox Engine amplifies cosmic buff by +50%)
    let cosmicClickMult = getCurrentEventClickPowerMult();
    if (purchased['paradox_engine'] && cosmicClickMult > 1) {
        cosmicClickMult = 1 + ((cosmicClickMult - 1) * 1.50);
    }

    // Layer 6f: Efficient Instinct Rebirth 2 Perk Bonus (+25% Click Power)
    const hasEfficientInstinct = (rebirthCount >= 2) || !!rebirthUpgrades.efficient_instinct;
    const instinctClickMult = hasEfficientInstinct ? 1.25 : 1.00;

    // Combine core multipliers & Cosmic Events multiplier & Achievement bonus & Rebirth 2 Perk
    let currentPower = flatTotal * clickMultiplier * rebirthMultiplier * momentumMultiplier * breakthroughMultiplier * causalMultiplier * dimensionalMultiplier * cosmicClickMult * clickerAchBonus * instinctClickMult;

    // Layer 7: Feedback Loop & Quantum Entanglement Passive Income Bonus
    if (purchased['feedback_loop']) {
        currentPower += getPassiveIncomePerSec(state) * 0.05;
    }
    if (purchased['quantum_entanglement']) {
        currentPower += getPassiveIncomePerSec(state) * 0.15;
    }

    // Flags for click effects
    let isResonant = false;
    let isCrit = false;
    let isSingularityTrigger = false;

    if (isManualClick) {
        // Register runtime stack progression
        registerClickRuntimeStacks(purchased);

        const nextClickCount = totalClicks + 1;

        // Layer 8: Resonant Force, Neural Resonance & Event Horizon
        if (purchased['resonant_force'] && nextClickCount % 10 === 0) {
            isResonant = true;
            currentPower *= 3;
        }
        if (purchased['event_horizon'] && nextClickCount % 50 === 0) {
            isResonant = true;
            currentPower *= 10;
        }

        // Layer 9: Critical Mass & Entropy Breaker (Base 5% for 5x; Entropy Breaker adds +10% chance for 10x crit multiplier)
        let critChance = 0;
        let critMult = 5;
        if (purchased['critical_mass']) critChance += 0.05;
        if (purchased['entropy_breaker']) {
            critChance += 0.10;
            critMult = 10;
        }

        if (critChance > 0 && Math.random() < critChance) {
            isCrit = true;
            currentPower *= critMult;
        }

        // Layer 10: Singularity Trigger (Every 100th manual click triggers 10x burst for 5s)
        if (purchased['singularity'] && nextClickCount % 100 === 0) {
            isSingularityTrigger = true;
            triggerSingularityBurst(5000);
        }
    }

    // Active Singularity Global Production Burst Multiplier (10x)
    if (isSingularityActive()) {
        currentPower *= 10;
    }

    return {
        amount: currentPower,
        isResonant,
        isCrit,
        isSingularityTrigger,
        isSingularityActive: isSingularityActive(),
        momentumStacks: runtimeState.momentumStacks,
        overclockStacks: runtimeState.overclockStacks,
        breakthroughPercent: Math.floor(totalClicks / 1000)
    };
}

/**
 * Purchase a click upgrade
 * @param {string} upgradeId - Unique ID of upgrade
 */
export function purchaseUpgrade(upgradeId) {
    const upgradeDef = CLICK_UPGRADES.find(u => u.id === upgradeId);
    if (!upgradeDef) return false;

    const state = stateManager.getState();
    const purchased = state.upgrades || {};

    // Prevent duplicate purchases for one-time upgrades
    if (purchased[upgradeId]) return false;

    // Calculate actual cost considering Rebirth difficulty scaling
    const actualCost = getUpgradeCost(upgradeDef, state);

    // Verify sufficient currency
    if (state.currency < actualCost) return false;

    // Deduct actual cost and record purchase in state
    const newCurrency = state.currency - actualCost;
    const newUpgrades = { ...purchased, [upgradeId]: true };

    stateManager.setState({
        currency: newCurrency,
        upgrades: newUpgrades
    });

    // Save updated state to storage
    saveGame();
    return true;
}

