/**
 * ============================================================================
 * CURRENCY SYSTEM
 * ============================================================================
 * Location: /js/systems/currency.js
 * Purpose: Manages currency additions, passive resource generation ticks, and
 *          total lifetime currency calculations.
 * ============================================================================
 */

import { getTotalPointGeneration } from './generators.js';
import { GAME_CONFIG } from '../core/constants.js';
import { stateManager } from '../core/state.js';
import { getCurrentEventGameSpeedMult } from './cosmicEvents.js';

/**
 * Add currency points to global state
 * @param {number} amount - Amount of currency points to add
 */
export function addCurrency(amount) {
    if (!amount || isNaN(amount) || amount <= 0) return;
    const currentState = stateManager.getState();
    const currentCurrency = (typeof currentState.currency === 'number' && !isNaN(currentState.currency))
        ? currentState.currency
        : (typeof currentState.points === 'number' && !isNaN(currentState.points) ? currentState.points : 0);
    
    const updatedCurrency = currentCurrency + amount;

    const currentStats = currentState.stats || {};
    const currentEarned = (typeof currentStats.totalCurrencyEarned === 'number' && !isNaN(currentStats.totalCurrencyEarned))
        ? currentStats.totalCurrencyEarned
        : 0;
    
    stateManager.setState({
        currency: updatedCurrency,
        points: updatedCurrency,
        stats: {
            ...currentStats,
            totalCurrencyEarned: currentEarned + amount
        }
    });
}

/**
 * Process passive Point generation ticks generated per interval
 * @param {Object} [manager] - StateManager reference
 */
export function processCurrencyTick(manager) {
    const mgr = manager || stateManager;
    const currentState = mgr.getState();

    if ((currentState.rebirthCount || 0) >= 2) {
        const totalGenPerSec = getTotalPointGeneration(currentState);
        if (totalGenPerSec > 0) {
            const gameSpeed = getCurrentEventGameSpeedMult();
            const tickDeltaSec = (GAME_CONFIG.TICK_RATE / 1000) * gameSpeed;
            const pointsGained = totalGenPerSec * tickDeltaSec;
            
            const currentCurrency = currentState.currency || 0;
            const currentStats = currentState.stats || {};

            mgr.setState({
                currency: currentCurrency + pointsGained,
                stats: {
                    ...currentStats,
                    totalCurrencyEarned: (currentStats.totalCurrencyEarned || 0) + pointsGained,
                    totalPointsEarned: (currentStats.totalPointsEarned || 0) + pointsGained
                }
            });
        }
    }
}
