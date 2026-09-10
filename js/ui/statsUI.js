/**
 * ============================================================================
 * STATISTICS UI DASHBOARD COMPONENT
 * ============================================================================
 * Location: /js/ui/statsUI.js
 * Purpose: Renders the read-only Statistics telemetry dashboard displaying current status,
 *          lifetime records, progression summary, and cosmic event telemetry.
 *          Implements flicker-free in-place DOM updates for live data feeds.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { calculateClickReward } from '../upgrades/upgrades.js';
import { getTotalPointGeneration, GENERATOR_DEFS } from '../systems/generators.js';
import { cosmicEventRuntime, getCurrentEventGameSpeedMult } from '../systems/cosmicEvents.js';
import { ACHIEVEMENT_DEFS, getAchievementLevel } from '../systems/achievements.js';
import { formatNumber, formatTime } from '../utils/format.js';
import { t } from '../i18n/i18n.js';

/**
 * Render Statistics Page UI Dashboard
 * @param {string} containerId - DOM element ID
 */
export function renderStatsUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let isStructureBuilt = false;

    /**
     * Build primary DOM structure once
     */
    const buildStructure = () => {
        container.innerHTML = `
            <div class="stats-container">
                <!-- Navigation & HUD Header Card -->
                <div class="game-card stats-hud-card">
                    <div class="stats-header-row">
                        <a href="game.html" class="click-btn secondary-btn back-game-btn">
                            <span>◀ ${t('navPlay')}</span>
                        </a>
                        <h2 class="stats-main-title">${t('statsDashboardTitle')}</h2>
                    </div>
                    <p class="stats-subtitle">
                        ${t('statsDashboardTagline')}
                    </p>
                </div>

                <!-- Section 1: CURRENT STATUS -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">${t('secCurrentStatus')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statCurrentRebirth')}</span>
                            <span id="stat-val-rebirth" class="stat-item-val highlight-gold">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statGameSpeed')}</span>
                            <span id="stat-val-speed" class="stat-item-val">×1.00</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statEstClickPower')}</span>
                            <span id="stat-val-clickpower" class="stat-item-val">+1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statAutoclickCPS')}</span>
                            <span id="stat-val-cps" class="stat-item-val">0.00 CPS</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statCurrentPoints')}</span>
                            <span id="stat-val-points" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statCurrentPPS')}</span>
                            <span id="stat-val-pps" class="stat-item-val">0/s</span>
                        </div>
                    </div>
                </div>

                <!-- Section 2: LIFETIME STATISTICS & RECORDS -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">${t('secLifetimeStats')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statPlaytime')}</span>
                            <span id="stat-val-playtime" class="stat-item-val">0s</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statManualClicks')}</span>
                            <span id="stat-val-manualclicks" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalClicksAll')}</span>
                            <span id="stat-val-totalclicks" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalPointsEarned')}</span>
                            <span id="stat-val-totalearned" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalGenPoints')}</span>
                            <span id="stat-val-genebrned" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statHighestPPS')}</span>
                            <span id="stat-val-highestpps" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalRebirths')}</span>
                            <span id="stat-val-totalrebirths" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statHighestRebirthTier')}</span>
                            <span id="stat-val-highestrebirth" class="stat-item-val">0</span>
                        </div>
                    </div>
                </div>

                <!-- Section 3: PROGRESSION SUMMARY -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">${t('secProgressionSummary')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statProgUpgrades')}</span>
                            <span id="stat-val-prog-upgrades" class="stat-item-val">0 / 26</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statProgGenerators')}</span>
                            <span id="stat-val-prog-gens" class="stat-item-val">0 / 265</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statProgAchievements')}</span>
                            <span id="stat-val-prog-achs" class="stat-item-val">0 / 120</span>
                        </div>
                    </div>
                </div>

                <!-- Section 4: COSMIC EVENTS TELEMETRY -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">${t('secCosmicTelemetry')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statCurrentAnomaly')}</span>
                            <span id="stat-val-event-name" class="stat-item-val highlight-gold">${t('cosmicStatusStabilized')}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statAnomalyTimer')}</span>
                            <span id="stat-val-event-timer" class="stat-item-val">—</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalEventsEncountered')}</span>
                            <span id="stat-val-events-activated" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statDistinctEventsEncountered')}</span>
                            <span id="stat-val-events-discovered" class="stat-item-val">0 / 9</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">Time Spent in Events:</span>
                            <span id="stat-val-event-time" class="stat-item-val">0s</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        isStructureBuilt = true;
    };

    /**
     * Selective flicker-free DOM updates for numbers, indicators, and telemetry
     */
    const updateDOM = () => {
        if (!isStructureBuilt) buildStructure();

        const state = stateManager.getState();
        const stats = state.stats || {};
        const rebirthCount = state.rebirthCount || 0;
        const gameSpeed = getCurrentEventGameSpeedMult();
        const clickReward = calculateClickReward(state, false);
        const pps = getTotalPointGeneration(state);

        // Autoclick CPS calculation (5 clicks/sec scaled by game speed)
        let autoclickCPS = 0;
        if (state.autoclickUnlocked && state.autoclickEnabled) {
            autoclickCPS = 5.00 * gameSpeed;
        }

        // Progression totals
        const purchasedUpgrades = state.upgrades || {};
        const purchasedCount = Object.keys(purchasedUpgrades).filter(k => purchasedUpgrades[k]).length;

        const generatorsMap = state.generators || {};
        let totalGenLevels = 0;
        GENERATOR_DEFS.forEach(def => {
            totalGenLevels += (generatorsMap[def.id] || 0);
        });

        let totalAchLevels = 0;
        ACHIEVEMENT_DEFS.forEach(def => {
            totalAchLevels += getAchievementLevel(state, def.id);
        });

        const uniqueEventsCount = Object.keys(stats.eventsDiscovered || {}).length;

        // 1. Current Status Updates
        const elRebirth = document.getElementById('stat-val-rebirth');
        if (elRebirth) elRebirth.textContent = rebirthCount;

        const elSpeed = document.getElementById('stat-val-speed');
        if (elSpeed) elSpeed.textContent = `×${gameSpeed.toFixed(2)}`;

        const elClickPower = document.getElementById('stat-val-clickpower');
        if (elClickPower) elClickPower.textContent = `+${formatNumber(clickReward.amount)}`;

        const elCPS = document.getElementById('stat-val-cps');
        if (elCPS) elCPS.textContent = `${autoclickCPS.toFixed(2)} CPS ${state.autoclickEnabled ? '[ ON ]' : '[ OFF ]'}`;

        const elPoints = document.getElementById('stat-val-points');
        if (elPoints) elPoints.textContent = formatNumber(state.currency);

        const elPPS = document.getElementById('stat-val-pps');
        if (elPPS) {
            if (rebirthCount < 2) {
                elPPS.textContent = t('pointGenLocked');
            } else {
                elPPS.textContent = `+${formatNumber(pps)}/s`;
            }
        }

        // 2. Lifetime & Records Updates
        const elPlaytime = document.getElementById('stat-val-playtime');
        if (elPlaytime) elPlaytime.textContent = formatTime(stats.playtime || 0);

        const elManualClicks = document.getElementById('stat-val-manualclicks');
        if (elManualClicks) elManualClicks.textContent = formatNumber(stats.totalClicks || 0);

        const elTotalClicks = document.getElementById('stat-val-totalclicks');
        if (elTotalClicks) elTotalClicks.textContent = formatNumber(stats.totalClicksAll || stats.totalClicks || 0);

        const elTotalEarned = document.getElementById('stat-val-totalearned');
        if (elTotalEarned) elTotalEarned.textContent = formatNumber(stats.totalCurrencyEarned || 0);

        const elGenEarned = document.getElementById('stat-val-genebrned');
        if (elGenEarned) elGenEarned.textContent = formatNumber(stats.totalPointsEarned || 0);

        const elHighestPPS = document.getElementById('stat-val-highestpps');
        if (elHighestPPS) elHighestPPS.textContent = formatNumber(stats.highestPPS || 0);

        const elTotalRebirths = document.getElementById('stat-val-totalrebirths');
        if (elTotalRebirths) elTotalRebirths.textContent = stats.totalRebirths || rebirthCount;

        const elHighestRebirth = document.getElementById('stat-val-highestrebirth');
        if (elHighestRebirth) elHighestRebirth.textContent = stats.highestRebirth || rebirthCount;

        // 3. Progression Summary Updates
        const elProgUpgrades = document.getElementById('stat-val-prog-upgrades');
        if (elProgUpgrades) elProgUpgrades.textContent = `${purchasedCount} / 26`;

        const elProgGens = document.getElementById('stat-val-prog-gens');
        if (elProgGens) elProgGens.textContent = `${totalGenLevels} / 265`;

        const elProgAchs = document.getElementById('stat-val-prog-achs');
        if (elProgAchs) elProgAchs.textContent = `${totalAchLevels} / 120`;

        // 4. Cosmic Events Telemetry Updates
        const activeDef = cosmicEventRuntime.activeEvent ? cosmicEventRuntime.activeEvent.def : null;
        
        const elEventName = document.getElementById('stat-val-event-name');
        if (elEventName) {
            elEventName.textContent = activeDef ? activeDef.name : t('cosmicStatusStabilized');
        }

        const elEventTimer = document.getElementById('stat-val-event-timer');
        if (elEventTimer) {
            if (activeDef && cosmicEventRuntime.activeEvent) {
                const remSec = Math.max(0, Math.ceil((cosmicEventRuntime.activeEvent.endTime - Date.now()) / 1000));
                elEventTimer.textContent = `${remSec}s (Active)`;
            } else {
                const nextRollSec = Math.max(0, Math.ceil((cosmicEventRuntime.nextRollTime - Date.now()) / 1000));
                elEventTimer.textContent = `${nextRollSec}s (Cooldown)`;
            }
        }

        const elEventsActivated = document.getElementById('stat-val-events-activated');
        if (elEventsActivated) elEventsActivated.textContent = stats.eventsActivated || 0;

        const elEventsDiscovered = document.getElementById('stat-val-events-discovered');
        if (elEventsDiscovered) elEventsDiscovered.textContent = `${uniqueEventsCount} / 9`;

        const elEventTime = document.getElementById('stat-val-event-time');
        if (elEventTime) elEventTime.textContent = formatTime(stats.timeInEvents || 0);
    };

    buildStructure();
    updateDOM();

    // Subscribe to state updates with flicker-free in-place DOM updates
    stateManager.subscribe(() => {
        updateDOM();
    });

    // 1-second live telemetry refresh ticker
    const intervalId = setInterval(() => {
        updateDOM();
    }, 1000);

    // Language change listener
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            buildStructure();
            updateDOM();
        });
    }
}
