/**
 * ============================================================================
 * COSMIC BADGES & BADGE UPGRADES UI COMPONENT
 * ============================================================================
 * Location: /js/ui/badgesUI.js
 * Purpose: Renders the Badges gallery page displaying unlocked and locked
 *          cosmic anomaly badges, custom artwork, lore lines, and animated aura glints.
 *          Also renders data-driven Badge Upgrades requiring specific badge combinations.
 *          Implements flicker-free in-place DOM updates to preserve smooth CSS aura glints.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { COSMIC_BADGES_DEFS, isBadgeUnlocked, getUnlockedBadgesCount } from '../systems/badges.js';
import { BADGE_UPGRADES_DEFS, canPurchaseBadgeUpgrade, purchaseBadgeUpgrade } from '../systems/badgeUpgrades.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';

/**
 * Render Badges UI Panel
 * @param {string} containerId - DOM container ID
 */
export function renderBadgesUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let isStructureBuilt = false;
    const badgeUnlockStateCache = {};
    const badgeUpgradeStateCache = {};

    /**
     * Build Badge Upgrade Card HTML
     */
    const buildBadgeUpgradeCardHTML = (def, state) => {
        const purchasedMap = state.badgeUpgrades || {};
        const isPurchased = !!purchasedMap[def.id];
        const canBuy = canPurchaseBadgeUpgrade(def.id, state);
        badgeUpgradeStateCache[def.id] = { isPurchased, canBuy, currency: state.currency };

        const uName = t(`upgrade_${def.id}_name`, def.name);
        const uDesc = t(`upgrade_${def.id}_desc`, def.description);

        const reqBadgesHTML = def.requiredBadges.map(badgeId => {
            const unlocked = isBadgeUnlocked(badgeId, state);
            const bDef = COSMIC_BADGES_DEFS.find(b => b.id === badgeId);
            const bName = bDef ? t(`badge_${badgeId}_name`, bDef.name) : badgeId;
            return `<span class="badge-req-tag ${unlocked ? 'unlocked' : 'locked'}">
                ${unlocked ? '✓' : '🔒'} ${bName}
            </span>`;
        }).join('');

        let reqRebirthHTML = '';
        if (def.reqRebirth) {
            const currentR = state.rebirthCount || 0;
            const highestR = (state.stats && state.stats.highestRebirth) || 0;
            const meetsRebirth = currentR >= def.reqRebirth || highestR >= def.reqRebirth;
            reqRebirthHTML = `<span class="badge-req-tag ${meetsRebirth ? 'unlocked' : 'locked'}">
                ${meetsRebirth ? '✓' : '🔒'} ${t('rebirthBtn')} ${def.reqRebirth}
            </span>`;
        }

        let buttonHTML = '';
        if (isPurchased) {
            buttonHTML = `<button class="click-btn secondary-btn buy-badge-upgrade-btn" disabled>✓ ${t('purchasedBtn')}</button>`;
        } else if (canBuy) {
            buttonHTML = `<button class="click-btn primary-action-btn buy-badge-upgrade-btn" data-upgrade-id="${def.id}">${t('buyBtn')} (${formatNumber(def.cost)} Points)</button>`;
        } else {
            buttonHTML = `<button class="click-btn secondary-btn buy-badge-upgrade-btn" disabled>${t('statusLocked')} (${formatNumber(def.cost)} Points)</button>`;
        }

        const themeClass = def.id.replace(/_/g, '-');

        return `
            <div id="badge-upgrade-card-${def.id}" class="badge-upgrade-card ${themeClass} ${isPurchased ? 'purchased' : (canBuy ? 'affordable' : 'locked')}">
                <div class="badge-upgrade-header">
                    <h3 class="badge-upgrade-name">✨ ${uName}</h3>
                    <span class="badge-upgrade-badge-tag">${t('badgeUpgradesTitle')}</span>
                </div>
                <p class="badge-upgrade-desc">${uDesc}</p>
                <div class="badge-req-container">
                    <span class="badge-req-label">${t('reqBadgesLabel')}:</span>
                    <div class="badge-req-tags">${reqBadgesHTML}${reqRebirthHTML}</div>
                </div>
                <div class="badge-upgrade-footer">
                    <div class="badge-upgrade-cost">
                        <span class="cost-label">${t('costLabel')}:</span> ${formatNumber(def.cost)} Points
                    </div>
                    ${buttonHTML}
                </div>
            </div>
        `;
    };

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
            const bName = t(`badge_${def.id}_name`, def.name);
            const bSub = t(`badge_${def.id}_sub`, def.subtitle);
            const bLore = t(`badge_${def.id}_lore`, def.lore);

            if (unlocked) {
                return `
                    <div id="badge-card-${def.id}" class="badge-card unlocked" style="--aura-color: ${def.auraColor};">
                        <div class="badge-icon-container">
                            <div class="badge-icon-frame aura-glint" style="border-color: ${def.auraColor}; box-shadow: 0 0 20px ${def.auraColor}66, inset 0 0 15px ${def.auraColor}44;">
                                <img src="${def.imagePath}" alt="${bName}" class="badge-img">
                            </div>
                        </div>
                        <div class="badge-info">
                            <div class="badge-header-row">
                                <h3 class="badge-name" style="color: ${def.auraColor}; text-shadow: 0 0 10px ${def.auraColor}88;">${bName}</h3>
                                <span class="status-badge rarity-tag" style="border-color: ${def.auraColor}; color: ${def.auraColor}; background: ${def.auraColor}22;">
                                    ${def.rarity.toUpperCase()}
                                </span>
                            </div>
                            <span class="badge-subtitle">${bSub}</span>
                            <p class="badge-lore">"${bLore}"</p>
                            <div class="badge-footer">
                                <span class="badge-status-tag unlocked-tag">✨ ${t('badgeUnlockedStatus')}</span>
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
                                <h3 class="badge-name muted">${bName}</h3>
                                <span class="status-badge rarity-tag locked-tag">
                                    ${t('statusLocked')}
                                </span>
                            </div>
                            <span class="badge-subtitle muted">${bSub}</span>
                            <p class="badge-lore locked-lore">"???"</p>
                            <div class="badge-footer">
                                <span class="badge-status-tag locked-notice-tag">🔒 ${t('badgeLockedStatus')}</span>
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

        let badgeUpgradesHTML = '';
        BADGE_UPGRADES_DEFS.forEach(def => {
            badgeUpgradesHTML += buildBadgeUpgradeCardHTML(def, state);
        });

        container.innerHTML = `
            <div class="game-card badges-card">
                <div class="badges-title-group">
                    <h2>🏅 ${t('badgesTitle')}</h2>
                    <p class="hero-tagline">${t('badgesTagline')}</p>
                </div>

                <!-- Badges Unlock HUD Counter -->
                <div class="upgrades-hud badges-hud">
                    <div class="hud-stat">
                        <span class="hud-label">${t('badgeCollectedLabel')}:</span>
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

                <!-- Badge Upgrades Section Header -->
                <div class="upgrades-section-header cosmic-header" style="margin-top: 2.5rem;">
                    <h3>✨ ${t('badgeUpgradesSection') || 'BADGE UPGRADES'}</h3>
                </div>

                <!-- Badge Upgrades List -->
                <div class="badge-upgrades-list">
                    ${badgeUpgradesHTML}
                </div>
            </div>
        `;

        isStructureBuilt = true;
    };

    /**
     * Flicker-free in-place DOM update.
     * Only modifies nodes when badge unlock state or badge upgrade purchase state changes.
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
                    const bName = t(`badge_${def.id}_name`, def.name);
                    const bSub = t(`badge_${def.id}_sub`, def.subtitle);
                    const bLore = t(`badge_${def.id}_lore`, def.lore);

                    if (isUnlocked) {
                        card.className = 'badge-card unlocked';
                        card.style.setProperty('--aura-color', def.auraColor);
                        card.innerHTML = `
                            <div class="badge-icon-container">
                                <div class="badge-icon-frame aura-glint" style="border-color: ${def.auraColor}; box-shadow: 0 0 20px ${def.auraColor}66, inset 0 0 15px ${def.auraColor}44;">
                                    <img src="${def.imagePath}" alt="${bName}" class="badge-img">
                                </div>
                            </div>
                            <div class="badge-info">
                                <div class="badge-header-row">
                                    <h3 class="badge-name" style="color: ${def.auraColor}; text-shadow: 0 0 10px ${def.auraColor}88;">${bName}</h3>
                                    <span class="status-badge rarity-tag" style="border-color: ${def.auraColor}; color: ${def.auraColor}; background: ${def.auraColor}22;">
                                        ${def.rarity.toUpperCase()}
                                    </span>
                                </div>
                                <span class="badge-subtitle">${bSub}</span>
                                <p class="badge-lore">"${bLore}"</p>
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
                                    <h3 class="badge-name muted">${bName}</h3>
                                    <span class="status-badge rarity-tag locked-tag">
                                        ${t('statusLocked')}
                                    </span>
                                </div>
                                <span class="badge-subtitle muted">${bSub}</span>
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

        // Update Badge Upgrades cards in place
        BADGE_UPGRADES_DEFS.forEach(def => {
            const purchasedMap = state.badgeUpgrades || {};
            const isPurchased = !!purchasedMap[def.id];
            const canBuy = canPurchaseBadgeUpgrade(def.id, state);
            const prevCache = badgeUpgradeStateCache[def.id] || {};

            if (prevCache.isPurchased !== isPurchased || prevCache.canBuy !== canBuy) {
                const card = document.getElementById(`badge-upgrade-card-${def.id}`);
                if (card) {
                    const newCardHTML = buildBadgeUpgradeCardHTML(def, state);
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = newCardHTML;
                    const newCardNode = tempDiv.firstElementChild;
                    if (newCardNode) {
                        card.replaceWith(newCardNode);
                    }
                }
            }
        });
    };

    buildStructure(stateManager.getState());

    // Event listener for purchasing badge upgrades
    if (!container.hasAttribute('data-badge-upgrade-listener')) {
        container.setAttribute('data-badge-upgrade-listener', 'true');
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.buy-badge-upgrade-btn');
            if (btn && btn.dataset.upgradeId) {
                const upgradeId = btn.dataset.upgradeId;
                if (purchaseBadgeUpgrade(upgradeId)) {
                    updateDOM();
                }
            }
        });
    }

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


