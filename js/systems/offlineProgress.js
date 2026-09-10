/**
 * ============================================================================
 * OFFLINE PROGRESS SYSTEM
 * ============================================================================
 * Location: /js/systems/offlineProgress.js
 * Purpose: Calculates, caps (max 24 hours), and applies offline progress gains
 *          from all generative sources (Point Generators) and active Auto Clicker.
 * ============================================================================
 */

import { getTotalPointGeneration } from './generators.js';
import { calculateClickReward } from '../upgrades/upgrades.js';

const MAX_OFFLINE_MS = 24 * 60 * 60 * 1000; // Capped at 24 hours max (86,400 seconds)
const MIN_OFFLINE_MS = 5 * 1000;            // Minimum 5 seconds offline threshold

let pendingOfflineReport = null;

/**
 * Calculate and apply offline earnings to game state during loadGame()
 * @param {Object} safeState - Current state object being loaded into stateManager
 * @returns {Object|null} Offline progress report object or null if threshold not met
 */
export function calculateAndApplyOfflineProgress(safeState) {
    if (!safeState) return null;

    const lastSaved = safeState.lastSavedTimestamp;
    const now = Date.now();

    // If lastSavedTimestamp doesn't exist yet, initialize it to now
    if (!lastSaved || typeof lastSaved !== 'number') {
        safeState.lastSavedTimestamp = now;
        return null;
    }

    const rawElapsedMs = now - lastSaved;

    // Ignore offline progress for brief page refreshes / navigations (< 5s)
    if (rawElapsedMs < MIN_OFFLINE_MS) {
        safeState.lastSavedTimestamp = now;
        return null;
    }

    // Cap offline time to maximum 24 hours (86,400s)
    const isMaxCapped = rawElapsedMs > MAX_OFFLINE_MS;
    const offlineTimeMs = Math.min(rawElapsedMs, MAX_OFFLINE_MS);
    const offlineSeconds = offlineTimeMs / 1000;

    const rebirthCount = safeState.rebirthCount || 0;

    // 1. Calculate Generative Source Earnings (Point Generators - Rebirth 2+)
    const totalGenPerSec = (rebirthCount >= 2) ? getTotalPointGeneration(safeState) : 0;
    const generatorPoints = totalGenPerSec * offlineSeconds;

    // 2. Calculate Auto Clicker Earnings (Rebirth 3+ & Autoclick Enabled)
    const isAutoclickUnlocked = rebirthCount >= 3 || safeState.autoclickUnlocked;
    const isAutoclickActive = isAutoclickUnlocked && !!safeState.autoclickEnabled;

    const autoclickCPS = 5.0; // Base 5 clicks per second
    const totalAutoclicks = isAutoclickActive ? Math.floor(offlineSeconds * autoclickCPS) : 0;
    
    let autoclickRewardPerClick = 0;
    if (isAutoclickActive && totalAutoclicks > 0) {
        const clickResult = calculateClickReward(safeState, false);
        autoclickRewardPerClick = clickResult.amount || 0;
    }
    const autoclickPoints = totalAutoclicks * autoclickRewardPerClick;

    // 3. Total Combined Offline Gains
    const totalOfflinePoints = generatorPoints + autoclickPoints;

    // Update safeState values
    safeState.currency = (safeState.currency || 0) + totalOfflinePoints;
    safeState.lastSavedTimestamp = now;

    if (!safeState.stats) safeState.stats = {};
    safeState.stats.totalCurrencyEarned = (safeState.stats.totalCurrencyEarned || 0) + totalOfflinePoints;
    safeState.stats.totalPointsEarned = (safeState.stats.totalPointsEarned || 0) + generatorPoints;
    safeState.stats.totalClicksAll = (safeState.stats.totalClicksAll || 0) + totalAutoclicks;

    if (totalOfflinePoints <= 0 && offlineSeconds < 10) {
        return null;
    }

    pendingOfflineReport = {
        rawElapsedMs,
        offlineTimeMs,
        offlineSeconds,
        isMaxCapped,
        generatorPoints,
        autoclickPoints,
        totalAutoclicks,
        totalOfflinePoints,
        isAutoclickActive,
        genPerSec: totalGenPerSec
    };

    return pendingOfflineReport;
}

/**
 * Retrieve current pending offline progress report
 * @returns {Object|null} Pending report
 */
export function getPendingOfflineReport() {
    return pendingOfflineReport;
}

/**
 * Clear pending offline report after player dismisses modal
 */
export function clearPendingOfflineReport() {
    pendingOfflineReport = null;
}
