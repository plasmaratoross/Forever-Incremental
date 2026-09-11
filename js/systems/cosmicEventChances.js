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
import { COSMIC_EVENTS_DEFS, getEventCooldownMs, getEventStageChance } from './cosmicEvents.js';

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
 * Format ratio string (e.g. "1 out of 1.54", "1 out of 9,999")
 * @param {number} num - Decimal probability (0 to 1)
 * @returns {string} Formatted ratio string
 */
export function formatRatio(num) {
    if (num <= 0) return 'N/A';
    const ratioVal = 1 / num;
    if (ratioVal <= 1.01) return '1 out of 1';
    if (Math.abs(ratioVal - 9999) < 1) return '1 out of 9,999';
    if (Math.abs(ratioVal - 10000) < 15) return '1 out of 10,000';
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
    const isRebirth5 = rebirthCount >= 5;

    const eventDef = typeof eventOrId === 'string'
        ? COSMIC_EVENTS_DEFS.find(e => e.id === eventOrId)
        : eventOrId;

    if (!eventDef) return null;

    const eventIndex = COSMIC_EVENTS_DEFS.findIndex(e => e.id === eventDef.id);
    const isR4Exclusive = (eventDef.reqRebirth === 4);
    const isR5Exclusive = (eventDef.reqRebirth === 5);

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
            isR5Locked: false,
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

    // If occasion is R5 exclusive and player has not reached Rebirth 5:
    if (isR5Exclusive && !isRebirth5) {
        return {
            eventDef,
            isUnlocked: true,
            isR4Locked: false,
            isR5Locked: true,
            baseChance: eventDef.chance,
            stageChance: 0,
            netChance: 0,
            chanceText: 'N/A (Rebirth 5 Required)',
            ratioText: 'N/A',
            cooldownMs: getEventCooldownMs(currentState),
            modifiers: [
                {
                    id: 'rebirth5_unlock',
                    name: 'Rebirth 5 Multiplicity Matrix',
                    applied: false,
                    type: 'system_unlock',
                    valueText: 'Requires Rebirth 5',
                    description: 'Catastrophic Nature Cosmic Occasions require Rebirth 5 to begin appearing.'
                }
            ]
        };
    }

    // Calculate Stage Roll Chance using centralized engine helper
    const stageChance = getEventStageChance(eventDef, eventIndex, currentState);

    // Calculate cumulative prior failure multiplier
    let priorFailFactor = 1.0;
    for (let j = 0; j < eventIndex; j++) {
        const priorDef = COSMIC_EVENTS_DEFS[j];
        const priorStage = getEventStageChance(priorDef, j, currentState);
        priorFailFactor *= (1 - priorStage);
    }

    let netChance = priorFailFactor * stageChance;
    if (isR5Exclusive && eventDef.id === 'supercell_world_devourer') {
        netChance = 1 / 9999;
    }

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
        }
    ];

    if (isRebirth5) {
        modifiers.push({
            id: 'r5_cooldown_boost',
            name: 'Rebirth 5 Anomaly Acceleration (75s Interval)',
            applied: true,
            type: 'frequency_boost',
            valueText: '75s Check (2.4x Frequency)',
            description: 'Rebirth 5 cuts anomaly check intervals to 75 seconds, dramatically increasing occurrence rates.'
        });

        if (eventIndex < 7) {
            modifiers.push({
                id: 'r5_r3_odds_reduction',
                name: 'R5 Shift: R3 Occasions Dilution (-50%)',
                applied: true,
                type: 'odds_shift',
                valueText: '-50% Stage Chance',
                description: 'At Rebirth 5, lower-tier R3 occasions become significantly less likely to allow higher-tier events to emerge.'
            });
        } else if (eventIndex >= 7 && eventIndex <= 11) {
            modifiers.push({
                id: 'r5_r4_odds_boost',
                name: 'R5 Shift: R4 Occasions Amplification',
                applied: true,
                type: 'odds_shift',
                valueText: '+5% to +15% Boost',
                description: 'At Rebirth 5, Transcendent R4 occasions become significantly more likely to trigger.'
            });
        } else if (isR5Exclusive) {
            modifiers.push({
                id: 'r5_fixed_odds',
                name: 'R5 Fixed Probability Matrix',
                applied: true,
                type: 'calibrated_odds',
                valueText: eventDef.id === 'supercell_world_devourer' ? 'Capped at 1 in 9,999' : `${formatRatio(netChance)} Fixed`,
                description: 'R5 Cosmic Occasions remain at their own calibrated fixed probabilities, completely unaffected by R3/R4 probability shifts.'
            });
        }
    } else if (isRebirth4) {
        modifiers.push({
            id: 'r4_chance_boost',
            name: 'Rebirth 4 Cosmic Surge (+6% Base Probability)',
            applied: eventIndex < 7,
            type: 'additive_boost',
            valueText: eventIndex < 7 ? '+6.00%' : (isR4Exclusive ? 'N/A (R4 Anomaly)' : 'Inactive (Requires R4)'),
            description: 'Rebirth 4 grants a permanent flat +6 percentage point (+0.06) increase to the base roll probability of original R3 anomalies.'
        });
        modifiers.push({
            id: 'r4_cooldown_boost',
            name: 'Rebirth 4 Anomaly Cooldown Acceleration',
            applied: true,
            type: 'frequency_boost',
            valueText: '150s Check (1.2x Frequency)',
            description: 'Rebirth 4 accelerates anomaly roll checks from 180s to 150s, increasing event occurrence frequency by +20%.'
        });
    }

    modifiers.push({
        id: 'sequential_roll_priority',
        name: `Sequential Roll Order (Position #${eventIndex + 1})`,
        applied: eventIndex > 0,
        type: 'conditional_roll',
        valueText: eventIndex > 0 ? `${formatPercentage(priorFailFactor)} Prior Pass Rate` : '100% (Evaluated First)',
        description: eventIndex > 0
            ? `Anomalies roll sequentially from common to rare. This anomaly is evaluated only if earlier anomalies (#1 to #${eventIndex}) fail to trigger.`
            : 'This is the first anomaly evaluated in the sequential roll loop.'
    });

    return {
        eventDef,
        isUnlocked: true,
        isR4Locked: false,
        isR5Locked: false,
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

