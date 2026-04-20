const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { loadTranslations, t, setLanguage } = require('./i18n');
const { BinauralSessionService } = require('./binauralSessionService');

let mainWindow;
let overlayWindow;
const binauralSessionService = new BinauralSessionService();

// Cargar programas binaurales al inicio
let binauralProgramsCache = null;

async function loadBinauralPrograms() {
  if (binauralProgramsCache) {
    return binauralProgramsCache;
  }
  
  try {
    const appPath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
    const programsPath = path.join(appPath, 'src', 'binauralPrograms.js');
    const resolvedPath = path.resolve(programsPath);
    const fileUrl = 'file://' + resolvedPath;
    
    const module = await import(fileUrl);
    binauralProgramsCache = module.binauralPrograms || module.default || [];
    
    if (Array.isArray(binauralProgramsCache) && binauralProgramsCache.length > 0) {
      console.log(`Programas binaurales cargados en main.js: ${binauralProgramsCache.length}`);
    } else {
      console.warn('No se encontraron programas binaurales en el módulo');
      binauralProgramsCache = [];
    }
  } catch (error) {
    console.error('Error al cargar programas binaurales en main.js:', error);
    binauralProgramsCache = [];
  }
  
  return binauralProgramsCache;
}

const stopSessionIfOverlayHidden = (reason) => {
  try {
    const state = binauralSessionService.getState();
    if (state && state.active) {
      binauralSessionService.stopSession(reason);
    }
  } catch (error) {
    console.error('Error deteniendo la sesión binaural al ocultar overlay:', error);
  }
};

// Configuración por defecto
const defaultConfig = {
  lists: [
    {
      id: 'default',
      name: 'Default',
      affirmations: [
        "Soy un imán para las oportunidades financieras.",
        "El dinero fluye hacia mí de manera natural y constante.",
        "Cada día aumento mi capacidad de generar riqueza.",
        "Estoy abierto a recibir abundancia ilimitada.",
        "Mi atención se mantiene firme en lo importante.",
        "Avanzo paso a paso con claridad y confianza.",
        "Mi cuerpo es fuerte, flexible y lleno de energía.",
        "Nutro mi bienestar con decisiones conscientes."
      ]
    },
    {
      id: 'self-esteem',
      name: 'Self-Esteem',
      affirmations: [
        "I love and accept myself exactly as I am.",
        "I am proud of who I am becoming.",
        "I am enough just as I am.",
        "I believe in myself and my abilities.",
        "I am worthy of love, respect, and kindness.",
        "I forgive myself for past mistakes.",
        "I am growing stronger and more confident each day.",
        "I speak to myself with compassion.",
        "I trust my inner voice.",
        "I radiate confidence and calm.",
        "I am proud of my progress, no matter how small.",
        "I deserve happiness and peace.",
        "I let go of self-doubt and choose self-trust.",
        "I value my uniqueness.",
        "I am calm, confident, and centered.",
        "I celebrate my strengths and embrace my flaws.",
        "It is safe to be fully myself.",
        "I am enough in this moment.",
        "I choose to love myself unconditionally.",
        "I am worthy of good things in life.",
        "I walk with confidence and purpose.",
        "I am kind to myself in every thought.",
        "I release comparison and choose acceptance.",
        "I trust the process of my growth.",
        "I am proud of my story.",
        "I am beautiful inside and out.",
        "I am learning to see myself with love.",
        "I release the need for perfection.",
        "I am confident in my path.",
        "I am grateful for who I am.",
        "I shine naturally without effort.",
        "I am love."
      ]
    },
    {
      id: 'autoestima',
      name: 'Autoestima',
      affirmations: [
        "Me amo y me acepto exactamente como soy.",
        "Estoy orgulloso de la persona en la que me estoy convirtiendo.",
        "Soy suficiente tal como soy.",
        "Creo en mí y en mis capacidades.",
        "Soy digno de amor, respeto y bondad.",
        "Me perdono por los errores del pasado.",
        "Cada día soy más fuerte y más seguro de mí.",
        "Hablo conmigo con compasión.",
        "Confío en mi voz interior.",
        "Irradio confianza y calma.",
        "Estoy orgulloso de mis avances, por pequeños que sean.",
        "Merezco felicidad y paz.",
        "Dejo atrás la duda y elijo confiar en mí.",
        "Valoro mi autenticidad.",
        "Estoy tranquilo, confiado y centrado.",
        "Celebro mis fortalezas y abrazo mis imperfecciones.",
        "Es seguro ser completamente yo mismo.",
        "Soy suficiente en este momento.",
        "Elijo amarme incondicionalmente.",
        "Soy digno de las cosas buenas de la vida.",
        "Camino con confianza y propósito.",
        "Soy amable conmigo en cada pensamiento.",
        "Suelto la comparación y elijo la aceptación.",
        "Confío en el proceso de mi crecimiento.",
        "Estoy orgulloso de mi historia.",
        "Soy hermoso por dentro y por fuera.",
        "Aprendo a verme con amor.",
        "Libero la necesidad de ser perfecto.",
        "Tengo confianza en mi camino.",
        "Estoy agradecido por quien soy.",
        "Brillo naturalmente sin esfuerzo.",
        "Soy amor."
      ]
    },
    {
      id: 'health-healing',
      name: 'Health & Healing',
      affirmations: [
        "I am grateful for my body's ability to heal.",
        "Every cell in my body vibrates with health and energy.",
        "I am restoring balance in my mind and body.",
        "I trust my body's natural intelligence.",
        "Healing is happening inside me now.",
        "I am calm and supported in my healing journey.",
        "I release tension and allow my body to relax.",
        "I am surrounded by light and renewal.",
        "I am grateful for the miracle of recovery.",
        "I am kind and patient with my body.",
        "My thoughts create harmony in my cells.",
        "I nourish myself with love and care.",
        "I am becoming stronger every day.",
        "I choose peace and my body responds with healing.",
        "I am free from illness and fear.",
        "I breathe in life, energy, and vitality.",
        "I am aligned with perfect health.",
        "I release resistance to healing.",
        "My body knows how to restore itself.",
        "I am worthy of perfect health.",
        "I forgive my body for any past neglect.",
        "I am surrounded by healing energy.",
        "My immune system is strong and intelligent.",
        "I am in harmony with life.",
        "I am light, peace, and renewal.",
        "I choose to heal deeply and completely.",
        "I am safe, whole, and free.",
        "Each breath restores me.",
        "I am grateful for my heart and my life.",
        "I am healed and whole.",
        "I am vibrant and alive."
      ]
    },
    {
      id: 'salud-sanacion',
      name: 'Salud y Sanación',
      affirmations: [
        "Estoy agradecido por la capacidad natural de mi cuerpo para sanar.",
        "Cada célula de mi cuerpo vibra con salud y energía.",
        "Estoy restaurando el equilibrio entre mente y cuerpo.",
        "Confío en la inteligencia natural de mi organismo.",
        "La sanación está ocurriendo dentro de mí ahora.",
        "Estoy tranquilo y acompañado en mi proceso de sanación.",
        "Libero toda tensión y permito que mi cuerpo se relaje.",
        "Estoy rodeado de luz, fuerza y renovación.",
        "Agradezco el milagro de mi recuperación.",
        "Soy amable y paciente con mi cuerpo.",
        "Mis pensamientos crean armonía en mis células.",
        "Me nutro con amor y cuidado.",
        "Cada día soy más fuerte y más saludable.",
        "Elijo la paz y mi cuerpo responde sanando.",
        "Estoy libre de enfermedad y miedo.",
        "Inhalo vida, energía y vitalidad.",
        "Estoy alineado con la salud perfecta.",
        "Libero toda resistencia a la sanación.",
        "Mi cuerpo sabe cómo restaurarse.",
        "Soy digno de perfecta salud.",
        "Perdono a mi cuerpo por cualquier descuido.",
        "Estoy rodeado de energía sanadora.",
        "Mi sistema inmunológico es fuerte e inteligente.",
        "Estoy en armonía con la vida.",
        "Soy luz, paz y renovación.",
        "Elijo sanar profunda y completamente.",
        "Estoy seguro, completo y libre.",
        "Cada respiración me restaura.",
        "Agradezco a mi corazón y a mi vida.",
        "Estoy sano y completo.",
        "Estoy vibrante y lleno de vida."
      ]
    },
    {
      id: 'faith-trust',
      name: 'Faith & Trust',
      affirmations: [
        "I trust that everything is working for my highest good.",
        "I believe in the path I am walking.",
        "I am calm and confident about my future.",
        "Everything unfolds at the right time.",
        "I have unshakable faith in my purpose.",
        "I trust the process even when I can't see the outcome.",
        "I am guided by inner wisdom.",
        "I believe in what I am building.",
        "Life supports me in every step I take.",
        "I let go of doubt and choose trust.",
        "What I desire is already on its way.",
        "I am patient and peaceful in the waiting.",
        "I trust myself to make the right decisions.",
        "I am aligned with what is meant for me.",
        "I believe in unseen progress.",
        "Everything is unfolding perfectly.",
        "I release fear and welcome certainty.",
        "I trust the timing of my life.",
        "I am grounded in faith and strength.",
        "I know that I am capable and prepared.",
        "I am open to unexpected blessings.",
        "I feel peace knowing all is working for me.",
        "I move forward with quiet confidence.",
        "I am supported by invisible forces of good.",
        "I believe deeply in my ability to succeed.",
        "I am guided to the right people and opportunities.",
        "I am relaxed and positive about what's coming.",
        "I am calm, focused, and faithful.",
        "I know that things are falling into place perfectly.",
        "I let go and allow life to flow.",
        "I trust that my efforts are multiplying.",
        "I believe in the power of my intention.",
        "Everything I do leads me to my best outcome."
      ]
    },
    {
      id: 'fe-confianza',
      name: 'Fe y Confianza',
      affirmations: [
        "Confío en que todo está funcionando para mi mayor bien.",
        "Creo en el camino que estoy recorriendo.",
        "Estoy tranquilo y confiado respecto a mi futuro.",
        "Todo se desarrolla en el momento perfecto.",
        "Tengo una fe inquebrantable en mi propósito.",
        "Confío en el proceso aunque no vea el resultado.",
        "Me guía mi sabiduría interior.",
        "Creo en lo que estoy construyendo.",
        "La vida me apoya en cada paso que doy.",
        "Suelto la duda y elijo confiar.",
        "Lo que deseo ya viene en camino.",
        "Soy paciente y estoy en paz mientras espero.",
        "Confío en mi capacidad para decidir correctamente.",
        "Estoy alineado con lo que está destinado para mí.",
        "Creo en el progreso que aún no puedo ver.",
        "Todo se está desarrollando perfectamente.",
        "Libero el miedo y doy la bienvenida a la certeza.",
        "Confío en el tiempo perfecto de mi vida.",
        "Estoy arraigado en la fe y la fortaleza.",
        "Sé que soy capaz y estoy preparado.",
        "Estoy abierto a bendiciones inesperadas.",
        "Siento paz al saber que todo trabaja a mi favor.",
        "Avanzo con una confianza tranquila.",
        "Estoy sostenido por fuerzas invisibles de bien.",
        "Creo profundamente en mi capacidad para triunfar.",
        "Soy guiado hacia las personas y oportunidades correctas.",
        "Estoy relajado y positivo respecto al futuro.",
        "Estoy calmado, enfocado y lleno de fe.",
        "Sé que las cosas están encajando perfectamente.",
        "Suelto el control y dejo que la vida fluya.",
        "Confío en que mis esfuerzos se multiplican.",
        "Creo en el poder de mi intención.",
        "Todo lo que hago me acerca a mi mejor resultado."
      ]
    },
    {
      id: 'happiness-joy',
      name: 'Happiness & Joy',
      affirmations: [
        "I choose happiness right now.",
        "Joy flows naturally through my life.",
        "I am grateful for the beauty in this moment.",
        "I attract experiences that make me smile.",
        "I see reasons to be happy everywhere.",
        "My heart is open to joy and laughter.",
        "I deserve to feel good every day.",
        "I am surrounded by positivity and light.",
        "I release stress and welcome peace.",
        "I allow myself to feel joy fully.",
        "I am present, alive, and content.",
        "I radiate happiness and inspire others.",
        "I am grateful for the small blessings in my life.",
        "I focus on what uplifts me.",
        "I am a magnet for joy.",
        "Happiness grows inside me.",
        "I trust life to support my joy.",
        "I find peace in simple things.",
        "I am free to enjoy my life.",
        "I create joy through gratitude and presence.",
        "I am thankful for today.",
        "I deserve laughter and love.",
        "I choose joy over fear.",
        "Every day is a new opportunity for happiness.",
        "I release negativity and embrace optimism.",
        "I am filled with calm and lightness.",
        "I attract positive and joyful people.",
        "I celebrate life and all its colors.",
        "I smile easily and often.",
        "I am grateful to be alive.",
        "I find happiness in my journey.",
        "Joy is my natural state.",
        "I am happiness in motion."
      ]
    },
    {
      id: 'felicidad-alegria',
      name: 'Felicidad y Alegría',
      affirmations: [
        "Elijo la felicidad ahora.",
        "La alegría fluye naturalmente en mi vida.",
        "Estoy agradecido por la belleza de este momento.",
        "Atraigo experiencias que me hacen sonreír.",
        "Veo razones para ser feliz en todas partes.",
        "Mi corazón está abierto a la alegría y la risa.",
        "Merezco sentirme bien cada día.",
        "Estoy rodeado de positividad y luz.",
        "Libero el estrés y doy la bienvenida a la paz.",
        "Me permito sentir la alegría completamente.",
        "Estoy presente, vivo y satisfecho.",
        "Irradio felicidad e inspiro a los demás.",
        "Agradezco las pequeñas bendiciones de mi vida.",
        "Me enfoco en lo que me eleva.",
        "Soy un imán para la alegría.",
        "La felicidad crece dentro de mí.",
        "Confío en que la vida apoya mi alegría.",
        "Encuentro paz en las cosas simples.",
        "Soy libre para disfrutar mi vida.",
        "Creo alegría a través de la gratitud y la presencia.",
        "Agradezco este día.",
        "Merezco risa y amor.",
        "Elijo la alegría por encima del miedo.",
        "Cada día es una nueva oportunidad para ser feliz.",
        "Suelto la negatividad y abrazo el optimismo.",
        "Estoy lleno de calma y ligereza.",
        "Atraigo personas positivas y alegres.",
        "Celebro la vida y todos sus colores.",
        "Sonrío con facilidad y frecuencia.",
        "Agradezco el regalo de estar vivo.",
        "Encuentro felicidad en mi camino.",
        "La alegría es mi estado natural.",
        "Soy felicidad en movimiento."
      ]
    },
    {
      id: 'abundance-prosperity',
      name: 'Abundance & Prosperity',
      affirmations: [
        "I am open to receive infinite abundance.",
        "Money flows to me effortlessly and constantly.",
        "I am worthy of wealth and success.",
        "I attract opportunities that lead to prosperity.",
        "I am a magnet for positive energy and money.",
        "I release all resistance to receiving abundance.",
        "I allow wealth to enter every area of my life.",
        "I live in a state of gratitude and flow.",
        "Abundance is my natural state.",
        "I think rich thoughts and attract rich results.",
        "I am surrounded by opportunities to grow and prosper.",
        "Every day I attract more success and joy.",
        "I am grateful for the money I have and the money on its way.",
        "I trust the universe to provide all that I need.",
        "I take inspired action toward my goals.",
        "I am aligned with the frequency of wealth.",
        "Prosperity flows easily through me.",
        "I am open to new streams of income.",
        "My thoughts create my financial reality.",
        "I see abundance everywhere I look.",
        "I am calm, confident, and financially free.",
        "I deserve luxury, joy, and peace.",
        "Money supports my purpose and expansion.",
        "I bless and multiply all that I give and receive.",
        "I am guided toward smart financial decisions.",
        "I release fear and embrace trust.",
        "My energy attracts success naturally.",
        "I am thankful for the abundance already within me.",
        "I am prosperous in mind, body, and spirit.",
        "The more I give, the more I receive.",
        "I trust the process of life to bring me prosperity.",
        "Wealth and joy are my birthright.",
        "I am abundant now."
      ]
    },
    {
      id: 'abundancia-prosperidad',
      name: 'Abundancia y Prosperidad',
      affirmations: [
        "Estoy abierto a recibir abundancia infinita.",
        "El dinero fluye hacia mí sin esfuerzo y de manera constante.",
        "Soy digno de riqueza y éxito.",
        "Atraigo oportunidades que me llevan a la prosperidad.",
        "Soy un imán para la energía positiva y el dinero.",
        "Libero toda resistencia a recibir abundancia.",
        "Permito que la riqueza entre en todas las áreas de mi vida.",
        "Vivo en un estado de gratitud y fluidez.",
        "La abundancia es mi estado natural.",
        "Pienso en grande y atraigo grandes resultados.",
        "Estoy rodeado de oportunidades para crecer y prosperar.",
        "Cada día atraigo más éxito y alegría.",
        "Estoy agradecido por el dinero que tengo y el que viene en camino.",
        "Confío en que el universo me provee todo lo que necesito.",
        "Tomo acción inspirada hacia mis metas.",
        "Estoy alineado con la frecuencia de la riqueza.",
        "La prosperidad fluye fácilmente a través de mí.",
        "Estoy abierto a nuevas fuentes de ingreso.",
        "Mis pensamientos crean mi realidad financiera.",
        "Veo abundancia en todas partes.",
        "Estoy tranquilo, confiado y libre financieramente.",
        "Merezco lujo, alegría y paz.",
        "El dinero apoya mi propósito y mi expansión.",
        "Bendigo y multiplico todo lo que doy y recibo.",
        "Soy guiado hacia decisiones financieras inteligentes.",
        "Libero el miedo y abrazo la confianza.",
        "Mi energía atrae el éxito naturalmente.",
        "Agradezco la abundancia que ya está en mí.",
        "Soy próspero en mente, cuerpo y espíritu.",
        "Cuanto más doy, más recibo.",
        "Confío en el proceso de la vida para traerme prosperidad.",
        "La riqueza y la alegría son mi derecho natural.",
        "Soy abundante ahora."
      ]
    },
    {
      id: 'love-relationships',
      name: 'Love & Relationships',
      affirmations: [
        "I am open to giving and receiving love freely.",
        "I attract relationships that are kind, honest, and nurturing.",
        "I am worthy of love, respect, and commitment.",
        "I release past pain and allow new love to enter.",
        "I am grateful for the love that already surrounds me.",
        "I communicate with honesty and compassion.",
        "I deserve deep and meaningful connections.",
        "I choose partners who support my growth and peace.",
        "I trust love to find me in divine timing.",
        "I am open to being loved for who I truly am.",
        "I am healing old patterns of attachment and fear.",
        "I radiate love and attract it effortlessly.",
        "I forgive and release all that blocks my heart.",
        "I am whole on my own and share my wholeness with others.",
        "I am calm, confident, and open in love.",
        "My relationships are built on trust and respect.",
        "I attract people who value and appreciate me.",
        "I give love freely and receive it with gratitude.",
        "I am learning to love without fear or control.",
        "I am worthy of a healthy, joyful partnership.",
        "I choose love even when it feels vulnerable.",
        "I express affection and kindness easily.",
        "I allow love to flow naturally into my life.",
        "I am grateful for those who love and care for me.",
        "I bring peace, warmth, and joy to my relationships.",
        "I attract harmony into every connection.",
        "I am patient and trusting in matters of the heart.",
        "I am surrounded by loving energy.",
        "I let go of the need to be perfect to be loved.",
        "I am love, and love flows through me endlessly.",
        "I am open to divine love in all forms.",
        "Every relationship teaches me more about love.",
        "I am ready for true, balanced, and lasting love."
      ]
    },
    {
      id: 'amor-relaciones',
      name: 'Amor y Relaciones',
      affirmations: [
        "Estoy abierto a dar y recibir amor libremente.",
        "Atraigo relaciones amables, honestas y nutritivas.",
        "Soy digno de amor, respeto y compromiso.",
        "Libero el dolor del pasado y permito que el amor entre.",
        "Agradezco el amor que ya me rodea.",
        "Me comunico con honestidad y compasión.",
        "Merezco conexiones profundas y significativas.",
        "Elijo personas que apoyan mi crecimiento y mi paz.",
        "Confío en que el amor me encuentra en el momento perfecto.",
        "Estoy abierto a ser amado tal como soy.",
        "Estoy sanando viejos patrones de apego y miedo.",
        "Irradio amor y lo atraigo sin esfuerzo.",
        "Perdono y libero todo lo que bloquea mi corazón.",
        "Soy completo por mí mismo y comparto mi plenitud con los demás.",
        "Estoy tranquilo, confiado y abierto al amor.",
        "Mis relaciones se basan en confianza y respeto.",
        "Atraigo personas que me valoran y aprecian.",
        "Doy amor libremente y lo recibo con gratitud.",
        "Aprendo a amar sin miedo ni control.",
        "Soy digno de una relación sana y alegre.",
        "Elijo el amor incluso cuando me siento vulnerable.",
        "Expreso afecto y bondad con facilidad.",
        "Permito que el amor fluya naturalmente en mi vida.",
        "Agradezco a quienes me aman y me cuidan.",
        "Llevo paz, calidez y alegría a mis relaciones.",
        "Atraigo armonía a cada conexión.",
        "Soy paciente y confío en los asuntos del corazón.",
        "Estoy rodeado de energía amorosa.",
        "Suelto la necesidad de ser perfecto para ser amado.",
        "Soy amor, y el amor fluye a través de mí sin fin.",
        "Estoy abierto al amor divino en todas sus formas.",
        "Cada relación me enseña más sobre el amor.",
        "Estoy listo para un amor verdadero, equilibrado y duradero."
      ]
    }
  ],
  activeListId: 'default',
  flashSpeed: 2000, // Cada cuánto aparece un flash (ms)
  flashDuration: 80, // Duración del flash (ms)
  language: 'es', // Idioma por defecto
  binauralSound: {
    enabled: false, // Estado del sonido binaural
    frequency: 10, // Frecuencia en Hz (rango: 7-1000)
    volume: 50, // Volumen (0-100)
    frequencyPresets: [], // Array de frecuencias favoritas guardadas
    activeProgramId: null
  }
};

let config = { ...defaultConfig };

// Rutas de archivos
const getUserDataPath = () => {
  return app.getPath('userData');
};

const getConfigPath = () => {
  return path.join(getUserDataPath(), 'config.json');
};

// Cargar configuración desde archivo
const loadConfig = async () => {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf8');
    const loadedConfig = JSON.parse(data);
    
    // MIGRACIÓN: Si la config antigua tiene 'affirmations', migrarla a 'lists'
    if (loadedConfig.affirmations && !loadedConfig.lists) {
      console.log('Migrando configuración antigua a nueva estructura de listas...');
      loadedConfig.lists = [
        {
          id: 'default',
          name: 'Default',
          affirmations: Array.isArray(loadedConfig.affirmations) ? loadedConfig.affirmations : []
        }
      ];
      loadedConfig.activeListId = 'default';
    }
    
    // Validar y combinar con configuración por defecto
    // FUSIONAR listas: Combinar listas guardadas (personales) con listas globales del default
    const savedLists = Array.isArray(loadedConfig.lists) ? loadedConfig.lists : [];
    const defaultGlobalLists = defaultConfig.lists || [];
    
    // Obtener IDs de listas guardadas para no duplicar
    const savedListIds = new Set(savedLists.map(l => l.id));
    
    // Agregar listas globales que no están en las guardadas (evitar duplicados)
    const globalListsToAdd = defaultGlobalLists.filter(list => !savedListIds.has(list.id));
    
    // Fusionar: primero las guardadas (personales), luego las globales nuevas
    const mergedLists = [...savedLists, ...globalListsToAdd];
    
    config = {
      lists: mergedLists.length > 0 ? mergedLists : defaultConfig.lists,
      activeListId: loadedConfig.activeListId || defaultConfig.activeListId,
      flashSpeed: typeof loadedConfig.flashSpeed === 'number' ? loadedConfig.flashSpeed : defaultConfig.flashSpeed,
      flashDuration: typeof loadedConfig.flashDuration === 'number' ? loadedConfig.flashDuration : defaultConfig.flashDuration,
      language: loadedConfig.language || defaultConfig.language,
      binauralSound: loadedConfig.binauralSound && typeof loadedConfig.binauralSound === 'object'
        ? {
            enabled: typeof loadedConfig.binauralSound.enabled === 'boolean' ? loadedConfig.binauralSound.enabled : defaultConfig.binauralSound.enabled,
            frequency: typeof loadedConfig.binauralSound.frequency === 'number' ? loadedConfig.binauralSound.frequency : defaultConfig.binauralSound.frequency,
            volume: typeof loadedConfig.binauralSound.volume === 'number' ? loadedConfig.binauralSound.volume : defaultConfig.binauralSound.volume,
            frequencyPresets: Array.isArray(loadedConfig.binauralSound.frequencyPresets) ? loadedConfig.binauralSound.frequencyPresets : [],
            activeProgramId:
              typeof loadedConfig.binauralSound.activeProgramId === 'string'
                ? loadedConfig.binauralSound.activeProgramId
                : null
          }
        : defaultConfig.binauralSound
    };
    
    // Asegurar que la lista activa existe
    const activeListExists = config.lists.some(l => l.id === config.activeListId);
    if (!activeListExists) {
      config.activeListId = config.lists[0].id;
    }
    
    // Asegurar máximo de 50 afirmaciones en cada lista
    config.lists.forEach(list => {
      if (list.affirmations.length > 50) {
        list.affirmations = list.affirmations.slice(0, 50);
      }
    });
    
    // Validar frecuencia binaural (rango: 7-1000 Hz)
    if (config.binauralSound.frequency < 7) {
      config.binauralSound.frequency = 7;
    } else if (config.binauralSound.frequency > 1000) {
      config.binauralSound.frequency = 1000;
    }
    
    // Validar volumen binaural (rango: 0-100)
    if (config.binauralSound.volume < 0) {
      config.binauralSound.volume = 0;
    } else if (config.binauralSound.volume > 100) {
      config.binauralSound.volume = 100;
    }
    
    // Cargar traducciones según el idioma configurado
    await loadTranslations(config.language);
    setLanguage(config.language);
    
    console.log('Configuración cargada desde:', configPath);
    return config;
  } catch (error) {
    console.log('No se encontró configuración guardada, usando valores por defecto');
    // Cargar traducciones por defecto (español)
    await loadTranslations('es');
    return config;
  }
};

// Guardar configuración en archivo
const saveConfig = () => {
  // Guardar en background sin esperar
  const configPath = getConfigPath();
  const userDataPath = getUserDataPath();
  
  fs.mkdir(userDataPath, { recursive: true })
    .then(() => {
      return fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    })
    .then(() => {
      console.log('Configuración guardada en:', configPath);
    })
    .catch((error) => {
      console.error('Error al guardar configuración:', error);
    });
  
  return true;
};

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Reset to Millionaire',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../control.html'));

  binauralSessionService.attachWindow(mainWindow);
  
  // Cerrar la app completamente cuando se cierra la ventana
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      // Forzar cierre de ambas ventanas
      app.isQuiting = true;
      if (overlayWindow) overlayWindow.close();
      mainWindow.close();
      app.quit();
    }
  });
};

const createOverlayWindow = () => {
  overlayWindow = new BrowserWindow({
    width: 800,
    height: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    focusable: false,
    hasShadow: false,
    enableLargerThanScreen: false,
    fullscreenable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false
    }
  });
  
  // CRUCIAL: Ignorar eventos de mouse para que el overlay no interfiera con clicks
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  overlayWindow.loadFile(path.join(__dirname, '../overlay.html'));

  // Posicionar en el CENTRO EXACTO de la pantalla
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  overlayWindow.setPosition(
    Math.round((width - 800) / 2),
    Math.round((height - 100) / 2)
  );

  // Mostrar la ventana
  overlayWindow.show();

  overlayWindow.on('hide', () => {
    stopSessionIfOverlayHidden('overlay-hidden');
  });

  overlayWindow.on('minimize', () => {
    stopSessionIfOverlayHidden('overlay-hidden');
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
    stopSessionIfOverlayHidden('overlay-closed');
  });
};

// IPC para comunicación entre ventanas
ipcMain.handle('get-config', () => config);

ipcMain.handle('get-lists', () => {
  return config.lists;
});

ipcMain.handle('set-active-list', (event, listId) => {
  try {
    const list = config.lists.find(l => l.id === listId);
    if (list) {
      config.activeListId = listId;
      saveConfig();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error en set-active-list:', error);
    return false;
  }
});

ipcMain.handle('create-list', (event, name) => {
  try {
    const newList = {
      id: `list-${Date.now()}`,
      name: name,
      affirmations: []
    };
    config.lists.push(newList);
    saveConfig();
    return newList;
  } catch (error) {
    console.error('Error en create-list:', error);
    return null;
  }
});

ipcMain.handle('delete-list', (event, listId) => {
  try {
    // No permitir borrar la lista default
    if (listId === 'default') {
      console.error('No se puede borrar la lista default');
      return false;
    }
    
    // Si era la activa, cambiar a default
    if (config.activeListId === listId) {
      config.activeListId = 'default';
    }
    
    config.lists = config.lists.filter(l => l.id !== listId);
    saveConfig();
    return true;
  } catch (error) {
    console.error('Error en delete-list:', error);
    return false;
  }
});

ipcMain.handle('update-config', (event, newConfig) => {
  try {
    config = { ...config, ...newConfig };
    // console.log('Config actualizada:', config); // Deshabilitado para evitar EPIPE
    saveConfig(); // Guardar automáticamente en background
    return config;
  } catch (error) {
    console.error('Error en update-config:', error);
    return config;
  }
});

ipcMain.handle('add-affirmation', (event, text) => {
  try {
    const activeList = config.lists.find(l => l.id === config.activeListId);
    if (activeList && activeList.affirmations.length < 50) {
      activeList.affirmations.push(text);
      saveConfig(); // Guardar automáticamente en background
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error en add-affirmation:', error);
    return false;
  }
});

ipcMain.handle('remove-affirmation', (event, index) => {
  try {
    const activeList = config.lists.find(l => l.id === config.activeListId);
    if (activeList && index >= 0 && index < activeList.affirmations.length) {
      activeList.affirmations.splice(index, 1);
      saveConfig(); // Guardar automáticamente en background
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error en remove-affirmation:', error);
    return false;
  }
});

// IPC handlers para traducciones
ipcMain.handle('get-translations', async (event, lang) => {
  try {
    // Retornar traducciones actuales sin cambiar idioma
    const fs = require('fs').promises;
    const path = require('path');
    const currentLang = lang || config.language || 'es';
    const filePath = path.join(__dirname, 'locales', `${currentLang}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting translations:', error);
    // Fallback to empty object
    return {};
  }
});

ipcMain.handle('set-language', async (event, lang) => {
  try {
    await loadTranslations(lang);
    setLanguage(lang);
    config.language = lang;
    saveConfig();
    return true;
  } catch (error) {
    console.error('Error setting language:', error);
    return false;
  }
});

ipcMain.handle('get-language', () => {
  return config.language || 'es';
});

// Variable para controlar el cierre
app.isQuiting = false;

app.whenReady().then(async () => {
  // Precargar programas binaurales cuando la app esté lista
  await loadBinauralPrograms();
  // Cargar configuración guardada antes de crear ventanas
  await loadConfig();
  
  createMainWindow();
  createOverlayWindow();
  
  // Iniciar el flashing después de que las ventanas estén listas
  setTimeout(() => {
    startFlashing();
  }, 1000);
});

// NO cerrar la app cuando se cierran las ventanas
app.on('window-all-closed', () => {
  // No hacer nada - mantener la app corriendo
});

// Solo cerrar cuando se fuerza el cierre
app.on('before-quit', () => {
  app.isQuiting = true;
});

// FLASH SUBLIMINAL - Usa la configuración dinámica
let flashTimeout;

const showNextFlash = () => {
  const activeList = config.lists.find(l => l.id === config.activeListId);
  if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible() && activeList && activeList.affirmations.length > 0) {
    const randomText = activeList.affirmations[Math.floor(Math.random() * activeList.affirmations.length)];
    
    // FLASH: Usar la función del overlay
    overlayWindow.webContents.executeJavaScript(`
      if (window.showFlash) {
        window.showFlash('${randomText.replace(/'/g, "\\'")}', ${config.flashDuration});
      }
    `).catch((error) => {
      console.error('Error en flash:', error);
    });
  }
  
  // Programar el siguiente flash
  flashTimeout = setTimeout(() => {
    showNextFlash();
  }, config.flashSpeed);
};

const startFlashing = () => {
  // Limpiar timeout anterior si existe
  if (flashTimeout) {
    clearTimeout(flashTimeout);
    flashTimeout = null;
  }
  
  // Iniciar el primer flash inmediatamente
  showNextFlash();
};

// Escuchar cambios en la configuración
ipcMain.handle('restart-flashing', () => {
  // console.log('Reiniciando flashing...'); // Deshabilitado para evitar EPIPE
  startFlashing();
});

// Manejar minimizar/mostrar ventana
ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

ipcMain.handle('show-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

// Handlers IPC para el sonido binaural (control desde el renderer)
ipcMain.handle('start-binaural-session', (event, payload = {}) => {
  try {
    const requestProgram = payload.program;
    if (!requestProgram || typeof requestProgram !== 'object') {
      throw new Error('No se proporcionó un programa binaural válido.');
    }

    const sessionState = binauralSessionService.startSession({
      program: requestProgram,
      volume: typeof payload.volume === 'number' ? payload.volume : config.binauralSound.volume
    });

    config.binauralSound.enabled = true;
    config.binauralSound.activeProgramId = sessionState.programId;
    if (typeof payload.initialFrequency === 'number') {
      config.binauralSound.frequency = payload.initialFrequency;
    }
    saveConfig();

    return { success: true, state: sessionState };
  } catch (error) {
    console.error('Error al iniciar sesión binaural:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-binaural-session', (event, options = {}) => {
  try {
    const reason = options && typeof options.reason === 'string' ? options.reason : 'manual';
    const state = binauralSessionService.stopSession(reason);
    config.binauralSound.enabled = false;
    config.binauralSound.activeProgramId = null;
    saveConfig();

    return { success: true, state };
  } catch (error) {
    console.error('Error al detener sesión binaural:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-binaural-session-state', () => {
  try {
    return { success: true, state: binauralSessionService.getState() };
  } catch (error) {
    console.error('Error al obtener estado de sesión binaural:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('set-binaural-frequency', (event, frequency) => {
  try {
    // Validar frecuencia
    if (frequency < 7) frequency = 7;
    if (frequency > 1000) frequency = 1000;

    config.binauralSound.frequency = frequency;
    saveConfig();
    
    // Enviar comando al renderer para actualizar frecuencia
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-binaural-frequency', frequency);
    }
    
    return true;
  } catch (error) {
    console.error('Error al actualizar frecuencia:', error);
    return false;
  }
});

ipcMain.handle('set-binaural-volume', (event, volume) => {
  try {
    // Validar volumen
    if (volume < 0) volume = 0;
    if (volume > 100) volume = 100;

    config.binauralSound.volume = volume;
    saveConfig();

    // Enviar comando al renderer para actualizar volumen
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-binaural-volume', volume);
    }

    return true;
  } catch (error) {
    console.error('Error al actualizar volumen:', error);
    return false;
  }
});

ipcMain.on('binaural-session:phase-progress', (event, payload) => {
  try {
    binauralSessionService.handlePhaseProgress(payload || {});
  } catch (error) {
    console.error('Error al actualizar fase binaural:', error);
  }
});

ipcMain.on('binaural-session:ended', (event, payload) => {
  try {
    binauralSessionService.handleSessionComplete(payload || {});
    config.binauralSound.enabled = false;
    config.binauralSound.activeProgramId = null;
    saveConfig();
  } catch (error) {
    console.error('Error al finalizar sesión binaural:', error);
  }
});

// IPC handler para obtener ruta de archivos de audio
ipcMain.handle('get-audio-path', (event, filename) => {
  try {
    // En producción, usar app.getAppPath() para obtener ruta de la app empaquetada
    // En desarrollo, usar __dirname
    const appPath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
    const audioPath = path.join(appPath, 'assets', 'audio', filename);
    return audioPath;
  } catch (error) {
    console.error('Error al obtener ruta de audio:', error);
    return null;
  }
});

// IPC handler para obtener programas binaurales
ipcMain.handle('get-binaural-programs', async () => {
  try {
    const programs = await loadBinauralPrograms();
    if (Array.isArray(programs) && programs.length > 0) {
      console.log(`Programas binaurales retornados desde IPC: ${programs.length}`);
      return programs;
    }
    console.warn('No se encontraron programas binaurales para retornar');
    return [];
  } catch (error) {
    console.error('Error al obtener programas binaurales desde IPC:', error);
    return [];
  }
});

// IPC handler para obtener lista de archivos MP3 en la carpeta de audio
ipcMain.handle('get-audio-files', async () => {
  try {
    const appPath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '..');
    const audioDir = path.join(appPath, 'assets', 'audio');
    
    const files = await fs.readdir(audioDir);
    const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));
    
    return mp3Files;
  } catch (error) {
    console.error('Error al leer archivos de audio:', error);
    return [];
  }
});