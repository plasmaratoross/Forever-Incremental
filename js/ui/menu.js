/**
 * ============================================================================
 * NAVIGATION MENU COMPONENT
 * ============================================================================
 * Location: /js/ui/menu.js
 * Purpose: Renders top header navigation. When on a child page (Play, Upgrades,
 *          Options, Data), it displays a Return/Back button ('⬅ Back to Main Menu')
 *          while hiding the main menu buttons.
 * ============================================================================
 */

import { t } from '../i18n/i18n.js';
import { saveGame } from '../save/save.js';
import { initPageTransitions } from '../utils/transitions.js';

/**
 * Render top header navigation bar
 * @param {string} containerId - DOM ID of the navigation container element
 */
export function renderMenu(containerId) {
    // Initialize global smooth page transition handlers on internal links
    initPageTransitions();

    const container = document.getElementById(containerId);
    if (!container) return;

    // Determine page context
    const pathname = window.location.pathname.toLowerCase();
    const isGamePage = pathname.endsWith('game.html') || pathname.includes('/game.html');
    const isHomePage = pathname.endsWith('index.html') || pathname.endsWith('/') || (!pathname.includes('.html') && !pathname.includes('/pages/'));
    
    if (isHomePage) {
        // On Main Menu landing page: Keep top bar clean
        container.innerHTML = ``;
    } else if (isGamePage) {
        // On Gameplay Zone page (game.html): Display "⬅ Back to Main Menu" button
        const homePath = pathname.includes('/pages/') ? '../index.html' : 'index.html';

        container.innerHTML = `
            <div class="nav-back-wrapper">
                <a href="${homePath}" class="nav-item nav-back-btn" data-page="back">
                    <span class="nav-icon">⬅</span>
                    <span>${t('navBackToMenu', 'Back to Main Menu')}</span>
                </a>
            </div>
        `;

        const backBtn = container.querySelector('.nav-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                saveGame();
            });
        }
    } else {
        // Inside gameplay sections (upgrades, generators, achievements, badges, gallery, stats, options, save):
        // Display "⬅ Back to Gameplay Zone" button
        const gamePath = pathname.includes('/pages/') ? 'game.html' : 'pages/game.html';

        container.innerHTML = `
            <div class="nav-back-wrapper">
                <a href="${gamePath}" class="nav-item nav-back-btn" data-page="back">
                    <span class="nav-icon">⬅</span>
                    <span>${t('navBackToGame', 'Back to Gameplay Zone')}</span>
                </a>
            </div>
        `;

        const backBtn = container.querySelector('.nav-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                saveGame();
            });
        }
    }

    // Re-render menu automatically whenever language changes
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            renderMenu(containerId);
        });
    }
}
