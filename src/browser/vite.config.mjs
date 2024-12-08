import { resolve } from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        day06: resolve(__dirname, 'day06.html'),
      },
      output: {
        dir: resolve(__dirname, '../../dist/browser')
      },
    },
  },
});
