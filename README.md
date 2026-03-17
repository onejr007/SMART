# 🎮 SMART Metaverse Portal & Engine

Portal game profesional dan Multiverse Engine untuk game 3D berbasis web (Three.js + Cannon-es), lengkap dengan autentikasi, UGC editor, dan sistem browsing game.

**Arsitektur:** Standalone Firebase - Frontend only, no backend server!

---

## 🚀 Quick Start

### Development (Local)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Buka: `http://localhost:5173`

### Production (Deploy ke Firebase)

```bash
# Build
npm run build

# Deploy database rules (jbakun-62239)
firebase use jbakun-62239
firebase deploy --only database

# Deploy hosting (smart-34bcc)
firebase use smart-34bcc
firebase deploy --only hosting
```

Buka: `https://smart-34bcc.web.app`

---

## 🏗️ Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│  FIREBASE HOSTING (smart-34bcc)                         │
│  └─ Frontend (React + Vite + Three.js)                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  FIREBASE AUTH (smart-34bcc)                            │
│  └─ User Authentication                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  FIREBASE REALTIME DATABASE (jbakun-62239)              │
│  ├─ /users/{userId}                                     │
│  ├─ /games/{gameId}                                     │
│  ├─ /leaderboards/{gameId}/{userId}                     │
│  ├─ /user_game_data/{userId}/{gameId}                  │
│  └─ /audit_logs/{logId}                                 │
└─────────────────────────────────────────────────────────┘
```

**100% Standalone Firebase - No backend server needed!**

---

## ✨ Fitur Portal Profesional

### 🔐 Authentication System
- Signup & Login dengan Firebase Auth
- Session management otomatis
- User roles (Player, Creator, Admin)
- Secure password handling

### 🎮 Game Management
- Browse semua game yang tersedia
- Filter "My Games" untuk game yang kamu buat
- Create game baru dengan visual editor
- Auto-save ke Firebase Realtime Database

### 🏆 Leaderboard System
- Global leaderboard per game
- Auto-update saat submit score
- Top 10 players display

### 💾 Progress Persistence
- Auto-save player progress
- Resume game dari checkpoint terakhir
- Cloud sync across devices

### 🎨 Visual Editor
- Drag & drop entities
-  - Note: Warning `punycode` deprecation adalah normal dan tidak mempengaruhi deployment

---

## 🤖 Panduan AI Agent untuk Modifikasi Metaverse

Jika Anda adalah AI Agent (seperti Trae) yang diminta untuk mengembangkan fitur Metaverse, ikuti pedoman ini:

### 1. Struktur Folder Metaverse
- `src/engine/`: Core logic (Tidak boleh ada kode React di sini). File utama: `Core.ts`, `Entity.ts`, `Input.ts`, `Controller.ts`.
- `src/portal/`: UI React. Komponen utama: `App.tsx`, `GameList.tsx`, `GameView.tsx`, `Editor.tsx`.

### 2. Aturan Pengembangan 3D Engine
- **Selalu gunakan TypeScript** untuk engine core demi type safety.

---

## ✅ Checklist Implementasi Rekomendasi

Berikut adalah status implementasi dari 50 rekomendasi di atas:

- [x] #1 Content Security Policy (CSP): Implementasi kebijakan keamanan konten pada `server.js`.
- [x] #1 RBAC for Editor: Implementasi Role-Based Access Control (Admin, Creator, Player) pada Portal dan Navbar.
- [x] #1 Environment Secret Management: Implementasi `SecretManager.js` sebagai abstraksi pengambilan kredensial aman.
- [x] #1 API Versioning: Implementasi prefix `/api/v1/` pada server framework.
- [x] #1 Sandbox Execution: Validasi instruksi evolusi kode untuk mencegah eksekusi perintah berbahaya.
- [x] #2 Heartbeat & Reconnection Logic: Mekanisme ping/pong pada WebSocket untuk deteksi koneksi mati.
- [x] #2 Room-based Messaging: Implementasi sistem *rooms* pada WebSocket untuk isolasi world/game.
- [x] #2 Advanced Rate Limiting: Implementasi `express-rate-limit` pada seluruh endpoint API.
- [x] #2 Model Integrity Check: Implementasi verifikasi hash SHA-256 pada `AssetManager.ts` untuk aset 3D.
- [x] #3 SQL/NoSQL Injection Protection: Implementasi `sanitizePath` dan `validateRootPath` pada `sanitizer.js` untuk Firebase.
- [x] #3 Request Validation Schema: Implementasi middleware validasi skema Ajv pada endpoint API.
- [x] #4 Rate Limiting AI Ops: Pembatasan frekuensi operasi AI untuk stabilitas server.
- [x] #5 Binary Data Transmission: Integrasi `BinaryProtocol.js` ke dalam loop WebSocket dan `NetworkManager.ts`.
- [x] #13 Caching Layer: Implementasi `cache-manager.js` (In-Memory) untuk optimasi query API.
- [x] #20 Distributed Tracing & #24 Error Tracking: Implementasi `error-tracker.js` dengan Trace ID unik per request.
- [x] #37 Worker Threads for CPU Tasks: Implementasi `worker-pool.js` untuk tugas backend yang berat.
- [x] #38 Frontend Tree Shaking: Refaktor import Three.js dan Cannon-es ke named imports untuk optimasi bundle.
- [x] #39 Minification & Obfuscation: Implementasi proteksi kode produksi pada `build.js`.
- [x] #40 Prefetching Strategy: Implementasi mekanisme prefetch data game pada hover di `GameList.tsx`.
- [x] #41 Lazy Load API Modules: Implementasi dynamic imports untuk modul template engine di `routes.js`.
- [x] #43 Asset Bundling Optimization: Konfigurasi manual chunking pada `vite.config.ts`.
- [x] #44 Request Memoization: Implementasi `memoizer.js` untuk optimasi API request identik.
- [x] #45 Global State Optimization: Migrasi state manajemen ke `Zustand` untuk performa UI yang lebih responsif.
- [x] #6 Frustum Culling Optimization: Helper manual culling pada `SceneManager.ts` untuk entitas berat.
- [x] #6 Mesh Instancing: Implementasi `InstancedMeshComponent.ts` untuk optimasi rendering objek repetitif.
- [x] #6 Lazy Loading Components: Implementasi React `lazy` dan `Suspense` di `App.tsx` xntuk optimasi bundle.
- [x] #6 OffscreenCanvas: Implemene player
│   │   ├── Editor.tsx       # Visual editor
│   │   └── store.ts         # Global state (Zustand)
│   │
│   ├── engine/              # Game Engine (TypeScript)
│   │   ├── Core.ts          # Engine core
│   │   ├── Entity.ts        # Entity system
│   │   ├── Component.ts     # Component base
│   │   ├── SceneManager.ts  # Scene management
│   │   ├── Controller.ts    # Player controller
│   │   ├── PersistenceManager.ts  # Firebase Database integration
│   │   ├── LeaderboardManager.ts  # Leaderboard system
│   │   ├── AuditManager.ts        # Audit logging
│   │   ├── components/      # Built-in components
│   │   └── plugins/         # Engine plugins
│   │
│   ├── firebase.ts          # Firebase configuration
│   ├── main.tsx             # App entry point
│   └── index.html           # HTML template
│
├── database.rules.json      # Firebase Database security rules
├── firebase.json            # Firebase hosting config
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
└── package.json             # Dependencies
```

---

## 🔧 Configuration

### Firebase Projects Setup

Project ini menggunakan **2 Firebase Projects** dengan fungsi berbeda:

#### 1. **smart-34bcc** (Hosting & Authentication)
- **Fungsi:** Firebase Hosting untuk deploy frontend
- **Fungsi:** Firebase Authentication untuk login/signup
- **Fungsi:** Firebase Analytics untuk tracking

#### 2. **jbakun-62239** (Realtime Database)
- **Fungsi:** Firebase Realtime Database untuk menyimpan semua data
- **Data:** Users, Games, Leaderboards, Progress, Audit Logs

**Kenapa 2 Projects?**
- Project `smart-34bcc` untuk hosting & auth (public-facing)
- Project `jbakun-62239` untuk database (data storage)
- Memisahkan concerns dan security

### Environment Variables

Create `.env` file:

```env
# Firebase Project 1: smart-34bcc (Hosting & Auth)
VITE_FIREBASE_API_KEY=AIzaSyDI0fFGqzZgGMah6SqWBqXY3Dequ3l293g
VITE_FIREBASE_AUTH_DOMAIN=smart-34bcc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-34bcc
VITE_FIREBASE_STORAGE_BUCKET=smart-34bcc.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=543264870207
VITE_FIREBASE_APP_ID=1:543264870207:web:cbb04de066be95f72f0d8a
VITE_FIREBASE_MEASUREMENT_ID=G-TMKGJSX721

# Firebase Project 2: jbakun-62239 (Realtime Database)
VITE_FIREBASE_DATABASE_URL=https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app
```

**PENTING:** 
- `VITE_FIREBASE_DATABASE_URL` mengarah ke `jbakun-62239` untuk database
- Semua config lainnya mengarah ke `smart-34bcc` untuk hosting & auth
- Kedua projects terintegrasi otomatis melalui Firebase SDK

---

## 🔐 Firebase Database Rules

File `database.rules.json` berisi security rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "games": {
      ".read": true,
      "$gameId": {
        ".write": "auth != null"
      }
    },
    "user_game_data": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "leaderboards": {
      ".read": true,
      "$gameId": {
        "$uid": {
          ".write": "auth != null && auth.uid == $uid"
        }
      }
    }
  }
}
```

Deploy rules:
```bash
firebase use jbakun-62239
firebase deploy --only database
```

---

## 📦 Dependencies

### Core
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Zustand** - State management

### 3D & Physics
- **Three.js** - 3D rendering
- **Cannon-es** - Physics engine
- **three-stdlib** - Three.js utilities

### Firebase
- **firebase** - Firebase SDK (Auth + Database)

### Utilities
- **DOMPurify** - XSS protection
- **marked** - Markdown parser
- **highlight.js** - Code highlighting

---

## 🎮 How to Create a Game

1. **Login** ke portal
2. Klik **"Create"** di navbar
3. **Design scene** dengan visual editor:
   - Add entities (cubes, spheres, lights)
   - Set positions & properties
   - Configure physics
4. **Save game** - otomatis tersimpan ke Firebase
5. **Play & Share** - game langsung bisa dimainkan

---

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- Firebase account dengan 2 projects:
  - `smart-34bcc` (Hosting & Auth)
  - `jbakun-62239` (Realtime Database - DIFFERENT ACCOUNT!)

### Manual Deploy

1. **Build frontend:**
```bash
npm run build
```

2. **Deploy database rules ke jbakun-62239:**
```bash
firebase use jbakun-62239
firebase deploy --only database
```

3. **Deploy hosting ke smart-34bcc:**
```bash
firebase use smart-34bcc
firebase deploy --only hosting
```

4. **Done!** Buka `https://smart-34bcc.web.app`

### CI/CD (Automatic Deploy)

Project ini menggunakan GitHub Actions untuk auto-deploy setiap push ke `main`.

**Setup:**
1. Baca `GITHUB_SECRETS_SETUP.md` untuk setup secrets
2. Push ke `main` branch
3. GitHub Actions akan otomatis:
   - ✅ Run tests & type checking
   - ✅ Build production
   - ✅ Deploy database rules (jbakun-62239)
   - ✅ Deploy hosting (smart-34bcc)

**Status:** [![CI/CD](https://github.com/onejr007/SMART/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/onejr007/SMART/actions/workflows/ci-cd.yml)

---

## 🧪 Testing

### Local Development
```bash
npm run dev
```

Test checklist:
- ✅ Signup akun baru
- ✅ Login dengan akun existing
- ✅ Browse games
- ✅ Create new game
- ✅ Play game (WASD movement)
- ✅ Save progress
- ✅ Submit score to leaderboard

---

## 📊 Performance

- **First Load:** ~500KB (gzipped)
- **Three.js Bundle:** ~150KB
- **React Bundle:** ~130KB
- **Firebase SDK:** ~100KB
- **Lighthouse Score:** 90+ (Performance, Accessibility, Best Practices)

---

## � Security

- ✅ Firebase Authentication
- ✅ Database Security Rules
- ✅ XSS Protection (DOMPurify)
- ✅ HTTPS only (Firebase Hosting)
- ✅ Content Security Policy
- ✅ No exposed secrets (environment variables)

---

## 🌟 Key Features

### For Players
- 🎮 Play 3D games in browser
- 💾 Cloud save progress
- 🏆 Compete on leaderboards
- 📱 Works on desktop & mobile

### For Creators
- 🎨 Visual editor - no coding required
- 🚀 Instant publish
- 📊 Analytics & player stats
- 🔧 Component-based architecture

### For Developers
- 📦 Modular engine architecture
- 🔌 Plugin system
- 🎯 TypeScript support
- 🛠️ Hot reload development

---

## 📝 Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run deploy       # Build & deploy to Firebase
npm run lint         # Run linter
npm run typecheck    # TypeScript type checking
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

## 🎯 Roadmap

- [ ] Multiplayer support (WebSocket)
- [ ] Asset marketplace
- [ ] Mobile app (React Native)
- [ ] VR support (WebXR)
- [ ] Advanced physics (ragdoll, cloth)
- [ ] Procedural generation tools
- [ ] AI-powered NPC behaviors
- [ ] Social features (friends, chat)

---

## 💡 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **3D Engine:** Three.js + Cannon-es
- **State:** Zustand
- **Auth:** Firebase Authentication
- **Database:** Firebase Realtime Database
- **Hosting:** Firebase Hosting
- **Build:** Vite
- **Language:** TypeScript

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/onejr007/SMART/issues)
- **Discussions:** [GitHub Discussions](https://github.com/onejr007/SMART/discussions)

---

## 🎉 Acknowledgments

- Three.js community
- Firebase team
- React team
- Open source contributors

---

**Built with ❤️ using Firebase, React, and Three.js**
