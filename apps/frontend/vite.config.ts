import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('axios')) return 'network';
          if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
          return 'vendor';
        },
      },
    },
  },
});
