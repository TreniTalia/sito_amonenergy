/**
 * Regressione di layout delle card progetto, su viewport reali.
 *
 * 1. PANNELLI ALTI UGUALI. Il pannello in vetro di ogni card cresceva col
 *    testo: una descrizione più lunga lo alzava e copriva più foto, e le card
 *    dello slider non si somigliavano più. Ora ogni riga ha il suo spazio
 *    fisso e tutti i pannelli hanno la stessa altezza, con o senza potenza.
 *
 * 2. TESTI AL LIMITE DENTRO LO SPAZIO. I `maxlength` del pannello (titolo 45,
 *    descrizione 100, committente e tipologia 30) sono tarati per stare in
 *    titolo 2 righe, descrizione 2 righe su desktop e 3 su telefono, riga dati
 *    1 riga su desktop e 2 su telefono. Un testo lungo quanto il limite non
 *    deve alzare il pannello né venire tagliato coi puntini.
 *
 * 3. PANNELLO DENTRO LA CARD. Su telefono il pannello sbordava dal lato alto
 *    della card: qui resta sempre dentro, con un margine di foto scoperta.
 *
 * 4. TITOLI DELLA HOME ALLINEATI. Le tre card della home hanno il titolo
 *    alto uguale anche quando uno va a capo e gli altri no.
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { avviaServer, motivoSalto, playwright } from './helpers/dist-server.mjs';

const skip = motivoSalto('lavori/index.html');

const PAGINE = ['lavori/', 'en/projects/'];
const LARGHEZZE = [360, 390, 768, 1024, 1280, 1440];
// Sotto i 768px ProjectSlider passa alla card verticale del telefono.
const telefono = (width) => width < 768;

// Testi realistici lunghi esattamente quanto il limite del pannello.
const AL_LIMITE = {
  titolo: 'Sottostazione elettrica di Castelluccio Sauri',
  descrizione:
    'Stazione di trasformazione 150/30 kV a servizio di un parco eolico nel comune di Troia, Foggia (FG).',
  meta: 'Eco Puglia Energia Rinnovabili · FG · Sottostazione elettrica AT/MT',
};

describe('card dei progetti', { skip }, () => {
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

  test('i testi di prova sono lunghi quanto il limite del pannello', () => {
    assert.equal(AL_LIMITE.titolo.length, 45);
    assert.equal(AL_LIMITE.descrizione.length, 100);
    // committente (30) · provincia (2) · tipologia (30)
    assert.ok(AL_LIMITE.meta.length >= 66);
  });

  const cache = new Map();
  const misura = (pagina, width) => {
    const k = `${pagina}@${width}`;
    if (!cache.has(k)) cache.set(k, misuraPagina(pagina, width));
    return cache.get(k);
  };
  const misuraPagina = async (pagina, width) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(origin + pagina, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const m = await page.evaluate((AL_LIMITE) => {
      const box = (el) => el.getBoundingClientRect();
      // Righe occupate davvero dal testo, indipendenti da padding e bordi.
      const righe = (el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size;
      };
      const tagliato = (el) => el.scrollHeight > el.clientHeight + 1;
      const pannelli = [...document.querySelectorAll('.ps-card .pco')];
      const altezze = pannelli.map((p) => Math.round(box(p).height));
      const dentro = pannelli.map((p) => Math.round(box(p).top - box(p.closest('.ps-card')).top));

      // Primo pannello riempito coi testi al limite.
      const p = pannelli[0];
      // Il titolo è un testo dentro l'h3: l'h3 tiene le due righe, il testo
      // porta il `line-clamp`.
      const tit = p.querySelector('.pco-titolo-testo');
      const desc = p.querySelector('.pco-desc');
      const meta = p.querySelector('.pco-meta');
      tit.textContent = AL_LIMITE.titolo;
      desc.textContent = AL_LIMITE.descrizione;
      meta.textContent = AL_LIMITE.meta;
      return {
        altezze,
        dentro,
        alLimite: {
          altezza: Math.round(box(p).height),
          righe: { titolo: righe(tit), descrizione: righe(desc), meta: righe(meta) },
          tagliato: { titolo: tagliato(tit), descrizione: tagliato(desc), meta: tagliato(meta) },
        },
      };
    }, AL_LIMITE);
    await page.close();
    return m;
  };

  for (const pagina of PAGINE) {
    for (const width of LARGHEZZE) {
      test(`${pagina} @${width}px: pannelli tutti alti uguali`, async () => {
        const { altezze } = await misura(pagina, width);
        assert.ok(altezze.length >= 2, 'meno di due card nello slider');
        const scarto = Math.max(...altezze) - Math.min(...altezze);
        assert.ok(scarto <= 1, `altezze dei pannelli diverse: ${altezze.join(', ')}`);
      });

      test(`${pagina} @${width}px: pannello dentro la card, con foto scoperta sopra`, async () => {
        const { dentro } = await misura(pagina, width);
        for (const top of dentro) assert.ok(top >= 48, `pannello a ${top}px dal bordo alto della card`);
      });

      test(`${pagina} @${width}px: testi al limite nello spazio previsto`, async () => {
        const { altezze, alLimite } = await misura(pagina, width);
        const tel = telefono(width);
        assert.ok(alLimite.righe.titolo <= 2, `titolo su ${alLimite.righe.titolo} righe`);
        assert.ok(alLimite.righe.descrizione <= (tel ? 3 : 2), `descrizione su ${alLimite.righe.descrizione} righe`);
        assert.ok(alLimite.righe.meta <= (tel ? 2 : 1), `riga dati su ${alLimite.righe.meta} righe`);
        assert.deepEqual(alLimite.tagliato, { titolo: false, descrizione: false, meta: false }, 'testo tagliato');
        assert.ok(Math.abs(alLimite.altezza - altezze[0]) <= 1, `il pannello è passato da ${altezze[0]} a ${alLimite.altezza}px`);
      });
    }
  }

  for (const [pagina, width] of [['', 1024], ['', 1440], ['en/', 1280]]) {
    test(`home ${pagina || 'it/'} @${width}px: titoli delle card progetto alti uguali`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(origin + pagina, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const altezze = await page.evaluate(() =>
        [...document.querySelectorAll('.progetto-preview h3')].map((h) => Math.round(h.getBoundingClientRect().height)),
      );
      await page.close();
      assert.equal(altezze.length, 3);
      assert.ok(Math.max(...altezze) - Math.min(...altezze) <= 1, `titoli alti ${altezze.join(', ')}`);
    });
  }
});
