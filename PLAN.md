# Plan: "Recuerda" — App de Estimulación Cognitiva para Alzheimer

## Directorio de trabajo
```
/Users/martin.fernandez/Documents/repos_personal/recuerda
```
**Repositorio:** `git@github.com:mfernandezfunes/recuerda.git`

## Contexto
Construir una aplicación web tablet-first llamada "Recuerda" para entretener y estimular cognitivamente a adultos mayores con Alzheimer. La app provee actividades cognitivas diarias con interfaz ultra-simplificada para el paciente (letras grandes, botones táctiles grandes, refuerzo positivo siempre) y un panel de gestión completo para el cuidador/familiar.

---

## Stack Técnico
- **Plataforma:** Web app **mobile-first** (funciona en celular y tablet, se instala como PWA)
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** PostgreSQL + Prisma ORM
- **Estado global:** Zustand
- **Drag & Drop:** react-dnd (fallback touch para tablets)
- **Gráficos:** Recharts
- **Animaciones:** Framer Motion
- **PWA:** Vite PWA plugin (installable en iOS/Android, funciona offline básico)
- **Audio/TTS:** Web Speech API + Web Audio API
- **Storage:** Filesystem local (`/uploads`) con abstracción para migrar a S3
- **Auth:** JWT (rol caregiver) + PIN 4 dígitos (rol paciente)

---

## Estructura del Monorepo

```
recuerda/
├── docker-compose.yml       # PostgreSQL local
├── client/                  # React frontend
│   └── src/
│       ├── pages/patient/   # vistas del paciente
│       ├── pages/activities/ # 14 actividades
│       ├── pages/caregiver/ # panel del cuidador
│       ├── components/ui/   # BigButton, BigCard, StarReward, etc.
│       ├── hooks/           # useTTS, useActivityTimer, useMedicationAlarm
│       └── store/           # auth, session, settings, mood
└── server/
    └── src/
        ├── prisma/schema.prisma
        ├── routes/
        ├── controllers/
        ├── services/        # session, progress, activityContent, media
        └── middleware/
```

---

## Roles

| Rol | Acceso | Auth |
|-----|--------|------|
| **Paciente** | Solo actividades, agenda, medicación | PIN 4 dígitos visual |
| **Cuidador** | Panel completo: gestión, progreso, media | Email + password |

---

## 14 Actividades Cognitivas

| # | Actividad | Qué entrena |
|---|-----------|-------------|
| 1 | **Memoria Visual** (emparejar cartas) | Memoria a corto plazo |
| 2 | **¿Qué día es hoy?** | Orientación temporal |
| 3 | **¿Quién es?** (fotos familiares) | Memoria episódica |
| 4 | **Completa la canción** | Memoria implícita/emocional |
| 5 | **Ordena el cuento** | Memoria secuencial |
| 6 | **Encuentra el objeto** | Atención y lenguaje |
| 7 | **Rompecabezas simple** (6-9 piezas) | Coordinación visoespacial |
| 8 | **Colorear** (SVGs simples) | Motricidad fina, atención |
| 9 | **Sopa de letras** (5x5) | Atención, vocabulario |
| 10 | **Galería de recuerdos** | Reminiscencia |
| 11 | **Agenda del día** | Orientación, planificación |
| 12 | **Ejercicios de respiración** | Ansiedad, regulación emocional |
| 13 | **Series y patrones** | Razonamiento lógico |
| 14 | **Registro de estado de ánimo** | Monitoreo emocional |

---

## Features Adicionales
- **Recordatorios de medicación** con alarma visual+sonora
- **Modo noche** (tema oscuro cálido, jamás blanco puro)
- **TTS global** — botón altavoz lee instrucciones de cada actividad en voz alta
- **Sistema de logros** — estrellas y badges con animación de confetti
- **Dificultad configurable** por actividad (EASY / MEDIUM / HARD)
- **Panel de progreso** para el cuidador: gráficos semanales, historial de sesiones, alertas de inactividad

---

## Esquema de BD (tablas principales)

| Tabla | Descripción |
|-------|-------------|
| `caregivers` | Cuidadores con email/password |
| `patients` | Pacientes con PIN, vinculados a cuidador |
| `family_members` | Fotos + nombres de familiares (para actividad ¿Quién es?) |
| `media_files` | Fotos y audios subidos por el cuidador |
| `sessions` | Sesiones de uso del paciente |
| `activity_logs` | Log por actividad: tipo, dificultad, estrellas, score, duración |
| `activity_settings` | Config por paciente por actividad: enabled, difficulty |
| `agenda_items` | Eventos del día (recurrentes o por fecha) |
| `medications` | Medicamentos con horarios y color visual |
| `mood_entries` | Estado de ánimo al final de cada sesión |
| `achievements` | Catálogo de logros |
| `patient_achievements` | Logros desbloqueados por paciente |

---

## Rutas API Principales

```
POST   /api/auth/caregiver/login
POST   /api/auth/patient/pin

GET    /api/patients/:id/activity-settings
PUT    /api/patients/:id/activity-settings/:type
GET    /api/activities/:type/content?patientId=&difficulty=

POST   /api/sessions
POST   /api/sessions/:id/activity-log
PUT    /api/sessions/:id/end

GET    /api/patients/:id/progress
GET    /api/patients/:id/progress/weekly
GET    /api/patients/:id/alerts

POST   /api/media/upload
GET    /api/patients/:id/medications
GET    /api/patients/:id/agenda?date=
POST   /api/mood
```

---

## Fases de Implementación

### Fase 1 — Fundación y Auth (semanas 1-2)
- Monorepo + Docker + PostgreSQL
- Prisma schema + migraciones + seed
- Login cuidador (JWT) + login paciente (PIN visual)
- `PatientLayout` y `CaregiverLayout` base

### Fase 2 — Panel del Cuidador + Media (semanas 3-4)
- CRUD pacientes, familiares
- Upload de fotos/audio (Multer → `/uploads`)
- Configuración de actividades (on/off + dificultad)
- CRUD agenda y medicación

### Fase 3 — Actividades Core (semanas 5-7)
En orden de complejidad: ¿Quién es? → ¿Qué día es hoy? → Encuentra el objeto → Memoria Visual → Ordena el cuento → Series y Patrones

Cada actividad registra `ActivityLog` con estrellas calculadas y navega a `ActivityResult.tsx`.

### Fase 4 — Actividades Restantes (semanas 8-9)
Completa la canción → Rompecabezas → Colorear → Sopa de letras → Galería de recuerdos → Respiración

### Fase 5 — Sesiones, Progreso y Dashboard (semana 10)
- Flujo completo: inicio sesión → actividades → registro ánimo → cierre
- `progress.service.ts`: streak, score semanal, alertas
- `session.service.ts`: evaluación de logros al cerrar sesión
- Gráficos con Recharts en panel del cuidador

### Fase 6 — Features Avanzadas (semanas 11-12)
- Alarmas de medicación (`useMedicationAlarm` con setInterval)
- Modo noche (Tailwind dark mode + toggle)
- TTS global (`useTTS` + `TTSButton` en PatientLayout)
- Confetti y visualización de logros

---

## Diseño Visual del Paciente

### Identidad visual
- **Paleta:** tonos cálidos y suaves — crema (`#FFF8F0`), verde salvia (`#8FBC8F`), azul cielo claro (`#87CEEB`), durazno (`#FFCBA4`), amarillo mantequilla (`#FFF3A3`). Sin colores fríos agresivos.
- **Fuente:** Nunito o Poppins — redondeada, amigable, muy legible. Mínimo 24px en texto normal, 32px en instrucciones.
- **Iconografía:** ilustraciones flat con bordes redondeados, estilo cálido y familiar (no tecno, no minimalista frío).

### Pantalla de inicio del paciente
- Fondo degradado suave (crema → durazno claro)
- Foto del paciente y su nombre en grande: **"Hola, María"**
- Hora y día visible siempre en la parte superior
- Grilla de 2 o 3 actividades del día con **tarjetas grandes y coloridas**, cada una con un ícono ilustrado y nombre grande
- Estrellas ganadas previamente en cada actividad (visualmente motivador)

### Durante una actividad
- Instrucción en texto grande + botón de altavoz (TTS) para escucharla
- Fondo limpio, sin distracciones, máximo 3-4 elementos en pantalla
- Botones de acción: mínimo **100x100px**, bordes redondeados (border-radius: 20px), sombra suave
- Feedback inmediato al tocar: animación de "rebote" suave + sonido agradable
- **Nunca mostrar "incorrecto"** — si falla, la carta se voltea suavemente de nuevo o la imagen tiembla con cariño

### Pantalla de resultado (ActivityResult)
- Fondo festivo (confetti animado suave)
- Estrellas animadas cayendo (1 a 3 según desempeño)
- Mensaje positivo grande: "¡Muy bien, María!", "¡Lo lograste!", "¡Sos increíble!"
- Botón grande "Seguir jugando" y botón "Inicio" (para ir al home)
- Sonido de aplauso/fanfare suave

### Registro de estado de ánimo
- 5 caritas SVG grandes y expresivas con colores: muy feliz (amarillo), bien (verde), neutro (celeste), cansado (lila), ansioso (naranja)
- Texto debajo de cada cara, fuente 22px
- Sin presión: "¿Cómo te sentís hoy?" con voz amigable via TTS

### Agenda del día
- Cards con ícono grande, hora en negrita, texto descriptivo corto
- Si hay una visita: foto del familiar + "Hoy te visita Juan a las 15:00" con corazón

### Recordatorios de medicación
- Modal fullscreen con fondo suave, nombre del medicamento muy grande
- Ícono de pastilla del color configurado por el cuidador
- Botón enorme: "Ya tomé mi medicamento" (verde)

### Modo noche
- Fondo `#1C1A2E` (azul noche muy oscuro, no negro puro)
- Texto `#F5E6C8` (crema cálido, no blanco)
- Elementos con brillo reducido, conservando los colores de identidad pero más apagados

## Criterios de Calidad (no negociables para paciente)
- Todos los targets táctiles: mínimo **100x100px**
- Sin texto menor a **24px** en vistas del paciente
- Refuerzo positivo siempre — nunca mostrar "incorrecto"
- Contraste WCAG AA en modo normal y modo noche
- Tiempo de carga de actividad < 2s
- Animaciones suaves (no bruscas), duración 200-400ms
- Sin scroll horizontal, sin menús hamburguesa, sin modales complejos
- Diseño **mobile-first**: viewport principal 390px (iPhone 14), adaptable hasta tablet 768px
- Grilla de actividades: **1 columna en móvil**, 2 columnas en tablet
- Navegación inferior fija en móvil (max 3-4 íconos: Inicio, Actividades, Agenda, Perfil)
- **PWA instalable**: el familiar puede agregar la app al home screen del celular del paciente sin pasar por la App Store
- Soporte completo para gestos táctiles (swipe, pinch, tap, long press)
- `safe-area-inset` respetado para notch y barra de inicio en iPhone

---

## Archivos Críticos para Implementar

- `server/src/prisma/schema.prisma` — punto de partida obligatorio
- `server/src/services/session.service.ts` — núcleo de puntuación y logros
- `server/src/services/activityContent.service.ts` — generación de contenido por dificultad
- `client/src/layouts/PatientLayout.tsx` — define constraints de UX del paciente
- `client/src/pages/activities/` — 14 páginas de actividad (unidades independientes por fase)
- `client/src/hooks/useTTS.ts` — wrapper Web Speech API
- `server/src/utils/wordSearch.utils.ts` — generador de sopa de letras (testear con Jest)
