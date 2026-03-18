# Security Policy

## Supported Versions

Project ini masih dalam pengembangan aktif. Gunakan versi terbaru untuk mendapatkan patch keamanan terbaru.

## Reporting a Vulnerability

Jika kamu menemukan kerentanan keamanan:
- Jangan buat issue publik yang berisi detail exploit.
- Siapkan informasi berikut:
  - Ringkasan kerentanan
  - Dampak (impact) dan skenario serangan
  - Langkah reproduksi (PoC) bila memungkinkan
  - Environment (browser/OS) dan versi project

Kirim laporan melalui jalur privat:
- Email: security@example.com (ganti dengan email tim kamu)

Kami akan merespons secepat mungkin. Target SLA (best effort):
- 72 jam: acknowledgement
- 7 hari: penilaian impact + rencana mitigasi

## Hardening Checklist (High-Level)

- Jangan commit secrets (`.env` sudah di-ignore).
- Validasi & sanitasi input user-generated (DOMPurify).
- Pastikan Firebase Rules deny-by-default untuk path sensitif.
- Batasi `.write` hanya untuk pemilik data (owner).
- Batasi ukuran payload & kedalaman data (rules + client-side validation).
