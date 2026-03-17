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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'three-vendor';
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('cannon')) return 'cannon-vendor';
            if (id.includes('firebase')) return 'firebase-vendor';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
