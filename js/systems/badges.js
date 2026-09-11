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
    },
    {
        id: 'quantum_hyper_surge',
        name: 'QUANTUM HYPER-SURGE',
        subtitle: 'Chrono Overdrive',
        category: 'cosmic',
        rarity: 'Cosmic Titan',
        auraColor: '#06b6d4',
        imagePath: '../assets/images/badges/quantum_hyper_surge.jpg',
        lore: 'Time and momentum fuse into an unstoppable kinetic cascade, shattering all theoretical limits of speed.'
    },
    {
        id: 'infinity_convergence',
        name: 'INFINITY CONVERGENCE',
        subtitle: 'Nexus of Reality',
        category: 'cosmic',
        rarity: 'Celestial Godhead',
        auraColor: '#a855f7',
        imagePath: '../assets/images/badges/infinity_convergence.jpg',
        lore: 'All dimensional timelines converge into a singular focal point, flattening the infinite cost of creation.'
    },
    {
        id: 'genesis_singularity',
        name: 'GENESIS SINGULARITY',
        subtitle: 'The Ultimate Jackpot',
        category: 'cosmic',
        rarity: 'Eternal Jackpot',
        auraColor: '#ffd700',
        imagePath: '../assets/images/badges/genesis_singularity.jpg',
        lore: 'The primordial spark that birthed the multiverse ignites once more, unleashing unimaginable and limitless bounty.'
    },
    {
        id: 'solar_flare_cataclysm',
        name: 'SOLAR FLARE CATACLYSM',
        subtitle: 'Stellar Wrath',
        category: 'cosmic',
        rarity: 'Catastrophic Apex',
        auraColor: '#ff5722',
        imagePath: '../assets/images/badges/solar_flare_cataclysm.jpg',
        lore: 'A colossal surge of stellar coronal plasma engulfs reality, scorching away limits and igniting incandescent power.'
    },
    {
        id: 'tectonic_rupture',
        name: 'TECTONIC RUPTURE',
        subtitle: 'Continental Fissure',
        category: 'cosmic',
        rarity: 'Catastrophic Titan',
        auraColor: '#8d6e63',
        imagePath: '../assets/images/badges/tectonic_rupture.jpg',
        lore: 'The planetary mantle fractures along cosmic faults, unleashing primordial kinetic forces and unyielding resilience.'
    },
    {
        id: 'supercell_world_devourer',
        name: 'SUPERCELL WORLD-DEVOURER',
        subtitle: 'Atmospheric Apocalypse',
        category: 'cosmic',
        rarity: 'Mythic Cataclysm (1 in 9,999)',
        auraColor: '#00e5ff',
        imagePath: '../assets/images/badges/supercell_world_devourer.jpg',
        lore: 'A reality-consuming hyper-storm that obliterates planetary barriers, generating infinite kinetic vortices and legendary fortune.'
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
