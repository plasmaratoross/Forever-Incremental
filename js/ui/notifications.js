/**
 * ============================================================================
 * NOTIFICATION TOAST COMPONENT
 * ============================================================================
 * Location: /js/ui/notifications.js
 * Purpose: Renders floating toast notifications overlay messages.
 * ============================================================================
 */

/**
 * Display a temporary toast notification message on screen
 * @param {string} message - Notification text message
 */
export function showNotification(message) {
    const container = document.getElementById('notifications-container');
    if (!container) return;

    // Create toast DOM element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        color: #000000;
        font-weight: 700;
        padding: 0.8rem 1.4rem;
        margin-top: 0.6rem;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(255,255,255,0.4);
        backdrop-filter: blur(8px);
        transition: opacity 0.3s ease;
    `;

    container.appendChild(toast);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
