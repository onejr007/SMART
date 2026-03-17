# Deploy Monolitik - 1 Server Saja (Seperti CodeIgniter)

## Penjelasan

Project ini **SUDAH MONOLITIK**! File `server.js` melayani:
- ✅ Frontend (React/Vite)
- ✅ Backend API (Express)
- ✅ WebSocket
- ✅ Static files

Masalahnya: **Firebase memaksa pemisahan** hosting dan functions.

## Solusi: Deploy ke Platform Monolitik

### Opsi 1: Railway.app (RECOMMENDED - Gratis & Mudah)

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login:**
```bash
railway login
```

3. **Deploy:**
```bash
railway init
railway up
```

4. **Set Environment Variables di Railway Dashboard:**
   - Buka https://railway.app/dashboard
   - Pilih project kamu
   - Klik "Variables"
   - Tambahkan:
```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_key_here
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

5. **Selesai!** Railway akan memberikan URL seperti: `https://your-app.railway.app`

---

### Opsi 2: Render.com (Gratis)

1. **Buat akun di** https://render.com
2. **Klik "New +" → "Web Service"**
3. **Connect GitHub repository**
4. **Konfigurasi:**
   - Name: `smart-metaverse`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Instance Type: `Free`

5. **Tambahkan Environment Variables** (sama seperti Railway di atas)

6. **Deploy!**

---

### Opsi 3: Heroku (Berbayar)

1. **Install Heroku CLI:**
```bash
npm install -g heroku
```

2. **Login dan Deploy:**
```bash
heroku login
heroku create smart-metaverse
git push heroku main
```

3. **Set Environment Variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secret_key_here
heroku config:set FIREBASE_DB_URL=https://jbakun-62239-default-rtdb.asia-southeast1.firebasedatabase.app/
# ... dst
```

---

### Opsi 4: VPS (DigitalOcean, Linode, dll)

Jika punya VPS:

1. **SSH ke server:**
```bash
ssh user@your-server-ip
```

2. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone & Setup:**
```bash
git clone <your-repo>
cd smart-metaverse-portal
npm install
npm run build
```

4. **Buat file .env:**
```bash
nano .env
# Copy isi dari .env.example dan sesuaikan
```

5. **Install PM2 untuk production:**
```bash
sudo npm install -g pm2
pm2 start server.js --name smart-metaverse
pm2 startup
pm2 save
```

6. **Setup Nginx sebagai reverse proxy:**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/smart-metaverse
```

Isi dengan:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/smart-metaverse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Kenapa Tidak Firebase?

Firebase **MEMAKSA** pemisahan:
- `firebase.json` → `hosting` untuk frontend
- `firebase.json` → `functions` untuk backend
- Tidak bisa 1 server seperti CodeIgniter

Untuk deploy ke Firebase, kamu harus:
1. Aktifkan Cloud Functions API (butuh permission owner)
2. Pisahkan backend ke folder `functions/`
3. Deploy terpisah

**Lebih ribet!** Makanya saya rekomendasikan Railway/Render.

---

## Perbandingan Platform

| Platform | Gratis? | Setup | WebSocket | Custom Domain |
|----------|---------|-------|-----------|---------------|
| Railway  | ✅ (500 jam/bulan) | Sangat mudah | ✅ | ✅ |
| Render   | ✅ (750 jam/bulan) | Mudah | ✅ | ✅ |
| Heroku   | ❌ ($7/bulan) | Mudah | ✅ | ✅ |
| VPS      | ❌ ($5-10/bulan) | Sulit | ✅ | ✅ |
| Firebase | ✅ | Ribet (butuh permission) | ⚠️ | ✅ |

---

## Testing Setelah Deploy

1. Buka URL yang diberikan (misal: `https://your-app.railway.app`)
2. Coba signup/login
3. Periksa console browser untuk error
4. Test create game

---

## Troubleshooting

### Build gagal di Railway/Render
- Pastikan `package.json` punya script `build`
- Pastikan semua dependencies ada di `dependencies`, bukan `devDependencies`

### Login gagal setelah deploy
- Periksa environment variables sudah benar
- Periksa `ALLOWED_ORIGINS` sudah include domain production
- Periksa Firebase Realtime Database rules

### WebSocket tidak connect
- Pastikan platform support WebSocket (Railway & Render support)
- Update `ALLOWED_ORIGINS` untuk include domain production
