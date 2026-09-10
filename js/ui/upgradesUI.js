/**
 * ============================================================================
 * CLICKING UPGRADES UI COMPONENT
 * ============================================================================
 * Location: /js/ui/upgradesUI.js
 * Purpose: Renders the 10 conceptual clicking upgrades in exact progression order,
 *          displays current player points & stats HUD using formatNumber(),
 *          binds buy button actions, and updates reactively upon purchase.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { CLICK_UPGRADES, purchaseUpgrade, calculateClickReward, getUpgradeCost } from '../upgrades/upgrades.js';
import { getPurchasedClickUpgradesCount, getTotalClickUpgradesCount } from '../systems/rebirth.js';
import { showNotification } from './notifications.js';
import { audioManager } from '../audio/audioManager.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';

/**
 * Render Upgrades UI Panel with Basic & Advanced Clicking Upgrade Tiers
 * @param {string} containerId - DOM container ID
 */
export function renderUpgradesUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const render = () => {
        const state = stateManager.getState();
        const purchasedMap = state.upgrades || {};
        const calcResult = calculateClickReward(state, false);
        const purchasedCount = getPurchasedClickUpgradesCount(state);
        const targetRequired = getTotalClickUpgradesCount(state);
        const isAdvancedUnlocked = state.advancedClickingUnlocked || (state.rebirthCount && state.rebirthCount >= 1);

        const basicUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'basic');
        const advancedUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'advanced');
        const cosmicUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'cosmic');
        const transcendentUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'transcendent');
        const rebirthCount = state.rebirthCount || 0;
        const isCosmicUnlocked = rebirthCount >= 3;
        const isTranscendentUnlocked = rebirthCount >= 4;

        // Header HUD showing current Points balance, Click Power, and Mastery progress
        let html = `
            <div class="game-card upgrades-card">
                <h2>${t('upgradesTitle')} (${purchasedCount}/${targetRequired})</h2>

                <!-- Currency & Stat Summary HUD -->
                <div class="upgrades-hud">
                    <div class="hud-stat">
                        <span class="hud-label">${t('currentBalanceLabel')}</span>
                        <span class="hud-value currency-value">${formatNumber(state.currency)} Points</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">${t('estClickPowerLabel')}</span>
                        <span class="hud-value power-value">+${formatNumber(calcResult.amount)}</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">${t('masteryProgressLabel')}</span>
                        <span class="hud-value mastery-value ${purchasedCount >= targetRequired ? 'complete' : ''}">${purchasedCount} / ${targetRequired}</span>
                    </div>
                </div>

                <!-- Section 1: Basic Clicking Upgrades (#1 - #10) -->
                <div class="upgrades-section-header">
                    <h3>🔰 ${t('basicUpgradesSection')} (1-10)</h3>
                </div>
                <div class="upgrades-list">
        `;

        basicUpgrades.forEach((upgrade, index) => {
            const isPurchased = !!purchasedMap[upgrade.id];
            const actualCost = getUpgradeCost(upgrade, state);
            const canAfford = state.currency >= actualCost;
            const itemNumber = index + 1;
            const upgName = t(`upgrade_${upgrade.id}_name`, upgrade.name);
            const upgDesc = t(`upgrade_${upgrade.id}_desc`, upgrade.description);

            html += `
                <div class="upgrade-item-card ${isPurchased ? 'purchased' : (canAfford ? 'affordable' : 'locked')}">
                    <div class="upgrade-item-header">
                        <span class="upgrade-item-num">#${itemNumber}</span>
                        <h3 class="upgrade-item-name">${upgName}</h3>
                    </div>

                    <p class="upgrade-item-desc">${upgDesc}</p>

                    <div class="upgrade-item-footer">
                        <div class="upgrade-cost-tag">
                            <span class="cost-label">${t('costLabel')}:</span>
                            <span class="cost-value">${formatNumber(actualCost)} Points</span>
                        </div>

                        ${isPurchased ? `
                            <button class="click-btn secondary-btn buy-upgrade-btn" disabled>
                                ${t('purchasedBtn')}
                            </button>
                        ` : `
                            <button class="click-btn buy-upgrade-btn ${canAfford ? '' : 'secondary-btn'}" 
                                    data-upgrade-id="${upgrade.id}" 
                                    ${canAfford ? '' : 'disabled'}>
                                ${canAfford ? t('buyBtn') : t('btnLocked')}
                            </button>
                        `}
                    </div>
                </div>
            `;
        });

        html += `
                </div>

                <!-- Section 2: Advanced Clicking Upgrades (#11 - #13) -->
                <div class="upgrades-section-header advanced-header">
                    <h3>⚡ ${t('advancedUpgradesSection')} (11-13)</h3>
                </div>
        `;

        if (!isAdvancedUnlocked) {
            html += `
                <div class="advanced-locked-banner">
                    <p>${t('advancedLockedNotice')}</p>
                </div>
            `;
        } else {
            html += `<div class="upgrades-list">`;
            advancedUpgrades.forEach((upgrade, index) => {
                const isPurchased = !!purchasedMap[upgrade.id];
                const actualCost = getUpgradeCost(upgrade, state);
                const canAfford = state.currency >= actualCost;
                const itemNumber = index + 11;
                const upgName = t(`upgrade_${upgrade.id}_name`, upgrade.name);
                const upgDesc = t(`upgrade_${upgrade.id}_desc`, upgrade.description);

                html += `
                    <div class="upgrade-item-card advanced-card ${isPurchased ? 'purchased' : (canAfford ? 'affordable' : 'locked')}">
                        <div class="upgrade-item-header">
                            <span class="upgrade-item-num advanced-num">#${itemNumber}</span>
                            <h3 class="upgrade-item-name">${upgName}</h3>
                        </div>

                        <p class="upgrade-item-desc">${upgDesc}</p>

                        <div class="upgrade-item-footer">
                            <div class="upgrade-cost-tag">
                                <span class="cost-label">${t('costLabel')}:</span>
                                <span class="cost-value highlight-gold">${formatNumber(actualCost)} Points</span>
                            </div>

                            ${isPurchased ? `
                                <button class="click-btn secondary-btn buy-upgrade-btn" disabled>
                                    ${t('purchasedBtn')}
                                </button>
                            ` : `
                                <button class="click-btn buy-upgrade-btn ${canAfford ? '' : 'secondary-btn'}" 
                                        data-upgrade-id="${upgrade.id}" 
                                        ${canAfford ? '' : 'disabled'}>
                                    ${canAfford ? t('buyBtn') : t('btnLocked')}
                                </button>
                            `}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Section 3: Cosmic Clicking Upgrades (#14 - #20) [Unlocked at Rebirth 3]
        html += `
            <div class="upgrades-section-header cosmic-header">
                <h3>🌌 ${t('cosmicUpgradesSection')} (14-20)</h3>
            </div>
        `;

        if (!isCosmicUnlocked) {
            html += `
                <div class="advanced-locked-banner">
                    <p>${t('cosmicUpgradesLockedNotice')}</p>
                </div>
            `;
        } else {
            html += `<div class="upgrades-list">`;
            cosmicUpgrades.forEach((upgrade, index) => {
                const isPurchased = !!purchasedMap[upgrade.id];
                const actualCost = getUpgradeCost(upgrade, state);
                const canAfford = state.currency >= actualCost;
                const itemNumber = index + 14;
                const upgName = t(`upgrade_${upgrade.id}_name`, upgrade.name);
                const upgDesc = t(`upgrade_${upgrade.id}_desc`, upgrade.description);

                html += `
                    <div class="upgrade-item-card cosmic-card ${isPurchased ? 'purchased' : (canAfford ? 'affordable' : 'locked')}">
                        <div class="upgrade-item-header">
                            <span class="upgrade-item-num cosmic-num">#${itemNumber}</span>
                            <h3 class="upgrade-item-name">${upgName}</h3>
                        </div>

                        <p class="upgrade-item-desc">${upgDesc}</p>

                        <div class="upgrade-item-footer">
                            <div class="upgrade-cost-tag">
                                <span class="cost-label">${t('costLabel')}:</span>
                                <span class="cost-value highlight-gold">${formatNumber(actualCost)} Points</span>
                            </div>

                            ${isPurchased ? `
                                <button class="click-btn secondary-btn buy-upgrade-btn" disabled>
                                    ${t('purchasedBtn')}
                                </button>
                            ` : `
                                <button class="click-btn buy-upgrade-btn ${canAfford ? 'primary-action-btn' : 'secondary-btn'}" 
                                        data-upgrade-id="${upgrade.id}" 
                                        ${canAfford ? '' : 'disabled'}>
                                    ${canAfford ? t('buyBtn') : t('btnLocked')}
                                </button>
                            `}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Section 4: Transcendent Clicking Upgrades (#21 - #26) [Unlocked at Rebirth 4]
        html += `
            <div class="upgrades-section-header transcendent-header">
                <h3>✨ ${t('transcendentUpgradesSection')} (21-26)</h3>
            </div>
        `;

        if (!isTranscendentUnlocked) {
            html += `
                <div class="advanced-locked-banner">
                    <p>${t('transcendentLockedNotice')}</p>
                </div>
            `;
        } else {
            html += `<div class="upgrades-list">`;
            transcendentUpgrades.forEach((upgrade, index) => {
                const isPurchased = !!purchasedMap[upgrade.id];
                const actualCost = getUpgradeCost(upgrade, state);
                const canAfford = state.currency >= actualCost;
                const itemNumber = index + 21;
                const upgName = t(`upgrade_${upgrade.id}_name`, upgrade.name);
                const upgDesc = t(`upgrade_${upgrade.id}_desc`, upgrade.description);

                html += `
                    <div class="upgrade-item-card transcendent-card ${isPurchased ? 'purchased' : (canAfford ? 'affordable' : 'locked')}">
                        <div class="upgrade-item-header">
                            <span class="upgrade-item-num transcendent-num">#${itemNumber}</span>
                            <h3 class="upgrade-item-name">${upgName}</h3>
                        </div>

                        <p class="upgrade-item-desc">${upgDesc}</p>

                        <div class="upgrade-item-footer">
                            <div class="upgrade-cost-tag">
                                <span class="cost-label">${t('costLabel')}:</span>
                                <span class="cost-value highlight-gold">${formatNumber(actualCost)} Points</span>
                            </div>

                            ${isPurchased ? `
                                <button class="click-btn secondary-btn buy-upgrade-btn" disabled>
                                    ${t('purchasedBtn')}
                                </button>
                            ` : `
                                <button class="click-btn buy-upgrade-btn ${canAfford ? 'primary-action-btn' : 'secondary-btn'}" 
                                        data-upgrade-id="${upgrade.id}" 
                                        ${canAfford ? '' : 'disabled'}>
                                    ${canAfford ? t('buyBtn') : t('btnLocked')}
                                </button>
                            `}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        html += `
            </div>
        `;

        container.innerHTML = html;

        // Bind event listeners for buy buttons
        container.querySelectorAll('.buy-upgrade-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const upgradeId = e.currentTarget.getAttribute('data-upgrade-id');
                if (upgradeId) {
                    const success = purchaseUpgrade(upgradeId);
                    if (success) {
                        audioManager.playClickSFX();
                        const def = CLICK_UPGRADES.find(u => u.id === upgradeId);
                        showNotification(`Purchased ${def ? def.name : 'Upgrade'}!`);
                        render();
                    } else {
                        showNotification('Cannot purchase upgrade!');
                    }
                }
            });
        });
    };

    render();

    // Subscribe to global state changes for live HUD and affordability updates
    stateManager.subscribe(() => {
        render();
    });

    // Re-render automatically when language changes
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            render();
        });
    }
}
