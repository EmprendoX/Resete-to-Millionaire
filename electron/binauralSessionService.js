const { EventEmitter } = require('events');

class BinauralSessionService extends EventEmitter {
  constructor() {
    super();
    this.window = null;
    this.state = this._createInitialState();
  }

  _createInitialState() {
    return {
      active: false,
      program: null,
      programId: null,
      programName: null,
      carrier: 128,
      volume: 0.5,
      currentPhaseIndex: -1,
      totalPhases: 0,
      phaseStatus: null,
      startedAt: null,
      endedAt: null,
      endReason: null,
      completed: false,
      lastUpdateAt: null
    };
  }

  attachWindow(window) {
    this.window = window;
    if (window) {
      window.on('closed', () => {
        if (this.window === window) {
          this.window = null;
        }
      });
      this._sendToRenderer('binaural-session:state', this._getSerializableState());
      if (this.state.active) {
        this._sendToRenderer('binaural-session:start', {
          program: this.state.program,
          volume: this.state.volume
        });
      }
    }
  }

  startSession(options = {}) {
    const sanitizedProgram = this._sanitizeProgram(options.program);
    const normalizedVolume = this._normalizeVolume(
      typeof options.volume === 'number' ? options.volume : undefined
    );

    this.state = {
      ...this._createInitialState(),
      active: true,
      program: sanitizedProgram,
      programId: sanitizedProgram.id,
      programName: sanitizedProgram.name,
      carrier: sanitizedProgram.carrier,
      volume: normalizedVolume,
      totalPhases: sanitizedProgram.phases.length,
      startedAt: Date.now()
    };

    this._sendToRenderer('binaural-session:start', {
      program: sanitizedProgram,
      volume: normalizedVolume
    });

    return this._broadcastState();
  }

  stopSession(reason = 'manual', { skipRenderer = false } = {}) {
    if (!skipRenderer) {
      this._sendToRenderer('binaural-session:stop', { reason });
    }

    this.state = {
      ...this.state,
      active: false,
      currentPhaseIndex: -1,
      phaseStatus: 'stopped',
      endedAt: Date.now(),
      endReason: reason,
      completed: reason === 'completed'
    };

    return this._broadcastState();
  }

  handlePhaseProgress(update = {}) {
    if (!this.state.active) {
      return this._getSerializableState();
    }

    const nextState = {
      ...this.state,
      lastUpdateAt: Date.now()
    };

    if (typeof update.phaseIndex === 'number') {
      nextState.currentPhaseIndex = update.phaseIndex;
    }

    if (update.status) {
      nextState.phaseStatus = update.status;
    }

    if (typeof update.beatFrequency === 'number') {
      nextState.currentBeatFrequency = update.beatFrequency;
    }

    this.state = nextState;
    return this._broadcastState();
  }

  handleSessionComplete(details = {}) {
    const reason = details.reason || 'completed';
    const result = this.stopSession(reason, { skipRenderer: true });
    this.state = {
      ...this.state,
      completed: true,
      endReason: reason,
      endedAt: Date.now()
    };
    return this._broadcastState(result);
  }

  getState() {
    return this._getSerializableState();
  }

  _normalizeVolume(volume) {
    if (typeof volume !== 'number' || Number.isNaN(volume)) {
      return 0.5;
    }

    let value = volume;
    if (value > 1) {
      value = value / 100;
    }

    if (value < 0) {
      value = 0;
    } else if (value > 1) {
      value = 1;
    }

    return value;
  }

  _normalizeBeat(value, fallback = 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return fallback;
  }

  _normalizeDurationMinutes(value) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return 1;
  }

  _sanitizeProgram(program = {}) {
    if (!program || typeof program !== 'object') {
      throw new Error('El programa binaural proporcionado no es válido.');
    }

    const carrier = Number(program.carrier);
    const sanitizedCarrier = Number.isFinite(carrier) && carrier > 0 ? carrier : 128;

    const phases = Array.isArray(program.phases)
      ? program.phases
          .map((phase, index) => {
            if (!phase || typeof phase !== 'object') {
              return null;
            }

            const startBeat = this._normalizeBeat(
              phase.startBeatFrequency ?? phase.beatFrequency,
              0
            );
            const endBeat = this._normalizeBeat(
              phase.endBeatFrequency ?? phase.beatFrequency,
              startBeat
            );
            const durationMinutes = this._normalizeDurationMinutes(phase.durationMinutes);

            return {
              id: phase.id || `${program.id || 'program'}-phase-${index}`,
              name: phase.name || `Fase ${index + 1}`,
              description: phase.description || '',
              durationMinutes,
              startBeatFrequency: startBeat,
              endBeatFrequency: endBeat,
              beatFrequency: this._normalizeBeat(phase.beatFrequency, startBeat)
            };
          })
          .filter(Boolean)
      : [];

    if (!phases.length) {
      throw new Error('El programa binaural no contiene fases válidas.');
    }

    return {
      id: program.id || `program-${Date.now()}`,
      name: program.name || 'Sesión personalizada',
      objective: program.objective || '',
      shortDescription: program.shortDescription || '',
      carrier: sanitizedCarrier,
      phases
    };
  }

  _sendToRenderer(channel, payload) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, payload);
    }
  }

  _broadcastState() {
    const serialized = this._getSerializableState();
    this._sendToRenderer('binaural-session:state', serialized);
    this.emit('state-changed', serialized);
    return serialized;
  }

  _getSerializableState() {
    return JSON.parse(JSON.stringify(this.state));
  }
}

module.exports = {
  BinauralSessionService
};
