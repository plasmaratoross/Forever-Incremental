/**
 * ============================================================================
 * NUMBER FORMATTING UTILITY
 * ============================================================================
 * Location: /js/utils/format.js
 * Purpose: Provides a central number formatting helper supporting both compact
 *          letter notation (1.50K, 2.30M, 4.10B, 10.00T...) and standard comma notation.
 * ============================================================================
 */

import { optionsManager } from '../options/options.js';

const SUFFIXES = [
    '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
    'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg',
    'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg',
    'Tg', 'UTg', 'DTg', 'TTg', 'QaTg', 'QiTg', 'SxTg', 'SpTg', 'OcTg', 'NoTg',
    'Qdg', 'UQdg', 'DQdg', 'TQdg', 'QaQdg', 'QiQdg', 'SxQdg', 'SpQdg', 'OcQdg', 'NoQdg',
    'Qng'
];

/**
 * Format a number according to the player's number notation preference
 * @param {number} value - The numeric value to format
 * @param {number} decimals - Number of decimal places for compact format (default: 2)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }

    const isCompact = optionsManager ? optionsManager.get('shortNumberFormat') !== false : true;

    if (!isCompact || Math.abs(value) < 1000) {
        return Math.floor(value).toLocaleString();
    }

    const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
    if (tier === 0) return Math.floor(value).toLocaleString();

    if (tier < SUFFIXES.length) {
        const suffix = SUFFIXES[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = value / scale;
        return scaled.toFixed(decimals) + suffix;
    }

    // Fallback to exponential / scientific notation for astronomical values beyond suffix table
    return value.toExponential(decimals).replace('e+', 'e');
}

/**
 * Format playtime or duration in human-readable time string (e.g. 12h 34m 21s)
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration string
 */
export function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const s = Math.floor(seconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ${m % 60}m ${s % 60}s`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h ${m % 60}m`;
}
