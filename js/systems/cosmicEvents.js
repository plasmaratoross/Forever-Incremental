/**
 * ============================================================================
 * COSMIC EVENTS SYSTEM (REBIRTH 3 WORLD-STATE ANOMALIES)
 * ============================================================================
 * Location: /js/systems/cosmicEvents.js
 * Purpose: Defines the 9 Cosmic Events, sequential conditional roll logic,
 *          120s anomaly cooldown timers (100s for Rebirth 4+), 45s active event
 *          durations, background tab timestamp catch-up, persistent state sync,
 *          second-by-second reactive UI notification, game-wide visual theme &
 *          floating particle / cosmic object VFX overlay system, and buff getters.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { audioManager } from '../audio/audioManager.js';
import { showNotification } from '../ui/notifications.js';
import { getAchievementBonus } from './achievements.js';

/**
 * Default base cooldown period between cosmic events (120 seconds default, 100 seconds after Rebirth 4)
 */
export const EVENT_COOLDOWN_MS = 120000;

let lastNotifiedSec = -1;

/**
 * Get active Event Cooldown duration based on player Rebirth level (100s for Rebirth 4+, 120s otherwise)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Cooldown in milliseconds
 */
export function getEventCooldownMs(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    return rebirthCount >= 4 ? 100000 : 120000;
}

/**
 * Definitions for the 9 Cosmic Events ordered from most common to rarest
 */
export const COSMIC_EVENTS_DEFS = [
    {
        id: 'time_pulse',
        name: 'TIME PULSE',
        chance: 0.50,             // 50% sequential roll chance (64% after Rebirth 4)
        duration: 45,             // 45 seconds
        clickMult: 1.10,          // +10% Click Power
        pointGenMult: 1.10,       // +10% Point Generation
        gameSpeedMult: 1.05,      // +5% Game Speed
        rarity: 'Common',
        themeClass: 'event-theme-time-pulse',
        description: 'A minor temporal fluctuation gently accelerates time.'
    },
    {
        id: 'causal_shift',
        name: 'CAUSAL SHIFT',
        chance: 0.30,             // 30% sequential roll chance (44% after Rebirth 4)
        duration: 45,             // 45 seconds
        clickMult: 1.20,          // +20% Click Power
        pointGenMult: 1.15,       // +15% Point Generation
        gameSpeedMult: 1.10,      // +10% Game Speed
        rarity: 'Uncommon',
        themeClass: 'event-theme-causal-shift',
        description: 'Causal pathways duplicate and shift unexpectedly.'
    },
    {
        id: 'paradox_loop',
        name: 'PARADOX LOOP',
        chance: 0.22,             // 22% sequential roll chance (36% after Rebirth 4)
        duration: 45,             // 45 seconds
        clickMult: 1.30,          // +30% Click Power
        pointGenMult: 1.25,       // +25% Point Generation
        gameSpeedMult: 1.15,      // +15% Game Speed
        rarity: 'Rare',
        themeClass: 'event-theme-paradox-loop',
        description: 'Temporal afterimages loop back onto themselves.'
    },
    {
        id: 'time_collapse',
        name: 'TIME COLLAPSE',
        chance: 0.15,             // 15% sequential roll chance (29% after Rebirth 4)
        duration: 45,             // 45 seconds
        clickMult: 1.50,          // +50% Click Power
        pointGenMult: 1.40,       // +40% Point Generation
        gameSpeedMult: 1.20,      // +20% Game Speed
        rarity: 'Epic',
        themeClass: 'event-theme-time-collapse',
        description: 'Time begins to visibly collapse and destabilize.'
    },
    {
        id: 'reality_fracture',
        name: 'REALITY FRACTURE',
        chance: 0.10,             // 10% sequential roll chance (24% after Rebirth 4)
        duration: 45,             // 45 seconds
        clickMult: 1.75,          // +75% Click Power
        pointGenMult: 1.65,       // +65% Point Generation
        gameSpeedMult: 1.30,      // +30% Game Speed
        rarity: 'Mythic',
        themeClass: 'event-theme-reality-fracture',
        description: 'Cracks open across reality itself.'
    },
    {
        id: 'null_paradox',
        name: 'NULL PARADOX',
        chance: 0.06,             // 6% sequential roll chance (20% after Rebirth 4)
        duration: 45,             // 45 seconds
        clickMult: 2.10,          // +110% Click Power
        pointGenMult: 2.00,       // +100% Point Generation
        gameSpeedMult: 1.40,      // +40% Game Speed
        rarity: 'Exotic',
        themeClass: 'event-theme-null-paradox',
        description: 'The fabric of existence partially vanishes into void.'
    },
    {
        id: 'omniversal_break',
        name: 'OMNIVERSAL BREAK',
        chance: 0.025,            // 2.5% sequential roll chance (16.5% after Rebirth 4)
        duration: 45,             // 45 seconds
        clickMult: 2.75,          // +175% Click Power
        pointGenMult: 2.50,       // +150% Point Generation
        gameSpeedMult: 1.60,      // +60% Game Speed
        rarity: 'COSMIC LEGENDARY',
        themeClass: 'event-theme-omniversal-break',
        description: 'Something extremely abnormal just happened. Reality fractures completely!'
    },
    {
        id: 'solitary_star',
        name: 'SOLITARY STAR',
        chance: 0.08,             // Fixed 8% sequential roll chance (Rebirth 4+)
        duration: 45,             // 45 seconds
        clickMult: 3.50,          // +250% Click Power (3.5x)
        pointGenMult: 3.00,       // +200% Point Generation (3.0x)
        gameSpeedMult: 1.50,      // +50% Game Speed
        rarity: 'TRANSCENDENT',
        themeClass: 'event-theme-solitary-star',
        description: 'An isolated stellar anomaly radiates pristine, focused cosmic energy.'
    },
    {
        id: 'supernova',
        name: 'SUPERNOVA',
        chance: 0.04,             // Fixed 4% sequential roll chance (Rebirth 4+)
        duration: 45,             // 45 seconds
        clickMult: 5.00,          // +400% Click Power (5.0x)
        pointGenMult: 4.50,       // +350% Point Generation (4.5x)
        gameSpeedMult: 1.80,      // +80% Game Speed
        rarity: 'COSMIC APEX',
        themeClass: 'event-theme-supernova',
        description: 'A massive star collapses in a blinding explosion of transcendent power!'
    }
];

/**
 * Runtime state container for active cosmic event and cooldown timers
 */
export const cosmicEventRuntime = {
    activeEvent: null,           // Current active event object { def, endTime }
    nextRollTime: Date.now() + 120000, // Cooldown timer target timestamp
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
 * Sequential conditional roll for the next Cosmic Event
 * Rolls in order: Events 1-7 (with +9 percentage points boost if Rebirth 4 achieved), then Events 8-9 (if Rebirth 4 achieved)
 * @returns {Object|null} Selected event definition or null if all fail
 */
export function rollNextCosmicEvent() {
    const state = stateManager.getState();
    const rebirthCount = state.rebirthCount || 0;
    const isRebirth4 = rebirthCount >= 4;

    for (let i = 0; i < COSMIC_EVENTS_DEFS.length; i++) {
        const def = COSMIC_EVENTS_DEFS[i];
        // Rebirth 4 Events (#8 Solitary Star & #9 Supernova) only roll if Rebirth 4 is unlocked
        if ((def.id === 'solitary_star' || def.id === 'supernova') && !isRebirth4) {
            continue;
        }

        // Apply +14 percentage points (+0.14) boost to original 7 events after Rebirth 4
        let rollChance = def.chance;
        if (isRebirth4 && i < 7) {
            rollChance += 0.14;
        }

        if (Math.random() < rollChance) {
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

    let durationSec = eventDef.duration || 45;
    const currentState = stateManager.getState();
    if (currentState.upgrades && currentState.upgrades['temporal_stasis']) {
        durationSec += 15;
    }

    const endTime = customEndTime || (Date.now() + (durationSec * 1000));

    cosmicEventRuntime.activeEvent = {
        def: eventDef,
        endTime
    };
    cosmicEventRuntime.status = 'ACTIVE_EVENT';

    recordEventDiscovered(eventDef);

    // Synchronize visual theme & VFX graphics across full app & body
    syncCosmicThemeDOM();

    // Play SFX & trigger notification banner
    audioManager.playClickSFX();

    const appEl = document.getElementById('app') || document.body;
    if (eventDef.id === 'omniversal_break') {
        showNotification('🌌 OMNIVERSAL BREAK! REALITY SHATTERS! (2.75x Clicks / 2.5x Points)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 1500);
        }
    } else if (eventDef.id === 'solitary_star') {
        showNotification('⭐ SOLITARY STAR ACTIVATED! Pristine cosmic power surges! (3.5x Clicks / 3.0x Points)');
    } else if (eventDef.id === 'supernova') {
        showNotification('💥 SUPERNOVA EXPLOSION! Transcendent cosmic burst! (5.0x Clicks / 4.5x Points)');
        if (appEl) {
            appEl.classList.add('camera-shake');
            setTimeout(() => appEl.classList.remove('camera-shake'), 1200);
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
