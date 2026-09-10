/**
 * ============================================================================
 * PAGE TRANSITION HELPER
 * ============================================================================
 * Location: /js/utils/transitions.js
 * Purpose: Intercepts internal page navigation link clicks to trigger smooth
 *          fade-out exit transitions before loading the target page.
 * ============================================================================
 */

import { saveGame } from '../save/save.js';

let isTransitionInitialized = false;

/**
 * Initialize automatic smooth page transition handler across all internal links
 */
export function initPageTransitions() {
    if (isTransitionInitialized) return;
    isTransitionInitialized = true;

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        // Ignore external links, anchors, javascript links, or blank targets
        if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('http://') || href.startsWith('https://') || link.getAttribute('target') === '_blank') {
            return;
        }

        // Prevent instant default navigation
        e.preventDefault();

        // Save game state before leaving page
        try {
            saveGame();
        } catch (err) {
            // ignore save errors on exit
        }

        const appEl = document.getElementById('app') || document.body;
        appEl.classList.add('page-exit');

        setTimeout(() => {
            window.location.href = href;
        }, 180);
    });
}
