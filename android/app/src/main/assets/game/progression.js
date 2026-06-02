/* ===== Block Blast — Full Progression System =====
   Coins, XP, Levels, Achievements, Case/Outfit/Weapon Upgrades, Premium Gems
*/
(function() {
  'use strict';

  const SAVE_KEY = 'bb_progress';
  const DAILY_KEY = 'bb_daily_bonus';

  // ─── Upgrade Tiers: Case / Outfit / Weapon ──────────
  const UPGRADE_TIERS = {
    case: {
      name: 'Case',
      icon: '📦',
      maxLevel: 5,
      baseCost: 1000,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: 'Basic Tray',       bonus: { gridBonus: 0,  rowBonus: 0 },    gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Wooden Board',     bonus: { gridBonus: 1,  rowBonus: 5 },    gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Steel Frame',      bonus: { gridBonus: 2,  rowBonus: 15 },   gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Neon Grid',        bonus: { gridBonus: 3,  rowBonus: 30 },   gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Crystal Matrix',   bonus: { gridBonus: 4,  rowBonus: 50 },   gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '💎 Void Board',    bonus: { gridBonus: 6,  rowBonus: 100 },  gemReq: 500, coinsReq: 20000 },
      ]
    },
    outfit: {
      name: 'Outfit',
      icon: '👕',
      maxLevel: 5,
      baseCost: 600,
      costMultiplier: 2,
      gemCost: 40,
      levels: [
        { level: 0, name: 'Plain Shirt',       bonus: { comboBonus: 0,  extraSlot: 0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Arcade Vest',       bonus: { comboBonus: 5,  extraSlot: 0 },   gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Neon Jacket',       bonus: { comboBonus: 10, extraSlot: 0 },   gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Phantom Hoodie',    bonus: { comboBonus: 15, extraSlot: 1 },   gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Crystal Blazer',    bonus: { comboBonus: 25, extraSlot: 1 },   gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Phoenix Coat',   bonus: { comboBonus: 40, extraSlot: 2 },   gemReq: 350, coinsReq: 12000 },
      ]
    },
    weapon: {
      name: 'Weapon',
      icon: '⚔️',
      maxLevel: 5,
      baseCost: 800,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: 'Wooden Mallet',    bonus: { scoreMult: 1.0, clearBonus: 0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Stone Hammer',     bonus: { scoreMult: 1.1, clearBonus: 10 },  gemReq: 50,  coinsReq: 800 },
        { level: 2, name: 'Iron Sledge',      bonus: { scoreMult: 1.2, clearBonus: 25 },  gemReq: 80,  coinsReq: 1600 },
        { level: 3, name: 'Steel Crusher',    bonus: { scoreMult: 1.35, clearBonus: 50 }, gemReq: 120, coinsReq: 3200 },
        { level: 4, name: 'Neon Laser Blade', bonus: { scoreMult: 1.5, clearBonus: 80 },  gemReq: 200, coinsReq: 6400 },
        { level: 5, name: '⚡ Void Devourer', bonus: { scoreMult: 2.0, clearBonus: 150 }, gemReq: 500, coinsReq: 16000 },
      ]
    }
  };

  // ─── Premium Items (REAL MONEY ONLY) ────────────────
  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_void',       name: 'Void Walker',    desc: 'Dark matter block skin',           price: 4.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_cosmic',     name: 'Cosmic Edge',    desc: 'Galaxy-themed blocks',              price: 6.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
      { id: 'lg_flame',      name: 'Inferno Fury',   desc: 'Living flame blocks',               price: 8.99,  gemPrice: 0,    tier: 'legendary', type: 'weapon_skin' },
    ],
    premiumCases: [
      { id: 'pc_royal',      name: 'Royal Pass',     desc: '7 days: 2x coins + 50 gems/day',    price: 4.99,  gemPrice: 0,    type: 'subscription', duration: '7d' },
      { id: 'pc_vip',        name: 'VIP Status',     desc: '30 days: 3x coins + 100 gems/day',  price: 12.99, gemPrice: 0,    type: 'subscription', duration: '30d' },
    ],
    bundles: [
      { id: 'bundle_starter',  name: 'Starter Bundle',   desc: '200 gems + 5 bombs + 5 shuffles',           price: 2.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_mega',     name: 'Mega Power Pack',  desc: '500 gems + 20 bombs + neon theme',          price: 7.99,  gemPrice: 0,    type: 'one_time' },
      { id: 'bundle_ultimate', name: 'Ultimate Bundle',  desc: '2000 gems + all themes + legendary skin',   price: 19.99, gemPrice: 0,    type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  // ─── Gem Packs ──────────────────────────────────────
  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',         gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack',      gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',         gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',          gems: 4000, price: 19.99, bonus: 1000, popular: false },
    { id: 'gems_ultra',  name: '🐳 Whale Pack',          gems: 10000,price: 39.99, bonus: 5000, popular: false },
  ];

  // ─── Shop Catalog (coin-based) ──────────────────────
  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Classic Dark',   price: 0,    desc: 'The original dark theme',          colors: { bg: '#0f1020', accent: '#1a1a2e' } },
      { id: 'wooden',    name: 'Wooden Cabin',   price: 500,  desc: 'Warm wooden tones',                colors: { bg: '#1a1208', accent: '#3a2815' } },
      { id: 'neon',      name: 'Neon Nights',    price: 800,  desc: 'Bright neon on dark purple',       colors: { bg: '#1a0030', accent: '#2a0050' } },
      { id: 'candy',     name: 'Candy Land',     price: 1000, desc: 'Sweet candy colors',               colors: { bg: '#2a0a1a', accent: '#3a1525' } },
      { id: 'dark',      name: 'Dark Void',      price: 1500, desc: 'Deep void black',                  colors: { bg: '#000005', accent: '#0a0a15' } },
      { id: 'ocean',     name: 'Ocean Blue',     price: 2000, desc: 'Calming ocean blues',              colors: { bg: '#023047', accent: '#0a4a6e' } },
      { id: 'sunset',    name: 'Sunset Glow',    price: 3000, desc: 'Warm sunset orange & pink',        colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'royal',     name: 'Royal Gold',     price: 5000, desc: 'Gold & royal purple',             colors: { bg: '#1a0030', accent: '#3a1050' } },
    ],
    pieceStyles: [
      { id: 'classic',    name: 'Classic Blocks', price: 0,    desc: 'Original block style',        borderRadius: 0, glow: false },
      { id: 'rounded',    name: 'Rounded Gems',   price: 600,  desc: 'Smooth rounded blocks',       borderRadius: 6, glow: false },
      { id: 'glow',       name: 'Glow Effect',    price: 1200, desc: 'Blocks with subtle glow',    borderRadius: 3, glow: true },
      { id: 'glass',      name: 'Glass Panels',   price: 2000, desc: 'Semi-transparent glass look', borderRadius: 4, glow: true },
      { id: 'neon_edge',  name: 'Neon Edge',      price: 3500, desc: 'Neon-outlined blocks',        borderRadius: 2, glow: true },
    ],
    powerupPacks: [
      { id: 'starter',   name: 'Starter Pack',   price: 200,  items: { bomb: 3, shuffle: 3, reshuffle: 3 },  desc: '3 of each power-up' },
      { id: 'bomber',    name: 'Bomb Bundle',    price: 300,  items: { bomb: 8 },                           desc: '8 bombs' },
      { id: 'reshuffler',name: 'Reshuffle Pack', price: 400,  items: { reshuffle: 8 },                      desc: '8 reshuffles' },
      { id: 'mega',      name: 'Mega Bundle',    price: 1000, items: { bomb: 10, reshuffle: 10 },            desc: '10 of each power-up' },
    ],
    boosters: [
      { id: 'score_x2',     name: 'Score Booster',   price: 500,  desc: '2x score for next game',       effect: 'scoreMultiplier:2' },
      { id: 'extra_row',    name: 'Row Boost',       price: 800,  desc: 'Auto-clear bottom row once',   effect: 'autoClear:row_full' },
      { id: 'blockade',     name: 'Blockade Shield',  price: 600,  desc: 'First block placement is free', effect: 'freePlace:1' },
    ],
  };

  // ─── Achievements ──────────────────────────────────
  const ACHIEVEMENTS = [
    { id: 'first_play',      name: 'First Steps',      desc: 'Play your first game',                reward: { coins: 50, gems: 0 },    icon: '🎮',  check: p => p.totalPlays >= 1 },
    { id: 'score_100',       name: 'Century',          desc: 'Score 100 in one game',               reward: { coins: 100, gems: 0 },   icon: '💯',  check: p => p.bestScore >= 100 },
    { id: 'score_500',       name: 'High Roller',      desc: 'Score 500 in one game',               reward: { coins: 250, gems: 0 },   icon: '🎯',  check: p => p.bestScore >= 500 },
    { id: 'score_1000',      name: 'Four Digits',      desc: 'Score 1000 in one game',              reward: { coins: 500, gems: 5 },   icon: '🏆',  check: p => p.bestScore >= 1000 },
    { id: 'score_2000',      name: 'Block Master',     desc: 'Score 2000 in one game',              reward: { coins: 1000, gems: 10 }, icon: '👑',  check: p => p.bestScore >= 2000 },
    { id: 'score_5000',      name: 'Grandmaster',      desc: 'Score 5000 in one game',              reward: { coins: 2000, gems: 25 }, icon: '🌟',  check: p => p.bestScore >= 5000 },
    { id: 'score_10000',     name: 'Legend',           desc: 'Score 10000 in one game',             reward: { coins: 5000, gems: 50 }, icon: '🏅',  check: p => p.bestScore >= 10000 },
    { id: 'rows_10',         name: 'Row Starter',      desc: 'Clear 10 rows total',                 reward: { coins: 100, gems: 0 },   icon: '📏',  check: p => p.totalRows >= 10 },
    { id: 'rows_100',        name: 'Row Runner',       desc: 'Clear 100 rows total',                reward: { coins: 300, gems: 5 },   icon: '📐',  check: p => p.totalRows >= 100 },
    { id: 'rows_500',        name: 'Row Master',       desc: 'Clear 500 rows total',                reward: { coins: 800, gems: 15 },  icon: '📊',  check: p => p.totalRows >= 500 },
    { id: 'rows_1000',       name: 'Block Legend',     desc: 'Clear 1000 rows total',               reward: { coins: 2000, gems: 30 }, icon: '💠',  check: p => p.totalRows >= 1000 },
    { id: 'combo_2',         name: 'Double Row',       desc: 'Clear 2 rows at once',                reward: { coins: 100, gems: 0 },   icon: '2️⃣',  check: p => p.bestCombo >= 2 },
    { id: 'combo_3',         name: 'Triple Threat',    desc: 'Clear 3 rows at once',                reward: { coins: 300, gems: 5 },   icon: '3️⃣',  check: p => p.bestCombo >= 3 },
    { id: 'combo_4',         name: 'Perfect Grid',     desc: 'Clear 4 rows at once',                reward: { coins: 1000, gems: 15 }, icon: '4️⃣',  check: p => p.bestCombo >= 4 },
    { id: 'combo_5',         name: 'Grid Storm',       desc: 'Clear 5+ rows at once',               reward: { coins: 2000, gems: 25 }, icon: '💥',  check: p => p.bestCombo >= 5 },
    { id: 'streak_3',        name: '3-Day Streak',     desc: 'Play 3 days in a row',                reward: { coins: 200, gems: 0 },   icon: '🔥',  check: p => p.bestStreak >= 3 },
    { id: 'streak_7',        name: 'Week Warrior',     desc: 'Play 7 days in a row',                reward: { coins: 500, gems: 10 },  icon: '📅',  check: p => p.bestStreak >= 7 },
    { id: 'streak_14',       name: 'Fortnight Champion', desc: 'Play 14 days in a row',              reward: { coins: 1500, gems: 25 }, icon: '⏰',  check: p => p.bestStreak >= 14 },
    { id: 'streak_30',       name: 'Month Master',     desc: 'Play 30 days in a row',               reward: { coins: 5000, gems: 100 },icon: '👑',  check: p => p.bestStreak >= 30 },
    { id: 'weapon_1',        name: 'Armed',            desc: 'Upgrade weapon to level 1',           reward: { coins: 200, gems: 0 },   icon: '🔨',  check: p => (p.upgrades?.weapon || 0) >= 1 },
    { id: 'weapon_3',        name: 'Heavy Hitter',     desc: 'Upgrade weapon to level 3',           reward: { coins: 500, gems: 10 },  icon: '⚒️',  check: p => (p.upgrades?.weapon || 0) >= 3 },
    { id: 'weapon_5',        name: 'Weapon Master',    desc: 'Reach max weapon level',              reward: { coins: 2000, gems: 50 }, icon: '🗡️',  check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'case_1',          name: 'Durable Case',     desc: 'Upgrade case to level 1',             reward: { coins: 200, gems: 0 },   icon: '📦',  check: p => (p.upgrades?.case || 0) >= 1 },
    { id: 'case_3',          name: 'Fortified Case',   desc: 'Upgrade case to level 3',             reward: { coins: 500, gems: 10 },  icon: '🏰',  check: p => (p.upgrades?.case || 0) >= 3 },
    { id: 'case_5',          name: 'Impregnable',      desc: 'Reach max case level',                reward: { coins: 2000, gems: 50 }, icon: '💎',  check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'outfit_1',        name: 'Dressed Up',       desc: 'Upgrade outfit to level 1',           reward: { coins: 200, gems: 0 },   icon: '👔',  check: p => (p.upgrades?.outfit || 0) >= 1 },
    { id: 'outfit_3',        name: 'Fashionable',      desc: 'Upgrade outfit to level 3',           reward: { coins: 500, gems: 10 },  icon: '👗',  check: p => (p.upgrades?.outfit || 0) >= 3 },
    { id: 'outfit_5',        name: 'Fashion Legend',   desc: 'Reach max outfit level',              reward: { coins: 2000, gems: 50 }, icon: '👘',  check: p => (p.upgrades?.outfit || 0) >= 5 },
    { id: 'gems_100',        name: 'Gem Collector',    desc: 'Earn 100 total gems',                 reward: { coins: 500, gems: 20 },  icon: '💎',  check: p => p.totalGems >= 100 },
    { id: 'gems_500',        name: 'Gem Hoarder',      desc: 'Earn 500 total gems',                 reward: { coins: 1000, gems: 50 }, icon: '💠',  check: p => p.totalGems >= 500 },
    { id: 'all_achievements', name: 'Completionist',   desc: 'Unlock all other achievements',       reward: { coins: 10000, gems: 200 }, icon: '🏅', check: p => false },
  ];

  // ─── Player State ──────────────────────────────────
  function defaultState() {
    return {
      coins: 100,
      gems: 0,
      totalGems: 0,
      xp: 0,
      level: 1,
      bestScore: 0,
      bestCombo: 0,
      totalPlays: 0,
      totalRows: 0,
      bestStreak: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'],
      ownedPieceStyles: ['classic'],
      activeTheme: 'default',
      activePieceStyle: 'classic',
      powerups: { bomb: 3, shuffle: 3, reshuffle: 3 },
      activeBoosters: {},
      inventory: {},
      achievements: {},
      lastSaveDate: null,
      adFree: false,
      subscriptions: {},
    };
  }

  let state = null;

  function save() {
    state.lastSaveDate = new Date().toISOString();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        state = { ...defaultState(), ...JSON.parse(raw) };
        if (!state.upgrades) state.upgrades = { weapon: 0, case: 0, outfit: 0 };
        if (!state.gems && state.gems !== 0) state.gems = 0;
        if (!state.totalGems) state.totalGems = 0;
        if (!state.inventory) state.inventory = {};
        if (!state.subscriptions) state.subscriptions = {};
        if (!state.adFree) state.adFree = false;
            if (window.CollectiblesSystem) {
      CollectiblesSystem.setTracker('madePurchase', true);
      CollectiblesSystem.checkUnlocks();
    }

    save()
        return true;
      }
    } catch(e) {}
    reset();
    return false;
  }

  function reset() { state = defaultState(); save(); }

  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl - 1)); }

  function addXp(amount) {
    if (!state) return;
    state.xp += amount;
    let leveled = false;
    while (state.xp >= xpForLevel(state.level)) {
      state.xp -= xpForLevel(state.level);
      state.level++;
      leveled = true;
    }
    save();
    return leveled;
  }

  function addCoins(amount) { if (!state) return 0; state.coins += amount; save(); return state.coins; }
  function spendCoins(amount) { if (!state || state.coins < amount) return false; state.coins -= amount; save(); return true; }
  function addGems(amount) { if (!state) return 0; state.gems += amount; state.totalGems += amount; save(); return state.gems; }
  function spendGems(amount) { if (!state || state.gems < amount) return false; state.gems -= amount; save(); return true; }

  function getUpgradeCost(category, currentLevel) {
    const tier = UPGRADE_TIERS[category];
    if (!tier) return null;
    const nextLevel = currentLevel + 1;
    const levelData = tier.levels.find(l => l.level === nextLevel);
    if (!levelData) return null;
    return { coins: levelData.coinsReq, gems: levelData.gemReq };
  }

  function upgradeItem(category, useGems = false) {
    if (!state) return { success: false, reason: 'no_state' };
    const tier = UPGRADE_TIERS[category];
    if (!tier) return { success: false, reason: 'invalid_category' };
    const current = state.upgrades[category] || 0;
    if (current >= tier.maxLevel) return { success: false, reason: 'max_level' };
    const costs = getUpgradeCost(category, current);
    if (!costs) return { success: false, reason: 'no_level_data' };
    if (useGems) { if (state.gems < costs.gems) return { success: false, reason: 'not_enough_gems' }; spendGems(costs.gems); }
    else { if (state.coins < costs.coins) return { success: false, reason: 'not_enough_coins' }; spendCoins(costs.coins); }
    state.upgrades[category]++;
    save();
    return { success: true, newLevel: state.upgrades[category] };
  }

  function getActiveBonuses() {
    if (!state) return { scoreMult: 1, clearBonus: 0, gridBonus: 0, rowBonus: 0, comboBonus: 0, extraSlot: 0 };
    const bonuses = { scoreMult: 1, clearBonus: 0, gridBonus: 0, rowBonus: 0, comboBonus: 0, extraSlot: 0 };
    const wLevel = state.upgrades.weapon || 0;
    const wData = UPGRADE_TIERS.weapon.levels[wLevel];
    if (wData) { bonuses.scoreMult += (wData.bonus.scoreMult - 1); bonuses.clearBonus += wData.bonus.clearBonus; }
    const cLevel = state.upgrades.case || 0;
    const cData = UPGRADE_TIERS.case.levels[cLevel];
    if (cData) { bonuses.gridBonus += cData.bonus.gridBonus; bonuses.rowBonus += cData.bonus.rowBonus; }
    const oLevel = state.upgrades.outfit || 0;
    const oData = UPGRADE_TIERS.outfit.levels[oLevel];
    if (oData) { bonuses.comboBonus += oData.bonus.comboBonus; bonuses.extraSlot += oData.bonus.extraSlot; }
    return bonuses;
  }

  function ownsPremiumItem(itemId) { return state && state.inventory && state.inventory[itemId] === true; }

  function purchasePremiumItem(itemId) {
    if (!state) return false;
    state.inventory[itemId] = true;
        if (itemId === 'remove_ads') {
      state.adFree = true;
      if (window.AdsManager) AdsManager.onAdsRemoved();
    }
    const bundleGems = { bundle_starter: 200, bundle_mega: 500, bundle_ultimate: 2000 };
    if (bundleGems[itemId]) addGems(bundleGems[itemId]);
    save();
    return true;
  }

  function checkAchievements() {
    if (!state) return [];
    const unlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (state.achievements[ach.id]) continue;
      if (ach.check(state)) {
        state.achievements[ach.id] = true;
        addCoins(ach.reward.coins);
        if (ach.reward.gems) addGems(ach.reward.gems);
        unlocked.push(ach);
      }
    }
    if (unlocked.length > 0) save();
    return unlocked;
  }

  function claimDailyBonus() {
    if (!state) return null;
    const now = new Date();
    const today = now.toDateString();
    try {
      const lastClaim = localStorage.getItem(DAILY_KEY);
      if (lastClaim === today) return null;
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      let streak = 0;
      if (lastClaim === yesterdayStr) { streak = (state.dailyStreak || 0) + 1; }
      else { streak = 1; }
      state.dailyStreak = streak;
      if (streak > state.bestStreak) state.bestStreak = streak;
      const coins = Math.min(100 + (streak - 1) * 20, 1000);
      const gems = streak >= 7 ? 5 : streak >= 3 ? 2 : 0;
      addCoins(coins);
      if (gems) addGems(gems);
      localStorage.setItem(DAILY_KEY, today);
      save();
      return { streak, coins, gems };
    } catch(e) { return null; }
  }

  function endOfGame(result) {
    if (!state) return;
    state.totalPlays++;
    if (result.score > state.bestScore) state.bestScore = result.score;
    if (result.bestCombo > state.bestCombo) state.bestCombo = result.bestCombo;
    if (result.rowsCleared) state.totalRows += result.rowsCleared;
    const xpGain = Math.floor(result.score / 10) + result.rowsCleared * 5 + 20;
    addXp(xpGain);
    const coinGain = Math.floor(result.score / 20) + result.rowsCleared * 2 + 5;
    addCoins(coinGain);
    save();
  }

  function getState() { return state; }
  function getUpgradeTiers() { return UPGRADE_TIERS; }
  function getPremiumItems() { return PREMIUM_ITEMS; }
  function getGemPacks() { return GEM_PACKS; }
  function getCatalog() { return CATALOG; }
  function getAchievements() { return ACHIEVEMENTS; }
  function getCoinBalance() { return state ? state.coins : 0; }
  function getGemBalance() { return state ? state.gems : 0; }

  window.ProgressionSystem = {
    load, save, reset,
    addCoins, spendCoins, getCoinBalance,
    addGems, spendGems, getGemBalance,
    addXp, xpForLevel,
    upgradeItem, getUpgradeCost, getActiveBonuses,
    getUpgradeTiers, UPGRADE_TIERS,
    getPremiumItems, PREMIUM_ITEMS,
    getGemPacks, GEM_PACKS,
    ownsPremiumItem, purchasePremiumItem,
    getCatalog, CATALOG,
    getAchievements, ACHIEVEMENTS,
    checkAchievements, endOfGame,
    claimDailyBonus,
    getState, defaultState,
  };
})();
