import { saveGame } from '../save/save.js';
import { loadGame } from '../save/load.js';
import { stateManager } from '../core/state.js';
import { INITIAL_STATE } from '../core/constants.js';
import { showNotification } from './notifications.js';
import { t } from '../i18n/i18n.js';

const SAVE_KEY = 'forever_incremental_save';

/**
 * Data Management UI Handler (Save / Load / Export / Import / Wipe) with i18n support
 */
export function renderDataUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="game-card data-card">
            <h2>${t('dataTitle')}</h2>
            
            <div class="data-actions">
                <button id="manual-save-btn" class="click-btn">${t('btnSaveNow')}</button>
                <button id="manual-load-btn" class="click-btn secondary-btn">${t('btnLoad')}</button>
            </div>

            <div class="data-section">
                <h3>${t('exportTitle')}</h3>
                <textarea id="save-string-io" class="save-textarea" placeholder="${t('exportPlaceholder')}"></textarea>
                <div class="data-actions">
                    <button id="export-save-btn" class="click-btn secondary-btn">${t('btnExport')}</button>
                    <button id="import-save-btn" class="click-btn secondary-btn">${t('btnImport')}</button>
                </div>
            </div>

            <div class="danger-zone">
                <h3>${t('dangerZoneTitle')}</h3>
                <button id="reset-data-btn" class="click-btn danger-btn">${t('btnHardReset')}</button>
            </div>
        </div>
    `;

    // 1. Save button
    document.getElementById('manual-save-btn')?.addEventListener('click', () => {
        if (saveGame()) {
            showNotification(t('savedMsg'));
        }
    });

    // 2. Load button
    document.getElementById('manual-load-btn')?.addEventListener('click', () => {
        if (loadGame()) {
            showNotification(t('loadedMsg'));
        } else {
            showNotification(t('noSaveMsg'));
        }
    });

    // 3. Export save string
    document.getElementById('export-save-btn')?.addEventListener('click', () => {
        const rawState = localStorage.getItem(SAVE_KEY) || JSON.stringify(stateManager.getState());
        const encoded = btoa(encodeURIComponent(rawState));
        const ioTextarea = document.getElementById('save-string-io');
        if (ioTextarea) ioTextarea.value = encoded;
        navigator.clipboard.writeText(encoded);
        showNotification(t('exportedMsg'));
    });

    // 4. Import save string
    document.getElementById('import-save-btn')?.addEventListener('click', () => {
        const ioTextarea = document.getElementById('save-string-io');
        const code = ioTextarea?.value.trim();
        if (!code) {
            showNotification(t('invalidCodeMsg'));
            return;
        }
        try {
            const decoded = decodeURIComponent(atob(code));
            const parsed = JSON.parse(decoded);
            stateManager.setState(parsed);
            saveGame();
            showNotification(t('importedMsg'));
        } catch (e) {
            showNotification(t('invalidCodeMsg'));
        }
    });

    // 5. Hard Reset
    document.getElementById('reset-data-btn')?.addEventListener('click', () => {
        if (confirm(t('confirmReset'))) {
            localStorage.removeItem(SAVE_KEY);
            stateManager.setState({ ...INITIAL_STATE });
            showNotification(t('wipeMsg'));
        }
    });

    // Re-render on language change
    if (!container.hasAttribute('data-lang-listener')) {
        container.setAttribute('data-lang-listener', 'true');
        window.addEventListener('languageChanged', () => {
            renderDataUI(containerId);
        });
    }
}
