# 🔐 Setup Cross-Project Authentication

## Masalah

Kita menggunakan 2 Firebase projects dengan **akun berbeda**:
- `smart-34bcc` - Hosting & Auth (Akun A)
- `jbakun-62239` - Realtime Database (Akun B)

Firebase SDK dari `smart-34bcc` perlu akses database di `jbakun-62239`.

---

## ✅ Solusi: Enable Cross-Project Auth

### Step 1: Login ke Firebase Console jbakun-62239

1. Buka https://console.firebase.google.com
2. Login dengan akun yang punya `jbakun-62239`
3. Pilih project `jbakun-62239`

### Step 2: Update Database Rules

1. Klik **"Realtime Database"** di sidebar
2. Klik tab **"Rules"**
3. Pastikan rules mengizinkan `auth != null`:

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
    }
  }
}
```

4. Klik **"Publish"**

### Step 3: Enable Authentication Providers

Karena auth dari `smart-34bcc`, kita perlu pastikan `jbakun-62239` accept auth tokens dari project lain.

**PENTING:** Firebase Realtime Database **otomatis accept auth tokens** dari Firebase Auth manapun selama:
1. ✅ Rules menggunakan `auth != null`
2. ✅ Token valid dan belum expired
3. ✅ Database URL benar

**Tidak perlu konfigurasi tambahan!**

---

## 🧪 Test Cross-Project Auth

### Test 1: Login di smart-34bcc

```bash
npm run dev
```

1. Buka `http://localhost:5173`
2. Signup akun baru
3. Login

### Test 2: Cek Database jbakun-62239

1. Buka Firebase Console `jbakun-62239`
2. Klik "Realtime Database"
3. Lihat data di `/users/{uid}`
4. Harusnya ada data user yang baru signup

Kalau data muncul = **Cross-project auth berhasil!** ✅

---

## ⚠️ Troubleshooting

### Error: "Permission denied"

**Penyebab:** Database rules terlalu ketat

**Solusi:**
1. Buka Firebase Console `jbakun-62239`
2. Realtime Database > Rules
3. Pastikan ada `"auth != null"` di rules
4. Publish rules

### Error: "FIREBASE_AUTH_DOMAIN mismatch"

**Penyebab:** Auth domain salah

**Solusi:**
Pastikan di `.env`:
```
VITE_FIREBASE_AUTH_DOMAIN=smart-34bcc.firebaseapp.com
```

### Error: "Database URL not found"

**Penyebab:** Database URL salah

**Solusi:**
Pastikan di `.env`:
```
VITE_FIREBASE_DATABASE_URL=https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app
```

---

## 📝 Cara Kerja

```
User Login
  ↓
Firebase Auth (smart-34bcc)
  ↓ Generate Auth Token
Browser
  ↓ Send request with Auth Token
Firebase Realtime Database (jbakun-62239)
  ↓ Validate Auth Token
  ↓ Check Rules (auth != null)
  ✅ Allow Access
```

Firebase SDK otomatis attach auth token ke setiap database request!

---

## ✅ Kesimpulan

**Tidak butuh database secret di client-side!**

Firebase SDK otomatis handle cross-project authentication selama:
1. ✅ Database rules allow `auth != null`
2. ✅ User sudah login via Firebase Auth
3. ✅ Database URL benar di config

**Deploy database rules:**
```bash
firebase use jbakun-62239
firebase deploy --only database
```

**Selesai!** Cross-project auth sudah jalan! 🎉
