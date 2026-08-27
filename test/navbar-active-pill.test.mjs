/**
 * Pill di vetro dell'indicatore di pagina attiva nella navbar desktop.
 *
 * La pill non ha una posizione fissa in CSS: uno script la misura sul link
 * `aria-current="page"` e la sposta lì (le etichette non sono larghe
 * uguali). Il test verifica che, per ciascuna pagina, il link giusto porti
 * `aria-current="page"` e che la pill combaci davvero con la sua geometria
 * — non solo che lo script sia partito senza errori.
 *
 * Parte da `dist` già costruito, come gli altri test Playwright del repo.
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
  '.woff2': 'font/woff2',
};

describe('pill attiva della navbar desktop', { skip }, () => {
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

  const PAGES = [
    ['', 'Home'],
    ['servizi/', 'Servizi'],
    ['lavori/', 'Lavori'],
    ['contatti/', 'Contatti'],
  ];

  for (const [slug, label] of PAGES) {
    test(`/${slug}: "${label}" è aria-current e la pill combacia`, async () => {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${origin}${slug}`, { waitUntil: 'load' });

      const active = page.locator('.ds-nav-link[aria-current="page"]');
      await assert.doesNotReject(active.waitFor({ state: 'visible', timeout: 2000 }));
      await assert.doesNotReject(async () => {
        const text = (await active.textContent())?.trim();
        assert.equal(text, label, `il link "aria-current" è "${text}", atteso "${label}"`);
      });

      const geo = await page.evaluate(() => {
        const nav = document.querySelector('.ds-nav');
        const pill = document.querySelector('.ds-nav-pill');
        const link = document.querySelector('.ds-nav-link[aria-current="page"]');
        const navRect = nav.getBoundingClientRect();
        const pillRect = pill.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        return {
          opacity: getComputedStyle(pill).opacity,
          pillLeft: pillRect.left - navRect.left,
          pillWidth: pillRect.width,
          linkLeft: linkRect.left - navRect.left,
          linkWidth: linkRect.width,
        };
      });

      assert.equal(geo.opacity, '1', 'la pill è invisibile (opacity != 1)');
      assert.ok(
        Math.abs(geo.pillLeft - geo.linkLeft) < 1,
        `pill disallineata: left=${geo.pillLeft.toFixed(1)} vs link left=${geo.linkLeft.toFixed(1)}`,
      );
      assert.ok(
        Math.abs(geo.pillWidth - geo.linkWidth) < 1,
        `larghezza pill errata: pill=${geo.pillWidth.toFixed(1)} vs link=${geo.linkWidth.toFixed(1)}`,
      );

      await ctx.close();
    });
  }
});
