/**
 * ============================================================================
 * INFINITY TOWER SYSTEM (REBIRTH 5 ENDGAME EXPANSION)
 * ============================================================================
 * Location: /js/systems/tower.js
 * Purpose: Implements the infinite 2D RPG turn-based cosmic anomaly battler:
 *          - Sequential infinite floors with 1 cosmic Anomaly enemy per floor
 *          - Thematic planet emojis and procedural cosmic anomaly names
 *          - Floor 1 requires exactly 10 base clicks to defeat
 *          - Controlled soft-scaling formula for theoretically infinite floors
 *          - Boss floors every 10th floor with 3x HP and 1 defensive mechanic
 *            (Armor, Damage Reduction, or Dodge)
 *          - Normal floor rewards (0.1% Gen, 0.1% Click, 0.05% Stardust)
 *          - Boss floor rewards (1% Gen, 1% Click, 0.5% Stardust)
 *          - Stardust-purchased Tower Damage upgrades
 *          - Tickets system (10 max, 1 recovered every 15 minutes)
 *          - Tower Sweep (Floors 1 to Current - 5 at 25% reward yield)
 *          - Full integration with save/load, statistics, and global modifiers
 * ============================================================================
 */

import { stateManager } from '../core/state.js';
import { calculateClickReward } from '../upgrades/upgrades.js';
import { saveGame } from '../save/save.js';
import { audioManager } from '../audio/audioManager.js';
import { showNotification } from '../ui/notifications.js';
import { t } from '../i18n/i18n.js';
import { formatNumber } from '../utils/format.js';

export const TOWER_CONFIG = {
    MAX_TICKETS: 10,
    TICKET_RECOVERY_MS: 15 * 60 * 1000, // 15 minutes (900,000 ms)
    BASE_CLICKS_FLOOR_1: 10,
    NORMAL_REWARD_CLICK: 0.001,      // +0.1%
    NORMAL_REWARD_GEN: 0.001,        // +0.1%
    NORMAL_REWARD_STARDUST: 0.0005,  // +0.05%
    BOSS_REWARD_CLICK: 0.01,         // +1.0%
    BOSS_REWARD_GEN: 0.01,           // +1.0%
    BOSS_REWARD_STARDUST: 0.005,     // +0.5%
    SWEEP_RATE: 0.25,                // 25% yield for swept floors
    STARDUST_UPG_BASE_COST: 0.5,     // Stardust
    STARDUST_UPG_COST_SCALING: 2.2,
    DAMAGE_BONUS_PER_LEVEL: 0.25     // +25% per level
};

const PLANET_EMOJIS = ['🪐', '🌍', '🌕', '🌑', '☀️', '☄️', '🌌', '🛸', '🌋', '🧊', '⚡', '💥', '🌀'];

const NAME_PREFIXES = [
    'Chronos', 'Nebular', 'Primordial', 'Singularity', 'Event Horizon',
    'Glacial', 'Void', 'Tectonic', 'Supernova', 'Astral',
    'Hyper-Graviton', 'Pulsar', 'Dark Matter', 'Solar Flare', 'Temporal'
];

const NAME_CORES = [
    'Jovian', 'Terrestrial', 'Cryo-World', 'Molten Core', 'Protoplanet',
    'Exoplanet', 'Colossus', 'Phantom', 'Monolith', 'Vortex', 'Quasar', 'Leviathan'
];

const NAME_SUFFIXES_NORMAL = [
    'Anomaly', 'Remnant', 'Echo', 'Fragment', 'Wanderer', 'Aspect', 'Specter'
];

const NAME_SUFFIXES_BOSS = [
    'Sovereign', 'Overlord', 'Dominator', 'Cataclysm', 'Annihilator', 'Prime', 'Entity'
];

const ENEMY_ABILITIES = [
    { name: 'Gravitational Rupture', icon: '🌀' },
    { name: 'Temporal Shockwave', icon: '⏳' },
    { name: 'Supernova Flare', icon: '💥' },
    { name: 'Kinetic Meteor Impact', icon: '☄️' },
    { name: 'Cosmic Radiation Pulse', icon: '⚡' },
    { name: 'Dimensional Void Collapse', icon: '🌌' },
    { name: 'Tectonic Planetary Tremor', icon: '🌋' }
];

/**
 * Calculate player's unbuffed base Tower Click Damage (without crits or temporary multipliers)
 * Used to calibrate Floor 1 enemy HP.
 * @param {Object} [state]
 * @returns {number} Base damage
 */
export function getBasePlayerTowerDamage(state) {
    const currentState = state || stateManager.getState();
    const clickReward = calculateClickReward(currentState, false);
    const rawPower = clickReward ? clickReward.amount : 1;
    const upgLvl = (currentState.tower && currentState.tower.damageUpgradeLevel) || 0;
    const upgMult = getTowerDamageUpgradeMultiplier(upgLvl);
    const towerBonus = 1 + ((currentState.tower && currentState.tower.bonuses && currentState.tower.bonuses.clickPower) || 0);
    return Math.max(1, rawPower * upgMult * towerBonus);
}

/**
 * Calculate Tower Damage Upgrade multiplier
 * @param {number} level 
 * @returns {number} Multiplier
 */
export function getTowerDamageUpgradeMultiplier(level) {
    if (!level || level <= 0) return 1.0;
    // Diminishing returns after level 20 to preserve long-term tower challenge
    if (level <= 20) {
        return 1.0 + (level * TOWER_CONFIG.DAMAGE_BONUS_PER_LEVEL);
    }
    const baseMult = 1.0 + (20 * TOWER_CONFIG.DAMAGE_BONUS_PER_LEVEL); // 6.0x
    const extraLevels = level - 20;
    return baseMult + (Math.sqrt(extraLevels) * 0.5);
}

/**
 * Calculate Stardust cost for Tower Damage Upgrade at a given level
 * @param {number} level 
 * @returns {number} Stardust cost
 */
export function getTowerDamageUpgradeCost(level) {
    const currentLvl = level || 0;
    return TOWER_CONFIG.STARDUST_UPG_BASE_COST * Math.pow(TOWER_CONFIG.STARDUST_UPG_COST_SCALING, currentLvl);
}

/**
 * Calculate enemy Max HP for a specific floor
 * Controlled infinite scaling formula without overflow.
 * @param {number} floor 
 * @param {number} baseFloor1HP 
 * @returns {number} Max HP
 */
export function calculateEnemyMaxHp(floor, baseFloor1HP) {
    const f = Math.max(1, floor);
    const baseHp = Math.max(10, Math.round(baseFloor1HP || 10));
    if (f === 1) return baseHp;

    const isBoss = (f % 10 === 0);
    const targetNormalFloor = isBoss ? f - 1 : f;

    // Controlled smooth scaling formula
    // Floors 1-100: 1.12 per floor
    // Floors 101-500: 1.08 per floor
    // Floors 501-1500: 1.05 per floor
    // Floors 1501+: safe polynomial soft-scaling factor
    const tier1 = Math.min(targetNormalFloor - 1, 99);
    const tier2 = Math.max(0, Math.min(targetNormalFloor - 100, 400));
    const tier3 = Math.max(0, Math.min(targetNormalFloor - 500, 1000));
    const tier4 = Math.max(0, targetNormalFloor - 1500);

    let scale = Math.pow(1.12, tier1) * Math.pow(1.08, tier2) * Math.pow(1.05, tier3);

    if (tier4 > 0) {
        scale *= Math.pow(1 + (tier4 * 0.02), 2.5);
    }

    // Cap scale safely below IEEE 754 overflow limit (1e290)
    scale = Math.min(1e290, scale);

    let normalHp = Math.round(baseHp * scale);

    if (isBoss) {
        // Requirement 4: Boss HP = 3x HP of previous normal-floor enemy
        return Math.round(normalHp * 3);
    }

    return normalHp;
}

/**
 * Generate a new procedural Anomaly enemy for a given floor
 * @param {number} floor 
 * @param {Object} [state]
 * @returns {Object} Enemy object
 */
export function generateTowerEnemy(floor, state) {
    const currentState = state || stateManager.getState();
    const f = Math.max(1, floor);
    const isBoss = (f % 10 === 0);

    // Compute or retrieve base Floor 1 HP
    let baseFloor1HP = (currentState.tower && currentState.tower.floor1BaseHP);
    if (!baseFloor1HP || baseFloor1HP <= 0) {
        baseFloor1HP = Math.max(10, Math.round(TOWER_CONFIG.BASE_CLICKS_FLOOR_1 * getBasePlayerTowerDamage(currentState)));
    }

    const maxHp = calculateEnemyMaxHp(f, baseFloor1HP);

    // Randomize appearance
    const emoji = PLANET_EMOJIS[Math.floor(Math.random() * PLANET_EMOJIS.length)];
    const prefix = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)];
    const core = NAME_CORES[Math.floor(Math.random() * NAME_CORES.length)];
    const suffixList = isBoss ? NAME_SUFFIXES_BOSS : NAME_SUFFIXES_NORMAL;
    const suffix = suffixList[Math.floor(Math.random() * suffixList.length)];
    const name = `${prefix} ${core} ${suffix}`;

    // Defensive mechanics for Boss Floors (A: Armor, B: Damage Reduction, C: Dodge)
    let mechanic = null;
    let maxArmor = 0;
    let damageReduction = 0;
    let dodgeChance = 0;

    if (isBoss) {
        const roll = Math.random();
        if (roll < 0.34) {
            // A. Armor: 1-99% of max HP as temporary armor
            mechanic = 'armor';
            const armorRatio = 0.01 + (Math.random() * 0.98); // 1% to 99%
            maxArmor = Math.max(1, Math.round(maxHp * armorRatio));
        } else if (roll < 0.67) {
            // B. Damage Reduction: 20% to 50%
            mechanic = 'damage_reduction';
            damageReduction = Math.round((0.20 + (Math.random() * 0.30)) * 100) / 100; // 20% - 50%
        } else {
            // C. Dodge: 5% to 20% chance to dodge player attacks
            mechanic = 'dodge';
            dodgeChance = Math.round((0.05 + (Math.random() * 0.15)) * 100) / 100; // 5% - 20%
        }
    }

    return {
        floor: f,
        name,
        emoji,
        isBoss,
        maxHp,
        currentHp: maxHp,
        maxArmor,
        currentArmor: maxArmor,
        mechanic,
        damageReduction,
        dodgeChance,
        lastRetaliation: null
    };
}

/**
 * Process ticket recovery timer (called on game ticks, load, and UI updates)
 * Recovers 1 Ticket every 15 minutes up to MAX_TICKETS (10).
 * @param {Object} [state]
 * @returns {boolean} True if state updated
 */
export function updateTicketRecovery(state) {
    const currentState = state || stateManager.getState();
    const tower = currentState.tower;
    if (!tower) return false;

    const now = Date.now();
    const tickets = typeof tower.tickets === 'number' ? tower.tickets : TOWER_CONFIG.MAX_TICKETS;
    const maxTickets = tower.maxTickets || TOWER_CONFIG.MAX_TICKETS;

    if (tickets >= maxTickets) {
        if (tower.lastTicketRecoveryTime !== now) {
            tower.lastTicketRecoveryTime = now;
            return true;
        }
        return false;
    }

    const lastTime = tower.lastTicketRecoveryTime || now;
    const elapsed = Math.max(0, now - lastTime);
    const interval = TOWER_CONFIG.TICKET_RECOVERY_MS;
    const gained = Math.floor(elapsed / interval);

    if (gained > 0) {
        const newTickets = Math.min(maxTickets, tickets + gained);
        tower.tickets = newTickets;
        if (newTickets >= maxTickets) {
            tower.lastTicketRecoveryTime = now;
        } else {
            tower.lastTicketRecoveryTime = lastTime + (gained * interval);
        }
        stateManager.setState({ tower });
        return true;
    }

    return false;
}

/**
 * Get time remaining in ms until next Ticket recovery
 * @param {Object} [state]
 * @returns {number} Milliseconds remaining
 */
export function getNextTicketTimeRemaining(state) {
    const currentState = state || stateManager.getState();
    const tower = currentState.tower;
    if (!tower || tower.tickets >= (tower.maxTickets || TOWER_CONFIG.MAX_TICKETS)) {
        return 0;
    }
    const now = Date.now();
    const lastTime = tower.lastTicketRecoveryTime || now;
    const elapsed = Math.max(0, now - lastTime);
    const remaining = Math.max(0, TOWER_CONFIG.TICKET_RECOVERY_MS - (elapsed % TOWER_CONFIG.TICKET_RECOVERY_MS));
    return remaining;
}

/**
 * Ensure the active tower enemy is initialized and ready
 * @param {Object} [state]
 * @returns {Object} Enemy
 */
export function getOrInitTowerEnemy(state) {
    const currentState = state || stateManager.getState();
    let tower = currentState.tower;
    let needsStateCommit = false;

    if (!tower) {
        tower = {
            unlocked: (currentState.rebirthCount || 0) >= 5,
            currentFloor: 1,
            highestFloor: 1,
            damageUpgradeLevel: 0,
            tickets: TOWER_CONFIG.MAX_TICKETS,
            maxTickets: TOWER_CONFIG.MAX_TICKETS,
            lastTicketRecoveryTime: Date.now(),
            floor1BaseHP: 0,
            enemy: null,
            bonuses: { clickPower: 0, pointGen: 0, stardust: 0 },
            combatLog: []
        };
        needsStateCommit = true;
    }

    if (!tower.floor1BaseHP || tower.floor1BaseHP <= 0) {
        tower.floor1BaseHP = Math.max(10, Math.round(TOWER_CONFIG.BASE_CLICKS_FLOOR_1 * getBasePlayerTowerDamage(currentState)));
        needsStateCommit = true;
    }

    if (!tower.enemy || tower.enemy.currentHp <= 0 || tower.enemy.floor !== tower.currentFloor) {
        tower.enemy = generateTowerEnemy(tower.currentFloor, { ...currentState, tower });
        needsStateCommit = true;
    }

    if (needsStateCommit) {
        stateManager.setState({ tower });
    }

    return tower.enemy;
}

/**
 * Calculate player's current damage per click in Infinity Tower
 * Uses existing Click Power system, dedicated Tower Damage upgrade,
 * and permanent Tower bonuses.
 * @param {Object} state
 * @returns {Object} { damage, isCrit, isSuperCrit, superCritMult }
 */
export function calculatePlayerTowerDamage(state, isManual = false) {
    const clickReward = calculateClickReward(state, isManual);
    let damage = clickReward ? clickReward.amount : 1;

    // Apply Tower Damage upgrade multiplier
    const upgLevel = (state.tower && state.tower.damageUpgradeLevel) || 0;
    const upgMult = getTowerDamageUpgradeMultiplier(upgLevel);
    damage *= upgMult;

    return {
        damage,
        isCrit: clickReward ? clickReward.isCrit : false,
        isSuperCrit: clickReward ? clickReward.isSuperCrit : false,
        superCritMult: clickReward ? clickReward.superCritMult : 100
    };
}

let lastTowerAttackTime = 0;
const TOWER_ATTACK_THROTTLE_MS = 60;

/**
 * Execute player attack turn against the current Tower Anomaly
 * @returns {Object|null} Combat action result
 */
export function executeTowerAttack() {
    const now = Date.now();
    if (now - lastTowerAttackTime < TOWER_ATTACK_THROTTLE_MS) {
        return null;
    }
    lastTowerAttackTime = now;

    const state = stateManager.getState();
    const rebirthCount = state.rebirthCount || 0;
    if (rebirthCount < 5) {
        showNotification(t('towerLockedNotice', 'Infinity Tower requires Rebirth 5!'));
        return null;
    }

    updateTicketRecovery(state);

    const tower = state.tower || {};
    let enemy = getOrInitTowerEnemy(state);
    if (!enemy || enemy.currentHp <= 0) {
        enemy = generateTowerEnemy(tower.currentFloor || 1, state);
        tower.enemy = enemy;
    }

    const playerHit = calculatePlayerTowerDamage(state, true);
    let rawDamage = playerHit.damage;
    let effectiveDamage = rawDamage;
    let isDodged = false;
    let armorAbsorbed = 0;
    let hpDamage = 0;

    // Check Boss Dodge mechanic
    if (enemy.isBoss && enemy.mechanic === 'dodge' && enemy.dodgeChance > 0) {
        if (Math.random() < enemy.dodgeChance) {
            isDodged = true;
            effectiveDamage = 0;
        }
    }

    if (!isDodged) {
        // Check Boss Damage Reduction mechanic
        if (enemy.isBoss && enemy.mechanic === 'damage_reduction' && enemy.damageReduction > 0) {
            effectiveDamage *= (1 - enemy.damageReduction);
        }

        // Check Armor absorption
        if (enemy.currentArmor > 0) {
            if (effectiveDamage <= enemy.currentArmor) {
                armorAbsorbed = effectiveDamage;
                enemy.currentArmor -= effectiveDamage;
                hpDamage = 0;
            } else {
                armorAbsorbed = enemy.currentArmor;
                hpDamage = effectiveDamage - enemy.currentArmor;
                enemy.currentArmor = 0;
                enemy.currentHp = Math.max(0, enemy.currentHp - hpDamage);
            }
        } else {
            hpDamage = effectiveDamage;
            enemy.currentHp = Math.max(0, enemy.currentHp - hpDamage);
        }
    }

    // Update lifetime stats
    const stats = state.stats || {};
    stats.totalTowerAttacksMade = (stats.totalTowerAttacksMade || 0) + 1;
    if (enemy.isBoss && enemy.mechanic) {
        stats.totalTowerBossMechanicsEncountered = (stats.totalTowerBossMechanicsEncountered || 0) + 1;
    }
    stats.totalTowerDamageDealt = (stats.totalTowerDamageDealt || 0) + (isDodged ? 0 : effectiveDamage);
    if (enemy.isBoss) {
        stats.highestTowerBossHP = Math.max(stats.highestTowerBossHP || 0, enemy.maxHp);
    } else {
        stats.highestTowerEnemyHP = Math.max(stats.highestTowerEnemyHP || 0, enemy.maxHp);
    }

    // Audio SFX
    try {
        if (playerHit.isSuperCrit) {
            audioManager.playSuperCritSound();
        } else if (playerHit.isCrit) {
            audioManager.playCritSound();
        } else {
            audioManager.playClickSound();
        }
    } catch (e) {
        // Safe audio catch
    }

    const combatLog = Array.isArray(tower.combatLog) ? tower.combatLog : [];
    let logMessage = '';
    let isDefeated = (enemy.currentHp <= 0);
    let rewardGranted = null;

    if (isDodged) {
        logMessage = `💨 ${enemy.name} ${t('towerCombatDodged', 'evaded your attack!')}`;
    } else {
        const critTag = playerHit.isSuperCrit ? ` [SUPER CRIT ×${playerHit.superCritMult}!]` : (playerHit.isCrit ? ` [CRIT!]` : '');
        const armorTag = armorAbsorbed > 0 ? ` (🛡️ ${formatNumber(armorAbsorbed)} ${t('towerArmorAbsorbed', 'absorbed')})` : '';
        logMessage = `⚔️ ${t('towerCombatDealt', 'Dealt')} ${formatNumber(effectiveDamage)}${critTag}${armorTag} ${t('towerCombatTo', 'to')} ${enemy.name}`;
    }

    addCombatLogEntry(combatLog, logMessage, isDodged ? 'dodge' : (playerHit.isSuperCrit ? 'supercrit' : 'player'));

    let retaliationAbility = null;

    if (isDefeated) {
        // Enemy defeated!
        rewardGranted = awardFloorDefeatReward(tower, enemy, stats);
        const rewardLog = `🏆 ${t('towerDefeatedMsg', 'Defeated Floor')} ${enemy.floor}! ${t('towerRewardGained', 'Permanent bonus:')} +${rewardGranted.text}`;
        addCombatLogEntry(combatLog, rewardLog, 'reward');

        // Advance to next floor
        const nextFloor = (tower.currentFloor || 1) + 1;
        tower.currentFloor = nextFloor;
        tower.highestFloor = Math.max(tower.highestFloor || 1, nextFloor);
        stats.highestTowerFloor = Math.max(stats.highestTowerFloor || 1, nextFloor);

        // Generate next floor enemy with updated tower floor context
        const stateWithUpdatedTower = { ...state, tower };
        tower.enemy = generateTowerEnemy(nextFloor, stateWithUpdatedTower);

        try {
            audioManager.playRebirthSound();
        } catch (e) {}

        tower.combatLog = combatLog.slice(-20); // Keep last 20 messages

        // CRUCIAL: Commit state FIRST so pub/sub listeners and UI receive updated floor, enemy & bonuses
        stateManager.setState({ tower, stats });

        // Save progress to storage AFTER state is committed
        try {
            saveGame();
        } catch (e) {}
    } else {
        // Enemy turn response (retaliation)
        stats.totalTowerRetaliationsReceived = (stats.totalTowerRetaliationsReceived || 0) + 1;
        retaliationAbility = ENEMY_ABILITIES[Math.floor(Math.random() * ENEMY_ABILITIES.length)];
        enemy.lastRetaliation = retaliationAbility;
        const enemyLog = `${retaliationAbility.icon} ${enemy.name} ${t('towerEnemyRetaliates', 'unleashes')} ${retaliationAbility.name}!`;
        addCombatLogEntry(combatLog, enemyLog, 'enemy');

        tower.combatLog = combatLog.slice(-20); // Keep last 20 messages
        stateManager.setState({ tower, stats });
    }

    return {
        isDodged,
        damage: effectiveDamage,
        armorAbsorbed,
        hpDamage,
        isCrit: playerHit.isCrit,
        isSuperCrit: playerHit.isSuperCrit,
        superCritMult: playerHit.superCritMult,
        isDefeated,
        rewardGranted,
        retaliationAbility,
        enemyHp: enemy.currentHp,
        enemyMaxHp: enemy.maxHp,
        enemyArmor: enemy.currentArmor,
        enemyMaxArmor: enemy.maxArmor
    };
}

export const attackTowerEnemy = executeTowerAttack;

/**
 * Grant permanent stacking reward when an enemy is defeated
 * @param {Object} tower 
 * @param {Object} enemy 
 * @param {Object} stats 
 * @returns {Object} Granted reward info
 */
function awardFloorDefeatReward(tower, enemy, stats) {
    const isBoss = enemy.isBoss;
    tower.bonuses = tower.bonuses || { clickPower: 0, pointGen: 0, stardust: 0 };

    let rewardType = 'clickPower';
    let amount = 0;
    let text = '';

    // Weighted selection: 45% Click Power, 45% Point Gen, 10% Stardust Yield
    const roll = Math.random();
    if (isBoss) {
        stats.totalTowerBossesDefeated = (stats.totalTowerBossesDefeated || 0) + 1;
        stats.towerBossRewardsCount = (stats.towerBossRewardsCount || 0) + 1;

        if (roll < 0.45) {
            rewardType = 'clickPower';
            amount = TOWER_CONFIG.BOSS_REWARD_CLICK; // +1.0%
            text = '1.0% Click Power';
            stats.towerClickPowerBonusEarned = (stats.towerClickPowerBonusEarned || 0) + amount;
        } else if (roll < 0.90) {
            rewardType = 'pointGen';
            amount = TOWER_CONFIG.BOSS_REWARD_GEN;   // +1.0%
            text = '1.0% Point Generation';
            stats.towerPointGenBonusEarned = (stats.towerPointGenBonusEarned || 0) + amount;
        } else {
            rewardType = 'stardust';
            amount = TOWER_CONFIG.BOSS_REWARD_STARDUST; // +0.5%
            text = '0.5% Stardust Click Yield';
            stats.towerStardustBonusEarned = (stats.towerStardustBonusEarned || 0) + amount;
        }
    } else {
        stats.totalTowerFloorsDefeated = (stats.totalTowerFloorsDefeated || 0) + 1;
        stats.towerNormalRewardsCount = (stats.towerNormalRewardsCount || 0) + 1;

        if (roll < 0.45) {
            rewardType = 'clickPower';
            amount = TOWER_CONFIG.NORMAL_REWARD_CLICK; // +0.1%
            text = '0.1% Click Power';
            stats.towerClickPowerBonusEarned = (stats.towerClickPowerBonusEarned || 0) + amount;
        } else if (roll < 0.90) {
            rewardType = 'pointGen';
            amount = TOWER_CONFIG.NORMAL_REWARD_GEN;   // +0.1%
            text = '0.1% Point Generation';
            stats.towerPointGenBonusEarned = (stats.towerPointGenBonusEarned || 0) + amount;
        } else {
            rewardType = 'stardust';
            amount = TOWER_CONFIG.NORMAL_REWARD_STARDUST; // +0.05%
            text = '0.05% Stardust Click Yield';
            stats.towerStardustBonusEarned = (stats.towerStardustBonusEarned || 0) + amount;
        }
    }

    tower.bonuses[rewardType] = (tower.bonuses[rewardType] || 0) + amount;

    return { rewardType, amount, text, isBoss };
}

/**
 * Add an entry to the combat log
 * @param {Array} logArray 
 * @param {string} text 
 * @param {string} type 
 */
function addCombatLogEntry(logArray, text, type = 'info') {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    logArray.push({ text, type, timestamp });
    if (logArray.length > 25) {
        logArray.shift();
    }
}

/**
 * Purchase Tower Damage upgrade using Stardust
 * @returns {boolean} True if purchased
 */
export function purchaseTowerDamageUpgrade() {
    const state = stateManager.getState();
    const tower = state.tower || {};
    const currentLvl = tower.damageUpgradeLevel || 0;
    const cost = getTowerDamageUpgradeCost(currentLvl);
    const stardust = state.stardust || 0;

    if (stardust < cost) {
        showNotification(t('notEnoughStardust', 'Not enough Stardust!'));
        return false;
    }

    const newStardust = stardust - cost;
    const newLvl = currentLvl + 1;
    tower.damageUpgradeLevel = newLvl;

    const stats = state.stats || {};
    stats.towerStardustSpentOnDamage = (stats.towerStardustSpentOnDamage || 0) + cost;

    stateManager.setState({
        stardust: newStardust,
        tower,
        stats
    });

    try {
        audioManager.playUpgradeSound();
    } catch (e) {}

    showNotification(`Tower Damage Upgraded to Level ${newLvl}! (+${(newLvl * 25)}%)`);

    try {
        saveGame();
    } catch (e) {}
    return true;
}

/**
 * Check if the player can execute Tower Sweep
 * Requirements:
 * - Tickets >= 1
 * - Current floor >= 6 (can sweep Floors 1 to Current - 5)
 * @param {Object} [state]
 * @returns {boolean}
 */
export function canSweep(state) {
    const currentState = state || stateManager.getState();
    const tower = currentState.tower;
    if (!tower) return false;
    updateTicketRecovery(currentState);
    const tickets = typeof tower.tickets === 'number' ? tower.tickets : 10;
    const currentFloor = tower.currentFloor || 1;
    return (tickets >= 1) && (currentFloor >= 6);
}

/**
 * Get sweep preview summary (range of floors, boss count, expected 25% rewards)
 * @param {Object} [state]
 * @returns {Object} Preview details
 */
export function getSweepPreview(state) {
    const currentState = state || stateManager.getState();
    const tower = currentState.tower || {};
    const currentFloor = tower.currentFloor || 1;
    const maxSweepFloor = Math.max(0, currentFloor - 5);

    if (maxSweepFloor < 1) {
        return {
            canSweep: false,
            startFloor: 1,
            endFloor: 0,
            floorCount: 0,
            bossCount: 0,
            clickBonus: 0,
            genBonus: 0,
            stardustBonus: 0
        };
    }

    const floorCount = maxSweepFloor;
    let bossCount = 0;
    let normalCount = 0;

    for (let f = 1; f <= maxSweepFloor; f++) {
        if (f % 10 === 0) {
            bossCount++;
        } else {
            normalCount++;
        }
    }

    // Expected value at 25% yield
    // Normal: 45% +0.1%, 45% +0.1%, 10% +0.05% => avg per normal floor
    // Boss: 45% +1.0%, 45% +1.0%, 10% +0.5% => avg per boss floor
    const normalClick = normalCount * 0.45 * TOWER_CONFIG.NORMAL_REWARD_CLICK * TOWER_CONFIG.SWEEP_RATE;
    const normalGen = normalCount * 0.45 * TOWER_CONFIG.NORMAL_REWARD_GEN * TOWER_CONFIG.SWEEP_RATE;
    const normalStardust = normalCount * 0.10 * TOWER_CONFIG.NORMAL_REWARD_STARDUST * TOWER_CONFIG.SWEEP_RATE;

    const bossClick = bossCount * 0.45 * TOWER_CONFIG.BOSS_REWARD_CLICK * TOWER_CONFIG.SWEEP_RATE;
    const bossGen = bossCount * 0.45 * TOWER_CONFIG.BOSS_REWARD_GEN * TOWER_CONFIG.SWEEP_RATE;
    const bossStardust = bossCount * 0.10 * TOWER_CONFIG.BOSS_REWARD_STARDUST * TOWER_CONFIG.SWEEP_RATE;

    return {
        canSweep: canSweep(currentState),
        startFloor: 1,
        endFloor: maxSweepFloor,
        floorCount,
        bossCount,
        clickBonus: normalClick + bossClick,
        genBonus: normalGen + bossGen,
        stardustBonus: normalStardust + bossStardust
    };
}

/**
 * Execute Tower Sweep
 * Deducts 1 Ticket, sweeps completed floors 1 to Current - 5,
 * grants 25% of the normal & boss rewards, updates stats, and saves progress.
 * @returns {Object|null} Sweep results
 */
export function executeSweep() {
    const state = stateManager.getState();
    if (!canSweep(state)) {
        showNotification(t('cannotSweepNotice', 'Cannot sweep: Require at least 1 Ticket and Floor 6+!'));
        return null;
    }

    const tower = state.tower || {};
    const tickets = tower.tickets || 0;
    const currentFloor = tower.currentFloor || 1;
    const maxSweepFloor = currentFloor - 5;

    // Deduct 1 Ticket
    tower.tickets = Math.max(0, tickets - 1);
    tower.bonuses = tower.bonuses || { clickPower: 0, pointGen: 0, stardust: 0 };

    const stats = state.stats || {};
    stats.totalTowerTicketsUsed = (stats.totalTowerTicketsUsed || 0) + 1;
    stats.totalTowerFloorsSwept = (stats.totalTowerFloorsSwept || 0) + maxSweepFloor;

    let totalGainedClick = 0;
    let totalGainedGen = 0;
    let totalGainedStardust = 0;
    let bossCount = 0;
    let normalCount = 0;

    for (let f = 1; f <= maxSweepFloor; f++) {
        const isBoss = (f % 10 === 0);
        const roll = Math.random();

        if (isBoss) {
            bossCount++;
            if (roll < 0.45) {
                totalGainedClick += (TOWER_CONFIG.BOSS_REWARD_CLICK * TOWER_CONFIG.SWEEP_RATE);
            } else if (roll < 0.90) {
                totalGainedGen += (TOWER_CONFIG.BOSS_REWARD_GEN * TOWER_CONFIG.SWEEP_RATE);
            } else {
                totalGainedStardust += (TOWER_CONFIG.BOSS_REWARD_STARDUST * TOWER_CONFIG.SWEEP_RATE);
            }
        } else {
            normalCount++;
            if (roll < 0.45) {
                totalGainedClick += (TOWER_CONFIG.NORMAL_REWARD_CLICK * TOWER_CONFIG.SWEEP_RATE);
            } else if (roll < 0.90) {
                totalGainedGen += (TOWER_CONFIG.NORMAL_REWARD_GEN * TOWER_CONFIG.SWEEP_RATE);
            } else {
                totalGainedStardust += (TOWER_CONFIG.NORMAL_REWARD_STARDUST * TOWER_CONFIG.SWEEP_RATE);
            }
        }
    }

    // Apply accumulated 25% rewards
    tower.bonuses.clickPower = (tower.bonuses.clickPower || 0) + totalGainedClick;
    tower.bonuses.pointGen = (tower.bonuses.pointGen || 0) + totalGainedGen;
    tower.bonuses.stardust = (tower.bonuses.stardust || 0) + totalGainedStardust;

    stats.towerClickPowerBonusEarned = (stats.towerClickPowerBonusEarned || 0) + totalGainedClick;
    stats.towerPointGenBonusEarned = (stats.towerPointGenBonusEarned || 0) + totalGainedGen;
    stats.towerStardustBonusEarned = (stats.towerStardustBonusEarned || 0) + totalGainedStardust;

    const combatLog = Array.isArray(tower.combatLog) ? tower.combatLog : [];
    const sweepMsg = `🚀 ${t('towerSweepExecuted', 'Swept Floors 1 to')} ${maxSweepFloor} (${maxSweepFloor} ${t('towerFloorsWord', 'floors')}, ${bossCount} ${t('towerBossesWord', 'bosses')}): +${(totalGainedClick * 100).toFixed(3)}% Click, +${(totalGainedGen * 100).toFixed(3)}% Gen, +${(totalGainedStardust * 100).toFixed(4)}% Stardust`;
    addCombatLogEntry(combatLog, sweepMsg, 'sweep');
    tower.combatLog = combatLog.slice(-20);

    stateManager.setState({ tower, stats });
    try {
        audioManager.playRebirthSound();
    } catch (e) {}
    try {
        saveGame();
    } catch (e) {}

    return {
        startFloor: 1,
        endFloor: maxSweepFloor,
        floorCount: maxSweepFloor,
        bossCount,
        gainedClick: totalGainedClick,
        gainedGen: totalGainedGen,
        gainedStardust: totalGainedStardust,
        remainingTickets: tower.tickets
    };
}
