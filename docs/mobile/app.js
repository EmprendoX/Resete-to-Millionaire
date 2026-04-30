/* ==========================================================================
   THE RESETE ORDER — Mobile PWA
   Entry point. No Electron, no subliminal flashes. Just binaural + audios.
   ========================================================================== */

import { binauralPrograms } from './src/binauralPrograms.js';
import { BinauralAudioEngine } from './src/binauralAudioEngine.js';

const STORAGE_KEYS = {
  settings: 'r2m-mobile:settings',
  language: 'r2m-mobile:language',
  wakeLock: 'r2m-mobile:wakeLock',
  audio: 'r2m-mobile:audio'
};

const DEFAULT_SETTINGS = {
  programId: null,
  binauralVolume: 50,
  activeView: 'binaural'
};

const DEFAULT_AUDIO_SETTINGS = {
  speed: 1.0,
  loop: false,
  volume: 1.0,
  lastTrackId: null
};

const SPEED_CYCLE = [1.0, 1.25, 1.5, 2.0, 0.75];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  settings: { ...DEFAULT_SETTINGS },
  audio: { ...DEFAULT_AUDIO_SETTINGS },
  language: 'es',
  tracks: [],
  currentTrack: null,
  // Binaural session runtime
  sessionStartAt: null,
  sessionDurationSec: 0,
  sessionTickTimer: null,
  activePhaseIndex: -1,
  activePureFreqId: null,
  // Wake Lock
  wakeLockEnabled: false,
  wakeLockSentinel: null,
  // Translations
  translations: { es: {}, en: {} }
};

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const els = {};

function cacheDom() {
  els.splash = $('#splash');
  els.app = $('#app');

  // Tabs
  els.tabs = $$('.tab');
  els.views = {
    binaural: $('#view-binaural'),
    audios: $('#view-audios'),
    courses: $('#view-courses'),
    'master-ai': $('#view-master-ai'),
    community: $('#view-community'),
    settings: $('#view-settings')
  };

  // Binaural
  els.programSelect = $('#programSelect');
  els.programName = $('#programName');
  els.programObjective = $('#programObjective');
  els.programCarrier = $('#programCarrier');
  els.programDuration = $('#programDuration');
  els.programPhases = $('#programPhases');
  els.binauralVolume = $('#binauralVolume');
  els.binauralVolumeValue = $('#binauralVolumeValue');
  els.binauralPlay = $('#binauralPlay');
  els.binauralStop = $('#binauralStop');
  els.binauralDot = $('#binauralDot');
  els.binauralStatus = $('#binauralStatus');
  els.phaseCurrent = $('#phaseCurrent');
  els.phaseCurrentName = $('#phaseCurrentName');
  els.sessionProgress = $('#sessionProgress');
  els.sessionElapsed = $('#sessionElapsed');
  els.sessionRemaining = $('#sessionRemaining');
  els.pureFreqGrid = $('#pureFreqGrid');

  // Audios
  els.trackList = $('#trackList');
  els.miniPlayer = $('#miniPlayer');
  els.miniTitle = $('#miniTitle');
  els.miniClose = $('#miniClose');
  els.miniSeek = $('#miniSeek');
  els.miniElapsed = $('#miniElapsed');
  els.miniDuration = $('#miniDuration');
  els.miniLoop = $('#miniLoop');
  els.miniPlay = $('#miniPlay');
  els.miniPlayIcon = $('#miniPlayIcon');
  els.miniSpeed = $('#miniSpeed');
  els.miniSpeedLabel = $('#miniSpeedLabel');

  // Settings
  els.languageSelect = $('#languageSelect');
  els.wakeLockToggle = $('#wakeLockToggle');
  els.appVersion = $('#appVersion');

  // Toast
  els.toast = $('#toast');
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed != null ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Persist failed', key, err);
  }
}

function persistSettings() {
  saveToStorage(STORAGE_KEYS.settings, state.settings);
}
function persistAudio() {
  saveToStorage(STORAGE_KEYS.audio, state.audio);
}

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
async function loadTranslations() {
  try {
    const [es, en] = await Promise.all([
      fetch('locales/es.json').then((r) => r.json()),
      fetch('locales/en.json').then((r) => r.json())
    ]);
    state.translations.es = es;
    state.translations.en = en;
  } catch (err) {
    console.warn('No se pudieron cargar traducciones', err);
  }
}

function t(key, fallback = '') {
  const lang = state.translations[state.language] || {};
  return lang[key] ?? fallback ?? key;
}

function applyTranslations() {
  document.documentElement.setAttribute('lang', state.language);
  $$('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const val = t(key, el.textContent);
    el.textContent = val;
  });
  $$('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const val = t(key, el.getAttribute('placeholder') || '');
    el.setAttribute('placeholder', val);
  });
  if (els.binauralStatus) {
    const active = state.sessionStartAt != null;
    els.binauralStatus.textContent = active ? t('status_running', 'En sesión') : t('status_stopped', 'Detenido');
  }
}

function tArray(key) {
  const lang = state.translations[state.language] || {};
  const val = lang[key];
  if (Array.isArray(val) && val.length) return val;
  const fallback = (state.translations.es || {})[key];
  return Array.isArray(fallback) ? fallback : [];
}

function setLanguage(lang) {
  if (!['es', 'en'].includes(lang)) return;
  state.language = lang;
  saveToStorage(STORAGE_KEYS.language, lang);
  applyTranslations();
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

function formatMinutes(totalMinutes) {
  if (!Number.isFinite(totalMinutes)) return '—';
  const mins = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - mins) * 60);
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs}s`;
}

function showToast(message, duration = 2200) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    els.toast.hidden = true;
  }, duration);
}

function updateRangeFill(input) {
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const val = Number(input.value) || 0;
  const pct = ((val - min) / (max - min)) * 100;
  input.style.setProperty('--val', `${pct}%`);
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
function setActiveView(name) {
  if (!els.views[name]) return;
  state.settings.activeView = name;
  persistSettings();

  els.tabs.forEach((tab) => {
    const isActive = tab.dataset.view === name;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  Object.entries(els.views).forEach(([key, node]) => {
    if (!node) return;
    if (key === name) {
      node.hidden = false;
      node.classList.add('is-active');
    } else {
      node.hidden = true;
      node.classList.remove('is-active');
    }
  });

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function bindTabs() {
  els.tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setActiveView(tab.dataset.view);
    });
  });
}

// ===========================================================================
// BINAURAL
// ===========================================================================
const binauralEngine = new BinauralAudioEngine({
  onPhaseStart: handlePhaseStart,
  onSessionEnded: handleSessionEnded,
  onError: (err) => {
    console.error('Binaural error', err);
    showToast(t('error_audio', 'Error de audio'));
    resetBinauralUi();
  }
});

function getSelectedProgram() {
  const id = state.settings.programId;
  return (
    binauralPrograms.find((p) => p.id === id) ||
    binauralPrograms[0] ||
    null
  );
}

function renderProgramList() {
  els.programSelect.innerHTML = '';
  binauralPrograms.forEach((program) => {
    const opt = document.createElement('option');
    opt.value = program.id;
    opt.textContent = program.name;
    els.programSelect.appendChild(opt);
  });

  const prog = getSelectedProgram();
  if (prog) {
    els.programSelect.value = prog.id;
    state.settings.programId = prog.id;
  }
  renderProgramDetails(prog);
}

function renderProgramDetails(program) {
  if (!program) {
    els.programName.textContent = '—';
    els.programObjective.textContent = '';
    els.programCarrier.textContent = '—';
    els.programDuration.textContent = '—';
    els.programPhases.innerHTML = '';
    return;
  }

  els.programName.textContent = program.name;
  els.programObjective.textContent = program.objective || program.shortDescription || '';
  els.programCarrier.textContent = program.carrier;
  els.programDuration.textContent = formatMinutes(program.totalDurationMinutes);

  els.programPhases.innerHTML = '';
  program.phases.forEach((phase, i) => {
    const li = document.createElement('li');
    li.dataset.index = i;
    const beatLabel =
      phase.startBeatFrequency === phase.endBeatFrequency
        ? `${phase.startBeatFrequency} Hz`
        : `${phase.startBeatFrequency} → ${phase.endBeatFrequency} Hz`;
    li.innerHTML = `
      <span class="phase-num">${i + 1}</span>
      <div>
        <div>${phase.name}</div>
        <div class="phase-meta">${beatLabel} · ${formatMinutes(phase.durationMinutes)}</div>
      </div>
    `;
    els.programPhases.appendChild(li);
  });
}

function bindBinauralControls() {
  els.programSelect.addEventListener('change', () => {
    const program = binauralPrograms.find((p) => p.id === els.programSelect.value);
    if (!program) return;
    state.settings.programId = program.id;
    persistSettings();
    renderProgramDetails(program);
    // If playing, restart with the new program
    if (state.sessionStartAt != null) {
      stopBinaural({ silent: true });
      startBinaural();
    } else {
      clearPureFreqSelection();
    }
  });

  els.binauralVolume.value = state.settings.binauralVolume;
  updateRangeFill(els.binauralVolume);
  els.binauralVolumeValue.textContent = `${state.settings.binauralVolume}%`;

  els.binauralVolume.addEventListener('input', () => {
    const val = Number(els.binauralVolume.value);
    state.settings.binauralVolume = val;
    els.binauralVolumeValue.textContent = `${val}%`;
    updateRangeFill(els.binauralVolume);
    binauralEngine.setVolume(val / 100);
  });
  els.binauralVolume.addEventListener('change', persistSettings);

  els.binauralPlay.addEventListener('click', startBinaural);
  els.binauralStop.addEventListener('click', () => stopBinaural({ silent: false }));
}

function startBinaural() {
  const program = getSelectedProgram();
  if (!program) {
    showToast(t('no_program', 'Selecciona un programa'));
    return;
  }

  clearPureFreqSelection();
  runBinauralSession(program);
}

function runBinauralSession(program) {
  try {
    binauralEngine.start({
      program,
      volume: state.settings.binauralVolume / 100
    });

    state.sessionStartAt = Date.now();
    state.sessionDurationSec = program.phases.reduce(
      (acc, p) => acc + p.durationMinutes * 60,
      0
    );
    state.activePhaseIndex = -1;

    els.binauralDot.classList.add('is-active');
    els.binauralStatus.textContent = t('status_running', 'En sesión');
    els.binauralPlay.disabled = true;
    els.binauralStop.disabled = false;
    els.phaseCurrent.hidden = false;

    startSessionTick();
    acquireWakeLockIfEnabled();
  } catch (err) {
    console.error(err);
    showToast(t('error_audio', 'Error al iniciar audio'));
    resetBinauralUi();
  }
}

function stopBinaural({ silent = false } = {}) {
  binauralEngine.stop({ reason: 'manual', notify: false });
  resetBinauralUi();
  if (!silent) {
    showToast(t('session_stopped', 'Sesión detenida'));
  }
}

function resetBinauralUi() {
  state.sessionStartAt = null;
  state.sessionDurationSec = 0;
  state.activePhaseIndex = -1;

  stopSessionTick();

  els.binauralDot.classList.remove('is-active');
  els.binauralStatus.textContent = t('status_stopped', 'Detenido');
  els.binauralPlay.disabled = false;
  els.binauralStop.disabled = true;
  els.phaseCurrent.hidden = true;
  els.sessionProgress.style.width = '0%';
  els.sessionElapsed.textContent = '00:00';
  els.sessionRemaining.textContent = '-00:00';

  $$('.phases li').forEach((li) => li.classList.remove('is-active'));

  clearPureFreqSelection();
  releaseWakeLock();
}

function handlePhaseStart({ index, phase }) {
  state.activePhaseIndex = index;
  els.phaseCurrentName.textContent = phase.name;
  $$('.phases li').forEach((li) => {
    li.classList.toggle('is-active', Number(li.dataset.index) === index);
  });
}

function handleSessionEnded() {
  showToast(t('session_complete', 'Sesión completada'));
  resetBinauralUi();
}

function startSessionTick() {
  stopSessionTick();
  const tick = () => {
    if (state.sessionStartAt == null) return;
    const elapsed = (Date.now() - state.sessionStartAt) / 1000;
    const total = state.sessionDurationSec;
    const pct = total > 0 ? clamp((elapsed / total) * 100, 0, 100) : 0;
    els.sessionProgress.style.width = `${pct}%`;
    els.sessionElapsed.textContent = formatTime(elapsed);
    els.sessionRemaining.textContent = `-${formatTime(Math.max(0, total - elapsed))}`;
  };
  tick();
  state.sessionTickTimer = setInterval(tick, 500);
}

function stopSessionTick() {
  if (state.sessionTickTimer) {
    clearInterval(state.sessionTickTimer);
    state.sessionTickTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Pure frequencies (Delta / Theta / Alpha / Beta / Gamma)
// ---------------------------------------------------------------------------
const PURE_FREQUENCIES = [
  { id: 'delta', hz: 3,  labelKey: 'freq_delta', label: 'Delta' },
  { id: 'theta', hz: 6,  labelKey: 'freq_theta', label: 'Theta' },
  { id: 'alpha', hz: 10, labelKey: 'freq_alpha', label: 'Alpha' },
  { id: 'beta',  hz: 20, labelKey: 'freq_beta',  label: 'Beta'  },
  { id: 'gamma', hz: 40, labelKey: 'freq_gamma', label: 'Gamma' }
];
const PURE_FREQ_DURATION_MIN = 60;
const PURE_FREQ_CARRIER = 128;

function buildPureFreqProgram(f) {
  const phaseName = `${t(f.labelKey, f.label)} ${f.hz} Hz`;
  return {
    id: `pure-${f.id}`,
    name: phaseName,
    carrier: PURE_FREQ_CARRIER,
    totalDurationMinutes: PURE_FREQ_DURATION_MIN,
    phases: [{
      name: phaseName,
      startBeatFrequency: f.hz,
      endBeatFrequency: f.hz,
      durationMinutes: PURE_FREQ_DURATION_MIN
    }]
  };
}

function renderPureFrequencies() {
  if (!els.pureFreqGrid) return;
  els.pureFreqGrid.innerHTML = '';
  PURE_FREQUENCIES.forEach((f) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'freq-chip';
    btn.dataset.id = f.id;
    btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = `
      <span class="freq-chip__name" data-i18n="${f.labelKey}">${f.label}</span>
      <span class="freq-chip__hz">${f.hz} Hz</span>
    `;
    btn.addEventListener('click', () => togglePureFrequency(f));
    els.pureFreqGrid.appendChild(btn);
  });
}

function togglePureFrequency(f) {
  if (state.activePureFreqId === f.id) {
    stopBinaural({ silent: true });
    return;
  }
  startPureFrequency(f);
}

function startPureFrequency(f) {
  stopBinaural({ silent: true });
  const program = buildPureFreqProgram(f);
  state.activePureFreqId = f.id;
  updatePureFreqChips();
  runBinauralSession(program);
}

function clearPureFreqSelection() {
  if (state.activePureFreqId == null) return;
  state.activePureFreqId = null;
  updatePureFreqChips();
}

function updatePureFreqChips() {
  if (!els.pureFreqGrid) return;
  $$('.freq-chip').forEach((chip) => {
    const isActive = chip.dataset.id === state.activePureFreqId;
    chip.classList.toggle('is-active', isActive);
    chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

// ===========================================================================
// AUDIO MP3 PLAYER
// ===========================================================================
const audioEl = new Audio();
audioEl.preload = 'metadata';

async function loadTracks() {
  try {
    const response = await fetch('audio-manifest.json');
    const data = await response.json();
    state.tracks = Array.isArray(data.tracks) ? data.tracks : [];
  } catch (err) {
    console.warn('No se pudo cargar audio-manifest.json', err);
    state.tracks = [];
  }
}

function renderTrackList() {
  els.trackList.innerHTML = '';

  if (!state.tracks.length) {
    const empty = document.createElement('li');
    empty.className = 'track';
    empty.innerHTML = `
      <div class="track__body">
        <div class="track__title">${t('no_tracks', 'No hay audios disponibles')}</div>
        <div class="track__sub muted">${t('no_tracks_sub', 'Verifica que los archivos MP3 estén presentes.')}</div>
      </div>
    `;
    els.trackList.appendChild(empty);
    return;
  }

  state.tracks.forEach((track) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'track';
    btn.dataset.id = track.id;
    btn.innerHTML = `
      <span class="track__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2" fill="none"/></svg>
      </span>
      <div class="track__body">
        <div class="track__title">${track.name}</div>
        <div class="track__sub">${track.category || ''}</div>
      </div>
      <span class="track__cta">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
      </span>
    `;
    btn.addEventListener('click', () => playTrack(track));
    li.appendChild(btn);
    els.trackList.appendChild(li);
  });
}

function playTrack(track) {
  if (!track) return;

  const isSame = state.currentTrack && state.currentTrack.id === track.id;

  if (isSame) {
    // toggle play/pause
    if (audioEl.paused) audioEl.play().catch(warnPlay);
    else audioEl.pause();
    return;
  }

  state.currentTrack = track;
  state.audio.lastTrackId = track.id;
  persistAudio();

  audioEl.src = track.url;
  audioEl.loop = state.audio.loop;
  audioEl.playbackRate = state.audio.speed;
  audioEl.volume = state.audio.volume;

  audioEl.play().catch(warnPlay);

  openMiniPlayer(track);
}

function warnPlay(err) {
  console.warn('Audio play blocked', err);
  showToast(t('tap_to_play', 'Toca de nuevo para reproducir'));
}

function openMiniPlayer(track) {
  els.miniPlayer.hidden = false;
  els.miniTitle.textContent = track.name;
  els.miniDuration.textContent = '0:00';
  els.miniElapsed.textContent = '0:00';
  els.miniSeek.value = 0;
  updateMiniPlayIcon();
  updateTrackListHighlight();
}

function closeMiniPlayer() {
  audioEl.pause();
  audioEl.src = '';
  state.currentTrack = null;
  els.miniPlayer.hidden = true;
  updateTrackListHighlight();
}

function updateTrackListHighlight() {
  $$('.track').forEach((btn) => {
    const id = btn.dataset.id;
    const active = state.currentTrack && state.currentTrack.id === id && !audioEl.paused;
    btn.classList.toggle('is-playing', !!active);
  });
}

function updateMiniPlayIcon() {
  const playing = state.currentTrack && !audioEl.paused;
  if (playing) {
    els.miniPlayIcon.innerHTML = '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>';
    els.miniPlay.setAttribute('aria-label', t('pause', 'Pausar'));
  } else {
    els.miniPlayIcon.innerHTML = '<path d="M8 5v14l11-7z" fill="currentColor"/>';
    els.miniPlay.setAttribute('aria-label', t('play', 'Reproducir'));
  }
}

function bindMiniPlayer() {
  els.miniPlay.addEventListener('click', () => {
    if (!state.currentTrack) return;
    if (audioEl.paused) audioEl.play().catch(warnPlay);
    else audioEl.pause();
  });

  els.miniClose.addEventListener('click', closeMiniPlayer);

  els.miniLoop.addEventListener('click', () => {
    state.audio.loop = !state.audio.loop;
    audioEl.loop = state.audio.loop;
    els.miniLoop.setAttribute('aria-pressed', state.audio.loop ? 'true' : 'false');
    persistAudio();
  });

  els.miniSpeed.addEventListener('click', () => {
    const idx = SPEED_CYCLE.indexOf(state.audio.speed);
    const next = SPEED_CYCLE[(idx + 1) % SPEED_CYCLE.length] || 1.0;
    state.audio.speed = next;
    audioEl.playbackRate = next;
    els.miniSpeedLabel.textContent = `${next.toFixed(2).replace(/\.?0+$/, '')}x`;
    persistAudio();
  });

  els.miniSeek.addEventListener('input', () => {
    if (!audioEl.duration || !Number.isFinite(audioEl.duration)) return;
    const ratio = Number(els.miniSeek.value) / 1000;
    audioEl.currentTime = ratio * audioEl.duration;
    updateRangeFill(els.miniSeek);
  });

  audioEl.addEventListener('play', () => {
    updateMiniPlayIcon();
    updateTrackListHighlight();
    acquireWakeLockIfEnabled();
  });
  audioEl.addEventListener('pause', () => {
    updateMiniPlayIcon();
    updateTrackListHighlight();
  });
  audioEl.addEventListener('ended', () => {
    updateMiniPlayIcon();
    updateTrackListHighlight();
  });
  audioEl.addEventListener('loadedmetadata', () => {
    if (Number.isFinite(audioEl.duration)) {
      els.miniDuration.textContent = formatTime(audioEl.duration);
    }
  });
  audioEl.addEventListener('timeupdate', () => {
    if (!Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
    const ratio = audioEl.currentTime / audioEl.duration;
    els.miniSeek.value = Math.round(ratio * 1000);
    updateRangeFill(els.miniSeek);
    els.miniElapsed.textContent = formatTime(audioEl.currentTime);
  });

  // Initial state
  els.miniLoop.setAttribute('aria-pressed', state.audio.loop ? 'true' : 'false');
  els.miniSpeedLabel.textContent = `${state.audio.speed.toFixed(2).replace(/\.?0+$/, '')}x`;
  updateRangeFill(els.miniSeek);
}

// ===========================================================================
// SETTINGS (language + wake lock)
// ===========================================================================
function bindSettings() {
  els.languageSelect.value = state.language;
  els.languageSelect.addEventListener('change', () => {
    setLanguage(els.languageSelect.value);
  });

  els.wakeLockToggle.checked = state.wakeLockEnabled;
  els.wakeLockToggle.addEventListener('change', async () => {
    state.wakeLockEnabled = els.wakeLockToggle.checked;
    saveToStorage(STORAGE_KEYS.wakeLock, state.wakeLockEnabled);
    if (state.wakeLockEnabled) {
      await acquireWakeLock();
      if (!state.wakeLockSentinel) {
        showToast(t('wake_unavailable', 'Wake Lock no disponible en este navegador'));
      }
    } else {
      releaseWakeLock();
    }
  });
}

async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    state.wakeLockSentinel = await navigator.wakeLock.request('screen');
    state.wakeLockSentinel.addEventListener?.('release', () => {
      state.wakeLockSentinel = null;
    });
  } catch (err) {
    console.warn('wakeLock failed', err);
    state.wakeLockSentinel = null;
  }
}

function releaseWakeLock() {
  if (state.wakeLockSentinel) {
    state.wakeLockSentinel.release().catch(() => {});
    state.wakeLockSentinel = null;
  }
}

async function acquireWakeLockIfEnabled() {
  if (state.wakeLockEnabled && !state.wakeLockSentinel) {
    await acquireWakeLock();
  }
}

// Reacquire on visibility change (wake lock is released when tab backgrounds)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && state.wakeLockEnabled) {
    const isPlaying =
      state.sessionStartAt != null || (state.currentTrack && !audioEl.paused);
    if (isPlaying) await acquireWakeLock();
  }
});

// ===========================================================================
// iOS AudioContext unlock (first user tap)
// ===========================================================================
function installAudioUnlock() {
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        ctx.resume?.();
        setTimeout(() => ctx.close?.(), 250);
      }
    } catch {
      /* noop */
    }
    window.removeEventListener('touchend', unlock, true);
    window.removeEventListener('click', unlock, true);
  };
  window.addEventListener('touchend', unlock, true);
  window.addEventListener('click', unlock, true);
}

// ===========================================================================
// MASTER AI (frontend-only chat simulation)
// ===========================================================================
const MASTER_KEYWORDS = [
  { match: ['dinero', 'abundancia', 'rico', 'millonar', 'prosper', 'atraigo', 'atraer'], key: 'master_reply_abundance' },
  { match: ['miedo', 'ansiedad', 'duda', 'inseguro', 'bloqueo', 'fear', 'afraid', 'anxious'], key: 'master_reply_fear' },
  { match: ['habito', 'hábito', 'rutina', 'disciplina', 'consistencia', 'habit', 'routine'], key: 'master_reply_habits' },
  { match: ['manifestar', 'manifest', 'ley de atrac', 'visualiz'], key: 'master_reply_manifest' },
  { match: ['meditar', 'meditac', 'respir', 'calma', 'meditate', 'breath'], key: 'master_reply_meditate' },
  { match: ['afirmac', 'afirma', 'mantra', 'affirm'], key: 'master_reply_affirm' }
];

const masterChat = {
  form: null,
  input: null,
  thread: null,
  sendBtn: null,
  thinking: false,
  initialized: false
};

function pickMasterReply(text) {
  const normalized = (text || '').toLowerCase();
  for (const rule of MASTER_KEYWORDS) {
    if (rule.match.some((k) => normalized.includes(k))) {
      const pool = tArray(rule.key);
      if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  const fallback = tArray('master_reply_default');
  if (fallback.length) return fallback[Math.floor(Math.random() * fallback.length)];
  return t('master_reply_fallback_text', 'Gracias por compartir. Respira profundo y confía en el proceso.');
}

function masterAddBubble(role, text) {
  const wrap = document.createElement('div');
  wrap.className = role === 'user' ? 'bubble bubble--user' : 'bubble bubble--coach';
  if (role === 'coach') {
    const avatar = document.createElement('span');
    avatar.className = 'bubble__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'MA';
    wrap.appendChild(avatar);
  }
  const content = document.createElement('div');
  content.className = 'bubble__content';
  const p = document.createElement('p');
  p.textContent = text;
  content.appendChild(p);
  wrap.appendChild(content);
  masterChat.thread.appendChild(wrap);
  requestAnimationFrame(() => {
    masterChat.thread.scrollTop = masterChat.thread.scrollHeight;
  });
  return wrap;
}

function masterShowTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'bubble bubble--coach bubble--typing';
  wrap.id = 'masterTyping';
  const avatar = document.createElement('span');
  avatar.className = 'bubble__avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = 'MA';
  const content = document.createElement('div');
  content.className = 'bubble__content';
  const dots = document.createElement('span');
  dots.className = 'typing-dots';
  dots.setAttribute('aria-label', t('master_typing', 'Master AI está escribiendo'));
  dots.innerHTML = '<span></span><span></span><span></span>';
  content.appendChild(dots);
  wrap.appendChild(avatar);
  wrap.appendChild(content);
  masterChat.thread.appendChild(wrap);
  requestAnimationFrame(() => {
    masterChat.thread.scrollTop = masterChat.thread.scrollHeight;
  });
}

function masterHideTyping() {
  const node = document.getElementById('masterTyping');
  if (node && node.parentNode) node.parentNode.removeChild(node);
}

function masterAutoResize() {
  const ta = masterChat.input;
  if (!ta) return;
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
}

async function masterSend(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || masterChat.thinking) return;
  masterChat.thinking = true;
  masterChat.sendBtn?.setAttribute('disabled', 'true');

  masterAddBubble('user', trimmed);
  masterShowTyping();

  const delay = 700 + Math.random() * 600;
  await new Promise((resolve) => setTimeout(resolve, delay));

  masterHideTyping();
  masterAddBubble('coach', pickMasterReply(trimmed));

  masterChat.thinking = false;
  masterChat.sendBtn?.removeAttribute('disabled');
}

function initMasterAI() {
  if (masterChat.initialized) return;
  masterChat.form = document.getElementById('masterForm');
  masterChat.input = document.getElementById('masterInput');
  masterChat.thread = document.getElementById('masterThread');
  masterChat.sendBtn = document.getElementById('masterSend');
  if (!masterChat.form || !masterChat.input || !masterChat.thread) return;

  masterChat.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = masterChat.input.value;
    masterChat.input.value = '';
    masterAutoResize();
    masterSend(value);
  });

  masterChat.input.addEventListener('input', masterAutoResize);
  masterChat.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      masterChat.form.requestSubmit();
    }
  });

  $$('.master-prompt').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.promptKey;
      const text = key ? t(key, chip.textContent.trim()) : chip.textContent.trim();
      masterSend(text);
    });
  });

  masterChat.initialized = true;
}

// ===========================================================================
// Service worker registration
// ===========================================================================
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    return;
  }
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.warn('SW register failed', err);
    });
  });
}

// ===========================================================================
// Boot
// ===========================================================================
async function boot() {
  cacheDom();

  // Load persisted state
  state.settings = { ...DEFAULT_SETTINGS, ...loadFromStorage(STORAGE_KEYS.settings, {}) };
  state.audio = { ...DEFAULT_AUDIO_SETTINGS, ...loadFromStorage(STORAGE_KEYS.audio, {}) };
  state.language = loadFromStorage(STORAGE_KEYS.language, navigator.language?.startsWith('en') ? 'en' : 'es');
  state.wakeLockEnabled = loadFromStorage(STORAGE_KEYS.wakeLock, false);

  await loadTranslations();
  applyTranslations();

  installAudioUnlock();

  // Binaural
  renderProgramList();
  renderPureFrequencies();
  bindBinauralControls();

  // Audios
  await loadTracks();
  renderTrackList();
  bindMiniPlayer();

  // Settings
  bindSettings();

  // Master AI (frontend-only demo chat)
  initMasterAI();

  // Tabs
  bindTabs();
  setActiveView(state.settings.activeView || 'binaural');

  // Reveal app
  els.app.hidden = false;

  registerSW();
}

document.addEventListener('DOMContentLoaded', boot);
