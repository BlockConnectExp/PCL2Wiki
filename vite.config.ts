import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative assets keep one build usable on both the Pages project path and the
// custom domain. Routing uses hash history for the same reason.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
  },
});

