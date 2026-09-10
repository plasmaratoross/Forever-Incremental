/**
 * ============================================================================
 * COSMIC BADGES UI COMPONENT
 * ============================================================================
 * Location: /js/ui/badgesUI.js
 * Purpose: Renders the Badges gallery page displaying unlocked and locked
 *          cosmic anomaly badges, custom artwork, lore lines, and animated aura glints.
 *          Implements flicker-free in-place DOM updates to preserve smooth CSS aura glints.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { COSMIC_BADGES_DEFS, isBadgeUnlocked, getUnlockedBadgesCount } from '../systems/badges.js';
import { t } from '../i18n/i18n.js';

/**
 * Render Badges UI Panel
 * @param {string} containerId - DOM container ID
 */
export function renderBadgesUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let isStructureBuilt = false;
    const badgeUnlockStateCache = {};

    /**
     * Build the full DOM structure once.
     * All dynamic nodes have stable IDs for flicker-free in-place updates.
     */
    const buildStructure = (state) => {
        const totalBadges = COSMIC_BADGES_DEFS.length;
        const unlockedCount = getUnlockedBadgesCount(state);

        const buildBadgeCardHTML = (def) => {
            const unlocked = isBadgeUnlocked(def.id, state);
            badgeUnlockStateCache[def.id] = unlocked;

            if (unlocked) {
                return `
                    <div id="badge-card-${def.id}" class="badge-card unlocked" style="--aura-color: ${def.auraColor};">
                        <div class="badge-icon-container">
                            <div class="badge-icon-frame aura-glint" style="border-color: ${def.auraColor}; box-shadow: 0 0 20px ${def.auraColor}66, inset 0 0 15px ${def.auraColor}44;">
                                <img src="${def.imagePath}" alt="${def.name}" class="badge-img">
                            </div>
                        </div>
                        <div class="badge-info">
                            <div class="badge-header-row">
                                <h3 class="badge-name" style="color: ${def.auraColor}; text-shadow: 0 0 10px ${def.auraColor}88;">${def.name}</h3>
                                <span class="status-badge rarity-tag" style="border-color: ${def.auraColor}; color: ${def.auraColor}; background: ${def.auraColor}22;">
                                    ${def.rarity.toUpperCase()}
                                </span>
                            </div>
                            <span class="badge-subtitle">${def.subtitle}</span>
                            <p class="badge-lore">"${def.lore}"</p>
                            <div class="badge-footer">
                                <span class="badge-status-tag unlocked-tag">✨ ${t('badgeUnlockedStatus') || 'UNLOCKED'}</span>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div id="badge-card-${def.id}" class="badge-card locked">
                        <div class="badge-icon-container">
                            <div class="badge-icon-frame locked-frame">
                                <span class="badge-lock-icon">🔒</span>
                            </div>
                        </div>
                        <div class="badge-info">
                            <div class="badge-header-row">
                                <h3 class="badge-name muted">${def.name}</h3>
                                <span class="status-badge rarity-tag locked-tag">
                                    LOCKED
                                </span>
                            </div>
                            <span class="badge-subtitle muted">${def.subtitle}</span>
                            <p class="badge-lore locked-lore">"???"</p>
                            <div class="badge-footer">
                                <span class="badge-status-tag locked-notice-tag">🔒 ${t('badgeLockedStatus') || 'ENCOUNTER TO UNLOCK'}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        };

        let cosmicBadgesHTML = '';
        COSMIC_BADGES_DEFS.forEach(def => {
            cosmicBadgesHTML += buildBadgeCardHTML(def);
        });

        container.innerHTML = `
            <div class="game-card badges-card">
                <div class="badges-title-group">
                    <h2>🏅 ${t('badgesTitle') || 'Cosmic Badges'}</h2>
                    <p class="hero-tagline">${t('badgesTagline') || 'Encounter cosmic anomalies to collect decorative badges, artwork, and lore.'}</p>
                </div>

                <!-- Badges Unlock HUD Counter -->
                <div class="upgrades-hud badges-hud">
                    <div class="hud-stat">
                        <span class="hud-label">${t('badgesUnlockedLabel') || 'BADGES COLLECTED'}:</span>
                        <span id="badges-unlocked-count" class="hud-value power-value">${unlockedCount} / ${totalBadges}</span>
                    </div>
                </div>

                <!-- Cosmic Occasions Section Header -->
                <div class="upgrades-section-header cosmic-header">
                    <h3>🌌 ${t('cosmicOccasionSection') || 'COSMIC OCCASIONS'}</h3>
                </div>

                <!-- Badges Grid Container -->
                <div class="badges-grid">
                    ${cosmicBadgesHTML}
                </div>
            </div>
        `;

        isStructureBuilt = true;
    };

    /**
     * Flicker-free in-place DOM update.
     * Only modifies nodes when badge unlock state actually changes.
     */
    const updateDOM = () => {
        const state = stateManager.getState();
        if (!isStructureBuilt) {
            buildStructure(state);
            return;
        }

        const totalBadges = COSMIC_BADGES_DEFS.length;
        const unlockedCount = getUnlockedBadgesCount(state);

        const countEl = document.getElementById('badges-unlocked-count');
        if (countEl) {
            countEl.textContent = `${unlockedCount} / ${totalBadges}`;
        }

        // Check if any badge state changed, update card in-place only if changed
        COSMIC_BADGES_DEFS.forEach(def => {
            const isUnlocked = isBadgeUnlocked(def.id, state);
            if (badgeUnlockStateCache[def.id] !== isUnlocked) {
                badgeUnlockStateCache[def.id] = isUnlocked;

                const card = document.getElementById(`badge-card-${def.id}`);
                if (card) {
                    if (isUnlocked) {
                        card.className = 'badge-card unlocked';
                        card.style.setProperty('--aura-color', def.auraColor);
                        card.innerHTML = `
                            <div class="badge-icon-container">
                                <div class="badge-icon-frame aura-glint" style="border-color: ${def.auraColor}; box-shadow: 0 0 20px ${def.auraColor}66, inset 0 0 15px ${def.auraColor}44;">
                                    <img src="${def.imagePath}" alt="${def.name}" class="badge-img">
                                </div>
                            </div>
                            <div class="badge-info">
                                <div class="badge-header-row">
                                    <h3 class="badge-name" style="color: ${def.auraColor}; text-shadow: 0 0 10px ${def.auraColor}88;">${def.name}</h3>
                                    <span class="status-badge rarity-tag" style="border-color: ${def.auraColor}; color: ${def.auraColor}; background: ${def.auraColor}22;">
                                        ${def.rarity.toUpperCase()}
                                    </span>
                                </div>
                                <span class="badge-subtitle">${def.subtitle}</span>
                                <p class="badge-lore">"${def.lore}"</p>
                                <div class="badge-footer">
                                    <span class="badge-status-tag unlocked-tag">✨ ${t('badgeUnlockedStatus') || 'UNLOCKED'}</span>
                                </div>
                            </div>
                        `;
                    } else {
                        card.className = 'badge-card locked';
                        card.style.removeProperty('--aura-color');
                        card.innerHTML = `
                            <div class="badge-icon-container">
                                <div class="badge-icon-frame locked-frame">
                                    <span class="badge-lock-icon">🔒</span>
                                </div>
                            </div>
                            <div class="badge-info">
                                <div class="badge-header-row">
                                    <h3 class="badge-name muted">${def.name}</h3>
                                    <span class="status-badge rarity-tag locked-tag">
                                        LOCKED
                                    </span>
                                </div>
                                <span class="badge-subtitle muted">${def.subtitle}</span>
                                <p class="badge-lore locked-lore">"???"</p>
                                <div class="badge-footer">
                                    <span class="badge-status-tag locked-notice-tag">🔒 ${t('badgeLockedStatus') || 'ENCOUNTER TO UNLOCK'}</span>
                                </div>
                            </div>
                        `;
                    }
                }
            }
        });
    };

    buildStructure(stateManager.getState());

    stateManager.subscribe(() => {
        updateDOM();
    });

    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            isStructureBuilt = false;
            buildStructure(stateManager.getState());
        });
    }
}

