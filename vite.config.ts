import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  root: './src', // The root of the Vite project is src
  publicDir: '../public', // Public assets are one level up
  build: {
    outDir: '../dist', // Build output goes to dist
    emptyOutDir: true,
    // Optimization #43: Asset Bundling Optimization (Manual Chunking)
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', 'three-stdlib'],
          'react-vendor': ['react', 'react-dom'],
          'cannon-vendor': ['cannon-es'],
          'firebase-vendor': ['firebase/app', 'firebase/database'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
