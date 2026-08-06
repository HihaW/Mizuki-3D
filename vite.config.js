import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Mizuki-3D', 
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200
  }
});
