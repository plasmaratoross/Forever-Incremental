/**
 * ============================================================================
 * COSMIC GALLERY UI COMPONENT
 * ============================================================================
 * Location: /js/ui/galleryUI.js
 * Purpose: Renders the dedicated Gallery page displaying Cosmic Occasions
 *          occurrence chances, active modifiers, and chance details modal.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { COSMIC_EVENTS_DEFS, getEventCooldownMs } from '../systems/cosmicEvents.js';
import { getCosmicEventChanceDetails, formatPercentage, formatRatio } from '../systems/cosmicEventChances.js';
import { t } from '../i18n/i18n.js';

/**
 * Render Gallery UI Panel
 * @param {string} containerId - DOM container ID
 */
export function renderGalleryUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let selectedEventId = null;
    let lastRenderedRebirth = -1;

    /**
     * Render the Chance Details Modal HTML
     */
    const renderModalHTML = (details) => {
        if (!details) return '';
        const def = details.eventDef;
        const eName = def.name;

        let modifierRows = '';
        details.modifiers.forEach(mod => {
            const statusClass = mod.applied ? 'mod-active' : 'mod-inactive';
            const statusText = mod.applied ? `✓ ${t('statusUnlocked') || 'ACTIVE'}` : `🔒 ${t('statusLocked') || 'INACTIVE'}`;

            modifierRows += `
                <div class="modifier-item-card ${statusClass}">
                    <div class="mod-header-row">
                        <span class="mod-name">${mod.name}</span>
                        <span class="mod-status-tag ${statusClass}">${statusText}</span>
                    </div>
                    <div class="mod-detail-row">
                        <span class="mod-value-label">${t('modifierColValue') || 'Effect'}: <strong class="mod-value">${mod.valueText}</strong></span>
                    </div>
                    <p class="mod-description">${mod.description}</p>
                </div>
            `;
        });

        return `
            <div class="game-modal-overlay chance-modal-overlay">
                <div class="game-modal chance-modal">
                    <div class="modal-header">
                        <div class="modal-title-group">
                            <h2 class="modal-title">🌌 ${eName}</h2>
                            <span class="status-badge rarity-tag">${def.rarity.toUpperCase()}</span>
                        </div>
                        <button id="close-chance-modal-btn" class="modal-close-btn">&times;</button>
                    </div>

                    <div class="modal-body">
                        <!-- Overview Summary Stat Cards -->
                        <div class="chance-stats-grid">
                            <div class="chance-stat-card">
                                <span class="chance-stat-label">${t('baseChanceLabel') || 'Base Chance:'}</span>
                                <span class="chance-stat-value">${formatPercentage(details.baseChance)}</span>
                            </div>
                            <div class="chance-stat-card">
                                <span class="chance-stat-label">${t('rollStageChanceLabel') || 'Stage Roll Chance:'}</span>
                                <span class="chance-stat-value text-gold">${details.stageChanceText || formatPercentage(details.stageChance)}</span>
                            </div>
                            <div class="chance-stat-card highlight">
                                <span class="chance-stat-label">${t('netChanceLabel') || 'Net Cycle Chance:'}</span>
                                <span class="chance-stat-value text-green">${details.chanceText}</span>
                                <span class="chance-stat-sub">${details.ratioText}</span>
                            </div>
                            <div class="chance-stat-card">
                                <span class="chance-stat-label">${t('cooldownIntervalLabel') || 'Anomaly Check Cooldown:'}</span>
                                <span class="chance-stat-value">${details.cooldownMs / 1000}s</span>
                            </div>
                        </div>

                        <!-- Active Modifiers Section -->
                        <div class="modifiers-section">
                            <h3 class="modifiers-title">⚡ ${t('activeModifiersTitle') || 'ACTIVE CHANCE MODIFIERS'}</h3>
                            <div class="modifiers-list">
                                ${modifierRows}
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button id="close-chance-modal-footer-btn" class="click-btn primary-action-btn">
                            ${t('btnClose') || 'CLOSE'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * In-place DOM update (flicker-free)
     */
    const updateDOM = () => {
        const state = stateManager.getState();
        const rebirthCount = state.rebirthCount || 0;

        if (lastRenderedRebirth !== rebirthCount) {
            render();
            return;
        }

        const isUnlocked = rebirthCount >= 3 || !!state.cosmicEventsUnlocked;
        const cooldownMs = getEventCooldownMs(state);

        const elRebirth = container.querySelector('#gallery-hud-rebirth');
        if (elRebirth) elRebirth.textContent = `R${rebirthCount}`;

        const elCooldown = container.querySelector('#gallery-hud-cooldown');
        if (elCooldown) elCooldown.textContent = `${cooldownMs / 1000}s`;

        const elStatus = container.querySelector('#gallery-hud-status');
        if (elStatus) {
            elStatus.className = `hud-value ${isUnlocked ? 'complete' : 'muted'}`;
            elStatus.textContent = isUnlocked ? `✨ ${t('statusUnlocked') || 'UNLOCKED'}` : `🔒 ${t('statusLocked') || 'LOCKED'}`;
        }

        // Update cards chance text in-place
        COSMIC_EVENTS_DEFS.forEach(def => {
            const cardBtn = container.querySelector(`.inspect-chance-btn[data-event-id="${def.id}"]`);
            if (cardBtn) {
                const details = getCosmicEventChanceDetails(def, state);
                const pctEl = cardBtn.querySelector('.chance-pct');
                if (pctEl) pctEl.textContent = details.chanceText;
                const ratioEl = cardBtn.querySelector('.chance-ratio');
                if (ratioEl) ratioEl.textContent = details.ratioText;
            }
        });
    };

    /**
     * Render main content structure
     */
    const render = () => {
        const state = stateManager.getState();
        const rebirthCount = state.rebirthCount || 0;
        lastRenderedRebirth = rebirthCount;
        const isUnlocked = rebirthCount >= 3 || !!state.cosmicEventsUnlocked;
        const cooldownMs = getEventCooldownMs(state);

        let cardsHTML = '';
        COSMIC_EVENTS_DEFS.forEach(def => {
            const details = getCosmicEventChanceDetails(def, state);
            const eName = def.name;

            let chancePillHTML = '';
            if (!isUnlocked) {
                chancePillHTML = `
                    <div class="chance-pill-locked">
                        <span class="chance-val">N/A</span>
                        <span class="chance-sub">${t('lockedUntilR3Notice') || 'Unlocks at Rebirth 3'}</span>
                    </div>
                `;
            } else if (details.isR4Locked) {
                chancePillHTML = `
                    <div class="chance-pill-locked">
                        <span class="chance-val">N/A</span>
                        <span class="chance-sub">Rebirth 4 Required</span>
                    </div>
                `;
            } else {
                chancePillHTML = `
                    <button class="chance-pill-btn inspect-chance-btn" data-event-id="${def.id}">
                        <div class="chance-pill-main">
                            <span class="chance-pct">${details.chanceText}</span>
                            <span class="chance-ratio">${details.ratioText}</span>
                        </div>
                        <span class="chance-inspect-tag">🔍 ${t('viewDetailsBtn') || 'View Details'}</span>
                    </button>
                `;
            }

            cardsHTML += `
                <div class="cosmic-chance-card ${!isUnlocked || details.isR4Locked ? 'locked' : ''}">
                    <div class="chance-card-header">
                        <div class="chance-card-title-group">
                            <h3 class="chance-event-name">${eName}</h3>
                            <span class="status-badge rarity-tag">${def.rarity.toUpperCase()}</span>
                        </div>
                    </div>

                    <p class="chance-event-desc">${def.description}</p>

                    <!-- Buff Multipliers Row -->
                    <div class="chance-buff-row">
                        <span class="buff-tag">⚡ Clicks: +${Math.round((def.clickMult - 1) * 100)}%</span>
                        <span class="buff-tag">⚙ Points: +${Math.round((def.pointGenMult - 1) * 100)}%</span>
                        <span class="buff-tag">⏩ Speed: +${Math.round((def.gameSpeedMult - 1) * 100)}%</span>
                    </div>

                    <!-- Chance Display & Details Trigger -->
                    <div class="chance-card-footer">
                        <div class="chance-display-wrapper">
                            <span class="chance-label-text">${t('chanceLabel') || 'Occurrence Chance:'}</span>
                            ${chancePillHTML}
                        </div>
                    </div>
                </div>
            `;
        });

        const selectedDetails = selectedEventId ? getCosmicEventChanceDetails(selectedEventId, state) : null;
        const modalHTML = selectedDetails ? renderModalHTML(selectedDetails) : '';

        container.innerHTML = `
            <div class="game-card gallery-card">
                <div class="badges-title-group">
                    <h2>${t('galleryTitle') || '🖼️ Cosmic Gallery'}</h2>
                    <p class="hero-tagline">${t('galleryTagline') || 'Visual codex and probability telemetry engine for all cosmic anomalies.'}</p>
                </div>

                <!-- Gallery HUD Stats -->
                <div class="upgrades-hud gallery-hud">
                    <div class="hud-stat">
                        <span class="hud-label">${t('statCurrentRebirth') || 'Current Rebirth:'}</span>
                        <span id="gallery-hud-rebirth" class="hud-value power-value">R${rebirthCount}</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">${t('cooldownIntervalLabel') || 'Anomaly Check Cooldown:'}</span>
                        <span id="gallery-hud-cooldown" class="hud-value currency-value">${cooldownMs / 1000}s</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">Cosmic Status:</span>
                        <span id="gallery-hud-status" class="hud-value ${isUnlocked ? 'complete' : 'muted'}">
                            ${isUnlocked ? `✨ ${t('statusUnlocked') || 'UNLOCKED'}` : `🔒 ${t('statusLocked') || 'LOCKED'}`}
                        </span>
                    </div>
                </div>

                <!-- Cosmic Occasions Section Header -->
                <div class="upgrades-section-header cosmic-header">
                    <h3>🌌 ${t('cosmicOccasionChanceSection') || 'COSMIC OCCASIONS CHANCE'}</h3>
                </div>
                <p class="section-notice-text">${t('clickToInspectNotice') || '💡 Click any chance display to inspect modifier breakdown.'}</p>

                <!-- Cosmic Occasion Chance Cards Grid -->
                <div class="cosmic-chance-grid">
                    ${cardsHTML}
                </div>
            </div>

            <!-- Modal Overlay Container -->
            <div id="chance-modal-container">
                ${modalHTML}
            </div>
        `;

        // Bind events
        container.querySelectorAll('.inspect-chance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetBtn = e.target.closest('.inspect-chance-btn');
                if (targetBtn && targetBtn.dataset.eventId) {
                    selectedEventId = targetBtn.dataset.eventId;
                    render();
                }
            });
        });

        const closeBtn = container.querySelector('#close-chance-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                selectedEventId = null;
                render();
            });
        }

        const closeFooterBtn = container.querySelector('#close-chance-modal-footer-btn');
        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', () => {
                selectedEventId = null;
                render();
            });
        }

        const overlay = container.querySelector('.chance-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    selectedEventId = null;
                    render();
                }
            });
        }
    };

    render();

    // Flicker-free in-place DOM updates on state notification
    stateManager.subscribe(() => {
        updateDOM();
    });

    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            render();
        });
    }
}
