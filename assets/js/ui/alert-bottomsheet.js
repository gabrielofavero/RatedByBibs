/**
 * Alert Bottomsheet — shared UI for confirm and error dialogs.
 *
 * Usage:
 *   import { showConfirm, showError } from "./alert-bottomsheet.js";
 *
 *   // Confirm dialog (returns a Promise that resolves to true/false)
 *   const confirmed = await showConfirm("Are you sure you want to restart?");
 *
 *   // Error dialog (one-button dismiss)
 *   showError("Something went wrong. Please try again.");
 */

const ALERT_OVERLAY = document.getElementById('alert-overlay');
const ALERT_SHEET = document.getElementById('alert-bottomsheet');
const ALERT_ICON = document.getElementById('alert-icon');
const ALERT_MESSAGE = document.getElementById('alert-message');
const ALERT_BUTTONS = document.getElementById('alert-buttons');

let _resolvePromise = null;

/**
 * Show a confirm dialog with Cancel / Confirm buttons.
 * Returns a Promise that resolves to `true` if the user confirmed, `false` otherwise.
 *
 * @param {string} message - The message to display
 * @param {Object} [options]
 * @param {string} [options.confirmLabel] - Text for the confirm button (default: "Confirm")
 * @param {string} [options.cancelLabel]  - Text for the cancel button (default: "Cancel")
 * @param {string} [options.confirmStyle] - Button style: "primary" (default) or "danger"
 * @returns {Promise<boolean>}
 */
export function showConfirm(message, options = {}) {
    const {
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        confirmStyle = 'primary'
    } = options;

    return new Promise((resolve) => {
        // If already open, resolve the previous one as false
        if (_resolvePromise) {
            _resolvePromise(false);
        }
        _resolvePromise = resolve;

        // Set icon (warning/check style)
        ALERT_ICON.classList.remove('error-icon');
        ALERT_ICON.classList.add('warning-icon');
        ALERT_ICON.querySelector('use').setAttribute('href', '#icon-star');

        // Set message
        ALERT_MESSAGE.textContent = message;

        // Set buttons
        ALERT_BUTTONS.innerHTML = `
            <button id="alert-cancel" class="alert-btn secondary">${cancelLabel}</button>
            <button id="alert-confirm" class="alert-btn ${confirmStyle}">${confirmLabel}</button>
        `;

        // Wire events
        document.getElementById('alert-cancel').addEventListener('click', () => closeAlert(false));
        document.getElementById('alert-confirm').addEventListener('click', () => closeAlert(true));

        // Open
        openAlert();
    });
}

/**
 * Show an error dialog with a single dismiss button.
 *
 * @param {string} message - The error message to display
 * @param {Object} [options]
 * @param {string} [options.buttonLabel] - Text for the dismiss button (default: "OK")
 * @param {Function} [options.onDismiss]  - Optional callback when dismissed
 */
export function showError(message, options = {}) {
    const {
        buttonLabel = 'OK',
        onDismiss = null
    } = options;

    // If a confirm is pending, resolve it as false
    if (_resolvePromise) {
        _resolvePromise(false);
        _resolvePromise = null;
    }

    // Set icon (error style)
    ALERT_ICON.classList.add('error-icon');
    ALERT_ICON.classList.remove('warning-icon');
    ALERT_ICON.querySelector('use').setAttribute('href', '#icon-none');

    // Set message
    ALERT_MESSAGE.textContent = message;

    // Set single dismiss button
    ALERT_BUTTONS.innerHTML = `
        <button id="alert-dismiss" class="alert-btn primary">${buttonLabel}</button>
    `;

    // Wire event
    document.getElementById('alert-dismiss').addEventListener('click', () => {
        closeAlert(false);
        if (onDismiss) onDismiss();
    });

    // Open
    openAlert();
}

function openAlert() {
    ALERT_OVERLAY.classList.add('active');
    ALERT_SHEET.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close on overlay click
    ALERT_OVERLAY.onclick = () => closeAlert(false);
}

function closeAlert(confirmed) {
    ALERT_OVERLAY.classList.remove('active');
    ALERT_SHEET.classList.remove('active');
    ALERT_OVERLAY.onclick = null;
    document.body.style.overflow = '';

    if (_resolvePromise) {
        _resolvePromise(confirmed);
        _resolvePromise = null;
    }
}
