import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vireo React 19 edition — Vite + React + Tailwind v4.
// app.css (shared --ax-* token core) is imported once in src/main.tsx.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
