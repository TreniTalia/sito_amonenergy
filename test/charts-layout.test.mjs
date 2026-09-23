/**
 * Regressione di layout dei grafici a dati (`ChartFrame`), su viewport reali.
 *
 * 1. LEGENDA. È un elenco HTML (`<ul class="chart__legend">`, `flex-wrap`)
 *    in flusso normale sopra la tela, non testo SVG in colonne calcolate
 *    dal numero di voci: va a capo da sola, qualunque sia il numero di voci
 *    o la larghezza dello schermo. Le voci non si sovrappongono fra loro né
 *    alle tacche, e stanno dentro la cornice interna del telaio, lontane
 *    dalle tacche d'angolo: la cornice circonda legenda e grafico insieme.
 *
 * 2. TACCHE DI ASSE. Nessuna tacca si sovrappone a un'altra (unità
 *    comprese: sono altri `<text>` dello stesso gruppo `.chart-label`),
 *    nessuna esce dalla cornice interna o tocca una tacca d'angolo, e
 *    nessun asse ripete come etichetta a sé un'unità che le sue tacche
 *    portano già («Hz» sotto «2 MHz»).
 *
 * 3. LEGGIBILITÀ. Il testo SVG si misura in unità di viewBox (640 di
 *    larghezza), quindi in px reali vale font-size × larghezza della tela /
 *    640: da 1024px la figura sta nella colonna stretta accanto al testo
 *    (circa 400px a 1024, 520px a 1280) e 12 unità varrebbero meno di 8px.
 *    Ogni etichetta deve valere almeno 11px effettivi a 1440, 1280, 1024 e
 *    390px.
 *
 * Le pagine da controllare non sono un elenco scritto a mano: sono derivate
 * da ROTTE, e si tengono quelle il cui HTML costruito contiene un
 * `figure.chart` (il marcatore di un grafico su ChartFrame). Un grafico
 * nuovo entra nel controllo da solo, senza bisogno di aggiornare questo
 * file.
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { avviaServer, motivoSalto, playwright, senzaMedia, DIST } from './helpers/dist-server.mjs';

const skip = motivoSalto('servizi/index.html');

const { ROTTE } = await import('../src/i18n/routes.ts').catch(() => ({ ROTTE: null }));

// Stesso filtro di test/tech-layout.test.mjs e test/tech-pages.test.mjs: le
// pagine tecniche sono le rotte `/servizi/<slug>/` di ROTTE, esclusa la hub.
const TECH_ROUTES = ROTTE
  ? ROTTE.filter((r) => r.it.startsWith('/servizi/') && r.it !== '/servizi/')
  : [];

// Solo le pagine con un grafico: leggere l'HTML costruito evita di aprire
// nel browser, a ogni larghezza, le pagine che hanno uno schema a blocchi.
const conGrafico = (pagina) => {
  const f = path.join(DIST, pagina, 'index.html');
  return existsSync(f) && /<figure class="chart[ "]/.test(readFileSync(f, 'utf8'));
};
const PAGINE = TECH_ROUTES.flatMap((r) => [r.it.replace(/^\//, ''), r.en.replace(/^\//, '')]).filter(conGrafico);

const LARGHEZZE = [1440, 1280, 1024, 390, 320];
// A 320px la tela è larga 280px: servirebbero 25 unità di viewBox per gli
// 11px, e le etichette non starebbero più nei margini del disegno. Lì si
// controllano sovrapposizioni e cornice, non la dimensione.
const LARGHEZZE_11PX = [1440, 1280, 1024, 390];

// Due rettangoli (da getBoundingClientRect) si sovrappongono se le proiezioni
// su entrambi gli assi si intersecano.
const sovrapposti = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const dentro = (a, b, tol = 0.5) => a.left >= b.left - tol && a.right <= b.right + tol && a.top >= b.top - tol && a.bottom <= b.bottom + tol;

describe('grafici a dati (ChartFrame)', { skip }, () => {
  let server;
  let browser;
  let origin;

  before(async () => {
    server = await avviaServer();
    origin = server.origin;
    browser = await playwright.chromium.launch();
  });

  after(async () => {
    await browser?.close();
    await server?.close();
  });

  // Misura una pagina a una data larghezza, una sola volta: più test leggono
  // le stesse misure.
  const cache = new Map();
  const misura = (pagina, width) => {
    const k = `${pagina}@${width}`;
    if (!cache.has(k)) cache.set(k, misuraPagina(pagina, width));
    return cache.get(k);
  };
  const misuraPagina = async (pagina, width) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await senzaMedia(page);
    await page.goto(origin + pagina, { waitUntil: 'load' });
    const m = await page.evaluate(() => {
      const fig = document.querySelector('figure.chart');
      const box = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      // La tela è l'SVG con `role="img"`: gli altri SVG della figura sono i
      // campioni di colore della legenda.
      const svg = fig.querySelector('svg[role="img"]');
      const scala = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const legenda = [...fig.querySelectorAll('.chart__legend li')].map((li) => ({
        txt: li.textContent.trim(),
        ...box(li),
      }));
      const tacche = [...fig.querySelectorAll('.chart-label text')]
        .map((t) => ({
          txt: t.textContent,
          unita: t.classList.contains('chart-label__unit') ? t.dataset.asse : null,
          px: parseFloat(getComputedStyle(t).fontSize) * scala,
          ...box(t),
        }))
        // Le tacche `minore` sono nascoste nelle figure strette: rettangolo
        // nullo, da escludere.
        .filter((r) => r.right > r.left && r.bottom > r.top);
      // Tacche d'angolo del telaio: la cornice interna va dall'angolo
      // alto-sinistro a quello basso-destro.
      const angoli = [...fig.querySelectorAll('.fc-corner')].map(box);
      const tl = fig.querySelector('.fc-corner--tl');
      const br = fig.querySelector('.fc-corner--br');
      const cornice = tl && br ? { left: box(tl).left, top: box(tl).top, right: box(br).right, bottom: box(br).bottom } : null;
      // L'asse verticale (linea x1=X0,y1=Y0,x2=X0,y2=Y1 del gruppo
      // `.chart-axis`): la sua altezza a schermo è l'altezza reale dell'area
      // del grafico, senza dover conoscere qui le costanti interne del
      // viewBox di ChartFrame.
      const assiY = [...fig.querySelectorAll('.chart-axis line')].map((l) => box(l));
      const altezzaPlot = Math.max(...assiY.map((r) => r.bottom - r.top));
      const tacchePerAsse = {
        x: [...fig.querySelectorAll('.chart-label text[data-asse="x"]:not(.chart-label__unit)')].map((t) => t.textContent),
      };
      return { legenda, tacche, angoli, cornice, altezzaPlot, tacchePerAsse };
    });
    await page.close();
    return m;
  };

  test('le pagine con un grafico a dati sono le quattro diagnostiche, in due lingue', () => {
    assert.equal(PAGINE.length, 8, `attese 8 pagine con figure.chart, trovate ${PAGINE.length}: ${PAGINE.join(', ')}`);
  });

  for (const pagina of PAGINE) {
    for (const width of LARGHEZZE) {
      test(`${pagina} a ${width}px: legenda e tacche senza sovrapposizioni`, async () => {
        const m = await misura(pagina, width);
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
        for (let i = 0; i < m.tacche.length; i++) {
          for (let j = i + 1; j < m.tacche.length; j++) {
            assert.ok(
              !sovrapposti(m.tacche[i], m.tacche[j]),
              `${pagina} @ ${width}px: tacca "${m.tacche[i].txt}" sovrapposta a "${m.tacche[j].txt}"`,
            );
          }
        }
      });

      test(`${pagina} a ${width}px: legenda e tacche dentro la cornice, lontane dagli angoli`, async () => {
        const m = await misura(pagina, width);
        assert.ok(m.cornice, `${pagina}: il telaio del grafico non ha le tacche d'angolo (.fc-corner)`);
        for (const el of [...m.legenda, ...m.tacche]) {
          assert.ok(dentro(el, m.cornice), `${pagina} @ ${width}px: "${el.txt}" esce dalla cornice interna del telaio`);
          for (const a of m.angoli) {
            assert.ok(!sovrapposti(el, a), `${pagina} @ ${width}px: "${el.txt}" tocca una tacca d'angolo`);
          }
        }
      });

      test(`${pagina} a ${width}px: nessuna unità ripetuta accanto alle tacche che la portano già`, async () => {
        const m = await misura(pagina, width);
        assert.ok(m.tacchePerAsse.x.length > 0, `${pagina}: nessuna tacca marcata data-asse="x"`);
        for (const u of m.tacche.filter((t) => t.unita === 'x')) {
          const ripetuta = m.tacchePerAsse.x.filter((t) => t.endsWith(u.txt));
          assert.deepEqual(ripetuta, [], `${pagina} @ ${width}px: l'unità "${u.txt}" è già nelle tacche ${ripetuta.join(', ')}`);
        }
      });

      if (LARGHEZZE_11PX.includes(width)) {
        test(`${pagina} a ${width}px: etichette di almeno 11px effettivi`, async () => {
          const m = await misura(pagina, width);
          const piccole = m.tacche.filter((t) => t.px < 11).map((t) => `"${t.txt}" ${t.px.toFixed(1)}px`);
          assert.deepEqual(piccole, [], `${pagina} @ ${width}px: etichette sotto gli 11px effettivi: ${piccole.join(', ')}`);
        });
      }

      if (width === 390) {
        test(`${pagina} a 390px: area del grafico alta almeno 170px reali`, async () => {
          const m = await misura(pagina, width);
          assert.ok(m.altezzaPlot >= 170, `${pagina}: area del grafico alta ${m.altezzaPlot.toFixed(1)}px, attesi almeno 170px`);
        });
      }
    }
  }
});
