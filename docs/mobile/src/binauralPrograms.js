const TARGET_SESSION_MINUTES = 22;

const PROGRAMS = [
  {
    id: 'alpha-creative-flow',
    name: 'Alpha Creative Flow',
    objective: 'Potenciar la creatividad, ideas claras, pensamiento relajado y enfoque suave.',
    shortDescription: 'Flujo creativo, calma y claridad mental.',
    carrier: 128,
    phases: [
      {
        name: 'Activación suave (Beta → Alpha alta)',
        beatFrequency: 14,
        startBeatFrequency: 20,
        endBeatFrequency: 14,
        durationMinutes: 3,
        description: 'Prepara la mente bajando desde beta hacia alpha alta para activar la creatividad.'
      },
      {
        name: 'Descenso a Alpha estable',
        beatFrequency: 10,
        startBeatFrequency: 14,
        endBeatFrequency: 10,
        durationMinutes: 6,
        description: 'Transición suave hacia un estado alpha estable ideal para la creatividad.'
      },
      {
        name: 'Alpha profundo (creatividad)',
        beatFrequency: 10,
        startBeatFrequency: 10,
        endBeatFrequency: 10,
        durationMinutes: 11,
        description: 'Mantiene un estado alpha profundo para maximizar el flujo creativo y la claridad mental.'
      },
      {
        name: 'Salida ligera',
        beatFrequency: 12,
        startBeatFrequency: 10,
        endBeatFrequency: 12,
        durationMinutes: 2,
        description: 'Transición suave de regreso elevando ligeramente la frecuencia para cerrar la sesión.'
      }
    ]
  },
  {
    id: 'deep-theta-meditation',
    name: 'Deep Theta Meditation',
    objective: 'Meditación profunda, introspección y silencio mental.',
    shortDescription: 'Meditación profunda real, reducción de ansiedad y paz total.',
    carrier: 128,
    phases: [
      {
        name: 'Beta → Alpha (preparación)',
        beatFrequency: 12,
        startBeatFrequency: 20,
        endBeatFrequency: 12,
        durationMinutes: 4,
        description: 'Prepara la mente descendiendo desde beta hacia alpha para iniciar la meditación.'
      },
      {
        name: 'Alpha → Theta',
        beatFrequency: 6,
        startBeatFrequency: 12,
        endBeatFrequency: 6,
        durationMinutes: 6,
        description: 'Transición profunda hacia theta, el estado ideal para meditación profunda.'
      },
      {
        name: 'Theta estable (estado profundo)',
        beatFrequency: 6,
        startBeatFrequency: 6,
        endBeatFrequency: 6,
        durationMinutes: 10,
        description: 'Mantiene un estado theta profundo para meditación intensa, introspección y paz mental.'
      },
      {
        name: 'Regreso suave',
        beatFrequency: 10,
        startBeatFrequency: 6,
        endBeatFrequency: 10,
        durationMinutes: 2,
        description: 'Transición suave de regreso elevando la frecuencia para cerrar la sesión de meditación.'
      }
    ]
  },
  {
    id: 'deep-sleep-descent',
    name: 'Deep Sleep Descent',
    objective: 'Inducir sueño profundo, relajar cuerpo y mente, soltar tensión.',
    shortDescription: 'Transición real hacia sueño profundo. Ideal para usar antes de dormir.',
    carrier: 128,
    phases: [
      {
        name: 'Beta → Alpha (relajación inicia)',
        beatFrequency: 12,
        startBeatFrequency: 20,
        endBeatFrequency: 12,
        durationMinutes: 4,
        description: 'Inicia la relajación descendiendo desde beta hacia alpha para liberar tensión.'
      },
      {
        name: 'Alpha → Theta',
        beatFrequency: 6,
        startBeatFrequency: 12,
        endBeatFrequency: 6,
        durationMinutes: 5,
        description: 'Profundiza la relajación hacia theta, preparando el cuerpo para el sueño.'
      },
      {
        name: 'Theta → Delta (sueño profundo)',
        beatFrequency: 3,
        startBeatFrequency: 6,
        endBeatFrequency: 3,
        durationMinutes: 7,
        description: 'Transición hacia delta, el estado de sueño profundo y reparador.'
      },
      {
        name: 'Delta estable',
        beatFrequency: 3,
        startBeatFrequency: 3,
        endBeatFrequency: 3,
        durationMinutes: 6,
        description: 'Mantiene un estado delta profundo para un sueño reparador y regenerador.'
      }
    ]
  },
  {
    id: 'high-focus-mode',
    name: 'High Focus Mode',
    objective: 'Enfoque fuerte, productividad y energía mental sin ansiedad.',
    shortDescription: 'Alta concentración, motivación y mente despierta.',
    carrier: 128,
    phases: [
      {
        name: 'Activación',
        beatFrequency: 16,
        startBeatFrequency: 14,
        endBeatFrequency: 16,
        durationMinutes: 4,
        description: 'Activa la mente elevando la frecuencia hacia beta para iniciar el enfoque.'
      },
      {
        name: 'Ascenso a Beta Alta',
        beatFrequency: 18,
        startBeatFrequency: 16,
        endBeatFrequency: 18,
        durationMinutes: 6,
        description: 'Aumenta la energía mental hacia beta alta para máxima concentración.'
      },
      {
        name: 'Enfoque estable',
        beatFrequency: 18,
        startBeatFrequency: 18,
        endBeatFrequency: 18,
        durationMinutes: 10,
        description: 'Mantiene un estado de alta concentración y productividad sin ansiedad.'
      },
      {
        name: 'Aterrizaje suave',
        beatFrequency: 14,
        startBeatFrequency: 18,
        endBeatFrequency: 14,
        durationMinutes: 2,
        description: 'Transición suave de regreso bajando la frecuencia para cerrar la sesión.'
      }
    ]
  },
  {
    id: 'neural-reset',
    name: 'Neural Reset',
    objective: 'Regresar a un estado mental base, limpiar fatiga y equilibrar la mente.',
    shortDescription: 'Mente clara, alerta, sin somnolencia ni tensión.',
    carrier: 128,
    phases: [
      {
        name: 'Ascenso desde estado profundo',
        beatFrequency: 10,
        startBeatFrequency: 6,
        endBeatFrequency: 10,
        durationMinutes: 7,
        description: 'Eleva la mente desde estados profundos hacia alpha para activar la claridad.'
      },
      {
        name: 'Normalización',
        beatFrequency: 12,
        startBeatFrequency: 10,
        endBeatFrequency: 12,
        durationMinutes: 7,
        description: 'Normaliza el estado mental hacia alpha estable para equilibrio y claridad.'
      },
      {
        name: 'Estabilización mental',
        beatFrequency: 12,
        startBeatFrequency: 12,
        endBeatFrequency: 12,
        durationMinutes: 6,
        description: 'Mantiene un estado mental equilibrado, claro y alerta sin tensión.'
      },
      {
        name: 'Cierre',
        beatFrequency: 14,
        startBeatFrequency: 12,
        endBeatFrequency: 14,
        durationMinutes: 2,
        description: 'Cierre suave elevando ligeramente la frecuencia para finalizar la sesión.'
      }
    ]
  }
];

const ensureTargetDuration = (program) => {
  const phases = program.phases.map((phase) => ({
    ...phase,
    durationMinutes: Math.max(1, Number(phase.durationMinutes) || 1)
  }));

  const totalMinutes = phases.reduce((minutes, phase) => minutes + phase.durationMinutes, 0);

  if (Math.abs(totalMinutes - TARGET_SESSION_MINUTES) < 0.01) {
    return { ...program, phases };
  }

  const difference = TARGET_SESSION_MINUTES - totalMinutes;
  const lastIndex = phases.length - 1;

  const adjustedPhases = phases.map((phase, index) => {
    if (index !== lastIndex) {
      return phase;
    }

    const adjusted = Math.max(1, Math.round((phase.durationMinutes + difference) * 100) / 100);
    return {
      ...phase,
      durationMinutes: adjusted
    };
  });

  return { ...program, phases: adjustedPhases };
};

const ensureSmoothTransitions = (program) => {
  let previousEnd = null;

  const phases = program.phases.map((phase, index) => {
    const baseStart =
      typeof phase.startBeatFrequency === 'number' && !Number.isNaN(phase.startBeatFrequency)
        ? phase.startBeatFrequency
        : phase.beatFrequency;
    const baseEnd =
      typeof phase.endBeatFrequency === 'number' && !Number.isNaN(phase.endBeatFrequency)
        ? phase.endBeatFrequency
        : phase.beatFrequency;

    const start = previousEnd !== null ? previousEnd : baseStart;
    const end = baseEnd;

    previousEnd = end;

    return {
      ...phase,
      startBeatFrequency: start,
      endBeatFrequency: end
    };
  });

  return { ...program, phases };
};

const enrichPrograms = (programs) =>
  programs.map((program) => {
    const withTargetDuration = ensureTargetDuration(program);
    const smoothProgram = ensureSmoothTransitions(withTargetDuration);
    const totalDurationMinutes = smoothProgram.phases.reduce(
      (minutes, phase) => minutes + (phase.durationMinutes || 0),
      0
    );

    return {
      ...smoothProgram,
      totalDurationMinutes: Math.round(totalDurationMinutes * 100) / 100
    };
  });

export const binauralPrograms = enrichPrograms(PROGRAMS);

export default binauralPrograms;
