/**
 * ============================================================================
 * COSMIC EVENTS SYSTEM (REBIRTH 3 WORLD-STATE ANOMALIES)
 * ============================================================================
 * Location: /js/systems/cosmicEvents.js
 * Purpose: Defines the 12 Cosmic Events, sequential conditional roll logic,
 *          180s anomaly cooldown timers (150s for Rebirth 4+), 90s active event
 *          durations, background tab timestamp catch-up, persistent state sync,
 *          second-by-second reactive UI notification, game-wide visual theme &
 *          floating particle / cosmic object VFX overlay system, and buff getters.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { audioManager } from '../audio/audioManager.js';
import { showNotification } from '../ui/notifications.js';
import { getAchievementBonus } from './achievements.js';
import { addCurrency } from './currency.js';
import { formatNumber } from '../utils/format.js';

/**
 * Default base cooldown period between cosmic events (180 seconds default at R3, 150 seconds after Rebirth 4)
 */
export const EVENT_COOLDOWN_MS = 180000;

let lastNotifiedSec = -1;

/**
 * Get active Event Cooldown duration based on player Rebirth level (75s for Rebirth 5+, 150s for Rebirth 4, 180s otherwise)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Cooldown in milliseconds
 */
export function getEventCooldownMs(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (rebirthCount >= 5) return 75000;
    if (rebirthCount >= 4) return 150000;
    return 180000;
}

/**
 * Complete list of the 7 Rebirth 3 Cosmic Occasions required for Rebirth 4 progression
 */
export const R3_COSMIC_EVENT_IDS = [
    'time_pulse',
    'causal_shift',
    'paradox_loop',
    'time_collapse',
    'reality_fracture',
    'null_paradox',
    'omniversal_break'
];

/**
 * Complete list of the 3 Rebirth 5 Catastrophic Nature Cosmic Occasions
 */
export const R5_COSMIC_EVENT_IDS = [
    'solar_flare_cataclysm',
    'tectonic_rupture',
    'supercell_world_devourer'
];

/**
 * Definitions for the 12 Cosmic Events ordered from most common to rarest
 */
export const COSMIC_EVENTS_DEFS = [
    {
        id: 'time_pulse',
        name: 'TIME PULSE',
        chance: 0.40,             // 40% stage chance
        duration: 90,             // 90 seconds
        clickMult: 1.075,         // +7.5% Click Power (fairly nerfed from +10%)
        pointGenMult: 1.075,      // +7.5% Point Generation (fairly nerfed from +10%)
        gameSpeedMult: 1.04,      // +4% Game Speed (fairly nerfed from +5%)
        rarity: 'Common',
        reqRebirth: 3,
        themeClass: 'event-theme-time-pulse',
        description: 'A minor temporal fluctuation gently accelerates time.'
    },
    {
        id: 'causal_shift',
        name: 'CAUSAL SHIFT',
        chance: 0.32,             // 32% stage chance
        duration: 90,             // 90 seconds
        clickMult: 1.15,          // +15% Click Power (nerfed from +20%)
        pointGenMult: 1.11,       // +11% Point Generation (nerfed from +15%)
        gameSpeedMult: 1.075,     // +7.5% Game Speed (nerfed from +10%)
        rarity: 'Uncommon',
        reqRebirth: 3,
        themeClass: 'event-theme-causal-shift',
        description: 'Causal pathways duplicate and shift unexpectedly.'
    },
    {
        id: 'paradox_loop',
        name: 'PARADOX LOOP',
        chance: 0.26,             // 26% stage chance
        duration: 90,             // 90 seconds
        clickMult: 1.22,          // +22% Click Power (nerfed from +30%)
        pointGenMult: 1.18,       // +18% Point Generation (nerfed from +25%)
        gameSpeedMult: 1.11,      // +11% Game Speed (nerfed from +15%)
        rarity: 'Rare',
        reqRebirth: 3,
        themeClass: 'event-theme-paradox-loop',
        description: 'Temporal afterimages loop back onto themselves.'
    },
    {
        id: 'time_collapse',
        name: 'TIME COLLAPSE',
        chance: 0.22,             // 22% stage chance
        duration: 90,             // 90 seconds
        clickMult: 1.38,          // +38% Click Power (nerfed from +50%)
        pointGenMult: 1.30,       // +30% Point Generation (nerfed from +40%)
        gameSpeedMult: 1.15,      // +15% Game Speed (nerfed from +20%)
        rarity: 'Epic',
        reqRebirth: 3,
        themeClass: 'event-theme-time-collapse',
        description: 'Time begins to visibly collapse and destabilize.'
    },
    {
        id: 'reality_fracture',
        name: 'REALITY FRACTURE',
        chance: 0.18,             // 18% stage chance
        duration: 90,             // 90 seconds
        clickMult: 1.55,          // +55% Click Power (nerfed from +75%)
        pointGenMult: 1.48,       // +48% Point Generation (nerfed from +65%)
        gameSpeedMult: 1.22,      // +22% Game Speed (nerfed from +30%)
        rarity: 'Mythic',
        reqRebirth: 3,
        themeClass: 'event-theme-reality-fracture',
        description: 'Cracks open across reality itself.'
    },
    {
        id: 'null_paradox',
        name: 'NULL PARADOX',
        chance: 0.16,             // 16% stage chance
        duration: 90,             // 90 seconds
        clickMult: 1.80,          // +80% Click Power (nerfed from +110%)
        pointGenMult: 1.75,       // +75% Point Generation (nerfed from +100%)
        gameSpeedMult: 1.30,      // +30% Game Speed (nerfed from +40%)
        rarity: 'Exotic',
        reqRebirth: 3,
        themeClass: 'event-theme-null-paradox',
        description: 'The fabric of existence partially vanishes into void.'
    },
    {
        id: 'omniversal_break',
        name: 'OMNIVERSAL BREAK',
        chance: 0.18,             // 18% stage chance (significantly increased!)
        duration: 90,             // 90 seconds
        clickMult: 2.30,          // +130% Click Power (nerfed from +175%)
        pointGenMult: 2.10,       // +110% Point Generation (nerfed from +150%)
        gameSpeedMult: 1.45,      // +45% Game Speed (nerfed from +60%)
        instantHarvestSec: 120,   // Unique: 2-Minute Generator windfall on trigger
        multiverseEcho: true,     // Unique: Clicks trigger Multiverse Echo (+35% damage)
        momentumLock: true,       // Unique: Momentum stacks maxed and locked with 0 decay
        rarity: 'COSMIC LEGENDARY',
        reqRebirth: 3,
        themeClass: 'event-theme-omniversal-break',
        description: 'Reality ruptures completely! Echo clicks shatter the multiverse and lock momentum at maximum power!'
    },
    {
        id: 'solitary_star',
        name: 'SOLITARY STAR',
        chance: 0.20,             // 20% stage chance
        duration: 90,             // 90 seconds
        clickMult: 2.85,          // +185% Click Power (nerfed from +250%)
        pointGenMult: 2.50,       // +150% Point Generation (nerfed from +200%)
        gameSpeedMult: 1.38,      // +38% Game Speed (nerfed from +50%)
        rarity: 'TRANSCENDENT',
        reqRebirth: 4,
        themeClass: 'event-theme-solitary-star',
        description: 'An isolated stellar anomaly radiates pristine, focused cosmic energy.'
    },
    {
        id: 'supernova',
        name: 'SUPERNOVA',
        chance: 0.15,             // 15% stage chance
        duration: 90,             // 90 seconds
        clickMult: 4.00,          // +300% Click Power (nerfed from +400%)
        pointGenMult: 3.60,       // +260% Point Generation (nerfed from +350%)
        gameSpeedMult: 1.60,      // +60% Game Speed (nerfed from +80%)
        rarity: 'COSMIC APEX',
        reqRebirth: 4,
        themeClass: 'event-theme-supernova',
        description: 'A massive star collapses in a blinding explosion of transcendent power!'
    },
    {
        id: 'quantum_hyper_surge',
        name: 'QUANTUM HYPER-SURGE',
        chance: 0.12,             // 12% stage chance (significantly increased!)
        duration: 90,             // 90 seconds
        clickMult: 6.20,          // +520% Click Power (nerfed from +700%)
        pointGenMult: 3.20,       // +220% Point Generation (nerfed from +300%)
        gameSpeedMult: 1.75,      // +75% Game Speed (nerfed from +100%)
        autoclickSpeedMult: 3.0,  // 3x Autoclick speed (nerfed from 4x)
        guaranteedCrits: true,    // 100% Guaranteed Critical Mass & Resonant Force
        instantHarvestSec: 210,   // Instant 3.5-minute harvest on trigger (nerfed from 300s)
        rarity: 'COSMIC TITAN',
        reqRebirth: 4,
        themeClass: 'event-theme-quantum-hyper-surge',
        description: 'Temporal kinetics undergo runaway acceleration, hyper-charging autoclicks and guaranteeing critical strikes.'
    },
    {
        id: 'infinity_convergence',
        name: 'INFINITY CONVERGENCE',
        chance: 0.08,             // 8% stage chance (significantly increased!)
        duration: 90,             // 90 seconds
        clickMult: 9.25,          // +825% Click Power (nerfed from +1100%)
        pointGenMult: 9.25,       // +825% Point Generation (nerfed from +1100%)
        gameSpeedMult: 2.85,      // +185% Game Speed (nerfed from +250%)
        costDiscount: 0.75,       // 75% discount on all upgrades & generators (nerfed from 90%)
        generatorClickSynergy: 0.75, // 75% of PPS added to click power (nerfed from 100%)
        instantHarvestSec: 630,   // Instant 10.5-minute harvest on trigger (nerfed from 900s)
        temporalMirror: true,     // Unique: Clicks feed back an active 5% passive income stream
        rarity: 'CELESTIAL GODHEAD',
        reqRebirth: 4,
        themeClass: 'event-theme-infinity-convergence',
        description: 'Timelines compress into a singular focal singularity, slashing creation costs and mirroring passive energy into every click.'
    },
    {
        id: 'genesis_singularity',
        name: 'GENESIS SINGULARITY',
        chance: 0.05,             // 5% stage chance (significantly increased!)
        duration: 90,             // 90 seconds
        clickMult: 37.50,         // +3650% Click Power (nerfed from +4900%)
        pointGenMult: 37.50,      // +3650% Point Generation (nerfed from +4900%)
        gameSpeedMult: 3.80,      // +280% Game Speed (nerfed from +400%)
        costDiscount: 0.85,       // 85% discount on all upgrades & generators (nerfed from 99%)
        autoclickSpeedMult: 7.0,  // 7x Autoclick speed (nerfed from 10x)
        guaranteedCrits: true,    // 100% Guaranteed Critical Mass & Resonant Force
        generatorClickSynergy: 1.50, // 150% of PPS added to click power (nerfed from 200%)
        instantHarvestSec: 2500,  // Instant ~42-Minute harvest on trigger (nerfed from 3600s)
        primordialNova: true,     // Unique: Every 25th click triggers 25x Nova explosion + 15s PPS burst
        creationFrenzy: true,     // Unique: 25% chance for ANY upgrade or generator purchase to be 100% FREE
        maxOverclock: true,       // Unique: Overclock stacks locked at max 15 with 0 decay
        rarity: 'ETERNAL JACKPOT',
        reqRebirth: 4,
        themeClass: 'event-theme-genesis-singularity',
        description: 'The primordial spark of creation erupts! Detonates Primordial Nova bursts, triggers Creation Frenzy free purchases, and locks Overclocking at max speed!'
    },
    {
        id: 'solar_flare_cataclysm',
        name: 'SOLAR FLARE CATACLYSM',
        chance: 0.035,            // Fixed stage chance (net ~1 in 250)
        duration: 90,             // 90 seconds
        clickMult: 50.00,         // +4900% Click Power
        pointGenMult: 50.00,      // +4900% Point Generation
        gameSpeedMult: 2.50,      // +150% Game Speed
        autoclickSpeedMult: 4.0,  // +15 Autoclicks/s effectively
        instantHarvestSec: 600,   // Instant 10-Minute harvest on trigger
        solarFlareCascade: true,  // Unique: 10% chance for 50x Solar Burst on click
        rarity: 'SOLAR CATACLYSM',
        reqRebirth: 5,
        themeClass: 'event-theme-solar-flare-cataclysm',
        description: 'Coronal apocalypse engulfs reality! Supercharges game speed, unleashes 50x Solar Bursts, and floods point reservoirs with a 10-minute windfall.'
    },
    {
        id: 'tectonic_rupture',
        name: 'TECTONIC RUPTURE',
        chance: 0.009,            // Fixed stage chance (net ~1 in 1,000)
        duration: 90,             // 90 seconds
        clickMult: 100.00,        // +9900% Click Power
        pointGenMult: 100.00,     // +9900% Point Generation
        gameSpeedMult: 3.00,      // +200% Game Speed
        costDiscount: 0.95,       // 95% discount on all upgrades & generators
        stardustYieldMult: 5.0,   // Unique: 5x Stardust yield on manual clicks
        instantHarvestSec: 1800,  // Instant 30-Minute harvest on trigger
        rarity: 'SEISMIC CALAMITY',
        reqRebirth: 5,
        themeClass: 'event-theme-tectonic-rupture',
        description: 'Cosmic tectonic plates shatter reality! Slashes all creation costs by 95%, grants 5x Stardust yields, and detonates a 30-minute windfall.'
    },
    {
        id: 'supercell_world_devourer',
        name: 'SUPERCELL WORLD-DEVOURER',
        chance: 0.00095,          // Stage chance dynamically calibrated so net chance = exactly 1 in 9,999
        duration: 90,             // 90 seconds
        clickMult: 250.00,        // +24900% Click Power
        pointGenMult: 250.00,     // +24900% Point Generation
        gameSpeedMult: 4.00,      // +300% Game Speed
        creationFrenzy: true,     // Unique: 50% chance for ANY upgrade or generator purchase to be 100% FREE
        superCritTempest: true,   // Unique: Super Crit rate skyrocketed to 10.0% dealing 500x damage
        instantHarvestSec: 7200,  // Instant 2-Hour massive windfall on trigger
        rarity: 'HYPER-DEVOURER JACKPOT',
        reqRebirth: 5,
        themeClass: 'event-theme-supercell-world-devourer',
        description: 'The galaxy-devouring hyper-cyclone awakens! Super Crits erupt at 10% chance for 500x damage, 50% of purchases are 100% FREE, and grants an instant 2-Hour windfall!'
    }
];

/**
 * Runtime state container for active cosmic event and cooldown timers
 */
export const cosmicEventRuntime = {
    activeEvent: null,           // Current active event object { def, endTime }
    nextRollTime: Date.now() + 180000, // Cooldown timer target timestamp
    status: 'STABILIZED'         // 'STABILIZED' or 'ACTIVE_EVENT'
};

let isSynced = false;

/**
 * Render floating particles and cosmic anomaly graphic objects
 * @param {Object|null} activeDef - Active cosmic event definition
 */
function renderCosmicVFXOverlay(activeDef) {
    if (typeof document === 'undefined') return;

    let overlay = document.getElementById('cosmic-vfx-overlay');

    if (!activeDef) {
        if (overlay) overlay.remove();
        return;
    }

    // Create overlay container if it doesn't exist
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cosmic-vfx-overlay';
        overlay.className = 'cosmic-vfx-overlay';
        document.body.appendChild(overlay);
    }

    // Check if the current event ID is already rendered
    if (overlay.dataset.eventId === activeDef.id) {
        return; // Already rendering this event's VFX
    }

    overlay.dataset.eventId = activeDef.id;

    // Generate floating particles
    let particlesHTML = '';
    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
        const left = Math.floor(Math.random() * 95);
        const size = Math.floor(Math.random() * 8) + 4; // 4px to 12px
        const duration = (Math.random() * 4 + 3).toFixed(1); // 3s to 7s
        const delay = (Math.random() * 3).toFixed(1); // 0s to 3s
        const opacity = (Math.random() * 0.5 + 0.3).toFixed(2);

        particlesHTML += `
            <div class="cosmic-vfx-particle ${activeDef.id}" style="
                left: ${left}%;
                width: ${size}px;
                height: ${size}px;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
                opacity: ${opacity};
            "></div>
        `;
    }

    // Generate Cosmic Anomaly Object SVG graphic based on concept
    let objectHTML = '';
    if (activeDef.id === 'time_pulse') {
        objectHTML = `
            <div class="cosmic-vfx-object time-pulse-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="80" stroke="rgba(59, 130, 246, 0.4)" stroke-width="3" fill="none" class="svg-ring-pulse" />
                    <circle cx="100" cy="100" r="55" stroke="rgba(147, 197, 253, 0.6)" stroke-width="2" stroke-dasharray="8 6" fill="none" class="svg-ring-rotate-cw" />
                    <line x1="100" y1="100" x2="100" y2="40" stroke="#60a5fa" stroke-width="4" stroke-linecap="round" class="svg-hand-fast" />
                    <line x1="100" y1="100" x2="140" y2="100" stroke="#93c5fd" stroke-width="3" stroke-linecap="round" class="svg-hand-slow" />
                    <circle cx="100" cy="100" r="8" fill="#60a5fa" />
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'causal_shift') {
        objectHTML = `
            <div class="cosmic-vfx-object causal-shift-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <polygon points="100,20 170,160 30,160" stroke="rgba(34, 197, 94, 0.5)" stroke-width="3" fill="none" class="svg-poly-shift-1" />
                    <polygon points="100,180 30,40 170,40" stroke="rgba(74, 222, 128, 0.4)" stroke-width="2" fill="none" class="svg-poly-shift-2" />
                    <circle cx="100" cy="100" r="12" fill="#4ade80" class="svg-core-glow" />
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'paradox_loop') {
        objectHTML = `
            <div class="cosmic-vfx-object paradox-loop-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <path d="M 60,100 C 20,60 20,140 60,100 C 100,60 140,60 140,100 C 180,140 180,60 140,100 C 100,140 60,140 60,100 Z" 
                          stroke="rgba(168, 85, 247, 0.7)" stroke-width="4" fill="none" class="svg-infinity-loop" />
                    <circle cx="60" cy="100" r="6" fill="#c084fc" />
                    <circle cx="140" cy="100" r="6" fill="#e879f9" />
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'time_collapse') {
        objectHTML = `
            <div class="cosmic-vfx-object time-collapse-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="85" stroke="rgba(236, 72, 153, 0.5)" stroke-width="3" stroke-dasharray="12 12" fill="none" class="svg-ring-collapse" />
                    <circle cx="100" cy="100" r="50" stroke="rgba(244, 114, 182, 0.7)" stroke-width="4" stroke-dasharray="6 6" fill="none" class="svg-ring-collapse-fast" />
                    <polygon points="100,50 115,90 150,100 115,110 100,150 85,110 50,100 85,90" fill="rgba(236, 72, 153, 0.8)" class="svg-shard-core" />
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'reality_fracture') {
        objectHTML = `
            <div class="cosmic-vfx-object reality-fracture-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <path d="M 20,20 L 70,80 L 50,120 L 100,100 L 140,150 L 180,180" stroke="#f59e0b" stroke-width="4" fill="none" class="svg-lightning-bolt" />
                    <path d="M 180,20 L 130,70 L 100,100 L 80,160 L 20,180" stroke="#fbbf24" stroke-width="3" fill="none" class="svg-lightning-bolt-2" />
                    <circle cx="100" cy="100" r="16" fill="#f59e0b" class="svg-core-amber" />
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'null_paradox') {
        objectHTML = `
            <div class="cosmic-vfx-object null-paradox-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="75" stroke="rgba(14, 165, 233, 0.8)" stroke-width="5" fill="rgba(3, 12, 22, 0.9)" class="svg-blackhole-rim" />
                    <circle cx="100" cy="100" r="45" fill="#000000" class="svg-blackhole-singularity" />
                    <circle cx="100" cy="100" r="60" stroke="rgba(56, 189, 248, 0.4)" stroke-width="2" stroke-dasharray="4 8" fill="none" class="svg-ring-rotate-ccw" />
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'omniversal_break') {
        objectHTML = `
            <div class="cosmic-vfx-object omniversal-break-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="90" stroke="rgba(239, 68, 68, 0.8)" stroke-width="4" fill="none" class="svg-shockwave-1" />
                    <circle cx="100" cy="100" r="65" stroke="rgba(250, 204, 21, 0.9)" stroke-width="3" fill="none" class="svg-shockwave-2" />
                    <polygon points="100,10 125,75 190,100 125,125 100,190 75,125 10,100 75,75" fill="rgba(239, 68, 68, 0.85)" class="svg-starburst-apex" />
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'solitary_star') {
        objectHTML = `
            <div class="cosmic-vfx-object solitary-star-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="50" fill="url(#solitary-star-grad)" class="svg-star-core-glow" />
                    <g class="svg-sun-rays">
                        <line x1="100" y1="10" x2="100" y2="190" stroke="#fde047" stroke-width="3" />
                        <line x1="10" y1="100" x2="190" y2="100" stroke="#fde047" stroke-width="3" />
                        <line x1="36" y1="36" x2="164" y2="164" stroke="#facc15" stroke-width="2" />
                        <line x1="164" y1="36" x2="36" y2="164" stroke="#facc15" stroke-width="2" />
                    </g>
                    <defs>
                        <radialGradient id="solitary-star-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="40%" stop-color="#fde047" />
                            <stop offset="100%" stop-color="rgba(234, 179, 8, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'supernova') {
        objectHTML = `
            <div class="cosmic-vfx-object supernova-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="95" stroke="rgba(225, 29, 72, 0.9)" stroke-width="6" fill="none" class="svg-supernova-blast" />
                    <circle cx="100" cy="100" r="70" stroke="rgba(245, 158, 11, 0.9)" stroke-width="4" fill="none" class="svg-supernova-ring-2" />
                    <circle cx="100" cy="100" r="35" fill="url(#supernova-core-grad)" class="svg-supernova-core" />
                    <defs>
                        <radialGradient id="supernova-core-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="50%" stop-color="#ff4800" />
                            <stop offset="100%" stop-color="rgba(225, 29, 72, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'quantum_hyper_surge') {
        objectHTML = `
            <div class="cosmic-vfx-object quantum-hyper-surge-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="90" stroke="rgba(6, 182, 212, 0.85)" stroke-width="4" stroke-dasharray="14 8" fill="none" class="svg-ring-rotate-cw" />
                    <circle cx="100" cy="100" r="65" stroke="rgba(34, 211, 238, 0.95)" stroke-width="3" stroke-dasharray="6 6" fill="none" class="svg-ring-rotate-ccw" />
                    <polygon points="100,15 125,75 185,100 125,125 100,185 75,125 15,100 75,75" fill="rgba(6, 182, 212, 0.6)" class="svg-starburst-apex" />
                    <circle cx="100" cy="100" r="28" fill="url(#quantum-surge-grad)" class="svg-core-glow" />
                    <defs>
                        <radialGradient id="quantum-surge-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="50%" stop-color="#06b6d4" />
                            <stop offset="100%" stop-color="rgba(8, 145, 178, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'infinity_convergence') {
        objectHTML = `
            <div class="cosmic-vfx-object infinity-convergence-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <path d="M 40,100 C 5,40 5,160 40,100 C 100,40 100,160 160,100 C 195,40 195,160 160,100 C 100,40 100,160 40,100 Z" 
                          stroke="rgba(168, 85, 247, 0.9)" stroke-width="5" fill="none" class="svg-infinity-loop" />
                    <circle cx="100" cy="100" r="80" stroke="rgba(216, 180, 254, 0.6)" stroke-width="2" stroke-dasharray="10 10" fill="none" class="svg-ring-rotate-cw" />
                    <polygon points="100,30 145,100 100,170 55,100" stroke="#c084fc" stroke-width="3" fill="rgba(147, 51, 234, 0.4)" class="svg-poly-shift-1" />
                    <circle cx="100" cy="100" r="20" fill="url(#infinity-conv-grad)" class="svg-core-glow" />
                    <defs>
                        <radialGradient id="infinity-conv-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="45%" stop-color="#a855f7" />
                            <stop offset="100%" stop-color="rgba(126, 34, 206, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'genesis_singularity') {
        objectHTML = `
            <div class="cosmic-vfx-object genesis-singularity-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="95" stroke="rgba(255, 215, 0, 0.95)" stroke-width="6" fill="none" class="svg-supernova-blast" />
                    <circle cx="100" cy="100" r="75" stroke="rgba(253, 224, 71, 0.9)" stroke-width="4" stroke-dasharray="8 8" fill="none" class="svg-ring-rotate-cw" />
                    <g class="svg-genesis-rays">
                        <line x1="100" y1="5" x2="100" y2="195" stroke="#ffd700" stroke-width="4" />
                        <line x1="5" y1="100" x2="195" y2="100" stroke="#ffd700" stroke-width="4" />
                        <line x1="30" y1="30" x2="170" y2="170" stroke="#fde047" stroke-width="3" />
                        <line x1="170" y1="30" x2="30" y2="170" stroke="#fde047" stroke-width="3" />
                    </g>
                    <polygon points="100,20 120,80 180,100 120,120 100,180 80,120 20,100 80,80" fill="rgba(255, 215, 0, 0.85)" class="svg-starburst-apex" />
                    <circle cx="100" cy="100" r="35" fill="url(#genesis-sing-grad)" class="svg-core-glow" />
                    <defs>
                        <radialGradient id="genesis-sing-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="35%" stop-color="#ffd700" />
                            <stop offset="70%" stop-color="#f59e0b" />
                            <stop offset="100%" stop-color="rgba(217, 119, 6, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'solar_flare_cataclysm') {
        objectHTML = `
            <div class="cosmic-vfx-object solar-flare-cataclysm-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="90" stroke="rgba(255, 85, 0, 0.9)" stroke-width="5" fill="none" class="svg-supernova-blast" />
                    <circle cx="100" cy="100" r="60" fill="url(#solar-flare-grad)" class="svg-sun-core" />
                    <g class="svg-solar-arcs">
                        <path d="M 50,100 Q 20,40 100,30 Q 180,40 150,100 Q 180,160 100,170 Q 20,160 50,100 Z" stroke="rgba(255, 170, 0, 0.8)" stroke-width="3" fill="none" class="svg-ring-rotate-cw" />
                        <path d="M 30,100 Q 100,10 170,100 Q 100,190 30,100 Z" stroke="rgba(255, 60, 0, 0.7)" stroke-width="2" fill="none" class="svg-ring-rotate-ccw" />
                    </g>
                    <defs>
                        <radialGradient id="solar-flare-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#ffffff" />
                            <stop offset="40%" stop-color="#ff9900" />
                            <stop offset="80%" stop-color="#ff3300" />
                            <stop offset="100%" stop-color="rgba(200, 20, 0, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'tectonic_rupture') {
        objectHTML = `
            <div class="cosmic-vfx-object tectonic-rupture-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="85" stroke="rgba(16, 185, 129, 0.85)" stroke-width="4" stroke-dasharray="16 10" fill="none" class="svg-ring-collapse" />
                    <path d="M 30,30 L 80,70 L 60,110 L 110,90 L 140,140 L 170,170" stroke="#10b981" stroke-width="4" fill="none" class="svg-lightning-bolt" />
                    <path d="M 170,30 L 120,70 L 140,110 L 90,90 L 60,140 L 30,170" stroke="#f59e0b" stroke-width="4" fill="none" class="svg-lightning-bolt-2" />
                    <circle cx="100" cy="100" r="25" fill="url(#tectonic-rupt-grad)" class="svg-core-glow" />
                    <defs>
                        <radialGradient id="tectonic-rupt-grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#34d399" />
                            <stop offset="50%" stop-color="#059669" />
                            <stop offset="100%" stop-color="rgba(4, 120, 87, 0)" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
        `;
    } else if (activeDef.id === 'supercell_world_devourer') {
        objectHTML = `
            <div class="cosmic-vfx-object supercell-world-devourer-obj">
                <svg viewBox="0 0 200 200" class="cosmic-svg">
                    <circle cx="100" cy="100" r="95" stroke="rgba(168, 85, 247, 0.95)" stroke-width="6" fill="none" class="svg-supernova-blast" />
                    <g class="svg-hyper-vortex">
                        <path d="M 100,10 A 90,90 0 0,1 190,100 A 90,90 0 0,1 100,190 A 90,90 0 0,1 10,100 A 90,90 0 0,1 100,10 Z" stroke="rgba(192, 132, 252, 0.6)" stroke-width="3" stroke-dasharray="25 15" fill="none" class="svg-ring-rotate-cw" />
                        <path d="M 100,30 A 70,70 0 0,1 170,100 A 70,70 0 0,1 100,170 A 70,70 0 0,1 30,100 A 70,70 0 0,1 100,30 Z" stroke="rgba(232, 121, 249, 0.8)" stroke-width="4" stroke-dasharray="15 10" fill="none" class="svg-ring-rotate-ccw" />
                        <circle cx="100" cy="100" r="28" fill="#000000" stroke="#c084fc" stroke-width="4" />
                        <circle cx="100" cy="100" r="15" fill="#a855f7" class="svg-core-glow" />
                    </g>
                </svg>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="cosmic-vfx-particles-wrapper">
            ${particlesHTML}
        </div>
        <div class="cosmic-corner-accent top-right">
            ${objectHTML}
        </div>
        <div class="cosmic-corner-accent bottom-left">
            ${objectHTML}
        </div>
    `;
}

/**
 * Synchronize visual theme class and floating VFX graphics across document.body and app root container
 */
export function syncCosmicThemeDOM() {
    if (typeof document === 'undefined') return;

    const appEl = document.getElementById('app') || document.body;
    const activeDef = cosmicEventRuntime.activeEvent ? cosmicEventRuntime.activeEvent.def : null;
    const activeThemeClass = activeDef ? activeDef.themeClass : null;

    COSMIC_EVENTS_DEFS.forEach(d => {
        if (d.themeClass !== activeThemeClass) {
            if (appEl) appEl.classList.remove(d.themeClass);
            document.body.classList.remove(d.themeClass);
        }
    });

    if (activeThemeClass) {
        if (appEl) appEl.classList.add(activeThemeClass);
        document.body.classList.add(activeThemeClass);
    } else {
        if (appEl) appEl.classList.remove('camera-shake');
        document.body.classList.remove('camera-shake');
    }

    // Render floating particles and cosmic anomaly graphic objects
    renderCosmicVFXOverlay(activeDef);
}

/**
 * Synchronize cosmicEventRuntime with stateManager persistent store
 */
export function saveCosmicRuntimeToState() {
    stateManager.setState({
        cosmicEventState: {
            status: cosmicEventRuntime.status,
            nextRollTime: cosmicEventRuntime.nextRollTime,
            activeEvent: cosmicEventRuntime.activeEvent ? {
                id: cosmicEventRuntime.activeEvent.def.id,
                endTime: cosmicEventRuntime.activeEvent.endTime
            } : null
        }
    });
}

/**
 * Restore cosmicEventRuntime from stateManager persistent store
 */
export function syncCosmicRuntimeWithState() {
    const state = stateManager.getState();
    const saved = state.cosmicEventState;
    const now = Date.now();
    const cooldown = getEventCooldownMs(state);

    if (saved && typeof saved.nextRollTime === 'number' && saved.nextRollTime > 0) {
        cosmicEventRuntime.status = saved.status || 'STABILIZED';
        // Clamp target roll time to current max cooldown (fixes legacy 180s saves & Rebirth 4 transitions)
        cosmicEventRuntime.nextRollTime = Math.min(saved.nextRollTime, now + cooldown);

        if (saved.activeEvent && saved.activeEvent.id && saved.activeEvent.endTime) {
            const def = COSMIC_EVENTS_DEFS.find(d => d.id === saved.activeEvent.id);
            if (def && saved.activeEvent.endTime > now) {
                cosmicEventRuntime.activeEvent = {
                    def,
                    endTime: saved.activeEvent.endTime
                };
            } else {
                cosmicEventRuntime.activeEvent = null;
                cosmicEventRuntime.status = 'STABILIZED';
            }
        } else {
            cosmicEventRuntime.activeEvent = null;
        }
    } else {
        cosmicEventRuntime.status = 'STABILIZED';
        cosmicEventRuntime.nextRollTime = now + cooldown;
        cosmicEventRuntime.activeEvent = null;
        saveCosmicRuntimeToState();
    }
    isSynced = true;
    syncCosmicThemeDOM();
}

/**
 * Record discovery stats & unlock badges for activated event
 * @param {Object} eventDef 
 */
function recordEventDiscovered(eventDef) {
    if (!eventDef) return;
    const currentState = stateManager.getState();
    const currentStats = currentState.stats || {};
    const currentDiscovered = currentStats.eventsDiscovered || {};
    const updatedDiscovered = { ...currentDiscovered, [eventDef.id]: true };

    const currentBadges = currentState.badges || {};
    let isNewBadge = false;
    let updatedBadges = currentBadges;
    if (!currentBadges[eventDef.id]) {
        isNewBadge = true;
        updatedBadges = { ...currentBadges, [eventDef.id]: true };
    }

    stateManager.setState({
        badges: updatedBadges,
        stats: {
            ...currentStats,
            eventsActivated: (currentStats.eventsActivated || 0) + 1,
            eventsDiscovered: updatedDiscovered
        }
    });

    if (isNewBadge) {
        showNotification(`🏆 New Badge Unlocked: ${eventDef.name}! Check the Badges page!`);
    }
}

/**
 * Calculate dynamic stage roll chance for an event based on player Rebirth level and prior failures
 * @param {Object} def - Event definition
 * @param {number} index - Index in COSMIC_EVENTS_DEFS
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Stage probability (0 to 1)
 */
export function getEventStageChance(def, index, state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    if (def.reqRebirth && def.reqRebirth > rebirthCount) {
        return 0;
    }

    const isRebirth5 = rebirthCount >= 5;

    // R3 Events (#0 - #6)
    if (index < 7) {
        if (isRebirth5) {
            // At R5: R3 Cosmic Occasions become significantly less likely (-50%)
            return def.chance * 0.50;
        } else if (rebirthCount >= 4) {
            // At R4: +6 percentage points boost
            return def.chance + 0.06;
        }
        return def.chance;
    }

    // R4 Events (#7 - #11)
    if (index >= 7 && index <= 11) {
        if (isRebirth5) {
            // At R5: R4 Cosmic Occasions become significantly more likely
            const r4Boosts = [0.15, 0.12, 0.10, 0.08, 0.05];
            return Math.min(0.95, def.chance + (r4Boosts[index - 7] || 0.05));
        }
        return def.chance;
    }

    // R5 Events (#12 - #14)
    if (index >= 12) {
        if (rebirthCount < 5) return 0;
        // R5 events remain at their fixed net probabilities:
        // solar_flare_cataclysm: ~1 in 250 (0.004)
        // tectonic_rupture: ~1 in 1000 (0.001)
        // supercell_world_devourer: capped at exactly 1 in 9,999 (1 / 9999)
        let priorFailFactor = 1.0;
        for (let j = 0; j < index; j++) {
            const priorDef = COSMIC_EVENTS_DEFS[j];
            const priorStage = getEventStageChance(priorDef, j, currentState);
            priorFailFactor *= (1 - priorStage);
        }

        if (priorFailFactor <= 0) return 0;

        let targetNet = 0.004; // 1 in 250
        if (def.id === 'tectonic_rupture') targetNet = 0.001; // 1 in 1000
        if (def.id === 'supercell_world_devourer') targetNet = 1 / 9999; // exactly 1 in 9,999

        return Math.min(1.0, targetNet / priorFailFactor);
    }

    return def.chance;
}

/**
 * Sequential conditional roll for the next Cosmic Event
 * Rolls in order through all available Cosmic Occasions.
 * At R5: interval is 75s, R3 events are significantly less likely, R4 events are significantly more likely,
 * and R5 events have fixed probabilities (rarest capped at 1 in 9,999).
 * @returns {Object|null} Selected event definition or null if all fail
 */
export function rollNextCosmicEvent() {
    const state = stateManager.getState();
    const rebirthCount = state.rebirthCount || 0;

    for (let i = 0; i < COSMIC_EVENTS_DEFS.length; i++) {
        const def = COSMIC_EVENTS_DEFS[i];
        if (def.reqRebirth && def.reqRebirth > rebirthCount) {
            continue;
        }

        const stageChance = getEventStageChance(def, i, state);
        if (stageChance > 0 && Math.random() < stageChance) {
            return def;
        }
    }
    return null;
}

/**
 * Trigger activation of a specific Cosmic Event
 * @param {Object} eventDef - Event definition object
 * @param {number} [customEndTime] - Optional explicit end timestamp (for catch-up / restored sessions)
 */
export function activateCosmicEvent(eventDef, customEndTime) {
    if (!eventDef) return;

    let durationSec = eventDef.duration || 90;
    const currentState = stateManager.getState();
    if (currentState.upgrades && currentState.upgrades['temporal_stasis']) {
        durationSec += 15;
    }
    if (currentState.upgrades && currentState.upgrades['temporal_multiplicity']) {
        durationSec += 20;
    }
    // Generator perk: Entropy Inverter (+3s per 5 levels)
    const entropyInverterLvl = (currentState.generators && currentState.generators.entropy_inverter) || 0;
    if (entropyInverterLvl >= 5) {
        durationSec += Math.floor(entropyInverterLvl / 5) * 3;
    }

    const endTime = customEndTime || (Date.now() + (durationSec * 1000));

    cosmicEventRuntime.activeEvent = {
        def: eventDef,
        endTime
    };
    cosmicEventRuntime.status = 'ACTIVE_EVENT';

    recordEventDiscovered(eventDef);

    // Instant Production Harvest Windfall (for new ultra-rare jackpot anomalies)
    if (eventDef.instantHarvestSec) {
        import('./generators.js').then(({ getTotalPointGeneration }) => {
            const pps = getTotalPointGeneration(stateManager.getState());
            if (pps > 0) {
                const harvestAmount = pps * eventDef.instantHarvestSec;
                addCurrency(harvestAmount);
                showNotification(`🎁 Instant Production Harvest: +${formatNumber(harvestAmount)} Points!`);
            }
        }).catch(() => {});
    }

    // Synchronize visual theme & VFX graphics across full app & body
    syncCosmicThemeDOM();

    // Play SFX & trigger notification banner
    audioManager.playClickSFX();

    const appEl = document.getElementById('app') || document.body;
    if (eventDef.id === 'solar_flare_cataclysm') {
        showNotification('☀️ SOLAR FLARE CATACLYSM! CORONAL APOCALYPSE! (50x Clicks / 50x Points / 2.5x Speed / 50x Solar Bursts)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 1800);
        }
    } else if (eventDef.id === 'tectonic_rupture') {
        showNotification('🌋 TECTONIC RUPTURE! CONTINENTAL SHATTER! (100x Clicks / 100x Points / 3x Speed / -95% Costs / 5x Stardust Yield)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 2000);
        }
    } else if (eventDef.id === 'supercell_world_devourer') {
        showNotification('🌀 SUPERCELL WORLD-DEVOURER! HYPER-CYCLONE AWAKENS! (250x Clicks / 250x Points / 4x Speed / 10% Super Crits x500 / 50% FREE PURCHASES!)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 3000);
        }
    } else if (eventDef.id === 'omniversal_break') {
        showNotification('🌌 OMNIVERSAL BREAK! REALITY SHATTERS! (2.3x Clicks / 2.1x Points / Multiverse Echoes / Locked Max Momentum)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 1500);
        }
    } else if (eventDef.id === 'solitary_star') {
        showNotification('⭐ SOLITARY STAR ACTIVATED! Pristine cosmic power surges! (2.85x Clicks / 2.5x Points)');
    } else if (eventDef.id === 'supernova') {
        showNotification('💥 SUPERNOVA EXPLOSION! Transcendent cosmic burst! (4.0x Clicks / 3.6x Points)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 1200);
        }
    } else if (eventDef.id === 'quantum_hyper_surge') {
        showNotification('⚡ QUANTUM HYPER-SURGE! Hyper-Autoclicks & Guaranteed Crits! (6.2x Clicks / 3.2x Points / 3x Autoclicks)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 1500);
        }
    } else if (eventDef.id === 'infinity_convergence') {
        showNotification('🔮 INFINITY CONVERGENCE! Reality Collapses! (9.25x Clicks / 9.25x Points / 75% OFF / Temporal Mirror)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 1800);
        }
    } else if (eventDef.id === 'genesis_singularity') {
        showNotification('👑 GENESIS SINGULARITY! 🌟 THE ULTIMATE JACKPOT! 🌟 (37.5x Clicks / 37.5x Points / 85% OFF / Primordial Nova / Creation Frenzy)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 2500);
        }
    } else {
        showNotification(`⚡ COSMIC ANOMALY: ${eventDef.name} ACTIVATED!`);
    }

    saveCosmicRuntimeToState();
    stateManager.notify();
}

/**
 * End current active Cosmic Event and return to STABILIZED state
 * @param {number} [customNextRollTime] - Optional explicit next roll target timestamp
 */
export function clearCosmicEvent(customNextRollTime) {
    cosmicEventRuntime.activeEvent = null;
    cosmicEventRuntime.status = 'STABILIZED';
    cosmicEventRuntime.nextRollTime = customNextRollTime || (Date.now() + getEventCooldownMs());

    // Synchronize visual theme & VFX graphics across full app & body
    syncCosmicThemeDOM();

    saveCosmicRuntimeToState();
    stateManager.notify();
}

/**
 * Engine tick update handler for Cosmic Events (called every game tick)
 */
export function tickCosmicEventsEngine() {
    const state = stateManager.getState();
    const isUnlocked = (state.rebirthCount || 0) >= 3 || state.cosmicEventsUnlocked;
    if (!isUnlocked) return;

    if (!isSynced) {
        syncCosmicRuntimeWithState();
    }

    // Keep DOM visual theme & VFX overlay synced with active state
    syncCosmicThemeDOM();

    const now = Date.now();
    const cooldownMs = getEventCooldownMs(state);

    // Enforce active max cooldown bound (fixes legacy 180s saved timestamps or Rebirth 4 transitions)
    if (cosmicEventRuntime.status === 'STABILIZED') {
        if (!cosmicEventRuntime.nextRollTime || cosmicEventRuntime.nextRollTime > now + cooldownMs) {
            cosmicEventRuntime.nextRollTime = now + cooldownMs;
            saveCosmicRuntimeToState();
        }
    }

    // 1. Check if active event has expired
    if (cosmicEventRuntime.activeEvent) {
        const gameSpeed = getCurrentEventGameSpeedMult();
        const deltaSec = (100 / 1000) * gameSpeed;
        const currentStats = state.stats || {};
        stateManager.setState({
            stats: {
                ...currentStats,
                timeInEvents: (currentStats.timeInEvents || 0) + deltaSec
            }
        });

        if (now >= cosmicEventRuntime.activeEvent.endTime) {
            const expiredEndTime = cosmicEventRuntime.activeEvent.endTime;
            clearCosmicEvent(expiredEndTime + cooldownMs);
        }
    } else {
        // 2. Catch up cooldown & process sequential roll(s) anchored at nextRollTime
        let stateChanged = false;

        while (now >= cosmicEventRuntime.nextRollTime) {
            const rollAnchor = cosmicEventRuntime.nextRollTime;
            const selectedDef = rollNextCosmicEvent();

            if (selectedDef) {
                let durationSec = selectedDef.duration || 45;
                const currentState = stateManager.getState();
                if (currentState.upgrades && currentState.upgrades['temporal_stasis']) {
                    durationSec += 15;
                }
                const eventDurationMs = durationSec * 1000;
                const eventEndTime = rollAnchor + eventDurationMs;

                if (now < eventEndTime) {
                    // Event is currently active in present time!
                    activateCosmicEvent(selectedDef, eventEndTime);
                    stateChanged = true;
                    break;
                } else {
                    // Event was triggered in past window (e.g. while tab was hidden for a long time)
                    recordEventDiscovered(selectedDef);
                    cosmicEventRuntime.status = 'STABILIZED';
                    cosmicEventRuntime.activeEvent = null;
                    cosmicEventRuntime.nextRollTime = eventEndTime + cooldownMs;
                    stateChanged = true;
                }
            } else {
                // Roll failed -> Advance cooldown by exactly cooldownMs from rollAnchor
                cosmicEventRuntime.status = 'STABILIZED';
                cosmicEventRuntime.activeEvent = null;
                cosmicEventRuntime.nextRollTime = rollAnchor + cooldownMs;
                stateChanged = true;
            }
        }

        if (stateChanged) {
            saveCosmicRuntimeToState();
            stateManager.notify();
        }
    }

    // 3. Reactive UI second-boundary notification check (triggers state notification whenever seconds remaining changes)
    const currentRemainingSec = cosmicEventRuntime.activeEvent
        ? Math.max(0, Math.ceil((cosmicEventRuntime.activeEvent.endTime - now) / 1000))
        : Math.max(0, Math.ceil((cosmicEventRuntime.nextRollTime - now) / 1000));

    if (currentRemainingSec !== lastNotifiedSec) {
        lastNotifiedSec = currentRemainingSec;
        stateManager.notify();
    }
}

/**
 * Get active Event Click Power multiplier (1.0 if stabilized)
 * @returns {number} Click Power multiplier
 */
export function getCurrentEventClickPowerMult() {
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def) {
        return cosmicEventRuntime.activeEvent.def.clickMult;
    }
    return 1.0;
}

/**
 * Get active Event Point Generation multiplier (1.0 if stabilized)
 * @returns {number} Point Generation multiplier
 */
export function getCurrentEventPointGenMult() {
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def) {
        return cosmicEventRuntime.activeEvent.def.pointGenMult;
    }
    return 1.0;
}

/**
 * Get active Event Game Speed multiplier stacking with Timekeeper achievement bonus
 * @returns {number} Game Speed multiplier
 */
export function getCurrentEventGameSpeedMult() {
    let baseSpeed = 1.0;
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def) {
        baseSpeed = cosmicEventRuntime.activeEvent.def.gameSpeedMult;
    }
    const state = stateManager.getState();
    const timekeeperBonus = 1 + (getAchievementBonus(state, 'timekeeper') / 100);
    const debugSpeed = (state.debugUnlocked && state.debugGameSpeed) ? Math.min(5.0, Math.max(1.0, state.debugGameSpeed)) : 1.0;
    return baseSpeed * timekeeperBonus * debugSpeed;
}

/**
 * Get active Event Upgrade Cost discount multiplier (1.0 if stabilized or no discount)
 * E.g., 0.10 for 90% discount, 0.01 for 99% discount
 * @returns {number} Upgrade cost multiplier
 */
export function getCurrentEventCostDiscountMult() {
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def) {
        const discount = cosmicEventRuntime.activeEvent.def.costDiscount;
        if (typeof discount === 'number' && discount > 0) {
            return Math.max(0.01, 1.0 - discount);
        }
    }
    return 1.0;
}

/**
 * Get active Event Autoclick Speed multiplier (1.0 if stabilized)
 * E.g., 4.0 for Quantum Hyper-Surge, 10.0 for Genesis Singularity
 * @returns {number} Autoclick speed multiplier
 */
export function getCurrentEventAutoclickSpeedMult() {
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def) {
        return cosmicEventRuntime.activeEvent.def.autoclickSpeedMult || 1.0;
    }
    return 1.0;
}

/**
 * Get active Event PPS to Click Power synergy multiplier (0 if none)
 * E.g., 1.0 during Infinity Convergence (+100% PPS), 2.0 during Genesis Singularity (+200% PPS)
 * @returns {number} PPS to click transfer ratio
 */
export function getCurrentEventPPSClickSynergy() {
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def) {
        return cosmicEventRuntime.activeEvent.def.generatorClickSynergy || 0;
    }
    return 0;
}

/**
 * Check if active event guarantees critical mass and resonant force
 * @returns {boolean} True if crits are guaranteed
 */
export function isCurrentEventGuaranteedCrit() {
    if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def) {
        return !!cosmicEventRuntime.activeEvent.def.guaranteedCrits;
    }
    return false;
}

/**
 * Check if active event triggers Multiverse Echoes on clicks
 * @returns {boolean} True if Multiverse Echoes active
 */
export function isCurrentEventMultiverseEcho() {
    return !!(cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.multiverseEcho);
}

/**
 * Check if active event locks momentum stacks at maximum with no decay
 * @returns {boolean} True if momentum lock active
 */
export function isCurrentEventMomentumLock() {
    return !!(cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.momentumLock);
}

/**
 * Check if active event triggers Creation Frenzy (25% free upgrades)
 * @returns {boolean} True if Creation Frenzy active
 */
export function isCurrentEventCreationFrenzy() {
    return !!(cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.creationFrenzy);
}

/**
 * Check if active event triggers Primordial Nova bursts every 25 clicks
 * @returns {boolean} True if Primordial Nova active
 */
export function isCurrentEventPrimordialNova() {
    return !!(cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.primordialNova);
}

/**
 * Check if active event locks Overclocking stacks at maximum (15) with no decay
 * @returns {boolean} True if max overclock lock active
 */
export function isCurrentEventMaxOverclock() {
    return !!(cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.maxOverclock);
}

/**
 * Check if active event mirrors passive income into every click
 * @returns {boolean} True if temporal mirror active
 */
export function isCurrentEventTemporalMirror() {
    return !!(cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.temporalMirror);
}

/**
 * Force trigger activation of a specific Cosmic Event by ID (for Debug Mode / Admin tools)
 * @param {string} eventId - Cosmic event ID or name
 * @returns {boolean} True if event was found and triggered
 */
export function triggerCosmicEventById(eventId) {
    if (!eventId) return false;
    const def = COSMIC_EVENTS_DEFS.find(e => e.id === eventId || e.name.toLowerCase() === eventId.toLowerCase());
    if (def) {
        activateCosmicEvent(def);
        return true;
    }
    return false;
}

// Immediately sync theme & state when tab visibility changes back to visible
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            tickCosmicEventsEngine();
            syncCosmicThemeDOM();
        }
    });
}
