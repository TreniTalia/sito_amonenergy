/**
 * Regressione di layout dei grafici a dati (`ChartFrame`), su viewport reali.
 *
 * Due difetti trovati in due giri di verifica successivi, entrambi ora
 * coperti qui:
 *
 * 1. LEGENDA. Era disegnata dentro l'SVG, in colonne di larghezza uguale
 *    calcolata dal numero di voci, senza tenere conto della larghezza reale
 *    del testo: con due voci corte (SFRA) reggeva, ma con tre voci italiane
 *    più lunghe (protezioni AT/MT) le etichette si sovrapponevano, sia a
 *    1440px sia a 390px. Ora è un elenco HTML (`<ul class="chart__legend">`,
 *    `flex-wrap`) in flusso normale sopra la tela: va a capo da solo,
 *    qualunque sia il numero di voci o la larghezza dello schermo.
 *
 * 2. TACCHE DI ASSE. L'etichetta dell'unità (es. "dB", "Hz") è a uno
 *    scostamento fisso dalla prima tacca, ma a 390px il font delle tacche
 *    raddoppia (22 invece di 12): un difetto preesistente (mai la SFRA di
 *    Task 4), mai controllato finché questo test non ha iniziato a misurare
 *    anche le sovrapposizioni fra tacche.
 *
 * Le pagine da controllare non sono un elenco scritto a mano: sono derivate
 * da ROTTE, e per ciascuna si controlla se la pagina contiene un
 * `figure.chart` (il marcatore di un grafico su ChartFrame). Oggi sono SFRA e
 * verifica-protezioni-at-mt; con i Task 6-7 la lista crescerà da sola, senza
 * bisogno di aggiornare questo file.
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

// Stesso filtro di test/tech-layout.test.mjs e test/tech-pages.test.mjs: le
// pagine tecniche sono le rotte `/servizi/<slug>/` di ROTTE, esclusa la hub.
const TECH_ROUTES = ROTTE
  ? ROTTE.filter((r) => r.it.startsWith('/servizi/') && r.it !== '/servizi/')
  : [];

const PAGINE = TECH_ROUTES.flatMap((r) => [r.it.replace(/^\//, ''), r.en.replace(/^\//, '')]);

const LARGHEZZE = [1440, 1024, 390];

// Due rettangoli (da getBoundingClientRect) si sovrappongono se le proiezioni
// su entrambi gli assi si intersecano.
const sovrapposti = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

describe('legenda dei grafici a dati (ChartFrame)', { skip }, () => {
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
  // un grafico ChartFrame (`figure.chart` assente): non tutte le nove pagine
  // tecniche ne hanno uno, oggi.
  const misura = async (pagina, width) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(origin + pagina, { waitUntil: 'load' });
    const m = await page.evaluate(() => {
      const fig = document.querySelector('figure.chart');
      if (!fig) return null;
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      const legenda = [...fig.querySelectorAll('.chart__legend li')].map((li) => ({
        txt: li.textContent.trim(),
        ...box(li),
      }));
      const tacche = [...fig.querySelectorAll('.chart-label text')]
        .map((t) => ({ txt: t.textContent, ...box(t) }))
        // Le tacche `minore` sono `display:none` sotto 768px: rettangolo
        // nullo, da escludere.
        .filter((r) => r.right > r.left && r.bottom > r.top);
      // L'asse verticale (linea x1=X0,y1=Y0,x2=X0,y2=Y1 del gruppo
      // `.chart-axis`): la sua altezza a schermo è l'altezza reale dell'area
      // del grafico, senza dover conoscere qui le costanti interne del
      // viewBox di ChartFrame.
      const assiY = [...fig.querySelectorAll('.chart-axis line')].map((l) => box(l));
      const altezzaPlot = Math.max(...assiY.map((r) => r.bottom - r.top));
      return { legenda, tacche, altezzaPlot };
    });
    await page.close();
    return m;
  };

  for (const pagina of PAGINE) {
    for (const width of LARGHEZZE) {
      test(`${pagina} a ${width}px: legenda e tacche senza sovrapposizioni`, async () => {
        const m = await misura(pagina, width);
        if (!m) return; // pagina senza figure.chart: non pertinente
        assert.ok(m.legenda.length > 0, `${pagina}: figure.chart presente ma nessuna voce di legenda trovata`);

        for (let i = 0; i < m.legenda.length; i++) {
          for (let j = i + 1; j < m.legenda.length; j++) {
            assert.ok(
              !sovrapposti(m.legenda[i], m.legenda[j]),
              `${pagina} @ ${width}px: legenda "${m.legenda[i].txt}" sovrapposta a "${m.legenda[j].txt}"`,
            );
          }
        }
        for (const voce of m.legenda) {
          for (const tacca of m.tacche) {
            assert.ok(
              !sovrapposti(voce, tacca),
              `${pagina} @ ${width}px: legenda "${voce.txt}" sovrapposta alla tacca "${tacca.txt}"`,
            );
          }
        }
        // Tacca contro tacca (assi X e Y, tacche e unità comprese: l'unità
        // non è marcata diversamente dalle altre tacche nel DOM, è un altro
        // <text> dello stesso gruppo `.chart-label`).
        for (let i = 0; i < m.tacche.length; i++) {
          for (let j = i + 1; j < m.tacche.length; j++) {
            assert.ok(
              !sovrapposti(m.tacche[i], m.tacche[j]),
              `${pagina} @ ${width}px: tacca "${m.tacche[i].txt}" sovrapposta a "${m.tacche[j].txt}"`,
            );
          }
        }
      });

      if (width === 390) {
        test(`${pagina} a 390px: area del grafico alta almeno 170px reali`, async () => {
          const m = await misura(pagina, width);
          if (!m) return; // pagina senza figure.chart: non pertinente
          assert.ok(m.altezzaPlot >= 170, `${pagina}: area del grafico alta ${m.altezzaPlot.toFixed(1)}px, attesi almeno 170px`);
        });
      }
    }
  }
});
