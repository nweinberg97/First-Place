import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /First-Place/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/First-Place/' : '/',
  test: { include: ['tests/**/*.test.ts'] },
} as any);
