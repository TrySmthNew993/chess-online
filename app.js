/**
 * KnightLink Chess — Static P2P & Local Chess App
 * Works on GitHub Pages with WebRTC (PeerJS) + Chess.js
 */

// Crisp SVG vectors for standard tournament chess pieces
const PIECE_SVGS = {
  wP: `<svg viewBox="0 0 45 45" class="piece"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  wR: `<svg viewBox="0 0 45 45" class="piece"><g fill="#fff" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt"/><path d="M34 14l-3 3H14l-3-3"/><path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/><path d="M11 14h23" fill="none" stroke-linejoin="miter"/></g></svg>`,
  wN: `<svg viewBox="0 0 45 45" class="piece"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#fff"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zM14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#000"/></g></svg>`,
  wB: `<svg viewBox="0 0 45 45" class="piece"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#fff" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke-linejoin="miter"/></g></svg>`,
  wQ: `<svg viewBox="0 0 45 45" class="piece"><g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM16 8.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM33 9a2 2 0 1 1-4 0 2 2 0 1 1 4 0z"/><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/><path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none"/></g></svg>`,
  wK: `<svg viewBox="0 0 45 45" class="piece"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="#fff"/><path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></g></svg>`,
  bP: `<svg viewBox="0 0 45 45" class="piece"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#1e293b" stroke="#000" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  bR: `<svg viewBox="0 0 45 45" class="piece"><g fill="#1e293b" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z" stroke-linecap="butt"/><path d="M14 29.5v-13h17v13H14z" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" stroke-linecap="butt"/><path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-linejoin="miter"/></g></svg>`,
  bN: `<svg viewBox="0 0 45 45" class="piece"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#1e293b"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill="#1e293b"/><path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0zM14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill="#cbd5e1" stroke="#cbd5e1"/><path d="M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 7.9 6.75S35.75 29.06 35.25 39l-.05.5h2.25l.05-.5c.5-10.06-.88-16.85-3.25-21.34-2.37-4.49-5.79-6.64-9.19-7.16l-.51-.1z" fill="#cbd5e1" stroke="none"/></g></svg>`,
  bB: `<svg viewBox="0 0 45 45" class="piece"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#1e293b" stroke-linecap="butt"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/></g><path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" stroke="#cbd5e1" stroke-linejoin="miter"/></g></svg>`,
  bQ: `<svg viewBox="0 0 45 45" class="piece"><g fill="#1e293b" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><g fill="#1e293b" stroke="none"><circle cx="6" cy="12" r="2.75"/><circle cx="14" cy="9" r="2.75"/><circle cx="22.5" cy="8" r="2.75"/><circle cx="31" cy="9" r="2.75"/><circle cx="39" cy="12" r="2.75"/></g><path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" stroke-linecap="butt"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" stroke-linecap="butt"/><path d="M11 38.5a35 35 1 0 0 23 0" fill="none" stroke-linecap="butt"/><path d="M11 29a35 35 1 0 1 23 0M12.5 31.5h20M11.5 34.5a35 35 1 0 0 22 0M10.5 37.5a35 35 1 0 0 24 0" fill="none" stroke="#cbd5e1"/></g></svg>`,
  bK: `<svg viewBox="0 0 45 45" class="piece"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.5 11.63V6" stroke-linejoin="miter"/><path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#1e293b" stroke-linecap="butt" stroke-linejoin="miter"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill="#1e293b"/><path d="M20 8h5" stroke-linejoin="miter"/><path d="M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5l.01 2.1-.01-2.1C20 18 9.906 14 6.997 19.85c-2.497 5.65 4.853 9 4.853 9M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" stroke="#cbd5e1"/></g></svg>`
};

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const PIECE_UNICODE = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' }
};

// Web Audio synthesizer for zero-dependency sound effects
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  tone(freq, duration = 0.08, type = 'sine', gainVal = 0.14, delay = 0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch (_) {}
  }

  move() {
    this.tone(240, 0.07, 'triangle', 0.18);
  }

  capture() {
    this.tone(160, 0.09, 'sawtooth', 0.16);
    this.tone(310, 0.06, 'triangle', 0.14, 0.03);
  }

  check() {
    this.tone(580, 0.12, 'sine', 0.2);
    this.tone(440, 0.15, 'sine', 0.15, 0.09);
  }

  gameOver() {
    this.tone(330, 0.14, 'triangle', 0.18, 0);
    this.tone(392, 0.14, 'triangle', 0.18, 0.12);
    this.tone(523, 0.28, 'triangle', 0.2, 0.24);
  }
}

const sfx = new SoundFX();

const BOT_PROFILES = {
  vasya: {
    id: 'vasya',
    name: 'Vasya',
    level: 1,
    avatarImg: 'assets/vasya.jpg'
  },
  mitya: {
    id: 'mitya',
    name: 'Mitya',
    level: 3,
    avatarImg: 'assets/mitya.jpg'
  },
  custom: {
    id: 'custom',
    name: 'Custom Bot',
    level: 5,
    avatarEmoji: '🤖'
  }
};

const BOT_DIFFICULTY_NAMES = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Casual',
  4: 'Amateur',
  5: 'Intermediate',
  6: 'Club',
  7: 'Strong',
  8: 'Advanced',
  9: 'Expert',
  10: 'Master'
};

// Main Application State
const state = {
  chess: new Chess(),
  mode: 'local', // 'local' | 'online-host' | 'online-join' | 'bot'
  setupTab: 'online-host',
  myColor: 'w', // 'w' | 'b' (in online & bot modes)
  hostColorPref: 'w', // 'w' | 'b' | 'random'
  flipped: false,
  autoFlipLocal: false,

  // Bot mode state
  botType: 'vasya', // 'vasya' | 'mitya' | 'custom'
  customBotLevel: 5,
  botThinking: false,
  botSessionId: 0,

  // Selection & legal moves
  selectedSquare: null,
  legalMoves: [],
  lastMove: null, // { from, to }
  pendingPromotion: null, // { from, to }

  // Timer settings
  timeMinutes: 10,
  timeIncrement: 0,
  isCustomTimer: false,
  unlimitedTime: false,
  clocks: { w: 600000, b: 600000 }, // milliseconds
  clockInterval: null,
  lastTickTime: null,
  gameActive: false,
  gameOverReason: null,

  // PeerJS P2P state
  peer: null,
  conn: null,
  roomCode: null,
  connected: false
};

// DOM Elements
const els = {
  board: document.getElementById('chessboard'),
  topPlayerBar: document.getElementById('topPlayerBar'),
  bottomPlayerBar: document.getElementById('bottomPlayerBar'),
  topPlayerName: document.getElementById('topPlayerName'),
  bottomPlayerName: document.getElementById('bottomPlayerName'),
  topAvatar: document.getElementById('topAvatar'),
  bottomAvatar: document.getElementById('bottomAvatar'),
  topClock: document.getElementById('topClock'),
  bottomClock: document.getElementById('bottomClock'),
  topCaptured: document.getElementById('topCaptured'),
  bottomCaptured: document.getElementById('bottomCaptured'),
  topMaterialBadge: document.getElementById('topMaterialBadge'),
  bottomMaterialBadge: document.getElementById('bottomMaterialBadge'),

  turnDot: document.getElementById('turnDot'),
  statusText: document.getElementById('statusText'),
  modeTag: document.getElementById('modeTag'),
  timerTag: document.getElementById('timerTag'),
  movesList: document.getElementById('movesList'),

  roomBanner: document.getElementById('roomBanner'),
  displayRoomCode: document.getElementById('displayRoomCode'),
  roomHintText: document.getElementById('roomHintText'),
  copyCodeBtn: document.getElementById('copyCodeBtn'),
  copyLinkBtn: document.getElementById('copyLinkBtn'),
  connectionPill: document.getElementById('connectionPill'),
  connStatusText: document.getElementById('connStatusText'),

  promotionOverlay: document.getElementById('promotionOverlay'),
  promotionOptions: document.getElementById('promotionOptions'),
  gameOverOverlay: document.getElementById('gameOverOverlay'),
  gameOverIcon: document.getElementById('gameOverIcon'),
  gameOverTitle: document.getElementById('gameOverTitle'),
  gameOverSubtitle: document.getElementById('gameOverSubtitle'),
  rematchBtn: document.getElementById('rematchBtn'),
  newSetupBtn: document.getElementById('newSetupBtn'),

  offerDrawBtn: document.getElementById('offerDrawBtn'),
  resignBtn: document.getElementById('resignBtn'),
  drawOfferBanner: document.getElementById('drawOfferBanner'),
  acceptDrawBtn: document.getElementById('acceptDrawBtn'),
  declineDrawBtn: document.getElementById('declineDrawBtn'),

  soundToggleBtn: document.getElementById('soundToggleBtn'),
  flipBoardBtn: document.getElementById('flipBoardBtn'),
  menuModalBtn: document.getElementById('menuModalBtn'),
  brandHomeBtn: document.getElementById('brandHomeBtn'),
  copyPgnBtn: document.getElementById('copyPgnBtn'),

  // Modal Elements
  setupModal: document.getElementById('setupModal'),
  closeSetupModalBtn: document.getElementById('closeSetupModalBtn'),
  modeTabs: document.querySelectorAll('.mode-tab'),
  joinRoomSection: document.getElementById('joinRoomSection'),
  joinCodeInput: document.getElementById('joinCodeInput'),
  gameSettingsSection: document.getElementById('gameSettingsSection'),
  timerChips: document.querySelectorAll('.timer-chip'),
  customTimerRow: document.getElementById('customTimerRow'),
  customMinInput: document.getElementById('customMinInput'),
  customIncInput: document.getElementById('customIncInput'),
  colorSelectSection: document.getElementById('colorSelectSection'),
  colorBtns: document.querySelectorAll('.color-btn'),
  localOptionsSection: document.getElementById('localOptionsSection'),
  autoFlipCheckbox: document.getElementById('autoFlipCheckbox'),
  botSelectSection: document.getElementById('botSelectSection'),
  botCards: document.querySelectorAll('.bot-card'),
  customBotDifficultyRow: document.getElementById('customBotDifficultyRow'),
  botLevelSlider: document.getElementById('botLevelSlider'),
  botLevelLabel: document.getElementById('botLevelLabel'),
  customBotCardLvl: document.getElementById('customBotCardLvl'),
  setupErrorMsg: document.getElementById('setupErrorMsg'),
  startActionBtn: document.getElementById('startActionBtn')
};

const PEER_PREFIX = 'knightlink-chess-v1-';

// Initialize App
function init() {
  bindEvents();
  checkUrlRoomInvite();
  renderBoard();
  updateUI();
}

function checkUrlRoomInvite() {
  const params = new URLSearchParams(window.location.search);
  const invitedRoom = params.get('room');
  if (invitedRoom) {
    const cleanCode = invitedRoom.trim().toUpperCase();
    switchSetupTab('online-join');
    els.joinCodeInput.value = cleanCode;
    els.setupModal.classList.remove('hidden');
  }
}

function bindEvents() {
  // Topbar controls
  els.soundToggleBtn.addEventListener('click', () => {
    sfx.enabled = !sfx.enabled;
    els.soundToggleBtn.textContent = sfx.enabled ? '🔊' : '🔇';
  });

  els.flipBoardBtn.addEventListener('click', () => {
    state.flipped = !state.flipped;
    renderBoard();
    updatePlayerBars();
  });

  els.menuModalBtn.addEventListener('click', () => {
    els.setupErrorMsg.classList.add('hidden');
    els.setupModal.classList.remove('hidden');
  });

  els.brandHomeBtn.addEventListener('click', () => {
    els.setupModal.classList.remove('hidden');
  });

  els.closeSetupModalBtn.addEventListener('click', () => {
    els.setupModal.classList.add('hidden');
  });

  // Setup modal tabs
  els.modeTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      switchSetupTab(tab.dataset.mode);
    });
  });

  // Timer chips
  els.timerChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      els.timerChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      if (chip.dataset.min === 'custom') {
        state.isCustomTimer = true;
        els.customTimerRow.classList.remove('hidden');
      } else {
        state.isCustomTimer = false;
        els.customTimerRow.classList.add('hidden');
        state.timeMinutes = parseInt(chip.dataset.min, 10);
        state.timeIncrement = parseInt(chip.dataset.inc, 10);
      }
    });
  });

  // Color picker
  els.colorBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      els.colorBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.hostColorPref = btn.dataset.color;
    });
  });

  // Bot cards
  els.botCards.forEach((card) => {
    card.addEventListener('click', () => {
      els.botCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.botType = card.dataset.bot;
      els.customBotDifficultyRow.classList.toggle('hidden', state.botType !== 'custom');
    });
  });

  // Custom bot level slider
  els.botLevelSlider.addEventListener('input', () => {
    const lvl = parseInt(els.botLevelSlider.value, 10);
    state.customBotLevel = lvl;
    els.botLevelLabel.textContent = `Level ${lvl} / 10 — ${BOT_DIFFICULTY_NAMES[lvl]}`;
    els.customBotCardLvl.textContent = `Level ${lvl} / 10`;
  });

  // Start action button
  els.startActionBtn.addEventListener('click', handleStartAction);

  // Copy Room Code & Invite Link
  els.copyCodeBtn.addEventListener('click', () => {
    if (!state.roomCode) return;
    navigator.clipboard.writeText(state.roomCode);
    flashButtonText(els.copyCodeBtn, 'Copied!');
  });

  els.copyLinkBtn.addEventListener('click', () => {
    if (!state.roomCode) return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', state.roomCode);
    navigator.clipboard.writeText(url.toString());
    flashButtonText(els.copyLinkBtn, 'Link Copied!');
  });

  els.copyPgnBtn.addEventListener('click', () => {
    const pgn = state.chess.pgn() || 'No moves played';
    navigator.clipboard.writeText(pgn);
    flashButtonText(els.copyPgnBtn, 'Copied!');
  });

  // Game actions
  els.resignBtn.addEventListener('click', () => {
    if (!state.gameActive) return;
    const resigningColor = isOnlineMode() || isBotMode() ? state.myColor : state.chess.turn();
    const winner = resigningColor === 'w' ? 'Black' : 'White';
    endGame('Resignation', `${winner} wins by resignation`, '🏳️');
    sendPeerData({ type: 'resign', color: resigningColor });
  });

  els.offerDrawBtn.addEventListener('click', () => {
    if (!state.gameActive) return;
    if (isOnlineMode()) {
      sendPeerData({ type: 'draw-offer' });
      flashButtonText(els.offerDrawBtn, 'Offer Sent');
    } else {
      endGame('Draw Agreed', 'Game drawn by mutual agreement', '🤝');
    }
  });

  els.acceptDrawBtn.addEventListener('click', () => {
    els.drawOfferBanner.classList.add('hidden');
    endGame('Draw Agreed', 'Game drawn by mutual agreement', '🤝');
    sendPeerData({ type: 'draw-accept' });
  });

  els.declineDrawBtn.addEventListener('click', () => {
    els.drawOfferBanner.classList.add('hidden');
    sendPeerData({ type: 'draw-decline' });
  });

  els.rematchBtn.addEventListener('click', () => {
    if (isOnlineMode()) {
      // Swap colors on rematch
      const newMyColor = state.myColor === 'w' ? 'b' : 'w';
      startNewBoardSession({
        myColor: newMyColor,
        minutes: state.timeMinutes,
        increment: state.timeIncrement
      });
      sendPeerData({
        type: 'rematch',
        hostColor: newMyColor,
        minutes: state.timeMinutes,
        increment: state.timeIncrement
      });
    } else if (isBotMode()) {
      const newMyColor = state.myColor === 'w' ? 'b' : 'w';
      startNewBoardSession({
        myColor: newMyColor,
        minutes: state.timeMinutes,
        increment: state.timeIncrement
      });
      if (state.chess.turn() !== state.myColor) {
        scheduleBotMove();
      }
    } else {
      startNewBoardSession({
        myColor: 'w',
        minutes: state.timeMinutes,
        increment: state.timeIncrement
      });
    }
  });

  els.newSetupBtn.addEventListener('click', () => {
    els.gameOverOverlay.classList.add('hidden');
    els.setupModal.classList.remove('hidden');
  });
}

function flashButtonText(btn, tempText) {
  const orig = btn.textContent;
  btn.textContent = tempText;
  setTimeout(() => {
    btn.textContent = orig;
  }, 1500);
}

function switchSetupTab(tabMode) {
  state.setupTab = tabMode;
  els.modeTabs.forEach((t) => {
    t.classList.toggle('active', t.dataset.mode === tabMode);
  });
  els.setupErrorMsg.classList.add('hidden');

  if (tabMode === 'online-host') {
    els.botSelectSection.classList.add('hidden');
    els.joinRoomSection.classList.add('hidden');
    els.gameSettingsSection.classList.remove('hidden');
    els.colorSelectSection.classList.remove('hidden');
    els.localOptionsSection.classList.add('hidden');
    els.startActionBtn.textContent = 'Create Room & Get Link';
  } else if (tabMode === 'online-join') {
    els.botSelectSection.classList.add('hidden');
    els.joinRoomSection.classList.remove('hidden');
    els.gameSettingsSection.classList.add('hidden');
    els.startActionBtn.textContent = 'Join Friend’s Room';
  } else if (tabMode === 'local') {
    els.botSelectSection.classList.add('hidden');
    els.joinRoomSection.classList.add('hidden');
    els.gameSettingsSection.classList.remove('hidden');
    els.colorSelectSection.classList.add('hidden');
    els.localOptionsSection.classList.remove('hidden');
    els.startActionBtn.textContent = 'Start Local Game';
  } else if (tabMode === 'bot') {
    els.botSelectSection.classList.remove('hidden');
    els.joinRoomSection.classList.add('hidden');
    els.gameSettingsSection.classList.remove('hidden');
    els.colorSelectSection.classList.remove('hidden');
    els.localOptionsSection.classList.add('hidden');
    els.startActionBtn.textContent = 'Start Game vs Bot';
  }
}

function readTimerConfig() {
  if (state.isCustomTimer) {
    const mins = Math.max(1, Math.min(180, parseInt(els.customMinInput.value, 10) || 10));
    const inc = Math.max(0, Math.min(60, parseInt(els.customIncInput.value, 10) || 0));
    state.timeMinutes = mins;
    state.timeIncrement = inc;
  }
  state.unlimitedTime = state.timeMinutes === 0;
}

function handleStartAction() {
  els.setupErrorMsg.classList.add('hidden');
  readTimerConfig();

  if (state.setupTab === 'local') {
    cleanupPeer();
    state.mode = 'local';
    state.autoFlipLocal = els.autoFlipCheckbox.checked;
    els.roomBanner.classList.add('hidden');
    els.connectionPill.classList.add('hidden');
    els.setupModal.classList.add('hidden');
    startNewBoardSession({
      myColor: 'w',
      minutes: state.timeMinutes,
      increment: state.timeIncrement
    });
  } else if (state.setupTab === 'bot') {
    cleanupPeer();
    state.mode = 'bot';
    let playerColor = state.hostColorPref;
    if (playerColor === 'random') {
      playerColor = Math.random() < 0.5 ? 'w' : 'b';
    }
    els.roomBanner.classList.add('hidden');
    els.connectionPill.classList.add('hidden');
    els.setupModal.classList.add('hidden');
    startNewBoardSession({
      myColor: playerColor,
      minutes: state.timeMinutes,
      increment: state.timeIncrement
    });
    if (state.chess.turn() !== state.myColor) {
      scheduleBotMove();
    }
  } else if (state.setupTab === 'online-host') {
    initHostRoom();
  } else if (state.setupTab === 'online-join') {
    const code = els.joinCodeInput.value.trim().toUpperCase();
    if (!code || code.length < 4) {
      showSetupError('Please enter a valid room code from your friend.');
      return;
    }
    initJoinRoom(code);
  }
}

function showSetupError(msg) {
  els.setupErrorMsg.textContent = msg;
  els.setupErrorMsg.classList.remove('hidden');
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ==========================================
// WebRTC P2P Networking (PeerJS)
// ==========================================
function cleanupPeer() {
  if (state.conn) {
    try { state.conn.close(); } catch (_) {}
    state.conn = null;
  }
  if (state.peer) {
    try { state.peer.destroy(); } catch (_) {}
    state.peer = null;
  }
  state.connected = false;
}

function initHostRoom() {
  cleanupPeer();
  state.mode = 'online-host';
  state.roomCode = generateRoomCode();

  els.startActionBtn.disabled = true;
  els.startActionBtn.textContent = 'Creating Room...';

  const peerId = PEER_PREFIX + state.roomCode;
  const peer = new Peer(peerId);
  state.peer = peer;

  peer.on('open', () => {
    els.startActionBtn.disabled = false;
    els.startActionBtn.textContent = 'Create Room & Get Link';
    els.setupModal.classList.add('hidden');

    // Determine host piece color
    let hostColor = state.hostColorPref;
    if (hostColor === 'random') {
      hostColor = Math.random() < 0.5 ? 'w' : 'b';
    }

    // Show Room Banner
    els.roomBanner.classList.remove('hidden');
    els.displayRoomCode.textContent = state.roomCode;
    els.roomHintText.textContent = 'Waiting for friend to join via code or invite link...';
    setConnectionStatus('waiting', 'Waiting for friend...');

    startNewBoardSession({
      myColor: hostColor,
      minutes: state.timeMinutes,
      increment: state.timeIncrement,
      waitingForPeer: true
    });
  });

  peer.on('connection', (conn) => {
    // Only allow 1 active opponent connection
    if (state.conn && state.conn.open) {
      conn.close();
      return;
    }
    state.conn = conn;
    setupPeerConnectionHandlers(conn, true);
  });

  peer.on('error', (err) => {
    els.startActionBtn.disabled = false;
    els.startActionBtn.textContent = 'Create Room & Get Link';
    if (err.type === 'unavailable-id') {
      initHostRoom(); // Retry with new code
    } else {
      showSetupError(`Network error: ${err.message || err.type}`);
    }
  });
}

function initJoinRoom(code) {
  cleanupPeer();
  state.mode = 'online-join';
  state.roomCode = code;

  els.startActionBtn.disabled = true;
  els.startActionBtn.textContent = 'Connecting...';

  const peer = new Peer();
  state.peer = peer;

  peer.on('open', () => {
    const conn = peer.connect(PEER_PREFIX + code, { reliable: true });
    state.conn = conn;
    setupPeerConnectionHandlers(conn, false);
  });

  peer.on('error', (err) => {
    els.startActionBtn.disabled = false;
    els.startActionBtn.textContent = 'Join Friend’s Room';
    showSetupError(`Could not connect to room "${code}". Check the code and try again.`);
  });
}

function setupPeerConnectionHandlers(conn, isHost) {
  conn.on('open', () => {
    state.connected = true;
    els.startActionBtn.disabled = false;
    els.setupModal.classList.add('hidden');
    setConnectionStatus('connected', 'Friend Connected');
    els.roomBanner.classList.remove('hidden');
    els.displayRoomCode.textContent = state.roomCode;
    els.roomHintText.textContent = 'Connected! Playing live peer-to-peer.';

    if (isHost) {
      // Send initial game config to joiner
      state.gameActive = true;
      conn.send({
        type: 'init-game',
        guestColor: state.myColor === 'w' ? 'b' : 'w',
        minutes: state.timeMinutes,
        increment: state.timeIncrement,
        fen: state.chess.fen()
      });
      sfx.gameOver();
      updateUI();
    }
  });

  conn.on('data', (data) => {
    handlePeerMessage(data);
  });

  conn.on('close', () => {
    state.connected = false;
    setConnectionStatus('disconnected', 'Friend Disconnected');
    if (state.gameActive) {
      endGame('Disconnected', 'Opponent disconnected from the room', '🔌');
    }
  });
}

function handlePeerMessage(data) {
  if (!data || !data.type) return;

  switch (data.type) {
    case 'init-game': {
      state.timeMinutes = data.minutes;
      state.timeIncrement = data.increment;
      state.unlimitedTime = data.minutes === 0;
      startNewBoardSession({
        myColor: data.guestColor,
        minutes: data.minutes,
        increment: data.increment,
        waitingForPeer: false
      });
      sfx.gameOver();
      break;
    }

    case 'move': {
      applyMoveOnBoard(data.from, data.to, data.promotion, false);
      if (data.clocks && !state.unlimitedTime) {
        state.clocks = data.clocks;
        renderClocks();
      }
      break;
    }

    case 'resign': {
      const winner = data.color === 'w' ? 'Black' : 'White';
      endGame('Resignation', `${winner} wins by resignation`, '🏆');
      break;
    }

    case 'draw-offer': {
      els.drawOfferBanner.classList.remove('hidden');
      break;
    }

    case 'draw-accept': {
      els.drawOfferBanner.classList.add('hidden');
      endGame('Draw Agreed', 'Game drawn by mutual agreement', '🤝');
      break;
    }

    case 'draw-decline': {
      flashButtonText(els.offerDrawBtn, 'Declined');
      break;
    }

    case 'rematch': {
      const myNewColor = data.hostColor === 'w' ? 'b' : 'w';
      startNewBoardSession({
        myColor: myNewColor,
        minutes: data.minutes,
        increment: data.increment,
        waitingForPeer: false
      });
      break;
    }

    case 'timeout': {
      const winner = data.loser === 'w' ? 'Black' : 'White';
      endGame('Time Out', `${winner} wins on time`, '⏱️');
      break;
    }
  }
}

function sendPeerData(payload) {
  if (state.conn && state.conn.open) {
    state.conn.send(payload);
  }
}

function setConnectionStatus(statusType, text) {
  els.connectionPill.classList.remove('hidden', 'connected', 'disconnected');
  if (statusType === 'connected') els.connectionPill.classList.add('connected');
  if (statusType === 'disconnected') els.connectionPill.classList.add('disconnected');
  els.connStatusText.textContent = text;
}

function isOnlineMode() {
  return state.mode === 'online-host' || state.mode === 'online-join';
}

function isBotMode() {
  return state.mode === 'bot';
}

function getActiveBotInfo() {
  const base = BOT_PROFILES[state.botType] || BOT_PROFILES.vasya;
  const level = state.botType === 'custom' ? state.customBotLevel : base.level;
  return { ...base, level };
}

// ==========================================
// Game Session & Clocks
// ==========================================
function startNewBoardSession({ myColor = 'w', minutes = 10, increment = 0, waitingForPeer = false }) {
  stopClock();
  state.botSessionId++;
  state.botThinking = false;
  state.chess.reset();
  state.myColor = myColor;
  state.flipped = myColor === 'b';
  state.timeMinutes = minutes;
  state.timeIncrement = increment;
  state.unlimitedTime = minutes === 0;

  const initialMs = minutes * 60 * 1000;
  state.clocks = { w: initialMs, b: initialMs };
  state.selectedSquare = null;
  state.legalMoves = [];
  state.lastMove = null;
  state.pendingPromotion = null;
  state.gameOverReason = null;
  state.gameActive = !waitingForPeer;

  els.gameOverOverlay.classList.add('hidden');
  els.promotionOverlay.classList.add('hidden');
  els.drawOfferBanner.classList.add('hidden');

  // Clear URL invite param cleanly so refreshing doesn't force join modal
  if (window.history && window.history.replaceState) {
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  renderBoard();
  updateUI();
}

function startClockIfNeeded() {
  if (state.unlimitedTime || state.clockInterval || !state.gameActive) return;
  state.lastTickTime = performance.now();
  state.clockInterval = setInterval(() => {
    if (!state.gameActive) {
      stopClock();
      return;
    }
    const now = performance.now();
    const dt = now - state.lastTickTime;
    state.lastTickTime = now;

    const turn = state.chess.turn();
    state.clocks[turn] = Math.max(0, state.clocks[turn] - dt);
    renderClocks();

    if (state.clocks[turn] <= 0) {
      state.clocks[turn] = 0;
      renderClocks();
      const winner = turn === 'w' ? 'Black' : 'White';
      endGame('Time Out', `${winner} wins on time`, '⏱️');
      sendPeerData({ type: 'timeout', loser: turn });
    }
  }, 100);
}

function stopClock() {
  if (state.clockInterval) {
    clearInterval(state.clockInterval);
    state.clockInterval = null;
  }
}

function formatClock(ms) {
  if (state.unlimitedTime) return '∞';
  const totalTenths = Math.ceil(ms / 100);
  const totalSeconds = Math.floor(totalTenths / 10);
  const tenths = totalTenths % 10;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  if (mins === 0 && totalSeconds < 20) {
    return `${secs}.${tenths}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function renderClocks() {
  const topColor = state.flipped ? 'w' : 'b';
  const bottomColor = state.flipped ? 'b' : 'w';
  const turn = state.chess.turn();

  els.topClock.textContent = formatClock(state.clocks[topColor]);
  els.bottomClock.textContent = formatClock(state.clocks[bottomColor]);

  els.topClock.classList.toggle('active', state.gameActive && turn === topColor);
  els.bottomClock.classList.toggle('active', state.gameActive && turn === bottomColor);

  els.topClock.classList.toggle('low-time', !state.unlimitedTime && state.clocks[topColor] < 30000);
  els.bottomClock.classList.toggle('low-time', !state.unlimitedTime && state.clocks[bottomColor] < 30000);
}

// ==========================================
// Board Rendering & Move Interaction
// ==========================================
function renderBoard() {
  els.board.innerHTML = '';
  const boardData = state.chess.board();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const rowOrder = state.flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colOrder = state.flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const inCheck = state.chess.in_check();
  const turn = state.chess.turn();

  rowOrder.forEach((rIdx, visualRow) => {
    colOrder.forEach((cIdx, visualCol) => {
      const sqName = files[cIdx] + ranks[rIdx];
      const isLight = (rIdx + cIdx) % 2 === 0;
      const piece = boardData[rIdx][cIdx];

      const sqEl = document.createElement('div');
      sqEl.className = `square ${isLight ? 'light' : 'dark'}`;
      sqEl.dataset.square = sqName;

      // Last move highlight
      if (state.lastMove && (state.lastMove.from === sqName || state.lastMove.to === sqName)) {
        sqEl.classList.add('last-move');
      }

      // Selected square
      if (state.selectedSquare === sqName) {
        sqEl.classList.add('selected');
      }

      // King in check highlight
      if (inCheck && piece && piece.type === 'k' && piece.color === turn) {
        sqEl.classList.add('in-check');
      }

      // Coordinates on outer edges
      if (visualCol === 0) {
        const rankSpan = document.createElement('span');
        rankSpan.className = 'coord-rank';
        rankSpan.textContent = ranks[rIdx];
        sqEl.appendChild(rankSpan);
      }
      if (visualRow === 7) {
        const fileSpan = document.createElement('span');
        fileSpan.className = 'coord-file';
        fileSpan.textContent = files[cIdx];
        sqEl.appendChild(fileSpan);
      }

      // Piece SVG
      if (piece) {
        const svgKey = piece.color + piece.type.toUpperCase();
        sqEl.insertAdjacentHTML('beforeend', PIECE_SVGS[svgKey] || '');
      }

      // Legal move indicator
      const legalMove = state.legalMoves.find((m) => m.to === sqName);
      if (legalMove) {
        const ind = document.createElement('div');
        ind.className = piece || legalMove.flags.includes('e') ? 'capture-ring' : 'move-dot';
        sqEl.appendChild(ind);
      }

      // Pointer / Touch interaction
      sqEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handleSquareClick(sqName);
      });

      els.board.appendChild(sqEl);
    });
  });
}

function canPlayerMoveNow() {
  if (!state.gameActive) return false;
  if (isOnlineMode()) {
    return state.connected && state.chess.turn() === state.myColor;
  }
  if (isBotMode()) {
    return !state.botThinking && state.chess.turn() === state.myColor;
  }
  return true;
}

function handleSquareClick(sqName) {
  if (!canPlayerMoveNow()) return;

  // Check if clicked square is a legal destination for the currently selected piece
  const targetMove = state.legalMoves.find((m) => m.to === sqName);
  if (state.selectedSquare && targetMove) {
    // Check if promotion is required
    if (targetMove.flags.includes('p')) {
      showPromotionDialog(state.selectedSquare, sqName);
    } else {
      applyMoveOnBoard(state.selectedSquare, sqName, 'q', true);
    }
    return;
  }

  // Otherwise check if user clicked one of their own pieces
  const piece = state.chess.get(sqName);
  const allowedColor = isOnlineMode() || isBotMode() ? state.myColor : state.chess.turn();

  if (piece && piece.color === allowedColor && piece.color === state.chess.turn()) {
    if (state.selectedSquare === sqName) {
      state.selectedSquare = null;
      state.legalMoves = [];
    } else {
      state.selectedSquare = sqName;
      state.legalMoves = state.chess.moves({ square: sqName, verbose: true });
    }
    renderBoard();
  } else {
    state.selectedSquare = null;
    state.legalMoves = [];
    renderBoard();
  }
}

function showPromotionDialog(from, to) {
  state.pendingPromotion = { from, to };
  const turn = state.chess.turn();
  const pieces = ['q', 'r', 'b', 'n'];

  els.promotionOptions.innerHTML = '';
  pieces.forEach((p) => {
    const btn = document.createElement('button');
    btn.className = 'promo-btn';
    btn.innerHTML = PIECE_SVGS[turn + p.toUpperCase()];
    btn.addEventListener('click', () => {
      els.promotionOverlay.classList.add('hidden');
      applyMoveOnBoard(from, to, p, true);
      state.pendingPromotion = null;
    });
    els.promotionOptions.appendChild(btn);
  });

  els.promotionOverlay.classList.remove('hidden');
}

function applyMoveOnBoard(from, to, promotion = 'q', isLocalAction = true) {
  const moveCasterTurn = state.chess.turn();
  const moveObj = state.chess.move({ from, to, promotion });
  if (!moveObj) return;

  // Apply increment after move if clock is running
  if (!state.unlimitedTime && state.chess.history().length > 1) {
    state.clocks[moveCasterTurn] += state.timeIncrement * 1000;
  }

  // Start clock after first move
  if (!state.unlimitedTime && state.chess.history().length >= 1) {
    startClockIfNeeded();
  }

  state.selectedSquare = null;
  state.legalMoves = [];
  state.lastMove = { from, to };

  // Auto-flip in local mode if enabled
  if (state.mode === 'local' && state.autoFlipLocal) {
    state.flipped = state.chess.turn() === 'b';
  }

  // Play sound
  if (state.chess.in_checkmate() || state.chess.in_draw()) {
    sfx.gameOver();
  } else if (state.chess.in_check()) {
    sfx.check();
  } else if (moveObj.captured) {
    sfx.capture();
  } else {
    sfx.move();
  }

  // Broadcast move to peer if online
  if (isLocalAction && isOnlineMode()) {
    sendPeerData({
      type: 'move',
      from,
      to,
      promotion,
      clocks: state.clocks
    });
  }

  renderBoard();
  updateUI();
  checkGameOverConditions();

  if (isBotMode() && state.gameActive && !state.chess.game_over() && state.chess.turn() !== state.myColor) {
    scheduleBotMove();
  }
}

function checkGameOverConditions() {
  if (!state.chess.game_over()) return;

  if (state.chess.in_checkmate()) {
    const winner = state.chess.turn() === 'w' ? 'Black' : 'White';
    endGame('Checkmate!', `${winner} wins by checkmate`, '🏆');
  } else if (state.chess.in_stalemate()) {
    endGame('Stalemate', 'Draw by stalemate', '🤝');
  } else if (state.chess.in_threefold_repetition()) {
    endGame('Draw', 'Draw by threefold repetition', '🤝');
  } else if (state.chess.insufficient_material()) {
    endGame('Draw', 'Draw by insufficient material', '🤝');
  } else if (state.chess.in_draw()) {
    endGame('Draw', 'Draw by 50-move rule', '🤝');
  }
}

function endGame(title, subtitle, icon = '🏆') {
  state.gameActive = false;
  state.botThinking = false;
  state.botSessionId++;
  state.gameOverReason = subtitle;
  stopClock();

  els.gameOverIcon.textContent = icon;
  els.gameOverTitle.textContent = title;
  els.gameOverSubtitle.textContent = subtitle;
  els.gameOverOverlay.classList.remove('hidden');

  updateUI();
}

// ==========================================
// UI Updates (Player Bars, Captured, Moves)
// ==========================================
function updateUI() {
  updatePlayerBars();
  updateStatusCard();
  updateMoveHistory();
  renderClocks();

  els.offerDrawBtn.disabled = !state.gameActive || isBotMode();
  els.resignBtn.disabled = !state.gameActive;
}

function setPlayerAvatar(el, color) {
  if (isBotMode() && color !== state.myColor) {
    const bot = getActiveBotInfo();
    if (bot.avatarImg) {
      el.innerHTML = `<img src="${bot.avatarImg}" alt="${bot.name}" />`;
    } else {
      el.textContent = bot.avatarEmoji || '🤖';
    }
    return;
  }
  el.textContent = color === 'w' ? '♔' : '♚';
}

function updatePlayerBars() {
  const topColor = state.flipped ? 'w' : 'b';
  const bottomColor = state.flipped ? 'b' : 'w';

  if (isOnlineMode()) {
    els.topPlayerName.textContent =
      topColor === state.myColor ? `You (${colorName(topColor)})` : `Friend (${colorName(topColor)})`;
    els.bottomPlayerName.textContent =
      bottomColor === state.myColor ? `You (${colorName(bottomColor)})` : `Friend (${colorName(bottomColor)})`;
  } else if (isBotMode()) {
    const bot = getActiveBotInfo();
    const botLabel = `${bot.name} (Lvl ${bot.level})`;
    els.topPlayerName.textContent =
      topColor === state.myColor ? `You (${colorName(topColor)})` : botLabel;
    els.bottomPlayerName.textContent =
      bottomColor === state.myColor ? `You (${colorName(bottomColor)})` : botLabel;
  } else {
    els.topPlayerName.textContent = `${colorName(topColor)} Player`;
    els.bottomPlayerName.textContent = `${colorName(bottomColor)} Player`;
  }

  setPlayerAvatar(els.topAvatar, topColor);
  setPlayerAvatar(els.bottomAvatar, bottomColor);

  // Calculate captured pieces & material advantage
  const { capturedByWhite, capturedByBlack, whiteAdv } = computeMaterialAndCaptures();

  els.topCaptured.textContent = topColor === 'w' ? capturedByWhite : capturedByBlack;
  els.bottomCaptured.textContent = bottomColor === 'w' ? capturedByWhite : capturedByBlack;

  const topAdv = topColor === 'w' ? whiteAdv : -whiteAdv;
  const bottomAdv = bottomColor === 'w' ? whiteAdv : -whiteAdv;

  if (topAdv > 0) {
    els.topMaterialBadge.textContent = `+${topAdv}`;
    els.topMaterialBadge.classList.remove('hidden');
  } else {
    els.topMaterialBadge.classList.add('hidden');
  }

  if (bottomAdv > 0) {
    els.bottomMaterialBadge.textContent = `+${bottomAdv}`;
    els.bottomMaterialBadge.classList.remove('hidden');
  } else {
    els.bottomMaterialBadge.classList.add('hidden');
  }
}

function computeMaterialAndCaptures() {
  const startCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };

  const board = state.chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (sq && sq.type !== 'k') {
        current[sq.color][sq.type]++;
      }
    }
  }

  let capturedByWhite = '';
  let capturedByBlack = '';
  const order = ['q', 'r', 'b', 'n', 'p'];

  order.forEach((type) => {
    const missingBlack = Math.max(0, startCounts[type] - current.b[type]);
    for (let i = 0; i < missingBlack; i++) capturedByWhite += PIECE_UNICODE.b[type];

    const missingWhite = Math.max(0, startCounts[type] - current.w[type]);
    for (let i = 0; i < missingWhite; i++) capturedByBlack += PIECE_UNICODE.w[type];
  });

  let whiteScore = 0;
  let blackScore = 0;
  order.forEach((type) => {
    whiteScore += current.w[type] * PIECE_VALUES[type];
    blackScore += current.b[type] * PIECE_VALUES[type];
  });

  return {
    capturedByWhite,
    capturedByBlack,
    whiteAdv: whiteScore - blackScore
  };
}

function updateStatusCard() {
  const turn = state.chess.turn();
  els.turnDot.className = `turn-dot ${turn === 'w' ? 'white' : 'black'}`;

  if (!state.gameActive && state.gameOverReason) {
    els.statusText.textContent = state.gameOverReason;
  } else if (isOnlineMode() && !state.connected) {
    els.statusText.textContent = 'Waiting for friend to join...';
  } else {
    const checkSuffix = state.chess.in_check() ? ' (Check!)' : '';
    if (isOnlineMode()) {
      els.statusText.textContent =
        turn === state.myColor
          ? `Your turn (${colorName(turn)})${checkSuffix}`
          : `Friend's turn (${colorName(turn)})${checkSuffix}`;
    } else if (isBotMode()) {
      const bot = getActiveBotInfo();
      els.statusText.textContent =
        turn === state.myColor
          ? `Your turn (${colorName(turn)})${checkSuffix}`
          : `${bot.name} is thinking...`;
    } else {
      els.statusText.textContent = `${colorName(turn)} to move${checkSuffix}`;
    }
  }

  if (isOnlineMode()) {
    els.modeTag.textContent = '🌐 Online P2P';
  } else if (isBotMode()) {
    const bot = getActiveBotInfo();
    els.modeTag.textContent = `🤖 vs ${bot.name} (Lvl ${bot.level})`;
  } else {
    els.modeTag.textContent = '📱 Local Pass & Play';
  }
  els.timerTag.textContent = state.unlimitedTime
    ? '∞ Unlimited'
    : `⏱️ ${state.timeMinutes}+${state.timeIncrement}`;
}

function updateMoveHistory() {
  const history = state.chess.history();
  if (history.length === 0) {
    els.movesList.innerHTML = `<div class="moves-empty">No moves yet. Make a move to start!</div>`;
    return;
  }

  els.movesList.innerHTML = '';
  for (let i = 0; i < history.length; i += 2) {
    const row = document.createElement('div');
    row.className = 'move-row';
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = history[i] || '';
    const blackMove = history[i + 1] || '';

    row.innerHTML = `
      <span class="move-num">${moveNumber}.</span>
      <span class="move-san">${whiteMove}</span>
      <span class="move-san">${blackMove}</span>
    `;
    els.movesList.appendChild(row);
  }
  els.movesList.scrollTop = els.movesList.scrollHeight;
}

function colorName(c) {
  return c === 'w' ? 'White' : 'Black';
}

// ==========================================
// Chess Bot Engine (Levels 1 - 10)
// ==========================================
const AI_PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables from White's perspective (row 0 = rank 8, row 7 = rank 1)
const PST = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 27, 27, 10,  5,  5],
    [0,  0,  0, 22, 22,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-22,-22, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,   0,  5,  5,  5,  5,  0, -5],
    [0,    0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20,  20,  0,  0,  0,  0, 20, 20],
    [20,  30, 10,  0,  0, 10, 30, 20]
  ]
};

function getBotThinkDelayMs(level) {
  const minDelay = 500 + level * 200; // Lvl 1: 700ms, Lvl 3: 1100ms, Lvl 10: 2500ms
  const jitter = 400 + level * 140;   // Lvl 1: +0..540ms, Lvl 10: +0..1800ms
  let delayMs = minDelay + Math.floor(Math.random() * jitter);

  // Speed up under low-clock time pressure so the bot doesn't flag itself
  if (!state.unlimitedTime) {
    const botColor = state.myColor === 'w' ? 'b' : 'w';
    const remainingMs = state.clocks[botColor];
    if (remainingMs < 20000) {
      delayMs = Math.min(delayMs, Math.max(250, Math.floor(remainingMs * 0.25)));
    }
  }
  return delayMs;
}

function scheduleBotMove() {
  const sessionId = state.botSessionId;
  state.botThinking = true;
  updateStatusCard();

  const bot = getActiveBotInfo();
  const delayMs = getBotThinkDelayMs(bot.level);

  setTimeout(() => {
    if (sessionId !== state.botSessionId || !state.gameActive || state.chess.game_over()) {
      state.botThinking = false;
      return;
    }

    const chosenMove = computeBotMove(state.chess, bot.level);
    state.botThinking = false;

    if (chosenMove && sessionId === state.botSessionId && state.gameActive) {
      applyMoveOnBoard(chosenMove.from, chosenMove.to, chosenMove.promotion || 'q', false);
    }
  }, delayMs);
}

function evaluateBoardForSide(chess, perspectiveColor) {
  if (chess.in_checkmate()) {
    return chess.turn() === perspectiveColor ? -99999 : 99999;
  }
  if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition() || chess.insufficient_material()) {
    return 0;
  }

  const board = chess.board();
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const pstRow = piece.color === 'w' ? r : 7 - r;
      const val = AI_PIECE_VALUES[piece.type] + PST[piece.type][pstRow][c];
      score += piece.color === perspectiveColor ? val : -val;
    }
  }
  return score;
}

function orderMoves(moves) {
  return moves.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.captured) scoreA += AI_PIECE_VALUES[a.captured] * 10 - AI_PIECE_VALUES[a.piece];
    if (b.captured) scoreB += AI_PIECE_VALUES[b.captured] * 10 - AI_PIECE_VALUES[b.piece];
    if (a.promotion) scoreA += AI_PIECE_VALUES[a.promotion];
    if (b.promotion) scoreB += AI_PIECE_VALUES[b.promotion];
    if (a.san && a.san.includes('+')) scoreA += 45;
    if (b.san && b.san.includes('+')) scoreB += 45;
    return scoreB - scoreA;
  });
}

function quiescence(chess, alpha, beta, maximizing, perspectiveColor, qDepth, deadline) {
  const standPat = evaluateBoardForSide(chess, perspectiveColor);
  if (qDepth <= 0 || performance.now() > deadline) return standPat;

  if (maximizing) {
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const captures = orderMoves(chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion));
    for (let i = 0; i < captures.length; i++) {
      chess.move(captures[i]);
      const score = quiescence(chess, alpha, beta, false, perspectiveColor, qDepth - 1, deadline);
      chess.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    if (standPat <= alpha) return alpha;
    if (beta > standPat) beta = standPat;

    const captures = orderMoves(chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion));
    for (let i = 0; i < captures.length; i++) {
      chess.move(captures[i]);
      const score = quiescence(chess, alpha, beta, true, perspectiveColor, qDepth - 1, deadline);
      chess.undo();
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

function minimax(chess, depth, alpha, beta, maximizing, perspectiveColor, useQuiescence, deadline) {
  if (chess.game_over() || depth === 0 || performance.now() > deadline) {
    if (useQuiescence && !chess.game_over() && performance.now() <= deadline) {
      return quiescence(chess, alpha, beta, maximizing, perspectiveColor, 2, deadline);
    }
    return evaluateBoardForSide(chess, perspectiveColor);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));
  if (moves.length === 0) {
    return evaluateBoardForSide(chess, perspectiveColor);
  }

  if (maximizing) {
    let maxEval = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      chess.move(moves[i]);
      const ev = minimax(chess, depth - 1, alpha, beta, false, perspectiveColor, useQuiescence, deadline);
      chess.undo();
      if (ev > maxEval) maxEval = ev;
      if (ev > alpha) alpha = ev;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (let i = 0; i < moves.length; i++) {
      chess.move(moves[i]);
      const ev = minimax(chess, depth - 1, alpha, beta, true, perspectiveColor, useQuiescence, deadline);
      chess.undo();
      if (ev < minEval) minEval = ev;
      if (ev < beta) beta = ev;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function computeBotMove(liveChess, level) {
  const chess = new Chess(liveChess.fen());
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // Level 1 (Vasya): Easiest — mostly random, takes an obvious capture only ~20% of the time
  if (level <= 1) {
    const captures = legalMoves.filter((m) => m.captured);
    if (captures.length > 0 && Math.random() < 0.2) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  const botColor = chess.turn();
  const pieceCount = chess.board().flat().filter(Boolean).length;

  // Map difficulty 2..10 to search depth, noise (centipawns), and quiescence
  let depth = 1;
  let noise = 0;
  let useQuiescence = false;

  if (level === 2) {
    depth = 1;
    noise = 260;
  } else if (level === 3) {
    // Mitya (3/10)
    depth = 1;
    noise = 135;
  } else if (level === 4) {
    depth = 2;
    noise = 85;
  } else if (level === 5) {
    depth = 2;
    noise = 35;
  } else if (level === 6) {
    depth = 2;
    noise = 12;
    useQuiescence = true;
  } else if (level === 7) {
    depth = 3;
    noise = 20;
  } else if (level === 8) {
    depth = 3;
    noise = 0;
    useQuiescence = true;
  } else if (level === 9) {
    depth = pieceCount <= 14 ? 4 : 3;
    noise = 0;
    useQuiescence = true;
  } else {
    depth = pieceCount <= 20 ? 4 : 3;
    noise = 0;
    useQuiescence = true;
  }

  const deadline = performance.now() + 850;
  const ordered = orderMoves(legalMoves);
  const scoredMoves = [];

  for (let i = 0; i < ordered.length; i++) {
    const move = ordered[i];
    chess.move(move);
    let score = minimax(chess, depth - 1, -Infinity, Infinity, false, botColor, useQuiescence, deadline);
    chess.undo();

    if (noise > 0) {
      score += (Math.random() * 2 - 1) * noise;
    } else {
      // Tiny tie-breaker so identical-eval openings vary naturally
      score += Math.random() * 4;
    }

    scoredMoves.push({ move, score });
  }

  scoredMoves.sort((a, b) => b.score - a.score);
  return scoredMoves[0].move;
}

// Boot the app
init();
