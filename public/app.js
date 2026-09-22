'use strict';

// ── LocalStorage keys ─────────────────────────────────────────────────────────
const LS_ROLE   = 'wr_role';
const LS_ROOM   = 'wr_room';
const LS_PID    = 'wr_pid';
const LS_PTOKEN = 'wr_ptoken';
const LS_HTOKEN = 'wr_htoken';
const LS_NAME   = 'wr_name';

const RING_C = 2 * Math.PI * 45;

// ── State ─────────────────────────────────────────────────────────────────────
let socket;
let myRole        = null;
let myPlayerId    = null;
let myPlayerName  = null;
let roomCode      = null;
let roomState     = null;
let isEliminated  = false;
let myElimReason  = null;
let pendingDropId = null;
let pendingKickId = null;
let lastSeenEventId = null;
let lastPendingId   = null;
let prevCurrentWord = null;
let lastTimerSecond = -1;
let lastTickAt      = 0;

// ── Haptics only (all sounds removed) ──
function vibrate() {}


function flashDanger() {
  const v = document.getElementById('danger-vignette');
  if (!v) return;
  v.classList.add('flash');
  setTimeout(() => v.classList.remove('flash'), 600);
}

function clearTension() {
  const v = document.getElementById('danger-vignette');
  if (v) v.classList.remove('active', 'mine');
  document.querySelectorAll('.timer-container').forEach(el => el.classList.remove('shake'));
  lastTickAt = 0;
  updateTimerGlow(null);
}

// ── Animation helpers ─────────────────────────────────────────────────────────

function animatePop(el) {
  if (!el) return;
  el.classList.remove('anim-pop');
  void el.offsetWidth;
  el.classList.add('anim-pop');
  setTimeout(() => el.classList.remove('anim-pop'), 500);
}

function animateWordFlash(el) {
  if (!el) return;
  el.classList.remove('anim-word-flash');
  void el.offsetWidth;
  el.classList.add('anim-word-flash');
  setTimeout(() => el.classList.remove('anim-word-flash'), 700);
}

function animateLetterFlash(el) {
  if (!el) return;
  el.classList.remove('anim-letter-flash');
  void el.offsetWidth;
  el.classList.add('anim-letter-flash');
  setTimeout(() => el.classList.remove('anim-letter-flash'), 700);
}

function animateTimerTick(el) {
  if (!el) return;
  el.classList.remove('anim-timer-tick');
  void el.offsetWidth;
  el.classList.add('anim-timer-tick');
  setTimeout(() => el.classList.remove('anim-timer-tick'), 200);
}

function updateTimerGlow(color) {
  for (const id of ['player-timer-glow', 'host-timer-glow']) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (!color) {
      el.style.background = '';
    } else {
      el.style.background = `radial-gradient(circle, ${color}18 0%, transparent 70%)`;
    }
  }
}

function showGameStartSplash() {
  const overlay = document.getElementById('splash-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  const textEl = overlay.querySelector('.splash-text');
  const steps  = ['٣', '٢', '١', 'انطلق!'];
  let i = 0;
  const tick = () => {
    if (i >= steps.length) { overlay.classList.add('hidden'); return; }
    textEl.textContent = steps[i];
    textEl.classList.remove('anim-splash');
    void textEl.offsetWidth;
    textEl.classList.add('anim-splash');
    i++;
    setTimeout(tick, i < steps.length ? 420 : 800);
  };
  tick();
}

function spawnConfetti(count = 90) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  // Palette-harmonious confetti: olive, cream, cognac, warm gold, sage, terracotta
  const colors = ['#14b8a6','#5eead4','#2dd4bf','#0d9488','#67e8f9','#99f6e4','#a7f3d0','#6ee7b7'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-particle';
    const size = 5 + Math.random() * 10;
    p.style.cssText = [
      `left:${Math.random() * 100}%`,
      `background:${colors[Math.floor(Math.random() * colors.length)]}`,
      `width:${size}px`, `height:${size}px`,
      `animation-duration:${1.5 + Math.random() * 2.5}s`,
      `animation-delay:${Math.random() * 0.9}s`,
      `border-radius:${Math.random() > 0.4 ? '50%' : '2px'}`,
    ].join(';');
    container.appendChild(p);
  }
  setTimeout(() => container.remove(), 5500);
}

function flashElimScreen() {
  const el = document.getElementById('elim-flash-overlay');
  if (!el) return;
  el.classList.remove('anim-elim-flash');
  void el.offsetWidth;
  el.classList.add('anim-elim-flash');
}

function mapClamp(x, x0, x1, y0, y1) {
  const t = Math.max(0, Math.min(1, (x - x0) / (x1 - x0)));
  return y0 + (y1 - y0) * t;
}

function tickIntervalMs(rem) {
  return rem > 3 ? mapClamp(rem, 6, 3, 900, 360) : mapClamp(rem, 3, 0, 500, 210);
}

function updateTension(game, rem) {
  const playing  = roomState && roomState.status === 'playing';
  const liveTurn = playing && game && !game.pendingWord && !game.pausedReason && game.currentTurnPlayerId;

  if (!liveTurn) { clearTension(); return; }

  const isMyTurn  = myRole === 'player' && !isEliminated && game.currentTurnPlayerId === myPlayerId;
  const now       = performance.now();

  if (rem <= 6) {
    if (now - lastTickAt >= tickIntervalMs(rem)) {
      lastTickAt = now;
      if (rem <= 3 && isMyTurn) vibrate(55);
    }
  } else {
    lastTickAt = 0;
  }

  const danger = rem <= 3;
  const v = document.getElementById('danger-vignette');
  if (v) {
    v.classList.toggle('active', danger);
    v.classList.toggle('mine', danger && isMyTurn);
  }
  document.querySelectorAll('.timer-container')
    .forEach(el => el.classList.toggle('shake', danger && isMyTurn));
}

// ── Arabic letter helpers ─────────────────────────────────────────────────────
function stripDiacritics(s) { return s.replace(/[ً-ْٰـ]/g, ''); }
function unifyHamza(ch) { return 'أإآٱ'.includes(ch) ? 'ا' : ch; }

function requiredNextLetter(word) {
  const w = stripDiacritics(word).trim();
  let last = w[w.length - 1];
  if (last === 'ة' || last === 'ى') last = w[w.length - 2];
  return last ? unifyHamza(last) : '';
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  socket = io();
  setupSocketListeners();
  setupUIListeners();
  setupFirstWordInput();
  startTimerLoop();
  routeLanding();
  tryReconnect();

  // Keep landing links working with browser back/forward
  window.addEventListener('popstate', () => {
    const landing = document.getElementById('screen-landing');
    if (landing && !landing.classList.contains('hidden')) routeLanding();
  });
});

// ── Landing routing: separate links for host (/host) and player (/player) ────
const LANDING_VIEWS = ['choice', 'host', 'join'];

function setLandingView(view) {
  LANDING_VIEWS.forEach(v => {
    document.getElementById('landing-' + v)?.classList.toggle('hidden', v !== view);
  });
  document.getElementById('landing-error')?.classList.add('hidden');
}

function showLandingChoice() { setLandingView('choice'); }
function showLandingHost()   { setLandingView('host'); }
function showLandingJoin() {
  setLandingView('join');
  setTimeout(() => document.getElementById('input-room-code')?.focus(), 50);
}

// Show the landing sub-view that matches the current URL (path + ?join=CODE)
function routeLanding() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code   = (params.get('join') || '').trim().toUpperCase();

    // An invite link (?join=CODE) is always a player action
    if (code && /^[A-Z0-9]{4}$/.test(code)) {
      const codeInput = document.getElementById('input-room-code');
      const nameInput = document.getElementById('input-player-name');
      if (codeInput) codeInput.value = code;
      if (window.history?.replaceState) history.replaceState({}, '', '/player');
      setLandingView('join');
      setTimeout(() => nameInput?.focus(), 50);
      return;
    }

    const path = (window.location.pathname || '/').toLowerCase();
    if (path === '/host')                            showLandingHost();
    else if (path === '/player' || path === '/join') showLandingJoin();
    else                                             showLandingChoice();
  } catch (_) {
    showLandingChoice();
  }
}

// Switch landing links (host/player/choice) without a full page reload
function navLanding(path, view) {
  if (window.history?.pushState) history.pushState({}, '', path);
  setLandingView(view);
  if (view === 'join') setTimeout(() => document.getElementById('input-room-code')?.focus(), 50);
}

// ── Build the player invite URL for a room ──────────────────────────────────
function buildInviteUrl(code) {
  return `${window.location.origin}/player?join=${encodeURIComponent(code)}`;
}

function setupFirstWordInput() {
  const input    = document.getElementById('input-first-word');
  const preview  = document.getElementById('first-word-letter-preview');
  const valEl    = document.getElementById('fwl-value');
  const startBtn = document.getElementById('btn-start-game');

  input.addEventListener('input', () => {
    const w = input.value.trim();
    const errEl = document.getElementById('first-word-error');
    errEl.classList.add('hidden');

    if (!w) { preview.classList.add('hidden'); startBtn.disabled = true; return; }
    if (/\s/.test(w)) {
      preview.classList.add('hidden'); startBtn.disabled = true;
      showError(errEl, 'كلمة واحدة فقط بدون مسافات'); return;
    }

    const letter = requiredNextLetter(w);
    if (letter) {
      valEl.textContent = letter;
      preview.classList.remove('hidden');
      startBtn.disabled = false;
    } else {
      preview.classList.add('hidden');
      startBtn.disabled = true;
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !startBtn.disabled) startGame();
  });
}

function tryReconnect() {
  const role = localStorage.getItem(LS_ROLE);
  const code = localStorage.getItem(LS_ROOM);
  if (!role || !code) return;

  if (role === 'host') {
    const hToken = localStorage.getItem(LS_HTOKEN);
    if (!hToken) { clearSession(); showScreen('landing'); return; }
    socket.emit('reconnectHost', { code, hostToken: hToken }, res => {
      if (!res.success) { clearSession(); showScreen('landing'); return; }
      myRole = 'host'; roomCode = code;
      handleRoomState(res.roomState);
    });
  } else if (role === 'player') {
    const pid  = localStorage.getItem(LS_PID);
    const tok  = localStorage.getItem(LS_PTOKEN);
    const name = localStorage.getItem(LS_NAME);
    if (!pid || !tok) { clearSession(); showScreen('landing'); return; }
    socket.emit('joinRoom', { code, name, playerId: pid, token: tok }, res => {
      if (!res.success) { clearSession(); showScreen('landing'); return; }
      myRole = 'player'; myPlayerId = res.playerId;
      myPlayerName = res.playerName || name; roomCode = code;
      const me = res.roomState?.players?.find(p => p.id === myPlayerId);
      if (me?.eliminated) { isEliminated = true; myElimReason = me.eliminationReason; }
      handleRoomState(res.roomState);
    });
  }
}

function clearSession() {
  [LS_ROLE, LS_ROOM, LS_PID, LS_PTOKEN, LS_HTOKEN, LS_NAME].forEach(k => localStorage.removeItem(k));
}

function setupSocketListeners() {
  socket.on('roomState',        handleRoomState);
  socket.on('playerEliminated', handlePlayerEliminated);
  socket.on('gameEnded',        handleGameEnded);
  socket.on('gameResumed',      () => handleRoomState(roomState));
  socket.on('yourTurn',         handleYourTurn);
  socket.on('pendingApproval',  handlePendingApproval);
  socket.on('kickedFromRoom',   handleKickedFromRoom);
  socket.on('roomClosed',       handleRoomClosed);
}

function handleRoomState(state) {
  if (!state) return;

  // ── FIX: stamp the time we received this state for clock-skew-corrected timer
  if (state.game) state.game._clientReceivedAt = Date.now();

  const prev = roomState;
  if (prev) {
    // Only show splash when transitioning FROM lobby TO playing (new game start)
    if (state.status === 'playing' && prev.status === 'lobby') {
      showGameStartSplash();
    }

    const prevWord = prev.game?.currentWord;
    const newWord  = state.game?.currentWord;
    if (newWord && newWord !== prevWord && prevCurrentWord !== undefined) {
      requestAnimationFrame(() => {
        animateWordFlash(document.getElementById('player-current-word'));
        animateWordFlash(document.getElementById('host-current-word'));
        animateWordFlash(document.getElementById('elim-current-word'));
        animateLetterFlash(document.getElementById('player-required-letter'));
        animateLetterFlash(document.getElementById('host-required-letter'));
        animateLetterFlash(document.getElementById('elim-required-letter'));
      });
    }
    prevCurrentWord = newWord ?? null;

    const prevPend = prev.game?.pendingWord;
    const newPend  = state.game?.pendingWord;
    if (newPend && newPend !== prevPend) {
      if (myRole === 'host') {
        vibrate([80, 55, 80]);
        requestAnimationFrame(() => {
          const panel = document.getElementById('host-approval-panel');
          if (panel && !panel.classList.contains('hidden')) animatePop(panel);
        });
      }
    }
  }

  roomState = state;
  const { status } = state;

  // ── FIX: clear eliminated flag when game resets ───────────────────────────
  // 'lobby' = host navigated back for new round; 'ended' = game just finished
  // and player is about to rejoin. 'playing' covers mid-game reconnect.
  if (myRole === 'player' && isEliminated) {
    if (status === 'lobby' || status === 'ended') {
      isEliminated = false; myElimReason = null;
    } else if (status === 'playing') {
      const me = state.players.find(p => p.id === myPlayerId);
      if (me && me.alive) { isEliminated = false; myElimReason = null; }
    }
  }

  if (myRole === 'host') {
    if (status === 'ended') {
      showScreen('winner'); renderWinner(state, true);
    } else if (status === 'lobby') {
      showScreen('host-lobby'); renderHostLobby(state); lastSeenEventId = null;
    } else {
      showScreen('host-game'); renderHostGame(state);
    }
    return;
  }

  if (myRole === 'player') {
    if (status === 'ended') {
      showScreen('winner'); renderWinner(state, false); hidePausedOverlay(); return;
    }
    if (isEliminated) {
      showScreen('eliminated'); renderEliminated(state); updatePausedOverlay(state); return;
    }
    if (status === 'lobby') {
      showScreen('player-lobby'); renderPlayerLobby(state); hidePausedOverlay();
    } else {
      showScreen('player-game'); renderPlayerGame(state); updatePausedOverlay(state);
    }
  }
}

const ALL_SCREENS = [
  'landing','host-lobby','player-lobby',
  'host-game','player-game','eliminated','winner',
];

function showScreen(name) {
  ALL_SCREENS.forEach(s => {
    const el = document.getElementById('screen-' + s);
    el.classList.toggle('hidden', s !== name);
    el.style.display = '';
  });
  // Always land back on the host/player choice, not a half-filled join form
  if (name === 'landing') showLandingChoice();
}

function renderHostLobby(state) {
  document.getElementById('host-room-code').textContent   = state.code;
  document.getElementById('host-lobby-count').textContent = state.players.length;
  renderPlayerList('host-lobby-players', state.players, null, null, { canKick: true });

  const startBtn = document.getElementById('btn-start-game');
  startBtn.textContent = (state.lastWinner ? '🔄 ' : '▶ ') + 'بدء اللعبة';
  const w = document.getElementById('input-first-word')?.value.trim();
  startBtn.disabled = !w || /\s/.test(w);

  const currentMode = state.timerMode ?? 'dynamic';
  document.querySelectorAll('#host-timer-opts .timer-opt').forEach(btn => {
    const raw = btn.dataset.secs;
    const val = raw === 'dynamic' ? 'dynamic' : parseInt(raw, 10);
    btn.classList.toggle('active',
      raw === 'dynamic' ? currentMode === 'dynamic' : val === currentMode);
  });
}

function renderPlayerLobby(state) {
  document.getElementById('player-lobby-code').textContent  = state.code;
  document.getElementById('player-lobby-count').textContent = state.players.length;
  renderPlayerList('player-lobby-players', state.players, null, myPlayerId);
}

function renderPlayerGame(state) {
  const game = state.game;
  if (!game) return;

  const isMeTurn  = game.currentTurnPlayerId === myPlayerId;
  const isPending = !!game.pendingWord;
  const isPaused  = !!game.pausedReason;
  const canSubmit = isMeTurn && !isPending && !isPaused && state.status === 'playing';

  const banner = document.getElementById('turn-status');
  if (isPending && isMeTurn) {
    banner.className = 'turn-status turn-pending';
    banner.textContent = '⏳ في انتظار قرار الحكم...';
  } else if (isMeTurn) {
    banner.className = 'turn-status turn-active';
    banner.textContent = '🎯 دورك الآن!';
  } else {
    banner.className = 'turn-status turn-waiting';
    const tp = state.players.find(p => p.id === game.currentTurnPlayerId);
    banner.textContent = `⏳ في انتظار: ${tp?.name || '...'}`;
  }

  document.getElementById('player-current-word').textContent   = game.currentWord || '—';
  document.getElementById('player-required-letter').textContent = game.requiredLetter || '—';

  const input = document.getElementById('player-word-input');
  const btn   = document.getElementById('btn-submit-word');
  input.disabled = !canSubmit;
  btn.disabled   = !canSubmit;
  document.querySelector('.submit-area')?.classList.toggle('my-turn', canSubmit);

  document.getElementById('pending-notice').classList.toggle('hidden', !(isPending && isMeTurn));

  renderPlayerList('player-game-players', state.players, game.currentTurnPlayerId, myPlayerId);
  renderWordsList('player-used-words', 'player-words-count', game.usedWords, game.requiredLetter);
}

function renderHostGame(state) {
  const game   = state.game;
  const status = state.status;

  document.getElementById('host-game-code').textContent = state.code;

  if (!game) {
    document.getElementById('host-new-game-panel').classList.remove('hidden');
    return;
  }

  document.getElementById('host-tier-badge').textContent     = game.tierLabel || '—';
  document.getElementById('host-current-word').textContent    = game.currentWord || '—';
  document.getElementById('host-required-letter').textContent = game.requiredLetter || '—';

  const approvalPanel = document.getElementById('host-approval-panel');
  if (game.pendingWord) {
    approvalPanel.classList.remove('hidden');
    document.getElementById('approval-player-name').textContent = game.pendingPlayerName || '';
    document.getElementById('approval-word-text').textContent   = game.pendingWord;
  } else {
    approvalPanel.classList.add('hidden');
  }

  const pausePanel = document.getElementById('host-pause-controls');
  if (status === 'paused' && game.pausedReason === 'player' && game.pausedForPlayerId) {
    pausePanel.classList.remove('hidden');
    pendingDropId = game.pausedForPlayerId;
    document.getElementById('host-pause-msg').textContent =
      `انقطع اتصال اللاعب: ${game.pausedForPlayerName || ''}`;
  } else {
    pausePanel.classList.add('hidden');
    pendingDropId = null;
  }

  const manualBanner = document.getElementById('host-manual-pause-banner');
  const btnPause     = document.getElementById('btn-timer-pause');
  const btnResume    = document.getElementById('btn-timer-resume');
  const btnMinus     = document.getElementById('btn-timer-minus');
  const btnPlus      = document.getElementById('btn-timer-plus');
  const btnEnd       = document.getElementById('btn-end-game');
  const isManual     = status === 'paused' && game.pausedReason === 'manual';
  const isAnyPaused  = status === 'paused';
  const hasPending   = !!game.pendingWord;

  manualBanner.classList.toggle('hidden', !isManual);
  btnPause.classList.toggle('hidden',  isAnyPaused);
  btnResume.classList.toggle('hidden', !isManual);
  btnMinus.disabled  = hasPending || isAnyPaused;
  btnPlus.disabled   = hasPending || isAnyPaused;
  btnPause.disabled  = hasPending || isAnyPaused;
  btnResume.disabled = hasPending;
  btnEnd.disabled    = hasPending;

  document.getElementById('host-new-game-panel').classList.add('hidden');

  renderPlayerList('host-game-players', state.players, game.currentTurnPlayerId, null, { canKick: true });
  renderWordsList('host-used-words', 'host-words-count', game.usedWords, game.requiredLetter);
  renderEvents(game.events);
}

function renderEliminated(state) {
  const game = state.game;
  document.getElementById('elim-reason').textContent         = myElimReason || '';
  document.getElementById('elim-current-word').textContent   = game?.currentWord || '—';
  document.getElementById('elim-required-letter').textContent = game?.requiredLetter || '—';
  renderPlayerList('elim-players', state.players.filter(p => p.alive), game?.currentTurnPlayerId, null);
  renderWordsList('elim-used-words', 'elim-words-count', game?.usedWords || [], game?.requiredLetter);
}

function renderWinner(state, isHost) {
  const w = state.lastWinner;
  document.getElementById('winner-name').textContent = w?.name || 'لا يوجد فائز';
  document.getElementById('btn-winner-new-game').classList.toggle('hidden', !isHost);
}

function renderEvents(events) {
  const ul = document.getElementById('host-events-list');
  const ct = document.getElementById('host-events-count');
  if (!ul) return;
  events = events || [];
  if (ct) ct.textContent = events.length;

  if (events.length === 0) {
    ul.innerHTML = '<li class="events-empty">في انتظار الأحداث...</li>';
    lastSeenEventId = null;
    return;
  }

  const newest = events[events.length - 1];
  const isNew  = newest.id !== lastSeenEventId;

  ul.innerHTML = '';
  events.slice().reverse().forEach((ev, i) => {
    const li = document.createElement('li');
    li.className = `event-item event-${ev.type}`;
    if (i === 0 && isNew) li.classList.add('event-fresh');
    li.innerHTML = formatEvent(ev);
    ul.appendChild(li);
  });

  if (isNew) { lastSeenEventId = newest.id; ul.scrollTop = 0; }
}

function formatEvent(ev) {
  const name = escHtml(ev.playerName || '');
  const word = escHtml(ev.word || '');
  switch (ev.type) {
    case 'gameStarted':
      return `<span class="ev-icon">🎮</span><span class="ev-text">بدأت — <strong>${ev.count}</strong> لاعبين — ${escHtml(ev.firstWord||'')}</span>`;
    case 'wordAccepted':
      return `<span class="ev-icon ev-ok">✓</span><span class="ev-text"><strong>${name}</strong>: ${word}</span><span class="ev-meta">→ ${escHtml(ev.nextLetter||'')}</span>`;
    case 'wordRejected':
      return `<span class="ev-icon ev-bad">✗</span><span class="ev-text"><strong>${name}</strong>: ${word}</span><span class="ev-meta">رُفضت</span>`;
    case 'wrongLetter':
      return `<span class="ev-icon ev-bad">⚠</span><span class="ev-text"><strong>${name}</strong>: ${word}</span><span class="ev-meta">حرف خاطئ</span>`;
    case 'repeatedWord':
      return `<span class="ev-icon ev-bad">↻</span><span class="ev-text"><strong>${name}</strong>: ${word}</span><span class="ev-meta">مكررة</span>`;
    case 'timeout':
      return `<span class="ev-icon ev-bad">⏱</span><span class="ev-text"><strong>${name}</strong></span><span class="ev-meta">انتهى الوقت</span>`;
    case 'dropped':
      return `<span class="ev-icon ev-bad">👋</span><span class="ev-text"><strong>${name}</strong></span><span class="ev-meta">انسحب</span>`;
    case 'kicked':
      return `<span class="ev-icon ev-bad">⛔</span><span class="ev-text"><strong>${name}</strong></span><span class="ev-meta">طُرد</span>`;
    default:
      return `<span class="ev-text">${escHtml(ev.type)}</span>`;
  }
}

function renderPlayerList(listId, players, currentTurnId, selfId, opts = {}) {
  const ul = document.getElementById(listId);
  if (!ul) return;
  ul.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.className = 'player-item';
    if (p.id === currentTurnId) li.classList.add('is-current-turn');
    if (p.id === selfId)        li.classList.add('is-me');
    if (p.eliminated)           li.classList.add('is-eliminated');
    if (!p.connected && !p.eliminated) li.classList.add('is-disconnected');

    const avatarClass = p.eliminated ? 'dead' : (p.id === currentTurnId ? 'current' : 'alive');

    const tags = [];
    if (p.id === selfId)        tags.push({ text: 'أنت',       cls: 'tag-me' });
    if (p.id === currentTurnId) tags.push({ text: 'دوره الآن', cls: 'tag-turn' });
    if (!p.connected && !p.eliminated) tags.push({ text: 'منقطع', cls: 'tag-dc' });
    if (p.eliminated)           tags.push({ text: p.eliminationReason || 'خرج', cls: 'tag-elim' });

    const kickable = opts.canKick && !p.eliminated;
    const kickBtn  = kickable
      ? `<button class="btn-kick" data-pid="${p.id}" aria-label="طرد">✕</button>`
      : '';

    li.innerHTML = `
      <div class="player-avatar ${avatarClass}">${p.name.charAt(0)}</div>
      <span class="player-name">${escHtml(p.name)}</span>
      ${tags.map(t => `<span class="player-tag ${t.cls}">${t.text}</span>`).join('')}
      ${kickBtn}
    `;
    ul.appendChild(li);
  });

  if (opts.canKick) {
    ul.querySelectorAll('.btn-kick').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const pid = btn.getAttribute('data-pid');
        const player = players.find(x => x.id === pid);
        if (player) openKickModal(player);
      });
    });
  }
}

function renderWordsList(listId, countId, words, nextLetter) {
  const ul = document.getElementById(listId);
  const ct = document.getElementById(countId);
  if (!ul) return;
  if (ct) ct.textContent = (words || []).length;
  ul.innerHTML = '';
  (words || []).slice().reverse().forEach((entry, ri) => {
    const idx        = (words.length - ri);
    const next       = ri === 0 && nextLetter ? nextLetter : '';
    const wordText   = typeof entry === 'string' ? entry : entry.word;
    const playerName = typeof entry === 'string' ? ''    : entry.playerName;
    const li = document.createElement('li');
    li.className = 'word-item';
    li.innerHTML = `
      <span class="word-index">${idx}</span>
      <span class="word-text">${escHtml(wordText)}</span>
      ${playerName ? `<span class="word-author">${escHtml(playerName)}</span>` : ''}
      ${next ? `<span class="word-letter">→ ${next}</span>` : ''}
    `;
    ul.appendChild(li);
  });
}

function updatePausedOverlay(state) {
  const game = state.game;
  if (state.status === 'paused' && game?.pausedReason) {
    showPausedOverlay(game.pausedReason, game.pausedForPlayerName);
  } else {
    hidePausedOverlay();
  }
}

function showPausedOverlay(reason, playerName) {
  document.getElementById('overlay-paused').classList.remove('hidden');
  if (reason === 'host') {
    document.getElementById('overlay-title').textContent = 'اللعبة متوقفة';
    document.getElementById('overlay-msg').textContent   = 'في انتظار عودة الحكم...';
  } else if (reason === 'manual') {
    document.getElementById('overlay-title').textContent = 'استراحة قصيرة';
    document.getElementById('overlay-msg').textContent   = 'الحكم أوقف المؤقت — انتظر لحظة';
  } else {
    document.getElementById('overlay-title').textContent = 'اللعبة متوقفة مؤقتاً';
    document.getElementById('overlay-msg').textContent   = `انقطع اتصال اللاعب: ${playerName || ''}`;
  }
}

function hidePausedOverlay() {
  document.getElementById('overlay-paused').classList.add('hidden');
}

function handlePlayerEliminated(data) {
  const isMe = data.playerId === myPlayerId;
  if (isMe) { vibrate([200, 80, 200, 80, 200]); flashDanger(); flashElimScreen(); }
  clearTension();
  if (isMe) {
    isEliminated = true; myElimReason = data.reason;
    showScreen('eliminated');
    if (roomState) renderEliminated(roomState);
  }
}

function handleGameEnded(data) {
  const iWon = data.winnerId && data.winnerId === myPlayerId;
  if (iWon) vibrate([100, 50, 100, 50, 240]);
  clearTension();
  if (iWon || myRole === 'host') spawnConfetti(iWon ? 120 : 75);
  const input = document.getElementById('player-word-input');
  if (input) { input.value = ''; input.disabled = true; }
}

function handleYourTurn(data) {
  if (data.playerId === myPlayerId) {
    vibrate([40, 40, 45]);
    setTimeout(() => {
      const input = document.getElementById('player-word-input');
      if (input && !input.disabled) input.focus();
    }, 120);
  }
}

function handlePendingApproval() {
  if (myRole === 'host' && roomState) handleRoomState(roomState);
}

function handleKickedFromRoom(data) {
  vibrate([200, 80, 200]);
  alert(data?.reason || 'طردك الحكم من الغرفة');
  clearSession();
  myRole = null; myPlayerId = null; myPlayerName = null;
  roomCode = null; roomState = null;
  isEliminated = false; myElimReason = null;
  showScreen('landing');
}

function handleRoomClosed() {
  if (myRole !== 'player') return;
  alert('أنهى الهوست الغرفة');
  resetClientState();
}

function startTimerLoop() { setInterval(updateTimers, 100); }

function computeRemaining(game) {
  if (!game) return 0;

  // ── FIX: use server-computed remaining time to avoid clock skew ─────────────
  // Server sends serverTimeRemaining (computed at broadcast time) + serverNow.
  // We add the time elapsed since the server sent this snapshot.
  if (game.serverTimeRemaining !== undefined && game.serverTimeRemaining !== null) {
    if (game.pausedReason) return game.serverTimeRemaining;
    if (game.pendingWord)  return game.serverTimeRemaining;
    // Live countdown: subtract time elapsed since server snapshot
    const clientReceivedAt = game._clientReceivedAt || Date.now();
    const elapsed = (Date.now() - clientReceivedAt) / 1000;
    return Math.max(0, game.serverTimeRemaining - elapsed);
  }

  // Fallback to local calculation if server fields missing
  if (game.pausedReason) return game.frozenTimeRemaining ?? game.timerSeconds;
  if (game.pendingWord) {
    if (game.timerStoppedAt && game.timerStartedAt)
      return Math.max(0, game.timerSeconds - (game.timerStoppedAt - game.timerStartedAt) / 1000);
    return game.timerSeconds;
  }
  if (!game.timerStartedAt) return game.timerSeconds;
  return Math.max(0, game.timerSeconds - (Date.now() - game.timerStartedAt) / 1000);
}

function updateTimers() {
  const game    = roomState?.game;
  const total   = game?.timerSeconds || 10;
  const rem     = computeRemaining(game);
  const pct     = total > 0 ? rem / total : 0;
  const display = Math.ceil(rem);

  // ── Palette-matched timer colors ──────────────────────────────────────────
  // danger (cognac) → warning (warm gold) → mid (olive) → safe (sage)
  const color = rem <= 2 ? '#f87171'
              : rem <= 4 ? '#fbbf24'
              : rem <= 7 ? '#2dd4bf'
              : '#14b8a6';

  const offset = RING_C * (1 - pct);

  if (game && display !== lastTimerSecond && display >= 0) {
    lastTimerSecond = display;
    document.querySelectorAll('.timer-number').forEach(animateTimerTick);
  }

  for (const prefix of ['player', 'host']) {
    const ring = document.getElementById(`${prefix}-ring-fg`);
    const num  = document.getElementById(`${prefix}-timer-number`);
    if (ring) {
      ring.style.strokeDashoffset = offset;
      ring.style.stroke = color;
    }
    if (num) {
      num.textContent = game ? display : '—';
      num.style.fontSize = rem <= 2 ? '2.8rem' : rem <= 4 ? '2.4rem' : '2.2rem';
      num.style.color    = rem <= 5 ? color : '';
    }
  }

  updateTimerGlow(rem <= 5 ? color : null);
  updateTension(game, rem);
}

function setupUIListeners() {

  document.getElementById('btn-create').addEventListener('click', () => {
    socket.emit('createRoom', res => {
      if (!res.success) return;
      myRole = 'host'; roomCode = res.code;
      localStorage.setItem(LS_ROLE,   'host');
      localStorage.setItem(LS_ROOM,   res.code);
      localStorage.setItem(LS_HTOKEN, res.hostToken);
      showScreen('host-lobby');
      document.getElementById('host-room-code').textContent      = res.code;
      document.getElementById('host-lobby-count').textContent     = '0';
      document.getElementById('host-lobby-players').innerHTML     = '';
      document.getElementById('input-first-word').value          = '';
      document.getElementById('first-word-letter-preview').classList.add('hidden');
      document.getElementById('btn-start-game').disabled          = true;

      // Populate invite link + reveal native Share button if supported
      const inviteInput = document.getElementById('host-invite-link');
      if (inviteInput) inviteInput.value = buildInviteUrl(res.code);
      const shareBtn = document.getElementById('btn-share-invite');
      if (shareBtn) shareBtn.classList.toggle('hidden', !navigator.share);
      document.getElementById('invite-copied-msg')?.classList.add('hidden');
    });
  });

  // Copy invite link to clipboard
  document.getElementById('btn-copy-invite')?.addEventListener('click', async () => {
    const inviteInput = document.getElementById('host-invite-link');
    const msgEl       = document.getElementById('invite-copied-msg');
    const url         = inviteInput?.value || '';
    if (!url) return;

    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        ok = true;
      } else if (inviteInput) {
        inviteInput.select();
        ok = document.execCommand('copy');
      }
    } catch (_) { ok = false; }

    if (ok && msgEl) {
      msgEl.textContent = '✓ تم النسخ';
      msgEl.classList.remove('hidden');
      setTimeout(() => msgEl.classList.add('hidden'), 1800);
    } else if (msgEl) {
      msgEl.textContent = '✗ تعذّر النسخ — انسخ الرابط يدوياً';
      msgEl.style.color = '#f87171';
      msgEl.classList.remove('hidden');
      setTimeout(() => {
        msgEl.classList.add('hidden');
        msgEl.style.color = '';
      }, 2500);
    }
  });

  // Native share (mobile — WhatsApp/Telegram/etc)
  document.getElementById('btn-share-invite')?.addEventListener('click', async () => {
    const url = document.getElementById('host-invite-link')?.value || '';
    if (!url || !navigator.share) return;
    try {
      await navigator.share({
        title: 'سباق الكلمات ⚡',
        text: 'انضم إلى غرفتي في سباق الكلمات:',
        url,
      });
    } catch (_) { /* user cancelled — ignore */ }
  });

  // Separate entry links: host (/host) and player (/player), plus back (/)
  document.getElementById('btn-goto-host').addEventListener('click', () => navLanding('/host', 'host'));
  document.getElementById('btn-goto-join').addEventListener('click', () => navLanding('/player', 'join'));
  document.querySelectorAll('.btn-landing-back').forEach(b =>
    b.addEventListener('click', () => navLanding('/', 'choice')));

  document.getElementById('btn-join').addEventListener('click', joinRoom);
  document.getElementById('input-room-code').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('input-player-name').focus();
  });
  document.getElementById('input-player-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') joinRoom();
  });

  document.getElementById('btn-start-game').addEventListener('click', startGame);

  document.getElementById('btn-submit-word').addEventListener('click', submitWord);
  document.getElementById('player-word-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitWord();
  });

  document.getElementById('btn-accept').addEventListener('click', () => {
    socket.emit('judgeDecision', { accept: true });
  });
  document.getElementById('btn-reject').addEventListener('click', () => {
    socket.emit('judgeDecision', { accept: false });
  });

  document.getElementById('btn-wait-player').addEventListener('click', () => {});

  document.getElementById('btn-drop-player').addEventListener('click', () => {
    if (!pendingDropId) return;
    socket.emit('hostDropPlayer', { playerId: pendingDropId }, res => {
      if (res && !res.success) alert('تعذّر إزالة اللاعب');
    });
  });

  document.getElementById('btn-new-game').addEventListener('click',         () => showScreen('host-lobby'));
  document.getElementById('btn-winner-new-game').addEventListener('click',  () => showScreen('host-lobby'));

  document.getElementById('btn-timer-minus').addEventListener('click', () => socket.emit('hostAdjustTimer', { delta: -5 }));
  document.getElementById('btn-timer-plus').addEventListener('click',  () => socket.emit('hostAdjustTimer', { delta: +5 }));

  document.getElementById('btn-timer-pause').addEventListener('click', () => {
    socket.emit('hostPauseTimer', res => {
      if (res && !res.success && res.reason) alert(res.reason);
    });
  });
  document.getElementById('btn-timer-resume').addEventListener('click', () => socket.emit('hostResumeTimer'));

  document.getElementById('btn-end-game').addEventListener('click', openEndGameModal);
  document.getElementById('btn-end-no-winner').addEventListener('click', () => {
    if (!confirm('إنهاء اللعبة بدون فائز؟')) return;
    socket.emit('hostEndGame', { winnerId: null }, () => closeEndGameModal());
  });
  document.getElementById('btn-end-cancel').addEventListener('click', closeEndGameModal);

  document.getElementById('btn-kick-confirm').addEventListener('click', () => {
    if (!pendingKickId) { closeKickModal(); return; }
    socket.emit('hostKickPlayer', { playerId: pendingKickId }, res => {
      if (res && !res.success) alert('تعذّر طرد اللاعب');
    });
    closeKickModal();
  });
  document.getElementById('btn-kick-cancel').addEventListener('click', closeKickModal);

  document.getElementById('host-timer-opts').addEventListener('click', e => {
    const btn = e.target.closest('.timer-opt');
    if (!btn) return;
    const raw  = btn.dataset.secs;
    const mode = raw === 'dynamic' ? 'dynamic' : parseInt(raw, 10);
    socket.emit('setTimerMode', { mode });
  });

  document.getElementById('btn-leave-lobby').addEventListener('click', () => {
    socket.emit('leaveRoom', {}, () => resetClientState());
  });

  document.getElementById('btn-leave-game').addEventListener('click', () => {
    if (!confirm('هل أنت متأكد أنك تريد مغادرة اللعبة؟')) return;
    socket.emit('leaveRoom', {}, () => resetClientState());
  });

  document.getElementById('btn-host-exit-lobby').addEventListener('click', () => {
    socket.emit('closeRoom', {}, () => resetClientState());
  });

  document.getElementById('btn-host-exit-game').addEventListener('click', () => {
    if (!confirm('هل أنت متأكد أنك تريد إنهاء الغرفة لجميع اللاعبين؟')) return;
    socket.emit('closeRoom', {}, () => resetClientState());
  });

  document.getElementById('btn-host-exit-winner').addEventListener('click', () => {
    socket.emit('closeRoom', {}, () => resetClientState());
  });
}

function resetClientState() {
  clearSession();
  myRole = null; myPlayerId = null; myPlayerName = null;
  roomCode = null; roomState = null;
  isEliminated = false; myElimReason = null;
  showScreen('landing');
}

function startGame() {
  const input = document.getElementById('input-first-word');
  const errEl = document.getElementById('first-word-error');
  const word  = input.value.trim();

  if (!word) { showError(errEl, 'اكتب الكلمة الأولى قبل البدء'); input.focus(); return; }
  if (/\s/.test(word)) { showError(errEl, 'كلمة واحدة فقط بدون مسافات'); input.focus(); return; }

  errEl.classList.add('hidden');
  socket.emit('startGame', { firstWord: word }, res => {
    if (res && !res.success) showError(errEl, res.reason || 'خطأ في بدء اللعبة');
  });
}

function openEndGameModal() {
  if (!roomState) return;
  const ul = document.getElementById('end-game-winner-list');
  ul.innerHTML = '';
  const alive = roomState.players.filter(p => p.alive);
  if (!alive.length) {
    ul.innerHTML = '<li class="events-empty">لا يوجد لاعبون أحياء</li>';
  } else {
    alive.forEach(p => {
      const li = document.createElement('li');
      li.className = 'player-item end-game-pick';
      li.innerHTML = `
        <div class="player-avatar alive">${escHtml(p.name.charAt(0))}</div>
        <span class="player-name">${escHtml(p.name)}</span>
        <span class="player-tag tag-turn">اختر فائزاً</span>
      `;
      li.addEventListener('click', () => {
        if (!confirm(`إنهاء اللعبة وإعلان ${p.name} فائزاً؟`)) return;
        socket.emit('hostEndGame', { winnerId: p.id }, () => closeEndGameModal());
      });
      ul.appendChild(li);
    });
  }
  document.getElementById('end-game-modal').classList.remove('hidden');
  document.getElementById('end-game-modal').style.display = '';
}

function closeEndGameModal() {
  document.getElementById('end-game-modal').classList.add('hidden');
}

function openKickModal(player) {
  pendingKickId = player.id;
  document.getElementById('kick-modal-msg').textContent =
    `هل تريد طرد "${player.name}" من الغرفة؟`;
  document.getElementById('kick-modal').classList.remove('hidden');
  document.getElementById('kick-modal').style.display = '';
}

function closeKickModal() {
  pendingKickId = null;
  document.getElementById('kick-modal').classList.add('hidden');
}



function joinRoom() {
  const code  = document.getElementById('input-room-code').value.trim().toUpperCase();
  const name  = document.getElementById('input-player-name').value.trim();
  const errEl = document.getElementById('landing-error');

  if (!code || code.length !== 4) { showError(errEl, 'أدخل رمز الغرفة (4 أحرف)'); return; }
  if (!name)                       { showError(errEl, 'أدخل اسمك'); return; }

  errEl.classList.add('hidden');
  socket.emit('joinRoom', { code, name }, res => {
    if (!res.success) { showError(errEl, res.reason || 'خطأ في الانضمام'); return; }
    myRole = 'player'; myPlayerId = res.playerId;
    myPlayerName = res.playerName || name;
    roomCode = res.roomState?.code || code;
    localStorage.setItem(LS_ROLE,   'player');
    localStorage.setItem(LS_ROOM,   roomCode);
    localStorage.setItem(LS_PID,    res.playerId);
    localStorage.setItem(LS_PTOKEN, res.token);
    localStorage.setItem(LS_NAME,   myPlayerName);
    handleRoomState(res.roomState);
  });
}

function submitWord() {
  const input = document.getElementById('player-word-input');
  const errEl = document.getElementById('submit-error');
  const word  = input.value.trim();

  if (!word)         { showError(errEl, 'الكلمة فارغة'); return; }
  if (/\s/.test(word)) { showError(errEl, 'كلمة واحدة فقط بدون مسافات'); return; }

  errEl.classList.add('hidden');
  input.disabled = true;
  document.getElementById('btn-submit-word').disabled = true;

  socket.emit('submitWord', { word }, res => {
    if (res && !res.success && !res.pending) {
      input.value = '';
    } else if (res?.pending) {
      input.value = '';
      document.getElementById('pending-notice').classList.remove('hidden');
    }
  });
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
