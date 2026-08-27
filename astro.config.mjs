// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://amonenergy.it',
  integrations: [sitemap(), icon()],
  vite: {
    plugins: [tailwindcss()],
    // maplibre-gl spawns a Web Worker for tile decoding; Vite's dev-time
    // dependency pre-bundling mangles the worker's own module URL when it's
    // swept into the same optimized bundle, so the worker request hangs at
    // "pending" forever and the map never leaves its unstyled/unloaded
    // state (verified via the network panel: `maplibre-gl-worker.mjs`
    // never resolves). Excluding it from optimizeDeps is the documented
    // fix for this exact symptom.
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
  },
});