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

    /**
     * Alias for playClickSFX
     */
    playClickSound() {
        this.playClickSFX();
    }

    /**
     * Play crisp critical strike sound FX
     */
    playCritSound() {
        if (!optionsManager.get('soundEnabled')) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(650, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.09);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.09);
        } catch (e) {
            // Ignore audio context errors
        }
    }

    /**
     * Play resonant Super Crit sound FX
     */
    playSuperCritSound() {
        if (!optionsManager.get('soundEnabled')) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;

            // Low thump
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(220, now);
            osc1.frequency.exponentialRampToValueAtTime(110, now + 0.18);
            gain1.gain.setValueAtTime(0.20, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.18);

            // High shimmer
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1200, now);
            osc2.frequency.exponentialRampToValueAtTime(2400, now + 0.18);
            gain2.gain.setValueAtTime(0.15, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now);
            osc2.stop(now + 0.18);
        } catch (e) {
            // Ignore audio context errors
        }
    }

    /**
     * Play ascending arpeggio chime for Rebirth / Tower Floor Clear
     */
    playRebirthSound() {
        if (!optionsManager.get('soundEnabled')) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + (idx * 0.06);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.15, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.22);
            });
        } catch (e) {
            // Ignore audio context errors
        }
    }

    /**
     * Alias for playRebirthSound
     */
    playRebirthSFX() {
        this.playRebirthSound();
    }

    /**
     * Play upgrade purchase sound FX
     */
    playUpgradeSound() {
        if (!optionsManager.get('soundEnabled')) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {
            // Ignore audio context errors
        }
    }

    /**
     * Play achievement milestone SFX
     */
    playAchievementSFX() {
        if (!optionsManager.get('soundEnabled')) return;

        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;
            const freqs = [587.33, 880.00]; // D5, A5

            freqs.forEach((f, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const startTime = now + (idx * 0.08);

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, startTime);

                gain.gain.setValueAtTime(0.18, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.28);
            });
        } catch (e) {
            // Ignore audio context errors
        }
    }
}

export const audioManager = new AudioManager();

