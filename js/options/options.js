/**
 * ============================================================================
 * OPTIONS STATE & CONFIGURATION MANAGER
 * ============================================================================
 * Location: /js/options/options.js
 * Purpose: Manages user configurable settings (Audio, Particles, Auto-Save,
 *          BGM Soundtrack selection, Compact Number Format, Language) and
 *          persists them to LocalStorage.
 * ============================================================================
 */

import { audioManager } from '../audio/audioManager.js';

const OPTIONS_KEY = 'forever_incremental_options';

/**
 * System default option values
 */
export const DEFAULT_OPTIONS = {
    soundEnabled: true,       // Audio click sound effects toggle
    particlesEnabled: true,   // Background particle sparkle FX toggle
    autoSaveEnabled: true,    // Automatic background save toggle
    autoSaveInterval: 10000,  // Auto-save interval in milliseconds (10s)
    bgmTrack: 'track1',       // Active BGM soundtrack ('off' | 'track1' | 'track2' | 'track3')
    shortNumberFormat: true,  // Compact number notation format (1.50K, 2.30M, 4.10B, 10.00T...)
    language: 'en'            // Active display language ('en' | 'vi')
};

class OptionsManager {
    constructor() {
        this.options = { ...DEFAULT_OPTIONS };
        this.load();
    }

    /**
     * Load settings from LocalStorage
     */
    load() {
        try {
            const data = localStorage.getItem(OPTIONS_KEY);
            if (data) {
                this.options = { ...DEFAULT_OPTIONS, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('Failed to load options:', e);
        }
    }

    /**
     * Persist current settings to LocalStorage
     */
    save() {
        try {
            localStorage.setItem(OPTIONS_KEY, JSON.stringify(this.options));
        } catch (e) {
            console.error('Failed to save options:', e);
        }
    }

    /**
     * Get value for a given option key
     */
    get(key) {
        return this.options[key];
    }

    /**
     * Set value for an option key and apply changes
     */
    set(key, value) {
        this.options[key] = value;
        this.save();
        this.applySettings();
    }

    /**
     * Apply visual settings and trigger BGM update
     */
    applySettings() {
        if (this.options.particlesEnabled) {
            document.body.classList.remove('no-particles');
        } else {
            document.body.classList.add('no-particles');
        }

        // Update background music track playback
        audioManager.updateBGM();
    }
}

export const optionsManager = new OptionsManager();
