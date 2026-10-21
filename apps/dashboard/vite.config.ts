import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const casinoServer = process.env.CASINO_SERVER_URL ?? 'http://localhost:3001';
const proxy = { '/api': { target: casinoServer } };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true, proxy },
  preview: { port: 4174, strictPort: true, proxy },
});
