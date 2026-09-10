/**
 * ============================================================================
 * OPTIONS UI COMPONENT
 * ============================================================================
 * Location: /js/ui/optionsUI.js
 * Purpose: Renders the Options & Settings dashboard including Background Music (BGM)
 *          soundtrack selection, Compact Number Format toggle (1M, 1B, 1T...),
 *          Auto-Save toggle, Language switcher, Sound FX, and Particle FX.
 * ============================================================================
 */

import { optionsManager } from '../options/options.js';
import { stateManager } from '../core/state.js';
import { saveGame } from '../save/save.js';
import { addCurrency } from '../systems/currency.js';
import { formatNumber } from '../utils/format.js';
import { showNotification } from './notifications.js';
import { t, setLanguage, getLanguage } from '../i18n/i18n.js';
import { COSMIC_BADGES_DEFS } from '../systems/badges.js';
import { COSMIC_EVENTS_DEFS, triggerCosmicEventById, clearCosmicEvent } from '../systems/cosmicEvents.js';

// SHA-256 hash of the admin password (password never stored in plaintext)
const ADMIN_HASH = 'c1111e162eb6d424f42b1b970b98780963ee494bac8ae1f3ad2ef42f426ab3cc';

/**
 * Hash a string using SHA-256 via SubtleCrypto (Web Crypto API)
 * @param {string} str - Input string
 * @returns {Promise<string>} Hex digest
 */
async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Secret click counter — debug panel revealed only after 7 title clicks
let _titleClickCount = 0;
let _showDebugSection = false;

/**
 * Render Options UI Panel
 * @param {string} containerId - DOM container ID
 */
export function renderOptionsUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const autoSaveOn = optionsManager.get('autoSaveEnabled');
    const shortFormatOn = optionsManager.get('shortNumberFormat') !== false;
    const soundOn = optionsManager.get('soundEnabled');
    const particlesOn = optionsManager.get('particlesEnabled');
    const lowGraphicsOn = !!optionsManager.get('lowGraphicsMode');
    const currentBGM = optionsManager.get('bgmTrack') || 'track1';
    const currentLang = getLanguage();

    const state = stateManager.getState();
    const isDebugUnlocked = !!state.debugUnlocked;
    const debugModeActive = !!state.debugModeActive;
    const debugGameSpeed = state.debugGameSpeed || 1.0;

    container.innerHTML = `
        <div class="game-card options-card">
            <h2>${t('optionsTitle')}</h2>

            <!-- Compact Number Format Toggle Row -->
            <div class="option-row">
                <div class="option-info">
                    <strong>🔢 ${t('shortNumberLabel')}</strong>
                    <p class="option-desc">${t('shortNumberDesc')}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-shortnumber" ${shortFormatOn ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Background Music Soundtrack Setting Row -->
            <div class="option-row">
                <div class="option-info">
                    <strong>🎵 ${t('bgmLabel')}</strong>
                    <p class="option-desc">${t('bgmDesc')}</p>
                </div>
                <select id="select-bgm" class="lang-select">
                    <option value="track1" ${currentBGM === 'track1' ? 'selected' : ''}>🎧 ${t('bgmTrack1')}</option>
                    <option value="track2" ${currentBGM === 'track2' ? 'selected' : ''}>🌧️ ${t('bgmTrack2')}</option>
                    <option value="track3" ${currentBGM === 'track3' ? 'selected' : ''}>🌌 ${t('bgmTrack3')}</option>
                    <option value="off" ${currentBGM === 'off' ? 'selected' : ''}>🔇 ${t('bgmOff')}</option>
                </select>
            </div>

            <!-- Auto-Save Toggle Row -->
            <div class="option-row">
                <div class="option-info">
                    <strong>💾 ${t('autoSaveLabel')}</strong>
                    <p class="option-desc">${t('autoSaveDesc')}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-autosave" ${autoSaveOn ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>
            
            <!-- Language Setting Row -->
            <div class="option-row">
                <div class="option-info">
                    <strong>🌐 ${t('languageLabel')}</strong>
                    <p class="option-desc">${t('languageDesc')}</p>
                </div>
                <select id="select-language" class="lang-select">
                    <option value="en" ${currentLang === 'en' ? 'selected' : ''}>🇬🇧 English</option>
                    <option value="vi" ${currentLang === 'vi' ? 'selected' : ''}>🇻🇳 Tiếng Việt</option>
                </select>
            </div>

            <!-- Sound Setting Row -->
            <div class="option-row">
                <div class="option-info">
                    <strong>🔊 ${t('soundLabel')}</strong>
                    <p class="option-desc">${t('soundDesc')}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-sound" ${soundOn ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Particle FX Setting Row -->
            <div class="option-row">
                <div class="option-info">
                    <strong>✨ ${t('particlesLabel')}</strong>
                    <p class="option-desc">${t('particlesDesc')}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-particles" ${particlesOn ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Low Graphics Mode Setting Row -->
            <div class="option-row">
                <div class="option-info">
                    <strong>⚡ ${t('lowGraphicsLabel')}</strong>
                    <p class="option-desc">${t('lowGraphicsDesc')}</p>
                </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-lowgraphics" ${lowGraphicsOn ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            </div>

            <!-- Hidden Admin Section: only shown after secret trigger + password -->
            <div id="debug-section-wrapper" style="display: none;">
                ${!isDebugUnlocked ? `
                    <div class="option-row" style="margin-top: 1.5rem;">
                        <div class="option-info">
                            <strong>🔒 Enter Access Code</strong>
                        </div>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; width: 100%;">
                            <input type="password" id="debug-password-input" class="debug-pass-input" placeholder="Access code..." style="padding: 0.6rem 1rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.5); color: #fff; font-size: 0.95rem; flex: 1; min-width: 200px;">
                            <button id="btn-unlock-debug" class="click-btn primary-action-btn" style="padding: 0.6rem 1.2rem;">Unlock</button>
                        </div>
                    </div>
                ` : `
                    <div class="debug-panel" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,215,0,0.4); border-radius: 12px; padding: 1.25rem; margin-top: 1rem; display: flex; flex-direction: column; gap: 1.25rem;">
                        <!-- Header: badge + toggle + lock button -->
                        <div class="debug-panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                            <span class="status-badge purchased-badge" style="font-size: 1rem; font-weight: 800;">🛠️ Admin Mode</span>
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <!-- Debug Mode Active Toggle -->
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-size: 0.85rem; color: ${debugModeActive ? '#a3e635' : 'rgba(255,255,255,0.5)'}; font-weight: 600;">
                                        ${debugModeActive ? '✅ Debug ON' : '⚪ Debug OFF'}
                                    </span>
                                    <label class="switch" style="margin: 0;">
                                        <input type="checkbox" id="toggle-debug-active" ${debugModeActive ? 'checked' : ''}>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                <button id="btn-lock-debug" class="click-btn secondary-btn" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">🔒 Lock</button>
                            </div>
                        </div>

                        <!-- Debug Tools: only shown when Debug Mode is ON -->
                        ${debugModeActive ? `
                            <!-- 1. Give Points -->
                            <div class="debug-tool-row" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <strong style="color: #ffd700;">💰 Give Points (Current: ${formatNumber(state.currency)})</strong>
                                <div class="debug-btn-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button class="click-btn secondary-btn debug-give-pts" data-amount="1000000">+1 Million</button>
                                    <button class="click-btn secondary-btn debug-give-pts" data-amount="1000000000">+1 Billion</button>
                                    <button class="click-btn secondary-btn debug-give-pts" data-amount="1000000000000">+1 Trillion</button>
                                    <button class="click-btn secondary-btn debug-give-pts" data-amount="1000000000000000">+1 Quadrillion</button>
                                </div>
                                <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                                    <input type="number" id="debug-custom-pts" class="debug-num-input" placeholder="Custom amount..." style="padding: 0.5rem 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.5); color: #fff; flex: 1;">
                                    <button id="btn-give-custom-pts" class="click-btn primary-action-btn" style="padding: 0.5rem 1rem;">+ Give</button>
                                </div>
                            </div>

                            <!-- 2. Set Rebirth Level -->
                            <div class="debug-tool-row" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <strong style="color: #ffd700;">🌟 Set Rebirth (Current: Rebirth ${state.rebirthCount || 0})</strong>
                                <div class="debug-btn-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button id="btn-add-rebirth" class="click-btn secondary-btn">+1 Rebirth</button>
                                    <button class="click-btn secondary-btn debug-set-r" data-rebirth="1">Set R1</button>
                                    <button class="click-btn secondary-btn debug-set-r" data-rebirth="2">Set R2</button>
                                    <button class="click-btn secondary-btn debug-set-r" data-rebirth="3">Set R3</button>
                                </div>
                                <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                                    <input type="number" id="debug-custom-r" class="debug-num-input" placeholder="Set level (e.g. 5)..." min="0" max="100" style="padding: 0.5rem 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.5); color: #fff; flex: 1;">
                                    <button id="btn-set-custom-r" class="click-btn primary-action-btn" style="padding: 0.5rem 1rem;">Set Rebirth</button>
                                </div>
                            </div>

                            <!-- 3. Adjust Game Speed (Up to x5) -->
                            <div class="debug-tool-row" style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <strong style="color: #ffd700;">⚡ Game Speed (Current: ×${debugGameSpeed.toFixed(1)})</strong>
                                <div class="debug-btn-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button class="click-btn ${debugGameSpeed === 1.0 ? 'primary-action-btn' : 'secondary-btn'} debug-set-speed" data-speed="1.0">×1.0 (Normal)</button>
                                    <button class="click-btn ${debugGameSpeed === 2.0 ? 'primary-action-btn' : 'secondary-btn'} debug-set-speed" data-speed="2.0">×2.0</button>
                                    <button class="click-btn ${debugGameSpeed === 3.0 ? 'primary-action-btn' : 'secondary-btn'} debug-set-speed" data-speed="3.0">×3.0</button>
                                    <button class="click-btn ${debugGameSpeed === 4.0 ? 'primary-action-btn' : 'secondary-btn'} debug-set-speed" data-speed="4.0">×4.0</button>
                                    <button class="click-btn ${debugGameSpeed === 5.0 ? 'primary-action-btn' : 'secondary-btn'} debug-set-speed" data-speed="5.0">×5.0 (Max Speed)</button>
                                </div>
                            </div>

                            <!-- 4. Badge Manager (Add / Delete Badges) -->
                            <div class="debug-tool-row" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,215,0,0.3);">
                                <strong style="color: #ffd700;">🏅 Badge Manager (Add / Delete Badges)</strong>
                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <input type="text" id="debug-badge-input" class="debug-num-input" list="debug-badges-list" placeholder="Insert badge name (e.g. Time Pulse)..." style="padding: 0.5rem 0.8rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.5); color: #fff; flex: 1; min-width: 200px;">
                                    <datalist id="debug-badges-list">
                                        ${COSMIC_BADGES_DEFS.map(b => `<option value="${b.name}">${b.subtitle}</option>`).join('')}
                                    </datalist>
                                    <button id="btn-debug-add-badge" class="click-btn primary-action-btn" style="padding: 0.5rem 1rem;">+ Add Badge</button>
                                    <button id="btn-debug-remove-badge" class="click-btn secondary-btn" style="padding: 0.5rem 1rem; border-color: rgba(239,68,68,0.5); color: #fca5a5;">🗑️ Delete Badge</button>
                                </div>
                                <div class="debug-btn-group" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem;">
                                    <button id="btn-debug-unlock-all-badges" class="click-btn secondary-btn" style="font-size: 0.85rem; padding: 0.3rem 0.7rem;">✨ Unlock All (9/9)</button>
                                    <button id="btn-debug-lock-all-badges" class="click-btn secondary-btn" style="font-size: 0.85rem; padding: 0.3rem 0.7rem;">🔒 Reset All Badges</button>
                                </div>
                            </div>

                            <!-- 5. Spawn Cosmic Occasion (Cosmic Events) -->
                            <div class="debug-tool-row" style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px dashed rgba(255,215,0,0.3);">
                                <strong style="color: #ffd700;">🌌 Spawn Cosmic Occasion</strong>
                                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <select id="debug-spawn-event-select" class="lang-select" style="flex: 1; min-width: 200px; padding: 0.5rem 0.8rem; background: rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px;">
                                        ${COSMIC_EVENTS_DEFS.map(e => `<option value="${e.id}">${e.name} (${e.rarity})</option>`).join('')}
                                    </select>
                                    <button id="btn-debug-spawn-event" class="click-btn primary-action-btn" style="padding: 0.5rem 1rem;">⚡ Trigger Event</button>
                                    <button id="btn-debug-clear-event" class="click-btn secondary-btn" style="padding: 0.5rem 1rem;">🛑 End Event</button>
                                </div>
                            </div>
                        ` : `
                            <p style="color: rgba(255,255,255,0.4); font-size: 0.9rem; text-align: center; margin: 0;">
                                Toggle Debug Mode ON to access admin tools.
                            </p>
                        `}
                    </div>
                `}
            </div>
        </div>
    `;

    // 1. Compact Number Format Toggle Handler
    const shortFormatToggle = document.getElementById('toggle-shortnumber');
    if (shortFormatToggle) {
        shortFormatToggle.addEventListener('change', (e) => {
            optionsManager.set('shortNumberFormat', e.target.checked);
            showNotification(`Compact numbers ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
    }

    // 2. Background Music Selector Handler
    const bgmSelect = document.getElementById('select-bgm');
    if (bgmSelect) {
        bgmSelect.addEventListener('change', (e) => {
            const track = e.target.value;
            optionsManager.set('bgmTrack', track);
            const trackName = track === 'off' ? t('bgmOff') : t(`bgm${track.charAt(0).toUpperCase() + track.slice(1)}`);
            showNotification(`BGM: ${trackName}`);
        });
    }

    // 3. Auto-Save Toggle Handler
    const autoSaveToggle = document.getElementById('toggle-autosave');
    if (autoSaveToggle) {
        autoSaveToggle.addEventListener('change', (e) => {
            optionsManager.set('autoSaveEnabled', e.target.checked);
            showNotification(`Auto-Save ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
    }

    // 4. Language Selector Handler
    const langSelect = document.getElementById('select-language');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            setLanguage(newLang);
            showNotification(newLang === 'vi' ? 'Đã đổi ngôn ngữ sang Tiếng Việt!' : 'Language changed to English!');
        });
    }

    // 5. Sound Toggle Handler
    const soundToggle = document.getElementById('toggle-sound');
    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            optionsManager.set('soundEnabled', e.target.checked);
            showNotification(`Sound ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
    }

    // 6. Particle FX Toggle Handler
    const particlesToggle = document.getElementById('toggle-particles');
    if (particlesToggle) {
        particlesToggle.addEventListener('change', (e) => {
            optionsManager.set('particlesEnabled', e.target.checked);
            showNotification(`Particle FX ${e.target.checked ? 'enabled' : 'disabled'}`);
        });
    }

    // 6b. Low Graphics Mode Toggle Handler
    const lowGraphicsToggle = document.getElementById('toggle-lowgraphics');
    if (lowGraphicsToggle) {
        lowGraphicsToggle.addEventListener('change', (e) => {
            optionsManager.set('lowGraphicsMode', e.target.checked);
            showNotification(`Low Graphics Mode ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
        });
    }

    // 7. Secret title click trigger — reveals hidden debug section after 7 clicks
    const optionsTitleEl = container.querySelector('h2');
    if (optionsTitleEl) {
        if (_showDebugSection || isDebugUnlocked) {
            const wrapper = document.getElementById('debug-section-wrapper');
            if (wrapper) wrapper.style.display = 'block';
        }
        optionsTitleEl.style.cursor = 'default';
        optionsTitleEl.addEventListener('click', () => {
            _titleClickCount++;
            if (_titleClickCount >= 7) {
                _titleClickCount = 0;
                _showDebugSection = true;
                const wrapper = document.getElementById('debug-section-wrapper');
                if (wrapper) wrapper.style.display = 'block';
            }
        });
    }

    // Admin password unlock handler — verifies via SHA-256 hash (no plaintext)
    const attemptUnlock = async () => {
        const passInput = document.getElementById('debug-password-input');
        if (passInput) {
            const val = passInput.value.trim().toLowerCase();
            const hashed = await sha256(val);
            if (hashed === ADMIN_HASH) {
                stateManager.setState({
                    debugUnlocked: true,
                    debugGameSpeed: state.debugGameSpeed || 1.0
                });
                saveGame();
                showNotification(t('debugUnlockedMsg'));
                renderOptionsUI(containerId);
            } else {
                showNotification(t('debugInvalidPass'));
            }
        }
    };

    const unlockBtn = document.getElementById('btn-unlock-debug');
    if (unlockBtn) unlockBtn.addEventListener('click', attemptUnlock);

    const passInput = document.getElementById('debug-password-input');
    if (passInput) {
        passInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') attemptUnlock();
        });
    }

    // 8. Debug Mode Active Toggle
    const debugActiveToggle = document.getElementById('toggle-debug-active');
    if (debugActiveToggle) {
        debugActiveToggle.addEventListener('change', (e) => {
            stateManager.setState({ debugModeActive: e.target.checked });
            saveGame();
            showNotification(`Debug Mode ${e.target.checked ? 'enabled' : 'disabled'}.`);
            renderOptionsUI(containerId);
        });
    }

    // 9. Lock Debug Handler (also resets active toggle + game speed)
    const lockBtn = document.getElementById('btn-lock-debug');
    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            stateManager.setState({
                debugUnlocked: false,
                debugModeActive: false,
                debugGameSpeed: 1.0
            });
            saveGame();
            showNotification('Admin Debug Mode locked.');
            renderOptionsUI(containerId);
        });
    }

    // 9. Give Points Presets
    container.querySelectorAll('.debug-give-pts').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const amount = parseFloat(e.currentTarget.getAttribute('data-amount'));
            if (amount > 0) {
                addCurrency(amount);
                saveGame();
                showNotification(`Added +${formatNumber(amount)} Points!`);
                renderOptionsUI(containerId);
            }
        });
    });

    // 10. Give Custom Points
    const giveCustomPtsBtn = document.getElementById('btn-give-custom-pts');
    if (giveCustomPtsBtn) {
        giveCustomPtsBtn.addEventListener('click', () => {
            const customInput = document.getElementById('debug-custom-pts');
            if (customInput) {
                const amount = parseFloat(customInput.value);
                if (amount > 0) {
                    addCurrency(amount);
                    saveGame();
                    showNotification(`Added +${formatNumber(amount)} Points!`);
                    renderOptionsUI(containerId);
                }
            }
        });
    }

    // 11. Add +1 Rebirth
    const addRebirthBtn = document.getElementById('btn-add-rebirth');
    if (addRebirthBtn) {
        addRebirthBtn.addEventListener('click', () => {
            const currentState = stateManager.getState();
            const newR = (currentState.rebirthCount || 0) + 1;
            const currentStats = currentState.stats || {};
            stateManager.setState({
                rebirthCount: newR,
                advancedClickingUnlocked: true,
                autoclickUnlocked: newR >= 3 || currentState.autoclickUnlocked,
                cosmicEventsUnlocked: newR >= 3 || currentState.cosmicEventsUnlocked,
                rebirthUpgrades: {
                    ...currentState.rebirthUpgrades,
                    efficient_instinct: newR >= 2 || (currentState.rebirthUpgrades && currentState.rebirthUpgrades.efficient_instinct)
                },
                stats: {
                    ...currentStats,
                    totalRebirths: (currentStats.totalRebirths || 0) + 1,
                    highestRebirth: Math.max(currentStats.highestRebirth || 0, newR)
                }
            });
            saveGame();
            showNotification(`Rebirth set to ${newR}!`);
            renderOptionsUI(containerId);
        });
    }

    // 12. Set Rebirth Level (Preset & Custom)
    const setRebirthLevel = (targetLevel) => {
        const targetR = Math.max(0, parseInt(targetLevel, 10) || 0);
        const currentState = stateManager.getState();
        const currentStats = currentState.stats || {};
        stateManager.setState({
            rebirthCount: targetR,
            advancedClickingUnlocked: targetR >= 1 || currentState.advancedClickingUnlocked,
            autoclickUnlocked: targetR >= 3 || currentState.autoclickUnlocked,
            cosmicEventsUnlocked: targetR >= 3 || currentState.cosmicEventsUnlocked,
            rebirthUpgrades: {
                ...currentState.rebirthUpgrades,
                efficient_instinct: targetR >= 2 || (currentState.rebirthUpgrades && currentState.rebirthUpgrades.efficient_instinct)
            },
            stats: {
                ...currentStats,
                totalRebirths: Math.max(currentStats.totalRebirths || 0, targetR),
                highestRebirth: Math.max(currentStats.highestRebirth || 0, targetR)
            }
        });
        saveGame();
        showNotification(`Rebirth set to ${targetR}!`);
        renderOptionsUI(containerId);
    };

    container.querySelectorAll('.debug-set-r').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const level = e.currentTarget.getAttribute('data-rebirth');
            setRebirthLevel(level);
        });
    });

    const setCustomRBtn = document.getElementById('btn-set-custom-r');
    if (setCustomRBtn) {
        setCustomRBtn.addEventListener('click', () => {
            const input = document.getElementById('debug-custom-r');
            if (input && input.value !== '') {
                setRebirthLevel(input.value);
            }
        });
    }

    // 13. Game Speed Adjuster (Max 5x)
    container.querySelectorAll('.debug-set-speed').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const speed = Math.min(5.0, Math.max(1.0, parseFloat(e.currentTarget.getAttribute('data-speed'))));
            stateManager.setState({ debugGameSpeed: speed });
            saveGame();
            showNotification(`Game speed set to ×${speed.toFixed(1)}!`);
            renderOptionsUI(containerId);
        });
    });

    // 14. Badge Manager Handlers
    const findBadgeDef = (query) => {
        if (!query) return null;
        const q = query.trim().toLowerCase();
        return COSMIC_BADGES_DEFS.find(b => 
            b.id.toLowerCase() === q || 
            b.name.toLowerCase() === q || 
            b.subtitle.toLowerCase() === q ||
            b.id.replace(/_/g, ' ').toLowerCase() === q
        );
    };

    const addBadgeBtn = document.getElementById('btn-debug-add-badge');
    if (addBadgeBtn) {
        addBadgeBtn.addEventListener('click', () => {
            const input = document.getElementById('debug-badge-input');
            const val = input ? input.value : '';
            const def = findBadgeDef(val);
            if (def) {
                const currentState = stateManager.getState();
                const currentBadges = currentState.badges || {};
                stateManager.setState({
                    badges: {
                        ...currentBadges,
                        [def.id]: true
                    }
                });
                saveGame();
                showNotification(`Added badge: ${def.name}!`);
                renderOptionsUI(containerId);
            } else {
                showNotification(`Badge not found! Available: ${COSMIC_BADGES_DEFS.map(b => b.name).join(', ')}`);
            }
        });
    }

    const removeBadgeBtn = document.getElementById('btn-debug-remove-badge');
    if (removeBadgeBtn) {
        removeBadgeBtn.addEventListener('click', () => {
            const input = document.getElementById('debug-badge-input');
            const val = input ? input.value : '';
            const def = findBadgeDef(val);
            if (def) {
                const currentState = stateManager.getState();
                const currentBadges = { ...(currentState.badges || {}) };
                delete currentBadges[def.id];
                stateManager.setState({ badges: currentBadges });
                saveGame();
                showNotification(`Deleted badge: ${def.name}!`);
                renderOptionsUI(containerId);
            } else {
                showNotification(`Badge not found! Available: ${COSMIC_BADGES_DEFS.map(b => b.name).join(', ')}`);
            }
        });
    }

    const unlockAllBadgesBtn = document.getElementById('btn-debug-unlock-all-badges');
    if (unlockAllBadgesBtn) {
        unlockAllBadgesBtn.addEventListener('click', () => {
            const allBadges = {};
            COSMIC_BADGES_DEFS.forEach(b => { allBadges[b.id] = true; });
            stateManager.setState({ badges: allBadges });
            saveGame();
            showNotification(`Unlocked all ${COSMIC_BADGES_DEFS.length} cosmic badges!`);
            renderOptionsUI(containerId);
        });
    }

    const lockAllBadgesBtn = document.getElementById('btn-debug-lock-all-badges');
    if (lockAllBadgesBtn) {
        lockAllBadgesBtn.addEventListener('click', () => {
            stateManager.setState({ badges: {} });
            saveGame();
            showNotification('Reset all cosmic badges!');
            renderOptionsUI(containerId);
        });
    }

    // 15. Cosmic Event Spawner Handlers
    const spawnEventBtn = document.getElementById('btn-debug-spawn-event');
    if (spawnEventBtn) {
        spawnEventBtn.addEventListener('click', () => {
            const select = document.getElementById('debug-spawn-event-select');
            const eventId = select ? select.value : '';
            if (eventId) {
                const success = triggerCosmicEventById(eventId);
                if (success) {
                    saveGame();
                    renderOptionsUI(containerId);
                } else {
                    showNotification('Failed to trigger cosmic event!');
                }
            }
        });
    }

    const clearEventBtn = document.getElementById('btn-debug-clear-event');
    if (clearEventBtn) {
        clearEventBtn.addEventListener('click', () => {
            clearCosmicEvent();
            saveGame();
            showNotification('Ended active Cosmic Event.');
            renderOptionsUI(containerId);
        });
    }

    // Re-render on language change
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            renderOptionsUI(containerId);
        });
    }
}
