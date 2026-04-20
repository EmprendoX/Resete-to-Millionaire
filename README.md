# SubliminalX (anteriormente MindFlash)

Aplicación de escritorio de afirmaciones subliminales que muestra mensajes positivos en un overlay transparente sobre tus aplicaciones mientras trabajas.

## Características

- ✅ **Overlay transparente** - Los flashes aparecen de forma subliminal sin interferir con tu trabajo
- ✅ **Totalmente personalizable** - Crea tus propias afirmaciones, ajusta velocidad y duración
- ✅ **Click-through** - 100% transparente, no bloquea clicks ni interacciones
- ✅ **Persistencia automática** - Tus configuraciones se guardan automáticamente
- ✅ **Ligero y rápido** - Consume menos del 1% de recursos
- ✅ **Validaciones** - Protección contra datos inválidos
- ✅ **Diseño profesional** - Interfaz moderna con degradados y animaciones

## Instalación y Uso

### Desarrollo

```bash
npm install
npm run dev
```

### Build para producción

```bash
npm run build
```

### Reproducción de programas binaurales

- Cada programa binaural incluido dura exactamente **22 minutos** y está compuesto por tres fases con transiciones de frecuencia suavizadas automáticamente.
- Selecciona un programa desde el panel de control y presiona **Reproducir** para iniciar la sesión.
- Si cierras o pausas el overlay transparente, la reproducción binaural se detendrá de forma segura y liberará los recursos de audio.
- Puedes reanudar la sesión en cualquier momento volviendo a abrir el overlay y presionando **Reproducir** nuevamente.

### Recomendaciones para audífonos estéreo

- Usa audífonos o cascos estéreo para percibir correctamente el efecto binaural.
- Ajusta el volumen a un nivel moderado antes de iniciar la sesión y realiza los cambios desde el panel de control para evitar saltos bruscos.
- Evita utilizar altavoces monoaurales: la diferencia de frecuencia entre canales izquierdo y derecho es clave para el estímulo binaural.

## Estructura del Proyecto

```
├── electron/            # Proceso principal de Electron
│   └── main.js         # Lógica de ventanas, IPC, flashing
├── control.html        # Panel de control principal (desktop)
├── overlay.html        # Ventana overlay transparente (desktop)
├── src/                # Motor binaural (compartido desktop + mobile)
│   ├── binauralAudioEngine.js
│   └── binauralPrograms.js
├── assets/             # Logo + audios MP3 de afirmaciones
│   └── audio/
├── mobile/             # Versión mobile (PWA) — ver sección "Versión Mobile"
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── audio-manifest.json
│   ├── locales/
│   ├── icons/
│   └── build.mjs      # Empaqueta a docs/mobile/ para deploy
├── docs/               # Landing page + PWA deployada en /mobile/
│   ├── index.html
│   ├── assets/
│   └── mobile/        # Generado por `npm run mobile:build`
└── package.json        # Configuración y dependencias
```

## Configuración

La configuración se guarda automáticamente en:
- **macOS**: `~/Library/Application Support/Electron/config.json`
- **Windows**: `%APPDATA%/Electron/config.json`

### Límites
- Máximo 50 afirmaciones
- Velocidad entre flashes: 1-15 segundos
- Duración del flash: 5-500 milisegundos
- Longitud de afirmación: 3-200 caracteres

## Landing Page

La landing page está en `docs/` y puede desplegarse en GitHub Pages, Netlify o cualquier hosting estático.

Ver [docs/README.md](docs/README.md) para más información.

## Versión Mobile (PWA)

Carpeta [mobile/](mobile/) contiene una versión mobile profesional como **PWA instalable** en iPhone/Android. Mantiene los programas binaurales y los audios MP3 de afirmaciones, y **elimina por completo los flashes subliminales**.

### Características

- **3 tabs tipo app nativa**: Binaural · Audios · Ajustes.
- Reproduce los 10 programas binaurales de 22 min (reutiliza [src/binauralAudioEngine.js](src/binauralAudioEngine.js) y [src/binauralPrograms.js](src/binauralPrograms.js)).
- Reproductor de los 11 audios MP3 de [assets/audio/](assets/audio/) con scrubber, loop y velocidad 0.5×–2×.
- Mini-player persistente entre pestañas (el audio sigue sonando al navegar).
- Instalable como app (iOS: "Añadir a inicio" · Android: "Instalar app").
- **Offline**: service worker con cache de shell + audios.
- i18n runtime ES/EN, tema oscuro con acento dorado, safe-areas iOS, Wake Lock opcional para que no se apague la pantalla.

### Correr en local

```bash
npm run mobile:dev
# Abre: http://localhost:5173/mobile/
# Para probar en el móvil, conéctate a la IP LAN del equipo
# (por ejemplo http://192.168.1.42:5173/mobile/) o usa un túnel ngrok/cloudflared.
```

### Instalar en iPhone (iOS Safari)

1. Abre la URL de la PWA en Safari (debe servirse por HTTPS o `localhost`).
2. Toca el botón **Compartir** → **Añadir a pantalla de inicio**.
3. La app aparecerá con el icono de Reset to Millionaire y se abrirá en modo standalone.

### Instalar en Android (Chrome / Edge)

1. Abre la URL de la PWA.
2. Toca el menú ⋮ → **Instalar app** (o el banner "Añadir a pantalla de inicio").

### Deploy a Netlify / hosting estático

```bash
npm run mobile:build
# Genera docs/mobile/ autocontenido (copia src/, assets/ y reescribe rutas)
```

[netlify.toml](netlify.toml) ya está configurado para publicar `docs/` y servir la PWA en `/mobile/`.

### Qué cambia respecto al desktop

| Funcionalidad | Desktop (Electron) | Mobile (PWA) |
| --- | --- | --- |
| Overlay transparente con flashes | ✅ | ❌ (eliminado) |
| Editor de listas de afirmaciones | ✅ | ❌ (eliminado) |
| Programas binaurales | ✅ | ✅ |
| Audios MP3 de afirmaciones | ✅ | ✅ |
| Idioma ES / EN | ✅ | ✅ |
| Instalable en móvil | ❌ | ✅ |

## Tecnologías

- **Electron** - Framework de aplicaciones de escritorio
- **HTML/CSS/JavaScript** - Interfaz nativa
- **Node.js** - Sistema de archivos y persistencia

## Licencia

MIT
