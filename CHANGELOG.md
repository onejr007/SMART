# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan menggunakan [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- SMART Studio editor full-screen layout (Explorer / Viewport / Properties / Status bar).
- Overlay UI (toast + modal) untuk mengganti alert/prompt/confirm browser.
- README profesional dan `.env.example`.

### Changed
- Engine viewport resize menggunakan ukuran canvas (ResizeObserver) agar stabil pada layout studio.
- Service Worker dev: auto-unregister + clear cache agar tidak ada stale bundle.

### Fixed
- Perbaikan DI token usage (PhysicsInteraction memakai ServiceTokens).
- Pengurangan noise log untuk demo game yang tidak ada di RTDB.

## [3.0.0] - 2026-03-18

### Added
- Portal + engine baseline dengan Firebase, Three.js, cannon-es, dan Zustand.
