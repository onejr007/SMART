# Architecture

Dokumen ini menjelaskan gambaran arsitektur SMART secara ringkas: portal React, studio editor, engine, serta integrasi Firebase.

## High-Level Components

```
UI (React)
  ├─ Portal: browse/create/play
  └─ Studio: editor full-screen

Engine (TypeScript)
  ├─ Core render loop (Three.js)
  ├─ Physics (cannon-es)
  ├─ Systems (SceneManager, Plugins, Persistence, etc.)
  └─ Bootstraps (Content/Security/Rendering/Advanced)

Firebase
  ├─ Auth
  └─ Realtime Database
```

## Runtime Flows

### 1) Browse → Play

1. User login via Firebase Auth.
2. Portal load list game (default + RTDB `games/`).
3. User pilih game → GameView mount.
4. GameFacade membuat Engine + bootstrap config.
5. Engine start → loop render/update.

### 2) Create → Edit → Save

1. User klik Create Game.
2. Editor full-screen mount.
3. EditorFacade membuat Engine dengan config editor.
4. User menambah/ubah entity.
5. Save: serialize scene via SceneManager → PersistenceManager.saveGame() → RTDB `games/`.

## Data Model (RTDB)

Lihat rules untuk validasi dan akses:
- `database.rules.json`

Path utama:
- `users/{uid}`
- `games/{gameId}`
- `user_game_data/{uid}/{gameId}`
- `leaderboards/{gameId}/{uid}`
- `audit_logs/{autoId}`

## Service Container (DI)

Engine mendaftarkan service utama ke container:
- Renderer, Scene, Camera, Physics, SceneManager, NetworkManager, PluginSystem, Persistence, Engine

Komponen engine yang membutuhkan akses global (misalnya PhysicsInteraction) mengambil dependency dari container menggunakan `ServiceTokens`.

## Build & Deploy

- Vite project root: `src/`
- Output build: `dist/`
- Firebase Hosting: rewrite SPA ke `index.html`
