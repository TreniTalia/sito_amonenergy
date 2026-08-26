/**
 * Regressione di layout e di rete dell'hero su viewport reali.
 *
 * 1. OCCHIELLO SOTTO LA NAVBAR. L'header è `fixed`: non sta nel flusso e non
 *    spinge nulla. Il padding superiore dell'hero valeva `pt-16` (64px) contro
 *    un'isola alta 78px, così su schermi bassi — dove la colonna di testo cresce
 *    e smette di stare centrata — l'occhiello scivolava dietro al vetro.
 *
 * 2. VIDEO DI FONDO. Il fondale dell'hero è un video (pattern di circuito
 *    gradato sui colori del marchio). Sotto i 768px, e con
 *    `prefers-reduced-motion`, non deve girare *né scaricare*: il gating vive
 *    nell'attributo `media` delle <source>, che è l'unica cosa capace di
 *    impedire il download. Il `display: none` in CSS è solo la cintura di
 *    sicurezza per i browser che ignorano `media`, quindi il test controlla
 *    entrambi — e soprattutto conta i byte, perché è quello che pagherebbe
 *    l'utente in 4G.
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è, perche' `npm
 * test` deve restare eseguibile senza una build.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const hasDist = existsSync(path.join(DIST, 'index.html'));

let playwright = null;
try {
  playwright = await import('playwright');
} catch {
  /* devDependency assente: i test si saltano */
}

const skip = !hasDist
  ? 'dist assente: esegui `npm run build` prima di questo test'
  : !playwright
    ? 'playwright non installato'
    : false;

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.json': 'application/json',
};

describe('layout dell’hero su viewport reali', { skip }, () => {
  let server;
  let browser;
  let origin;

  before(async () => {
    server = createServer((q, s) => {
      let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
      try {
        if (statSync(f).isDirectory()) f = path.join(f, 'index.html');
      } catch {
        f += '.html';
      }
      try {
        const body = readFileSync(f);
        s.setHeader('content-type', MIME[path.extname(f)] ?? 'application/octet-stream');
        // Il media element chiede byte-range: senza `accept-ranges` alcuni
        // browser rifiutano di partire, e il test misurerebbe il server, non la
        // pagina.
        s.setHeader('accept-ranges', 'bytes');
        s.end(body);
      } catch {
        s.statusCode = 404;
        s.end('404');
      }
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    origin = `http://127.0.0.1:${server.address().port}/`;
    browser = await playwright.chromium.launch();
  });

  after(async () => {
    await browser?.close();
    server?.close();
  });

  /** Apre la home a una viewport data e restituisce le misure che ci interessano. */
  const load = async (width, height, { reducedMotion = 'no-preference' } = {}) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3, reducedMotion });
    const page = await ctx.newPage();
    let videoBytes = 0;
    let videoRequests = 0;
    page.on('request', (q) => {
      if (/\.(mp4|webm)(\?|$)/.test(q.url())) videoRequests++;
    });
    page.on('response', async (r) => {
      if (!/\.(mp4|webm)(\?|$)/.test(r.url())) return;
      try {
        videoBytes += (await r.body()).length;
      } catch {
        /* risposta annullata: i byte non sono arrivati */
      }
    });
    await page.goto(origin, { waitUntil: 'load' });
    // L'avvio del video passa da requestIdleCallback con timeout 1200ms.
    await page.waitForTimeout(2000);
    const m = await page.evaluate(() => {
      const wrap = document.querySelector('.ds-header-wrap');
      const eyebrow = document.querySelector('.hero .ds-eyebrow');
      const video = document.querySelector('.hero .hero-video');
      const poster = document.querySelector('.hero .hero-media');
      return {
        headerBottom: wrap.getBoundingClientRect().bottom,
        eyebrowTop: eyebrow.getBoundingClientRect().top,
        videoDisplay: video ? getComputedStyle(video).display : 'assente',
        // networkState 3 = NETWORK_NO_SOURCE: nessuna <source> ha combaciato.
        videoNetworkState: video ? video.networkState : null,
        videoCurrentSrc: video ? video.currentSrc : null,
        posterPresent: Boolean(poster),
      };
    });
    await ctx.close();
    return { ...m, videoBytes, videoRequests, clearance: m.eyebrowTop - m.headerBottom };
  };

  // Il caso peggiore e' lo schermo *basso*, non stretto: e' l'altezza che fa
  // crescere la colonna oltre lo spazio centrabile e mette in gioco il padding.
  const PHONES = [
    [320, 568],
    [360, 640],
    [360, 740],
    [375, 667],
    [390, 844],
    [430, 932],
    [767, 700],
  ];

  for (const [w, h] of PHONES) {
    test(`${w}x${h}: l’occhiello non tocca l’header e il video non scarica`, async () => {
      const m = await load(w, h);
      assert.ok(
        m.clearance > 0,
        `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px: il padding dell’hero non copre l’isola fissa (${m.headerBottom.toFixed(1)}px)`,
      );
      assert.equal(m.videoDisplay, 'none', 'il video di fondo è visibile sotto i 768px');
      assert.equal(m.videoCurrentSrc, '', 'una <source> ha combaciato sotto i 768px');
      assert.equal(m.videoNetworkState, 3, 'il video non è in NETWORK_NO_SOURCE sotto i 768px');
      assert.equal(m.videoBytes, 0, `video scaricato su telefono (${m.videoBytes} byte in ${m.videoRequests} richieste)`);
      assert.ok(m.posterPresent, 'manca il fermo-immagine, che è l’unico fondale sotto i 768px');
    });
  }

  // Sopra la soglia il video deve esserci: il gating non deve spegnerlo dove
  // serve.
  for (const [w, h] of [
    [768, 800],
    [844, 390], // landscape corto: qui l'isola cresce a ~104px
    [1280, 900],
  ]) {
    test(`${w}x${h}: il video di fondo parte e l’occhiello resta libero`, async () => {
      const m = await load(w, h);
      assert.equal(m.videoDisplay, 'block', 'il video di fondo è nascosto sopra i 768px');
      assert.match(m.videoCurrentSrc, /pattern-home(\.av1)?\.mp4$/, 'nessuna <source> ha combaciato sopra i 768px');
      assert.ok(m.videoBytes > 0, 'il video non è stato scaricato sopra i 768px');
      assert.ok(m.clearance > 0, `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px`);
    });
  }

  test('con prefers-reduced-motion il video non parte nemmeno su desktop', async () => {
    const m = await load(1280, 900, { reducedMotion: 'reduce' });
    assert.equal(m.videoDisplay, 'none', 'il video gira con prefers-reduced-motion');
    assert.equal(m.videoCurrentSrc, '', 'una <source> ha combaciato con prefers-reduced-motion');
    assert.equal(m.videoBytes, 0, `video scaricato con prefers-reduced-motion (${m.videoBytes} byte)`);
    assert.ok(m.posterPresent, 'manca il fermo-immagine con prefers-reduced-motion');
  });
});
