import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const casinoServer = process.env.CASINO_SERVER_URL ?? 'http://localhost:3001';
const proxy = { '/ws': { target: casinoServer, ws: true } };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true, proxy },
  preview: { port: 4173, strictPort: true, proxy },
  build: { chunkSizeWarningLimit: 2_000 },
});
