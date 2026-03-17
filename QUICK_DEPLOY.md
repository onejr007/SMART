# 🚀 Quick Deploy - 3 Langkah Saja!

## Masalah Kamu

❌ Firebase deploy gagal karena permission denied  
❌ Login tidak berfungsi  
❌ Bingung kenapa harus pisah frontend-backend  

## Solusi

✅ Deploy ke **Railway.app** - 1 server untuk semua (seperti CodeIgniter)  
✅ Gratis 500 jam/bulan  
✅ Setup 5 menit  

---

## Langkah 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

---

## Langkah 2: Login & Deploy

```bash
railway login
railway init
railway up
```

Tunggu sampai selesai upload (~2-3 menit).

---

## Langkah 3: Set Environment Variables

1. Buka https://railway.app/dashboard
2. Pilih project kamu
3. Klik tab "Variables"
4. Klik "Raw Editor"
5. Copy-paste ini:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_key_here_change_this
FIREBASE_DB_URL=https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app/
FIREBASE_AUTH_SECRET=OPQ2iJqS1MOK0HjA1esCyvHCnJzN4zcZm0ym2iRxINGAT
ALLOWED_ORIGINS=*
VITE_FIREBASE_API_KEY=AIzaSyDI0fFGqzZgGMah6SqWBqXY3Dequ3l293g
VITE_FIREBASE_AUTH_DOMAIN=smart-34bcc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-34bcc
VITE_FIREBASE_STORAGE_BUCKET=smart-34bcc.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=543264870207
VITE_FIREBASE_APP_ID=1:543264870207:web:cbb04de066be95f72f0d8a
VITE_FIREBASE_MEASUREMENT_ID=G-TMKGJSX721
```

6. Klik "Save"
7. Railway akan auto-redeploy

---

## Selesai! 🎉

Railway akan kasih URL seperti: `https://smart-metaverse-production.up.railway.app`

Buka URL tersebut dan coba login!

---

## Alternatif: Render.com

Kalau Railway tidak bisa, pakai Render.com:

1. Buka https://render.com
2. Klik "New +" → "Web Service"
3. Connect GitHub repo
4. Isi:
   - Name: `smart-metaverse`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Tambahkan environment variables (sama seperti di atas)
6. Klik "Create Web Service"

---

## Troubleshooting

### Build gagal?
Pastikan di `package.json` ada:
```json
"scripts": {
  "build": "npm run build:portal",
  "start": "node server.js"
}
```

### Login masih gagal?
1. Buka browser console (F12)
2. Lihat tab Network
3. Cek apakah ada error CORS
4. Pastikan `ALLOWED_ORIGINS=*` sudah di-set

### Butuh bantuan?
Baca file `DEPLOY_MONOLITIK.md` untuk penjelasan lengkap.
