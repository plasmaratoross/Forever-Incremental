/**
 * ============================================================================
 * COSMIC BADGES SYSTEM (DECORATIVE COLLECTIBLES)
 * ============================================================================
 * Location: /js/systems/badges.js
 * Purpose: Defines the 9 Cosmic Badges rewarded upon encountering Cosmic Events,
 *          badge metadata, unlock state checks, lore text, and aura styles.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';

export const COSMIC_BADGES_DEFS = [
    {
        id: 'time_pulse',
        name: 'TIME PULSE',
        subtitle: 'Pulse of Eternity',
        category: 'cosmic',
        rarity: 'Common',
        auraColor: '#3b82f6',
        imagePath: '../assets/images/badges/time_pulse.jpg',
        lore: 'A gentle heartbeat in the temporal lattice, reminding all existence of the relentless march of time.'
    },
    {
        id: 'causal_shift',
        name: 'CAUSAL SHIFT',
        subtitle: 'Shifting Causality',
        category: 'cosmic',
        rarity: 'Uncommon',
        auraColor: '#22c55e',
        imagePath: '../assets/images/badges/causal_shift.jpg',
        lore: 'Parallel threads of destiny intertwine, bending cause and effect into unexpected harmonies.'
    },
    {
        id: 'paradox_loop',
        name: 'PARADOX LOOP',
        subtitle: 'Echo of Nevermore',
        category: 'cosmic',
        rarity: 'Rare',
        auraColor: '#a855f7',
        imagePath: '../assets/images/badges/paradox_loop.jpg',
        lore: 'Past and future collapse into an eternal reflection, endlessly repeating the moment of creation.'
    },
    {
        id: 'time_collapse',
        name: 'TIME COLLAPSE',
        subtitle: 'Chronos Demise',
        category: 'cosmic',
        rarity: 'Epic',
        auraColor: '#ec4899',
        imagePath: '../assets/images/badges/time_collapse.jpg',
        lore: 'The rigid hourglass shatters, freeing time from its linear prison into chaotic infinity.'
    },
    {
        id: 'reality_fracture',
        name: 'REALITY FRACTURE',
        subtitle: 'Dimensional Rift',
        category: 'cosmic',
        rarity: 'Mythic',
        auraColor: '#f59e0b',
        imagePath: '../assets/images/badges/reality_fracture.jpg',
        lore: 'Crystalline boundaries between dimensions crack open, spilling pure cosmic flux.'
    },
    {
        id: 'null_paradox',
        name: 'NULL PARADOX',
        subtitle: 'Abyssal Singularity',
        category: 'cosmic',
        rarity: 'Exotic',
        auraColor: '#0ea5e9',
        imagePath: '../assets/images/badges/null_paradox.jpg',
        lore: 'Where existence meets absolute nothingness, the void whispers secrets of uncreated matter.'
    },
    {
        id: 'omniversal_break',
        name: 'OMNIVERSAL BREAK',
        subtitle: 'Omniverse Shatter',
        category: 'cosmic',
        rarity: 'Cosmic Legendary',
        auraColor: '#ef4444',
        imagePath: '../assets/images/badges/omniversal_break.jpg',
        lore: 'The fabric of all multiverse dimensions erupts in a cataclysmic surge of limitless raw power.'
    },
    {
        id: 'solitary_star',
        name: 'SOLITARY STAR',
        subtitle: 'Lone Star Specimen',
        category: 'cosmic',
        rarity: 'Transcendent',
        auraColor: '#fbbf24',
        imagePath: '../assets/images/badges/solitary_star.jpg',
        lore: 'A solitary celestial beacon burning bright against the infinite darkness of deep space.'
    },
    {
        id: 'supernova',
        name: 'SUPERNOVA',
        subtitle: 'Supernova Catalyst',
        category: 'cosmic',
        rarity: 'Cosmic Apex',
        auraColor: '#ff4800',
        imagePath: '../assets/images/badges/supernova.jpg',
        lore: 'The final magnificent explosion of a dying star, illuminating creation with supreme energy.'
    }
];

/**
 * Check if a badge is unlocked in player state
 * @param {string} badgeId - Badge identifier
 * @param {Object} [state] - Optional state snapshot
 * @returns {boolean} True if badge is unlocked
 */
export function isBadgeUnlocked(badgeId, state) {
    const currentState = state || stateManager.getState();
    const badges = currentState.badges || {};
    return !!badges[badgeId];
}

/**
 * Count total unlocked badges
 * @param {Object} [state] - Optional state snapshot
 * @returns {number} Count of unlocked badges
 */
export function getUnlockedBadgesCount(state) {
    const currentState = state || stateManager.getState();
    const badges = currentState.badges || {};
    let count = 0;
    COSMIC_BADGES_DEFS.forEach(def => {
        if (badges[def.id]) count++;
    });
    return count;
}
