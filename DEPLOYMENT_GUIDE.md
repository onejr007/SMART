# Panduan Deployment - SMART Metaverse Engine

## Arsitektur Saat Ini

```
┌─────────────────────────────────────────────────────────┐
│  FIREBASE PROJECT 1: jbakun-62239                       │
│  ├─ Realtime Database (users, games, leaderboards)     │
│  └─ Authentication Data                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  FIREBASE PROJECT 2: smart-34bcc                        │
│  ├─ Hosting (Frontend)                                  │
│  └─ Cloud Functions (Backend API) ❌ TIDAK BISA DEPLOY  │
└─────────────────────────────────────────────────────────┘
```

## Masalah

Login gagal karena:
1. Cloud Functions di `smart-34bcc` tidak bisa di-deploy (permission denied)
2. API endpoint `/api/v1/portal/auth/login` tidak tersedia
3. Frontend tidak bisa berkomunikasi dengan backend

## Solusi 1: Aktifkan Cloud Functions (RECOMMENDED)

Minta project owner `smart-34bcc` untuk mengaktifkan API berikut:

1. Buka Google Cloud Console: https://console.cloud.google.com
2. Pilih project `smart-34bcc`
3. Aktifkan API berikut:
   - [Cloud Functions API](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=smart-34bcc)
   - [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=smart-34bcc)
   - [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=smart-34bcc)

Setelah API aktif, deploy ulang:
```bash
firebase deploy --only hosting,functions --project smart-34bcc
```

## Solusi 2: Deploy Backend ke Platform Terpisah

Jika tidak bisa menggunakan Cloud Functions, deploy backend Express ke platform lain.

### A. Deploy ke Railway.app (Gratis & Mudah)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login dan deploy:
```bash
railway login
railway init
railway up
```

3. Set environment variables di Railway Dashboard:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_key_here
FIREBASE_DB_URL=https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app/
FIREBASE_AUTH_SECRET=OPQ2iJqS1MOK0HjA1esCyvHCnJzN4zcZm0ym2iRxINGAT
ALLOWED_ORIGINS=https://smart-34bcc.web.app,https://smart-34bcc.firebaseapp.com
```

4. Dapatkan URL backend (misal: `https://your-app.railway.app`)

### B. Deploy ke Render.com (Gratis)

1. Buat akun di [Render.com](https://render.com)
2. Klik "New +" → "Web Service"
3. Connect repository GitHub
4. Konfigurasi:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Tambahkan environment variables (sama seperti Railway)

### C. Update Frontend untuk Menggunakan Backend Eksternal

Setelah backend di-deploy, update `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "destination": "https://your-backend-url.railway.app/api/**"
      },
      {
        "source": "/metrics",
        "destination": "https://your-backend-url.railway.app/metrics"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**CATATAN:** Firebase Hosting rewrites tidak mendukung external URLs. Jadi kamu perlu menggunakan proxy atau update frontend untuk langsung memanggil backend URL.

### D. Update Frontend untuk Memanggil Backend Langsung

Buat file konfigurasi API:

**src/config/api.ts**
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
```

Update `.env`:
```env
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

Update `src/portal/AuthContext.tsx`:
```typescript
import { API_BASE_URL } from '../config/api';

// Ganti semua '/api/v1/portal/auth/...' menjadi:
const res = await fetch(`${API_BASE_URL}/api/v1/portal/auth/login`, {
  // ...
});
```

## Solusi 3: Deploy Hosting Saja (Sementara)

Jika hanya ingin deploy frontend tanpa backend:

```bash
firebase deploy --only hosting --project smart-34bcc
```

**CATATAN:** Login tidak akan berfungsi karena tidak ada backend.

## Checklist Deployment

- [ ] Pastikan API di `smart-34bcc` sudah aktif (Solusi 1)
  ATAU
- [ ] Backend sudah di-deploy ke Railway/Render (Solusi 2)
- [ ] Environment variables sudah di-set dengan benar
- [ ] CORS di backend sudah mengizinkan domain frontend
- [ ] Frontend sudah di-build: `npm run build`
- [ ] Deploy hosting: `firebase deploy --only hosting --project smart-34bcc`
- [ ] Test login di production URL

## Testing

1. Buka browser: `https://smart-34bcc.web.app`
2. Coba login dengan akun test
3. Periksa Network tab di DevTools untuk melihat API calls
4. Jika error CORS, update `ALLOWED_ORIGINS` di backend

## Troubleshooting

### Login gagal dengan "Failed to fetch"
- Periksa apakah backend berjalan
- Periksa CORS settings di backend
- Periksa Network tab untuk melihat error detail

### "User not found" setelah signup
- Periksa koneksi ke Firebase Realtime Database
- Pastikan `FIREBASE_DB_URL` dan `FIREBASE_AUTH_SECRET` benar

### WebSocket connection failed
- WebSocket memerlukan backend yang running
- Jika menggunakan Railway/Render, pastikan WebSocket support aktif
