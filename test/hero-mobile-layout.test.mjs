/**
 * Regressione di layout dell'hero su viewport reali. Copre due difetti distinti
 * osservati su iPhone.
 *
 * 1. BANDA DELL'ARCO. Durante la scarica compariva un rettangolo bianco opaco
 *    dall'elettrodo destro al bordo dello schermo, per tutta l'altezza della
 *    fascia (info_utili/issue.jpeg). Non riproducibile su GPU desktop: lo stesso
 *    fragment shader, montato a misura reale e ispezionato con readPixels su
 *    1220 stati di scarica, satura solo fra gli elettrodi e su 14px d'altezza.
 *    Due correzioni mirate allo shader non l'hanno chiuso (vedi
 *    wave-divider-noise.test.mjs), quindi sotto i 640px la fascia animata non
 *    viene mostrata e WebGL non viene nemmeno montato.
 *
 * 2. OCCHIELLO SOTTO LA NAVBAR. L'header è `fixed`: non sta nel flusso e non
 *    spinge nulla. Il padding superiore dell'hero valeva `pt-16` (64px) contro
 *    un'isola alta 78px, così su schermi bassi — dove la colonna di testo cresce
 *    e smette di stare centrata — l'occhiello scivolava dietro al vetro.
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
  const load = async (width, height) => {
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 3 });
    const page = await ctx.newPage();
    let oglRequests = 0;
    page.on('request', (q) => {
      if (/\/(Renderer|Program|Mesh|Triangle)\.[^/]*\.js$/.test(q.url())) oglRequests++;
    });
    await page.goto(origin, { waitUntil: 'load' });
    // Il mount dell'arco passa da requestIdleCallback con timeout 800ms.
    await page.waitForTimeout(1400);
    const m = await page.evaluate(() => {
      const band = document.querySelector('.energy-flow:not(.energy-flow--cold)');
      const wrap = document.querySelector('.ds-header-wrap');
      const eyebrow = document.querySelector('.hero .ds-eyebrow');
      return {
        headerBottom: wrap.getBoundingClientRect().bottom,
        eyebrowTop: eyebrow.getBoundingClientRect().top,
        bandDisplay: band ? getComputedStyle(band).display : 'assente',
        bandMounted: band ? Boolean(band.dataset.mounted) : false,
      };
    });
    await ctx.close();
    return { ...m, oglRequests, clearance: m.eyebrowTop - m.headerBottom };
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
    [639, 700],
  ];

  for (const [w, h] of PHONES) {
    test(`${w}x${h}: l’occhiello non tocca l’header e la fascia animata non c’è`, async () => {
      const m = await load(w, h);
      assert.ok(
        m.clearance > 0,
        `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px: il padding dell’hero non copre l’isola fissa (${m.headerBottom.toFixed(1)}px)`,
      );
      assert.equal(m.bandDisplay, 'none', 'la fascia animata è visibile sotto i 640px');
      assert.equal(m.bandMounted, false, 'WebGL è stato montato sotto i 640px');
      assert.equal(m.oglRequests, 0, `ogl scaricato su telefono (${m.oglRequests} richieste)`);
    });
  }

  // Sopra la soglia l'arco deve esserci: il fix non deve spegnerlo dove funziona.
  for (const [w, h] of [
    [640, 800],
    [844, 390], // landscape corto: qui l'isola cresce a ~104px, vicino ai 128 di `sm`
    [1280, 900],
  ]) {
    test(`${w}x${h}: l’arco resta montato e l’occhiello resta libero`, async () => {
      const m = await load(w, h);
      assert.equal(m.bandDisplay, 'block', 'la fascia animata è nascosta sopra i 640px');
      assert.ok(m.bandMounted, 'WebGL non è stato montato sopra i 640px');
      assert.ok(m.clearance > 0, `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px`);
    });
  }

  test('la rotazione oltre la soglia monta l’arco, che sotto soglia non era partito', async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    const page = await ctx.newPage();
    await page.goto(origin, { waitUntil: 'load' });
    await page.waitForTimeout(1400);
    const mounted = () => page.evaluate(() => Boolean(document.querySelector('.energy-flow:not(.energy-flow--cold)')?.dataset.mounted));
    assert.equal(await mounted(), false, 'montato in portrait sotto soglia');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(1600);
    assert.equal(await mounted(), true, 'la rotazione oltre 640px non ha montato l’arco');
    await ctx.close();
  });
});
