# Contributing

Terima kasih sudah ingin berkontribusi ke SMART Metaverse Portal & Engine.

## Development Setup

### Prasyarat
- Node.js >= 18
- Firebase CLI (untuk deploy rules/hosting)

### Install

```bash
npm install
```

### Environment Variables

Copy template:

```bash
copy .env.example .env
```

Isi semua value `VITE_FIREBASE_*` sesuai Firebase project kamu.

### Run Dev Server

```bash
npm run dev
```

## Scripts Wajib Sebelum PR

```bash
npm run typecheck
npm run lint
npm run build
```

## Konvensi Code

### TypeScript & React
- Gunakan TypeScript dengan typing yang jelas.
- Hindari `any` kecuali memang tidak ada alternatif yang masuk akal.
- Jangan gunakan `alert/prompt/confirm` browser. Pakai overlay UI (toast/modal).

### Styling
- Ikuti style existing (CSS file per component).
- Utamakan layout responsif untuk portal dan studio editor.

### Security
- Jangan commit secrets/kredensial.
- Jangan hardcode project-id Firebase di docs maupun code.

## Pull Request Checklist

- [ ] Deskripsi perubahan jelas + screenshot/GIF jika mengubah UI
- [ ] `npm run typecheck` lulus
- [ ] `npm run lint` lulus
- [ ] `npm run build` lulus
- [ ] Tidak menambahkan secrets
- [ ] Perubahan UI tidak menggunakan alert/prompt/confirm

## Reporting Issues

Gunakan issue untuk bug/feature request. Untuk masalah keamanan, lihat [SECURITY.md](SECURITY.md).
