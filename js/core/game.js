/**
 * ============================================================================
 * MAIN GAME LOOP & ENGINE
 * ============================================================================
 * Location: /js/core/game.js
 * Purpose: Manages interval tickers for passive resource generation and auto-save.
 * ============================================================================
 */

import { GAME_CONFIG } from './constants.js';
import { stateManager } from './state.js';
import { processCurrencyTick } from '../systems/currency.js';
import { autoSaveGame } from '../save/save.js';
import { tickCosmicEventsEngine, getCurrentEventGameSpeedMult, getCurrentEventAutoclickSpeedMult } from '../systems/cosmicEvents.js';
import { handleAutoclick } from '../systems/click.js';
import { updateTicketRecovery } from '../systems/tower.js';

export class GameEngine {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.autoclickAccumulator = 0;
    }

    /**
     * Start game loop ticker and background auto-save timer
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        // Main game ticker running every TICK_RATE ms
        this.intervalId = setInterval(() => {
            this.tick();
        }, GAME_CONFIG.TICK_RATE);

        // Enable auto-save timer
        autoSaveGame();
        console.log(`${GAME_CONFIG.TITLE} Engine Started.`);
    }

    /**
     * Stop game engine ticker
     */
    stop() {
        if (!this.isRunning) return;
        this.isRunning = false;
        clearInterval(this.intervalId);
    }

    /**
     * Execute a single game tick
     */
    tick() {
        // 1. Process Cosmic Events engine tick (rolls, timers, active durations)
        tickCosmicEventsEngine();

        // 2. Process passive currency/points ticks
        processCurrencyTick(stateManager);

        // 3. Process Autoclick ticks (5 clicks/sec base = 200ms per click)
        // Autoclick speed is scaled by only 10% of overall game speed changes (1 + 0.10 * (totalSpeed - 1))
        const state = stateManager.getState();
        const debugSpeed = state.debugGameSpeed || 1.0;
        const eventSpeed = getCurrentEventGameSpeedMult();
        const eventAutoclickMult = getCurrentEventAutoclickSpeedMult();
        const totalGameSpeed = debugSpeed * eventSpeed;
        const autoclickSpeed = (1.0 + 0.10 * (totalGameSpeed - 1.0)) * eventAutoclickMult;

        if (state.autoclickEnabled) {
            this.autoclickAccumulator += GAME_CONFIG.TICK_RATE * autoclickSpeed;
            let autoclickCount = 0;
            while (this.autoclickAccumulator >= 200) {
                this.autoclickAccumulator -= 200;
                autoclickCount++;
            }
            if (autoclickCount > 0) {
                handleAutoclick(autoclickCount);
            }
        } else {
            this.autoclickAccumulator = 0;
        }

        // 4. Update Tower Ticket recovery timer if Rebirth 5+ reached
        if ((state.rebirthCount || 0) >= 5) {
            updateTicketRecovery(state);
        }

        // 5. Accumulate active playtime and track highest PPS record
        const deltaSec = (GAME_CONFIG.TICK_RATE / 1000) * totalGameSpeed;
        const currentStats = state.stats || {};
        const currentPlaytime = currentStats.playtime || 0;
        
        const now = Date.now();
        if (!this.lastPPSCheckTime) {
            this.lastPPSCheckTime = now;
            this.lastCurrencySnapshot = state.currency || 0;
        }
        
        let newHighestPPS = currentStats.highestPPS || 0;
        const timeDiffSec = (now - this.lastPPSCheckTime) / 1000;
        if (timeDiffSec >= 1.0) {
            const gainedCurrency = Math.max(0, (state.currency || 0) - this.lastCurrencySnapshot);
            const currentCalculatedPPS = gainedCurrency / timeDiffSec;
            if (currentCalculatedPPS > newHighestPPS) {
                newHighestPPS = currentCalculatedPPS;
            }
            this.lastPPSCheckTime = now;
            this.lastCurrencySnapshot = state.currency || 0;
        }

        stateManager.setState({
            stats: {
                ...currentStats,
                playtime: currentPlaytime + deltaSec,
                highestPPS: newHighestPPS
            }
        });
    }
}

export const gameEngine = new GameEngine();
