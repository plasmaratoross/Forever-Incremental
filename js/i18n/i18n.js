/**
 * ============================================================================
 * INTERNATIONALIZATION (i18n) ENGINE
 * ============================================================================
 * Location: /js/i18n/i18n.js
 * Purpose: Provides helper functions to fetch translated strings and dispatch
 *          language update events across all UI modules.
 * Functions:
 *   - getLanguage(): Returns current active language code ('en' | 'vi')
 *   - setLanguage(lang): Updates language setting and fires 'languageChanged' event
 *   - t(key): Returns translated string for given translation key
 * ============================================================================
 */

import { optionsManager } from '../options/options.js';
import { TRANSLATIONS } from './translations.js';

/**
 * Get the currently active language code ('en' or 'vi')
 */
export function getLanguage() {
    return optionsManager.get('language') || 'en';
}

/**
 * Set active language code and dispatch languageChanged custom event
 */
export function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'vi') return;
    optionsManager.set('language', lang);
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * Translate key into current language string with fallback to English
 */
export function t(key) {
    const lang = getLanguage();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
}
