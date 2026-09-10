/**
 * ============================================================================
 * ACHIEVEMENTS UI DASHBOARD & LORE OVERLAY
 * ============================================================================
 * Location: /js/ui/achievementsUI.js
 * Purpose: Renders the Achievements dashboard, category cards with tier frame
 *          evolutions (Basic, Bronze, Gold, Diamond, Emerald, Ruby, Sapphire),
 *          progress bars, category bonuses, and cosmic lore milestone dialogs.
 *          Implements flicker-free in-place DOM node updates.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import {
    ACHIEVEMENT_DEFS,
    MAX_ACHIEVEMENT_LEVEL,
    BONUS_PER_LEVEL,
    getAchievementCurrentValue,
    getAchievementLevel,
    getAchievementTier,
    getAchievementBonus,
    getTotalAchievementBonus,
    checkPendingLoreMilestones,
    markLoreMilestoneViewed
} from '../systems/achievements.js';
import { formatNumber } from '../utils/format.js';
import { t } from '../i18n/i18n.js';

/**
 * Format playtime duration in human-readable time strings
 */
function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0s';
    const s = Math.floor(seconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ${m % 60}m`;
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
}

/**
 * Render Achievements Page UI
 * @param {string} containerId - DOM element ID
 */
export function renderAchievementsUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let activeLoreModal = null;
    let isStructureBuilt = false;

    /**
     * Build primary DOM structure once
     */
    const buildStructure = () => {
        container.innerHTML = `
            <div class="achievements-container">
                <!-- Navigation & HUD Header Card -->
                <div class="game-card achievements-hud-card">
                    <div class="achievements-header-row">
                        <a href="game.html" class="click-btn secondary-btn back-game-btn">
                            <span>◀ ${t('navPlay')}</span>
                        </a>
                        <h2 class="achievements-main-title">${t('achievementsTitle')}</h2>
                        <div class="total-bonus-chip">
                            <span class="bonus-chip-label">${t('permanentBonusesLabel')}</span>
                            <span id="ach-total-bonus-val" class="bonus-chip-val">+0.0%</span>
                        </div>
                    </div>
                    <p class="achievements-subtitle">
                        ${t('achievementsTagline')}
                    </p>
                </div>

                <!-- 4 Achievement Category Cards List -->
                <div class="achievements-grid">
                    ${ACHIEVEMENT_DEFS.map(def => {
                        const catName = t(`ach_cat_${def.id}_name`, def.name);
                        const catDesc = t(`ach_cat_${def.id}_desc`, def.description);
                        return `
                        <div id="ach-card-${def.id}" class="achievement-card tier-frame-basic">
                            <div class="achievement-card-header">
                                <div class="achievement-icon-wrapper">
                                    <span class="achievement-icon">${def.icon}</span>
                                </div>
                                <div class="achievement-title-group">
                                    <div class="achievement-title-row">
                                        <h3 class="achievement-name">${catName}</h3>
                                        <span id="ach-tier-badge-${def.id}" class="tier-badge tier-badge-basic">BASIC</span>
                                    </div>
                                    <p class="achievement-desc">${catDesc}</p>
                                </div>
                            </div>

                            <div class="achievement-stats-body">
                                <div class="stat-meta-row">
                                    <span id="ach-level-text-${def.id}" class="level-indicator">${t('levelLabel')} 0 / ${MAX_ACHIEVEMENT_LEVEL}</span>
                                    <span id="ach-bonus-text-${def.id}" class="bonus-indicator">+0.0% ${def.bonusType}</span>
                                </div>

                                <div class="achievement-progress-bar">
                                    <div id="ach-progress-fill-${def.id}" class="achievement-progress-fill tier-badge-basic" style="width: 0%"></div>
                                </div>

                                <div class="progress-details-row">
                                    <span id="ach-progress-val-${def.id}" class="progress-val-text">0 / 0</span>
                                    <span id="ach-next-boost-${def.id}" class="next-boost-text">Next: +${BONUS_PER_LEVEL}%</span>
                                </div>
                            </div>
                        </div>
                    `;}).join('')}
                </div>

                <!-- Lore Modal Placeholder Container -->
                <div id="ach-lore-modal-container"></div>
            </div>
        `;
        isStructureBuilt = true;
    };

    /**
     * Selective flicker-free DOM updates
     */
    const updateDOM = () => {
        if (!isStructureBuilt) buildStructure();

        const state = stateManager.getState();
        const totalBonus = getTotalAchievementBonus(state).toFixed(1);

        const totalBonusEl = document.getElementById('ach-total-bonus-val');
        if (totalBonusEl) {
            totalBonusEl.textContent = `+${totalBonus}%`;
        }

        ACHIEVEMENT_DEFS.forEach(def => {
            const cardEl = document.getElementById(`ach-card-${def.id}`);
            const tierBadgeEl = document.getElementById(`ach-tier-badge-${def.id}`);
            const levelTextEl = document.getElementById(`ach-level-text-${def.id}`);
            const bonusTextEl = document.getElementById(`ach-bonus-text-${def.id}`);
            const progressFillEl = document.getElementById(`ach-progress-fill-${def.id}`);
            const progressValEl = document.getElementById(`ach-progress-val-${def.id}`);
            const nextBoostEl = document.getElementById(`ach-next-boost-${def.id}`);

            if (!cardEl) return;

            const level = getAchievementLevel(state, def.id);
            const tier = getAchievementTier(level);
            const currentValue = getAchievementCurrentValue(state, def.id);
            const currentBonus = getAchievementBonus(state, def.id).toFixed(1);
            const isMax = level >= MAX_ACHIEVEMENT_LEVEL;

            let currentThreshold = 0;
            let nextThreshold = def.thresholds[Math.min(level, MAX_ACHIEVEMENT_LEVEL - 1)];
            let progressPercent = 100;

            if (!isMax) {
                currentThreshold = level > 0 ? def.thresholds[level - 1] : 0;
                const range = nextThreshold - currentThreshold;
                const progress = currentValue - currentThreshold;
                progressPercent = Math.min(100, Math.max(0, (progress / range) * 100));
            }

            const formatVal = (v) => {
                if (def.id === 'timekeeper') return formatTime(v);
                return formatNumber(v);
            };

            // Update card frame class smoothly
            cardEl.className = `achievement-card ${tier.frameClass}`;

            if (tierBadgeEl) {
                tierBadgeEl.className = `tier-badge ${tier.badgeClass}`;
                tierBadgeEl.textContent = t(`tier_${tier.name.toLowerCase()}`, tier.name).toUpperCase();
            }

            if (levelTextEl) {
                levelTextEl.textContent = `${t('levelLabel')} ${level} / ${MAX_ACHIEVEMENT_LEVEL}`;
            }

            if (bonusTextEl) {
                bonusTextEl.textContent = `+${currentBonus}% ${def.bonusType}`;
            }

            if (progressFillEl) {
                progressFillEl.className = `achievement-progress-fill ${tier.badgeClass}`;
                progressFillEl.style.width = `${progressPercent}%`;
            }

            if (progressValEl) {
                progressValEl.textContent = `${formatVal(currentValue)} / ${isMax ? 'MAX' : formatVal(nextThreshold)}`;
            }

            if (nextBoostEl) {
                nextBoostEl.textContent = isMax ? t('btnMaxed') : `Next: +${BONUS_PER_LEVEL}%`;
            }
        });

        // Handle Lore Modal overlay updates in-place (flicker-free)
        const loreModalContainer = document.getElementById('ach-lore-modal-container');
        if (!activeLoreModal) {
            activeLoreModal = checkPendingLoreMilestones(state);
        }

        if (loreModalContainer) {
            const currentLoreKey = activeLoreModal ? activeLoreModal.loreKey : null;
            const existingKey = loreModalContainer.dataset.renderedLoreKey || null;

            if (currentLoreKey !== existingKey) {
                loreModalContainer.dataset.renderedLoreKey = currentLoreKey || '';
                if (activeLoreModal) {
                    loreModalContainer.innerHTML = `
                        <div class="modal-overlay lore-modal-overlay">
                            <div class="modal-card lore-modal-card">
                                <div class="lore-modal-header">
                                    <span class="lore-spark">✨</span>
                                    <h3 class="lore-dialogue-title">${activeLoreModal.title}</h3>
                                </div>
                                <div class="lore-text-box">
                                    <p class="lore-dialogue-text">"${activeLoreModal.text}"</p>
                                </div>
                                <div class="lore-modal-footer">
                                    <span class="lore-milestone-tag">${activeLoreModal.categoryName} — Level ${activeLoreModal.level}</span>
                                    <button id="lore-continue-btn" class="click-btn primary-action-btn lore-continue-btn">
                                        [ CONTINUE ]
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

                    const continueBtn = document.getElementById('lore-continue-btn');
                    if (continueBtn) {
                        continueBtn.addEventListener('click', () => {
                            if (activeLoreModal) {
                                markLoreMilestoneViewed(activeLoreModal.loreKey);
                                activeLoreModal = null;
                                loreModalContainer.dataset.renderedLoreKey = '';
                                loreModalContainer.innerHTML = '';
                                updateDOM();
                            }
                        });
                    }
                } else {
                    loreModalContainer.innerHTML = '';
                }
            }
        }
    };

    buildStructure();
    updateDOM();

    // Subscribe to state updates for flicker-free reactive DOM updates
    stateManager.subscribe(() => {
        updateDOM();
    });

    // Language change listener
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            buildStructure();
            updateDOM();
        });
    }
}
