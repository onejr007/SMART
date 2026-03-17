# 🎯 MULAI DARI SINI!

## ✅ Project Sudah Siap Deploy ke Railway!

Semua file konfigurasi sudah dibuat. Kamu tinggal jalankan command.

---

## 📋 Yang Harus Kamu Lakukan

### 1️⃣ Install Railway CLI

Buka terminal/PowerShell, jalankan:

```bash
npm install -g @railway/cli
```

Tunggu sampai selesai (~30 detik).

---

### 2️⃣ Deploy!

**Kalau pakai Windows:**
```powershell
.\deploy-railway.ps1
```

**Kalau pakai Linux/Mac:**
```bash
chmod +x deploy-railway.sh
./deploy-railway.sh
```

Script akan:
1. Check Railway CLI ✅
2. Buka browser untuk login Railway ✅
3. Buat project baru ✅
4. Upload semua file ✅
5. Deploy! ✅

Tunggu ~3-5 menit untuk upload.

---

### 3️⃣ Set Environment Variables

Setelah upload selesai, jalankan:

```bash
railway open
```

Ini akan buka Railway Dashboard di browser.

**Di Dashboard:**

1. Klik tab **"Variables"**
2. Klik **"Raw Editor"**
3. Buka file **`.env.production.template`** di project kamu
4. **Copy semua isinya**
5. **Paste** ke Raw Editor di Railway
6. **PENTING:** Ganti baris ini:
   ```
   JWT_SECRET=GANTI_DENGAN_STRING_RANDOM_PANJANG_MINIMAL_32_KARAKTER
   ```
   Dengan string random, misal:
   ```
   JWT_SECRET=my_super_secret_key_12345_abcdefgh_xyz
   ```
7. Klik **"Deploy"** atau tunggu auto-redeploy

Tunggu ~2-3 menit untuk build & deploy.

---

### 4️⃣ Dapatkan URL Production

Di Railway Dashboard:

1. Klik tab **"Settings"**
2. Scroll ke bagian **"Domains"**
3. Klik **"Generate Domain"**
4. Copy URL yang muncul (misal: `https://smart-metaverse-production.up.railway.app`)

---

### 5️⃣ Test!

Buka URL production di browser:

1. ✅ Klik **"Sign Up"**
2. ✅ Buat akun baru
3. ✅ Login
4. ✅ Create game baru
5. ✅ Play game

**SELESAI!** 🎉

---

## 🆘 Kalau Ada Masalah

### Build gagal?

Check logs:
```bash
railway logs
```

### Login tidak berfungsi?

1. Pastikan environment variables sudah di-set
2. Tunggu 2-3 menit setelah set variables (Railway perlu redeploy)
3. Refresh browser

### Butuh bantuan lebih?

Baca file **`RAILWAY_DEPLOY.md`** untuk troubleshooting lengkap.

---

## 💡 Tips

- Railway Free Tier: 500 jam/bulan (cukup untuk 1 app 24/7)
- Setiap kali update code: `git push` → Railway auto-redeploy
- Check logs: `railway logs`
- Open dashboard: `railway open`

---

## 🎯 Ringkasan Command

```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy (Windows)
.\deploy-railway.ps1

# Deploy (Linux/Mac)
./deploy-railway.sh

# Open dashboard
railway open

# Check logs
railway logs
```

---

**Selamat mencoba! 🚀**
