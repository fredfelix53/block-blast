/* ===== Block Blast — Game Engine =====
   8x8 grid, drag blocks from tray, fill rows/columns to clear
*/
const GRID = 8;
const CELL = 44;
let canvas, ctx;
let grid = [];
let score = 0;
let gameActive = false;
let gameOver = false;
let trayShapes = [];
let selectedTrayIndex = -1;
let dragPiece = null;
let dragOffsetX = 0, dragOffsetY = 0;
let particles = null;
let floatingTexts = [];
let bestComboThisGame = 0;
let rowsClearedThisGame = 0;

// ─── Block Shape Definitions ──────────────────────────
const BLOCK_SHAPES = [
  // Single
  { cells: [[1]] },
  // 2-block
  { cells: [[1,1]] },
  { cells: [[1],[1]] },
  // L shapes
  { cells: [[1,0],[1,1]] },
  { cells: [[0,1],[1,1]] },
  { cells: [[1,1],[0,1]] },
  { cells: [[1,1],[1,0]] },
  // 3-block
  { cells: [[1,1,1]] },
  { cells: [[1],[1],[1]] },
  // Square 2x2
  { cells: [[1,1],[1,1]] },
  // T-shape
  { cells: [[1,1,1],[0,1,0]] },
  // Z-shape
  { cells: [[1,1,0],[0,1,1]] },
  { cells: [[0,1,1],[1,1,0]] },
  // 3x3 L
  { cells: [[1,1,1],[1,0,0],[1,0,0]] },
  { cells: [[1,1,1],[0,0,1],[0,0,1]] },
  { cells: [[1,1,1],[0,1,0]] },
  // Bigger
  { cells: [[1,1],[1,1],[1,1]] },
  { cells: [[1,1,1],[1,1,1]] },
];

function randomShape() {
  return JSON.parse(JSON.stringify(BLOCK_SHAPES[Math.floor(Math.random() * BLOCK_SHAPES.length)]));
}

function refreshTray() {
  trayShapes = [randomShape(), randomShape(), randomShape()];
  selectedTrayIndex = -1;
  renderTray();
}

// ─── Canvas Setup ────────────────────────────────────
function initCanvas() {
  canvas = document.getElementById('game-board');
  ctx = canvas.getContext('2d');
  canvas.width = GRID * CELL + 8;
  canvas.height = GRID * CELL + 8;
}

// ─── Grid Functions ─────────────────────────────────
function createGrid() {
  grid = [];
  for (let r = 0; r < GRID; r++) {
    grid.push(new Array(GRID).fill(0));
  }
}

function canPlace(shape, row, col) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const gr = row + r;
        const gc = col + c;
        if (gr >= GRID || gc >= GRID || gr < 0 || gc < 0) return false;
        if (grid[gr][gc] !== 0) return false;
      }
    }
  }
  return true;
}

function placeBlock(shape, row, col, type = 'B') {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        grid[row + r][col + c] = type;
      }
    }
  }
}

function removeBlock(shape, row, col) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        grid[row + r][col + c] = 0;
      }
    }
  }
}

function clearLines() {
  const cleared = [];
  // Check rows
  for (let r = 0; r < GRID; r++) {
    if (grid[r].every(c => c !== 0)) cleared.push({ type: 'row', index: r });
  }
  // Check columns
  for (let c = 0; c < GRID; c++) {
    let full = true;
    for (let r = 0; r < GRID; r++) {
      if (grid[r][c] === 0) { full = false; break; }
    }
    if (full) cleared.push({ type: 'col', index: c });
  }
  if (cleared.length === 0) return 0;

  // Remove cleared rows/cols
  for (const item of cleared) {
    if (item.type === 'row') {
      for (let c = 0; c < GRID; c++) grid[item.index][c] = 0;
    } else {
      for (let r = 0; r < GRID; r++) grid[r][item.index] = 0;
    }
  }

  rowsClearedThisGame += cleared.length;
  if (cleared.length > bestComboThisGame) bestComboThisGame = cleared.length;

  return cleared.length;
}

function gridHasSpace() {
  // Check if any shape can be placed
  for (const shape of trayShapes) {
    for (let r = 0; r <= GRID - shape.cells.length; r++) {
      for (let c = 0; c <= GRID - shape.cells[0].length; c++) {
        if (canPlace(shape.cells, r, c)) return true;
      }
    }
  }
  return false;
}

// ─── Scoring ─────────────────────────────────────────
function calculateScore(linesCleared) {
  const bonuses = window.ProgressionSystem ? ProgressionSystem.getActiveBonuses() : {};
  const scoreMult = bonuses.scoreMult || 1;
  const clearBonus = bonuses.clearBonus || 0;
  const comboBonus = bonuses.comboBonus || 0;
  const rowBonus = bonuses.rowBonus || 0;
  const gridBonus = bonuses.gridBonus || 0;

  const base = linesCleared * 50 + (linesCleared > 1 ? linesCleared * 30 : 0);
  const bonus = clearBonus * linesCleared + comboBonus + rowBonus + gridBonus;
  return Math.floor((base + bonus) * scoreMult);
}

// ─── Render ──────────────────────────────────────────
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Board background
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.beginPath();
  ctx.roundRect(2, 2, GRID * CELL, GRID * CELL, 8);
  ctx.fill();

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(4 + i * CELL, 4);
    ctx.lineTo(4 + i * CELL, 4 + GRID * CELL);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 4 + i * CELL);
    ctx.lineTo(4 + GRID * CELL, 4 + i * CELL);
    ctx.stroke();
  }

  // Cells
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const x = c * CELL + 4;
      const y = r * CELL + 4;
      if (grid[r][c]) {
        drawGradientBlock(ctx, x, y, CELL, 'B', true);
      } else {
        drawEmptyCell(ctx, x, y, CELL, { bg: '#0f1020', accent: '#1a1a2e' });
      }
    }
  }

  // Drag preview (ghost)
  if (dragPiece && selectedTrayIndex >= 0) {
    const { shape, row, col } = dragPiece;
    if (canPlace(shape, row, col)) {
      // Green ghost for valid placement
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const x = (col + c) * CELL + 4;
            const y = (row + r) * CELL + 4;
            ctx.save();
            ctx.fillStyle = 'rgba(76, 209, 55, 0.25)';
            ctx.beginPath();
            ctx.roundRect(x, y, CELL, CELL, 4);
            ctx.fill();
            ctx.strokeStyle = 'rgba(76, 209, 55, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
          }
        }
      }
    } else {
      // Red ghost for invalid
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const x = (col + c) * CELL + 4;
            const y = (row + r) * CELL + 4;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.roundRect(x, y, CELL, CELL, 4);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }
  }

  // Particles
  if (particles) { particles.update(); particles.draw(ctx); }

  // Floating texts
  floatingTexts = floatingTexts.filter(ft => ft.update());
  for (const ft of floatingTexts) ft.draw(ctx);
}

function renderTray() {
  const tray = document.getElementById('block-tray');
  if (!tray) return;
  tray.innerHTML = '';
  trayShapes.forEach((shape, idx) => {
    const slot = document.createElement('div');
    slot.className = 'tray-slot';
    slot.dataset.index = idx;
    const c = document.createElement('canvas');
    c.width = 60;
    c.height = 60;
    const tctx = c.getContext('2d');
    // Draw shape in tray
    const cells = shape.cells;
    const cs = Math.floor(Math.min(52 / cells[0].length, 52 / cells.length));
    const ox = (60 - cells[0].length * cs) / 2;
    const oy = (60 - cells.length * cs) / 2;
    for (let r = 0; r < cells.length; r++) {
      for (let c2 = 0; c2 < cells[r].length; c2++) {
        if (cells[r][c2]) {
          drawGradientBlock(tctx, ox + c2 * cs, oy + r * cs, cs, 'B', false);
        }
      }
    }
    slot.appendChild(c);
    tray.appendChild(slot);
  });
}

// ─── Touch Drag Logic ────────────────────────────────
function handleTraySelect(index) {
  if (!gameActive || gameOver || index < 0 || index >= trayShapes.length) return;
  const shape = trayShapes[index];
  if (!gridHasSpaceForShape(shape.cells)) {
    showNotification('No space for this shape!');
    return;
  }
  selectedTrayIndex = index;
  const shapeCells = shape.cells;
  dragPiece = { shape: shapeCells, row: 0, col: Math.floor((GRID - shapeCells[0].length) / 2) };
}

function handleDragTo(row, col) {
  if (!dragPiece || selectedTrayIndex < 0) return;
  dragPiece.row = Math.max(0, Math.min(GRID - dragPiece.shape.length, row));
  dragPiece.col = Math.max(0, Math.min(GRID - dragPiece.shape[0].length, col));
}

function handleDrop() {
  if (!dragPiece || selectedTrayIndex < 0) return;
  const { shape, row, col } = dragPiece;
  if (canPlace(shape, row, col)) {
    placeBlock(shape, row, col, 'B');
    // Remove from tray
    trayShapes.splice(selectedTrayIndex, 1);
    // Calculate score before clearing
    const lines = clearLines();
    if (lines > 0) {
      const pts = calculateScore(lines);
      score += pts;
      if (particles) particles.emitReward(canvas.width / 2, canvas.height / 2);
      if (floatingTexts) {
        const label = lines >= 4 ? '💥 BLAST!' : lines >= 2 ? '🔥 COMBO!' : '✨ CLEAR!';
        floatingTexts.push(new FloatingText(canvas.width / 2, canvas.height / 2 - 20, `+${pts} ${label}`, '#ffd700', 26));
      }
    }
    updateScoreDisplay();

    // Add new shape if tray has room
    while (trayShapes.length < 3) {
      trayShapes.push(randomShape());
    }

    renderTray();

    // Check game over
    if (trayShapes.length > 0 && !gridHasSpace()) {
      endGame();
    }
  }
  dragPiece = null;
  selectedTrayIndex = -1;
}

function gridHasSpaceForShape(shape) {
  for (let r = 0; r <= GRID - shape.length; r++) {
    for (let c = 0; c <= GRID - shape[0].length; c++) {
      if (canPlace(shape, r, c)) return true;
    }
  }
  return false;
}

// ─── Mouse/Touch Controls for Board ─────────────────
function initControls() {
  const board = canvas;

  board.addEventListener('mousedown', (e) => {
    if (!gameActive || gameOver) return;
    const rect = board.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor((mx - 4) / CELL);
    const row = Math.floor((my - 4) / CELL);
    if (selectedTrayIndex >= 0) {
      handleDragTo(row, col);
      render();
    }
  });

  board.addEventListener('mousemove', (e) => {
    if (!dragPiece) return;
    const rect = board.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const col = Math.floor((mx - 4) / CELL);
    const row = Math.floor((my - 4) / CELL);
    handleDragTo(row, col);
    render();
  });

  board.addEventListener('mouseup', handleDrop);
  board.addEventListener('mouseleave', () => { if (dragPiece) handleDrop(); });

  // Touch
  board.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameActive || gameOver) return;
    const t = e.touches[0];
    const rect = board.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (t.clientX - rect.left) * scaleX;
    const my = (t.clientY - rect.top) * scaleY;
    const col = Math.floor((mx - 4) / CELL);
    const row = Math.floor((my - 4) / CELL);
    if (selectedTrayIndex >= 0) {
      handleDragTo(row, col);
      render();
    }
  }, { passive: false });

  board.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!dragPiece) return;
    const t = e.touches[0];
    const rect = board.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (t.clientX - rect.left) * scaleX;
    const my = (t.clientY - rect.top) * scaleY;
    const col = Math.floor((mx - 4) / CELL);
    const row = Math.floor((my - 4) / CELL);
    handleDragTo(row, col);
    render();
  }, { passive: false });

  board.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleDrop();
    render();
  }, { passive: false });

  // Tray click
  const tray = document.getElementById('block-tray');
  tray.addEventListener('click', (e) => {
    const slot = e.target.closest('.tray-slot');
    if (!slot) return;
    const idx = parseInt(slot.dataset.index);
    if (selectedTrayIndex === idx) {
      // Deselect
      selectedTrayIndex = -1;
      dragPiece = null;
      slot.style.borderColor = '';
    } else {
      // Select this shape from tray
      handleTraySelect(idx);
      // Highlight
      tray.querySelectorAll('.tray-slot').forEach(s => s.style.borderColor = '');
      slot.style.borderColor = '#4facfe';
    }
    render();
  });

  tray.addEventListener('touchstart', (e) => {
    const slot = e.target.closest('.tray-slot');
    if (!slot) return;
    e.preventDefault();
    const idx = parseInt(slot.dataset.index);
    if (selectedTrayIndex === idx) {
      selectedTrayIndex = -1;
      dragPiece = null;
      slot.style.borderColor = '';
    } else {
      handleTraySelect(idx);
      tray.querySelectorAll('.tray-slot').forEach(s => s.style.borderColor = '');
      slot.style.borderColor = '#4facfe';
    }
    render();
  }, { passive: false });
}

// ─── Game Loop ───────────────────────────────────────
function gameLoop() {
  if (!gameActive || gameOver) return;
  render();
  requestAnimationFrame(gameLoop);
}

// ─── Score Display ──────────────────────────────────
function updateScoreDisplay() {
  const el = document.getElementById('score-value');
  if (el) el.textContent = score;
}

// ─── Start / End Game ───────────────────────────────
function startGame() {
  createGrid();
  score = 0;
  gameOver = false;
  gameActive = true;
  bestComboThisGame = 0;
  rowsClearedThisGame = 0;
  floatingTexts = [];
  particles = new ParticleSystem();
  document.getElementById('game-over-overlay')?.classList.remove('visible');
  refreshTray();
  updateScoreDisplay();
  render();
}

function endGame() {
  gameActive = false;
  gameOver = true;
  const overlay = document.getElementById('game-over-overlay');
  if (overlay) {
    overlay.classList.add('visible');
    document.getElementById('final-score').textContent = score;
  }

  if (window.ProgressionSystem) {
    ProgressionSystem.endOfGame({
      score,
      rowsCleared: rowsClearedThisGame,
      bestCombo: bestComboThisGame,
    });
    const unlocked = ProgressionSystem.checkAchievements();
    if (unlocked.length > 0) setTimeout(() => showAchievementPopup(unlocked), 1000);
    setTimeout(() => checkDailyBonus(), 1500);
  }

  // ─── Framework Game-Over Hooks ─────────────────
  if (window.RetentionSystem) RetentionSystem.onGameEnd(score);
  if (window.ChallengesSystem) {
    ChallengesSystem.reportProgress('score', score);
    ChallengesSystem.reportProgress('games', 1);
  }
  if (window.CollectiblesSystem) {
    CollectiblesSystem.incrementTracker('totalGames', 1);
    CollectiblesSystem.setTracker('highestScore', score);
  }
  if (window.AdsManager) AdsManager.tryShowInterstitial();

  if (particles) setTimeout(() => particles.emitLevelUp(), 500);
}

function showAchievementPopup(achievements) {
  const existing = document.querySelector('.achievement-popup');
  if (existing) existing.remove();
  achievements.forEach((ach, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'achievement-popup show';
      div.innerHTML = `<div class="ach-icon">${ach.icon}</div><div class="ach-title">🏅 Achievement Unlocked!</div><div>${ach.name}</div><div class="ach-desc">${ach.desc}</div><div class="ach-reward">+${ach.reward.coins} 🪙 ${ach.reward.gems ? `+${ach.reward.gems} 💎` : ''}</div>`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 3000);
    }, i * 700);
  });
}

function checkDailyBonus() {
  if (!window.ProgressionSystem) return;
  const result = ProgressionSystem.claimDailyBonus();
  if (!result) return;
  const existing = document.querySelector('.daily-bonus-popup');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'daily-bonus-popup show';
  div.innerHTML = `<h3>📅 Daily Bonus Claimed!</h3><div class="streak-fire">${'🔥'.repeat(Math.min(result.streak, 7))}</div><div>🪙 +${result.coins} coins</div>${result.gems ? `<div>💎 +${result.gems} gems</div>` : ''}<div style="font-size:13px;color:#888;margin-top:6px;">Day ${result.streak} streak!</div><button class="game-btn btn-primary" style="margin-top:10px;display:inline-flex;" onclick="this.closest('.daily-bonus-popup').remove()">Awesome!</button>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

// ─── HUD Update ──────────────────────────────────────
function updateHUD() {
  if (!window.ProgressionSystem) return;
  const state = ProgressionSystem.getState();
  const coins = document.getElementById('hud-coins');
  const gems = document.getElementById('hud-gems');
  const level = document.getElementById('hud-level');
  if (coins) coins.textContent = state.coins;
  if (gems) gems.textContent = state.gems;
  if (level) level.textContent = state.level;
}

// ─── Achievements List ───────────────────────────────
function showAchievementsList() {
  if (!window.ProgressionSystem) return;
  const state = ProgressionSystem.getState();
  const achievements = ProgressionSystem.getAchievements();
  const unlocked = Object.keys(state.achievements).length;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-box" style="min-width:300px;"><h3 style="text-align:center;margin-bottom:8px;color:var(--accent-gold);">🏆 Achievements</h3><div style="text-align:center;margin-bottom:12px;font-size:14px;color:var(--text-secondary);">${unlocked}/${achievements.length} unlocked</div><div style="max-height:400px;overflow-y:auto;">${achievements.map(a => { const done = !!state.achievements[a.id]; return `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${done ? 'rgba(76,209,55,0.05)' : 'transparent'};border-radius:8px;margin-bottom:4px;${done ? 'opacity:0.8;' : ''}"><span style="font-size:20px;">${done ? a.icon : '🔒'}</span><div style="flex:1;"><div style="font-size:13px;font-weight:600;">${a.name}</div><div style="font-size:11px;color:var(--text-secondary);">${a.desc}</div></div>${done ? '✅' : `<span style="font-size:11px;color:var(--accent-gold);">🪙${a.reward.coins}${a.reward.gems ? ' 💎'+a.reward.gems : ''}</span>`}</div>`; }).join('')}</div><button class="game-btn btn-restart" style="margin:10px auto 0;display:block;background:linear-gradient(135deg,#636e72,#2d3436);color:white;border:none;border-radius:12px;padding:8px 20px;cursor:pointer;" onclick="this.closest('.modal-overlay').remove()">Close</button></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ─── Init ────────────────────────────────────────────
function init() {
  initCanvas();
  initControls();

  if (window.ProgressionSystem) {
    ProgressionSystem.load();
    updateHUD();
    setInterval(updateHUD, 3000);
  }

  // ─── Framework Module Init ──────────────────────
  if (window.AdsManager) AdsManager.init();
  if (window.ChallengesSystem) ChallengesSystem.init();
  if (window.StoreRotator) StoreRotator.init();
  if (window.RetentionSystem) RetentionSystem.init();
  if (window.CollectiblesSystem) CollectiblesSystem.init();
  if (window.TutorialSystem) {
    TutorialSystem.init();
    if (TutorialSystem.shouldShow()) TutorialSystem.start();
  }

  document.getElementById('restart-btn')?.addEventListener('click', startGame);
  document.getElementById('shop-btn')?.addEventListener('click', () => { if (window.ShopUI) ShopUI.open(); });
  document.getElementById('button-shop')?.addEventListener('click', () => { if (window.ShopUI) ShopUI.open(); });
  document.getElementById('button-ach')?.addEventListener('click', showAchievementsList);

  startGame();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
