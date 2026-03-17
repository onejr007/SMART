# 🚂 Railway Deployment Guide

## ✅ Project Sudah Siap Deploy!

Semua konfigurasi sudah disiapkan. Tinggal jalankan command!

---

## 🚀 Cara Deploy (3 Langkah)

### Langkah 1: Install Railway CLI

**Windows (PowerShell):**
```powershell
npm install -g @railway/cli
```

**Linux/Mac:**
```bash
npm install -g @railway/cli
```

---

### Langkah 2: Deploy Otomatis

**Windows:**
```powershell
.\deploy-railway.ps1
```

**Linux/Mac:**
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

Script akan otomatis:
- ✅ Check Railway CLI
- ✅ Login ke Railway (buka browser)
- ✅ Buat project baru
- ✅ Upload semua file
- ✅ Deploy!

---

### Langkah 3: Set Environment Variables

Setelah upload selesai:

1. **Buka Railway Dashboard:**
```bash
railway open
```

2. **Klik tab "Variables"**

3. **Klik "Raw Editor"**

4. **Copy isi file `.env.production.template`** dan paste ke Raw Editor

5. **PENTING: Ganti `JWT_SECRET`** dengan string random panjang:
```
JWT_SECRET=abc123xyz789_GANTI_INI_DENGAN_STRING_RANDOM_PANJANG
```

6. **Klik "Deploy"** atau tunggu auto-redeploy (~2-3 menit)

7. **Klik tab "Settings"** → Scroll ke "Domains" → Copy URL production

---

## 🎉 Selesai!

Buka URL production (misal: `https://smart-metaverse-production.up.railway.app`)

Test:
- ✅ Signup akun baru
- ✅ Login
- ✅ Create game
- ✅ Play game

---

## 📝 Manual Deployment (Tanpa Script)

Kalau mau manual:

```bash
# 1. Login
railway login

# 2. Init project
railway init

# 3. Deploy
railway up

# 4. Open dashboard
railway open
```

Lalu set environment variables seperti di atas.

---

## 🔧 Troubleshooting

### Build gagal?

Check logs:
```bash
railway logs
```

Biasanya karena:
- ❌ Environment variables belum di-set
- ❌ Node version tidak sesuai (harus Node 20)

### Login tidak berfungsi?

1. Check environment variables sudah benar
2. Check `ALLOWED_ORIGINS` sudah include domain Railway
3. Check Firebase Realtime Database rules

### Butuh update code?

```bash
# Commit changes
git add .
git commit -m "Update code"

# Deploy ulang
railway up
```

---

## 💰 Biaya

Railway Free Tier:
- ✅ 500 jam/bulan (cukup untuk 1 app 24/7)
- ✅ 100GB bandwidth
- ✅ Custom domain
- ✅ WebSocket support

Kalau mau upgrade: $5/bulan untuk unlimited.

---

## 🆚 Alternatif Platform

Kalau Railway tidak cocok:

| Platform | Gratis? | Setup |
|----------|---------|-------|
| Railway  | ✅ 500 jam | Sangat mudah |
| Render   | ✅ 750 jam | Mudah |
| Fly.io   | ✅ Limited | Sedang |
| Heroku   | ❌ $7/bulan | Mudah |

---

## 📞 Bantuan

Kalau ada masalah:
1. Check Railway logs: `railway logs`
2. Check browser console (F12)
3. Check Network tab untuk API errors
