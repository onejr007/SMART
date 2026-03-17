# SMART Metaverse Portal & Engine

Portal game profesional dan Multiverse Engine untuk game 3D berbasis web (Three.js + Cannon-es), lengkap dengan autentikasi, UGC editor, dan sistem browsing game.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Metaverse Portal + API (Single Server)
npm run dev

# Build for production
npm run build

# Build Portal for production
npm run build:portal

# Deploy Portal to Firebase
npm run deploy
```

Metaverse Portal + API: `http://localhost:3000`

## 🎮 Metaverse Engine & Portal

Fitur lengkap untuk membangun dan memainkan game 3D berbasis web dengan sistem autentikasi profesional.

### ✨ Fitur Portal Profesional (NEW!)
- **Authentication System**: Login & Register dengan Firebase Authentication
- **Modern UI/UX**: Glassmorphism design dengan smooth animations
- **Single Page Application**: Navigasi tanpa reload page
- **User Management**: Profile dengan avatar dan display name
- **Game Discovery**: Browse dan filter game (All Games / My Games)
- **Professional Design**: Dark theme dengan gradient accents dan responsive layout

### 🎯 Engine Core Features
- **Engine Core**: Built on Three.js & Cannon-es untuk rendering dan fisika real-time
- **Portal UI**: Interface berbasis React untuk browsing dan memainkan game
- **Editor Mode (UGC)**: Mode kreatif dengan Gizmo, Scene Hierarchy, dan Inspector
- **Save/Load System**: Game disimpan ke Firebase Realtime Database
- **GLTF/GLB Support**: Engine siap memuat model 3D kompleks dari Blender
- **First Person Controller**: Sistem navigasi dan fisika karakter (WASD + Space + Mouse Look)
- **Firebase Integrated**: Analytics, Authentication, dan Realtime Database

### Cara Menggunakan Portal

1. **Jalankan portal + API**: `npm run dev` (Buka browser di `http://localhost:3000`)

2. **Register/Login**: 
   - Pilih "Sign Up" untuk membuat akun baru (email, password, display name)
   - Data user disimpan ke Firebase Realtime Database melalui API server
   - Atau "Login" jika sudah punya akun
   - Session menggunakan HttpOnly Cookie
   
3. **Browse Games**: 
   - Filter "All Games" untuk melihat semua game
   - Filter "My Games" untuk melihat game yang Anda buat
   - Klik card game untuk play
   - Data game disimpan di Firebase Realtime Database melalui API server
   
4. **Create Game**: 
   - Klik "Create" di navbar
   - Double-click object untuk select
   - Gunakan gizmo untuk move/rotate/scale
   - Klik "Save Game" untuk save ke cloud
   
5. **Build & Deploy**: 
   - Build: `npm run build:portal`
   - Deploy: `npm run deploy` (deploy ke Firebase Hosting smart-34bcc)
   - Note: Warning `punycode` deprecation adalah normal dan tidak mempengaruhi deployment

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
- [x] #6 OffscreenCanvas: Implementasi `OffscreenRenderer.ts` untuk rendering latar belakang.
- [x] #7 Firebase Security Rules: (Ready) Standarisasi operasi DB via `PersistenceManager.ts`.
- [x] #7 Graceful Shutdown: Implementasi penanganan sinyal `SIGTERM/SIGINT` untuk penghentian server yang aman.
- [x] #7 WebSocket Authentication: Implementasi verifikasi JWT pada koneksi WebSocket.
- [x] #7 Compression Middleware: Aktivasi kompresi Gzip/Brotli pada server Express.
- [x] #8 Comprehensive JSDoc: Penambahan dokumentasi JSDoc pada file core engine untuk AI context.
- [x] #9 Payload Size Limit: Pembatasan ukuran payload JSON (1MB) untuk mencegah serangan DoS.
- [x] #10 Custom Error Classes: Implementasi `AppError` dan global error handler di `api/errorHandler.js`.
- [x] #10 Audit Logging: Implementasi `AuditManager.ts` untuk mencatat setiap aksi kritikal.
- [x] #11 Atomic Operations: Implementasi dukungan `transaction` pada `PersistenceManager.ts`.
- [x] #11 Level of Detail (LOD): Implementasi sistem LOD pada `Entity.ts` untuk optimasi rendering.
- [x] #13 Data Sanitization Pipeline: Implementasi `sanitizer.js` untuk pembersihan input database otomatis.
- [x] #15 Soft Deletes: Implementasi helper `softDelete` pada `PersistenceManager.ts`.
- [x] #17 Database Migration System: Implementasi `migration-manager.js` untuk pelacakan skema DB.
- [x] #18 Relational Data Integrity: Implementasi `RelationalValidator.js` untuk validasi referensi ID user.
- [x] #21 Containerization (Docker): Implementasi `Dockerfile` dan `docker-compose.yml` untuk deployment yang konsisten.
- [x] #22 CI/CD Pipeline: Implementasi GitHub Actions untuk pengujian, build otomatis, dan deployment ke Firebase Hosting.
- [x] #25 Resource Monitoring: Implementasi endpoint `/metrics` (Prometheus-style) pada `server.js`.
- [x] #2 Secure Session Management: Migrasi ke HttpOnly Cookies untuk keamanan token session.
- [x] #4 Dependency Audit Automation: Integrasi `npm audit` ke dalam pipeline CI/CD.
- [x] #7 Load Balancing: Pembuatan template `nginx.conf` untuk distribusi beban trafik.
- [x] #9 Network Throttling Simulation: Middleware simulasi latensi untuk pengujian performa di dev mode.
- [x] #27 Structured Logging: Implementasi `winston` logger untuk logging terstruktur di server.
- [x] #31 Health Check Endpoints: Endpoint `/api/health` yang komprehensif dengan metrik sistem.
- [x] #12 Procedural Terrain: Implementasi `ProceduralTerrainPlugin.ts` untuk terrain dinamis & fisik.
- [x] #13 AI-Agent Documentation: Pembuatan [CONTRIBUTING_AI.md](CONTRIBUTING_AI.md) untuk panduan teknis agen AI.
- [x] #13 Dynamic Environment: Implementasi `DayNightCyclePlugin.ts` untuk simulasi siklus siang-malam.
- [x] #14 Plugin System: Implementasi `PluginSystem.ts` untuk arsitektur engine yang modular.
- [x] #14 Quest & Mission System: Implementasi `QuestSystemPlugin.ts` untuk framework misi gameplay.
- [x] #16 Asset Compression: Integrasi DRACOLoader di `AssetManager.ts` untuk model 3D terkompresi.
- [x] #16 Visual Scripting foundation: Implementasi `VisualScripting.ts` sebagai basis logika berbasis node.
- [x] #17 Physics Interaction: Implementasi `PhysicsInteraction.ts` untuk interaksi angkat/lempar objek.
- [x] #19 Memory Leak & Perf Detection: Integrasi `PerformanceMonitor` ke dalam Engine Loop (Core.ts).
- [x] #20 Client-Side Prediction: Pondasi `NetworkManager.ts` untuk sinkronisasi state real-time.
- [x] #21 Global Leaderboards: Implementasi `LeaderboardManager.ts` untuk fitur papan skor global.
- [x] #21 ECS Architecture: Refaktor `Entity.ts` menjadi sistem berbasis komponen (Partial ECS).
- [x] #22 Advanced Character Controller: Fitur head bobbing, sprinting, dan raycast ground check.
- [x] #22 Formal Scene Graph: Implementasi `SceneManager.ts` untuk manajemen hirarki entitas.
- [x] #23 Event Bus Protocol: Standarisasi komunikasi Engine-UI menggunakan `EventBus.ts`.
- [x] #24 Centralized Asset Manager: Implementasi `AssetManager.ts` untuk caching dan manajemen model 3D.
- [x] #25 State Machine Logic: Implementasi `StateMachine.ts` sebagai komponen untuk logika entitas.
- [x] #26 Dependency Injection: Implementasi `ServiceContainer.ts` untuk modularitas sistem engine.
- [x] #36 Inventory & Player Stats: Implementasi `PlayerStats.ts` untuk data progres pemain per game.
- [x] #39 AI NPC System: Implementasi `AIController.ts` untuk navigasi dan kontrol NPC otomatis.
- [x] #45 Trigger Volumes: Implementasi `TriggerVolume.ts` untuk deteksi area masuk/keluar.

---

### 3. Menambahkan Game Baru
- Saat ini daftar game bersifat dinamis dan diambil melalui API Server.
- Logika inisialisasi scene game berada di dalam method `loadGameScene` pada `src/portal/GameView.tsx`.
- Untuk menambahkan game kompleks, buat file scene terpisah di folder `src/games/` dan panggil dari `GameView.tsx`.

### 4. Arsitektur Firebase (PENTING!)
Project ini menggunakan **Dua Project Firebase yang Berbeda**:

1. **Primary App (`smart-34bcc`)**: Digunakan untuk **Hosting** dan **Analytics**
   - Deploy aplikasi menggunakan Firebase Hosting dari project ini
   - Analytics tracking
   
2. **Database App (`jbakun-62239`)**: Digunakan untuk **Realtime Database** (Menyimpan SEMUA data UGC)
   - Menyimpan: User data (signup/login), Game data (UGC), Leaderboard, Audit log
   - Akses write dilakukan **server-side** melalui API (tidak ada secret di client)

**Sistem Authentication & Session:**
- Tidak menggunakan Firebase Authentication
- Signup/Login dilakukan via API Server: `POST /api/v1/portal/auth/signup` dan `POST /api/v1/portal/auth/login`
- Password disimpan dalam bentuk hash `scrypt` (server-side)
- Session menggunakan HttpOnly Cookie (`smart_token`)

**Konfigurasi Secret (server-side only):**
- Simpan `FIREBASE_DB_URL` dan `FIREBASE_AUTH_SECRET` di `.env`
- Contoh variabel ada di `.env.example`

### 5. Struktur Data UGC (User-Generated Content)
Saat user menekan "Save Game" di Editor, data akan disimpan melalui API Server ke Firebase Realtime Database di node `/games` dengan struktur berikut:
```json
{
  "title": "Game by Creator_1234 - 10:00 AM",
  "description": "A user generated world built in SMART Engine",
  "author": "Creator_1234",
  "createdAt": "2026-03-17T10:00:00.000Z",
  "scene": [
    {
      "name": "Cube_123",
      "position": {"x": 0, "y": 5, "z": 0},
      "rotation": {"x": 0, "y": 0, "z": 0},
      "scale": {"x": 1, "y": 1, "z": 1},
      "mass": 0
    }
  ]
}
```
Untuk production, pastikan rules database membatasi write dari client, karena semua write dilakukan lewat server.

---

## 📁 Struktur Project

```
ai-web-framework/
├── ai/                      # AI Core Modules
│   ├── context-manager.js   # Manage AI context & learning
│   ├── template-engine.js   # Generate components & pages
│   └── ...                  # Other AI modules
├── api/
│   └── routes.js            # Centralized API routes
├── schemas/
│   ├── ai-schemas.js        # Validation schemas
│   └── component.schema.json
├── public/                  # Static assets & dashboard
├── src/
│   ├── components/          # Generated components
│   ├── engine/              # 3D Game Engine (Three.js + Cannon-es)
│   │   ├── Core.ts          # Engine core logic
│   │   ├── Entity.ts        # Game entity system
│   │   ├── Input.ts         # Input handling
│   │   └── Controller.ts    # Player controller
│   ├── portal/              # React-based Portal UI
│   │   ├── App.tsx          # Main app with auth
│   │   ├── AuthContext.tsx  # Auth state management
│   │   ├── Auth.tsx         # Login/Register UI
│   │   ├── Auth.css         # Auth styles
│   │   ├── Navbar.tsx       # Navigation bar
│   │   ├── Navbar.css       # Navbar styles
│   │   ├── GameList.tsx     # Game listing with filter
│   │   ├── GameList.css     # Game list styles
│   │   ├── GameView.tsx     # Game player
│   │   ├── Editor.tsx       # World editor
│   │   ├── EditorWrapper.tsx # Editor with header
│   │   └── EditorWrapper.css # Editor wrapper styles
│   ├── firebase.ts          # Firebase configuration
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── scripts/                 # Build & utility scripts
└── server.js               # Main server file
```

## 🔌 API Endpoints

### System & Health

- `GET /api/health` - Health check dengan detailed metrics
- `GET /api/structure` - Project structure + analytics (cached 30s)
- `GET /api/ai/context` - Current AI context
- `GET /api/ai/analytics` - Comprehensive analytics & metrics
- `GET /api/ai/contracts` - Schema contracts untuk AI Agent

### Generation

- `POST /api/generate/component` - Generate single component
- `POST /api/generate/page` - Generate single page
- `POST /api/batch/generate` - Batch generate (max 50 operations)

### Version Control

- `GET /api/versions/:type/:name` - Get version history
- `POST /api/versions/restore` - Restore specific version

### AI Helpers

- `POST /api/ai/suggest/component` - Get component name suggestions

## 📝 API Usage Examples

### Generate Component

```javascript
POST /api/generate/component
{
  "name": "HeroSection",
  "type": "ui",
  "content": "Hero section with CTA button",
  "aiMetadata": {
    "prompt": "Create modern hero section",
    "complexity": "simple"
  }
}
```

### Batch Generate

```javascript
POST /api/batch/generate
{
  "operations": [
    {
      "type": "component",
      "data": {
        "name": "Button",
        "type": "ui",
        "content": "Reusable button component"
      }
    },
    {
      "type": "page",
      "data": {
        "name": "Home",
        "layout": "default",
        "components": ["HeroSection", "Button"]
      }
    }
  ]
}
```

## 🛡️ Security Features

- **Role-Based Access Control (RBAC)**: Pembatasan akses fitur Editor berdasarkan role (Admin, Creator, Player).
- **Environment Secret Management**: Pengelolaan kredensial aman via `SecretManager` (AWS/Vault ready).
- **Rate Limiting**: 100 requests per minute per IP
- **Input Validation**: Strict validation untuk semua input
- **Helmet.js**: Security headers protection
- **CORS**: Configurable CORS policy
- **Request Size Limit**: Max 10MB per request
- **Sanitization**: Automatic input sanitization via `sanitizer.js` dan NoSQL injection protection.

## 📊 Monitoring & Metrics

Framework mengumpulkan metrics real-time:

- Request count & success rate
- Generation statistics (components/pages)
- Cache hit rate
- Error tracking by type
- Performance metrics (response time, etc)
- Memory usage

Akses via `GET /api/ai/analytics`

## ⚙️ Configuration

Copy `.env.example` ke `.env` dan sesuaikan:

```env
PORT=3000
NODE_ENV=development
RATE_LIMIT_MAX_REQUESTS=100
CACHE_TTL=30000
MAX_BATCH_SIZE=50
```

## 🚀 Deploy (PENTING)

Project ini terdiri dari 2 bagian:
- **Frontend (Vite → dist)**: di-deploy ke Firebase Hosting
- **Backend (Express API)**: di-deploy sebagai Firebase Functions di project Hosting yang sama

### 1) Frontend (Firebase Hosting)
- `.env` memang di-ignore, tapi nilai `VITE_*` dibaca saat proses build dan ikut masuk ke bundle `dist/assets/*`.
- Jika build dilakukan di GitHub Actions, set `VITE_FIREBASE_*` sebagai GitHub Secrets agar build memakai nilai yang benar.
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID`

### 2) Backend (Firebase Functions di smart-34bcc)
- Backend tidak perlu server terpisah (tidak ada Cloud Run).
- Hosting sudah dikonfigurasi me-rewrite `/api/**` dan `/metrics` ke Firebase Function `api` melalui `firebase.json`.
- Variabel `FIREBASE_DB_URL` dan `FIREBASE_AUTH_SECRET` tetap **server-side only**.
- Backend membaca konfigurasi dari environment variables Functions:
  - `FIREBASE_DB_URL`
  - `FIREBASE_AUTH_SECRET`
  - `ALLOWED_ORIGINS`
- Untuk deploy otomatis dari GitHub Actions, set GitHub Secrets:
  - `FIREBASE_SERVICE_ACCOUNT_SMART_34BCC_B64` (isi: base64 dari JSON service account)
  - `FIREBASE_DB_URL`
  - `FIREBASE_AUTH_SECRET`
  - `ALLOWED_ORIGINS`

### Deploy dari lokal (tanpa login interaktif)
- Buat service account untuk project `smart-34bcc` dan download JSON key.
- Set environment variable:
  - Windows PowerShell: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\firebase-sa.json"`
  - Linux/macOS: `export GOOGLE_APPLICATION_CREDENTIALS=/path/firebase-sa.json`
- Deploy:
  - `firebase deploy --only hosting,functions --project smart-34bcc`

## 🎨 Component Standards

### Naming Convention
- **PascalCase** wajib (e.g., `MyComponent`, `HeroSection`)
- Max 50 karakter
- Alphanumeric only

### Component Types
- `ui` - UI components (buttons, cards, etc)
- `data` - Data-driven components
- `layout` - Layout components
- `form` - Form components
- `navigation` - Navigation components
- `media` - Media components
- `utility` - Utility components

### Page Layouts
- `default` - Standard layout
- `sidebar` - Layout with sidebar
- `fullwidth` - Full width layout
- `grid` - Grid-based layout
- `dashboard` - Dashboard layout

## 🔧 NPM Scripts

```bash
npm run dev          # Start development server
npm run dev:portal   # Start Metaverse Portal only (Vite)
npm run build        # Build for production
npm run lint         # Check code standards
npm run typecheck    # JavaScript syntax check
npm run check        # Run lint + typecheck
npm run docs         # Update AI documentation
npm run ai:analyze   # Analyze AI patterns
npm run benchmark    # Benchmark endpoints
npm run cleanup      # Reset framework state
```

## 🤖 AI Agent Workflow

Recommended workflow untuk AI Agent:

1. **Health Check**: `GET /api/health`
2. **Get Context**: `GET /api/structure` + `GET /api/ai/contracts`
3. **Generate**: Use `POST /api/batch/generate` untuk multiple files
4. **Monitor**: Check `GET /api/ai/analytics` untuk metrics
5. **Iterate**: Gunakan version control jika perlu rollback

## 📈 Performance Tips

- Gunakan batch operations untuk multiple files
- Cache diaktifkan otomatis (30s TTL)
- Rate limiting melindungi dari overload
- Metrics membantu identify bottlenecks
- Version control memungkinkan safe experimentation

## 🔄 Hot Reload

WebSocket connection otomatis reload browser saat file berubah:
- `src/**/*` - Components & pages
- `public/**/*` - Static assets

## 📦 Version Control

Setiap file generation/update otomatis di-version:
- Restore ke version sebelumnya kapan saja
- Track semua perubahan dengan metadata
- Rollback aman tanpa data loss

## 🚨 Error Handling

Framework memiliki comprehensive error handling:
- Automatic error logging
- Error categorization
- Recent errors tracking
- Error statistics

## 💡 Best Practices

1. **Selalu gunakan batch operations** untuk multiple files
2. **Include aiMetadata.prompt** untuk better context learning
3. **Monitor analytics** untuk optimize generation patterns
4. **Use version control** untuk safe experimentation
5. **Follow naming conventions** (PascalCase)
6. **Validate before generate** menggunakan `/api/ai/contracts`

## 🔒 Keamanan Database

### ⚠️ PENTING: Database Rules

Saat ini rules database: `".read": true, ".write": true` - **TIDAK AMAN untuk production!**

### Rekomendasi untuk Production:

1. **Gunakan Rules yang Lebih Ketat:**
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": true,
        ".write": "!data.exists()"
      }
    },
    "games": {
      ".read": true,
      "$gameId": {
        ".write": "auth != null"
      }
    }
  }
}
```

2. **Gunakan akses server-side untuk write:**
   - Simpan secret database di server (`FIREBASE_AUTH_SECRET`), bukan di client
   - Database rules bisa dibuat lebih ketat karena client tidak melakukan write langsung

3. **Best Practice untuk Production:**
   - Buat Firebase Cloud Functions untuk handle signup/login
   - Simpan auth secret di server-side only
   - Client hanya kirim request ke Cloud Functions
   - Cloud Functions yang akses database dengan secret

### Untuk Development (Sekarang):
Rules `".read": true, ".write": true` OK untuk testing, tapi:
- ❌ Jangan gunakan untuk production
- ❌ Jangan simpan data sensitif
- ❌ Siapapun bisa delete semua data
- ✅ Ubah rules sebelum deploy live

## 🔧 Troubleshooting

### Error: Permission denied saat register/login
**Penyebab**: API server gagal akses Firebase Realtime Database (secret tidak valid / env belum diset)

**Solusi**:
1. Pastikan server berjalan: `npm run dev`
2. Pastikan `.env` punya `FIREBASE_DB_URL` dan `FIREBASE_AUTH_SECRET`
3. Jalankan ulang server setelah update `.env`

### Error: Database write failed
**Penyebab**: `FIREBASE_DB_URL` atau `FIREBASE_AUTH_SECRET` salah

**Solusi**:
1. Pastikan `FIREBASE_DB_URL` adalah URL root database, tanpa `/.json`
2. Pastikan `FIREBASE_AUTH_SECRET` valid dan hanya ada di server-side
3. Cek log server untuk pesan error dari Firebase

### Warning: `punycode` deprecation
**Status**: Normal, tidak mempengaruhi aplikasi

**Penjelasan**: Warning dari Node.js tentang module internal yang akan deprecated. Tidak perlu action, deployment tetap berjalan normal.

## 📚 Documentation Policy

- Single source of truth: `README.md`
- No additional `.md` files
- Auto-generated sections via `npm run docs`
- Keep documentation updated and concise

---

<!-- AI_DOCS_START -->
## AI Snapshot

Last generated: 2026-03-17T13:43:14.076Z

- Components: 1
- Pages: 0
- Pattern groups: 0

### Component Types
- component: 1

### Registered Components
- Button

## Portal Update Log

Last updated: 2026-03-17

### ✨ Major Updates
- **Authentication System**: Custom auth via API server + HttpOnly cookie session
- **Modern UI**: Glassmorphism design dengan smooth animations
- **Single Page App**: No reload navigation dengan React Router-like behavior
- **Professional Design**: Dark theme dengan gradient accents
- **User Management**: Profile system dengan avatar dan display name
- **Game Filtering**: Filter "All Games" dan "My Games"
- **Responsive Layout**: Mobile-friendly design

### 📁 New Files
- `src/portal/AuthContext.tsx` - Auth state management
- `src/portal/Auth.tsx` - Login/Register UI
- `src/portal/Auth.css` - Auth page styles
- `src/portal/Navbar.tsx` - Navigation bar component
- `src/portal/Navbar.css` - Navbar styles
- `src/portal/GameList.css` - Professional game list styles
- `src/portal/EditorWrapper.tsx` - Editor with header
- `src/portal/EditorWrapper.css` - Editor wrapper styles

### 🔧 Modified Files
- `src/portal/App.tsx` - Integrated auth system dan navigation
- `src/portal/GameList.tsx` - Added filter system dan modern UI
- `src/firebase.ts` - Updated database URL dengan auth secret
- `src/index.css` - Global styles untuk dark theme
- `src/main.tsx` - Updated imports

### 🔑 Firebase Configuration
- **Hosting**: smart-34bcc (untuk deploy aplikasi)
- **Database**: jbakun-62239 (akses write lewat API server)
- **Database URL**: diset via `FIREBASE_DB_URL` (server-side)
- **Auth System**: Custom auth via API server + HttpOnly cookie session

<!-- AI_DOCS_END -->

---

**Framework Version**: 2.1.0  
**AI-Optimized**: ✅  
**Production Ready**: ✅  
**Security Hardened**: ✅
