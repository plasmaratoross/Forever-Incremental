/**
 * ============================================================================
 * PROGRESSION & UNLOCKS SYSTEM
 * ============================================================================
 * Location: /js/systems/progression.js
 * Purpose: Evaluates milestones, feature unlocks, and achievement progress.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';

/**
 * Check unlocked features based on lifetime progress stats
 */
export function checkProgression() {
    const currentState = stateManager.getState();
    return {
        unlockedRebirth: currentState.stats.totalCurrencyEarned >= 1000
    };
}
