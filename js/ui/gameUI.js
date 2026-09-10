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
    getRebirthDifficultyMultiplier 
} from '../systems/rebirth.js';
import { saveGame } from '../save/save.js';
import { audioManager } from '../audio/audioManager.js';
import { showNotification } from './notifications.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';
import { cosmicEventRuntime } from '../systems/cosmicEvents.js';

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
    let isStructureBuilt = false;

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
                <!-- Cosmic Events Banner Container -->
                <div id="cosmic-banner-container"></div>

                <!-- Primary Resource & Action Dashboard Card -->
                <div class="game-card currency-display">
                    <h2>${t('pointsTitle')}</h2>
                    <div class="currency-wrapper">
                        <div id="currency-amount" class="currency-amount">${formatNumber(state.currency)}</div>
                        <div id="currency-per-sec" class="currency-per-sec ${rebirthCount < 2 ? 'gen-locked-tag' : ''}">
                            ${rebirthCount < 2 ? t('pointGenLocked') : `(+${formatNumber(pointsPerSec)}/s)`}
                        </div>
                    </div>
                    <div class="click-card-actions">
                        <button id="click-btn" class="click-btn">${t('clickBtn')}</button>

                        <!-- Autoclick Toggle Button (Unlocked at Rebirth 3) -->
                        ${isAutoclickUnlocked ? `
                            <button id="autoclick-toggle-btn" class="click-btn ${state.autoclickEnabled ? 'autoclick-on' : 'secondary-btn'} autoclick-btn">
                                <span>🤖 ${t('autoclickLabel')} ${state.autoclickEnabled ? t('autoclickOn') : t('autoclickOff')}</span>
                            </button>
                        ` : ''}
                        
                        <!-- Clicking Upgrades Navigation Button -->
                        <a href="upgrades.html" class="click-btn secondary-btn upgrade-nav-btn">
                            <span id="upgrade-nav-text">⚡ ${t('clickingUpgradesBtn')} (${purchasedClickCount}/${totalClickCount})</span>
                        </a>

                        <!-- Point Generators Navigation Button (Unlocked at Rebirth 2) -->
                        <div id="generator-nav-btn-container">
                            ${rebirthCount >= 2 ? `
                                <a href="generators.html" class="click-btn primary-action-btn generator-nav-btn">
                                    <span>⚙️ ${t('btnGenerators')}</span>
                                </a>
                            ` : `
                                <button class="click-btn secondary-btn" disabled title="${t('generatorsLockedNotice')}">
                                    <span>🔒 ${t('btnGenerators')}</span>
                                </button>
                            `}
                        </div>

                        <!-- Single Rebirth Button: Opens Rebirth & Ascended Content Context -->
                        <button id="open-rebirth-portal-btn" class="click-btn ${isMasteryComplete ? 'primary-action-btn' : 'secondary-btn'} rebirth-context-trigger-btn">
                            <span id="rebirth-nav-text">🌟 ${t('rebirthBtn')} ${isMasteryComplete ? '✨' : ''}</span>
                        </button>

                        <!-- Achievement Button: Navigates to dedicated Achievements page -->
                        <a href="achievements.html" class="click-btn secondary-btn achievement-nav-btn">
                            <span>🏆 ${t('achievementBtn')}</span>
                        </a>

                        <!-- Badges Button: Navigates to dedicated Badges gallery page -->
                        <a href="badges.html" class="click-btn secondary-btn badge-nav-btn">
                            <span>🏅 ${t('badgesBtn')}</span>
                        </a>

                        <!-- Gallery Button: Navigates to dedicated Gallery page -->
                        <a href="gallery.html" class="click-btn secondary-btn gallery-nav-btn">
                            <span>🖼️ ${t('galleryBtn')}</span>
                        </a>

                        <!-- Statistics Button: Navigates to dedicated Statistics page -->
                        <a href="stats.html" class="click-btn secondary-btn stats-nav-btn">
                            <span>📊 ${t('statsBtn')}</span>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Modals Overlay Containers -->
            <div id="rebirth-portal-modal-container"></div>
            <div id="rebirth-confirm-modal-container"></div>
            <div id="rebirth-completion-modal-container"></div>
        `;

        // Bind permanent event listeners once
        const clickBtn = document.getElementById('click-btn');
        if (clickBtn) {
            clickBtn.addEventListener('click', handleClick);
        }

        const autoclickBtn = document.getElementById('autoclick-toggle-btn');
        if (autoclickBtn) {
            autoclickBtn.addEventListener('click', () => {
                toggleAutoclick();
                updateDOM();
            });
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
            masteryCountText = `${purchasedClickCount}/20 Upgrades | ${purchasedGenLevels}/125 Gens | ${distinctEventsCount}/4 Events`;
            const cRatio = Math.min(1, purchasedClickCount / 20);
            const gRatio = Math.min(1, purchasedGenLevels / 125);
            const eRatio = Math.min(1, distinctEventsCount / 4);
            masteryPercent = ((cRatio + gRatio + eRatio) / 3) * 100;
        } else {
            masteryCountText = `${purchasedClickCount} / ${totalClickCount}`;
            masteryPercent = (purchasedClickCount / totalClickCount) * 100;
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

        const upgradeNavText = document.getElementById('upgrade-nav-text');
        if (upgradeNavText) upgradeNavText.textContent = `⚡ ${t('clickingUpgradesBtn')} (${purchasedClickCount}/${totalClickCount})`;

        const rebirthNavText = document.getElementById('rebirth-nav-text');
        if (rebirthNavText) rebirthNavText.textContent = `🌟 ${t('rebirthBtn')} ${isMasteryComplete ? '✨' : ''}`;

        const openRebirthBtn = document.getElementById('open-rebirth-portal-btn');
        if (openRebirthBtn) {
            openRebirthBtn.className = `click-btn ${isMasteryComplete ? 'primary-action-btn' : 'secondary-btn'} rebirth-context-trigger-btn`;
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
            return t('unlocksValR4');
        };

        const getReqNoteText = () => {
            if (rebirthCount === 0) return t('masteryReqR1');
            if (rebirthCount === 1) return t('masteryReqR2');
            if (rebirthCount === 2) return t('masteryReqR3');
            return t('masteryReqR4');
        };

        const getRebirthBtnLabel = () => {
            if (rebirthCount === 0) return t('rebirthAvailableBtn');
            if (rebirthCount === 1) return t('rebirth2AvailableBtn');
            if (rebirthCount === 2) return t('rebirth3AvailableBtn');
            if (rebirthCount === 3) return t('rebirth4AvailableBtn');
            return `REBIRTH ${rebirthCount + 1}`;
        };

        const getGainUnlockText = () => {
            if (rebirthCount === 0) return t('gainUnlockR1');
            if (rebirthCount === 1) return t('gainUnlockR2');
            if (rebirthCount === 2) return t('gainUnlockR3');
            return t('gainUnlockR4');
        };

        const getCompletionDescText = () => {
            if (rebirthCount === 1) return t('rebirthModalDescR1');
            if (rebirthCount === 2) return t('rebirthModalDescR2');
            if (rebirthCount === 3) return t('rebirthModalDescR3');
            return t('rebirthModalDescR4');
        };

        const isRebirth4Unlocked = rebirthCount >= 4;

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

    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            buildStructure();
            updateDOM();
        });
    }
}
