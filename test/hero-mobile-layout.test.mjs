/**
 * Regressione di layout e di fondale dell'hero su viewport reali.
 *
 * 1. OCCHIELLO SOTTO LA NAVBAR. L'header è `fixed`: non sta nel flusso e non
 *    spinge nulla. Il padding superiore dell'hero valeva `pt-16` (64px) contro
 *    un'isola alta 78px, così su schermi bassi — dove la colonna di testo cresce
 *    e smette di stare centrata — l'occhiello scivolava dietro al vetro.
 *
 * 2. UN SOLO FONDALE. Il fondale dell'hero è il digital twin in WebGL, e
 *    nient'altro. Prima sotto ci stavano un video di pattern e il suo
 *    fermo-immagine: si affacciavano ogni volta che il canvas non stava
 *    dipingendo — il primo frame, `prefers-reduced-motion`, un contesto perso —
 *    e vedere comparire un fondale diverso da quello della scena era peggio che
 *    non vedere nulla. Il test verifica che di quei due non resti traccia a
 *    nessuna larghezza, che il canvas ci sia sempre e dipinga (`is-ready`)
 *    anche con `prefers-reduced-motion`, e che sotto ci sia il navy pieno della
 *    sezione, che è anche il colore con cui il canvas pulisce.
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
    // Il canvas si monta dopo il primo paint e sfuma in 0.5s.
    await page.waitForTimeout(2000);
    const m = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const wrap = document.querySelector('.ds-header-wrap');
      const eyebrow = document.querySelector('.hero .ds-eyebrow');
      const twin = document.querySelector('.hero .hero-twin');
      return {
        headerBottom: wrap.getBoundingClientRect().bottom,
        eyebrowTop: eyebrow.getBoundingClientRect().top,
        heroBg: getComputedStyle(hero).backgroundColor,
        legacyBackdrops: hero.querySelectorAll('video, .hero-media, picture, img').length,
        twinPresent: Boolean(twin),
        twinDisplay: twin ? getComputedStyle(twin).display : 'assente',
        twinReady: twin ? twin.classList.contains('is-ready') : false,
        twinWidth: twin ? Math.round(twin.getBoundingClientRect().width) : 0,
      };
    });
    await ctx.close();
    return { ...m, videoBytes, videoRequests, clearance: m.eyebrowTop - m.headerBottom };
  };

  // navy-950 (#0A2A44): è il fondo pieno della sezione ed è lo stesso colore con
  // cui il canvas pulisce, così nel frame prima che dipinga non c'è stacco.
  const NAVY_950 = 'rgb(10, 42, 68)';

  /** Le verifiche sul fondale valgono identiche a ogni larghezza. */
  const assertBackdrop = (m, width) => {
    assert.equal(
      m.legacyBackdrops,
      0,
      `nell'hero è tornato un fondale che non è il digital twin (${m.legacyBackdrops} fra video/picture/img)`,
    );
    assert.ok(m.twinPresent, 'manca il canvas del digital twin, che è l’unico fondale dell’hero');
    assert.notEqual(m.twinDisplay, 'none', 'il canvas è nascosto: sotto resterebbe scoperto il fondo della sezione');
    assert.ok(m.twinReady, 'il canvas non ha dipinto nemmeno un frame');
    assert.equal(m.heroBg, NAVY_950, 'l’hero non ha il fondo navy pieno sotto al canvas');
    assert.ok(
      Math.abs(m.twinWidth - width) <= 1,
      `il canvas non copre la larghezza dell’hero (${m.twinWidth}px su ${width}px)`,
    );
    assert.equal(m.videoBytes, 0, `scaricato un video di fondo (${m.videoBytes} byte in ${m.videoRequests} richieste)`);
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
    test(`${w}x${h}: l’occhiello resta libero e il fondale è solo il digital twin`, async () => {
      const m = await load(w, h);
      assert.ok(
        m.clearance > 0,
        `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px: il padding dell’hero non copre l’isola fissa (${m.headerBottom.toFixed(1)}px)`,
      );
      assertBackdrop(m, w);
    });
  }

  // Il digital twin non è un video: gira a ogni larghezza, senza gating.
  for (const [w, h] of [
    [768, 800],
    [844, 390], // landscape corto: qui l'isola cresce a ~104px
    [1280, 900],
    [1920, 1080],
  ]) {
    test(`${w}x${h}: il digital twin dipinge e l’occhiello resta libero`, async () => {
      const m = await load(w, h);
      assertBackdrop(m, w);
      assert.ok(m.clearance > 0, `l’occhiello invade l’header di ${(-m.clearance).toFixed(1)}px`);
    });
  }

  // È il caso che prima scopriva il fondale: il canvas veniva nascosto e sotto
  // riemergeva il vecchio pattern. Ora resta al suo posto e dipinge un fermo.
  test('con prefers-reduced-motion il canvas resta e dipinge un fotogramma fermo', async () => {
    const m = await load(1280, 900, { reducedMotion: 'reduce' });
    assertBackdrop(m, 1280);
  });
});
