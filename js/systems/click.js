/**
 * ============================================================================
 * CLICK SYSTEM
 * ============================================================================
 * Location: /js/systems/click.js
 * Purpose: Handles manual click events with a 0.3s base click cooldown,
 *          calculates layered rewards via upgrades.js, triggers sound SFX,
 *          and applies visual cooldown feedback on the click button.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { addCurrency } from './currency.js';
import { audioManager } from '../audio/audioManager.js';
import { calculateClickReward, runtimeState } from '../upgrades/upgrades.js';
import { showNotification } from '../ui/notifications.js';

const BASE_COOLDOWN_MS = 300; // 0.3 second base click cooldown
let lastClickTime = 0;

/**
 * Get effective click cooldown in milliseconds (0.3s base, reduced by Overclocking speed bonus)
 * @param {Object} [state] - Current state snapshot
 * @returns {number} Cooldown in milliseconds
 */
export function getClickCooldown(state) {
    const currentState = state || stateManager.getState();
    const purchased = currentState.upgrades || {};

    let speedBonus = 0;
    if (purchased['overclocking']) {
        speedBonus = (runtimeState.overclockStacks || 0) * 0.02; // Up to +30% click speed bonus
    }

    return Math.max(50, Math.floor(BASE_COOLDOWN_MS / (1 + speedBonus)));
}

/**
 * Handle manual player click event with 0.3s cooldown enforcement
 * @param {Event} [event] - Optional click event object
 * @returns {boolean} True if click was processed, false if on cooldown
 */
export function handleClick(event) {
    const now = Date.now();
    const currentState = stateManager.getState();
    const cooldown = getClickCooldown(currentState);

    // Enforce 0.3s click cooldown speed limit
    if (now - lastClickTime < cooldown) {
        return false;
    }

    lastClickTime = now;

    // Calculate click reward using centralized layered stat system
    const result = calculateClickReward(currentState, true);

    // Add calculated currency reward
    addCurrency(result.amount);

    // Play click sound effect
    audioManager.playClickSFX();

    // Trigger visual feedback for special click effects
    if (result.isResonant) {
        showNotification('⚡ RESONANT FORCE! 3x Damage!');
    }
    if (result.isCrit) {
        showNotification('💥 CRITICAL MASS! 5x CRIT!');
    }
    if (result.isSingularityTrigger) {
        showNotification('🌌 SINGULARITY ACTIVATED! 10x Global Production for 5s!');
    }

    // Update lifetime total click statistics
    const currentStats = currentState.stats || {};
    const currentClicks = currentStats.totalClicks || 0;
    const currentClicksAll = currentStats.totalClicksAll || currentClicks;
    const nextClickCount = currentClicks + 1;
    const nextClickCountAll = currentClicksAll + 1;

    // Check Neural Resonance (#11 Advanced Upgrade): Every 20th manual click awards 5x bonus click reward
    const purchased = currentState.upgrades || {};
    if (purchased['neural_resonance'] && nextClickCount % 20 === 0) {
        const bonusAmount = result.amount * 5;
        addCurrency(bonusAmount);
        showNotification('🧠 NEURAL RESONANCE! 5x Bonus Click!');
    }

    stateManager.setState({
        stats: {
            ...currentStats,
            totalClicks: nextClickCount,
            totalClicksAll: nextClickCountAll
        }
    });

    // Apply visual button cooldown indicator
    const btn = (event && event.currentTarget) || document.getElementById('click-btn');
    if (btn) {
        btn.classList.add('cooldown');
        setTimeout(() => {
            btn.classList.remove('cooldown');
        }, cooldown);
    }

    return true;
}

/**
 * Toggle Autoclick ON/OFF setting
 */
export function toggleAutoclick() {
    const currentState = stateManager.getState();
    const nextState = !currentState.autoclickEnabled;
    stateManager.setState({ autoclickEnabled: nextState });
    saveGame();
    showNotification(`Autoclick ${nextState ? 'ENABLED [ ON ]' : 'DISABLED [ OFF ]'}`);
    return nextState;
}

/**
 * Handle automated click events triggered by Autoclick ticker (5 clicks/sec = 200ms per click)
 * Batched execution ensures smooth performance without state update loop lag.
 * @param {number} [count=1] - Number of autoclicks to process in batch
 * @returns {boolean} True if processed
 */
export function handleAutoclick(count = 1) {
    if (count <= 0) return false;
    const currentState = stateManager.getState();
    if (!currentState.autoclickEnabled) return false;

    // Calculate click reward per autoclick (isManualClick = false)
    const result = calculateClickReward(currentState, false);
    const totalAmount = result.amount * count;

    // Add total calculated currency reward in one clean batch
    addCurrency(totalAmount);

    // Update total clicks without spamming multiple state writes
    const currentStats = currentState.stats || {};
    const currentClicksAll = currentStats.totalClicksAll || (currentStats.totalClicks || 0);

    stateManager.setState({
        stats: {
            ...currentStats,
            totalClicksAll: currentClicksAll + count
        }
    });

    return true;
}


