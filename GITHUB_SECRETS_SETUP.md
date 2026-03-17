# 🔐 GitHub Secrets Setup for CI/CD

## Required Secrets

Untuk CI/CD berjalan, kamu perlu setup GitHub Secrets berikut:

### 1. Firebase Configuration (Public - untuk build)

Buka: `https://github.com/onejr007/SMART/settings/secrets/actions`

Tambahkan secrets berikut:

```
VITE_FIREBASE_API_KEY=AIzaSyDI0fFGqzZgGMah6SqWBqXY3Dequ3l293g
VITE_FIREBASE_AUTH_DOMAIN=smart-34bcc.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=smart-34bcc
VITE_FIREBASE_STORAGE_BUCKET=smart-34bcc.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=543264870207
VITE_FIREBASE_APP_ID=1:543264870207:web:cbb04de066be95f72f0d8a
VITE_FIREBASE_MEASUREMENT_ID=G-TMKGJSX721
VITE_FIREBASE_DATABASE_URL=https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app
```

### 2. Firebase Service Accounts (Private - untuk deploy)

#### A. Service Account untuk jbakun-62239 (Database)

1. Buka Firebase Console: https://console.firebase.google.com
2. Pilih project `jbakun-62239`
3. Klik ⚙️ → Project Settings
4. Klik tab "Service accounts"
5. Klik "Generate new private key"
6. Download file JSON
7. Copy isi file JSON
8. Buat secret di GitHub:
   - Name: `FIREBASE_SERVICE_ACCOUNT_JBAKUN_62239`
   - Value: Paste isi file JSON

#### B. Service Account untuk smart-34bcc (Hosting)

1. Buka Firebase Console: https://console.firebase.google.com
2. Pilih project `smart-34bcc`
3. Klik ⚙️ → Project Settings
4. Klik tab "Service accounts"
5. Klik "Generate new private key"
6. Download file JSON
7. Copy isi file JSON
8. Buat secret di GitHub:
   - Name: `FIREBASE_SERVICE_ACCOUNT_SMART_34BCC`
   - Value: Paste isi file JSON

---

## 🧪 Test CI/CD

Setelah setup secrets:

1. Push ke branch `main`:
```bash
git add .
git commit -m "Update CI/CD"
git push origin main
```

2. Buka GitHub Actions:
```
https://github.com/onejr007/SMART/actions
```

3. Lihat workflow "SMART Portal CI/CD" running

4. Kalau success, cek deployment:
```
https://smart-34bcc.web.app
```

---

## 🔍 Troubleshooting

### Error: "Permission denied"

**Penyebab:** Service account tidak punya permission

**Solusi:**
1. Buka Firebase Console
2. Project Settings → Users and permissions
3. Tambahkan service account email sebagai Editor/Owner

### Error: "Invalid service account"

**Penyebab:** JSON format salah

**Solusi:**
1. Download ulang service account JSON
2. Pastikan copy paste lengkap (dari `{` sampai `}`)
3. Jangan ada spasi atau newline tambahan

### Error: "Build failed"

**Penyebab:** Environment variables tidak lengkap

**Solusi:**
1. Cek semua `VITE_FIREBASE_*` secrets sudah ada
2. Pastikan value-nya benar (tidak ada typo)

---

## ✅ Checklist

- [ ] `VITE_FIREBASE_API_KEY` added
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` added
- [ ] `VITE_FIREBASE_PROJECT_ID` added
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` added
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` added
- [ ] `VITE_FIREBASE_APP_ID` added
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` added
- [ ] `VITE_FIREBASE_DATABASE_URL` added
- [ ] `FIREBASE_SERVICE_ACCOUNT_JBAKUN_62239` added
- [ ] `FIREBASE_SERVICE_ACCOUNT_SMART_34BCC` added
- [ ] Tested push to main
- [ ] Deployment successful

---

## 📝 Notes

- Service account JSON harus disimpan dengan aman
- Jangan commit service account ke Git
- Secrets hanya bisa dilihat oleh repo owner
- CI/CD akan auto-deploy setiap push ke `main`
