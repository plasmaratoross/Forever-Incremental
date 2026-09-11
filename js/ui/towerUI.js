/**
 * ============================================================================
 * INFINITY TOWER UI COMPONENT (2D RPG TURN-BASED SCREEN)
 * ============================================================================
 * Location: /js/ui/towerUI.js
 * Purpose: Renders the Infinity Tower combat modal, 2D RPG turn feedback,
 *          enemy health and armor bars, boss mechanics, Stardust damage upgrades,
 *          tickets counter and timer, sweep execution, and combat log.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import {
    getOrInitTowerEnemy,
    calculatePlayerTowerDamage,
    executeTowerAttack,
    purchaseTowerDamageUpgrade,
    getTowerDamageUpgradeCost,
    getTowerDamageUpgradeMultiplier,
    canSweep,
    getSweepPreview,
    executeSweep,
    getNextTicketTimeRemaining,
    updateTicketRecovery,
    TOWER_CONFIG
} from '../systems/tower.js';
import { formatNumber } from '../utils/format.js';
import { formatStardust } from '../systems/stardust.js';
import { t } from '../i18n/i18n.js';

let isTowerModalOpen = false;
let towerTimerIntervalId = null;

/**
 * Format milliseconds into human-readable MM:SS or HH:MM:SS
 * @param {number} ms 
 * @returns {string} Formatted time string
 */
function formatTimeMs(ms) {
    if (ms <= 0) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Open the Infinity Tower modal
 */
export function openTowerModal() {
    isTowerModalOpen = true;
    renderTowerModal();

    if (towerTimerIntervalId) clearInterval(towerTimerIntervalId);
    towerTimerIntervalId = setInterval(() => {
        if (!isTowerModalOpen) {
            clearInterval(towerTimerIntervalId);
            return;
        }
        updateTicketRecovery();
        updateTowerDOM();
    }, 1000);
}

/**
 * Close the Infinity Tower modal
 */
export function closeTowerModal() {
    isTowerModalOpen = false;
    if (towerTimerIntervalId) clearInterval(towerTimerIntervalId);
    const container = document.getElementById('infinity-tower-modal-container');
    if (container) container.innerHTML = '';
}

/**
 * Render the Infinity Tower Modal Structure
 */
export function renderTowerModal() {
    const container = document.getElementById('infinity-tower-modal-container');
    if (!container) return;

    const state = stateManager.getState();
    updateTicketRecovery(state);
    const tower = state.tower || {};
    const enemy = getOrInitTowerEnemy(state);
    const currentFloor = tower.currentFloor || 1;
    const isBoss = (currentFloor % 10 === 0);

    container.innerHTML = `
        <div id="infinity-tower-modal" class="modal-overlay active-overlay">
            <div class="modal-content tower-modal-content ${isBoss ? 'tower-boss-modal' : ''}">
                <!-- Modal Header -->
                <div class="modal-header tower-header">
                    <div class="tower-header-left">
                        <span class="tower-icon">🗼</span>
                        <div>
                            <h2 class="tower-title">${t('infinityTowerTitle', 'INFINITY TOWER')}</h2>
                            <span class="tower-floor-badge ${isBoss ? 'tower-boss-floor-badge' : ''}" id="tower-floor-header">
                                ${isBoss ? '👑 ' : ''}${t('towerFloorLabel', 'FLOOR')} ${currentFloor} ${isBoss ? `(${t('towerBossFloor', 'BOSS FLOOR')})` : ''}
                            </span>
                        </div>
                    </div>
                    <button id="close-tower-modal-btn" class="modal-close-btn" aria-label="Close Tower">&times;</button>
                </div>

                <!-- Tower Main 2D RPG Grid -->
                <div class="tower-main-grid">
                    <!-- Left Column: Combat Arena -->
                    <div class="tower-arena-panel">
                        <!-- Enemy RPG Card -->
                        <div id="tower-enemy-card" class="tower-enemy-card ${isBoss ? 'boss-card-frame' : ''}">
                            <div class="enemy-sprite-container">
                                <div id="tower-enemy-sprite" class="tower-enemy-emoji ${isBoss ? 'boss-emoji-pulse' : ''}">
                                    ${enemy.emoji}
                                </div>
                                <div id="enemy-floating-container" class="enemy-floating-container"></div>
                            </div>

                            <div class="enemy-details-box">
                                <div class="enemy-name-row">
                                    <h3 id="tower-enemy-name" class="enemy-name-text">${enemy.name}</h3>
                                    <span id="tower-boss-tag" class="tower-tag ${isBoss ? 'boss-tag-active' : 'normal-tag'}">
                                        ${isBoss ? `👑 ${t('towerBossWord', 'ANOMALY OVERLORD')}` : t('towerNormalWord', 'COSMIC ANOMALY')}
                                    </span>
                                </div>

                                <!-- Boss Mechanic Indicator (if boss) -->
                                <div id="tower-boss-mechanic-box" class="tower-mechanic-box ${isBoss && enemy.mechanic ? 'mechanic-visible' : 'mechanic-hidden'}" style="${isBoss && enemy.mechanic ? 'display: block;' : 'display: none;'}">
                                    <span id="tower-boss-mechanic-badge" class="mechanic-badge">
                                        ${getMechanicBadgeHTML(enemy)}
                                    </span>
                                </div>

                                <!-- Armor Bar (if boss with armor) -->
                                <div id="tower-armor-bar-wrap" class="tower-bar-wrap ${isBoss && enemy.maxArmor > 0 ? 'armor-visible' : 'armor-hidden'}" style="${isBoss && enemy.maxArmor > 0 ? 'display: block;' : 'display: none;'}">
                                    <div class="tower-bar-labels">
                                        <span class="bar-name">🛡️ ${t('towerArmorLabel', 'ARMOR SHIELD')}</span>
                                        <span id="tower-armor-text" class="bar-val">${formatNumber(enemy.currentArmor)} / ${formatNumber(enemy.maxArmor)}</span>
                                    </div>
                                    <div class="tower-bar-track">
                                        <div id="tower-armor-fill" class="tower-bar-fill armor-fill" style="width: ${getPercent(enemy.currentArmor, enemy.maxArmor)}%"></div>
                                    </div>
                                </div>

                                <!-- HP Bar -->
                                <div class="tower-bar-wrap">
                                    <div class="tower-bar-labels">
                                        <span class="bar-name">❤️ ${t('towerHPLabel', 'ANOMALY INTEGRITY')}</span>
                                        <span id="tower-hp-text" class="bar-val">${formatNumber(enemy.currentHp)} / ${formatNumber(enemy.maxHp)}</span>
                                    </div>
                                    <div class="tower-bar-track">
                                        <div id="tower-hp-fill" class="tower-bar-fill hp-fill" style="width: ${getPercent(enemy.currentHp, enemy.maxHp)}%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Combat Action Bar -->
                        <div class="tower-action-bar">
                            <button id="tower-attack-btn" class="click-btn primary-action-btn tower-attack-button">
                                <span>⚔️ ${t('towerAttackBtn', 'ATTACK ANOMALY')}</span>
                            </button>
                            <div class="tower-player-telemetry">
                                <div class="telemetry-chip">
                                    <span class="chip-label">${t('towerPlayerDamageLabel', 'Attack Power:')}</span>
                                    <span id="tower-player-dmg-val" class="chip-val highlight-gold">0</span>
                                </div>
                                <div class="telemetry-chip">
                                    <span class="chip-label">${t('towerCritRatesLabel', 'Crit / Super Crit:')}</span>
                                    <span id="tower-crit-rates-val" class="chip-val">5% / 0.1%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Combat Log Console -->
                        <div class="tower-log-container">
                            <div class="tower-log-header">
                                <span>📜 ${t('towerCombatLogTitle', 'COMBAT TELEMETRY LOG')}</span>
                            </div>
                            <div id="tower-combat-log-body" class="tower-log-body">
                                ${renderCombatLogHTML(tower.combatLog)}
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Upgrades, Tickets, Sweep & Bonuses -->
                    <div class="tower-mgmt-panel">
                        <!-- Stardust Tower Damage Upgrade Card -->
                        <div class="tower-card mgmt-card">
                            <div class="mgmt-card-header">
                                <h4>⚡ ${t('towerDamageUpgradeTitle', 'Tower Resonance')}</h4>
                                <span id="tower-upg-lvl-badge" class="upg-lvl-badge">Lvl ${tower.damageUpgradeLevel || 0}</span>
                            </div>
                            <p class="mgmt-card-desc">
                                ${t('towerDamageUpgradeDesc', 'Spend concentrated Stardust to permanently enhance Tower Attack Damage.')}
                            </p>
                            <div class="mgmt-card-stats">
                                <div class="stat-row">
                                    <span>${t('towerCurrentDamageBoost', 'Current Multiplier:')}</span>
                                    <span id="tower-upg-mult-val" class="highlight-gold">×1.00</span>
                                </div>
                                <div class="stat-row">
                                    <span>${t('towerUpgradeCostLabel', 'Stardust Cost:')}</span>
                                    <span id="tower-upg-cost-val" class="highlight-cyan">0.500 Stardust</span>
                                </div>
                                <div class="stat-row">
                                    <span>${t('availableStardustLabel', 'Available Stardust:')}</span>
                                    <span id="tower-stardust-bal" class="highlight-cyan">0.000</span>
                                </div>
                            </div>
                            <button id="tower-buy-upg-btn" class="click-btn primary-action-btn tower-buy-btn">
                                <span>⚡ ${t('btnUpgrade', 'UPGRADE')}</span>
                            </button>
                        </div>

                        <!-- Tickets & Sweep Console -->
                        <div class="tower-card mgmt-card">
                            <div class="mgmt-card-header">
                                <h4>🎫 ${t('towerSweepConsoleTitle', 'Tower Sweep & Tickets')}</h4>
                                <span id="tower-tickets-badge" class="tickets-badge">10 / 10</span>
                            </div>
                            <p class="mgmt-card-desc">
                                ${t('towerSweepDesc', 'Spend 1 Ticket to automatically sweep completed Floors 1 to (Current - 5) for 25% reward yield.')}
                            </p>
                            <div class="mgmt-card-stats">
                                <div class="stat-row">
                                    <span>${t('towerNextTicketLabel', 'Next Ticket Recovery:')}</span>
                                    <span id="tower-ticket-timer" class="highlight-cyan">MAX</span>
                                </div>
                                <div class="stat-row">
                                    <span>${t('towerSweepRangeLabel', 'Eligible Sweep Range:')}</span>
                                    <span id="tower-sweep-range-text">Floor 1 - 0</span>
                                </div>
                            </div>
                            <button id="tower-sweep-btn" class="click-btn secondary-btn tower-sweep-btn" disabled>
                                <span>🚀 ${t('towerSweepBtn', 'SWEEP COMPLETED FLOORS')} (-1 🎫)</span>
                            </button>
                        </div>

                        <!-- Permanent Stacking Tower Bonuses Card -->
                        <div class="tower-card mgmt-card bonuses-card">
                            <div class="mgmt-card-header">
                                <h4>🏆 ${t('towerBonusesTitle', 'Accumulated Tower Bonuses')}</h4>
                            </div>
                            <div class="tower-bonuses-grid">
                                <div class="bonus-stat-item">
                                    <span class="bonus-stat-label">${t('towerBonusClick', 'Click Power:')}</span>
                                    <span id="tower-bonus-click-val" class="bonus-stat-val highlight-gold">+0.00%</span>
                                </div>
                                <div class="bonus-stat-item">
                                    <span class="bonus-stat-label">${t('towerBonusGen', 'Generator PPS:')}</span>
                                    <span id="tower-bonus-gen-val" class="bonus-stat-val highlight-cyan">+0.00%</span>
                                </div>
                                <div class="bonus-stat-item">
                                    <span class="bonus-stat-label">${t('towerBonusStardust', 'Stardust Yield:')}</span>
                                    <span id="tower-bonus-stardust-val" class="bonus-stat-val highlight-purple">+0.00%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sweep Summary Modal Container (Nested) -->
                <div id="tower-sweep-summary-container"></div>
            </div>
        </div>
    `;

    bindTowerEvents();
    updateTowerDOM();
}

/**
 * Bind Interactive DOM Events for the Tower UI
 */
function bindTowerEvents() {
    const closeBtn = document.getElementById('close-tower-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTowerModal);
    }

    const attackBtn = document.getElementById('tower-attack-btn');
    if (attackBtn) {
        attackBtn.addEventListener('click', () => {
            const result = executeTowerAttack();
            if (result) {
                renderFloatingCombatFeedback(result);
                updateTowerDOM();
            }
        });
    }

    const enemySprite = document.getElementById('tower-enemy-sprite');
    if (enemySprite) {
        enemySprite.addEventListener('click', () => {
            const result = executeTowerAttack();
            if (result) {
                renderFloatingCombatFeedback(result);
                updateTowerDOM();
            }
        });
    }

    const buyUpgBtn = document.getElementById('tower-buy-upg-btn');
    if (buyUpgBtn) {
        buyUpgBtn.addEventListener('click', () => {
            if (purchaseTowerDamageUpgrade()) {
                updateTowerDOM();
            }
        });
    }

    const sweepBtn = document.getElementById('tower-sweep-btn');
    if (sweepBtn) {
        sweepBtn.addEventListener('click', () => {
            const sweepResult = executeSweep();
            if (sweepResult) {
                showSweepSummaryModal(sweepResult);
                updateTowerDOM();
            }
        });
    }
}

/**
 * In-place selective DOM update for live data feeds without flicker
 */
export function updateTowerDOM() {
    if (!isTowerModalOpen) return;

    const state = stateManager.getState();
    const tower = state.tower || {};
    const enemy = getOrInitTowerEnemy(state);
    const currentFloor = tower.currentFloor || 1;
    const isBoss = (currentFloor % 10 === 0);

    // Modal and Card Boss Frame updates
    const modalContent = document.querySelector('.tower-modal-content');
    if (modalContent) {
        if (isBoss) {
            modalContent.classList.add('tower-boss-modal');
        } else {
            modalContent.classList.remove('tower-boss-modal');
        }
    }

    const enemyCard = document.getElementById('tower-enemy-card');
    if (enemyCard) {
        if (isBoss) {
            enemyCard.classList.add('boss-card-frame');
        } else {
            enemyCard.classList.remove('boss-card-frame');
        }
    }

    // Header updates
    const headerFloor = document.getElementById('tower-floor-header');
    if (headerFloor) {
        headerFloor.className = `tower-floor-badge ${isBoss ? 'tower-boss-floor-badge' : ''}`;
        headerFloor.innerHTML = `${isBoss ? '👑 ' : ''}${t('towerFloorLabel', 'FLOOR')} ${currentFloor} ${isBoss ? `(${t('towerBossFloor', 'BOSS FLOOR')})` : ''}`;
    }

    // Enemy card updates
    const enemyName = document.getElementById('tower-enemy-name');
    if (enemyName) enemyName.textContent = enemy.name;

    const enemySprite = document.getElementById('tower-enemy-sprite');
    if (enemySprite) {
        enemySprite.textContent = enemy.emoji;
        enemySprite.className = `tower-enemy-emoji ${isBoss ? 'boss-emoji-pulse' : ''}`;
    }

    const bossTag = document.getElementById('tower-boss-tag');
    if (bossTag) {
        bossTag.className = `tower-tag ${isBoss ? 'boss-tag-active' : 'normal-tag'}`;
        bossTag.textContent = isBoss ? `👑 [${t('towerFloorLabel', 'FLOOR')} ${currentFloor}] ${t('towerBossWord', 'ANOMALY OVERLORD')}` : `[${t('towerFloorLabel', 'FLOOR')} ${currentFloor}] ${t('towerNormalWord', 'COSMIC ANOMALY')}`;
    }

    // Boss Mechanic Indicator
    const mechanicBox = document.getElementById('tower-boss-mechanic-box');
    const mechanicBadge = document.getElementById('tower-boss-mechanic-badge');
    if (mechanicBox && mechanicBadge) {
        if (isBoss && enemy.mechanic) {
            mechanicBox.className = 'tower-mechanic-box mechanic-visible';
            mechanicBox.style.display = 'block';
            mechanicBadge.innerHTML = getMechanicBadgeHTML(enemy);
        } else {
            mechanicBox.className = 'tower-mechanic-box mechanic-hidden';
            mechanicBox.style.display = 'none';
        }
    }

    // Armor Bar
    const armorWrap = document.getElementById('tower-armor-bar-wrap');
    const armorText = document.getElementById('tower-armor-text');
    const armorFill = document.getElementById('tower-armor-fill');
    if (armorWrap && armorText && armorFill) {
        if (isBoss && enemy.maxArmor > 0) {
            armorWrap.className = 'tower-bar-wrap armor-visible';
            armorWrap.style.display = 'block';
            armorText.textContent = `${formatNumber(enemy.currentArmor)} / ${formatNumber(enemy.maxArmor)}`;
            armorFill.style.width = `${getPercent(enemy.currentArmor, enemy.maxArmor)}%`;
        } else {
            armorWrap.className = 'tower-bar-wrap armor-hidden';
            armorWrap.style.display = 'none';
        }
    }

    // HP Bar
    const hpText = document.getElementById('tower-hp-text');
    const hpFill = document.getElementById('tower-hp-fill');
    if (hpText && hpFill) {
        hpText.textContent = `${formatNumber(enemy.currentHp)} / ${formatNumber(enemy.maxHp)}`;
        hpFill.style.width = `${getPercent(enemy.currentHp, enemy.maxHp)}%`;
    }

    // Player telemetry
    const playerDmg = calculatePlayerTowerDamage(state);
    const dmgVal = document.getElementById('tower-player-dmg-val');
    if (dmgVal) dmgVal.textContent = formatNumber(playerDmg.damage);

    const critRates = document.getElementById('tower-crit-rates-val');
    if (critRates) {
        const superChance = (state.upgrades && state.upgrades['super_crit_matrix']) ? '0.5%' : '0.1%';
        critRates.textContent = `5% / ${superChance}`;
    }

    // Upgrade card
    const upgLevel = tower.damageUpgradeLevel || 0;
    const upgCost = getTowerDamageUpgradeCost(upgLevel);
    const upgMult = getTowerDamageUpgradeMultiplier(upgLevel);

    const upgBadge = document.getElementById('tower-upg-lvl-badge');
    if (upgBadge) upgBadge.textContent = `Lvl ${upgLevel}`;

    const upgMultVal = document.getElementById('tower-upg-mult-val');
    if (upgMultVal) upgMultVal.textContent = `×${upgMult.toFixed(2)}`;

    const upgCostVal = document.getElementById('tower-upg-cost-val');
    if (upgCostVal) upgCostVal.textContent = `${formatStardust(upgCost)} Stardust`;

    const stardustBal = document.getElementById('tower-stardust-bal');
    if (stardustBal) stardustBal.textContent = formatStardust(state.stardust || 0);

    const buyBtn = document.getElementById('tower-buy-upg-btn');
    if (buyBtn) {
        buyBtn.disabled = (state.stardust || 0) < upgCost;
    }

    // Tickets & Sweep
    const tickets = typeof tower.tickets === 'number' ? tower.tickets : 10;
    const maxTickets = tower.maxTickets || 10;
    const ticketsBadge = document.getElementById('tower-tickets-badge');
    if (ticketsBadge) ticketsBadge.textContent = `${tickets} / ${maxTickets}`;

    const ticketTimer = document.getElementById('tower-ticket-timer');
    if (ticketTimer) {
        if (tickets >= maxTickets) {
            ticketTimer.textContent = 'MAX';
            ticketTimer.className = 'highlight-cyan';
        } else {
            const remainingMs = getNextTicketTimeRemaining(state);
            ticketTimer.textContent = `+1 in ${formatTimeMs(remainingMs)}`;
            ticketTimer.className = 'highlight-gold';
        }
    }

    const preview = getSweepPreview(state);
    const sweepRangeText = document.getElementById('tower-sweep-range-text');
    if (sweepRangeText) {
        if (preview.canSweep) {
            sweepRangeText.textContent = `Floor 1 – ${preview.endFloor} (${preview.floorCount} floors, ${preview.bossCount} bosses)`;
        } else {
            sweepRangeText.textContent = `Locked (Reach Floor 6+)`;
        }
    }

    const sweepBtn = document.getElementById('tower-sweep-btn');
    if (sweepBtn) {
        sweepBtn.disabled = !preview.canSweep;
    }

    // Bonuses
    const bonuses = tower.bonuses || {};
    const bonusClick = document.getElementById('tower-bonus-click-val');
    if (bonusClick) bonusClick.textContent = `+${((bonuses.clickPower || 0) * 100).toFixed(3)}%`;

    const bonusGen = document.getElementById('tower-bonus-gen-val');
    if (bonusGen) bonusGen.textContent = `+${((bonuses.pointGen || 0) * 100).toFixed(3)}%`;

    const bonusStardust = document.getElementById('tower-bonus-stardust-val');
    if (bonusStardust) bonusStardust.textContent = `+${((bonuses.stardust || 0) * 100).toFixed(4)}%`;

    // Combat Log
    const logBody = document.getElementById('tower-combat-log-body');
    if (logBody) {
        logBody.innerHTML = renderCombatLogHTML(tower.combatLog);
        logBody.scrollTop = logBody.scrollHeight;
    }
}

/**
 * Floating combat text and sprite animations
 * @param {Object} result 
 */
function renderFloatingCombatFeedback(result) {
    const container = document.getElementById('enemy-floating-container');
    const sprite = document.getElementById('tower-enemy-sprite');
    if (!container) return;

    // Sprite shake on hit
    if (sprite) {
        sprite.classList.remove('enemy-hit-shake', 'enemy-dodge-spin');
        void sprite.offsetWidth; // Trigger reflow
        if (result.isDodged) {
            sprite.classList.add('enemy-dodge-spin');
        } else {
            sprite.classList.add('enemy-hit-shake');
        }
    }

    const floatEl = document.createElement('div');
    floatEl.className = 'tower-floating-dmg';

    if (result.isDodged) {
        floatEl.textContent = 'DODGE!';
        floatEl.classList.add('floating-dodge');
    } else if (result.isSuperCrit) {
        floatEl.textContent = `SUPER CRIT! -${formatNumber(result.damage)}`;
        floatEl.classList.add('floating-supercrit');
    } else if (result.isCrit) {
        floatEl.textContent = `CRIT! -${formatNumber(result.damage)}`;
        floatEl.classList.add('floating-crit');
    } else {
        floatEl.textContent = `-${formatNumber(result.damage)}`;
        floatEl.classList.add('floating-normal');
    }

    container.appendChild(floatEl);
    setTimeout(() => {
        if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
    }, 1000);
}

/**
 * Generate Boss Mechanic Badge HTML
 * @param {Object} enemy 
 * @returns {string} HTML
 */
function getMechanicBadgeHTML(enemy) {
    if (!enemy || !enemy.isBoss || !enemy.mechanic) return '';
    switch (enemy.mechanic) {
        case 'armor':
            return `🛡️ <strong>${t('towerMechanicArmor', 'TEMPORARY ARMOR')}:</strong> ${formatNumber(enemy.maxArmor)} HP`;
        case 'damage_reduction':
            return `🛡️ <strong>${t('towerMechanicReduction', t('towerMechanicDR', 'DAMAGE REDUCTION'))}:</strong> -${((enemy.damageReduction || 0.25) * 100).toFixed(0)}%`;
        case 'dodge':
            return `💨 <strong>${t('towerMechanicDodge', 'EVASION DODGE')}:</strong> ${((enemy.dodgeChance || 0.10) * 100).toFixed(0)}% ${t('towerMechanicChance', 'Chance')}`;
        default:
            return '';
    }
}

/**
 * Render Combat Log entries to HTML
 * @param {Array} entries 
 * @returns {string} HTML
 */
function renderCombatLogHTML(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
        return `<div class="log-entry log-entry-info"><span>💡 ${t('towerLogReadyMsg', 'Standing before the Anomaly. Click Attack to engage in combat!')}</span></div>`;
    }

    return entries.map(e => {
        let typeClass = 'log-entry-info';
        if (e.type === 'player') typeClass = 'log-entry-player';
        if (e.type === 'supercrit') typeClass = 'log-entry-supercrit';
        if (e.type === 'dodge') typeClass = 'log-entry-dodge';
        if (e.type === 'enemy') typeClass = 'log-entry-enemy';
        if (e.type === 'reward') typeClass = 'log-entry-reward';
        if (e.type === 'sweep') typeClass = 'log-entry-sweep';

        return `<div class="log-entry ${typeClass}">
            <span class="log-time">[${e.timestamp || ''}]</span>
            <span class="log-text">${e.text}</span>
        </div>`;
    }).join('');
}

/**
 * Display Sweep Summary Modal
 * @param {Object} result 
 */
function showSweepSummaryModal(result) {
    const container = document.getElementById('tower-sweep-summary-container');
    if (!container) return;

    container.innerHTML = `
        <div class="modal-overlay active-overlay sweep-summary-overlay">
            <div class="modal-content sweep-summary-card">
                <div class="modal-header">
                    <h3>🚀 ${t('towerSweepSummaryTitle', 'Tower Sweep Completed!')}</h3>
                    <button id="close-sweep-summary-btn" class="modal-close-btn">&times;</button>
                </div>
                <div class="sweep-summary-body">
                    <p class="sweep-summary-tagline">
                        ${t('towerSweepSummaryTag', 'Floors 1 through')} <strong>Floor ${result.endFloor}</strong> ${t('towerSweepSummaryProcessed', 'have been swept at 25% reward yield.')}
                    </p>
                    <div class="sweep-summary-stats">
                        <div class="summary-item">
                            <span class="summary-label">${t('towerFloorsWord', 'Floors Swept:')}</span>
                            <span class="summary-val highlight-gold">${result.floorCount} (${result.bossCount} ${t('towerBossesWord', 'Bosses')})</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">${t('towerBonusClick', 'Click Power Gained:')}</span>
                            <span class="summary-val highlight-gold">+${(result.gainedClick * 100).toFixed(3)}%</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">${t('towerBonusGen', 'Generator PPS Gained:')}</span>
                            <span class="summary-val highlight-cyan">+${(result.gainedGen * 100).toFixed(3)}%</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">${t('towerBonusStardust', 'Stardust Yield Gained:')}</span>
                            <span class="summary-val highlight-purple">+${(result.gainedStardust * 100).toFixed(4)}%</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">${t('towerTicketsRemainingLabel', 'Tickets Remaining:')}</span>
                            <span class="summary-val highlight-cyan">${result.remainingTickets} / 10</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="claim-sweep-btn" class="click-btn primary-action-btn sweep-claim-btn">
                        <span>✓ ${t('btnContinue', 'CONTINUE')}</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    const close = () => {
        container.innerHTML = '';
    };

    const closeBtn = document.getElementById('close-sweep-summary-btn');
    const claimBtn = document.getElementById('claim-sweep-btn');
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (claimBtn) claimBtn.addEventListener('click', close);
}

/**
 * Helper to calculate percentage for progress bars
 */
function getPercent(cur, max) {
    if (!max || max <= 0) return 0;
    const p = (cur / max) * 100;
    return Math.max(0, Math.min(100, p));
}
