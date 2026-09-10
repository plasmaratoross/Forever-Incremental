/**
 * ============================================================================
 * COSMIC EVENTS SYSTEM (REBIRTH 3 WORLD-STATE ANOMALIES)
 * ============================================================================
 * Location: /js/systems/cosmicEvents.js
 * Purpose: Defines the 7 Cosmic Events, sequential conditional roll logic,
 *          180s anomaly cooldown timers, active event durations, visual theme
 *          transitions, and buff multiplier getters.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { audioManager } from '../audio/audioManager.js';
import { showNotification } from '../ui/notifications.js';
import { getAchievementBonus } from './achievements.js';

/**
 * Cooldown period between cosmic events or after a stabilized period (180 seconds default, 120 seconds after Rebirth 4)
 */
export const EVENT_COOLDOWN_MS = 180000;

/**
 * Get active Event Cooldown duration based on player Rebirth level (120s for Rebirth 4+, 180s otherwise)
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Cooldown in milliseconds
 */
export function getEventCooldownMs(state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    return rebirthCount >= 4 ? 120000 : 180000;
}

/**
 * Definitions for the 9 Cosmic Events ordered from most common to rarest
 */
export const COSMIC_EVENTS_DEFS = [
    {
        id: 'time_pulse',
        name: 'TIME PULSE',
        chance: 0.65,             // 65% sequential roll chance (74% after Rebirth 4)
        duration: 35,             // 35 seconds
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
        chance: 0.25,             // 25% sequential roll chance (34% after Rebirth 4)
        duration: 40,             // 40 seconds
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
        chance: 0.15,             // 15% sequential roll chance (24% after Rebirth 4)
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
        chance: 0.09,             // 9% sequential roll chance (18% after Rebirth 4)
        duration: 50,             // 50 seconds
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
        chance: 0.05,             // 5% sequential roll chance (14% after Rebirth 4)
        duration: 55,             // 55 seconds
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
        chance: 0.02,             // 2% sequential roll chance (11% after Rebirth 4)
        duration: 60,             // 60 seconds
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
        chance: 0.005,            // 0.5% sequential roll chance (9.5% after Rebirth 4)
        duration: 60,             // 60 seconds
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
        chance: 0.04,             // Fixed 4% sequential roll chance (Rebirth 4+)
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
        chance: 0.015,            // Fixed 1.5% sequential roll chance (Rebirth 4+)
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
    nextRollTime: Date.now() + 180000, // Cooldown timer target timestamp
    status: 'STABILIZED'         // 'STABILIZED' or 'ACTIVE_EVENT'
};

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

        // Apply +9 percentage points (+0.09) boost to original 7 events after Rebirth 4
        let rollChance = def.chance;
        if (isRebirth4 && i < 7) {
            rollChance += 0.09;
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
 */
export function activateCosmicEvent(eventDef) {
    if (!eventDef) return;

    cosmicEventRuntime.activeEvent = {
        def: eventDef,
        endTime: Date.now() + (eventDef.duration * 1000)
    };
    cosmicEventRuntime.status = 'ACTIVE_EVENT';

    // Update Cosmic Events telemetry statistics & track unique events discovered & unlock badge
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

    // Apply visual theme class to root container
    const appEl = document.getElementById('app') || document.body;
    if (appEl) {
        COSMIC_EVENTS_DEFS.forEach(d => appEl.classList.remove(d.themeClass));
        appEl.classList.add(eventDef.themeClass);
    }

    // Play SFX & trigger notification banner
    audioManager.playClickSFX();

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

    stateManager.notify();
}

/**
 * End current active Cosmic Event and return to STABILIZED state
 */
export function clearCosmicEvent() {
    cosmicEventRuntime.activeEvent = null;
    cosmicEventRuntime.status = 'STABILIZED';
    cosmicEventRuntime.nextRollTime = Date.now() + getEventCooldownMs();

    const appEl = document.getElementById('app') || document.body;
    if (appEl) {
        COSMIC_EVENTS_DEFS.forEach(d => appEl.classList.remove(d.themeClass));
        appEl.classList.remove('camera-shake');
    }

    stateManager.notify();
}

/**
 * Engine tick update handler for Cosmic Events (called every game tick)
 */
export function tickCosmicEventsEngine() {
    const state = stateManager.getState();
    const isUnlocked = (state.rebirthCount || 0) >= 3 || state.cosmicEventsUnlocked;
    if (!isUnlocked) return;

    const now = Date.now();

    // 1. Check if active event has expired and track time spent in events
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
            clearCosmicEvent();
        }
        return;
    }

    // 2. Check if cooldown timer has expired to roll next event
    if (now >= cosmicEventRuntime.nextRollTime) {
        const selectedDef = rollNextCosmicEvent();
        if (selectedDef) {
            activateCosmicEvent(selectedDef);
        } else {
            // Roll failed -> Stay STABILIZED for another cooldown period
            cosmicEventRuntime.status = 'STABILIZED';
            cosmicEventRuntime.nextRollTime = now + getEventCooldownMs(state);
            stateManager.notify();
        }
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
