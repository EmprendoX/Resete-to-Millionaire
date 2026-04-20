<!-- 065197f2-ce32-42af-96c2-b2fd69f27403 8f48b08e-f70c-4636-ab8d-da46c0158782 -->
# Implementación del Reproductor de Audio de Afirmaciones

## Objetivo

Agregar un reproductor de audio con lista de afirmaciones predefinidas en la ventana principal. Los audios vienen incluidos en la aplicación (~2 minutos cada uno). El usuario solo los reproduce con controles de velocidad y loop continuo, manteniendo la arquitectura existente intacta.

## Formato de Audio

**MP3** será el formato soportado por defecto (mejor compatibilidad multiplataforma, tamaño razonable, amplio soporte en navegadores/Electron).

## Cambios en la Arquitectura

### 1. Estructura de Almacenamiento de Audios

- **Ubicación de archivos**: `assets/audio/` (incluidos en el proyecto y empaquetados con la app)
- **Estructura de datos**: Similar a `DEFAULT_LISTS`, crear `DEFAULT_AUDIO_LISTS` con referencias a archivos predefinidos
- **IPC handlers**: Solo necesarios para obtener rutas de archivos empaquetados (usar `app.getAppPath()` o rutas relativas desde el proceso main)

### 2. Modificaciones en HTML (`index.html`)

- Agregar nueva sección `<section class="panel audio-panel">` después de `lists-panel`
- Incluir selector dropdown de audios predefinidos y controles de reproducción (sin formulario de subida)

### 3. Modificaciones en JavaScript (`src/app.js`)

- Nuevo módulo de audio independiente (no mezclar con lógica de texto)
- Definir `DEFAULT_AUDIO_LISTS` con lista de audios disponibles (similar a estructura de `DEFAULT_LISTS`)
- Funciones para: carga de lista, reproducción, control de velocidad, loop seamless
- Almacenamiento en localStorage solo para preferencias del usuario (audio activo, velocidad, estado de reproducción)

### 4. Modificaciones en CSS (`src/styles.css`)

- Estilos para `.audio-panel`, controles de audio, lista de items
- Mantener consistencia visual con diseño existente

### 5. Modificaciones en Electron (`electron/main.js`)

- **Nuevos IPC handlers** (mínimos):
  - `get-audio-path`: Obtener ruta absoluta del archivo empaquetado para reproducción
- Usar `path.join(__dirname, '../assets/audio/', filename)` para construir rutas
- Considerar usar `app.getAppPath()` en modo producción y `__dirname` en desarrollo

### 6. Estructura de Carpetas y Build

- Crear `assets/audio/` en raíz del proyecto
- Agregar archivos MP3 de audios predefinidos (estructura preparada)
- Asegurar que `electron-builder` incluya `assets/audio/**/*` en la configuración de build (`package.json`)

## Estructura de Datos

### En `src/app.js` (similar a DEFAULT_LISTS):

```javascript
const DEFAULT_AUDIO_LISTS = [
  {
    id: 'abundance-audio',
    name: 'Abundancia',
    filename: 'abundance.mp3',
    duration: 120 // segundos aproximados
  },
  {
    id: 'focus-audio',
    name: 'Enfoque',
    filename: 'focus.mp3',
    duration: 120
  },
  {
    id: 'health-audio',
    name: 'Salud',
    filename: 'health.mp3',
    duration: 120
  }
];
```

### En localStorage (solo preferencias):

```javascript
audioSettings: {
  activeAudioId: 'abundance-audio',
  playbackSpeed: 1.0,
  isPlaying: false
}
```

## Funcionalidades del Reproductor

### Lista de Audios

- Mostrar todos los audios predefinidos con nombre en dropdown selector (similar al selector de listas de texto)
- Sin opciones de subida o eliminación (solo lectura)
- Al seleccionar, cargar el audio correspondiente

### Controles de Reproducción

- **Play/Pause**: Reproducir/pausar audio seleccionado
- **Stop**: Detener y resetear posición a 0
- **Velocidad**: Slider/rango (0.5x - 2.0x, default 1.0)
- **Loop continuo**: Reproducción automática sin cortes perceptibles
- **Indicador de estado**: Mostrar si está reproduciendo y qué audio está activo

### Reproducción Seamless

- Usar evento `ended` del elemento `<audio>` para reiniciar sin delay
- Usar propiedad `playbackRate` del elemento audio para control de velocidad
- Mantener velocidad y estado entre loops
- Cargar audio al seleccionarlo del dropdown (usar elemento `<audio>` oculto o crear dinámicamente)

## Archivos a Modificar

1. **index.html**: Agregar sección de audio panel (sin formulario de subida) ✅ COMPLETADO
2. **src/app.js**: 

   - Actualizar `DEFAULT_AUDIO_LISTS` con estructura bilingüe (filename.es, filename.en)
   - Agregar función `getCurrentLanguage()` para obtener idioma desde Electron
   - Modificar `getAudioPath()` para seleccionar archivo según idioma
   - Actualizar `loadAudio()` para usar nueva estructura
   - Opcional: Escuchar cambios de idioma y recargar audio si está reproduciendo

3. **src/styles.css**: Agregar estilos para panel de audio ✅ COMPLETADO
4. **electron/main.js**: IPC handler `get-audio-path` ya implementado (recibe filename completo)
5. **package.json**: Verificado que `electron-builder` incluye `assets/audio/**/*` ✅
6. **assets/audio/**: Directorio creado, agregar archivos con formato `nombre_es.mp3` y `nombre_en.mp3`

## Consideraciones de Arquitectura

- **Aislamiento**: El módulo de audio será completamente independiente, sin tocar funciones existentes
- **Nombres únicos**: Usar prefijos `audio_` en funciones y variables para evitar conflictos
- **Almacenamiento**: Solo preferencias del usuario en localStorage, archivos físicos empaquetados con la app
- **Compatibilidad**: Usar HTML5 Audio API nativa del navegador (compatible con Electron)
- **Rutas**: Manejar diferencias entre desarrollo (rutas relativas) y producción (archivos empaquetados)

## Flujo de Usuario

1. Usuario ve lista de audios predefinidos en dropdown selector
2. Usuario selecciona un audio de la lista (ej: "Abundancia")
3. Sistema carga el archivo MP3 correspondiente desde `assets/audio/`
4. Usuario hace clic en Play → reproduce con velocidad configurada (default 1.0)
5. Al terminar el audio (~2 min), automáticamente reinicia sin cortes (loop continuo)
6. Usuario puede ajustar velocidad con slider mientras reproduce (0.5x - 2.0x)
7. Usuario puede hacer Pause para pausar temporalmente
8. Usuario puede hacer Stop para detener completamente y resetear posición
9. Las preferencias (audio activo, velocidad) se guardan automáticamente en localStorage