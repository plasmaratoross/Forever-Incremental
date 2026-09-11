/**
 * ============================================================================
 * CLICKING UPGRADES UI COMPONENT
 * ============================================================================
 * Location: /js/ui/upgradesUI.js
 * Purpose: Renders the 26 conceptual clicking upgrades in exact progression order,
 *          displays current player points & stats HUD using formatNumber(),
 *          binds buy button actions, and updates reactively upon purchase.
 *          Implements flicker-free in-place DOM updates to prevent layout tearing.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { CLICK_UPGRADES, purchaseUpgrade, calculateClickReward, getUpgradeCost } from '../upgrades/upgrades.js';
import { getPurchasedClickUpgradesCount, getTotalClickUpgradesCount } from '../systems/rebirth.js';
import { showNotification } from './notifications.js';
import { audioManager } from '../audio/audioManager.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';

const basicUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'basic');
const advancedUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'advanced');
const cosmicUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'cosmic');
const transcendentUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'transcendent');
const multiplicityUpgrades = CLICK_UPGRADES.filter(u => u.tier === 'multiplicity');

/**
 * Render Upgrades UI Panel with Basic & Advanced Clicking Upgrade Tiers
 * @param {string} containerId - DOM container ID
 */
export function renderUpgradesUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let isStructureBuilt = false;

    /**
     * Build Upgrade Card Item HTML String
     */
    const buildCardHTML = (upgrade, itemNumber) => {
        const upgName = t(`upgrade_${upgrade.id}_name`, upgrade.name);
        const upgDesc = t(`upgrade_${upgrade.id}_desc`, upgrade.description);
        const isAdvanced = upgrade.tier === 'advanced';
        const isCosmic = upgrade.tier === 'cosmic';
        const isTranscendent = upgrade.tier === 'transcendent';
        const isMultiplicity = upgrade.tier === 'multiplicity';

        let numClass = 'upgrade-item-num';
        if (isAdvanced) numClass += ' advanced-num';
        if (isCosmic) numClass += ' cosmic-num';
        if (isTranscendent) numClass += ' transcendent-num';
        if (isMultiplicity) numClass += ' multiplicity-num';

        let cardClass = 'upgrade-item-card locked';
        if (isAdvanced) cardClass += ' advanced-card';
        if (isCosmic) cardClass += ' cosmic-card';
        if (isTranscendent) cardClass += ' transcendent-card';
        if (isMultiplicity) cardClass += ' multiplicity-card';

        return `
            <div id="upg-card-${upgrade.id}" class="${cardClass}">
                <div class="upgrade-item-header">
                    <span class="${numClass}">#${itemNumber}</span>
                    <h3 class="upgrade-item-name">${upgName}</h3>
                </div>

                <p class="upgrade-item-desc">${upgDesc}</p>

                <div class="upgrade-item-footer">
                    <div class="upgrade-cost-tag">
                        <span class="cost-label">${t('costLabel')}:</span>
                        <span id="upg-cost-${upgrade.id}" class="cost-value ${isAdvanced || isCosmic || isTranscendent ? 'highlight-gold' : ''}">0 Points</span>
                    </div>

                    <button id="upg-btn-${upgrade.id}" class="click-btn secondary-btn buy-upgrade-btn" data-upgrade-id="${upgrade.id}" disabled>
                        ${t('btnLocked')}
                    </button>
                </div>
            </div>
        `;
    };

    /**
     * Build primary DOM structure once
     */
    const buildStructure = (state) => {
        const purchasedCount = getPurchasedClickUpgradesCount(state);
        const targetRequired = getTotalClickUpgradesCount(state);
        const calcResult = calculateClickReward(state, false);

        let basicHTML = '';
        basicUpgrades.forEach((u, i) => { basicHTML += buildCardHTML(u, i + 1); });

        let advancedHTML = '';
        advancedUpgrades.forEach((u, i) => { advancedHTML += buildCardHTML(u, i + 11); });

        let cosmicHTML = '';
        cosmicUpgrades.forEach((u, i) => { cosmicHTML += buildCardHTML(u, i + 14); });

        let transcendentHTML = '';
        transcendentUpgrades.forEach((u, i) => { transcendentHTML += buildCardHTML(u, i + 21); });

        let multiplicityHTML = '';
        multiplicityUpgrades.forEach((u, i) => { multiplicityHTML += buildCardHTML(u, i + 27); });

        container.innerHTML = `
            <div class="game-card upgrades-card">
                <h2 id="upg-hud-title">${t('upgradesTitle')} (${purchasedCount}/${targetRequired})</h2>

                <!-- Currency & Stat Summary HUD -->
                <div class="upgrades-hud">
                    <div class="hud-stat">
                        <span class="hud-label">${t('currentBalanceLabel')}</span>
                        <span id="upg-hud-currency" class="hud-value currency-value">${formatNumber(state.currency)} Points</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">${t('estClickPowerLabel')}</span>
                        <span id="upg-hud-clickpower" class="hud-value power-value">+${formatNumber(calcResult.amount)}</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">${t('masteryProgressLabel')}</span>
                        <span id="upg-hud-mastery" class="hud-value mastery-value ${purchasedCount >= targetRequired ? 'complete' : ''}">${purchasedCount} / ${targetRequired}</span>
                    </div>
                </div>

                <!-- Section 1: Basic Clicking Upgrades (#1 - #10) -->
                <div class="upgrades-section-header">
                    <h3>🔰 ${t('basicUpgradesSection')} (1-10)</h3>
                </div>
                <div class="upgrades-list">
                    ${basicHTML}
                </div>

                <!-- Section 2: Advanced Clicking Upgrades (#11 - #13) -->
                <div class="upgrades-section-header advanced-header">
                    <h3>⚡ ${t('advancedUpgradesSection')} (11-13)</h3>
                </div>
                <div id="advanced-locked-banner" class="advanced-locked-banner" style="display:none;">
                    <p>${t('advancedLockedNotice')}</p>
                </div>
                <div id="advanced-upgrades-list" class="upgrades-list" style="display:none;">
                    ${advancedHTML}
                </div>

                <!-- Section 3: Cosmic Clicking Upgrades (#14 - #20) -->
                <div class="upgrades-section-header cosmic-header">
                    <h3>🌌 ${t('cosmicUpgradesSection')} (14-20)</h3>
                </div>
                <div id="cosmic-locked-banner" class="advanced-locked-banner" style="display:none;">
                    <p>${t('cosmicUpgradesLockedNotice')}</p>
                </div>
                <div id="cosmic-upgrades-list" class="upgrades-list" style="display:none;">
                    ${cosmicHTML}
                </div>

                <!-- Section 4: Transcendent Clicking Upgrades (#21 - #26) -->
                <div class="upgrades-section-header transcendent-header">
                    <h3>✨ ${t('transcendentUpgradesSection')} (21-26)</h3>
                </div>
                <div id="transcendent-locked-banner" class="advanced-locked-banner" style="display:none;">
                    <p>${t('transcendentLockedNotice')}</p>
                </div>
                <div id="transcendent-upgrades-list" class="upgrades-list" style="display:none;">
                    ${transcendentHTML}
                </div>

                <!-- Section 5: Multiplicity Clicking Upgrades (#27 - #41) -->
                <div class="upgrades-section-header multiplicity-header">
                    <h3>🔮 ${t('multiplicityUpgradesSection')} (27-41)</h3>
                </div>
                <div id="multiplicity-locked-banner" class="advanced-locked-banner" style="display:none;">
                    <p>${t('multiplicityLockedNotice')}</p>
                </div>
                <div id="multiplicity-upgrades-list" class="upgrades-list" style="display:none;">
                    ${multiplicityHTML}
                </div>
            </div>
        `;

        isStructureBuilt = true;
    };

    /**
     * Selective flicker-free DOM updates
     */
    const updateDOM = () => {
        const state = stateManager.getState();
        if (!isStructureBuilt) buildStructure(state);

        const purchasedMap = state.upgrades || {};
        const calcResult = calculateClickReward(state, false);
        const purchasedCount = getPurchasedClickUpgradesCount(state);
        const targetRequired = getTotalClickUpgradesCount(state);
        const rebirthCount = state.rebirthCount || 0;

        const isAdvancedUnlocked = state.advancedClickingUnlocked || (rebirthCount >= 1);
        const isCosmicUnlocked = rebirthCount >= 3;
        const isTranscendentUnlocked = rebirthCount >= 4;
        const isMultiplicityUnlocked = rebirthCount >= 5;

        // Update HUD Header
        const titleEl = document.getElementById('upg-hud-title');
        if (titleEl) titleEl.textContent = `${t('upgradesTitle')} (${purchasedCount}/${targetRequired})`;

        const currencyEl = document.getElementById('upg-hud-currency');
        if (currencyEl) currencyEl.textContent = `${formatNumber(state.currency)} Points`;

        const powerEl = document.getElementById('upg-hud-clickpower');
        if (powerEl) powerEl.textContent = `+${formatNumber(calcResult.amount)}`;

        const masteryEl = document.getElementById('upg-hud-mastery');
        if (masteryEl) {
            masteryEl.textContent = `${purchasedCount} / ${targetRequired}`;
            masteryEl.className = `hud-value mastery-value ${purchasedCount >= targetRequired ? 'complete' : ''}`;
        }

        // Section Unlocks Visibility
        const advBanner = document.getElementById('advanced-locked-banner');
        const advList = document.getElementById('advanced-upgrades-list');
        if (advBanner && advList) {
            advBanner.style.display = isAdvancedUnlocked ? 'none' : '';
            advList.style.display = isAdvancedUnlocked ? '' : 'none';
        }

        const cosmicBanner = document.getElementById('cosmic-locked-banner');
        const cosmicList = document.getElementById('cosmic-upgrades-list');
        if (cosmicBanner && cosmicList) {
            cosmicBanner.style.display = isCosmicUnlocked ? 'none' : '';
            cosmicList.style.display = isCosmicUnlocked ? '' : 'none';
        }

        const transBanner = document.getElementById('transcendent-locked-banner');
        const transList = document.getElementById('transcendent-upgrades-list');
        if (transBanner && transList) {
            transBanner.style.display = isTranscendentUnlocked ? 'none' : '';
            transList.style.display = isTranscendentUnlocked ? '' : 'none';
        }

        const multBanner = document.getElementById('multiplicity-locked-banner');
        const multList = document.getElementById('multiplicity-upgrades-list');
        if (multBanner && multList) {
            multBanner.style.display = isMultiplicityUnlocked ? 'none' : '';
            multList.style.display = isMultiplicityUnlocked ? '' : 'none';
        }

        // Update each upgrade card in-place
        CLICK_UPGRADES.forEach(upgrade => {
            const isPurchased = !!purchasedMap[upgrade.id];
            const actualCost = getUpgradeCost(upgrade, state);
            const canAfford = state.currency >= actualCost;
            const isHighTier = upgrade.tier === 'cosmic' || upgrade.tier === 'transcendent' || upgrade.tier === 'multiplicity';

            const card = document.getElementById(`upg-card-${upgrade.id}`);
            if (card) {
                const tierClass = upgrade.tier !== 'basic' ? ` ${upgrade.tier}-card` : '';
                const stateClass = isPurchased ? 'purchased' : (canAfford ? 'affordable' : 'locked');
                card.className = `upgrade-item-card${tierClass} ${stateClass}`;
            }

            const costEl = document.getElementById(`upg-cost-${upgrade.id}`);
            if (costEl) {
                costEl.textContent = `${formatNumber(actualCost)} Points`;
            }

            const btn = document.getElementById(`upg-btn-${upgrade.id}`);
            if (btn) {
                if (isPurchased) {
                    btn.className = 'click-btn secondary-btn buy-upgrade-btn';
                    btn.disabled = true;
                    btn.textContent = t('purchasedBtn');
                } else if (canAfford) {
                    btn.className = `click-btn buy-upgrade-btn ${isHighTier ? 'primary-action-btn' : ''}`;
                    btn.disabled = false;
                    btn.textContent = t('buyBtn');
                } else {
                    btn.className = 'click-btn secondary-btn buy-upgrade-btn';
                    btn.disabled = true;
                    btn.textContent = t('btnLocked');
                }
            }
        });
    };

    // Initial structure and DOM update
    buildStructure(stateManager.getState());
    updateDOM();

    // Single delegated buy listener attached to container
    if (!container.hasAttribute('data-upg-buy-listener')) {
        container.setAttribute('data-upg-buy-listener', 'true');
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.buy-upgrade-btn:not([disabled])');
            if (btn) {
                const upgradeId = btn.getAttribute('data-upgrade-id');
                if (upgradeId) {
                    const success = purchaseUpgrade(upgradeId);
                    if (success) {
                        audioManager.playClickSFX();
                        const def = CLICK_UPGRADES.find(u => u.id === upgradeId);
                        showNotification(`Purchased ${def ? def.name : 'Upgrade'}!`);
                        updateDOM();
                    } else {
                        showNotification('Cannot purchase upgrade!');
                    }
                }
            }
        });
    }

    // Subscribe to stateManager for live flicker-free reactive DOM updates
    stateManager.subscribe(() => {
        updateDOM();
    });

    // Language change listener
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            isStructureBuilt = false;
            buildStructure(stateManager.getState());
            updateDOM();
        });
    }
}
