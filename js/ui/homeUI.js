/**
 * ============================================================================
 * MAIN MENU (HOME) LANDING PAGE COMPONENT
 * ============================================================================
 * Location: /js/ui/homeUI.js
 * Purpose: Renders the Main Menu landing page interface containing the primary
 *          game action buttons (Play, Options, Data) and simplified Beginner Guide.
 * ============================================================================
 */

import { t } from '../i18n/i18n.js';

/**
 * Render Main Menu Landing UI
 * @param {string} containerId - DOM ID of the container element
 */
export function renderHomeUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="home-container">
            <!-- Hero Card: Main Action Buttons to enter sub-pages -->
            <div class="game-card hero-card">
                <p class="hero-tagline">${t('menuTagline')}</p>

                <div class="home-action-buttons">
                    <!-- Button 1: Enter Game Page -->
                    <a href="pages/game.html" class="click-btn primary-action-btn">
                        <span>${t('btnStartGame')}</span>
                    </a>

                    <!-- Button 2: Enter Options Page -->
                    <a href="pages/options.html" class="click-btn secondary-btn">
                        <span>${t('btnOptions')}</span>
                    </a>

                    <!-- Button 3: Enter Data & Saves Page -->
                    <a href="pages/save.html" class="click-btn secondary-btn">
                        <span>${t('btnData')}</span>
                    </a>
                </div>
            </div>

            <!-- Simplified How To Play Guide: Click ➔ Buy Upgrades ➔ Ascend -->
            <div class="game-card guide-card">
                <h2>${t('howToPlayTitle')}</h2>
                <div class="guide-flow">
                    <div class="flow-step">
                        <span class="step-icon">☝</span>
                        <span class="step-label">${t('howToPlayStep1')}</span>
                    </div>
                    <span class="flow-arrow">➔</span>
                    <div class="flow-step">
                        <span class="step-icon">⚡</span>
                        <span class="step-label">${t('howToPlayStep2')}</span>
                    </div>
                    <span class="flow-arrow">➔</span>
                    <div class="flow-step">
                        <span class="step-icon">✨</span>
                        <span class="step-label">${t('howToPlayStep3')}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Re-render automatically when language changes
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            renderHomeUI(containerId);
        });
    }
}
