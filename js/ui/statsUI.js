/**
 * ============================================================================
 * STATISTICS UI DASHBOARD COMPONENT
 * ============================================================================
 * Location: /js/ui/statsUI.js
 * Purpose: Renders the comprehensive Statistics telemetry dashboard displaying
 *          current status, lifetime records, progression summary, cosmic event
 *          telemetry, stardust & multiplicity telemetry, and critical strikes telemetry.
 *          Implements flicker-free in-place DOM updates for live data feeds.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { calculateClickReward, CLICK_UPGRADES } from '../upgrades/upgrades.js';
import { getTotalPointGeneration, GENERATOR_DEFS } from '../systems/generators.js';
import { cosmicEventRuntime, getCurrentEventGameSpeedMult, getCurrentEventAutoclickSpeedMult, COSMIC_EVENTS_DEFS } from '../systems/cosmicEvents.js';
import { ACHIEVEMENT_DEFS, getAchievementLevel, MAX_ACHIEVEMENT_LEVEL } from '../systems/achievements.js';
import { COSMIC_BADGES_DEFS, getUnlockedBadgesCount } from '../systems/badges.js';
import { formatStardust, getStardustPointMult, getStardustUpgradeLevel, getStardustClickYield } from '../systems/stardust.js';
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
        const totalAchsMax = ACHIEVEMENT_DEFS.length * MAX_ACHIEVEMENT_LEVEL;

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
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statRebirthPowerMult', 'Rebirth Power Bonus')}</span>
                            <span id="stat-val-rebirth-power" class="stat-item-val highlight-gold">×1.00</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statPointMultiplierBonus', 'Stardust Multiplier')}</span>
                            <span id="stat-val-stardust-mult" class="stat-item-val highlight-cyan">×1.00</span>
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

                <!-- Section 3: COMBAT & CRITICAL MASS TELEMETRY -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">⚡ ${t('secCombatTelemetry', 'CRITICAL STRIKES & COMBAT')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statSuperCritChance', 'Super Crit Chance')}</span>
                            <span id="stat-val-supercrit-chance" class="stat-item-val highlight-gold">0.0%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statSuperCritMult', 'Super Crit Multiplier')}</span>
                            <span id="stat-val-supercrit-mult" class="stat-item-val highlight-gold">×100</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalSuperCrits', 'Total Super Crits Landed')}</span>
                            <span id="stat-val-supercrits-landed" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statNormalCritChance', 'Standard Crit Chance')}</span>
                            <span id="stat-val-crit-chance" class="stat-item-val">0.0%</span>
                        </div>
                    </div>
                </div>

                <!-- Section 4: MULTIPLICITY & STARDUST TELEMETRY -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">🌌 ${t('secMultiplicityTelemetry', 'STARDUST & MULTIPLICITY')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('stardustBalanceLabel', 'Stardust Balance')}</span>
                            <span id="stat-val-stardust-bal" class="stat-item-val highlight-cyan">0.000</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('stardustYieldLabel', 'Stardust Yield / Click')}</span>
                            <span id="stat-val-stardust-yield" class="stat-item-val">0.001</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statStardustPointMultLvl', 'Point Multiplier Level')}</span>
                            <span id="stat-val-stardust-lvl" class="stat-item-val">0 / 5 (×1)</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalStardustClicks', 'Total Stardust Clicks')}</span>
                            <span id="stat-val-stardust-clicks" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTotalStardustEarned', 'Total Stardust Harvested')}</span>
                            <span id="stat-val-stardust-earned" class="stat-item-val highlight-cyan">0.000</span>
                        </div>
                    </div>
                </div>

                <!-- Section 5: PROGRESSION SUMMARY -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">${t('secProgressionSummary')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statProgUpgrades')}</span>
                            <span id="stat-val-prog-upgrades" class="stat-item-val">0 / ${CLICK_UPGRADES.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statProgGenerators')}</span>
                            <span id="stat-val-prog-gens" class="stat-item-val">0 / 565</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statProgAchievements')}</span>
                            <span id="stat-val-prog-achs" class="stat-item-val">0 / ${totalAchsMax}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statProgBadges', 'Badges Discovered')}</span>
                            <span id="stat-val-prog-badges" class="stat-item-val">0 / ${COSMIC_BADGES_DEFS.length}</span>
                        </div>
                    </div>
                </div>

                <!-- Section 6: COSMIC EVENTS TELEMETRY -->
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
                            <span id="stat-val-events-discovered" class="stat-item-val">0 / ${COSMIC_EVENTS_DEFS.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTimeInEvents', 'Time Spent in Events:')}</span>
                            <span id="stat-val-event-time" class="stat-item-val">0s</span>
                        </div>
                    </div>
                </div>

                <!-- Section 7: INFINITY TOWER TELEMETRY -->
                <div class="game-card stats-section-card">
                    <h3 class="stats-section-title">🗼 ${t('secInfinityTowerTelemetry', 'INFINITY TOWER TELEMETRY')}</h3>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerCurrentFloor', 'Current Floor:')}</span>
                            <span id="stat-val-tower-floor" class="stat-item-val highlight-gold">Floor 1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerHighestFloor', 'Highest Floor Reached:')}</span>
                            <span id="stat-val-tower-highest" class="stat-item-val highlight-gold">Floor 1</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerFloorsDefeated', 'Total Floors Defeated:')}</span>
                            <span id="stat-val-tower-floors-defeated" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerBossesDefeated', 'Total Bosses Defeated:')}</span>
                            <span id="stat-val-tower-bosses-defeated" class="stat-item-val highlight-purple">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerDamageDealt', 'Total Tower Damage Dealt:')}</span>
                            <span id="stat-val-tower-damage-dealt" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerHighestEnemyHP', 'Highest Enemy HP:')}</span>
                            <span id="stat-val-tower-highest-hp" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerHighestBossHP', 'Highest Boss HP:')}</span>
                            <span id="stat-val-tower-highest-boss-hp" class="stat-item-val highlight-purple">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerNormalRewards', 'Normal Rewards Claimed:')}</span>
                            <span id="stat-val-tower-normal-rewards" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerBossRewards', 'Boss Rewards Claimed:')}</span>
                            <span id="stat-val-tower-boss-rewards" class="stat-item-val highlight-gold">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerTickets', 'Tickets Available:')}</span>
                            <span id="stat-val-tower-tickets" class="stat-item-val highlight-cyan">10 / 10</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerTicketsUsed', 'Total Tickets Used:')}</span>
                            <span id="stat-val-tower-tickets-used" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerFloorsSwept', 'Total Floors Swept:')}</span>
                            <span id="stat-val-tower-floors-swept" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerAttacksMade', 'Total Attacks Made:')}</span>
                            <span id="stat-val-tower-attacks" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerRetaliations', 'Total Retaliations Received:')}</span>
                            <span id="stat-val-tower-retaliations" class="stat-item-val">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerMechanicsEncountered', 'Boss Mechanics Encountered:')}</span>
                            <span id="stat-val-tower-mechanics" class="stat-item-val highlight-purple">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerStardustSpent', 'Stardust Spent on Damage:')}</span>
                            <span id="stat-val-tower-stardust-spent" class="stat-item-val highlight-gold">0.000</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerClickPowerBonus', 'Tower Click Power Bonus:')}</span>
                            <span id="stat-val-tower-click-bonus" class="stat-item-val highlight-gold">+0.00%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerPointGenBonus', 'Tower Point Gen Bonus:')}</span>
                            <span id="stat-val-tower-gen-bonus" class="stat-item-val highlight-cyan">+0.00%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-item-label">${t('statTowerStardustBonus', 'Tower Stardust Bonus:')}</span>
                            <span id="stat-val-tower-stardust-bonus" class="stat-item-val highlight-purple">+0.00%</span>
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
        const rebirthUpgrades = state.rebirthUpgrades || {};
        const purchasedUpgrades = state.upgrades || {};
        const gameSpeed = getCurrentEventGameSpeedMult();
        const clickReward = calculateClickReward(state, false);
        const pps = getTotalPointGeneration(state);

        // Autoclick CPS calculation
        let autoclickCPS = 0;
        if (state.autoclickEnabled) {
            const eventAutoclickMult = getCurrentEventAutoclickSpeedMult();
            autoclickCPS = 5.00 * (1.0 + 0.10 * (gameSpeed - 1.0)) * eventAutoclickMult;
        }

        // Progression totals
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

        const totalAchsMax = ACHIEVEMENT_DEFS.length * MAX_ACHIEVEMENT_LEVEL;
        const uniqueEventsCount = Object.keys(stats.eventsDiscovered || {}).length;
        const unlockedBadges = getUnlockedBadgesCount(state);

        // Rebirth power calculation
        const hasR4Bonus = rebirthCount >= 4 || !!rebirthUpgrades.r4_power_bonus;
        const hasR5Bonus = rebirthCount >= 5 || !!rebirthUpgrades.r5_power_bonus;
        let rebirthPowerMult = 1.0;
        if (hasR4Bonus) rebirthPowerMult *= 2.0;
        if (hasR5Bonus) rebirthPowerMult *= 4.0;

        // Super Crit telemetry
        let superCritChance = 0;
        let superCritMult = 100;
        if (hasR5Bonus) {
            superCritChance = 0.001;
            if (purchasedUpgrades['multiplicity_resonance']) superCritChance += 0.001;
            if (purchasedUpgrades['super_crit_matrix']) {
                superCritChance += 0.003;
                superCritMult = 150;
            }
            if (purchasedUpgrades['hyper_dimensional_vortex']) {
                superCritChance += 0.005;
                superCritMult = 250;
            }
            const subatomicLvl = (state.generators && state.generators.subatomic_annihilator) || 0;
            superCritChance += Math.floor(subatomicLvl / 5) * 0.001;

            if (cosmicEventRuntime.activeEvent && cosmicEventRuntime.activeEvent.def && cosmicEventRuntime.activeEvent.def.id === 'supercell_world_devourer') {
                superCritChance = 0.10;
                superCritMult = 500;
            }
        }

        // Standard Crit chance
        let critChance = 0;
        if (purchasedUpgrades['critical_mass']) critChance += 0.05;
        if (purchasedUpgrades['entropy_breaker']) critChance += 0.10;

        // Stardust telemetry
        const stardustBal = state.stardust || 0;
        const stardustMult = getStardustPointMult(state);
        const stardustMultLvl = getStardustUpgradeLevel('point_multiplier', state);
        const stardustYield = getStardustClickYield(state);

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

        const elRebirthPower = document.getElementById('stat-val-rebirth-power');
        if (elRebirthPower) elRebirthPower.textContent = `×${rebirthPowerMult.toFixed(2)}`;

        const elStardustMult = document.getElementById('stat-val-stardust-mult');
        if (elStardustMult) elStardustMult.textContent = `×${stardustMult}`;

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

        // 3. Combat & Critical Mass Updates
        const elSuperCritChance = document.getElementById('stat-val-supercrit-chance');
        if (elSuperCritChance) elSuperCritChance.textContent = `${(superCritChance * 100).toFixed(2)}%`;

        const elSuperCritMult = document.getElementById('stat-val-supercrit-mult');
        if (elSuperCritMult) elSuperCritMult.textContent = `×${superCritMult}`;

        const elSuperCritsLanded = document.getElementById('stat-val-supercrits-landed');
        if (elSuperCritsLanded) elSuperCritsLanded.textContent = formatNumber(stats.totalSuperCrits || 0);

        const elCritChance = document.getElementById('stat-val-crit-chance');
        if (elCritChance) elCritChance.textContent = `${(critChance * 100).toFixed(1)}%`;

        // 4. Stardust & Multiplicity Updates
        const elStardustBal = document.getElementById('stat-val-stardust-bal');
        if (elStardustBal) elStardustBal.textContent = formatStardust(stardustBal);

        const elStardustYield = document.getElementById('stat-val-stardust-yield');
        if (elStardustYield) elStardustYield.textContent = `+${formatStardust(stardustYield)}`;

        const elStardustLvl = document.getElementById('stat-val-stardust-lvl');
        if (elStardustLvl) elStardustLvl.textContent = `Lvl ${stardustMultLvl} / 5 (×${stardustMult})`;

        const elStardustClicks = document.getElementById('stat-val-stardust-clicks');
        if (elStardustClicks) elStardustClicks.textContent = formatNumber(stats.totalStardustClicks || 0);

        const elStardustEarned = document.getElementById('stat-val-stardust-earned');
        if (elStardustEarned) elStardustEarned.textContent = formatStardust(stats.totalStardustEarned || 0);

        // 5. Progression Summary Updates
        const elProgUpgrades = document.getElementById('stat-val-prog-upgrades');
        if (elProgUpgrades) elProgUpgrades.textContent = `${purchasedCount} / ${CLICK_UPGRADES.length}`;

        const elProgGens = document.getElementById('stat-val-prog-gens');
        if (elProgGens) elProgGens.textContent = `${totalGenLevels} / 565`;

        const elProgAchs = document.getElementById('stat-val-prog-achs');
        if (elProgAchs) elProgAchs.textContent = `${totalAchLevels} / ${totalAchsMax}`;

        const elProgBadges = document.getElementById('stat-val-prog-badges');
        if (elProgBadges) elProgBadges.textContent = `${unlockedBadges} / ${COSMIC_BADGES_DEFS.length}`;

        // 6. Cosmic Events Telemetry Updates
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
        if (elEventsDiscovered) elEventsDiscovered.textContent = `${uniqueEventsCount} / ${COSMIC_EVENTS_DEFS.length}`;

        const elEventTime = document.getElementById('stat-val-event-time');
        if (elEventTime) elEventTime.textContent = formatTime(stats.timeInEvents || 0);

        // 7. Infinity Tower Telemetry Updates
        const tower = state.tower || {};
        const towerBonuses = tower.bonuses || {};

        const elTowerFloor = document.getElementById('stat-val-tower-floor');
        if (elTowerFloor) elTowerFloor.textContent = `Floor ${tower.currentFloor || 1}`;

        const elTowerHighest = document.getElementById('stat-val-tower-highest');
        if (elTowerHighest) elTowerHighest.textContent = `Floor ${tower.highestFloor || stats.highestTowerFloor || 1}`;

        const elTowerFloorsDefeated = document.getElementById('stat-val-tower-floors-defeated');
        if (elTowerFloorsDefeated) elTowerFloorsDefeated.textContent = stats.totalTowerFloorsDefeated || 0;

        const elTowerBossesDefeated = document.getElementById('stat-val-tower-bosses-defeated');
        if (elTowerBossesDefeated) elTowerBossesDefeated.textContent = stats.totalTowerBossesDefeated || 0;

        const elTowerDamageDealt = document.getElementById('stat-val-tower-damage-dealt');
        if (elTowerDamageDealt) elTowerDamageDealt.textContent = formatNumber(stats.totalTowerDamageDealt || 0);

        const elTowerHighestHP = document.getElementById('stat-val-tower-highest-hp');
        if (elTowerHighestHP) elTowerHighestHP.textContent = formatNumber(stats.highestTowerEnemyHP || 0);

        const elTowerHighestBossHP = document.getElementById('stat-val-tower-highest-boss-hp');
        if (elTowerHighestBossHP) elTowerHighestBossHP.textContent = formatNumber(stats.highestTowerBossHP || 0);

        const elTowerNormalRewards = document.getElementById('stat-val-tower-normal-rewards');
        if (elTowerNormalRewards) elTowerNormalRewards.textContent = stats.towerNormalRewardsCount || 0;

        const elTowerBossRewards = document.getElementById('stat-val-tower-boss-rewards');
        if (elTowerBossRewards) elTowerBossRewards.textContent = stats.towerBossRewardsCount || 0;

        const elTowerTickets = document.getElementById('stat-val-tower-tickets');
        if (elTowerTickets) {
            const curTickets = typeof tower.tickets === 'number' ? tower.tickets : 10;
            elTowerTickets.textContent = `${curTickets} / ${tower.maxTickets || 10}`;
        }

        const elTowerTicketsUsed = document.getElementById('stat-val-tower-tickets-used');
        if (elTowerTicketsUsed) elTowerTicketsUsed.textContent = stats.totalTowerTicketsUsed || 0;

        const elTowerFloorsSwept = document.getElementById('stat-val-tower-floors-swept');
        if (elTowerFloorsSwept) elTowerFloorsSwept.textContent = stats.totalTowerFloorsSwept || 0;

        const elTowerAttacks = document.getElementById('stat-val-tower-attacks');
        if (elTowerAttacks) elTowerAttacks.textContent = stats.totalTowerAttacksMade || 0;

        const elTowerRetaliations = document.getElementById('stat-val-tower-retaliations');
        if (elTowerRetaliations) elTowerRetaliations.textContent = stats.totalTowerRetaliationsReceived || 0;

        const elTowerMechanics = document.getElementById('stat-val-tower-mechanics');
        if (elTowerMechanics) elTowerMechanics.textContent = stats.totalTowerBossMechanicsEncountered || 0;

        const elTowerStardustSpent = document.getElementById('stat-val-tower-stardust-spent');
        if (elTowerStardustSpent) elTowerStardustSpent.textContent = (stats.towerStardustSpentOnDamage || 0).toFixed(3);

        const elTowerClickBonus = document.getElementById('stat-val-tower-click-bonus');
        if (elTowerClickBonus) elTowerClickBonus.textContent = `+${((towerBonuses.clickPower || 0) * 100).toFixed(3)}%`;

        const elTowerGenBonus = document.getElementById('stat-val-tower-gen-bonus');
        if (elTowerGenBonus) elTowerGenBonus.textContent = `+${((towerBonuses.pointGen || 0) * 100).toFixed(3)}%`;

        const elTowerStardustBonus = document.getElementById('stat-val-tower-stardust-bonus');
        if (elTowerStardustBonus) elTowerStardustBonus.textContent = `+${((towerBonuses.stardust || 0) * 100).toFixed(4)}%`;
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
