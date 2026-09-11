/**
 * ============================================================================
 * GAME DASHBOARD UI RENDERER
 * ============================================================================
 * Location: /js/ui/gameUI.js
 * Purpose: Renders primary clicker dashboard, currency indicators, action buttons,
 *          Autoclicker toggle, Cosmic Event status banner, and Rebirth portal modal.
 *          Implements flicker-free in-place DOM updates to prevent element tearing.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { handleClick, toggleAutoclick } from '../systems/click.js';
import { 
    performRebirth, 
    canRebirth, 
    getPurchasedClickUpgradesCount, 
    getTotalClickUpgradesCount, 
    getPurchasedGenLevelsCount, 
    getDistinctCosmicEventsCount, 
    getR3CosmicEventsDiscoveredCount,
    getR4CosmicEventsDiscoveredCount,
    getRebirthDifficultyMultiplier 
} from '../systems/rebirth.js';
import {
    handleStardustClick,
    getStardustClickYield,
    getStardustPointsScaling,
    getStardustPointMult,
    getStardustUpgradeLevel,
    getStardustUpgradeCost,
    buyStardustUpgrade,
    formatStardust,
    STARDUST_UPGRADES_DEFS
} from '../systems/stardust.js';
import { saveGame } from '../save/save.js';
import { audioManager } from '../audio/audioManager.js';
import { showNotification } from './notifications.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';
import { cosmicEventRuntime } from '../systems/cosmicEvents.js';
import { openTowerModal, updateTowerDOM } from './towerUI.js';

let lastCurrency = 0;
let lastTimestamp = Date.now();
let pointsPerSec = 0;
let ppsIntervalId = null;

/**
 * Render Primary Game Dashboard UI with Direct Rebirth Unlocks
 * @param {string} containerId - DOM container ID
 */
export function renderGameUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let showRebirthPortal = false;
    let showConfirmModal = false;
    let showCompletionModal = false;
    let showMultiplicityModal = false;
    let showStardustUpgradesModal = false;
    let isStructureBuilt = false;
    let lastAutoclickEnabled = null;

    /**
     * Build primary DOM structure once
     */
    const buildStructure = () => {
        const state = stateManager.getState();
        const purchasedClickCount = getPurchasedClickUpgradesCount(state);
        const totalClickCount = getTotalClickUpgradesCount(state);
        const isMasteryComplete = canRebirth(state);
        const rebirthCount = state.rebirthCount || 0;
        const isAutoclickUnlocked = state.autoclickUnlocked || rebirthCount >= 3;

        container.innerHTML = `
            <div class="game-container">
                <!-- ZONE 1: CORE GAMEPLAY & PROGRESSION ZONE -->
                <section class="gameplay-zone" aria-label="Core Gameplay Zone">
                    <!-- Cosmic Events Banner Container -->
                    <div id="cosmic-banner-container"></div>

                    <!-- Primary Resource & Action Dashboard Card -->
                    <div class="game-card core-gameplay-card">
                        <div class="zone-badge-header">
                            <span class="status-badge core-zone-badge">⚡ ${t('gameplayZoneTitle')}</span>
                        </div>

                        <div class="currency-wrapper">
                            <div class="currency-label-tag">
                                <span class="currency-label-icon">✦</span>
                                <span class="currency-label-text">${t('pointsTitle')}</span>
                            </div>
                            <div id="currency-amount" class="currency-amount">${formatNumber(state.currency)}</div>
                            <div id="currency-per-sec" class="currency-per-sec ${rebirthCount < 2 ? 'gen-locked-tag' : ''}">
                                ${rebirthCount < 2 ? t('pointGenLocked') : `(+${formatNumber(pointsPerSec)}/s)`}
                            </div>
                        </div>

                        <!-- Click Engine Stage: Prominent clicker with autoclick directly below -->
                        <div class="click-engine-stage">
                            <button id="click-btn" class="click-btn primary-click-object">${t('clickBtn')}</button>

                            <button id="autoclick-toggle-btn" class="click-btn ${state.autoclickEnabled ? 'autoclick-on' : 'secondary-btn'} autoclick-btn" type="button">
                                <span id="autoclick-btn-text">🤖 ${t('autoclickLabel')} ${state.autoclickEnabled ? t('autoclickOn') : t('autoclickOff')}</span>
                            </button>
                        </div>

                        <!-- Core Run Progression Controls: Upgrades, Generators, Rebirth -->
                        <div class="core-progression-divider">
                            <span>RUN PROGRESSION</span>
                        </div>
                        <div class="core-progression-grid">
                            <!-- Clicking Upgrades Navigation Button -->
                            <a href="upgrades.html" class="click-btn secondary-btn core-nav-btn upgrade-nav-btn">
                                <span id="upgrade-nav-text">⚡ ${t('clickingUpgradesBtn')} (${purchasedClickCount}/${totalClickCount})</span>
                            </a>

                            <!-- Point Generators Navigation Button (Unlocked at Rebirth 2) -->
                            <div id="generator-nav-btn-container" class="gen-nav-wrapper">
                                ${rebirthCount >= 2 ? `
                                    <a href="generators.html" class="click-btn primary-action-btn core-nav-btn generator-nav-btn">
                                        <span>⚙️ ${t('btnGenerators')}</span>
                                    </a>
                                ` : `
                                    <button class="click-btn secondary-btn core-nav-btn" disabled title="${t('generatorsLockedNotice')}">
                                        <span>🔒 ${t('btnGenerators')}</span>
                                    </button>
                                `}
                            </div>

                            <!-- Multiplicity Navigation Button (Unlocked strictly at Rebirth 5) -->
                            <div id="multiplicity-nav-btn-container" class="multiplicity-nav-wrapper">
                                ${rebirthCount >= 5 ? `
                                    <button id="open-multiplicity-btn" class="click-btn primary-action-btn core-nav-btn multiplicity-nav-btn">
                                        <span>🌌 ${t('multiplicityBtn', 'MULTIPLICITY')}</span>
                                    </button>
                                ` : `
                                    <button class="click-btn secondary-btn core-nav-btn multiplicity-locked-btn" disabled title="${t('multiplicityLockedTooltip', 'Multiplicity is locked until Rebirth 5.')}">
                                        <span>🔒 ${t('multiplicityLockedBtn', 'MULTIPLICITY (Rebirth 5)')}</span>
                                    </button>
                                `}
                            </div>

                            <!-- Infinity Tower Navigation Button (Unlocked strictly at Rebirth 5) -->
                            <div id="tower-nav-btn-container" class="tower-nav-wrapper">
                                ${rebirthCount >= 5 ? `
                                    <button id="open-tower-btn" class="click-btn primary-action-btn core-nav-btn tower-nav-btn">
                                        <span>🗼 ${t('infinityTowerBtn', 'INFINITY TOWER')}</span>
                                    </button>
                                ` : `
                                    <button class="click-btn secondary-btn core-nav-btn tower-locked-btn" disabled title="${t('infinityTowerLockedTooltip', 'Infinity Tower is locked until Rebirth 5.')}">
                                        <span>🔒 ${t('infinityTowerLockedBtn', 'INFINITY TOWER (Rebirth 5)')}</span>
                                    </button>
                                `}
                            </div>

                            <!-- Single Rebirth Button: Opens Rebirth & Ascended Content Context -->
                            <button id="open-rebirth-portal-btn" class="click-btn ${isMasteryComplete ? 'primary-action-btn' : 'secondary-btn'} core-nav-btn rebirth-context-trigger-btn">
                                <span id="rebirth-nav-text">🌟 ${t('rebirthBtn')} ${isMasteryComplete ? '✨' : ''}</span>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- ZONE 2: MISCELLANEOUS / META SUPPORTING ZONE -->
                <section class="meta-zone" aria-label="Miscellaneous & Meta Features Zone">
                    <div class="game-card meta-features-card">
                        <div class="meta-header-group">
                            <div class="meta-title-row">
                                <span class="meta-icon-badge">🔮</span>
                                <h3 class="meta-main-title">${t('metaZoneTitle')}</h3>
                            </div>
                            <p class="meta-subtitle">${t('metaZoneSubtitle')}</p>
                        </div>

                        <div class="meta-features-grid">
                            <!-- 1. Achievements Button -->
                            <a href="achievements.html" class="meta-feature-card achievement-nav-btn">
                                <div class="meta-card-icon">🏆</div>
                                <div class="meta-card-info">
                                    <span class="meta-card-title">${t('achievementBtn')}</span>
                                    <span class="meta-card-desc">${t('achievementsFeatureDesc')}</span>
                                </div>
                                <span class="meta-card-arrow">➔</span>
                            </a>

                            <!-- 2. Badges & Badge Upgrades Button -->
                            <a href="badges.html" class="meta-feature-card badge-nav-btn">
                                <div class="meta-card-icon">🏅</div>
                                <div class="meta-card-info">
                                    <span class="meta-card-title">${t('badgesBtn')}</span>
                                    <span class="meta-card-desc">${t('badgesFeatureDesc')}</span>
                                </div>
                                <span class="meta-card-arrow">➔</span>
                            </a>

                            <!-- 3. Cosmic Gallery Button -->
                            <a href="gallery.html" class="meta-feature-card gallery-nav-btn">
                                <div class="meta-card-icon">🖼️</div>
                                <div class="meta-card-info">
                                    <span class="meta-card-title">${t('galleryBtn')}</span>
                                    <span class="meta-card-desc">${t('galleryFeatureDesc')}</span>
                                </div>
                                <span class="meta-card-arrow">➔</span>
                            </a>

                            <!-- 4. Statistics & Telemetry Button -->
                            <a href="stats.html" class="meta-feature-card stats-nav-btn">
                                <div class="meta-card-icon">📊</div>
                                <div class="meta-card-info">
                                    <span class="meta-card-title">${t('statsBtn')}</span>
                                    <span class="meta-card-desc">${t('statsFeatureDesc')}</span>
                                </div>
                                <span class="meta-card-arrow">➔</span>
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            <!-- Modals Overlay Containers -->
            <div id="rebirth-portal-modal-container"></div>
            <div id="rebirth-confirm-modal-container"></div>
            <div id="rebirth-completion-modal-container"></div>
            <div id="multiplicity-modal-container"></div>
            <div id="stardust-upgrades-modal-container"></div>
            <div id="infinity-tower-modal-container"></div>
        `;

        // Bind permanent event listeners once
        const clickBtn = document.getElementById('click-btn');
        if (clickBtn) {
            clickBtn.addEventListener('click', handleClick);
        }

        const upgradeNavBtn = container.querySelector('.upgrade-nav-btn');
        if (upgradeNavBtn) {
            upgradeNavBtn.addEventListener('click', () => {
                saveGame();
            });
        }

        const generatorNavBtn = container.querySelector('.generator-nav-btn');
        if (generatorNavBtn) {
            generatorNavBtn.addEventListener('click', () => {
                saveGame();
            });
        }

        const achievementNavBtn = container.querySelector('.achievement-nav-btn');
        if (achievementNavBtn) {
            achievementNavBtn.addEventListener('click', () => {
                saveGame();
            });
        }

        const badgeNavBtn = container.querySelector('.badge-nav-btn');
        if (badgeNavBtn) {
            badgeNavBtn.addEventListener('click', () => {
                saveGame();
            });
        }

        const galleryNavBtn = container.querySelector('.gallery-nav-btn');
        if (galleryNavBtn) {
            galleryNavBtn.addEventListener('click', () => {
                saveGame();
            });
        }

        const statsNavBtn = container.querySelector('.stats-nav-btn');
        if (statsNavBtn) {
            statsNavBtn.addEventListener('click', () => {
                saveGame();
            });
        }

        const openRebirthPortalBtn = document.getElementById('open-rebirth-portal-btn');
        if (openRebirthPortalBtn) {
            openRebirthPortalBtn.addEventListener('click', () => {
                showRebirthPortal = true;
                updateDOM();
            });
        }

        const openMultiplicityBtn = document.getElementById('open-multiplicity-btn');
        if (openMultiplicityBtn) {
            openMultiplicityBtn.addEventListener('click', () => {
                showMultiplicityModal = true;
                updateDOM();
            });
        }

        const openTowerBtn = document.getElementById('open-tower-btn');
        if (openTowerBtn) {
            openTowerBtn.addEventListener('click', () => {
                openTowerModal();
            });
        }

        isStructureBuilt = true;
    };

    /**
     * Selective flicker-free DOM updates for numbers, banners, and modals
     */
    const updateDOM = () => {
        if (!isStructureBuilt) buildStructure();

        const state = stateManager.getState();
        const purchasedClickCount = getPurchasedClickUpgradesCount(state);
        const totalClickCount = getTotalClickUpgradesCount(state);
        const purchasedGenLevels = getPurchasedGenLevelsCount(state);
        const distinctEventsCount = getDistinctCosmicEventsCount(state);
        const isMasteryComplete = canRebirth(state);
        const rebirthCount = state.rebirthCount || 0;
        const rebirthUpgrades = state.rebirthUpgrades || {};
        const isAdvancedUnlocked = state.advancedClickingUnlocked || rebirthCount >= 1;
        const isEfficientInstinctActive = rebirthCount >= 2 || !!rebirthUpgrades.efficient_instinct;
        const isAutoclickUnlocked = state.autoclickUnlocked || rebirthCount >= 3;
        const isCosmicUnlocked = state.cosmicEventsUnlocked || rebirthCount >= 3;

        const nextDifficultyMult = getRebirthDifficultyMultiplier(rebirthCount + 1).toFixed(2);
        const currentDifficultyMult = getRebirthDifficultyMultiplier(rebirthCount).toFixed(2);

        // Calculate mastery count text & fill percentage dynamically per rebirth tier
        let masteryCountText = '';
        let masteryPercent = 0;
        if (rebirthCount === 0) {
            masteryCountText = `${purchasedClickCount} / 10`;
            masteryPercent = (purchasedClickCount / 10) * 100;
        } else if (rebirthCount === 1) {
            masteryCountText = `${purchasedClickCount} / 13`;
            masteryPercent = (purchasedClickCount / 13) * 100;
        } else if (rebirthCount === 2) {
            masteryCountText = `${purchasedGenLevels} / 50`;
            masteryPercent = (purchasedGenLevels / 50) * 100;
        } else if (rebirthCount === 3) {
            const r3EventsCount = getR3CosmicEventsDiscoveredCount(state);
            masteryCountText = `${purchasedClickCount}/20 Upgrades | ${purchasedGenLevels}/125 Gens | ${r3EventsCount}/7 R3 Occasions`;
            const cRatio = Math.min(1, purchasedClickCount / 20);
            const gRatio = Math.min(1, purchasedGenLevels / 125);
            const eRatio = Math.min(1, r3EventsCount / 7);
            masteryPercent = ((cRatio + gRatio + eRatio) / 3) * 100;
        } else if (rebirthCount === 4) {
            const r4EventsCount = getR4CosmicEventsDiscoveredCount(state);
            masteryCountText = `${purchasedClickCount}/26 Upgrades | ${purchasedGenLevels}/265 Gens | ${r4EventsCount}/4 R4 Occasions`;
            const cRatio = Math.min(1, purchasedClickCount / 26);
            const gRatio = Math.min(1, purchasedGenLevels / 265);
            const eRatio = Math.min(1, r4EventsCount / 4);
            masteryPercent = ((cRatio + gRatio + eRatio) / 3) * 100;
        } else {
            const stardustMultLvl = getStardustUpgradeLevel('point_multiplier', state);
            masteryCountText = `${purchasedClickCount}/41 Upgrades | ${purchasedGenLevels}/565 Gens | ${stardustMultLvl}/5 Stardust Mult`;
            const cRatio = Math.min(1, purchasedClickCount / 41);
            const gRatio = Math.min(1, purchasedGenLevels / 565);
            const sRatio = Math.min(1, stardustMultLvl / 5);
            masteryPercent = ((cRatio + gRatio + sRatio) / 3) * 100;
        }

        // Update currency & upgrade counts in-place without replacing DOM nodes
        const currencyEl = document.getElementById('currency-amount');
        if (currencyEl) currencyEl.textContent = formatNumber(state.currency);

        const ppsEl = document.getElementById('currency-per-sec');
        if (ppsEl) {
            if (rebirthCount < 2) {
                ppsEl.textContent = t('pointGenLocked');
                ppsEl.className = 'currency-per-sec gen-locked-tag';
            } else {
                ppsEl.textContent = `(+${formatNumber(pointsPerSec)}/s)`;
                ppsEl.className = 'currency-per-sec';
            }
        }

        // Update generator nav button in-place when rebirth level changes
        const genNavContainer = document.getElementById('generator-nav-btn-container');
        if (genNavContainer) {
            const hasLink = !!genNavContainer.querySelector('a.generator-nav-btn');
            if (rebirthCount >= 2 && !hasLink) {
                genNavContainer.innerHTML = `
                    <a href="generators.html" class="click-btn primary-action-btn generator-nav-btn">
                        <span>⚙️ ${t('btnGenerators')}</span>
                    </a>
                `;
                const generatorNavBtn = genNavContainer.querySelector('.generator-nav-btn');
                if (generatorNavBtn) {
                    generatorNavBtn.addEventListener('click', () => saveGame());
                }
            } else if (rebirthCount < 2 && hasLink) {
                genNavContainer.innerHTML = `
                    <button class="click-btn secondary-btn" disabled title="${t('generatorsLockedNotice')}">
                        <span>🔒 ${t('btnGenerators')}</span>
                    </button>
                `;
            }
        }

        // Update multiplicity nav button in-place when rebirth level changes
        const multNavContainer = document.getElementById('multiplicity-nav-btn-container');
        if (multNavContainer) {
            const hasMultBtn = !!multNavContainer.querySelector('#open-multiplicity-btn');
            if (rebirthCount >= 5 && !hasMultBtn) {
                multNavContainer.innerHTML = `
                    <button id="open-multiplicity-btn" class="click-btn primary-action-btn core-nav-btn multiplicity-nav-btn">
                        <span>🌌 ${t('multiplicityBtn', 'MULTIPLICITY')}</span>
                    </button>
                `;
                const newBtn = document.getElementById('open-multiplicity-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', () => {
                        showMultiplicityModal = true;
                        updateDOM();
                    });
                }
            } else if (rebirthCount < 5 && (hasMultBtn || !multNavContainer.querySelector('.multiplicity-locked-btn'))) {
                multNavContainer.innerHTML = `
                    <button class="click-btn secondary-btn core-nav-btn multiplicity-locked-btn" disabled title="${t('multiplicityLockedTooltip', 'Multiplicity is locked until Rebirth 5.')}">
                        <span>🔒 ${t('multiplicityLockedBtn', 'MULTIPLICITY (Rebirth 5)')}</span>
                    </button>
                `;
            }
        }

        const towerNavContainer = document.getElementById('tower-nav-btn-container');
        if (towerNavContainer) {
            const hasTowerBtn = !!towerNavContainer.querySelector('#open-tower-btn');
            if (rebirthCount >= 5 && !hasTowerBtn) {
                towerNavContainer.innerHTML = `
                    <button id="open-tower-btn" class="click-btn primary-action-btn core-nav-btn tower-nav-btn">
                        <span>🗼 ${t('infinityTowerBtn', 'INFINITY TOWER')}</span>
                    </button>
                `;
                const newBtn = document.getElementById('open-tower-btn');
                if (newBtn) {
                    newBtn.addEventListener('click', () => {
                        openTowerModal();
                    });
                }
            } else if (rebirthCount < 5 && (hasTowerBtn || !towerNavContainer.querySelector('.tower-locked-btn'))) {
                towerNavContainer.innerHTML = `
                    <button class="click-btn secondary-btn core-nav-btn tower-locked-btn" disabled title="${t('infinityTowerLockedTooltip', 'Infinity Tower is locked until Rebirth 5.')}">
                        <span>🔒 ${t('infinityTowerLockedBtn', 'INFINITY TOWER (Rebirth 5)')}</span>
                    </button>
                `;
            }
        }

        updateTowerDOM();

        // Update Autoclick toggle button in-place only when autoclick state changes
        if (lastAutoclickEnabled !== state.autoclickEnabled) {
            lastAutoclickEnabled = state.autoclickEnabled;
            const autoclickBtn = document.getElementById('autoclick-toggle-btn');
            if (autoclickBtn) {
                autoclickBtn.className = `click-btn ${state.autoclickEnabled ? 'autoclick-on' : 'secondary-btn'} autoclick-btn`;
                const textSpan = document.getElementById('autoclick-btn-text');
                if (textSpan) {
                    textSpan.textContent = `🤖 ${t('autoclickLabel')} ${state.autoclickEnabled ? t('autoclickOn') : t('autoclickOff')}`;
                } else {
                    autoclickBtn.innerHTML = `<span id="autoclick-btn-text">🤖 ${t('autoclickLabel')} ${state.autoclickEnabled ? t('autoclickOn') : t('autoclickOff')}</span>`;
                }
            }
        }

        const upgradeNavText = document.getElementById('upgrade-nav-text');
        if (upgradeNavText) upgradeNavText.textContent = `⚡ ${t('clickingUpgradesBtn')} (${purchasedClickCount}/${totalClickCount})`;

        const rebirthNavText = document.getElementById('rebirth-nav-text');
        if (rebirthNavText) rebirthNavText.textContent = `🌟 ${t('rebirthBtn')} ${isMasteryComplete ? '✨' : ''}`;

        const openRebirthBtn = document.getElementById('open-rebirth-portal-btn');
        if (openRebirthBtn) {
            openRebirthBtn.className = `click-btn ${isMasteryComplete ? 'primary-action-btn' : 'secondary-btn'} core-nav-btn rebirth-context-trigger-btn`;
        }

        // Update Cosmic Banner in-place
        const cosmicContainer = document.getElementById('cosmic-banner-container');
        if (cosmicContainer) {
            if (isCosmicUnlocked) {
                const activeEvent = cosmicEventRuntime.activeEvent;
                const nextRollSec = Math.max(0, Math.ceil((cosmicEventRuntime.nextRollTime - Date.now()) / 1000));
                const activeSec = activeEvent ? Math.max(0, Math.ceil((activeEvent.endTime - Date.now()) / 1000)) : 0;

                const existingBanner = cosmicContainer.querySelector('.cosmic-event-banner');
                const isCurrentActive = existingBanner && !existingBanner.classList.contains('stabilized');

                if (!existingBanner || (activeEvent && !isCurrentActive) || (!activeEvent && isCurrentActive)) {
                    const evtTitle = activeEvent ? t(`event_${activeEvent.def.id}_name`, activeEvent.def.name) : '';
                    cosmicContainer.innerHTML = `
                        <div class="cosmic-event-banner ${activeEvent ? activeEvent.def.themeClass : 'stabilized'}">
                            ${activeEvent ? `
                                <div class="cosmic-banner-content">
                                    <div class="cosmic-banner-top">
                                        <span class="cosmic-rarity-tag ${activeEvent.def.rarity.toLowerCase().replace(/\s+/g, '-')}">${activeEvent.def.rarity}</span>
                                        <span class="cosmic-event-title">⚡ ${evtTitle}</span>
                                        <span class="cosmic-event-timer">⏱️ ${activeSec}s</span>
                                    </div>
                                    <div class="cosmic-event-buffs">
                                        <span>Click: +${Math.round((activeEvent.def.clickMult - 1) * 100)}%</span> | 
                                        <span>Gen: +${Math.round((activeEvent.def.pointGenMult - 1) * 100)}%</span> | 
                                        <span>Speed: +${Math.round((activeEvent.def.gameSpeedMult - 1) * 100)}%</span>
                                    </div>
                                </div>
                            ` : `
                                <div class="cosmic-banner-content stabilized">
                                    <span class="cosmic-event-title">🌌 ${t('cosmicStatusStabilized')}</span>
                                    <span class="cosmic-event-timer">⏱️ ${nextRollSec}s</span>
                                </div>
                            `}
                        </div>
                    `;
                } else {
                    const timerEl = cosmicContainer.querySelector('.cosmic-event-timer');
                    if (timerEl) {
                        timerEl.textContent = `⏱️ ${activeEvent ? activeSec : nextRollSec}s`;
                    }
                }
            } else {
                if (cosmicContainer.innerHTML !== '') {
                    cosmicContainer.innerHTML = '';
                }
            }
        }

        // Helpers for Rebirth modals
        const getRewardText = () => {
            if (rebirthCount === 0) return t('unlocksValR1');
            if (rebirthCount === 1) return t('unlocksValR2');
            if (rebirthCount === 2) return t('unlocksValR3');
            if (rebirthCount === 3) return t('unlocksValR4');
            if (rebirthCount === 4) return t('unlocksValR5');
            return t('unlocksValR5Mastery', 'Rebirth 5 Multiplicity Mastery (Maximum Ascension)');
        };

        const getReqNoteText = () => {
            if (rebirthCount === 0) return t('masteryReqR1');
            if (rebirthCount === 1) return t('masteryReqR2');
            if (rebirthCount === 2) return t('masteryReqR3');
            if (rebirthCount === 3) return t('masteryReqR4');
            if (rebirthCount === 4) return t('masteryReqR5');
            return t('masteryReqR5Mastery', 'Requires 41 Click Upgrades, 565 Generator Levels, and Point Multiplier Level 5 (x32).');
        };

        const getRebirthBtnLabel = () => {
            if (rebirthCount === 0) return t('rebirthAvailableBtn');
            if (rebirthCount === 1) return t('rebirth2AvailableBtn');
            if (rebirthCount === 2) return t('rebirth3AvailableBtn');
            if (rebirthCount === 3) return t('rebirth4AvailableBtn');
            if (rebirthCount === 4) return t('rebirth5AvailableBtn');
            return `REBIRTH ${rebirthCount + 1}`;
        };

        const getGainUnlockText = () => {
            if (rebirthCount === 0) return t('gainUnlockR1');
            if (rebirthCount === 1) return t('gainUnlockR2');
            if (rebirthCount === 2) return t('gainUnlockR3');
            if (rebirthCount === 3) return t('gainUnlockR4');
            if (rebirthCount === 4) return t('gainUnlockR5');
            return t('gainUnlockR5Mastery', '4x Permanent Click Power, 4x Point Generators, Super Crit (0.1% chance for x100 damage), Stardust Multiplicity');
        };

        const getCompletionDescText = () => {
            if (rebirthCount === 1) return t('rebirthModalDescR1');
            if (rebirthCount === 2) return t('rebirthModalDescR2');
            if (rebirthCount === 3) return t('rebirthModalDescR3');
            if (rebirthCount === 4) return t('rebirthModalDescR4');
            if (rebirthCount === 5) return t('rebirthModalDescR5');
            return t('rebirthModalDescR5');
        };

        const isRebirth4Unlocked = rebirthCount >= 4;
        const isRebirth5Unlocked = rebirthCount >= 5;

        // Modal 1: Rebirth Context Portal Modal
        const portalModalContainer = document.getElementById('rebirth-portal-modal-container');
        if (portalModalContainer) {
            if (showRebirthPortal) {
                const existingModal = portalModalContainer.querySelector('.rebirth-context-modal');
                if (!existingModal) {
                    portalModalContainer.innerHTML = `
                        <div class="modal-overlay">
                            <div class="modal-card rebirth-context-modal">
                                <div class="modal-header-row">
                                    <h3 id="portal-modal-title">⚡ ${t('rebirthPortalTitle')} ${rebirthCount >= 1 ? `(Rebirth ${rebirthCount + 1})` : ''}</h3>
                                </div>

                                <div class="rebirth-card-content">
                                    <div class="mastery-box">
                                        <div class="mastery-header">
                                            <span class="mastery-title">${t('masteryTitle')}</span>
                                            <span id="portal-mastery-count" class="mastery-count ${isMasteryComplete ? 'complete' : ''}">${masteryCountText}</span>
                                        </div>
                                        <div class="mastery-progress-bar">
                                            <div id="portal-mastery-fill" class="mastery-fill" style="width: ${Math.min(100, masteryPercent)}%"></div>
                                        </div>
                                    </div>

                                    <div id="portal-status-banner-container">
                                        ${isMasteryComplete ? `
                                            <div class="rebirth-status-banner available">
                                                <p class="status-badge-text">✨ ${t('masteryComplete')} ✨</p>
                                                <div class="rebirth-reward-preview">
                                                    <p><strong>${t('rebirthRewardLabel')}:</strong> <span class="highlight-gold">${getRewardText()}</span></p>
                                                    <p><strong>${t('nextRunDiffLabel')}:</strong> <span class="highlight-warn">×${nextDifficultyMult}</span></p>
                                                </div>
                                                <button id="rebirth-btn" class="click-btn primary-action-btn rebirth-trigger-btn">
                                                    🌟 ${getRebirthBtnLabel()}
                                                </button>
                                            </div>
                                        ` : `
                                            <div class="rebirth-status-banner locked">
                                                <p class="rebirth-req-note">${getReqNoteText()}</p>
                                                <button id="rebirth-btn" class="click-btn secondary-btn" disabled>
                                                    🔒 ${t('rebirthLockedBtn')}
                                                </button>
                                            </div>
                                        `}
                                    </div>
                                </div>

                                <div class="ascended-content-section">
                                    <h4 class="ascended-section-title">🔮 ${t('permanentUnlocksTitle')}</h4>
                                    <div class="rebirth-upgrades-list">
                                        <div id="portal-ascended-item-1" class="rebirth-upgrade-item ${isAdvancedUnlocked ? 'purchased' : 'locked'}">
                                            <div class="rebirth-upgrade-info">
                                                <h3 class="upgrade-name">⚡ ${t('rebirth1UnlockName')} (Rebirth 1)</h3>
                                                <p class="upgrade-desc">"${t('rebirth1UnlockDesc')}"</p>
                                            </div>
                                            <div class="rebirth-upgrade-action">
                                                ${isAdvancedUnlocked ? `<span class="status-badge purchased-badge">✓ ${t('statusUnlocked')}</span>` : `<span class="status-badge locked-badge">🔒 ${t('statusLocked')}</span>`}
                                            </div>
                                        </div>

                                        <div id="portal-ascended-item-2" class="rebirth-upgrade-item ${isEfficientInstinctActive ? 'purchased' : 'locked'}">
                                            <div class="rebirth-upgrade-info">
                                                <h3 class="upgrade-name">🧬 ${t('rebirth2UnlockName')} (Rebirth 2)</h3>
                                                <p class="upgrade-desc">"${t('rebirth2UnlockDesc')}"</p>
                                            </div>
                                            <div class="rebirth-upgrade-action">
                                                ${isEfficientInstinctActive ? `<span class="status-badge purchased-badge">✨ ${t('statusActiveAuto')}</span>` : `<span class="status-badge locked-badge">🔒 ${t('statusLocked')}</span>`}
                                            </div>
                                        </div>

                                        <div id="portal-ascended-item-3" class="rebirth-upgrade-item ${isAutoclickUnlocked ? 'purchased' : 'locked'}">
                                            <div class="rebirth-upgrade-info">
                                                <h3 class="upgrade-name">🤖 ${t('rebirth3UnlockName')} (Rebirth 3)</h3>
                                                <p class="upgrade-desc">"${t('rebirth3UnlockDesc')}"</p>
                                            </div>
                                            <div class="rebirth-upgrade-action">
                                                ${isAutoclickUnlocked ? `<span class="status-badge purchased-badge">✨ ${t('statusUnlocked')}</span>` : `<span class="status-badge locked-badge">🔒 ${t('statusLocked')}</span>`}
                                            </div>
                                        </div>

                                        <div id="portal-ascended-item-4" class="rebirth-upgrade-item ${isRebirth4Unlocked ? 'purchased' : 'locked'}">
                                            <div class="rebirth-upgrade-info">
                                                <h3 class="upgrade-name">✨ ${t('rebirth4UnlockName')} (Rebirth 4)</h3>
                                                <p class="upgrade-desc">"${t('rebirth4UnlockDesc')}"</p>
                                            </div>
                                            <div class="rebirth-upgrade-action">
                                                ${isRebirth4Unlocked ? `<span class="status-badge purchased-badge">✨ ${t('statusUnlocked')}</span>` : `<span class="status-badge locked-badge">🔒 ${t('statusLocked')}</span>`}
                                            </div>
                                        </div>

                                        <div id="portal-ascended-item-5" class="rebirth-upgrade-item ${isRebirth5Unlocked ? 'purchased' : 'locked'}">
                                            <div class="rebirth-upgrade-info">
                                                <h3 class="upgrade-name">🌌 ${t('rebirth5UnlockName', 'Multiplicity')} (Rebirth 5)</h3>
                                                <p class="upgrade-desc">"${t('rebirth5UnlockDesc', '4x Permanent Click Power, 4x Point Generators, Super Crit, and Multiplicity Stardust Crucible')}"</p>
                                            </div>
                                            <div class="rebirth-upgrade-action">
                                                ${isRebirth5Unlocked ? `<span class="status-badge purchased-badge">✨ ${t('statusUnlocked')}</span>` : `<span class="status-badge locked-badge">🔒 ${t('statusLocked')}</span>`}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="modal-actions">
                                    <button id="close-rebirth-portal-btn" class="click-btn secondary-btn">${t('btnClose')}</button>
                                </div>
                            </div>
                        </div>
                    `;

                    const closePortalBtn = document.getElementById('close-rebirth-portal-btn');
                    if (closePortalBtn) {
                        closePortalBtn.addEventListener('click', () => {
                            showRebirthPortal = false;
                            updateDOM();
                        });
                    }

                    const rebirthTriggerBtn = document.getElementById('rebirth-btn');
                    if (rebirthTriggerBtn && !rebirthTriggerBtn.disabled) {
                        rebirthTriggerBtn.addEventListener('click', () => {
                            showConfirmModal = true;
                            updateDOM();
                        });
                    }
                } else {
                    // Update in-place without replacing innerHTML of the modal card
                    const titleEl = document.getElementById('portal-modal-title');
                    if (titleEl) titleEl.textContent = `⚡ ${t('rebirthPortalTitle')} ${rebirthCount >= 1 ? `(Rebirth ${rebirthCount + 1})` : ''}`;

                    const countEl = document.getElementById('portal-mastery-count');
                    if (countEl) {
                        countEl.textContent = masteryCountText;
                        countEl.className = `mastery-count ${isMasteryComplete ? 'complete' : ''}`;
                    }

                    const fillEl = document.getElementById('portal-mastery-fill');
                    if (fillEl) {
                        fillEl.style.width = `${Math.min(100, masteryPercent)}%`;
                    }

                    const bannerContainer = document.getElementById('portal-status-banner-container');
                    if (bannerContainer) {
                        const isCurrentlyAvailable = bannerContainer.querySelector('.rebirth-status-banner.available');
                        if ((isMasteryComplete && !isCurrentlyAvailable) || (!isMasteryComplete && isCurrentlyAvailable)) {
                            bannerContainer.innerHTML = isMasteryComplete ? `
                                <div class="rebirth-status-banner available">
                                    <p class="status-badge-text">✨ ${t('masteryComplete')} ✨</p>
                                    <div class="rebirth-reward-preview">
                                        <p><strong>${t('rebirthRewardLabel')}:</strong> <span class="highlight-gold">${getRewardText()}</span></p>
                                        <p><strong>${t('nextRunDiffLabel')}:</strong> <span class="highlight-warn">×${nextDifficultyMult}</span></p>
                                    </div>
                                    <button id="rebirth-btn" class="click-btn primary-action-btn rebirth-trigger-btn">
                                        🌟 ${getRebirthBtnLabel()}
                                    </button>
                                </div>
                            ` : `
                                <div class="rebirth-status-banner locked">
                                    <p class="rebirth-req-note">${getReqNoteText()}</p>
                                    <button id="rebirth-btn" class="click-btn secondary-btn" disabled>
                                        🔒 ${t('rebirthLockedBtn')}
                                    </button>
                                </div>
                            `;

                            const rebirthTriggerBtn = document.getElementById('rebirth-btn');
                            if (rebirthTriggerBtn && !rebirthTriggerBtn.disabled) {
                                rebirthTriggerBtn.addEventListener('click', () => {
                                    showConfirmModal = true;
                                    updateDOM();
                                });
                            }
                        }
                    }
                }
            } else {
                if (portalModalContainer.innerHTML !== '') {
                    portalModalContainer.innerHTML = '';
                }
            }
        }

        // Modal 2: Rebirth Confirm Modal
        const confirmModalContainer = document.getElementById('rebirth-confirm-modal-container');
        if (confirmModalContainer) {
            if (showConfirmModal) {
                if (!confirmModalContainer.querySelector('.modal-card')) {
                    confirmModalContainer.innerHTML = `
                        <div class="modal-overlay">
                            <div class="modal-card">
                                <h3>⚠️ ${t('rebirthConfirmTitle')} ${rebirthCount + 1}</h3>
                                <div class="modal-stats text-left">
                                    <p><strong>${t('gainSectionTitle')}:</strong> <span class="highlight-gold">${getGainUnlockText()}</span></p>
                                    <p><strong>${t('nextRunDiffLabel')}:</strong> ×${nextDifficultyMult}</p>
                                    <p class="reset-notice">❌ ${t('loseSectionTitle')}: ${t('loseCurrencyVal')}, ${t('loseUpgradesVal')}, ${t('loseStacksVal')}.</p>
                                    <p class="keep-notice">✓ ${t('keepSectionTitle')}: ${t('keepUpgradesVal')}, ${t('keepStatsVal')}.</p>
                                </div>
                                <div class="modal-actions">
                                    <button id="cancel-rebirth-btn" class="click-btn secondary-btn">${t('btnCancel')}</button>
                                    <button id="confirm-rebirth-btn" class="click-btn primary-action-btn">${t('btnConfirm')}</button>
                                </div>
                            </div>
                        </div>
                    `;

                    const cancelBtn = document.getElementById('cancel-rebirth-btn');
                    if (cancelBtn) {
                        cancelBtn.addEventListener('click', () => {
                            showConfirmModal = false;
                            updateDOM();
                        });
                    }

                    const confirmBtn = document.getElementById('confirm-rebirth-btn');
                    if (confirmBtn) {
                        confirmBtn.addEventListener('click', () => {
                            showConfirmModal = false;
                            showRebirthPortal = false;
                            const success = performRebirth();
                            if (success) {
                                audioManager.playClickSFX();
                                showCompletionModal = true;
                                updateDOM();
                            }
                        });
                    }
                }
            } else {
                if (confirmModalContainer.innerHTML !== '') {
                    confirmModalContainer.innerHTML = '';
                }
            }
        }

        // Modal 3: Rebirth Completion Modal
        const completionModalContainer = document.getElementById('rebirth-completion-modal-container');
        if (completionModalContainer) {
            if (showCompletionModal) {
                if (!completionModalContainer.querySelector('.modal-card')) {
                    completionModalContainer.innerHTML = `
                        <div class="modal-overlay">
                            <div class="modal-card">
                                <h3>🎉 ${t('rebirthModalTitle')}</h3>
                                <p class="modal-message">${getCompletionDescText()}</p>
                                <div class="modal-stats">
                                    <p><strong>Rebirth Count:</strong> ${rebirthCount}</p>
                                    <p><strong>Current Difficulty:</strong> ×${currentDifficultyMult}</p>
                                </div>
                                <button id="close-rebirth-modal-btn" class="click-btn primary-action-btn">
                                    ${t('btnContinue')}
                                </button>
                            </div>
                        </div>
                    `;

                    const closeCompBtn = document.getElementById('close-rebirth-modal-btn');
                    if (closeCompBtn) {
                        closeCompBtn.addEventListener('click', () => {
                            showCompletionModal = false;
                            updateDOM();
                        });
                    }
                }
            } else {
                if (completionModalContainer.innerHTML !== '') {
                    completionModalContainer.innerHTML = '';
                }
            }
        }

        // Modal 4: Multiplicity Modal
        const multModalContainer = document.getElementById('multiplicity-modal-container');
        if (multModalContainer) {
            if (showMultiplicityModal) {
                const yieldAmt = getStardustClickYield(state);
                const stardustBal = state.stardust || 0;
                const currentMult = getStardustPointMult(state);

                const existingModal = multModalContainer.querySelector('.multiplicity-modal');
                if (!existingModal) {
                    multModalContainer.innerHTML = `
                        <div class="modal-overlay">
                            <div class="modal-card multiplicity-modal">
                                <div class="modal-header-row">
                                    <div class="multiplicity-header-titles">
                                        <span class="status-badge core-zone-badge">🌌 MULTIPLICITY</span>
                                        <h3 class="multiplicity-main-title">${t('multiplicityModalTitle', 'The Stellar Crucible')}</h3>
                                        <p class="multiplicity-sub">${t('multiplicityModalDesc', 'Tap the celestial core to harvest pristine Stardust and permanently amplify reality.')}</p>
                                    </div>
                                </div>

                                <div class="stardust-hud-card">
                                    <div class="stardust-balance-row">
                                        <span class="stardust-hud-icon">✨</span>
                                        <div class="stardust-hud-vals">
                                            <span class="stardust-hud-label">${t('stardustBalanceLabel', 'Stardust Balance')}</span>
                                            <span id="stardust-hud-val" class="stardust-hud-val">${formatStardust(stardustBal)}</span>
                                        </div>
                                    </div>
                                    <div class="stardust-perks-row">
                                        <div class="stardust-perk-item">
                                            <span class="perk-lbl">${t('currentPointMultLabel', 'Point Multiplier')}:</span>
                                            <span id="stardust-mult-display" class="perk-val highlight-gold">×${currentMult}</span>
                                        </div>
                                        <div class="stardust-perk-item">
                                            <span class="perk-lbl">${t('stardustYieldLabel', 'Yield / Click')}:</span>
                                            <span id="stardust-yield-display" class="perk-val highlight-cyan">${formatStardust(yieldAmt)}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Central Stardust Manual Clicking Core -->
                                <div class="stardust-click-stage">
                                    <button id="stardust-click-orb" class="stardust-click-orb" type="button" aria-label="Harvest Stardust">
                                        <div class="stardust-orb-aura"></div>
                                        <div class="stardust-orb-core">
                                            <span class="stardust-orb-symbol">✨</span>
                                        </div>
                                        <div class="stardust-orb-sparkles"></div>
                                    </button>
                                    <div class="stardust-orb-hint">${t('stardustClickHint', 'Click the Stellar Orb to gather Stardust')}</div>
                                    <div class="stardust-restrictions-banner">
                                        <span>⚠️ ${t('stardustRulesNotice', 'Manual clicks only • Autoclick strictly disabled • Immune to Click Power & Super Crit')}</span>
                                    </div>
                                </div>

                                <!-- Multiplicity Actions Row -->
                                <div class="multiplicity-actions-row">
                                    <button id="open-stardust-upgrades-btn" class="click-btn primary-action-btn stardust-upgrades-trigger-btn">
                                        <span id="open-stardust-btn-text">⭐ ${t('stardustUpgradesBtn', 'Stardust Upgrades')} (×${currentMult})</span>
                                    </button>
                                </div>

                                <div class="modal-actions">
                                    <button id="close-multiplicity-btn" class="click-btn secondary-btn">${t('btnClose')}</button>
                                </div>
                            </div>
                        </div>
                    `;

                    const closeBtn = document.getElementById('close-multiplicity-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            showMultiplicityModal = false;
                            updateDOM();
                        });
                    }

                    const orbBtn = document.getElementById('stardust-click-orb');
                    if (orbBtn) {
                        orbBtn.addEventListener('click', (e) => {
                            const result = handleStardustClick();
                            if (result) {
                                const rect = orbBtn.getBoundingClientRect();
                                const floatEl = document.createElement('span');
                                floatEl.className = 'stardust-floating-text';
                                floatEl.textContent = `+${formatStardust(result.yieldAmount)} ✨`;
                                floatEl.style.left = `${e.clientX - rect.left}px`;
                                floatEl.style.top = `${e.clientY - rect.top}px`;
                                orbBtn.appendChild(floatEl);
                                setTimeout(() => floatEl.remove(), 900);
                                updateDOM();
                            }
                        });
                    }

                    const openUpgradesBtn = document.getElementById('open-stardust-upgrades-btn');
                    if (openUpgradesBtn) {
                        openUpgradesBtn.addEventListener('click', () => {
                            showStardustUpgradesModal = true;
                            updateDOM();
                        });
                    }
                } else {
                    // Update in place
                    const hudVal = document.getElementById('stardust-hud-val');
                    if (hudVal) hudVal.textContent = formatStardust(stardustBal);

                    const multDisp = document.getElementById('stardust-mult-display');
                    if (multDisp) multDisp.textContent = `×${currentMult}`;

                    const yieldDisp = document.getElementById('stardust-yield-display');
                    if (yieldDisp) yieldDisp.textContent = formatStardust(yieldAmt);

                    const openBtnText = document.getElementById('open-stardust-btn-text');
                    if (openBtnText) {
                        openBtnText.textContent = `⭐ ${t('stardustUpgradesBtn', 'Stardust Upgrades')} (×${currentMult})`;
                    }
                }
            } else {
                if (multModalContainer.innerHTML !== '') {
                    multModalContainer.innerHTML = '';
                }
            }
        }

        // Modal 5: Stardust Upgrades Modal
        const stardustUpgModalContainer = document.getElementById('stardust-upgrades-modal-container');
        if (stardustUpgModalContainer) {
            if (showStardustUpgradesModal) {
                const def = STARDUST_UPGRADES_DEFS.point_multiplier;
                const currentLvl = getStardustUpgradeLevel('point_multiplier', state);
                const isMaxed = currentLvl >= def.maxLevel;
                const currentMult = def.multipliers[currentLvl];
                const nextMult = isMaxed ? currentMult : def.multipliers[currentLvl + 1];
                const cost = getStardustUpgradeCost('point_multiplier', state);
                const canAfford = !isMaxed && (state.stardust || 0) >= cost;

                const existingModal = stardustUpgModalContainer.querySelector('.stardust-upgrades-modal');
                if (!existingModal) {
                    stardustUpgModalContainer.innerHTML = `
                        <div class="modal-overlay">
                            <div class="modal-card stardust-upgrades-modal">
                                <div class="modal-header-row">
                                    <h3>⭐ ${t('stardustUpgradesTitle', 'Stardust Upgrades')}</h3>
                                </div>
                                <p class="modal-message">${t('stardustUpgradesSubtitle', 'Infuse concentrated Stardust to expand core Point production across all clicks and generators.')}</p>

                                <div class="stardust-upg-hud">
                                    <span class="stardust-hud-label">${t('availableStardustLabel', 'Available Stardust')}:</span>
                                    <span id="stardust-upg-avail-val" class="stardust-hud-val highlight-gold">${formatStardust(state.stardust || 0)}</span>
                                </div>

                                <div class="stardust-upgrades-list">
                                    <div class="stardust-upgrade-card ${isMaxed ? 'maxed' : (canAfford ? 'affordable' : 'locked')}">
                                        <div class="stardust-upg-card-header">
                                            <div class="stardust-upg-title-group">
                                                <h4 class="stardust-upg-name">✦ ${t('pointMultiplierName', 'Point Multiplier')}</h4>
                                                <span id="stardust-upg-level-badge" class="stardust-upg-level-badge ${isMaxed ? 'complete' : ''}">${currentLvl} / ${def.maxLevel}</span>
                                            </div>
                                            <span class="stardust-upg-tag">×2 per Level</span>
                                        </div>
                                        <p class="stardust-upg-desc">${t('pointMultiplierDesc', 'Doubles all Point generation from manual clicks and Point Generators. (Level 5 / ×32 required for Rebirth 5 Mastery).')}</p>
                                        
                                        <div class="stardust-upg-stats-preview">
                                            <div class="upg-stat-col">
                                                <span class="lbl">${t('currentBonusLabel', 'Current Bonus')}:</span>
                                                <span id="stardust-upg-curr-bonus" class="val highlight-gold">×${currentMult}</span>
                                            </div>
                                            <div class="upg-stat-arrow">➔</div>
                                            <div class="upg-stat-col">
                                                <span class="lbl">${t('nextBonusLabel', 'Next Bonus')}:</span>
                                                <span id="stardust-upg-next-bonus" class="val highlight-gain">${isMaxed ? t('btnMaxed') : `×${nextMult}`}</span>
                                            </div>
                                        </div>

                                        <div class="stardust-upg-footer">
                                            <div class="stardust-cost-box">
                                                <span class="cost-lbl">${t('costLabel')}:</span>
                                                <span id="stardust-upg-cost-val" class="cost-val highlight-cyan">${isMaxed ? t('btnMaxed') : `${cost} Stardust`}</span>
                                            </div>
                                            <button id="buy-stardust-mult-btn" class="click-btn ${isMaxed ? 'secondary-btn' : (canAfford ? 'primary-action-btn' : 'secondary-btn')}" ${isMaxed || !canAfford ? 'disabled' : ''}>
                                                ${isMaxed ? t('btnMaxLevel') : (canAfford ? t('btnUpgrade') : t('btnLocked'))}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="modal-actions">
                                    <button id="close-stardust-upgrades-btn" class="click-btn secondary-btn">${t('btnClose')}</button>
                                </div>
                            </div>
                        </div>
                    `;

                    const closeBtn = document.getElementById('close-stardust-upgrades-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', () => {
                            showStardustUpgradesModal = false;
                            updateDOM();
                        });
                    }

                    const buyBtn = document.getElementById('buy-stardust-mult-btn');
                    if (buyBtn) {
                        buyBtn.addEventListener('click', () => {
                            const success = buyStardustUpgrade('point_multiplier');
                            if (success) {
                                updateDOM();
                            }
                        });
                    }
                } else {
                    // Update in place
                    const availVal = document.getElementById('stardust-upg-avail-val');
                    if (availVal) availVal.textContent = formatStardust(state.stardust || 0);

                    const lvlBadge = document.getElementById('stardust-upg-level-badge');
                    if (lvlBadge) {
                        lvlBadge.textContent = `${currentLvl} / ${def.maxLevel}`;
                        lvlBadge.className = `stardust-upg-level-badge ${isMaxed ? 'complete' : ''}`;
                    }

                    const currBonus = document.getElementById('stardust-upg-curr-bonus');
                    if (currBonus) currBonus.textContent = `×${currentMult}`;

                    const nextBonus = document.getElementById('stardust-upg-next-bonus');
                    if (nextBonus) nextBonus.textContent = isMaxed ? t('btnMaxed') : `×${nextMult}`;

                    const costVal = document.getElementById('stardust-upg-cost-val');
                    if (costVal) costVal.textContent = isMaxed ? t('btnMaxed') : `${cost} Stardust`;

                    const buyBtn = document.getElementById('buy-stardust-mult-btn');
                    if (buyBtn) {
                        buyBtn.className = `click-btn ${isMaxed ? 'secondary-btn' : (canAfford ? 'primary-action-btn' : 'secondary-btn')}`;
                        buyBtn.disabled = isMaxed || !canAfford;
                        buyBtn.textContent = isMaxed ? t('btnMaxLevel') : (canAfford ? t('btnUpgrade') : t('btnLocked'));
                    }
                }
            } else {
                if (stardustUpgModalContainer.innerHTML !== '') {
                    stardustUpgModalContainer.innerHTML = '';
                }
            }
        }
    };

    buildStructure();
    updateDOM();

    // PPS Interval Calculator (every 1s)
    if (ppsIntervalId) clearInterval(ppsIntervalId);
    lastCurrency = stateManager.getState().currency;
    lastTimestamp = Date.now();

    ppsIntervalId = setInterval(() => {
        const now = Date.now();
        const currentState = stateManager.getState();
        const currentCurrency = currentState.currency;
        const currentRebirth = currentState.rebirthCount || 0;
        const timeDiff = (now - lastTimestamp) / 1000;

        if (timeDiff > 0) {
            const gained = Math.max(0, currentCurrency - lastCurrency);
            pointsPerSec = gained / timeDiff;

            const ppsEl = document.getElementById('currency-per-sec');
            if (ppsEl) {
                if (currentRebirth < 2) {
                    ppsEl.textContent = t('pointGenLocked');
                    ppsEl.className = 'currency-per-sec gen-locked-tag';
                } else {
                    ppsEl.textContent = `(+${formatNumber(pointsPerSec)}/s)`;
                    ppsEl.className = 'currency-per-sec';
                }
            }
        }

        lastCurrency = currentCurrency;
        lastTimestamp = now;
    }, 1000);

    // Subscribe to state updates with flicker-free in-place DOM updates
    stateManager.subscribe(() => {
        updateDOM();
    });

    // Delegated click listener on container to ensure click & autoclick toggle clicks are always captured
    if (!container.hasAttribute('data-autoclick-listener')) {
        container.setAttribute('data-autoclick-listener', 'true');
        container.addEventListener('click', (e) => {
            const clickBtn = e.target.closest('#click-btn');
            if (clickBtn) {
                e.preventDefault();
                handleClick(e);
                return;
            }
            const btn = e.target.closest('#autoclick-toggle-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                toggleAutoclick();
                return;
            }
            const towerBtn = e.target.closest('#open-tower-btn');
            if (towerBtn) {
                e.preventDefault();
                openTowerModal();
                return;
            }
            const multBtn = e.target.closest('#open-multiplicity-btn');
            if (multBtn) {
                e.preventDefault();
                showMultiplicityModal = true;
                updateDOM();
                return;
            }
        });
    }

    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            lastAutoclickEnabled = null;
            buildStructure();
            updateDOM();
        });
    }

    // Immediately trigger initial synchronous render
    updateDOM();
}
