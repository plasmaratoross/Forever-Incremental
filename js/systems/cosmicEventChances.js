/**
 * ============================================================================
 * COSMIC EVENT CHANCE CALCULATOR (DATA-DRIVEN PROBABILITY ENGINE)
 * ============================================================================
 * Location: /js/systems/cosmicEventChances.js
 * Purpose: Provides real-time, data-driven calculation of Cosmic Occasion
 *          roll probabilities, active modifiers, and sequential roll mechanics.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { COSMIC_EVENTS_DEFS, getEventCooldownMs } from './cosmicEvents.js';

/**
 * Format a number as percentage string (e.g. 65%, 9.5%, 0.5%)
 * @param {number} num - Decimal probability (0 to 1)
 * @returns {string} Formatted percentage
 */
export function formatPercentage(num) {
    if (num <= 0) return '0%';
    const pct = num * 100;
    if (pct >= 10) {
        return `${Number(pct.toFixed(1))}%`;
    } else if (pct >= 1) {
        return `${Number(pct.toFixed(2))}%`;
    } else {
        return `${Number(pct.toFixed(3))}%`;
    }
}

/**
 * Format ratio string (e.g. "1 out of 1.54")
 * @param {number} num - Decimal probability (0 to 1)
 * @returns {string} Formatted ratio string
 */
export function formatRatio(num) {
    if (num <= 0) return 'N/A';
    const ratioVal = 1 / num;
    if (ratioVal <= 1.01) return '1 out of 1';
    if (ratioVal >= 1000) return `1 out of ${Math.round(ratioVal).toLocaleString()}`;
    return `1 out of ${ratioVal.toFixed(2)}`;
}

/**
 * Get detailed probability breakdown for a specific Cosmic Event
 * @param {Object|string} eventOrId - Cosmic event definition object or ID string
 * @param {Object} [state] - Optional state snapshot
 * @returns {Object} Structured chance details object
 */
export function getCosmicEventChanceDetails(eventOrId, state) {
    const currentState = state || stateManager.getState();
    const rebirthCount = currentState.rebirthCount || 0;
    const isUnlocked = rebirthCount >= 3 || !!currentState.cosmicEventsUnlocked;
    const isRebirth4 = rebirthCount >= 4;

    const eventDef = typeof eventOrId === 'string'
        ? COSMIC_EVENTS_DEFS.find(e => e.id === eventOrId)
        : eventOrId;

    if (!eventDef) return null;

    const eventIndex = COSMIC_EVENTS_DEFS.findIndex(e => e.id === eventDef.id);
    const isR4Exclusive = eventDef.id === 'solitary_star' || eventDef.id === 'supernova';

    // If Cosmic Occasions are locked before Rebirth 3:
    if (!isUnlocked) {
        return {
            eventDef,
            isUnlocked: false,
            baseChance: eventDef.chance,
            stageChance: 0,
            netChance: 0,
            chanceText: 'N/A',
            ratioText: 'N/A',
            cooldownMs: getEventCooldownMs(currentState),
            modifiers: [
                {
                    id: 'rebirth3_unlock',
                    name: 'Rebirth 3 Anomaly Matrix',
                    applied: false,
                    type: 'system_unlock',
                    valueText: 'Locked',
                    description: 'Cosmic Occasions become active upon achieving Rebirth 3.'
                }
            ]
        };
    }

    // If occasion is R4 exclusive and player has not reached Rebirth 4:
    if (isR4Exclusive && !isRebirth4) {
        return {
            eventDef,
            isUnlocked: true,
            isR4Locked: true,
            baseChance: eventDef.chance,
            stageChance: 0,
            netChance: 0,
            chanceText: 'N/A (Rebirth 4 Required)',
            ratioText: 'N/A',
            cooldownMs: getEventCooldownMs(currentState),
            modifiers: [
                {
                    id: 'rebirth4_unlock',
                    name: 'Rebirth 4 Transcendent Unlock',
                    applied: false,
                    type: 'system_unlock',
                    valueText: 'Requires Rebirth 4',
                    description: 'Transcendent Cosmic Occasions require Rebirth 4 to begin appearing.'
                }
            ]
        };
    }

    // Calculate Stage Roll Chance (probability when evaluated at this step)
    let stageChance = eventDef.chance;
    let r4BoostApplied = false;
    if (isRebirth4 && eventIndex < 7) {
        stageChance += 0.14;
        r4BoostApplied = true;
    }

    // Calculate cumulative prior failure multiplier
    let priorFailFactor = 1.0;
    for (let j = 0; j < eventIndex; j++) {
        const priorDef = COSMIC_EVENTS_DEFS[j];
        const isPriorR4Exclusive = priorDef.id === 'solitary_star' || priorDef.id === 'supernova';
        if (isPriorR4Exclusive && !isRebirth4) {
            continue;
        }

        let priorStage = priorDef.chance;
        if (isRebirth4 && j < 7) {
            priorStage += 0.14;
        }

        priorFailFactor *= (1 - priorStage);
    }

    const netChance = priorFailFactor * stageChance;
    const cooldownMs = getEventCooldownMs(currentState);

    // Build structured list of chance modifiers
    const modifiers = [
        {
            id: 'rebirth3_unlock',
            name: 'Rebirth 3 Anomaly Matrix',
            applied: true,
            type: 'system_unlock',
            valueText: 'Active',
            description: 'Unlocks Cosmic Occasion rolls after reaching Rebirth 3.'
        },
        {
            id: 'r4_chance_boost',
            name: 'Rebirth 4 Cosmic Surge (+14% Base Probability)',
            applied: r4BoostApplied,
            type: 'additive_boost',
            valueText: r4BoostApplied ? '+14.00%' : (isR4Exclusive ? 'N/A (Exempt Anomaly)' : 'Inactive (Requires R4)'),
            description: isR4Exclusive
                ? 'Solitary Star & Supernova are transcendent R4 anomalies with upgraded baseline spawn rates.'
                : 'Rebirth 4 grants a permanent flat +14 percentage point (+0.14) increase to the base roll probability of original R3 anomalies.'
        },
        {
            id: 'r4_cooldown_boost',
            name: 'Rebirth 4 Anomaly Cooldown Acceleration',
            applied: isRebirth4,
            type: 'frequency_boost',
            valueText: isRebirth4 ? '100s Check (1.2x Frequency)' : '120s Standard Check',
            description: isRebirth4
                ? 'Rebirth 4 accelerates anomaly roll checks from 120s to 100s, increasing event occurrence frequency by +20%.'
                : 'Anomaly roll checks execute every 120 seconds during stabilized periods.'
        },
        {
            id: 'sequential_roll_priority',
            name: `Sequential Roll Order (Position #${eventIndex + 1})`,
            applied: eventIndex > 0,
            type: 'conditional_roll',
            valueText: eventIndex > 0 ? `${formatPercentage(priorFailFactor)} Prior Pass Rate` : '100% (Evaluated First)',
            description: eventIndex > 0
                ? `Anomalies roll sequentially from common to rare. This anomaly is evaluated only if earlier anomalies (#1 to #${eventIndex}) fail to trigger.`
                : 'This is the first anomaly evaluated in the sequential roll loop.'
        }
    ];

    return {
        eventDef,
        isUnlocked: true,
        isR4Locked: false,
        baseChance: eventDef.chance,
        stageChance,
        netChance,
        chanceText: formatPercentage(netChance),
        stageChanceText: formatPercentage(stageChance),
        ratioText: formatRatio(netChance),
        cooldownMs,
        modifiers
    };
}

