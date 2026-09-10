/**
 * ============================================================================
 * GLOBAL STATE MANAGER
 * ============================================================================
 * Location: /js/core/state.js
 * Purpose: Centralized reactive state container implementing the observer (pub/sub)
 *          pattern. Notifies UI components whenever state changes.
 * ============================================================================
 */

import { INITIAL_STATE } from './constants.js';

class StateManager {
    constructor() {
        this.state = { ...INITIAL_STATE };
        this.listeners = [];
    }

    /**
     * Get read-only snapshot of current state
     */
    getState() {
        return this.state;
    }

    /**
     * Update global state with partial object and notify subscribers
     * @param {Object} newState - Partial state object to merge
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    /**
     * Subscribe a listener callback function to state updates
     * @param {Function} listener - Callback function receiving (state)
     */
    subscribe(listener) {
        this.listeners.push(listener);
    }

    /**
     * Broadcast current state to all active subscriber listeners
     */
    notify() {
        this.listeners.forEach((listener) => listener(this.state));
    }
}

export const stateManager = new StateManager();
