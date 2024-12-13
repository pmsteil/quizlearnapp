import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared/src'),
      '@backend': path.resolve(__dirname, './backend/src'),
      '@frontend': path.resolve(__dirname, './frontend/src')
    }
  }
});
