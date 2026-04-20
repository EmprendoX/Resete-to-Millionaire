const DEFAULT_CARRIER = 128;
const DEFAULT_VOLUME = 0.5;

const getAudioContext = () =>
  new (window.AudioContext || window.webkitAudioContext)();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export class BinauralAudioEngine {
  constructor(callbacks = {}) {
    this.callbacks = {
      onPhaseStart: callbacks.onPhaseStart || null,
      onPhaseEnd: callbacks.onPhaseEnd || null,
      onSessionEnded: callbacks.onSessionEnded || null,
      onError: callbacks.onError || null
    };

    this.audioContext = null;
    this.masterGain = null;
    this.leftOscillator = null;
    this.rightOscillator = null;
    this.channelMerger = null;
    this.streamDestination = null;
    this._keepAliveAudio = null;
    this.phaseTimers = [];
    this.volume = DEFAULT_VOLUME;
    this.program = null;
    this.active = false;
  }

  _ensureKeepAliveAudio() {
    if (this._keepAliveAudio) return this._keepAliveAudio;
    if (typeof document === 'undefined') return null;
    const el = document.createElement('audio');
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    el.setAttribute('aria-hidden', 'true');
    el.autoplay = true;
    el.controls = false;
    el.preload = 'auto';
    el.muted = false;
    el.style.cssText =
      'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    try {
      document.body.appendChild(el);
    } catch {
      /* noop */
    }
    this._keepAliveAudio = el;
    return el;
  }

  start(payload = {}) {
    try {
      this.stop({ reason: 'reset', notify: false });

      const program = this._sanitizeProgram(payload.program);
      const volume = this._normalizeVolume(
        typeof payload.volume === 'number' ? payload.volume : this.volume
      );

      this.program = program;
      this.volume = volume;

      this.audioContext = getAudioContext();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {
          /* noop */
        });
      }

      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);

      this.leftOscillator = this.audioContext.createOscillator();
      this.rightOscillator = this.audioContext.createOscillator();
      this.leftOscillator.type = 'sine';
      this.rightOscillator.type = 'sine';

      const leftGain = this.audioContext.createGain();
      const rightGain = this.audioContext.createGain();
      leftGain.gain.setValueAtTime(1, this.audioContext.currentTime);
      rightGain.gain.setValueAtTime(1, this.audioContext.currentTime);

      this.channelMerger = this.audioContext.createChannelMerger(2);

      this.leftOscillator.connect(leftGain);
      leftGain.connect(this.channelMerger, 0, 0);
      this.rightOscillator.connect(rightGain);
      rightGain.connect(this.channelMerger, 0, 1);
      this.channelMerger.connect(this.masterGain);

      // Route output through a MediaStream + hidden <audio> so the browser
      // treats the binaural session as "media playback" and keeps it alive
      // when the screen is locked or the tab goes to the background
      // (iOS Safari / Chrome Android suspend a plain AudioContext otherwise).
      this.streamDestination = this.audioContext.createMediaStreamDestination();
      this.masterGain.connect(this.streamDestination);

      const keepAlive = this._ensureKeepAliveAudio();
      if (keepAlive) {
        try {
          keepAlive.srcObject = this.streamDestination.stream;
        } catch (err) {
          console.warn('No se pudo asignar el stream al <audio> keep-alive:', err);
        }
        const playPromise = keepAlive.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            /* autoplay rechazado; el gesto de Play ya habilita esto normalmente */
          });
        }
      }

      this.leftOscillator.start();
      this.rightOscillator.start();

      this.active = true;
      this._schedulePhases();
    } catch (error) {
      this._handleError(error);
    }
  }

  stop({ reason = 'manual', notify = false } = {}) {
    this._clearPhaseTimers();

    if (this.leftOscillator) {
      try {
        this.leftOscillator.stop();
      } catch (error) {
        console.warn('No se pudo detener el oscilador izquierdo:', error);
      }
      this.leftOscillator.disconnect();
      this.leftOscillator = null;
    }

    if (this.rightOscillator) {
      try {
        this.rightOscillator.stop();
      } catch (error) {
        console.warn('No se pudo detener el oscilador derecho:', error);
      }
      this.rightOscillator.disconnect();
      this.rightOscillator = null;
    }

    if (this.channelMerger) {
      this.channelMerger.disconnect();
      this.channelMerger = null;
    }

    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }

    if (this.streamDestination) {
      try {
        this.streamDestination.disconnect();
      } catch (error) {
        console.warn('No se pudo desconectar el stream destination:', error);
      }
      this.streamDestination = null;
    }

    if (this._keepAliveAudio) {
      try {
        this._keepAliveAudio.pause();
      } catch {
        /* noop */
      }
      try {
        this._keepAliveAudio.srcObject = null;
      } catch {
        /* noop */
      }
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {
        /* noop */
      });
      this.audioContext = null;
    }

    const wasActive = this.active;
    this.active = false;

    if (notify && wasActive && this.callbacks.onSessionEnded) {
      this.callbacks.onSessionEnded({ reason, program: this.program });
    }
  }

  setVolume(volume) {
    const normalized = this._normalizeVolume(volume);
    this.volume = normalized;
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
      this.masterGain.gain.setValueAtTime(normalized, this.audioContext.currentTime);
    }
  }

  _schedulePhases() {
    if (!this.audioContext || !this.program) {
      return;
    }

    const { phases } = this.program;
    let accumulatedSeconds = 0;

    phases.forEach((phase, index) => {
      const durationSeconds = Math.max(1, phase.durationMinutes * 60);
      const startTime = this.audioContext.currentTime + accumulatedSeconds;
      const endTime = startTime + durationSeconds;

      const startBeat = phase.startBeatFrequency;
      const endBeat = phase.endBeatFrequency;

      this._applyBeatAtTime(startBeat, startTime);
      if (endBeat !== startBeat) {
        this._rampBeatToTime(endBeat, endTime);
      } else {
        this._applyBeatAtTime(endBeat, endTime);
      }

      this._queuePhaseStart(index, phase, startBeat, durationSeconds, accumulatedSeconds);
      this._queuePhaseEnd(index, phase, endBeat, accumulatedSeconds + durationSeconds);

      accumulatedSeconds += durationSeconds;
    });

    this.phaseTimers.push(
      setTimeout(() => {
        this.stop({ reason: 'completed', notify: true });
      }, accumulatedSeconds * 1000)
    );
  }

  _applyBeatAtTime(beat, time) {
    if (!this.leftOscillator || !this.rightOscillator) {
      return;
    }

    const carrier = this.program ? this.program.carrier : DEFAULT_CARRIER;
    const halfBeat = beat / 2;
    const leftFreq = Math.max(0, carrier - halfBeat);
    const rightFreq = carrier + halfBeat;

    this.leftOscillator.frequency.setValueAtTime(leftFreq, time);
    this.rightOscillator.frequency.setValueAtTime(rightFreq, time);
  }

  _rampBeatToTime(beat, time) {
    if (!this.leftOscillator || !this.rightOscillator || !this.audioContext) {
      return;
    }

    const carrier = this.program ? this.program.carrier : DEFAULT_CARRIER;
    const halfBeat = beat / 2;
    const leftFreq = Math.max(0, carrier - halfBeat);
    const rightFreq = carrier + halfBeat;

    this.leftOscillator.frequency.linearRampToValueAtTime(leftFreq, time);
    this.rightOscillator.frequency.linearRampToValueAtTime(rightFreq, time);
  }

  _queuePhaseStart(index, phase, beat, durationSeconds, offsetSeconds) {
    this.phaseTimers.push(
      setTimeout(() => {
        if (this.callbacks.onPhaseStart) {
          this.callbacks.onPhaseStart({
            index,
            phase,
            startBeatFrequency: beat,
            durationSeconds,
            program: this.program
          });
        }
      }, offsetSeconds * 1000)
    );
  }

  _queuePhaseEnd(index, phase, beat, offsetSeconds) {
    this.phaseTimers.push(
      setTimeout(() => {
        if (this.callbacks.onPhaseEnd) {
          this.callbacks.onPhaseEnd({
            index,
            phase,
            endBeatFrequency: beat,
            program: this.program
          });
        }
      }, offsetSeconds * 1000)
    );
  }

  _clearPhaseTimers() {
    this.phaseTimers.forEach((timer) => clearTimeout(timer));
    this.phaseTimers = [];
  }

  _normalizeVolume(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return this.volume ?? DEFAULT_VOLUME;
    }

    if (value > 1) {
      return clamp(value / 100, 0, 1);
    }

    return clamp(value, 0, 1);
  }

  _sanitizeProgram(program = {}) {
    if (!program || typeof program !== 'object') {
      throw new Error('Programa binaural inválido.');
    }

    const carrier = Number(program.carrier);
    const sanitizedCarrier = Number.isFinite(carrier) && carrier > 0 ? carrier : DEFAULT_CARRIER;

    const phases = Array.isArray(program.phases)
      ? program.phases
          .map((phase, index) => {
            if (!phase) return null;
            const startBeat = this._sanitizeBeat(
              phase.startBeatFrequency ?? phase.beatFrequency
            );
            const endBeat = this._sanitizeBeat(
              phase.endBeatFrequency ?? phase.beatFrequency,
              startBeat
            );
            const duration = this._sanitizeDuration(phase.durationMinutes);
            return {
              id: phase.id || `${program.id || 'program'}-phase-${index}`,
              name: phase.name || `Fase ${index + 1}`,
              description: phase.description || '',
              durationMinutes: duration,
              startBeatFrequency: startBeat,
              endBeatFrequency: endBeat
            };
          })
          .filter(Boolean)
      : [];

    if (!phases.length) {
      throw new Error('El programa binaural debe contener al menos una fase.');
    }

    return {
      id: program.id || `program-${Date.now()}`,
      name: program.name || 'Sesión personalizada',
      carrier: sanitizedCarrier,
      phases
    };
  }

  _sanitizeBeat(value, fallback = 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return fallback;
  }

  _sanitizeDuration(value) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return 1;
  }

  _handleError(error) {
    console.error('BinauralAudioEngine error:', error);
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }
}

export default BinauralAudioEngine;
