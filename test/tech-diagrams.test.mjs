/**
 * Regressione di layout degli schemi a blocchi (`SchemaFrame`/`BlockChain`),
 * su viewport reali.
 *
 * I box sono elementi HTML che si dimensionano sul proprio contenuto: un
 * `<p>` di titolo occupa sempre la larghezza del suo box, quindi confrontare
 * il rettangolo del testo con quello del box non intercetta mai nulla (un
 * box che si allarga per una parola senza spazi si allarga insieme al testo,
 * non lo lascia indietro). Quello che rivela un vero sconfinamento è
 * l'inchiostro reale dei glifi — misurato con un `Range` sui nodi di testo,
 * non la scatola del contenitore — confrontato con il telaio del disegno
 * (il bordo interno a 14px, lo stesso di ogni figura tecnica del sito):
 * quello sì ha una dimensione fissa, e un box o un testo che lo superano
 * sono un difetto reale, che la tela tagli visivamente il resto o no.
 *
 * Il test verifica, per ciascuno schema, a 1440, 390 e 320px:
 * 1. ogni box e ogni elemento del contenuto restano dentro il bordo interno
 *    del telaio (niente scroll orizzontale di pagina);
 * 2. l'inchiostro di ogni testo (via Range) resta dentro il proprio box;
 * 3. nessun box si sovrappone a un altro box della stessa pagina;
 * 4. il titolo di colonna del CCI non si sovrappone ai suoi box;
 * 5. la sagoma del trasformatore non si sovrappone al suo elenco;
 * 6. il titolo del box resta leggibile (≥ 12px calcolati a 390px, ≥ 13px a
 *    1440px: `--fs-small` clampa 14→16px, lo soddisfa per costruzione) e i
 *    numeri dei marker sulla sagoma restano ≥ 11px effettivi (il "px reale"
 *    dopo lo scarto viewBox → viewport, la stessa soglia di ogni testo
 *    tecnico del sito).
 *
 * Un ultimo test prova che la misura sa fallire davvero: forza in pagina un
 * titolo di box senza spazi e senza `word-wrap`, e verifica che il
 * controllo lo segnali. Senza questa prova un controllo troppo permissivo
 * (o rotto) resterebbe verde per sempre.
 *
 * Le pagine da controllare non sono un elenco scritto a mano: si leggono i
 * file Markdown IT in `src/content/servizi-dettaglio/it`, si prende il
 * campo `diagramma` di ciascuno e si tengono solo le pagine il cui valore è
 * una delle cinque chiavi degli schemi a blocchi; lo slug del file è anche
 * lo slug della rotta italiana in ROTTE, da cui si recupera la gemella
 * inglese. Un sesto schema in futuro non richiederebbe di toccare questo
 * file.
 *
 * Il test parte dal `dist` già costruito e si salta se non c'è.
 */
import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
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

// Le cinque chiavi di `DIAGRAMMI` (src/components/tech/diagrams/index.ts) che
// producono uno schema a blocchi, non un grafico a dati.
const CHIAVI_SCHEMA = ['catena-rcs', 'osservabilita-controllabilita', 'catena-a72', 'catena-contatori', 'punti-misura-trasformatore'];
const CONTENT_IT = fileURLToPath(new URL('../src/content/servizi-dettaglio/it', import.meta.url));

// Legge il campo `diagramma` di ogni pagina IT e tiene solo quelle con uno
// schema a blocchi; lo slug del file è lo slug della rotta italiana in
// ROTTE, da cui si prende anche la gemella inglese.
function paginePerSchema() {
  if (!ROTTE || !existsSync(CONTENT_IT)) return [];
  const risultati = [];
  for (const file of readdirSync(CONTENT_IT)) {
    if (!file.endsWith('.md')) continue;
    const testo = readFileSync(path.join(CONTENT_IT, file), 'utf8');
    const m = testo.match(/^diagramma:\s*"([^"]+)"/m);
    if (!m || !CHIAVI_SCHEMA.includes(m[1])) continue;
    const slug = file.replace(/\.md$/, '');
    const rotta = ROTTE.find((r) => r.it === `/servizi/${slug}/`);
    if (rotta) risultati.push(rotta);
  }
  return risultati;
}

const SCHEMA_ROUTES = paginePerSchema();
const PAGINE = SCHEMA_ROUTES.flatMap((r) => [r.it.replace(/^\//, ''), r.en.replace(/^\//, '')]);

// 320px è il caso più stretto: il marker della sagoma del trasformatore ci
// resta sopra gli 11px effettivi per il margine più risicato di ogni altra
// larghezza (misurato, non stimato) — merita una guardia propria, non solo
// 1440/390.
const LARGHEZZE = [1440, 390, 320];

// Eseguita dentro `page.evaluate`: deve bastare a se stessa, senza chiusure
// sul modulo Node (un realm JS diverso non le vede).
function misuraSchema() {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  };
  const sovrapposti = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const dentro = (inner, outer, tol = 0.5) =>
    inner.left >= outer.left - tol && inner.right <= outer.right + tol && inner.top >= outer.top - tol && inner.bottom <= outer.bottom + tol;

  // Rettangoli reali dei glifi (non del contenitore, che assume sempre la
  // larghezza del box): un `Range` sui nodi di testo di un elemento foglia
  // dà l'inchiostro vero, l'unica cosa che rivela un vero sconfinamento.
  const inkRects = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return [...range.getClientRects()].map((r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
  };

  const fogliaConTesto = (el) => {
    const out = [];
    const cerca = (nodo) => {
      const figli = [...nodo.children];
      if (figli.length === 0) {
        if (nodo.textContent.trim()) out.push(nodo);
      } else {
        figli.forEach(cerca);
      }
    };
    cerca(el);
    return out;
  };

  const frame = document.querySelector('.fc-frame--html');
  if (!frame) return null; // pagina senza schema HTML: non pertinente

  const frameRect = box(frame);
  const interna = { left: frameRect.left + 14, right: frameRect.right - 14, top: frameRect.top + 14, bottom: frameRect.bottom - 14 };

  const risultato = { fuoriDalTelaio: [], fuoriDalBox: [], sovrapposizioni: [], titoloCciSuBox: [], outlineSuLegenda: false, scrollOrizzontale: false };

  // 1) ogni box e ogni elemento del contenuto restano dentro il bordo
  //    interno del telaio: un box allargato da una parola senza spazi
  //    uscirebbe da qui, anche se la tela lo taglia visivamente
  //    (`overflow: hidden`) e il suo stesso rettangolo sembra "regolare".
  const contenuto = document.querySelector('.fc-html-content');
  const daVerificare = contenuto ? [contenuto, ...contenuto.querySelectorAll('*')] : [];
  for (const el of daVerificare) {
    const r = box(el);
    if (r.right - r.left <= 0 || r.bottom - r.top <= 0) continue; // non visibile: niente area da controllare
    if (!dentro(r, interna)) {
      risultato.fuoriDalTelaio.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.') || '(senza classe)'}`);
    }
  }

  // 2) inchiostro reale dei testi dentro ogni box.
  const boxes = [...document.querySelectorAll('[data-schema-box]')];
  for (const g of boxes) {
    const r = box(g);
    for (const t of fogliaConTesto(g)) {
      if (t.scrollWidth > t.clientWidth + 1) risultato.fuoriDalBox.push(t.textContent.trim());
      for (const ink of inkRects(t)) {
        if (!dentro(ink, r)) risultato.fuoriDalBox.push(t.textContent.trim());
      }
    }
  }

  // 3) nessun box si sovrappone a un altro.
  const rects = boxes.map(box);
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (sovrapposti(rects[i], rects[j])) {
        risultato.sovrapposizioni.push(`${boxes[i].textContent.trim().slice(0, 24)} / ${boxes[j].textContent.trim().slice(0, 24)}`);
      }
    }
  }

  // 4) i titoli di colonna del CCI (PF1/PF2) non si sovrappongono ai box.
  const titoliColonna = [...document.querySelectorAll('.occ__title')];
  const boxCci = [...document.querySelectorAll('.occ__box')];
  for (const tc of titoliColonna) {
    const rt = box(tc);
    for (const b of boxCci) {
      if (sovrapposti(rt, box(b))) risultato.titoloCciSuBox.push(tc.textContent.trim());
    }
  }

  // 5) la sagoma del trasformatore non si sovrappone al suo elenco.
  const outline = document.querySelector('.txm__outline');
  const legenda = document.querySelector('.txm__legend');
  if (outline && legenda) risultato.outlineSuLegenda = sovrapposti(box(outline), box(legenda));

  // 6a) titolo del box leggibile.
  const titoli = [...document.querySelectorAll('.chain__box-title, .occ__box-title, .txm__legend-title')];
  risultato.fontTitoloMinimo = titoli.length ? Math.min(...titoli.map((el) => parseFloat(getComputedStyle(el).fontSize))) : null;

  // 6b) numeri dei marker sulla sagoma del trasformatore, in px reali: il
  //     valore CSS è in unità di viewBox, va scalato per il rapporto fra
  //     larghezza reale dell'SVG e larghezza del suo viewBox.
  const marker = [...document.querySelectorAll('.txm__marker-num')];
  if (marker.length && outline) {
    const scala = box(outline).right - box(outline).left ? (box(outline).right - box(outline).left) / outline.viewBox.baseVal.width : 1;
    risultato.fontMarkerMinimo = Math.min(...marker.map((el) => parseFloat(getComputedStyle(el).fontSize))) * scala;
  } else {
    risultato.fontMarkerMinimo = null;
  }

  // niente scroll orizzontale di pagina.
  risultato.scrollOrizzontale = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;

  risultato.count = boxes.length;
  return risultato;
}

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

  const misura = async (pagina, width) => {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(origin + pagina, { waitUntil: 'load' });
    const m = await page.evaluate(misuraSchema);
    await page.close();
    return m;
  };

  for (const pagina of PAGINE) {
    for (const width of LARGHEZZE) {
      test(`${pagina} a ${width}px: testo e box dentro il telaio, nessuna sovrapposizione, testo leggibile`, async () => {
        const m = await misura(pagina, width);
        if (!m) return; // pagina senza schema a blocchi: non pertinente
        assert.ok(m.count >= 3, `${pagina}: attesi almeno 3 box, trovati ${m.count}`);
        assert.deepEqual(m.fuoriDalTelaio, [], `${pagina} @ ${width}px: elementi fuori dal telaio: ${m.fuoriDalTelaio.join(', ')}`);
        assert.deepEqual(m.fuoriDalBox, [], `${pagina} @ ${width}px: testo fuori dal box: ${m.fuoriDalBox.join(', ')}`);
        assert.deepEqual(m.sovrapposizioni, [], `${pagina} @ ${width}px: box sovrapposti: ${m.sovrapposizioni.join(' | ')}`);
        assert.deepEqual(m.titoloCciSuBox, [], `${pagina} @ ${width}px: titolo di colonna sopra un box: ${m.titoloCciSuBox.join(', ')}`);
        assert.equal(m.outlineSuLegenda, false, `${pagina} @ ${width}px: la sagoma del trasformatore si sovrappone al suo elenco`);
        assert.equal(m.scrollOrizzontale, false, `${pagina} @ ${width}px: la pagina ha uno scroll orizzontale`);
        if (m.fontTitoloMinimo !== null) {
          const soglia = width >= 1440 ? 13 : 12;
          assert.ok(m.fontTitoloMinimo >= soglia, `${pagina} @ ${width}px: titolo di box a ${m.fontTitoloMinimo}px, attesi almeno ${soglia}px`);
        }
        if (m.fontMarkerMinimo !== null) {
          assert.ok(m.fontMarkerMinimo >= 11, `${pagina} @ ${width}px: numero marker a ${m.fontMarkerMinimo.toFixed(1)}px effettivi, attesi almeno 11px`);
        }
      });
    }
  }

  test('esattamente le pagine con diagramma a blocchi hanno uno schema rilevato', async () => {
    assert.equal(PAGINE.length, 10, `attese 10 pagine (5 diagrammi a blocchi × IT/EN) dal contenuto, derivate ${PAGINE.length}`);
    const risultati = await Promise.all(PAGINE.map((p) => misura(p, 1440)));
    const senzaSchema = PAGINE.filter((_, i) => !risultati[i]);
    assert.deepEqual(senzaSchema, [], `pagine con diagramma a blocchi nel contenuto ma senza schema rilevato in pagina: ${senzaSchema.join(', ')}`);
  });

  test('il controllo sa fallire: un titolo senza spazi e senza a-capo viene segnalato', async () => {
    const pagina = PAGINE[0];
    const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(origin + pagina, { waitUntil: 'load' });

    const pulito = await page.evaluate(misuraSchema);
    assert.deepEqual(pulito.fuoriDalBox, [], `${pagina}: attesa una pagina pulita prima della mutazione`);
    assert.deepEqual(pulito.fuoriDalTelaio, [], `${pagina}: attesa una pagina pulita prima della mutazione`);

    // Forza un titolo di 80 caratteri senza spazi, con `white-space: nowrap`
    // inline (precedenza più alta della regola CSS `overflow-wrap` del
    // componente): una singola riga che non può andare a capo, più larga di
    // qualunque box o telaio a questa larghezza.
    await page.evaluate(() => {
      const titolo = document.querySelector('.chain__box-title, .occ__box-title, .txm__legend-title');
      if (!titolo) throw new Error('nessun titolo di box trovato in pagina per la mutazione');
      titolo.textContent = 'x'.repeat(80);
      titolo.style.whiteSpace = 'nowrap';
    });
    const mutato = await page.evaluate(misuraSchema);
    await page.close();

    const segnalato = mutato.fuoriDalBox.length > 0 || mutato.fuoriDalTelaio.length > 0;
    assert.ok(segnalato, `${pagina}: il controllo non ha segnalato un titolo di 80 caratteri senza spazi forzato a una riga sola`);
  });
});
