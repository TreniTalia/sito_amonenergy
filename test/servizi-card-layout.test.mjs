/**
 * Regressione di layout delle card della pagina Servizi, su viewport reali.
 *
 * 1. CARD DI DIAGNOSTICA ALTE UGUALI. Le tre card di "Ingegneria elettrica"
 *    stanno in una griglia, ma il riquadro di ciascuna non riempiva la cella:
 *    appena i testi andavano a capo in modo diverso, le card divergevano in
 *    altezza (a 1024, 1280 e 1920px, non a 1440, dove il difetto non si vedeva).
 *
 * 2. RIGHE ALLINEATE NELLE CARD RCS/CCI. Le due card usano `subgrid` per
 *    allineare tag, riga partner e link. Il link "Come funziona" aggiunto come
 *    sesto elemento finiva nella riga del partner, sopra il logo Teamware.
 *
 * 3. INDICE DEGLI APPROFONDIMENTI IN COLONNA. Le pagine tecniche erano una
 *    fila di pillole a capo libero. Ora sono due colonne (diagnostica, poi
 *    controllo), una riga per pagina: stesse righe allineate a sinistra e
 *    larghe uguali dentro ogni colonna, nessuna pagina dimenticata.
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const hasDist = existsSync(path.join(DIST, 'servizi', 'index.html'));

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

const PAGINE = ['servizi/', 'en/services/'];
const LARGHEZZE = [1024, 1280, 1440, 1920];

describe('card della pagina Servizi', { skip }, () => {
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

  const misura = async (pagina, width) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(origin + pagina, { waitUntil: 'load' });
    const m = await page.evaluate(() => {
      const box = (el) => el.getBoundingClientRect();
      const cards = [...document.querySelectorAll('#ingegneria-elettrica .ds-card-service')].map((c) => Math.round(box(c).height));
      const [rcs, cci] = document.querySelectorAll('.control-cards > article');
      const link = (a) => a.querySelector('.dettaglio-link');
      const tags = (a) => a.querySelector('ul');
      const partner = cci.querySelector('.partner-chip').parentElement;
      return {
        cards,
        linkTop: [Math.round(box(link(rcs)).top), Math.round(box(link(cci)).top)],
        tagsTop: [Math.round(box(tags(rcs)).top), Math.round(box(tags(cci)).top)],
        partnerBottom: Math.round(box(partner).bottom),
        cciLinkTop: Math.round(box(link(cci)).top),
        indice: [...document.querySelectorAll('.tech-index-list')].map((ol) =>
          [...ol.querySelectorAll('.tech-index-row')].map((a) => {
            const r = box(a);
            return { left: Math.round(r.left), width: Math.round(r.width) };
          }),
        ),
      };
    });
    await page.close();
    return m;
  };

  for (const pagina of PAGINE) {
    for (const width of LARGHEZZE) {
      test(`${pagina} a ${width}px: card di diagnostica alte uguali`, async () => {
        const { cards } = await misura(pagina, width);
        assert.equal(cards.length, 3);
        assert.ok(Math.max(...cards) - Math.min(...cards) <= 1, `altezze diverse: ${cards.join(', ')}`);
      });

      test(`${pagina} a ${width}px: card RCS/CCI allineate e senza sovrapposizioni`, async () => {
        const m = await misura(pagina, width);
        assert.ok(Math.abs(m.tagsTop[0] - m.tagsTop[1]) <= 1, `tag sfalsati: ${m.tagsTop.join(' / ')}`);
        assert.ok(Math.abs(m.linkTop[0] - m.linkTop[1]) <= 1, `link sfalsati: ${m.linkTop.join(' / ')}`);
        assert.ok(m.cciLinkTop >= m.partnerBottom, `il link CCI (top ${m.cciLinkTop}) copre la riga partner (bottom ${m.partnerBottom})`);
      });

      test(`${pagina} a ${width}px: indice degli approfondimenti in due colonne ordinate`, async () => {
        const { indice } = await misura(pagina, width);
        assert.deepEqual(indice.map((c) => c.length), [5, 4], 'attese 5 pagine di diagnostica e 4 di controllo');
        for (const colonna of indice) {
          const lefts = new Set(colonna.map((r) => r.left));
          const widths = new Set(colonna.map((r) => r.width));
          assert.equal(lefts.size, 1, `righe non allineate a sinistra: ${[...lefts].join(', ')}`);
          assert.equal(widths.size, 1, `righe di larghezza diversa: ${[...widths].join(', ')}`);
        }
        assert.ok(indice[1][0].left > indice[0][0].left, 'le due colonne devono stare affiancate da 1024px in su');
      });
    }
  }
});
