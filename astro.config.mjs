// @ts-check
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import { ROTTE } from './src/i18n/routes.ts';

const SITE = 'https://amonenergy.it';

// L'opzione `i18n` di @astrojs/sitemap accoppia le rotte confrontando il
// pathname a meno del prefisso di lingua: funziona solo quando lo slug è lo
// stesso nelle due lingue (per questo produceva xhtml:link corretti solo per
// "/" ↔ "/en/" e "/privacy-policy/" ↔ "/en/privacy-policy/" — l'unica coppia
// oltre alla home il cui slug coincide). Le altre tredici coppie hanno slug
// tradotti (`/azienda/` ↔ `/en/company/`, ecc.) e restavano senza hreflang
// nella sitemap: verificato ispezionando `dist/sitemap-0.xml` dopo il primo
// build del mirror inglese. `serialize` sostituisce quell'euristica con la
// stessa fonte di verità del resto del sito, `ROTTE` in `src/i18n/routes.ts`.
const HREFLANG = { it: 'it-IT', en: 'en-GB' };

/** @param {{url: string}} item */
function serialize(item) {
  const path = item.url.replace(SITE, '');
  const rotta = ROTTE.find((r) => r.it === path || r.en === path);
  if (!rotta) return item;
  return {
    ...item,
    links: [
      { lang: HREFLANG.it, url: `${SITE}${rotta.it}` },
      { lang: HREFLANG.en, url: `${SITE}${rotta.en}` },
    ],
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  // Italiano senza prefisso (gli URL già indicizzati non si spostano),
  // inglese sotto /en/.
  i18n: {
    locales: ['it', 'en'],
    defaultLocale: 'it',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({ serialize }),
    icon(),
  ],
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