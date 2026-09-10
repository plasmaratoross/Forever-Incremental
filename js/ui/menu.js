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

    const pathname = window.location.pathname.toLowerCase();
    
    // Check if we are currently on a child page inside /pages/ or sub-route
    const isSubPage = pathname.includes('/pages/') || pathname.includes('game.html') || pathname.includes('upgrades.html') || pathname.includes('options.html') || pathname.includes('save.html');
    const isHomePage = !isSubPage || pathname.endsWith('/index.html') || pathname.endsWith('/');

    if (isHomePage) {
        // On Main Menu landing page: Keep top bar simple and clean (buttons are inside hero section)
        container.innerHTML = ``;
    } else {
        // On Child Page: Display "⬅ Back to Main Menu" return button
        // Calculate relative path back to main menu index.html
        const homePath = pathname.includes('/pages/') ? '../index.html' : 'index.html';

        container.innerHTML = `
            <div class="nav-back-wrapper">
                <a href="${homePath}" class="nav-item nav-back-btn" data-page="back">
                    <span class="nav-icon">⬅</span>
                    <span>${t('navBack')}</span>
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
