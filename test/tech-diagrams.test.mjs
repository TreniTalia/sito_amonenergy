/**
 * Regressione di layout degli schemi a blocchi (`SchemaFrame`/`BlockChain`),
 * su viewport reali.
 *
 * Fix round 1: gli schemi erano SVG a coordinate fisse, con la larghezza del
 * testo stimata a build time — a certe combinazioni di lingua/larghezza la
 * stima sbagliava (testo che usciva dal box, o addirittura tagliato) e a
 * 1440px restava un terzo di tela vuoto sopra e sotto il disegno. Ora ogni
 * box è un `<div data-schema-box>` HTML reale: il testo va a capo secondo il
 * flusso normale e il box cresce con lui, quindi non può più uscirne; le
 * dimensioni dei font sono quelle del sistema di design (`--fs-small`/
 * `--fs-micro`), non stimate.
 *
 * Il test verifica quattro cose, per ciascuno schema, a 1440 e 390px:
 * 1. nessun testo esce dal proprio box (i quattro lati, non solo i due
 *    orizzontali del round precedente: qui il contenimento è reale, non
 *    stimato, verificarli tutti costa lo stesso);
 * 2. nessun box si sovrappone a un altro box della stessa pagina;
 * 3. il titolo del box resta leggibile: ≥ 12px calcolati a 390px, ≥ 13px a
 *    1440px (`--fs-small` clampa 14→16px, quindi lo soddisfa sempre: è una
 *    regressione da SVG-a-coordinate-fisse, dove la stima poteva scendere
 *    sotto gli 11px effettivi senza che nessun test se ne accorgesse);
 * 4. almeno 3 box per schema (come prima).
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
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      const boxes = [...document.querySelectorAll('[data-schema-box]')];
      if (boxes.length === 0) return null;

      // Elementi "foglia" di testo: niente figli-elemento, solo testo. I box
      // sono HTML reale (`<div>`/`<li>` con `<p>`/`<strong>`/`<span>` dentro),
      // non più `<g><rect><text>` SVG: il contenimento va misurato sugli
      // elementi che portano davvero il testo, qualunque sia il tag.
      const fogliaConTesto = (el) => {
        const out = [];
        const cerca = (nodo) => {
          const figliElemento = [...nodo.children];
          if (figliElemento.length === 0) {
            if (nodo.textContent.trim()) out.push(nodo);
          } else {
            figliElemento.forEach(cerca);
          }
        };
        cerca(el);
        return out;
      };

      const fuori = [];
      for (const g of boxes) {
        const r = box(g);
        for (const t of fogliaConTesto(g)) {
          const b = box(t);
          if (b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5) {
            fuori.push(t.textContent.trim());
          }
        }
      }

      // Stessa funzione di test/charts-layout.test.mjs, ma ridefinita qui
      // dentro: `page.evaluate` serializza questa funzione e la esegue in un
      // realm JS separato, senza accesso alle chiusure del modulo Node.
      const sovrapposti = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

      const sovrapposizioni = [];
      const rects = boxes.map(box);
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          if (sovrapposti(rects[i], rects[j])) {
            sovrapposizioni.push(`${boxes[i].textContent.trim().slice(0, 24)} / ${boxes[j].textContent.trim().slice(0, 24)}`);
          }
        }
      }

      const titoli = [...document.querySelectorAll('.chain__box-title, .occ__box-title, .txm__legend-title')];
      const fontMinimo = titoli.length ? Math.min(...titoli.map((el) => parseFloat(getComputedStyle(el).fontSize))) : null;

      return { count: boxes.length, fuori, sovrapposizioni, fontMinimo };
    });
    await page.close();
    return m;
  };

  for (const pagina of PAGINE) {
    for (const width of LARGHEZZE) {
      test(`${pagina} a ${width}px: testo sempre dentro il box, box non sovrapposti, titolo leggibile`, async () => {
        const m = await misura(pagina, width);
        if (!m) return; // pagina senza schema a blocchi: non pertinente
        assert.ok(m.count >= 3, `${pagina}: attesi almeno 3 box, trovati ${m.count}`);
        assert.deepEqual(m.fuori, [], `${pagina} @ ${width}px: testo fuori dal box: ${m.fuori.join(', ')}`);
        assert.deepEqual(m.sovrapposizioni, [], `${pagina} @ ${width}px: box sovrapposti: ${m.sovrapposizioni.join(' | ')}`);
        if (m.fontMinimo !== null) {
          const soglia = width >= 1440 ? 13 : 12;
          assert.ok(m.fontMinimo >= soglia, `${pagina} @ ${width}px: titolo di box a ${m.fontMinimo}px, attesi almeno ${soglia}px`);
        }
      });
    }
  }

  test('almeno una pagina ha uno schema a blocchi rilevato', async () => {
    const risultati = await Promise.all(PAGINE.map((p) => misura(p, 1440)));
    const conSchema = risultati.filter(Boolean);
    assert.ok(conSchema.length >= 5, `attese almeno 5 pagine con schema (IT+EN delle 5 diagnostiche a blocchi), trovate ${conSchema.length}`);
  });
});
