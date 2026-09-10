/**
 * ============================================================================
 * BACKGROUND MUSIC & AUDIO MANAGER
 * ============================================================================
 * Location: /js/audio/audioManager.js
 * Purpose: Manages background music (BGM) playback across all webpages, track
 *          switching, audio looping, and click sound FX.
 * ============================================================================
 */

import { optionsManager } from '../options/options.js';

class AudioManager {
    constructor() {
        this.bgmAudio = new Audio();
        this.bgmAudio.loop = true;
        this.currentTrack = null;

        // User interaction listener to satisfy browser autoplay policies
        this.hasInteracted = false;
        this.bindAutoplayHandler();
    }

    /**
     * Bind click listener to resume BGM after user first interacts with page
     */
    bindAutoplayHandler() {
        const unlockAudio = () => {
            if (!this.hasInteracted) {
                this.hasInteracted = true;
                this.updateBGM();
                window.removeEventListener('click', unlockAudio);
                window.removeEventListener('keydown', unlockAudio);
            }
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
    }

    /**
     * Get path to BGM audio file depending on current page URL
     */
    getTrackUrl(trackKey) {
        const isSubPage = window.location.pathname.toLowerCase().includes('/pages/');
        const basePath = isSubPage ? '../assets/sounds/bgm/' : 'assets/sounds/bgm/';
        return `${basePath}${trackKey}.wav`;
    }

    /**
     * Update BGM playback based on current options setting ('off' | 'track1' | 'track2' | 'track3')
     */
    updateBGM() {
        const selectedTrack = optionsManager.get('bgmTrack') || 'track1';

        if (selectedTrack === 'off') {
            this.stopBGM();
            return;
        }

        // If track changed or audio is paused, switch/start playback
        if (this.currentTrack !== selectedTrack) {
            this.currentTrack = selectedTrack;
            this.bgmAudio.src = this.getTrackUrl(selectedTrack);
            this.bgmAudio.volume = 0.4;
            
            if (this.hasInteracted) {
                this.bgmAudio.play().catch((err) => {
                    console.log('Autoplay deferred until user interaction:', err);
                });
            }
        } else if (this.bgmAudio.paused && this.hasInteracted) {
            this.bgmAudio.play().catch(() => {});
        }
    }

    /**
     * Stop background music playback
     */
    stopBGM() {
        this.bgmAudio.pause();
        this.currentTrack = 'off';
    }

    /**
     * Play subtle click sound FX for UI buttons
     */
    playClickSFX() {
        if (!optionsManager.get('soundEnabled')) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        } catch (e) {
            // Ignore audio context errors
        }
    }
}

export const audioManager = new AudioManager();

