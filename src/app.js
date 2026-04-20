import { binauralPrograms } from './binauralPrograms.js';
import { BinauralAudioEngine } from './binauralAudioEngine.js';

const ELECTRON_AVAILABLE =
  typeof window !== 'undefined' && typeof window.require === 'function';

let ipcRenderer = null;

if (ELECTRON_AVAILABLE) {
  try {
    ({ ipcRenderer } = window.require('electron'));
  } catch (error) {
    console.warn('No se pudo cargar ipcRenderer:', error);
    ipcRenderer = null;
  }
}

const STORAGE_KEYS = {
  settings: 'mindflash:settings',
  personalLists: 'mindflash:personalLists',
  consent: 'mindflash:consent',
  audioSettings: 'mindflash:audioSettings'
};

const DEFAULT_LISTS = [
  {
    id: 'abundance',
    name: 'Abundance',
    type: 'global',
    phrases: [
      'La abundancia llega a mí con facilidad.',
      'Merezco prosperidad y la cultivo cada día.',
      'Agradezco todo lo que tengo y todo lo que está por venir.',
      'Mis acciones atraen oportunidades ilimitadas.'
    ]
  },
  {
    id: 'focus',
    name: 'Focus',
    type: 'global',
    phrases: [
      'Mi atención se mantiene firme en lo importante.',
      'Avanzo paso a paso con claridad y confianza.',
      'Cada respiración me centra en el presente.',
      'Elijo hábitos que alimentan mi mejor versión.'
    ]
  },
  {
    id: 'health',
    name: 'Health',
    type: 'global',
    phrases: [
      'Mi cuerpo es fuerte, flexible y lleno de energía.',
      'Nutro mi bienestar con decisiones conscientes.',
      'Escucho las señales de mi cuerpo con amor y respeto.',
      'Respiro salud en cada inhalación, libero tensión al exhalar.'
    ]
  },
  {
    id: 'self-esteem',
    name: 'Self-Esteem',
    type: 'global',
    phrases: [
      'I love and accept myself exactly as I am.',
      'I am proud of who I am becoming.',
      'I am enough just as I am.',
      'I believe in myself and my abilities.',
      'I am worthy of love, respect, and kindness.',
      'I forgive myself for past mistakes.',
      'I am growing stronger and more confident each day.',
      'I speak to myself with compassion.',
      'I trust my inner voice.',
      'I radiate confidence and calm.',
      'I am proud of my progress, no matter how small.',
      'I deserve happiness and peace.',
      'I let go of self-doubt and choose self-trust.',
      'I value my uniqueness.',
      'I am calm, confident, and centered.',
      'I celebrate my strengths and embrace my flaws.',
      'It is safe to be fully myself.',
      'I am enough in this moment.',
      'I choose to love myself unconditionally.',
      'I am worthy of good things in life.',
      'I walk with confidence and purpose.',
      'I am kind to myself in every thought.',
      'I release comparison and choose acceptance.',
      'I trust the process of my growth.',
      'I am proud of my story.',
      'I am beautiful inside and out.',
      'I am learning to see myself with love.',
      'I release the need for perfection.',
      'I am confident in my path.',
      'I am grateful for who I am.',
      'I shine naturally without effort.',
      'I am love.'
    ]
  },
  {
    id: 'autoestima',
    name: 'Autoestima',
    type: 'global',
    phrases: [
      'Me amo y me acepto exactamente como soy.',
      'Estoy orgulloso de la persona en la que me estoy convirtiendo.',
      'Soy suficiente tal como soy.',
      'Creo en mí y en mis capacidades.',
      'Soy digno de amor, respeto y bondad.',
      'Me perdono por los errores del pasado.',
      'Cada día soy más fuerte y más seguro de mí.',
      'Hablo conmigo con compasión.',
      'Confío en mi voz interior.',
      'Irradio confianza y calma.',
      'Estoy orgulloso de mis avances, por pequeños que sean.',
      'Merezco felicidad y paz.',
      'Dejo atrás la duda y elijo confiar en mí.',
      'Valoro mi autenticidad.',
      'Estoy tranquilo, confiado y centrado.',
      'Celebro mis fortalezas y abrazo mis imperfecciones.',
      'Es seguro ser completamente yo mismo.',
      'Soy suficiente en este momento.',
      'Elijo amarme incondicionalmente.',
      'Soy digno de las cosas buenas de la vida.',
      'Camino con confianza y propósito.',
      'Soy amable conmigo en cada pensamiento.',
      'Suelto la comparación y elijo la aceptación.',
      'Confío en el proceso de mi crecimiento.',
      'Estoy orgulloso de mi historia.',
      'Soy hermoso por dentro y por fuera.',
      'Aprendo a verme con amor.',
      'Libero la necesidad de ser perfecto.',
      'Tengo confianza en mi camino.',
      'Estoy agradecido por quien soy.',
      'Brillo naturalmente sin esfuerzo.',
      'Soy amor.'
    ]
  },
  {
    id: 'health-healing',
    name: 'Health & Healing',
    type: 'global',
    phrases: [
      'I am grateful for my body\'s ability to heal.',
      'Every cell in my body vibrates with health and energy.',
      'I am restoring balance in my mind and body.',
      'I trust my body\'s natural intelligence.',
      'Healing is happening inside me now.',
      'I am calm and supported in my healing journey.',
      'I release tension and allow my body to relax.',
      'I am surrounded by light and renewal.',
      'I am grateful for the miracle of recovery.',
      'I am kind and patient with my body.',
      'My thoughts create harmony in my cells.',
      'I nourish myself with love and care.',
      'I am becoming stronger every day.',
      'I choose peace and my body responds with healing.',
      'I am free from illness and fear.',
      'I breathe in life, energy, and vitality.',
      'I am aligned with perfect health.',
      'I release resistance to healing.',
      'My body knows how to restore itself.',
      'I am worthy of perfect health.',
      'I forgive my body for any past neglect.',
      'I am surrounded by healing energy.',
      'My immune system is strong and intelligent.',
      'I am in harmony with life.',
      'I am light, peace, and renewal.',
      'I choose to heal deeply and completely.',
      'I am safe, whole, and free.',
      'Each breath restores me.',
      'I am grateful for my heart and my life.',
      'I am healed and whole.',
      'I am vibrant and alive.'
    ]
  },
  {
    id: 'salud-sanacion',
    name: 'Salud y Sanación',
    type: 'global',
    phrases: [
      'Estoy agradecido por la capacidad natural de mi cuerpo para sanar.',
      'Cada célula de mi cuerpo vibra con salud y energía.',
      'Estoy restaurando el equilibrio entre mente y cuerpo.',
      'Confío en la inteligencia natural de mi organismo.',
      'La sanación está ocurriendo dentro de mí ahora.',
      'Estoy tranquilo y acompañado en mi proceso de sanación.',
      'Libero toda tensión y permito que mi cuerpo se relaje.',
      'Estoy rodeado de luz, fuerza y renovación.',
      'Agradezco el milagro de mi recuperación.',
      'Soy amable y paciente con mi cuerpo.',
      'Mis pensamientos crean armonía en mis células.',
      'Me nutro con amor y cuidado.',
      'Cada día soy más fuerte y más saludable.',
      'Elijo la paz y mi cuerpo responde sanando.',
      'Estoy libre de enfermedad y miedo.',
      'Inhalo vida, energía y vitalidad.',
      'Estoy alineado con la salud perfecta.',
      'Libero toda resistencia a la sanación.',
      'Mi cuerpo sabe cómo restaurarse.',
      'Soy digno de perfecta salud.',
      'Perdono a mi cuerpo por cualquier descuido.',
      'Estoy rodeado de energía sanadora.',
      'Mi sistema inmunológico es fuerte e inteligente.',
      'Estoy en armonía con la vida.',
      'Soy luz, paz y renovación.',
      'Elijo sanar profunda y completamente.',
      'Estoy seguro, completo y libre.',
      'Cada respiración me restaura.',
      'Agradezco a mi corazón y a mi vida.',
      'Estoy sano y completo.',
      'Estoy vibrante y lleno de vida.'
    ]
  },
  {
    id: 'faith-trust',
    name: 'Faith & Trust',
    type: 'global',
    phrases: [
      'I trust that everything is working for my highest good.',
      'I believe in the path I am walking.',
      'I am calm and confident about my future.',
      'Everything unfolds at the right time.',
      'I have unshakable faith in my purpose.',
      'I trust the process even when I can\'t see the outcome.',
      'I am guided by inner wisdom.',
      'I believe in what I am building.',
      'Life supports me in every step I take.',
      'I let go of doubt and choose trust.',
      'What I desire is already on its way.',
      'I am patient and peaceful in the waiting.',
      'I trust myself to make the right decisions.',
      'I am aligned with what is meant for me.',
      'I believe in unseen progress.',
      'Everything is unfolding perfectly.',
      'I release fear and welcome certainty.',
      'I trust the timing of my life.',
      'I am grounded in faith and strength.',
      'I know that I am capable and prepared.',
      'I am open to unexpected blessings.',
      'I feel peace knowing all is working for me.',
      'I move forward with quiet confidence.',
      'I am supported by invisible forces of good.',
      'I believe deeply in my ability to succeed.',
      'I am guided to the right people and opportunities.',
      'I am relaxed and positive about what\'s coming.',
      'I am calm, focused, and faithful.',
      'I know that things are falling into place perfectly.',
      'I let go and allow life to flow.',
      'I trust that my efforts are multiplying.',
      'I believe in the power of my intention.',
      'Everything I do leads me to my best outcome.'
    ]
  },
  {
    id: 'fe-confianza',
    name: 'Fe y Confianza',
    type: 'global',
    phrases: [
      'Confío en que todo está funcionando para mi mayor bien.',
      'Creo en el camino que estoy recorriendo.',
      'Estoy tranquilo y confiado respecto a mi futuro.',
      'Todo se desarrolla en el momento perfecto.',
      'Tengo una fe inquebrantable en mi propósito.',
      'Confío en el proceso aunque no vea el resultado.',
      'Me guía mi sabiduría interior.',
      'Creo en lo que estoy construyendo.',
      'La vida me apoya en cada paso que doy.',
      'Suelto la duda y elijo confiar.',
      'Lo que deseo ya viene en camino.',
      'Soy paciente y estoy en paz mientras espero.',
      'Confío en mi capacidad para decidir correctamente.',
      'Estoy alineado con lo que está destinado para mí.',
      'Creo en el progreso que aún no puedo ver.',
      'Todo se está desarrollando perfectamente.',
      'Libero el miedo y doy la bienvenida a la certeza.',
      'Confío en el tiempo perfecto de mi vida.',
      'Estoy arraigado en la fe y la fortaleza.',
      'Sé que soy capaz y estoy preparado.',
      'Estoy abierto a bendiciones inesperadas.',
      'Siento paz al saber que todo trabaja a mi favor.',
      'Avanzo con una confianza tranquila.',
      'Estoy sostenido por fuerzas invisibles de bien.',
      'Creo profundamente en mi capacidad para triunfar.',
      'Soy guiado hacia las personas y oportunidades correctas.',
      'Estoy relajado y positivo respecto al futuro.',
      'Estoy calmado, enfocado y lleno de fe.',
      'Sé que las cosas están encajando perfectamente.',
      'Suelto el control y dejo que la vida fluya.',
      'Confío en que mis esfuerzos se multiplican.',
      'Creo en el poder de mi intención.',
      'Todo lo que hago me acerca a mi mejor resultado.'
    ]
  },
  {
    id: 'happiness-joy',
    name: 'Happiness & Joy',
    type: 'global',
    phrases: [
      'I choose happiness right now.',
      'Joy flows naturally through my life.',
      'I am grateful for the beauty in this moment.',
      'I attract experiences that make me smile.',
      'I see reasons to be happy everywhere.',
      'My heart is open to joy and laughter.',
      'I deserve to feel good every day.',
      'I am surrounded by positivity and light.',
      'I release stress and welcome peace.',
      'I allow myself to feel joy fully.',
      'I am present, alive, and content.',
      'I radiate happiness and inspire others.',
      'I am grateful for the small blessings in my life.',
      'I focus on what uplifts me.',
      'I am a magnet for joy.',
      'Happiness grows inside me.',
      'I trust life to support my joy.',
      'I find peace in simple things.',
      'I am free to enjoy my life.',
      'I create joy through gratitude and presence.',
      'I am thankful for today.',
      'I deserve laughter and love.',
      'I choose joy over fear.',
      'Every day is a new opportunity for happiness.',
      'I release negativity and embrace optimism.',
      'I am filled with calm and lightness.',
      'I attract positive and joyful people.',
      'I celebrate life and all its colors.',
      'I smile easily and often.',
      'I am grateful to be alive.',
      'I find happiness in my journey.',
      'Joy is my natural state.',
      'I am happiness in motion.'
    ]
  },
  {
    id: 'felicidad-alegria',
    name: 'Felicidad y Alegría',
    type: 'global',
    phrases: [
      'Elijo la felicidad ahora.',
      'La alegría fluye naturalmente en mi vida.',
      'Estoy agradecido por la belleza de este momento.',
      'Atraigo experiencias que me hacen sonreír.',
      'Veo razones para ser feliz en todas partes.',
      'Mi corazón está abierto a la alegría y la risa.',
      'Merezco sentirme bien cada día.',
      'Estoy rodeado de positividad y luz.',
      'Libero el estrés y doy la bienvenida a la paz.',
      'Me permito sentir la alegría completamente.',
      'Estoy presente, vivo y satisfecho.',
      'Irradio felicidad e inspiro a los demás.',
      'Agradezco las pequeñas bendiciones de mi vida.',
      'Me enfoco en lo que me eleva.',
      'Soy un imán para la alegría.',
      'La felicidad crece dentro de mí.',
      'Confío en que la vida apoya mi alegría.',
      'Encuentro paz en las cosas simples.',
      'Soy libre para disfrutar mi vida.',
      'Creo alegría a través de la gratitud y la presencia.',
      'Agradezco este día.',
      'Merezco risa y amor.',
      'Elijo la alegría por encima del miedo.',
      'Cada día es una nueva oportunidad para ser feliz.',
      'Suelto la negatividad y abrazo el optimismo.',
      'Estoy lleno de calma y ligereza.',
      'Atraigo personas positivas y alegres.',
      'Celebro la vida y todos sus colores.',
      'Sonrío con facilidad y frecuencia.',
      'Agradezco el regalo de estar vivo.',
      'Encuentro felicidad en mi camino.',
      'La alegría es mi estado natural.',
      'Soy felicidad en movimiento.'
    ]
  },
  {
    id: 'abundance-prosperity',
    name: 'Abundance & Prosperity',
    type: 'global',
    phrases: [
      'I am open to receive infinite abundance.',
      'Money flows to me effortlessly and constantly.',
      'I am worthy of wealth and success.',
      'I attract opportunities that lead to prosperity.',
      'I am a magnet for positive energy and money.',
      'I release all resistance to receiving abundance.',
      'I allow wealth to enter every area of my life.',
      'I live in a state of gratitude and flow.',
      'Abundance is my natural state.',
      'I think rich thoughts and attract rich results.',
      'I am surrounded by opportunities to grow and prosper.',
      'Every day I attract more success and joy.',
      'I am grateful for the money I have and the money on its way.',
      'I trust the universe to provide all that I need.',
      'I take inspired action toward my goals.',
      'I am aligned with the frequency of wealth.',
      'Prosperity flows easily through me.',
      'I am open to new streams of income.',
      'My thoughts create my financial reality.',
      'I see abundance everywhere I look.',
      'I am calm, confident, and financially free.',
      'I deserve luxury, joy, and peace.',
      'Money supports my purpose and expansion.',
      'I bless and multiply all that I give and receive.',
      'I am guided toward smart financial decisions.',
      'I release fear and embrace trust.',
      'My energy attracts success naturally.',
      'I am thankful for the abundance already within me.',
      'I am prosperous in mind, body, and spirit.',
      'The more I give, the more I receive.',
      'I trust the process of life to bring me prosperity.',
      'Wealth and joy are my birthright.',
      'I am abundant now.'
    ]
  },
  {
    id: 'abundancia-prosperidad',
    name: 'Abundancia y Prosperidad',
    type: 'global',
    phrases: [
      'Estoy abierto a recibir abundancia infinita.',
      'El dinero fluye hacia mí sin esfuerzo y de manera constante.',
      'Soy digno de riqueza y éxito.',
      'Atraigo oportunidades que me llevan a la prosperidad.',
      'Soy un imán para la energía positiva y el dinero.',
      'Libero toda resistencia a recibir abundancia.',
      'Permito que la riqueza entre en todas las áreas de mi vida.',
      'Vivo en un estado de gratitud y fluidez.',
      'La abundancia es mi estado natural.',
      'Pienso en grande y atraigo grandes resultados.',
      'Estoy rodeado de oportunidades para crecer y prosperar.',
      'Cada día atraigo más éxito y alegría.',
      'Estoy agradecido por el dinero que tengo y el que viene en camino.',
      'Confío en que el universo me provee todo lo que necesito.',
      'Tomo acción inspirada hacia mis metas.',
      'Estoy alineado con la frecuencia de la riqueza.',
      'La prosperidad fluye fácilmente a través de mí.',
      'Estoy abierto a nuevas fuentes de ingreso.',
      'Mis pensamientos crean mi realidad financiera.',
      'Veo abundancia en todas partes.',
      'Estoy tranquilo, confiado y libre financieramente.',
      'Merezco lujo, alegría y paz.',
      'El dinero apoya mi propósito y mi expansión.',
      'Bendigo y multiplico todo lo que doy y recibo.',
      'Soy guiado hacia decisiones financieras inteligentes.',
      'Libero el miedo y abrazo la confianza.',
      'Mi energía atrae el éxito naturalmente.',
      'Agradezco la abundancia que ya está en mí.',
      'Soy próspero en mente, cuerpo y espíritu.',
      'Cuanto más doy, más recibo.',
      'Confío en el proceso de la vida para traerme prosperidad.',
      'La riqueza y la alegría son mi derecho natural.',
      'Soy abundante ahora.'
    ]
  },
  {
    id: 'love-relationships',
    name: 'Love & Relationships',
    type: 'global',
    phrases: [
      'I am open to giving and receiving love freely.',
      'I attract relationships that are kind, honest, and nurturing.',
      'I am worthy of love, respect, and commitment.',
      'I release past pain and allow new love to enter.',
      'I am grateful for the love that already surrounds me.',
      'I communicate with honesty and compassion.',
      'I deserve deep and meaningful connections.',
      'I choose partners who support my growth and peace.',
      'I trust love to find me in divine timing.',
      'I am open to being loved for who I truly am.',
      'I am healing old patterns of attachment and fear.',
      'I radiate love and attract it effortlessly.',
      'I forgive and release all that blocks my heart.',
      'I am whole on my own and share my wholeness with others.',
      'I am calm, confident, and open in love.',
      'My relationships are built on trust and respect.',
      'I attract people who value and appreciate me.',
      'I give love freely and receive it with gratitude.',
      'I am learning to love without fear or control.',
      'I am worthy of a healthy, joyful partnership.',
      'I choose love even when it feels vulnerable.',
      'I express affection and kindness easily.',
      'I allow love to flow naturally into my life.',
      'I am grateful for those who love and care for me.',
      'I bring peace, warmth, and joy to my relationships.',
      'I attract harmony into every connection.',
      'I am patient and trusting in matters of the heart.',
      'I am surrounded by loving energy.',
      'I let go of the need to be perfect to be loved.',
      'I am love, and love flows through me endlessly.',
      'I am open to divine love in all forms.',
      'Every relationship teaches me more about love.',
      'I am ready for true, balanced, and lasting love.'
    ]
  },
  {
    id: 'amor-relaciones',
    name: 'Amor y Relaciones',
    type: 'global',
    phrases: [
      'Estoy abierto a dar y recibir amor libremente.',
      'Atraigo relaciones amables, honestas y nutritivas.',
      'Soy digno de amor, respeto y compromiso.',
      'Libero el dolor del pasado y permito que el amor entre.',
      'Agradezco el amor que ya me rodea.',
      'Me comunico con honestidad y compasión.',
      'Merezco conexiones profundas y significativas.',
      'Elijo personas que apoyan mi crecimiento y mi paz.',
      'Confío en que el amor me encuentra en el momento perfecto.',
      'Estoy abierto a ser amado tal como soy.',
      'Estoy sanando viejos patrones de apego y miedo.',
      'Irradio amor y lo atraigo sin esfuerzo.',
      'Perdono y libero todo lo que bloquea mi corazón.',
      'Soy completo por mí mismo y comparto mi plenitud con los demás.',
      'Estoy tranquilo, confiado y abierto al amor.',
      'Mis relaciones se basan en confianza y respeto.',
      'Atraigo personas que me valoran y aprecian.',
      'Doy amor libremente y lo recibo con gratitud.',
      'Aprendo a amar sin miedo ni control.',
      'Soy digno de una relación sana y alegre.',
      'Elijo el amor incluso cuando me siento vulnerable.',
      'Expreso afecto y bondad con facilidad.',
      'Permito que el amor fluya naturalmente en mi vida.',
      'Agradezco a quienes me aman y me cuidan.',
      'Llevo paz, calidez y alegría a mis relaciones.',
      'Atraigo armonía a cada conexión.',
      'Soy paciente y confío en los asuntos del corazón.',
      'Estoy rodeado de energía amorosa.',
      'Suelto la necesidad de ser perfecto para ser amado.',
      'Soy amor, y el amor fluye a través de mí sin fin.',
      'Estoy abierto al amor divino en todas sus formas.',
      'Cada relación me enseña más sobre el amor.',
      'Estoy listo para un amor verdadero, equilibrado y duradero.'
    ]
  }
];

// Función para generar nombre legible desde filename
function getAudioNameFromFilename(filename) {
  // Remover extensión .mp3
  const nameWithoutExt = filename.replace(/\.mp3$/i, '');
  // Reemplazar guiones bajos con espacios y capitalizar
  return nameWithoutExt
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

let DEFAULT_AUDIO_LISTS = [];

// Cargar lista de archivos MP3 automáticamente desde la carpeta
async function loadAudioFilesList() {
  if (typeof window !== 'undefined' && window.require) {
    try {
      const { ipcRenderer } = window.require('electron');
      const files = await ipcRenderer.invoke('get-audio-files');
      DEFAULT_AUDIO_LISTS = files.map(filename => {
        const id = filename.replace(/\.mp3$/i, '').replace(/[^a-zA-Z0-9]/g, '-');
        return {
          id: id,
          filename: filename,
          name: getAudioNameFromFilename(filename),
          duration: 120
        };
      });
      
      // Ordenar alfabéticamente por nombre
      DEFAULT_AUDIO_LISTS.sort((a, b) => a.name.localeCompare(b.name));
      
      // Si hay audios cargados, inicializar el reproductor
      if (DEFAULT_AUDIO_LISTS.length > 0) {
        initAudio();
      }
    } catch (error) {
      console.error('Error al cargar archivos de audio:', error);
      DEFAULT_AUDIO_LISTS = [];
    }
  } else {
    // Fallback para desarrollo sin Electron
    DEFAULT_AUDIO_LISTS = [];
  }
}

const DEFAULT_SETTINGS = {
  speed: 8,
  duration: 4,
  opacity: 1,
  activeListId: 'abundance',
  paused: false
};

const state = {
  settings: { ...DEFAULT_SETTINGS },
  personalLists: [],
  rotationTimer: null,
  hideTimer: null,
  currentAffirmation: ''
};

const audioState = {
  audioSettings: {
    activeAudioId: null,
    playbackSpeed: 1.0,
    isPlaying: false,
    activeProgramId: null,
    isBinauralActive: false
  },
  audioElement: null,
  currentAudioPath: null,
  binauralSession: {
    active: false,
    completed: false,
    programId: null,
    programName: '',
    carrier: null,
    currentPhaseIndex: -1,
    currentPhaseName: '',
    phaseStatus: 'idle',
    startedAt: null,
    endedAt: null,
    endReason: null,
    lastUpdateAt: null,
    totalDurationSeconds: 0,
    elapsedSeconds: 0,
    currentMinute: 0,
    phaseTimeline: [],
    progressTimer: null
  }
};

let binauralEngine = null;

const elements = {
  text: document.querySelector('#affirmation-text'),
  card: document.querySelector('#display-card'),
  listLabel: document.querySelector('#active-list-label'),
  pauseButton: document.querySelector('#pause-button'),
  speedSlider: document.querySelector('#speed-slider'),
  speedValue: document.querySelector('#speed-value'),
  durationSlider: document.querySelector('#duration-slider'),
  durationValue: document.querySelector('#duration-value'),
  opacitySlider: document.querySelector('#opacity-slider'),
  opacityValue: document.querySelector('#opacity-value'),
  listSelect: document.querySelector('#list-select'),
  newListName: document.querySelector('#new-list-name'),
  createListButton: document.querySelector('#create-list'),
  editor: document.querySelector('#list-editor'),
  editorTitle: document.querySelector('#editor-title'),
  listContent: document.querySelector('#list-content'),
  saveListButton: document.querySelector('#save-list'),
  deleteListButton: document.querySelector('#delete-list'),
  duplicateListButton: document.querySelector('#duplicate-list'),
};

const audioElements = {
  audioSelect: document.querySelector('#audio-select'),
  audioPlayPause: document.querySelector('#audio-play-pause'),
  audioStop: document.querySelector('#audio-stop'),
  audioSpeedSlider: document.querySelector('#audio-speed-slider'),
  audioSpeedValue: document.querySelector('#audio-speed-value'),
  audioStatusText: document.querySelector('#audio-status-text')
};

function ensureBinauralEngine() {
  if (!ELECTRON_AVAILABLE) {
    return null;
  }

  if (!binauralEngine) {
    binauralEngine = new BinauralAudioEngine({
      onPhaseStart: handleBinauralPhaseStart,
      onPhaseEnd: handleBinauralPhaseEnd,
      onSessionEnded: handleBinauralSessionEnded,
      onError: handleBinauralError
    });
  }

  return binauralEngine;
}

function stopBinauralProgressTimer() {
  if (audioState.binauralSession.progressTimer) {
    clearInterval(audioState.binauralSession.progressTimer);
    audioState.binauralSession.progressTimer = null;
  }
}

function startBinauralProgressTimer() {
  stopBinauralProgressTimer();
  if (!audioState.binauralSession.active || !audioState.binauralSession.startedAt) {
    return;
  }

  audioState.binauralSession.progressTimer = setInterval(() => {
    updateBinauralElapsedSeconds();
    updateAudioStatus(formatBinauralStatus());
  }, 1000);
}

function updateBinauralElapsedSeconds() {
  if (!audioState.binauralSession.active || !audioState.binauralSession.startedAt) {
    audioState.binauralSession.elapsedSeconds = 0;
    audioState.binauralSession.currentMinute = 0;
    return;
  }

  const now = Date.now();
  const elapsed = Math.max(0, Math.floor((now - audioState.binauralSession.startedAt) / 1000));
  const total = audioState.binauralSession.totalDurationSeconds || elapsed;
  audioState.binauralSession.elapsedSeconds = Math.min(elapsed, total);

  const totalMinutes = Math.max(1, Math.ceil(total / 60));
  const minutePosition = Math.floor(audioState.binauralSession.elapsedSeconds / 60) + 1;
  audioState.binauralSession.currentMinute = Math.min(totalMinutes, Math.max(1, minutePosition));
}

function computeProgramTimeline(program) {
  if (!program || !Array.isArray(program.phases)) {
    return { totalSeconds: 0, timeline: [] };
  }

  let accumulated = 0;
  const timeline = program.phases.map((phase) => {
    const durationSeconds = Math.max(1, (phase.durationMinutes || 0) * 60);
    const record = {
      offsetSeconds: accumulated,
      durationSeconds
    };
    accumulated += durationSeconds;
    return record;
  });

  return { totalSeconds: accumulated, timeline };
}

function updateBinauralProgressFromPhase(index) {
  const entry = audioState.binauralSession.phaseTimeline[index];
  if (!entry) {
    if (index <= 0) {
      audioState.binauralSession.elapsedSeconds = 0;
      audioState.binauralSession.currentMinute = 1;
    }
    return;
  }

  audioState.binauralSession.elapsedSeconds = entry.offsetSeconds;
  const totalMinutes = Math.max(
    1,
    Math.ceil((audioState.binauralSession.totalDurationSeconds || 0) / 60)
  );
  const minute = Math.floor(entry.offsetSeconds / 60) + 1;
  audioState.binauralSession.currentMinute = Math.min(totalMinutes, Math.max(1, minute));
}

function formatBinauralStatus() {
  if (!ipcRenderer) {
    return audioState.audioSettings.isPlaying
      ? 'Reproduciendo audio'
      : 'Selecciona un audio para comenzar';
  }

  const session = audioState.binauralSession;
  const programName =
    session.programName ||
    (session.programId
      ? (binauralPrograms.find((program) => program.id === session.programId) || {}).name
      : '');

  if (session.active) {
    const phaseName = session.currentPhaseName ? ` • ${session.currentPhaseName}` : '';
    const minuteInfo = session.currentMinute ? ` — Min ${session.currentMinute}` : '';
    return `Reproduciendo ${programName || 'programa binaural'}${phaseName}${minuteInfo}`;
  }

  if (session.completed) {
    return programName
      ? `Programa ${programName} completado`
      : 'Programa binaural completado';
  }

  if (programName) {
    return `Listo para reproducir ${programName}`;
  }

  return 'Selecciona un programa binaural';
}

function handleBinauralSessionStart(payload = {}) {
  const engine = ensureBinauralEngine();
  if (!engine) {
    return;
  }

  if (typeof payload.volume === 'number') {
    try {
      engine.setVolume(payload.volume);
    } catch (error) {
      console.warn('No se pudo establecer el volumen binaural:', error);
    }
  }

  try {
    engine.start(payload);
  } catch (error) {
    handleBinauralError(error);
    return;
  }

  const activeProgram = engine.program || payload.program || null;
  if (activeProgram) {
    prepareBinauralProgramMetadata(activeProgram);
    audioState.audioSettings.activeProgramId = activeProgram.id || audioState.audioSettings.activeProgramId;
    syncBinauralProgramSelection(activeProgram.id, { updateCard: true });
  }

  audioState.binauralSession.active = true;
  audioState.binauralSession.completed = false;
  audioState.binauralSession.phaseStatus = 'starting';
  audioState.binauralSession.currentPhaseIndex = -1;
  audioState.binauralSession.currentPhaseName = '';
  audioState.binauralSession.startedAt = Date.now();
  audioState.binauralSession.endedAt = null;
  audioState.binauralSession.endReason = null;
  audioState.binauralSession.lastUpdateAt = Date.now();
  audioState.binauralSession.elapsedSeconds = 0;
  audioState.binauralSession.currentMinute = 1;
  updateBinauralElapsedSeconds();

  audioState.audioSettings.isBinauralActive = true;
  audioState.audioSettings.isPlaying = true;
  persistAudioSettings();

  startBinauralProgressTimer();
  updateAudioButtons();
  updateAudioStatus(formatBinauralStatus());
}

function handleBinauralPhaseStart(event) {
  audioState.binauralSession.currentPhaseIndex = event?.index ?? -1;
  audioState.binauralSession.currentPhaseName = event?.phase?.name || '';
  audioState.binauralSession.phaseStatus = 'running';
  audioState.binauralSession.lastUpdateAt = Date.now();
  updateBinauralProgressFromPhase(audioState.binauralSession.currentPhaseIndex);
  updateBinauralElapsedSeconds();
  updateAudioButtons();
  updateAudioStatus(formatBinauralStatus());

  if (ipcRenderer) {
    ipcRenderer.send('binaural-session:phase-progress', {
      phaseIndex: event?.index ?? -1,
      status: 'started',
      beatFrequency: event?.startBeatFrequency,
      programId: audioState.binauralSession.programId
    });
  }
}

function handleBinauralPhaseEnd(event) {
  audioState.binauralSession.lastUpdateAt = Date.now();
  audioState.binauralSession.phaseStatus = 'completed';

  if (ipcRenderer) {
    ipcRenderer.send('binaural-session:phase-progress', {
      phaseIndex: event?.index ?? -1,
      status: 'completed',
      beatFrequency: event?.endBeatFrequency,
      programId: audioState.binauralSession.programId
    });
  }
}

function handleBinauralSessionEnded(event) {
  const reason = event?.reason || 'completed';
  stopBinauralProgressTimer();

  audioState.binauralSession.active = false;
  audioState.binauralSession.phaseStatus = reason === 'completed' ? 'completed' : 'stopped';
  audioState.binauralSession.completed = reason === 'completed';
  audioState.binauralSession.endedAt = Date.now();
  audioState.binauralSession.endReason = reason;

  audioState.audioSettings.isBinauralActive = false;
  audioState.audioSettings.isPlaying = false;
  persistAudioSettings();

  updateBinauralElapsedSeconds();
  updateAudioButtons();
  updateAudioStatus(formatBinauralStatus());

  if (ipcRenderer) {
    ipcRenderer.send('binaural-session:ended', {
      reason,
      programId: audioState.binauralSession.programId
    });
  }
}

function handleBinauralError(error) {
  console.error('Error en la sesión binaural:', error);
  stopBinauralProgressTimer();
  audioState.binauralSession.active = false;
  audioState.binauralSession.phaseStatus = 'error';
  audioState.binauralSession.completed = false;
  audioState.binauralSession.endReason = 'error';
  audioState.binauralSession.endedAt = Date.now();

  audioState.audioSettings.isBinauralActive = false;
  audioState.audioSettings.isPlaying = false;
  persistAudioSettings();

  updateAudioButtons();
  updateAudioStatus('Error en la sesión binaural');

  if (ipcRenderer) {
    ipcRenderer.invoke('stop-binaural-session', { reason: 'error' }).catch(() => {});
  }
}

function applyBinauralStateFromMain(state) {
  if (!state || typeof state !== 'object') {
    return;
  }

  if (state.program) {
    prepareBinauralProgramMetadata(state.program);
    syncBinauralProgramSelection(state.program.id, { updateCard: true });
  } else if (state.programId) {
    const program = binauralPrograms.find((item) => item.id === state.programId);
    if (program) {
      prepareBinauralProgramMetadata(program);
      syncBinauralProgramSelection(program.id, { updateCard: true });
    }
  }

  if (typeof state.volume === 'number') {
    const engine = ensureBinauralEngine();
    if (engine) {
      try {
        engine.setVolume(state.volume);
      } catch (error) {
        console.warn('No se pudo sincronizar el volumen binaural:', error);
      }
    }
  }

  audioState.binauralSession.active = Boolean(state.active);
  audioState.binauralSession.completed = Boolean(state.completed);
  audioState.binauralSession.programId = state.programId || audioState.binauralSession.programId;
  audioState.binauralSession.programName = state.programName || audioState.binauralSession.programName;
  if (typeof state.carrier === 'number') {
    audioState.binauralSession.carrier = state.carrier;
  }

  if (typeof state.currentPhaseIndex === 'number') {
    audioState.binauralSession.currentPhaseIndex = state.currentPhaseIndex;
  }
  audioState.binauralSession.phaseStatus = state.phaseStatus || audioState.binauralSession.phaseStatus;

  if (state.startedAt) {
    audioState.binauralSession.startedAt = state.startedAt;
  }

  if (state.endedAt) {
    audioState.binauralSession.endedAt = state.endedAt;
  }

  if (state.endReason) {
    audioState.binauralSession.endReason = state.endReason;
  }

  if (state.lastUpdateAt) {
    audioState.binauralSession.lastUpdateAt = state.lastUpdateAt;
  }

  if (
    audioState.binauralSession.currentPhaseIndex >= 0 &&
    audioState.binauralSession.phaseTimeline[audioState.binauralSession.currentPhaseIndex]
  ) {
    const timelineEntry = audioState.binauralSession.phaseTimeline[audioState.binauralSession.currentPhaseIndex];
    const programSource =
      state.program ||
      binauralPrograms.find((item) => item.id === audioState.binauralSession.programId) ||
      null;
    const phase = programSource?.phases?.[audioState.binauralSession.currentPhaseIndex];
    audioState.binauralSession.currentPhaseName = phase?.name || audioState.binauralSession.currentPhaseName;
    audioState.binauralSession.elapsedSeconds = timelineEntry.offsetSeconds;
    updateBinauralProgressFromPhase(audioState.binauralSession.currentPhaseIndex);
  } else if (!audioState.binauralSession.active) {
    audioState.binauralSession.currentMinute = 0;
  }

  if (audioState.binauralSession.programId) {
    audioState.audioSettings.activeProgramId = audioState.binauralSession.programId;
  }

  if (audioState.binauralSession.active) {
    audioState.audioSettings.isBinauralActive = true;
    audioState.audioSettings.isPlaying = true;
    if (!audioState.binauralSession.startedAt) {
      audioState.binauralSession.startedAt = Date.now();
    }
    startBinauralProgressTimer();
  } else {
    audioState.audioSettings.isBinauralActive = false;
    audioState.audioSettings.isPlaying = false;
    stopBinauralProgressTimer();
  }

  updateBinauralElapsedSeconds();
  updateAudioButtons();
  updateAudioStatus(formatBinauralStatus());
  persistAudioSettings();
}

async function handleBinauralPlayPause() {
  const activeProgramId =
    audioState.audioSettings.activeProgramId || (binauralPrograms[0] ? binauralPrograms[0].id : null);

  if (!activeProgramId) {
    updateAudioStatus('No hay programas binaurales disponibles');
    return;
  }

  if (audioState.binauralSession.active) {
    await stopBinauralSession('manual');
    return;
  }

  await startBinauralSessionById(activeProgramId);
}

async function startBinauralSessionById(programId) {
  if (!ipcRenderer) {
    return;
  }

  const program = binauralPrograms.find((item) => item.id === programId);
  if (!program) {
    updateAudioStatus('Programa binaural no disponible');
    return;
  }

  try {
    const response = await ipcRenderer.invoke('start-binaural-session', { program });
    if (!response || response.success !== true) {
      throw new Error(response?.message || 'No se pudo iniciar la sesión binaural');
    }
    audioState.audioSettings.activeProgramId = program.id;
    audioState.audioSettings.isBinauralActive = true;
    persistAudioSettings();
    syncBinauralProgramSelection(program.id, { updateCard: true });
    audioState.binauralSession.active = true;
    audioState.audioSettings.isPlaying = true;
    updateAudioStatus(`Iniciando ${program.name}...`);
    updateAudioButtons();
  } catch (error) {
    console.error('Error al iniciar sesión binaural:', error);
    updateAudioStatus('Error al iniciar sesión binaural');
    audioState.binauralSession.active = false;
    audioState.audioSettings.isBinauralActive = false;
    audioState.audioSettings.isPlaying = false;
    stopBinauralProgressTimer();
    updateAudioButtons();
  }
}

async function stopBinauralSession(reason = 'manual') {
  if (!ipcRenderer) {
    return;
  }

  try {
    const response = await ipcRenderer.invoke('stop-binaural-session', { reason });
    if (!response || response.success !== true) {
      throw new Error(response?.message || 'No se pudo detener la sesión binaural');
    }
    audioState.audioSettings.isBinauralActive = false;
    audioState.audioSettings.isPlaying = false;
    audioState.binauralSession.active = false;
    audioState.binauralSession.completed = reason === 'completed';
    persistAudioSettings();
    updateAudioStatus('Detenido');
    stopBinauralProgressTimer();
    updateAudioButtons();
  } catch (error) {
    console.error('Error al detener sesión binaural:', error);
    updateAudioStatus('Error al detener sesión binaural');
  }
}

function registerBinauralIpcEvents() {
  if (!ipcRenderer) {
    return;
  }

  ipcRenderer.on('binaural-session:start', (event, payload = {}) => {
    handleBinauralSessionStart(payload);
  });

  ipcRenderer.on('binaural-session:stop', (event, payload = {}) => {
    const engine = ensureBinauralEngine();
    if (engine) {
      try {
        engine.stop({ reason: payload?.reason || 'manual', notify: false });
      } catch (error) {
        console.warn('No se pudo detener el motor binaural:', error);
      }
    }
    handleBinauralSessionEnded({ reason: payload?.reason || 'manual' });
  });

  ipcRenderer.on('binaural-session:state', (event, state) => {
    applyBinauralStateFromMain(state);
  });
}

async function syncBinauralStateFromMain() {
  if (!ipcRenderer) {
    return null;
  }

  try {
    const response = await ipcRenderer.invoke('get-binaural-session-state');
    if (response && response.success && response.state) {
      applyBinauralStateFromMain(response.state);
      return response.state;
    }
  } catch (error) {
    console.error('Error al sincronizar estado binaural:', error);
  }

  return null;
}

async function restoreBinauralSessionIfNeeded() {
  if (!ipcRenderer) {
    return;
  }

  const state = await syncBinauralStateFromMain();
  if (state && state.active) {
    return;
  }

  if (audioState.audioSettings.isBinauralActive) {
    const programId =
      audioState.audioSettings.activeProgramId || (binauralPrograms[0] ? binauralPrograms[0].id : null);
    if (programId) {
      await startBinauralSessionById(programId);
    } else {
      audioState.audioSettings.isBinauralActive = false;
      persistAudioSettings();
    }
  } else {
    updateAudioStatus(formatBinauralStatus());
  }
}

function syncBinauralProgramSelection(programId, { updateCard = false } = {}) {
  if (!programId) {
    return;
  }

  const { select } = binauralProgramUI.elements;
  if (select && select.value !== programId) {
    select.value = programId;
  }

  if (updateCard) {
    updateBinauralProgramDetails(programId, { persist: false });
  }
}

function loadState() {
  try {
    const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      state.settings = { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('No se pudieron cargar los ajustes, se usarán los valores por defecto.', error);
  }

  try {
    const storedLists = localStorage.getItem(STORAGE_KEYS.personalLists);
    if (storedLists) {
      const parsed = JSON.parse(storedLists);
      if (Array.isArray(parsed)) {
        state.personalLists = parsed.filter(Boolean).map((list) => ({
          ...list,
          type: 'personal',
          phrases: Array.isArray(list.phrases) ? list.phrases : []
        }));
      }
    }
  } catch (error) {
    console.warn('No se pudieron cargar las listas personales.', error);
  }
}

function persistSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  } catch (error) {
    console.warn('No se pudieron guardar los ajustes.', error);
  }
}

function persistPersonalLists() {
  try {
    const payload = state.personalLists.map(({ id, name, phrases }) => ({ id, name, phrases }));
    localStorage.setItem(STORAGE_KEYS.personalLists, JSON.stringify(payload));
  } catch (error) {
    console.warn('No se pudieron guardar las listas personales.', error);
  }
}

function getAllLists() {
  return [...DEFAULT_LISTS, ...state.personalLists];
}

function findListById(id) {
  return getAllLists().find((list) => list.id === id);
}

function ensureActiveList() {
  const active = findListById(state.settings.activeListId);
  if (active) {
    return active;
  }

  const fallback = DEFAULT_LISTS[0];
  state.settings.activeListId = fallback.id;
  persistSettings();
  return fallback;
}

function formatListLabel(list) {
  return `${list.name} ${list.type === 'global' ? '(Global)' : '(Personal)'}`;
}

function renderListOptions() {
  const { listSelect } = elements;
  listSelect.innerHTML = '';

  const globalGroup = document.createElement('optgroup');
  globalGroup.label = 'Listas globales';
  DEFAULT_LISTS.forEach((list) => {
    const option = document.createElement('option');
    option.value = list.id;
    option.textContent = list.name;
    globalGroup.appendChild(option);
  });
  listSelect.appendChild(globalGroup);

  if (state.personalLists.length > 0) {
    const personalGroup = document.createElement('optgroup');
    personalGroup.label = 'Tus listas';
    state.personalLists.forEach((list) => {
      const option = document.createElement('option');
      option.value = list.id;
      option.textContent = list.name;
      personalGroup.appendChild(option);
    });
    listSelect.appendChild(personalGroup);
  }

  listSelect.value = state.settings.activeListId;
}

function updateActiveListLabel() {
  const active = ensureActiveList();
  elements.listLabel.textContent = `Lista activa: ${formatListLabel(active)}`;
}

function updateSliders() {
  const { settings } = state;
  elements.speedSlider.value = String(settings.speed);
  elements.speedValue.textContent = settings.speed;

  elements.durationSlider.value = String(settings.duration);
  elements.durationValue.textContent = settings.duration;

  const opacityPercent = Math.round(settings.opacity * 100);
  elements.opacitySlider.value = String(opacityPercent);
  elements.opacityValue.textContent = `${opacityPercent}%`;
  applyOpacity();
}

function applyOpacity() {
  elements.card.style.opacity = state.settings.opacity.toFixed(2);
}

function setPaused(paused) {
  state.settings.paused = paused;
  persistSettings();
  updatePauseButton();
  if (paused) {
    clearTimers();
    elements.text.classList.remove('visible');
  } else {
    restartRotation(true);
  }
}

function updatePauseButton() {
  elements.pauseButton.textContent = state.settings.paused ? 'Reanudar' : 'Pausar';
}

function clearTimers() {
  if (state.rotationTimer) {
    clearTimeout(state.rotationTimer);
    state.rotationTimer = null;
  }
  if (state.hideTimer) {
    clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }
}

function pickRandomAffirmation(list) {
  if (!list || list.phrases.length === 0) {
    return null;
  }
  if (list.phrases.length === 1) {
    return list.phrases[0];
  }

  const remaining = list.phrases.filter((phrase) => phrase !== state.currentAffirmation);
  const pool = remaining.length > 0 ? remaining : list.phrases;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function showAffirmation(text) {
  state.currentAffirmation = text ?? '';
  elements.text.textContent = text ?? 'Agrega frases a la lista seleccionada para comenzar.';

  if (text) {
    elements.text.classList.add('visible');
    scheduleHide();
  } else {
    elements.text.classList.remove('visible');
  }
}

function scheduleHide() {
  clearTimeout(state.hideTimer);
  const { duration, speed } = state.settings;
  const hideDelay = Math.min(duration, speed) * 1000;
  state.hideTimer = setTimeout(() => {
    elements.text.classList.remove('visible');
  }, hideDelay);
}

function scheduleNext() {
  clearTimeout(state.rotationTimer);
  if (state.settings.paused) {
    return;
  }

  const activeList = ensureActiveList();
  const nextAffirmation = pickRandomAffirmation(activeList);
  showAffirmation(nextAffirmation);

  state.rotationTimer = setTimeout(scheduleNext, Math.max(state.settings.speed, 1) * 1000);
}

function restartRotation(immediate = false) {
  clearTimers();
  if (state.settings.paused) {
    return;
  }
  if (immediate) {
    scheduleNext();
  } else {
    state.rotationTimer = setTimeout(scheduleNext, 0);
  }
}

function handleSpeedChange(value) {
  const speed = Number(value);
  state.settings.speed = Number.isFinite(speed) ? Math.max(1, speed) : DEFAULT_SETTINGS.speed;
  if (state.settings.duration > state.settings.speed) {
    state.settings.duration = state.settings.speed;
  }
  persistSettings();
  updateSliders();
  restartRotation(true);
}

function handleDurationChange(value) {
  const duration = Number(value);
  state.settings.duration = Number.isFinite(duration) ? Math.max(1, duration) : DEFAULT_SETTINGS.duration;
  if (state.settings.duration > state.settings.speed) {
    state.settings.duration = state.settings.speed;
  }
  persistSettings();
  updateSliders();
}

function handleOpacityChange(value) {
  const numeric = Number(value);
  const normalized = Math.min(Math.max(numeric, 5), 100) / 100;
  state.settings.opacity = Number(normalized.toFixed(2));
  persistSettings();
  updateSliders();
}

function handleListSelection(value) {
  if (!value) {
    return;
  }
  state.settings.activeListId = value;
  persistSettings();
  updateActiveListLabel();
  renderEditor();
  restartRotation(true);
}

function createPersonalList(name) {
  const trimmed = name.trim();
  if (!trimmed) {
    return;
  }
  const exists = state.personalLists.some((list) => list.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    alert('Ya tienes una lista con ese nombre.');
    return;
  }
  const newList = {
    id: `list-${Date.now()}`,
    name: trimmed,
    type: 'personal',
    phrases: ['Escribe tu primera afirmación aquí.']
  };
  state.personalLists = [...state.personalLists, newList];
  persistPersonalLists();
  state.settings.activeListId = newList.id;
  persistSettings();
  elements.newListName.value = '';
  renderListOptions();
  updateActiveListLabel();
  renderEditor();
  restartRotation(true);
}

function saveActivePersonalList() {
  const active = findListById(state.settings.activeListId);
  if (!active || active.type !== 'personal') {
    return;
  }
  const lines = elements.listContent.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  active.phrases = lines;
  state.personalLists = state.personalLists.map((list) => (list.id === active.id ? active : list));
  persistPersonalLists();
  restartRotation(true);
}

function deleteActivePersonalList() {
  const active = findListById(state.settings.activeListId);
  if (!active || active.type !== 'personal') {
    return;
  }
  const confirmation = confirm(`¿Eliminar la lista "${active.name}"?`);
  if (!confirmation) {
    return;
  }
  state.personalLists = state.personalLists.filter((list) => list.id !== active.id);
  persistPersonalLists();
  state.settings.activeListId = DEFAULT_LISTS[0].id;
  persistSettings();
  renderListOptions();
  updateActiveListLabel();
  renderEditor();
  restartRotation(true);
}

function duplicateActivePersonalList() {
  const active = findListById(state.settings.activeListId);
  if (!active) {
    return;
  }
  const clone = {
    ...active,
    id: `list-${Date.now()}`,
    name: `${active.name} copia`,
    phrases: [...active.phrases],
    type: 'personal'
  };
  state.personalLists = [...state.personalLists, clone];
  persistPersonalLists();
  state.settings.activeListId = clone.id;
  persistSettings();
  renderListOptions();
  updateActiveListLabel();
  renderEditor();
  restartRotation(true);
}

function renderEditor() {
  const active = findListById(state.settings.activeListId);
  if (active && active.type === 'personal') {
    elements.editor.hidden = false;
    elements.editorTitle.textContent = active.name;
    elements.listContent.value = active.phrases.join('\n');
    elements.deleteListButton.disabled = false;
    elements.saveListButton.disabled = false;
    elements.duplicateListButton.disabled = false;
  } else {
    elements.editor.hidden = true;
    elements.listContent.value = '';
  }
}

function setupConsentModal() {
  // SIMPLIFICADO: Ocultar modal automáticamente y usar modo visible por defecto
  elements.consentModal.hidden = true;
  state.settings.opacity = 1;
  persistSettings();
}

function registerEvents() {
  elements.pauseButton.addEventListener('click', () => {
    setPaused(!state.settings.paused);
  });

  elements.speedSlider.addEventListener('input', (event) => {
    handleSpeedChange(event.target.value);
  });

  elements.durationSlider.addEventListener('input', (event) => {
    handleDurationChange(event.target.value);
  });

  elements.opacitySlider.addEventListener('input', (event) => {
    handleOpacityChange(event.target.value);
  });

  elements.listSelect.addEventListener('change', (event) => {
    handleListSelection(event.target.value);
  });

  elements.createListButton.addEventListener('click', () => {
    createPersonalList(elements.newListName.value);
  });

  elements.newListName.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      createPersonalList(elements.newListName.value);
    }
  });

  elements.saveListButton.addEventListener('click', saveActivePersonalList);
  elements.deleteListButton.addEventListener('click', deleteActivePersonalList);
  elements.duplicateListButton.addEventListener('click', duplicateActivePersonalList);
}

// ===== AUDIO MODULE =====
function loadAudioSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.audioSettings);
    if (stored) {
      const parsed = JSON.parse(stored);
      audioState.audioSettings = {
        ...audioState.audioSettings,
        activeAudioId: parsed.activeAudioId || null,
        playbackSpeed:
          typeof parsed.playbackSpeed === 'number'
            ? parsed.playbackSpeed
            : audioState.audioSettings.playbackSpeed,
        isPlaying: Boolean(parsed.isPlaying),
        activeProgramId:
          parsed.activeProgramId || parsed.binauralProgramId || audioState.audioSettings.activeProgramId,
        isBinauralActive: Boolean(parsed.isBinauralActive)
      };
    }
  } catch (error) {
    console.warn('No se pudieron cargar los ajustes de audio, se usarán los valores por defecto.', error);
  }
}

function persistAudioSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.audioSettings, JSON.stringify(audioState.audioSettings));
  } catch (error) {
    console.warn('No se pudieron guardar los ajustes de audio.', error);
  }
}

function findAudioById(id) {
  return DEFAULT_AUDIO_LISTS.find((audio) => audio.id === id);
}

function renderAudioOptions() {
  const { audioSelect } = audioElements;
  audioSelect.innerHTML = '';
  
  DEFAULT_AUDIO_LISTS.forEach((audio) => {
    const option = document.createElement('option');
    option.value = audio.id;
    option.textContent = audio.name;
    audioSelect.appendChild(option);
  });
  
  if (audioState.audioSettings.activeAudioId) {
    audioSelect.value = audioState.audioSettings.activeAudioId;
  } else if (DEFAULT_AUDIO_LISTS.length > 0) {
    audioState.audioSettings.activeAudioId = DEFAULT_AUDIO_LISTS[0].id;
    audioSelect.value = DEFAULT_AUDIO_LISTS[0].id;
    persistAudioSettings();
  }
}

async function getAudioPath(filename) {
  if (typeof window !== 'undefined' && window.require) {
    try {
      const { ipcRenderer } = window.require('electron');
      const path = await ipcRenderer.invoke('get-audio-path', filename);
      return path;
    } catch (error) {
      console.error('Error obteniendo ruta de audio:', error);
      // Fallback a ruta relativa si falla IPC
      return `./assets/audio/${filename}`;
    }
  }
  // Fallback para desarrollo: ruta relativa (cuando no hay Electron)
  return `./assets/audio/${filename}`;
}

async function loadAudio(audioId) {
  const audio = findAudioById(audioId);
  if (!audio) {
    console.warn('Audio no encontrado:', audioId);
    return false;
  }

  const path = await getAudioPath(audio.filename);
  if (!path) {
    console.error('No se pudo obtener la ruta del audio:', audio.filename);
    updateAudioStatus('Error al cargar el audio');
    return false;
  }

  // Limpiar audio anterior si existe
  if (audioState.audioElement) {
    audioState.audioElement.pause();
    audioState.audioElement.removeEventListener('ended', handleAudioEnded);
    audioState.audioElement = null;
  }

  // Crear nuevo elemento de audio
  const audioEl = new Audio(path);
  audioEl.playbackRate = audioState.audioSettings.playbackSpeed;
  audioEl.loop = false; // Manejaremos el loop manualmente para seamless
  
  audioEl.addEventListener('ended', handleAudioEnded);
  audioEl.addEventListener('error', (e) => {
    console.error('Error en reproducción de audio:', e);
    updateAudioStatus('Error al reproducir el audio');
    audioState.audioSettings.isPlaying = false;
    updateAudioButtons();
    persistAudioSettings();
  });

  audioState.audioElement = audioEl;
  audioState.currentAudioPath = path;
  audioState.audioSettings.activeAudioId = audioId;
  persistAudioSettings();
  
  updateAudioStatus(`Audio cargado: ${audio.name}`);
  return true;
}

function handleAudioEnded() {
  // Reiniciar sin delay para loop seamless
  if (audioState.audioElement && audioState.audioSettings.isPlaying) {
    audioState.audioElement.currentTime = 0;
    audioState.audioElement.play().catch((error) => {
      console.error('Error al reiniciar audio:', error);
    });
  }
}

function updateAudioStatus(text) {
  audioElements.audioStatusText.textContent = text;
}

function updateAudioButtons() {
  const { audioPlayPause, audioStop } = audioElements;
  if (!audioPlayPause) {
    return;
  }

  if (ipcRenderer) {
    audioPlayPause.textContent = audioState.binauralSession.active ? 'Pausar' : 'Reproducir';
    if (audioStop) {
      audioStop.disabled = !audioState.binauralSession.active && !audioState.binauralSession.completed;
    }
    return;
  }

  if (audioState.audioSettings.isPlaying) {
    audioPlayPause.textContent = 'Pausar';
  } else {
    audioPlayPause.textContent = 'Reproducir';
  }

  if (audioStop) {
    audioStop.disabled = false;
  }
}

function updateAudioSpeed() {
  const { audioSpeedValue, audioSpeedSlider } = audioElements;
  const speed = parseFloat(audioSpeedSlider.value);
  audioSpeedValue.textContent = `${speed.toFixed(1)}x`;
  
  if (audioState.audioElement) {
    audioState.audioElement.playbackRate = speed;
  }
  
  audioState.audioSettings.playbackSpeed = speed;
  persistAudioSettings();
}

async function handleAudioPlayPause() {
  if (ipcRenderer) {
    await handleBinauralPlayPause();
    return;
  }

  if (!audioState.audioElement) {
    // Intentar cargar el audio seleccionado
    const audioId = audioElements.audioSelect.value;
    if (audioId) {
      const loaded = await loadAudio(audioId);
      if (!loaded) return;
    } else {
      updateAudioStatus('Selecciona un audio primero');
      return;
    }
  }

  if (audioState.audioSettings.isPlaying) {
    // Pausar
    audioState.audioElement.pause();
    audioState.audioSettings.isPlaying = false;
    updateAudioStatus('Pausado');
  } else {
    // Reproducir
    try {
      await audioState.audioElement.play();
      audioState.audioSettings.isPlaying = true;
      const audio = findAudioById(audioState.audioSettings.activeAudioId);
      updateAudioStatus(`Reproduciendo: ${audio ? audio.name : ''}`);
    } catch (error) {
      console.error('Error al reproducir audio:', error);
      updateAudioStatus('Error al reproducir');
    }
  }
  
  updateAudioButtons();
  persistAudioSettings();
}

function handleAudioStop() {
  if (ipcRenderer) {
    stopBinauralSession('manual');
    return;
  }

  if (audioState.audioElement) {
    audioState.audioElement.pause();
    audioState.audioElement.currentTime = 0;
    audioState.audioSettings.isPlaying = false;
    updateAudioStatus('Detenido');
    updateAudioButtons();
    persistAudioSettings();
  }
}

async function handleAudioSelection(value) {
  if (ipcRenderer) {
    if (!value) return;
    updateBinauralProgramDetails(value);
    updateAudioStatus(formatBinauralStatus());
    return;
  }

  if (!value) return;

  // Detener reproducción actual
  handleAudioStop();

  // Cargar nuevo audio
  await loadAudio(value);
  updateAudioButtons();
}

function registerAudioEvents() {
  audioElements.audioSelect.addEventListener('change', (event) => {
    handleAudioSelection(event.target.value);
  });

  audioElements.audioPlayPause.addEventListener('click', handleAudioPlayPause);
  audioElements.audioStop.addEventListener('click', handleAudioStop);

  audioElements.audioSpeedSlider.addEventListener('input', (event) => {
    updateAudioSpeed();
  });
}

function initAudio() {
  if (!ipcRenderer) {
    renderAudioOptions();
  } else if (DEFAULT_AUDIO_LISTS.length > 0) {
    renderAudioOptions();
  } else {
    audioElements.audioSelect.innerHTML = '';
  }

  if (audioElements.audioSpeedSlider) {
    const storedSpeed = parseFloat(audioState.audioSettings.playbackSpeed);
    if (!Number.isNaN(storedSpeed)) {
      const slider = audioElements.audioSpeedSlider;
      const min = parseFloat(slider.min || '0.5');
      const max = parseFloat(slider.max || '2.0');
      const clamped = Math.min(Math.max(storedSpeed, min), max);
      slider.value = String(clamped);
    }
  }

  updateAudioSpeed();
  updateAudioButtons();
  updateAudioStatus(formatBinauralStatus());
  registerAudioEvents();
}

// ===== END AUDIO MODULE =====

const binauralProgramUI = {
  initialized: false,
  elements: {}
};

function formatProgramDuration(minutes) {
  if (typeof minutes !== 'number' || Number.isNaN(minutes) || minutes <= 0) {
    return '—';
  }

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const remainingMinutes = rounded % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (remainingMinutes > 0 || parts.length === 0) {
    parts.push(`${remainingMinutes}m`);
  }

  return parts.join(' ');
}

function ensureBinauralProgramPanel() {
  const layout = document.querySelector('.layout');
  if (!layout) {
    return null;
  }

  let panel = document.querySelector('.binaural-programs-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'panel binaural-programs-panel';
    panel.innerHTML = `
      <h2>Programas binaurales</h2>
      <p class="helper-text">Selecciona una secuencia diseñada para acompañar tus objetivos.</p>
      <label class="control">
        <span>Programa activo</span>
        <select id="binaural-program-select"></select>
      </label>
      <div class="program-details-card" id="binaural-program-card" hidden>
        <h3 id="binaural-program-name"></h3>
        <p class="program-objective" id="binaural-program-objective"></p>
        <div class="program-meta">
          <span class="program-meta-item"><strong>Carrier:</strong> <span id="binaural-program-carrier"></span> Hz</span>
          <span class="program-meta-item"><strong>Duración total:</strong> <span id="binaural-program-duration"></span></span>
        </div>
        <ul class="program-phases" id="binaural-program-phases"></ul>
      </div>
    `;
    layout.appendChild(panel);
  }

  return panel;
}

function renderBinauralProgramOptions() {
  if (!Array.isArray(binauralPrograms) || binauralPrograms.length === 0) {
    return;
  }

  const panel = ensureBinauralProgramPanel();
  if (!panel) {
    return;
  }

  const select = panel.querySelector('#binaural-program-select');
  const card = panel.querySelector('#binaural-program-card');
  const nameEl = panel.querySelector('#binaural-program-name');
  const objectiveEl = panel.querySelector('#binaural-program-objective');
  const carrierEl = panel.querySelector('#binaural-program-carrier');
  const durationEl = panel.querySelector('#binaural-program-duration');
  const phasesEl = panel.querySelector('#binaural-program-phases');

  if (!select || !card || !nameEl || !objectiveEl || !carrierEl || !durationEl || !phasesEl) {
    return;
  }

  if (!binauralProgramUI.initialized) {
    select.addEventListener('change', (event) => {
      updateBinauralProgramDetails(event.target.value);
    });
  }

  select.innerHTML = binauralPrograms
    .map((program) => `<option value="${program.id}">${program.name}</option>`)
    .join('');

  const storedProgramId = audioState.audioSettings.activeProgramId;
  if (storedProgramId && binauralPrograms.some((program) => program.id === storedProgramId)) {
    select.value = storedProgramId;
  }

  binauralProgramUI.elements = {
    select,
    card,
    nameEl,
    objectiveEl,
    carrierEl,
    durationEl,
    phasesEl
  };

  const defaultProgramId =
    select.value || storedProgramId || (binauralPrograms[0] ? binauralPrograms[0].id : null);

  if (defaultProgramId) {
    select.value = defaultProgramId;
    updateBinauralProgramDetails(defaultProgramId, { persist: false });
  }

  binauralProgramUI.initialized = true;
}

function updateBinauralProgramDetails(programId, { persist = true } = {}) {
  if (!Array.isArray(binauralPrograms) || binauralPrograms.length === 0) {
    return;
  }

  const {
    select,
    card,
    nameEl,
    objectiveEl,
    carrierEl,
    durationEl,
    phasesEl
  } = binauralProgramUI.elements;

  if (!select || !card || !nameEl || !objectiveEl || !carrierEl || !durationEl || !phasesEl) {
    return;
  }

  const program = binauralPrograms.find((item) => item.id === programId) || binauralPrograms[0];

  if (!program) {
    card.hidden = true;
    return;
  }

  if (select.value !== program.id) {
    select.value = program.id;
  }

  card.hidden = false;
  nameEl.textContent = program.name;
  objectiveEl.textContent = program.shortDescription || program.objective || '';
  carrierEl.textContent = program.carrier ?? '—';
  durationEl.textContent = formatProgramDuration(program.totalDurationMinutes);

  phasesEl.innerHTML = '';
  program.phases.forEach((phase) => {
    const item = document.createElement('li');
    item.className = 'program-phase';

    const header = document.createElement('div');
    header.className = 'program-phase-header';
    const beat = typeof phase.beatFrequency === 'number' ? `${phase.beatFrequency}Hz` : '';
    header.textContent = beat ? `${phase.name} • ${beat}` : phase.name;

    const meta = document.createElement('span');
    meta.className = 'program-phase-meta';
    meta.textContent = `Duración: ${formatProgramDuration(phase.durationMinutes)}`;

    item.appendChild(header);

    if (phase.description) {
      const description = document.createElement('p');
      description.className = 'program-phase-description';
      description.textContent = phase.description;
      item.appendChild(description);
    }

    item.appendChild(meta);

    phasesEl.appendChild(item);
  });

  if (persist) {
    audioState.audioSettings.activeProgramId = program.id;
    persistAudioSettings();
  }

  prepareBinauralProgramMetadata(program);
  updateAudioStatus(formatBinauralStatus());
}

function prepareBinauralProgramMetadata(program) {
  const { totalSeconds, timeline } = computeProgramTimeline(program);
  audioState.binauralSession.totalDurationSeconds = totalSeconds;
  audioState.binauralSession.phaseTimeline = timeline;
  audioState.binauralSession.programId = program ? program.id : null;
  audioState.binauralSession.programName = program ? program.name : '';
  audioState.binauralSession.carrier = program ? program.carrier : null;
}

function initBinauralPrograms() {
  renderBinauralProgramOptions();
}

async function init() {
  loadState();
  loadAudioSettings();
  renderListOptions();
  updateActiveListLabel();
  updateSliders();
  renderEditor();
  updatePauseButton();
  initBinauralPrograms();
  registerEvents();
  if (ipcRenderer) {
    registerBinauralIpcEvents();
  }
  restartRotation(true);

  // Cargar archivos de audio primero, luego inicializar reproductor
  await loadAudioFilesList();
  initAudio();

  if (ipcRenderer) {
    await restoreBinauralSessionIfNeeded();
  } else {
    updateAudioStatus(formatBinauralStatus());
  }
}

init();
