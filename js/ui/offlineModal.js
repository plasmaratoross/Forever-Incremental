/**
 * ============================================================================
 * OFFLINE PROGRESS MODAL UI
 * ============================================================================
 * Location: /js/ui/offlineModal.js
 * Purpose: Renders a modern, high-aesthetic popup modal displaying offline earnings
 *          from Point Generators and active Auto Clicker.
 * ============================================================================
 */

import { getPendingOfflineReport, clearPendingOfflineReport } from '../systems/offlineProgress.js';
import { formatNumber, formatTime } from '../utils/format.js';
import { audioManager } from '../audio/audioManager.js';
import { t } from '../i18n/i18n.js';

/**
 * Check if a pending offline report exists and render the Offline Progress Modal
 */
export function checkAndShowOfflineModal() {
    if (typeof document === 'undefined') return;

    const report = getPendingOfflineReport();
    if (!report) return;

    // Prevent duplicate modals
    if (document.getElementById('offline-progress-modal')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'offline-progress-modal';
    modalOverlay.className = 'modal-overlay offline-modal-overlay';

    modalOverlay.innerHTML = `
        <div class="modal-card offline-modal-card">
            <div class="offline-modal-header">
                <div class="offline-icon-badge">⏳</div>
                <h2>${t('offlineModalTitle', 'WELCOME BACK!')}</h2>
                <p class="offline-modal-subtitle">${t('offlineModalTagline', 'Here is what your generators and autoclicker produced while you were away:')}</p>
            </div>

            <div class="offline-summary-grid">
                <!-- Time Offline Card -->
                <div class="offline-stat-card">
                    <div class="offline-stat-icon">⏱️</div>
                    <div class="offline-stat-info">
                        <span class="offline-stat-label">${t('offlineTimeLabel', 'Time Away')}</span>
                        <span class="offline-stat-value highlight-cyan">${formatTime(report.offlineSeconds)}</span>
                        ${report.isMaxCapped ? `<span class="offline-cap-badge">${t('offlineMaxCapNotice', '(Max 24h Capped)')}</span>` : ''}
                    </div>
                </div>

                <!-- Point Generators Card -->
                <div class="offline-stat-card">
                    <div class="offline-stat-icon">⚙️</div>
                    <div class="offline-stat-info">
                        <span class="offline-stat-label">${t('offlineGeneratorsLabel', 'Generative Sources')}</span>
                        <span class="offline-stat-value highlight-gold">+${formatNumber(report.generatorPoints)} Points</span>
                        <span class="offline-stat-subtext">(+${formatNumber(report.genPerSec)}/s)</span>
                    </div>
                </div>

                <!-- Autoclicker Card -->
                <div class="offline-stat-card">
                    <div class="offline-stat-icon">🤖</div>
                    <div class="offline-stat-info">
                        <span class="offline-stat-label">${t('offlineAutoclickLabel', 'Auto Clicker')}</span>
                        ${report.isAutoclickActive ? `
                            <span class="offline-stat-value highlight-purple">+${formatNumber(report.autoclickPoints)} Points</span>
                            <span class="offline-stat-subtext">(${formatNumber(report.totalAutoclicks)} clicks @ 5 CPS)</span>
                        ` : `
                            <span class="offline-stat-value muted-text">[ Off / Locked ]</span>
                            <span class="offline-stat-subtext">No autoclick earnings</span>
                        `}
                    </div>
                </div>
            </div>

            <!-- Total Earnings Accent Box -->
            <div class="offline-total-box">
                <span class="offline-total-label">${t('offlineTotalLabel', 'TOTAL OFFLINE EARNINGS')}</span>
                <span class="offline-total-value">+${formatNumber(report.totalOfflinePoints)} Points</span>
            </div>

            <!-- Claim Button -->
            <div class="offline-modal-actions">
                <button id="offline-claim-btn" class="click-btn primary-action-btn offline-claim-btn">
                    ${t('offlineClaimBtn', 'CLAIM GAINS! 🚀')}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Attach click handler to claim button
    const claimBtn = document.getElementById('offline-claim-btn');
    if (claimBtn) {
        claimBtn.addEventListener('click', () => {
            audioManager.playClickSFX();
            modalOverlay.classList.add('closing');
            setTimeout(() => {
                modalOverlay.remove();
                clearPendingOfflineReport();
            }, 300);
        });
    }
}
