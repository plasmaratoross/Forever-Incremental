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
import { 
    cosmicEventRuntime,
    getCurrentEventClickPowerMult, 
    getCurrentEventCostDiscountMult, 
    getCurrentEventPPSClickSynergy, 
    isCurrentEventGuaranteedCrit,
    isCurrentEventMultiverseEcho,
    isCurrentEventMomentumLock,
    isCurrentEventCreationFrenzy,
    isCurrentEventPrimordialNova,
    isCurrentEventMaxOverclock,
    isCurrentEventTemporalMirror
} from '../systems/cosmicEvents.js';
import { getAchievementBonus } from '../systems/achievements.js';
import { getBadgeUpgradeClickMult, getBadgeUpgradeCostDiscountMult, getBadgeUpgradePPSClickSynergy } from '../systems/badgeUpgrades.js';
import { showNotification } from '../ui/notifications.js';
import { addCurrency } from '../systems/currency.js';
import { getStardustPointMult } from '../systems/stardust.js';
import { getTotalPointGeneration } from '../systems/generators.js';

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

    // Active Cosmic Event Cost Discount (90% or 99% off during rare jackpot anomalies)
    const eventDiscount = getCurrentEventCostDiscountMult();

    // Permanent Badge Upgrades Cost Discount (Chronologia -10%, Doom of Nihility -20%)
    const badgeDiscount = getBadgeUpgradeCostDiscountMult(currentState);

    // Multiplicity: Entropy Dissolution (-25% cost reduction)
    const hasEntropyDissolution = !!(currentState.upgrades && currentState.upgrades['entropy_dissolution']);
    const multiplicityDiscount = hasEntropyDissolution ? 0.75 : 1.00;

    // Multiplicity: Astral Harvester generator perk (-2% per 5 levels)
    const astralLvl = (currentState.generators && currentState.generators.astral_harvester) || 0;
    const astralDiscount = Math.max(0.70, 1.0 - (Math.floor(astralLvl / 5) * 0.02));

    return Math.max(1, Math.floor(upgradeDef.cost * diffMult * costMult * eventDiscount * badgeDiscount * multiplicityDiscount * astralDiscount));
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
    },

    // ------------------------------------------------------------------------
    // MULTIPLICITY CLICKING UPGRADES (#27 - #41) [Unlocked after Rebirth 5]
    // ------------------------------------------------------------------------
    {
        id: 'multiplicity_resonance',
        name: 'Multiplicity Resonance',
        cost: 1000000000000000000000000000000000, // 1 Decillion / 1 Dc (1e33)
        description: 'Click Power ×3.00 Multiplier & Super Crit chance increased to 0.2%',
        effectType: 'multiplicity_resonance',
        effectValue: 3.00,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'subatomic_fission',
        name: 'Subatomic Fission',
        cost: 25000000000000000000000000000000000, // 25 Decillion / 25 Dc (2.5e34)
        description: '25% of current passive Point generation is added to every manual click',
        effectType: 'fission_passive_synergy',
        effectValue: 0.25,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'fractal_multiplier',
        name: 'Fractal Multiplier',
        cost: 5000000000000000000000000000000000000, // 500 Decillion / 500 Dc (5e35)
        description: 'Point generation and Click Power ×2.50 Multiplier',
        effectType: 'fractal_mult',
        effectValue: 2.50,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'stardust_infusion',
        name: 'Stardust Infusion',
        cost: 100000000000000000000000000000000000000, // 10 Undecillion / 10 Ud (1e37)
        description: 'Click Power ×4.00 Multiplier; manual Stardust clicks grant +50% Point Click Power for 10 seconds',
        effectType: 'stardust_infusion',
        effectValue: 4.00,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'hyper_kinetic_flux',
        name: 'Hyper-Kinetic Flux',
        cost: 2000000000000000000000000000000000000000, // 200 Undecillion / 200 Ud (2e38)
        description: 'Increases Momentum max stacks to 250 (+500% max) and extends decay timeout to 8 seconds',
        effectType: 'hyper_kinetic_momentum',
        maxStacks: 250,
        decayTimeout: 8000,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'super_crit_matrix',
        name: 'Super Crit Matrix',
        cost: 50000000000000000000000000000000000000000, // 5 Duodecillion / 5 Dd (5e39)
        description: 'Increases Super Crit chance to 0.5% and Super Crit multiplier to ×150',
        effectType: 'super_crit_matrix',
        superCritChance: 0.005,
        superCritMult: 150,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'temporal_multiplicity',
        name: 'Temporal Multiplicity',
        cost: 1000000000000000000000000000000000000000000, // 100 Duodecillion / 100 Dd (1e41)
        description: 'Extends active Cosmic Event duration by +20 seconds',
        effectType: 'event_duration_multiplicity',
        durationBonus: 20,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'planetary_seismic_tap',
        name: 'Planetary Seismic Tap',
        cost: 25000000000000000000000000000000000000000000, // 2.5 Tredecillion / 2.5 Td (2.5e42)
        description: 'Every 25th manual click triggers a Seismic Shockwave dealing 15x damage',
        effectType: 'seismic_shockwave',
        triggerFrequency: 25,
        effectValue: 15,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'celestial_cataclysm',
        name: 'Celestial Cataclysm',
        cost: 500000000000000000000000000000000000000000000, // 50 Tredecillion / 50 Td (5e43)
        description: 'Multiplies Click Power by ×6.00 and Point Generators by ×2.00',
        effectType: 'celestial_cataclysm',
        clickMult: 6.00,
        genMult: 2.00,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'cosmic_overdrive',
        name: 'Cosmic Overdrive',
        cost: 1000000000000000000000000000000000000000000000, // 1 Quattuordecillion / 1 QaD (1e45)
        description: 'Autoclicker speed +50% and autoclicks gain a 0.05% chance to trigger Super Crit',
        effectType: 'cosmic_overdrive',
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'stellar_corona_surge',
        name: 'Stellar Corona Surge',
        cost: 250000000000000000000000000000000000000000000000, // 250 Quattuordecillion / 250 QaD (2.5e47)
        description: 'Click Power ×10.00 Multiplier & +100% active Cosmic Event buff strength',
        effectType: 'stellar_corona_surge',
        effectValue: 10.00,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'singular_plurality',
        name: 'Singular Plurality',
        cost: 50000000000000000000000000000000000000000000000000, // 50 Quindecillion / 50 QiD (5e49)
        description: '30% of passive Point generation added to clicks & Momentum stack build rate doubled',
        effectType: 'singular_plurality',
        effectValue: 0.30,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'hyper_dimensional_vortex',
        name: 'Hyper-Dimensional Vortex',
        cost: 10000000000000000000000000000000000000000000000000000, // 10 Sexdecillion / 10 SxD (1e52)
        description: 'Super Crit chance increased to 1.0% and damage multiplier increased to ×250',
        effectType: 'hyper_vortex_crit',
        superCritChance: 0.01,
        superCritMult: 250,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'entropy_dissolution',
        name: 'Entropy Dissolution',
        cost: 25000000000000000000000000000000000000000000000000000000, // 2.5 Septendecillion / 2.5 SpD (2.5e54)
        description: 'All Upgrade and Generator Point costs permanently reduced by 25%',
        effectType: 'cost_dissolution',
        discount: 0.25,
        tier: 'multiplicity',
        survivesRebirth: true
    },
    {
        id: 'apex_of_multiplicity',
        name: 'Apex of Multiplicity',
        cost: 1000000000000000000000000000000000000000000000000000000000, // 100 Septendecillion / 100 SpD (1e56)
        description: 'Click Power ×25.00 Multiplier and Global Point Generation ×10.00',
        effectType: 'apex_multiplicity',
        clickMult: 25.00,
        genMult: 10.00,
        tier: 'multiplicity',
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
 * Process runtime decay timers for Momentum and Overclocking stacks (3s default, 6s with Aetheric Overcharge, 8s with Hyper-Kinetic Flux)
 */
export function processRuntimeDecay() {
    const now = Date.now();
    const state = stateManager.getState();
    const purchased = state.upgrades || {};
    const decayTimeout = purchased['hyper_kinetic_flux'] ? 8000 : (purchased['aetheric_overcharge'] ? 6000 : 3000);

    // Momentum decay after inactivity timeout (immune and maxed if Momentum Lock active)
    if (isCurrentEventMomentumLock()) {
        const maxLimit = purchased['hyper_kinetic_flux'] ? 250 : (purchased['aetheric_overcharge'] ? 150 : (purchased['causality_drive'] ? 100 : (purchased['quantum_momentum'] ? 50 : 25)));
        runtimeState.momentumStacks = maxLimit;
        runtimeState.lastMomentumTime = now;
    } else if (runtimeState.momentumStacks > 0 && now - runtimeState.lastMomentumTime > decayTimeout) {
        runtimeState.momentumStacks = 0;
    }

    // Overclocking decay after inactivity timeout (immune and maxed if Max Overclock active)
    if (isCurrentEventMaxOverclock()) {
        runtimeState.overclockStacks = 15;
        runtimeState.lastOverclockTime = now;
    } else if (runtimeState.overclockStacks > 0 && now - runtimeState.lastOverclockTime > decayTimeout) {
        runtimeState.overclockStacks = 0;
    }
}

/**
 * Update Momentum & Overclocking stacks upon a manual click
 */
export function registerClickRuntimeStacks(purchasedUpgrades) {
    const now = Date.now();

    // 1. Momentum stack increment (Hyper-Kinetic Flux cap 250; Aetheric Overcharge cap 150; Causality Drive cap 100; Quantum Momentum cap 50; Default 25)
    if (purchasedUpgrades['momentum']) {
        const maxLimit = purchasedUpgrades['hyper_kinetic_flux'] ? 250 : (purchasedUpgrades['aetheric_overcharge'] ? 150 : (purchasedUpgrades['causality_drive'] ? 100 : (purchasedUpgrades['quantum_momentum'] ? 50 : 25)));
        const stackIncrement = purchasedUpgrades['singular_plurality'] ? 2 : 1;
        if (runtimeState.momentumStacks < maxLimit) {
            runtimeState.momentumStacks = Math.min(maxLimit, runtimeState.momentumStacks + stackIncrement);
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
    return getTotalPointGeneration(currentState);
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

    // Layer 3: Click Multipliers
    let clickMultiplier = 1;
    if (purchased['mechanical_advantage']) clickMultiplier *= 2;
    if (purchased['focused_impact']) clickMultiplier *= 1.15;
    if (purchased['reality_engine']) clickMultiplier *= 1.50;
    if (purchased['paradox_engine']) clickMultiplier *= 2.50;
    if (purchased['infinite_singularity']) clickMultiplier *= 5.00;
    if (purchased['singularity_compression']) clickMultiplier *= 2.00;

    // Multiplicity Click Upgrades (#27 - #41)
    if (purchased['multiplicity_resonance']) clickMultiplier *= 3.00;
    if (purchased['fractal_multiplier']) clickMultiplier *= 2.50;
    if (purchased['stardust_infusion']) {
        clickMultiplier *= 4.00;
        if (window.__stardustInfusionEndTime && Date.now() < window.__stardustInfusionEndTime) {
            clickMultiplier *= 1.50;
        }
    }
    if (purchased['celestial_cataclysm']) clickMultiplier *= 6.00;
    if (purchased['stellar_corona_surge']) clickMultiplier *= 10.00;
    if (purchased['apex_of_multiplicity']) clickMultiplier *= 25.00;

    // Multiplicity Generator Perks:
    // Stardust Collector: +10% Click Power per 5 levels
    const stardustCollectorLvl = (state.generators && state.generators.stardust_collector) || 0;
    if (stardustCollectorLvl >= 5) {
        clickMultiplier *= (1 + (Math.floor(stardustCollectorLvl / 5) * 0.10));
    }

    // Multiplicity Core: 2x Click Power per 5 levels
    const multiplicityCoreLvl = (state.generators && state.generators.multiplicity_core) || 0;
    if (multiplicityCoreLvl >= 5) {
        clickMultiplier *= Math.pow(2, Math.floor(multiplicityCoreLvl / 5));
    }

    // Layer 4: Rebirth Multiplier & Transcendent Reality Scaling
    const rebirthCount = state.rebirthCount || 0;
    let rebirthMultiplier = state.rebirthMultiplier || 1;
    if (purchased['transcendent_reality']) {
        rebirthMultiplier *= (1 + (rebirthCount * 0.10));
    }

    // Layer 5: Momentum Multiplier (Hyper-Kinetic Flux: up to 250 stacks; Aetheric Overcharge: up to 150 stacks; Causality Drive: +2.0% up to 100; Quantum Momentum: +1.5% up to 50; Default: +1.0% up to 25)
    let momentumMultiplier = 1;
    if (purchased['momentum']) {
        const momentumRate = (purchased['hyper_kinetic_flux'] || purchased['aetheric_overcharge'] || purchased['causality_drive']) ? 0.02 : (purchased['quantum_momentum'] ? 0.015 : 0.01);
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

    // Layer 6e: Cosmic Events Multiplier (Paradox Engine amplifies cosmic buff by +50%, Stellar Corona Surge adds +100%)
    let cosmicClickMult = getCurrentEventClickPowerMult();
    if (cosmicClickMult > 1) {
        let cosmicAmp = 0;
        if (purchased['paradox_engine']) cosmicAmp += 0.50;
        if (purchased['stellar_corona_surge']) cosmicAmp += 1.00;
        if (cosmicAmp > 0) {
            cosmicClickMult = 1 + ((cosmicClickMult - 1) * (1 + cosmicAmp));
        }
    }

    // Layer 6f: Efficient Instinct Permanent Rebirth Perk (+25% Click Power)
    const hasEfficientInstinct = (rebirthCount >= 2) || !!rebirthUpgrades.efficient_instinct;
    const instinctClickMult = hasEfficientInstinct ? 1.25 : 1.0;

    // Layer 6g: Permanent Badge Upgrades Click Power Multiplier
    const badgeUpgradeClickMult = 1 + getBadgeUpgradeClickMult(state);

    // Layer 6h: Rebirth 4 Permanent Power Bonus (x2 Click Power)
    const currentStats = state.stats || {};
    const hasR4PowerBonus = (rebirthCount >= 4) || ((currentStats.highestRebirth || 0) >= 4) || !!rebirthUpgrades.r4_power_bonus;
    const r4PowerClickMult = hasR4PowerBonus ? 2.0 : 1.0;

    // Layer 6i: Rebirth 5 Permanent Power Bonus (x4 Click Power)
    const hasR5PowerBonus = (rebirthCount >= 5) || ((currentStats.highestRebirth || 0) >= 5) || !!rebirthUpgrades.r5_power_bonus;
    const r5PowerClickMult = hasR5PowerBonus ? 4.0 : 1.0;

    // Layer 6j: Stardust Point Multiplier (x1, x2, x4, x8, x16, x32)
    const stardustPointMult = getStardustPointMult(state);

    // Layer 6k: Permanent Infinity Tower Stacking Click Power Bonus
    const towerClickMult = 1 + ((state.tower && state.tower.bonuses && state.tower.bonuses.clickPower) || 0);

    // Combine core multipliers & Cosmic Events multiplier & Achievement bonus & Rebirth Perks & Badge Upgrades & Stardust Multiplier & Infinity Tower
    let currentPower = flatTotal * clickMultiplier * rebirthMultiplier * momentumMultiplier * breakthroughMultiplier * causalMultiplier * dimensionalMultiplier * cosmicClickMult * clickerAchBonus * instinctClickMult * badgeUpgradeClickMult * r4PowerClickMult * r5PowerClickMult * stardustPointMult * towerClickMult;

    // Layer 7: Passive Income Click Synergies
    const pps = getPassiveIncomePerSec(state);
    if (purchased['feedback_loop']) {
        currentPower += pps * 0.05;
    }
    if (purchased['quantum_entanglement']) {
        currentPower += pps * 0.15;
    }
    if (purchased['subatomic_fission']) {
        currentPower += pps * 0.25;
    }
    if (purchased['singular_plurality']) {
        currentPower += pps * 0.30;
    }

    // Generator perk: Mycelial World Tree (+2% PPS to Click Power per 5 levels)
    const mycelialLvl = (state.generators && state.generators.mycelial_world_tree) || 0;
    if (mycelialLvl >= 5) {
        currentPower += pps * (Math.floor(mycelialLvl / 5) * 0.02);
    }

    // Layer 7b: Active Cosmic Event PPS Synergy (Infinity Convergence / Genesis Singularity)
    const eventSynergyRatio = getCurrentEventPPSClickSynergy();
    if (eventSynergyRatio > 0) {
        currentPower += pps * eventSynergyRatio;
    }

    // Layer 7c: Active Cosmic Event Temporal Mirror (Infinity Convergence)
    if (isCurrentEventTemporalMirror()) {
        currentPower += pps * 0.05;
    }

    // Layer 7c2: Permanent Badge Upgrade PPS Synergy (Doom of Nihility +5% PPS to Clicks)
    const badgePPSRatio = getBadgeUpgradePPSClickSynergy(state);
    if (badgePPSRatio > 0) {
        currentPower += pps * badgePPSRatio;
    }

    // Layer 7d: Active Cosmic Event Multiverse Echo (Omniversal Break: +35% Echo Damage)
    let isMultiverseEcho = false;
    if (isCurrentEventMultiverseEcho()) {
        isMultiverseEcho = true;
        currentPower *= 1.35;
    }

    // Flags for click effects
    let isResonant = false;
    let isCrit = false;
    let isSingularityTrigger = false;

    if (isManualClick) {
        // Register runtime stack progression
        registerClickRuntimeStacks(purchased);

        const nextClickCount = totalClicks + 1;

        // Layer 8: Resonant Force, Neural Resonance, Event Horizon & Planetary Seismic Tap
        if (purchased['resonant_force'] && nextClickCount % 10 === 0) {
            isResonant = true;
            currentPower *= 3;
        }
        if (purchased['planetary_seismic_tap'] && nextClickCount % 25 === 0) {
            isResonant = true;
            currentPower *= 15;
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

    // Active Cosmic Event Guaranteed Crits (Quantum Hyper-Surge & Genesis Singularity apply to all clicks & autoclicks)
    if (isCurrentEventGuaranteedCrit()) {
        if (!isResonant) {
            isResonant = true;
            currentPower *= 3;
        }
        if (!isCrit) {
            isCrit = true;
            currentPower *= (purchased['entropy_breaker'] ? 10 : 5);
        }
    }

    // Active Cosmic Event Primordial Nova Cascade (Genesis Singularity - Every 25th click)
    let isPrimordialNova = false;
    let novaPointsGained = 0;
    if (isCurrentEventPrimordialNova()) {
        const currentClicksAll = (state.stats && state.stats.totalClicksAll) || totalClicks;
        if ((currentClicksAll + 1) % 25 === 0) {
            isPrimordialNova = true;
            currentPower *= 25; // 25x Nova explosion damage
            novaPointsGained = pps * 15; // 15s instant passive production
            if (novaPointsGained > 0) {
                addCurrency(novaPointsGained);
            }
        }
    }

    // Layer 11: Rebirth 5 Super Crit (0.1% base chance for x100 multiplier)
    let isSuperCrit = false;
    let superCritMult = 100;
    if (hasR5PowerBonus) {
        let superCritChance = 0.001; // 0.1% base
        if (purchased['multiplicity_resonance']) superCritChance += 0.001; // +0.1% -> 0.2%
        if (purchased['super_crit_matrix']) {
            superCritChance += 0.003; // +0.3% -> 0.5%
            superCritMult = 150;
        }
        if (purchased['hyper_dimensional_vortex']) {
            superCritChance += 0.005; // +0.5% -> 1.0%
            superCritMult = 250;
        }

        // Generator perk: Subatomic Annihilator (+0.1% Super Crit chance per 5 levels)
        const subatomicLvl = (state.generators && state.generators.subatomic_annihilator) || 0;
        superCritChance += Math.floor(subatomicLvl / 5) * 0.001;

        // Active Cosmic Event: Supercell World-Devourer skyrockets Super Crit to 10% and x500!
        if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.id === 'supercell_world_devourer') {
            superCritChance = 0.10;
            superCritMult = 500;
        }

        const canRollSuperCrit = isManualClick || !!purchased['cosmic_overdrive'];
        const finalRollChance = (!isManualClick && purchased['cosmic_overdrive']) ? 0.0005 : superCritChance;

        if (canRollSuperCrit && Math.random() < finalRollChance) {
            isSuperCrit = true;
            currentPower *= superCritMult;
        }
    }

    // Active Cosmic Event: Solar Flare Cataclysm (10% chance for 50x Solar Burst)
    let isSolarBurst = false;
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.id === 'solar_flare_cataclysm') {
        if (Math.random() < 0.10) {
            isSolarBurst = true;
            currentPower *= 50;
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
        isSuperCrit,
        superCritMult,
        isSolarBurst,
        isSingularityTrigger,
        isSingularityActive: isSingularityActive(),
        isMultiverseEcho,
        isPrimordialNova,
        novaPointsGained,
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

    // Creation Frenzy mechanic (Genesis Singularity): 25% chance for purchase to be completely FREE!
    const isFree = isCurrentEventCreationFrenzy() && Math.random() < 0.25;
    const newCurrency = isFree ? state.currency : (state.currency - actualCost);
    const newUpgrades = { ...purchased, [upgradeId]: true };

    stateManager.setState({
        currency: newCurrency,
        upgrades: newUpgrades
    });

    if (isFree) {
        showNotification('🌟 CREATION FRENZY! Upgrade acquired completely FREE (100% Discount)!');
    }

    // Save updated state to storage
    saveGame();
    return true;
}

