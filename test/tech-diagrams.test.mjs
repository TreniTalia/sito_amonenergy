/**
 * Regressione di layout degli schemi a blocchi (`SchemaFrame`/`BlockChain`),
 * su viewport reali.
 *
 * Prima di Task 8 ogni schema (RCS, CCI, teledistacco A.72, lettura
 * contatori, punti di misura del trasformatore) era SVG a coordinate scritte
 * a mano: nel teledistacco A.72 la voce "Protezione di interfaccia" usciva
 * dal suo riquadro, a qualunque larghezza di schermo. Ora ogni box è un
 * `<g data-schema-box>` con un `<rect>` e dei `<text>`: il test misura, per
 * ciascun box di ciascuno schema, che nessun testo esca a sinistra o a destra
 * del proprio rettangolo.
 *
 * Le pagine da controllare non sono un elenco scritto a mano: sono derivate
 * da ROTTE, filtrando quelle il cui contenuto Markdown usa uno dei cinque
 * diagrammi a blocchi (`catena-rcs`, `osservabilita-controllabilita`,
 * `catena-a72`, `catena-contatori`, `punti-misura-trasformatore`), così una
 * sesta pagina con schema non richiederebbe di toccare questo file.
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

const { ROTTE } = await import('../src/i18n/routes.ts').catch(() => ({ ROTTE: null }));

// Le pagine tecniche sono le rotte `/servizi/<slug>/` di ROTTE, esclusa la
// hub: stesso filtro di test/charts-layout.test.mjs e test/tech-layout.test.mjs.
const TECH_ROUTES = ROTTE ? ROTTE.filter((r) => r.it.startsWith('/servizi/') && r.it !== '/servizi/') : [];

const PAGINE = TECH_ROUTES.flatMap((r) => [r.it.replace(/^\//, ''), r.en.replace(/^\//, '')]);

const LARGHEZZE = [1440, 390];

describe('schemi a blocchi (SchemaFrame/BlockChain)', { skip }, () => {
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

  // Misura una pagina a una data larghezza. Ritorna null se la pagina non ha
  // uno schema a blocchi (`[data-schema-box]` assente): non tutte le nove
  // pagine tecniche ne hanno uno, oggi cinque su nove.
  const misura = async (pagina, width) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(origin + pagina, { waitUntil: 'load' });
    const m = await page.evaluate(() => {
      const box = document.querySelectorAll('[data-schema-box]');
      if (box.length === 0) return null;
      const fuori = [];
      for (const g of box) {
        const r = g.querySelector('rect').getBoundingClientRect();
        for (const t of g.querySelectorAll('text')) {
          const b = t.getBoundingClientRect();
          if (b.left < r.left - 0.5 || b.right > r.right + 0.5) fuori.push(t.textContent);
        }
      }
      return { count: box.length, fuori };
    });
    await page.close();
    return m;
  };

  for (const pagina of PAGINE) {
    for (const width of LARGHEZZE) {
      test(`${pagina} a ${width}px: testo sempre dentro il box`, async () => {
        const m = await misura(pagina, width);
        if (!m) return; // pagina senza schema a blocchi: non pertinente
        assert.ok(m.count >= 3, `${pagina}: attesi almeno 3 box, trovati ${m.count}`);
        assert.deepEqual(m.fuori, [], `${pagina} @ ${width}px: testo fuori dal box: ${m.fuori.join(', ')}`);
      });
    }
  }

  test('almeno una pagina ha uno schema a blocchi rilevato', async () => {
    const risultati = await Promise.all(PAGINE.map((p) => misura(p, 1440)));
    const conSchema = risultati.filter(Boolean);
    assert.ok(conSchema.length >= 5, `attese almeno 5 pagine con schema (IT+EN delle 5 diagnostiche a blocchi), trovate ${conSchema.length}`);
  });
});
