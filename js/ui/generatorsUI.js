/**
 * ============================================================================
 * POINT GENERATORS UI COMPONENT
 * ============================================================================
 * Location: /js/ui/generatorsUI.js
 * Purpose: Renders the Point Generators dashboard unlocked after Rebirth 2.
 *          Displays live Points balance HUD, passive generation rate,
 *          buy mode multiplier controls (x1, x5, x10, MAX),
 *          generator cards with dynamic cost & boost scaling,
 *          level progression, costs, and legendary visual styling.
 *          Uses flicker-free in-place DOM updates — structure built once,
 *          only numeric values and button states refreshed on each tick.
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { GENERATOR_DEFS, getGeneratorGen, getMultiLevelInfo, getTotalPointGeneration, purchaseGenerator } from '../systems/generators.js';
import { audioManager } from '../audio/audioManager.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';

const r2Generators = GENERATOR_DEFS.filter(g => (g.reqRebirth || 2) === 2);
const r3Generators = GENERATOR_DEFS.filter(g => g.reqRebirth === 3);
const r4Generators = GENERATOR_DEFS.filter(g => g.reqRebirth === 4);
const r5Generators = GENERATOR_DEFS.filter(g => g.reqRebirth === 5);

let activeBuyMode = '1';

/**
 * Render Point Generators UI Panel
 * @param {string} containerId - DOM container ID
 */
export function renderGeneratorsUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let isStructureBuilt = false;
    let lastRebirthCount = -1;

    /**
     * Build the full static DOM structure once.
     * All dynamic nodes have stable IDs for in-place updates.
     */
    const buildStructure = (state) => {
        const rebirthCount = state.rebirthCount || 0;
        const isUnlocked = rebirthCount >= 2;

        if (!isUnlocked) {
            container.innerHTML = `
                <div class="game-card generators-card">
                    <h2>${t('generatorsTitle')}</h2>
                    <div class="advanced-locked-banner">
                        <p>${t('generatorsLockedNotice')}</p>
                    </div>
                </div>
            `;
            isStructureBuilt = false;
            return;
        }

        const buildGenCardHTML = (def) => {
            const isCosmic = def.tier === 'cosmic';
            const isLegendary = def.tier === 'legendary';
            const isMultiplicity = def.tier === 'multiplicity';
            const maxLevel = def.maxLevel || 10;
            const genName = t(`gen_${def.id}_name`, def.name);
            const genDesc = t(`gen_${def.id}_desc`, def.description);
            const tierKey = `tier${def.tier.charAt(0).toUpperCase() + def.tier.slice(1)}`;
            const tierText = t(tierKey, def.tier.toUpperCase());

            return `
                <div class="upgrade-item-card generator-item-card ${isCosmic ? 'cosmic-card' : ''} ${isLegendary ? 'legendary-card' : ''} ${isMultiplicity ? 'multiplicity-card' : ''} locked"
                     id="gen-card-${def.id}">
                    <div class="upgrade-item-header">
                        <div class="gen-title-group">
                            <span class="status-badge tier-badge ${def.tier}-tier">${tierText}</span>
                            <h3 class="upgrade-item-name">${genName}</h3>
                            ${isLegendary ? `<span class="ultimate-tag">✨ ${t('ultimateBadge')}</span>` : ''}
                            ${isMultiplicity ? `<span class="ultimate-tag multiplicity-badge">🔮 ${t('multiplicityBadge', 'MULTIPLICITY')}</span>` : ''}
                        </div>
                        <div id="gen-level-badge-${def.id}" class="gen-level-badge">
                            ${t('levelLabel')}: 0 / ${maxLevel}
                        </div>
                    </div>

                    <p class="upgrade-item-desc">"${genDesc}"</p>

                    <div class="generator-stats-row">
                        <div class="gen-stat">
                            <span class="stat-lbl">${t('currentGenLabel')}:</span>
                            <span id="gen-current-gen-${def.id}" class="stat-val highlight-gold">+0 Pts/s</span>
                        </div>
                        <div id="gen-next-boost-row-${def.id}" class="gen-stat">
                            <span class="stat-lbl">${t('nextLevelBoostLabel')}:</span>
                            <span id="gen-next-boost-${def.id}" class="stat-val highlight-gain">+0 Pts/s</span>
                        </div>
                    </div>

                    <div class="upgrade-item-footer">
                        <div class="upgrade-cost-tag">
                            <span class="cost-label">${t('costLabel')}:</span>
                            <span id="gen-cost-${def.id}" class="cost-value ${isLegendary || isCosmic || isMultiplicity ? 'highlight-gold' : ''}">
                                0 Points
                            </span>
                        </div>
                        <button id="gen-btn-${def.id}"
                                class="click-btn secondary-btn buy-gen-btn"
                                data-gen-id="${def.id}"
                                disabled>
                            ${t('btnLocked')}
                        </button>
                    </div>
                </div>
            `;
        };

        let r2HTML = '';
        r2Generators.forEach(def => { r2HTML += buildGenCardHTML(def); });

        let r3HTML = `
            <div id="cosmic-locked-banner" class="advanced-locked-banner" style="display:none;">
                <p>${t('cosmicGeneratorsLockedNotice')}</p>
            </div>
            <div id="cosmic-generators-list" class="generators-list" style="display:none;">
        `;
        r3Generators.forEach(def => { r3HTML += buildGenCardHTML(def); });
        r3HTML += `</div>`;

        let r4HTML = `
            <div id="transcendent-locked-banner" class="advanced-locked-banner" style="display:none;">
                <p>${t('transcendentGeneratorsLockedNotice')}</p>
            </div>
            <div id="transcendent-generators-list" class="generators-list" style="display:none;">
        `;
        r4Generators.forEach(def => { r4HTML += buildGenCardHTML(def); });
        r4HTML += `</div>`;

        let r5HTML = `
            <div id="multiplicity-locked-banner" class="advanced-locked-banner" style="display:none;">
                <p>${t('multiplicityGeneratorsLockedNotice')}</p>
            </div>
            <div id="multiplicity-generators-list" class="generators-list" style="display:none;">
        `;
        r5Generators.forEach(def => { r5HTML += buildGenCardHTML(def); });
        r5HTML += `</div>`;

        container.innerHTML = `
            <div class="game-card generators-card">
                <h2>${t('generatorsTitle')}</h2>
                <p class="hero-tagline" style="margin-bottom: 1rem;">${t('generatorsTagline')}</p>

                <!-- Points Balance & Passive Generation HUD -->
                <div class="upgrades-hud generators-hud">
                    <div class="hud-stat">
                        <span class="hud-label">${t('pointsBalanceLabel')}:</span>
                        <span id="gen-hud-currency" class="hud-value currency-value">0</span>
                    </div>
                    <div class="hud-stat">
                        <span class="hud-label">${t('pointGenLabel')}:</span>
                        <span id="gen-hud-pps" class="hud-value power-value">+0 ${t('perSec')}</span>
                    </div>
                </div>

                <!-- Buy Multiplier Mode Selector Bar -->
                <div class="buy-mode-selector-bar">
                    <span class="buy-mode-label">${t('buyMultiplierLabel')}:</span>
                    <div class="buy-mode-btn-group">
                        <button class="buy-mode-btn ${String(activeBuyMode) === '1' ? 'active' : ''}" data-buy-mode="1">x1</button>
                        <button class="buy-mode-btn ${String(activeBuyMode) === '5' ? 'active' : ''}" data-buy-mode="5">x5</button>
                        <button class="buy-mode-btn ${String(activeBuyMode) === '10' ? 'active' : ''}" data-buy-mode="10">x10</button>
                        <button class="buy-mode-btn ${String(activeBuyMode) === 'MAX' ? 'active' : ''}" data-buy-mode="MAX">MAX</button>
                    </div>
                </div>

                <!-- Section 1: Rebirth 2 Generators -->
                <div class="upgrades-section-header">
                    <h3>⚙️ ${t('rebirth2GeneratorsSection')} (1-5)</h3>
                </div>
                <div class="generators-list">
                    ${r2HTML}
                </div>

                <!-- Section 2: Cosmic Generators (Rebirth 3) -->
                <div class="upgrades-section-header cosmic-header">
                    <h3>🌌 ${t('cosmicGeneratorsSection')} (6-10)</h3>
                </div>
                ${r3HTML}

                <!-- Section 3: Transcendent Generators (Rebirth 4) -->
                <div class="upgrades-section-header transcendent-header">
                    <h3>✨ ${t('transcendentGeneratorsSection')} (11-17)</h3>
                </div>
                ${r4HTML}

                <!-- Section 4: Multiplicity Generators (Rebirth 5) -->
                <div class="upgrades-section-header multiplicity-header">
                    <h3>🔮 ${t('multiplicityGeneratorsSection')} (18-27)</h3>
                </div>
                ${r5HTML}
            </div>
        `;

        // Bind buy multiplier selector buttons
        container.querySelectorAll('.buy-mode-btn[data-buy-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-buy-mode');
                if (mode) {
                    activeBuyMode = mode === 'MAX' ? 'MAX' : (parseInt(mode, 10) || 1);
                    audioManager.playClickSFX();
                    container.querySelectorAll('.buy-mode-btn').forEach(b => {
                        b.classList.toggle('active', b.getAttribute('data-buy-mode') === String(mode));
                    });
                    updateDOM();
                }
            });
        });

        // Bind buy buttons — delegated once, passes activeBuyMode
        container.querySelectorAll('.buy-gen-btn[data-gen-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const genId = e.currentTarget.getAttribute('data-gen-id');
                if (genId) {
                    const success = purchaseGenerator(genId, activeBuyMode);
                    if (success) {
                        audioManager.playClickSFX();
                        updateDOM();
                    }
                }
            });
        });

        isStructureBuilt = true;
        lastRebirthCount = rebirthCount;
    };

    /**
     * Flicker-free in-place DOM update — only touches text/class nodes, never innerHTML of cards.
     */
    const updateDOM = () => {
        const state = stateManager.getState();
        const rebirthCount = state.rebirthCount || 0;
        const isUnlocked = rebirthCount >= 2;

        // Rebuild from scratch if unlock state or rebirth tier changed
        if (!isStructureBuilt || rebirthCount !== lastRebirthCount || (!isUnlocked && isStructureBuilt)) {
            buildStructure(state);
            if (!isUnlocked) return;
        }

        const currentCurrency = state.currency || 0;
        const totalGenPerSec = getTotalPointGeneration(state);
        const generatorsMap = state.generators || {};

        // Update active mode buttons visual state
        container.querySelectorAll('.buy-mode-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-buy-mode') === String(activeBuyMode));
        });

        // Update HUD values
        const hudCurrency = document.getElementById('gen-hud-currency');
        if (hudCurrency) hudCurrency.textContent = formatNumber(currentCurrency);

        const hudPps = document.getElementById('gen-hud-pps');
        if (hudPps) hudPps.textContent = `+${formatNumber(totalGenPerSec)} ${t('perSec')}`;

        // Show/hide Cosmic section based on rebirth
        const cosmicBanner = document.getElementById('cosmic-locked-banner');
        const cosmicList = document.getElementById('cosmic-generators-list');
        if (cosmicBanner && cosmicList) {
            if (rebirthCount >= 3) {
                cosmicBanner.style.display = 'none';
                cosmicList.style.display = '';
            } else {
                cosmicBanner.style.display = '';
                cosmicList.style.display = 'none';
            }
        }

        // Show/hide Transcendent section based on rebirth
        const transBanner = document.getElementById('transcendent-locked-banner');
        const transList = document.getElementById('transcendent-generators-list');
        if (transBanner && transList) {
            if (rebirthCount >= 4) {
                transBanner.style.display = 'none';
                transList.style.display = '';
            } else {
                transBanner.style.display = '';
                transList.style.display = 'none';
            }
        }

        // Show/hide Multiplicity section based on rebirth
        const multBanner = document.getElementById('multiplicity-locked-banner');
        const multList = document.getElementById('multiplicity-generators-list');
        if (multBanner && multList) {
            if (rebirthCount >= 5) {
                multBanner.style.display = 'none';
                multList.style.display = '';
            } else {
                multBanner.style.display = '';
                multList.style.display = 'none';
            }
        }

        // Update each generator card in-place
        const allDefs = [
            ...r2Generators,
            ...(rebirthCount >= 3 ? r3Generators : []),
            ...(rebirthCount >= 4 ? r4Generators : []),
            ...(rebirthCount >= 5 ? r5Generators : [])
        ];
        allDefs.forEach(def => {
            const level = generatorsMap[def.id] || 0;
            const maxLevel = def.maxLevel || 10;
            const isMaxed = level >= maxLevel;
            const currentGen = getGeneratorGen(def, level);
            
            const multiInfo = getMultiLevelInfo(def, level, activeBuyMode, currentCurrency);
            const canAfford = !isMaxed && currentCurrency >= multiInfo.totalCost && multiInfo.levelsToBuy > 0;
            const isCosmic = def.tier === 'cosmic';
            const isLegendary = def.tier === 'legendary';

            // Card wrapper class
            const card = document.getElementById(`gen-card-${def.id}`);
            if (card) {
                const stateClass = isMaxed ? 'purchased' : (canAfford ? 'affordable' : 'locked');
                card.className = `upgrade-item-card generator-item-card ${isCosmic ? 'cosmic-card' : ''} ${isLegendary ? 'legendary-card' : ''} ${stateClass}`.trim();
            }

            // Level badge
            const levelBadge = document.getElementById(`gen-level-badge-${def.id}`);
            if (levelBadge) {
                levelBadge.textContent = `${t('levelLabel')}: ${level} / ${maxLevel}`;
                levelBadge.className = `gen-level-badge${isMaxed ? ' complete' : ''}`;
            }

            // Current generation
            const currentGenEl = document.getElementById(`gen-current-gen-${def.id}`);
            if (currentGenEl) currentGenEl.textContent = `+${formatNumber(currentGen)} Pts/s`;

            // Next level boost row
            const nextBoostRow = document.getElementById(`gen-next-boost-row-${def.id}`);
            if (nextBoostRow) nextBoostRow.style.display = isMaxed ? 'none' : '';
            const nextBoostEl = document.getElementById(`gen-next-boost-${def.id}`);
            if (nextBoostEl && !isMaxed) {
                const lvlSuffix = multiInfo.levelsToBuy > 1 ? ` (+${multiInfo.levelsToBuy} Lvl)` : '';
                nextBoostEl.textContent = `+${formatNumber(multiInfo.nextGenBoost)} Pts/s${lvlSuffix}`;
            }

            // Cost display
            const costEl = document.getElementById(`gen-cost-${def.id}`);
            if (costEl) {
                costEl.textContent = isMaxed ? t('btnMaxed') : `${formatNumber(multiInfo.totalCost)} Points`;
            }

            // Buy button
            const btn = document.getElementById(`gen-btn-${def.id}`);
            if (btn) {
                if (isMaxed) {
                    btn.className = 'click-btn secondary-btn buy-gen-btn';
                    btn.disabled = true;
                    btn.textContent = `✓ ${t('btnMaxLevel')}`;
                    btn.removeAttribute('data-gen-id');
                } else {
                    btn.className = `click-btn buy-gen-btn ${canAfford ? 'primary-action-btn' : 'secondary-btn'}`;
                    btn.disabled = !canAfford;
                    const btnLabel = multiInfo.levelsToBuy > 1 ? `${t('btnUpgrade')} +${multiInfo.levelsToBuy}` : t('btnUpgrade');
                    btn.textContent = canAfford ? btnLabel : t('btnLocked');
                    btn.setAttribute('data-gen-id', def.id);
                }
            }
        });
    };

    // Initial build
    buildStructure(stateManager.getState());
    updateDOM();

    // Live reactive updates — in-place only, no innerHTML replacement
    stateManager.subscribe(() => {
        updateDOM();
    });

    // Re-build on language change (text content changes throughout)
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            isStructureBuilt = false;
            buildStructure(stateManager.getState());
            updateDOM();
        });
    }
}

