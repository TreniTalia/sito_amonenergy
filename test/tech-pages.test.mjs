import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const skip = existsSync(path.join(DIST, 'index.html'))
  ? false
  : 'dist assente: esegui `npm run build` prima di questo test';

const { ROTTE } = await import('../src/i18n/routes.ts').catch(() => ({ ROTTE: null }));

// Le nove pagine tecniche di dettaglio sono le rotte `/servizi/<slug>/` di
// ROTTE, esclusa la sola hub `/servizi/`. Derivate da lì (la sorgente unica
// delle coppie it/en) invece che da un secondo elenco di slug scritto a
// mano qui: due liste della stessa cosa, una italiana e una inglese, sono
// esattamente il tipo di doppione che diverge in silenzio quando arriva una
// decima pagina tecnica.
const TECH_ROUTES = ROTTE
  ? ROTTE.filter((r) => r.it.startsWith('/servizi/') && r.it !== '/servizi/')
  : [];

const slugDi = (lato, rotta) =>
  lato === 'it'
    ? rotta.it.replace(/^\/servizi\//, '').replace(/\/$/, '')
    : rotta.en.replace(/^\/en\/services\//, '').replace(/\/$/, '');

const prefissoDi = (lato) => (lato === 'it' ? ['servizi'] : ['en', 'services']);

const fileDi = (lato, rotta) => path.join(DIST, ...prefissoDi(lato), slugDi(lato, rotta), 'index.html');

const hrefDi = (lato, slug) => (lato === 'it' ? `/servizi/${slug}/` : `/en/services/${slug}/`);

/**
 * Il divieto di fotografie riguarda il contenuto della pagina, non il guscio:
 * header e footer montano il logo (un .webp) su ogni pagina del sito, e una
 * verifica sull'HTML intero fallirebbe sempre, anche su una pagina fatta di
 * soli SVG. Base.astro racchiude lo slot in `<main id="main">`: è quello il
 * perimetro su cui il vincolo ha senso.
 */
function contenuto(html) {
  const i = html.indexOf('<main id="main"');
  const j = html.lastIndexOf('</main>');
  assert.ok(i !== -1 && j > i, 'la pagina non ha un <main id="main">');
  return html.slice(i, j);
}

/**
 * La cover è la prima immagine dentro <main>: sta nella sezione della
 * PageHero (classe `pagehero-photo`) e ha un alt descrittivo. Fino al
 * 2026-09-23 queste pagine non avevano fotografie per scelta (spec del
 * 2026-09-22, §3.2); il cliente l'ha ribaltata, e il test verifica ora il
 * contrario.
 */
function haCover(html) {
  const m = contenuto(html).match(/<img[^>]*>/);
  if (!m) return false;
  return /class="[^"]*pagehero-photo/.test(m[0]) && /alt="[^"]{12,}"/.test(m[0]);
}

describe('pagine tecniche', { skip }, () => {
  test('ROTTE è importabile e contiene le nove pagine tecniche', () => {
    assert.ok(ROTTE, 'src/i18n/routes.ts non importabile');
    assert.equal(TECH_ROUTES.length, 9, `attese 9 pagine tecniche in ROTTE, trovate ${TECH_ROUTES.length}`);
  });

  test('la pagina SFRA esiste ed è completa, in entrambe le lingue', () => {
    for (const lato of ['it', 'en']) {
      const rotta = TECH_ROUTES.find((r) => slugDi(lato, r) === 'sfra');
      assert.ok(rotta, `${lato}: rotta SFRA non trovata in ROTTE`);
      const f = fileDi(lato, rotta);
      assert.ok(existsSync(f), `${lato}: manca la pagina SFRA`);
      const html = readFileSync(f, 'utf8');
      assert.match(html, /IEC 60076-18/, `${lato}: manca la norma di riferimento`);
      assert.match(html, /"@type":"Service"/, `${lato}: manca il JSON-LD Service`);
      assert.match(html, /"@type":"FAQPage"/, `${lato}: manca il JSON-LD FAQPage`);
      assert.match(html, /<svg/, `${lato}: manca il diagramma SVG`);
      assert.ok(haCover(html), `${lato}: manca la foto di cover`);
    }
  });

  // L'anello di link fra sorelle vale *dentro* ciascuna lingua: una pagina
  // inglese deve linkare altre pagine inglesi (stesso prefisso /en/services/),
  // non ricadere sulle sorelle italiane solo perché lo slug italiano compare
  // per caso nell'URL. Per questo il conteggio filtra sull'href nel prefisso
  // giusto per lato, non solo sullo slug.
  test('ogni pagina tecnica linka almeno due sorelle nella stessa lingua', () => {
    for (const lato of ['it', 'en']) {
      const slugs = TECH_ROUTES.map((r) => slugDi(lato, r));
      for (const rotta of TECH_ROUTES) {
        const slug = slugDi(lato, rotta);
        const f = fileDi(lato, rotta);
        if (!existsSync(f)) continue;
        const html = readFileSync(f, 'utf8');
        const link = slugs.filter((altro) => altro !== slug && html.includes(hrefDi(lato, altro)));
        assert.ok(link.length >= 2, `${lato}/${slug}: solo ${link.length} link a pagine sorelle nella stessa lingua`);
      }
    }
  });

  // Chiave sullo slug italiano (identificatore stabile della pagina): il
  // codice di norma non si traduce (IEC/CEI restano invariati in inglese),
  // quindi la stessa regex vale sul file italiano e su quello inglese.
  const NORME = {
    'misure-scariche-parziali': /IEC 60270/,
    'verifica-protezioni-at-mt': /CEI 0-16/,
    'verifiche-trasformatori-di-potenza': /IEC 60076/,
    'prove-isolamento': /CEI 11-27|CEI EN 50110-1/,
  };

  test('ogni pagina di diagnostica cita la sua norma, in entrambe le lingue', () => {
    for (const [slugIt, re] of Object.entries(NORME)) {
      const rotta = TECH_ROUTES.find((r) => slugDi('it', r) === slugIt);
      assert.ok(rotta, `rotta ${slugIt} non trovata in ROTTE`);
      for (const lato of ['it', 'en']) {
        const f = fileDi(lato, rotta);
        assert.ok(existsSync(f), `${lato}: manca /${slugDi(lato, rotta)}/`);
        assert.match(readFileSync(f, 'utf8'), re, `${lato}/${slugIt}: norma mancante`);
      }
    }
  });

  test('tutte e nove le pagine tecniche esistono, in entrambe le lingue, con Service, FAQPage, foto di cover e nessuna certificazione', () => {
    for (const lato of ['it', 'en']) {
      for (const rotta of TECH_ROUTES) {
        const slug = slugDi(lato, rotta);
        const f = fileDi(lato, rotta);
        assert.ok(existsSync(f), `${lato}: manca /${slug}/`);
        const html = readFileSync(f, 'utf8');
        assert.match(html, /"@type":"Service"/, `${lato}/${slug}: manca Service`);
        assert.match(html, /"@type":"FAQPage"/, `${lato}/${slug}: manca FAQPage`);
        assert.ok(!/certificazion|certification/i.test(html), `${lato}/${slug}: cita certificazioni`);
        assert.ok(haCover(html), `${lato}/${slug}: manca la foto di cover`);
      }
    }
  });

  // Regressione del rilievo "nove diagrammi in italiano sulle pagine
  // inglesi": ciascuno di questi frammenti compariva solo (o principalmente)
  // dentro i componenti src/components/tech/diagrams/*.astro prima che la
  // prop `lingua` venisse propagata. Se una qualunque di queste stringhe
  // ricompare su una pagina /en/, un diagramma è tornato a essere cablato in
  // italiano — a prescindere da quale dei nove sia.
  const STRINGHE_ITALIANE_DIAGRAMMI = [
    "Confronto con l'impronta di riferimento",
    'Impronta di riferimento',
    'Misura in campo',
    'Soglia selettiva I>',
    'Soglia di massima corrente I>>',
    'Verifica della curva di intervento',
    'Tensione di prova',
    'Corrente di fuga',
    'Rampa di tensione e corrente di fuga',
    'SOGLIA DI SENSIBILITÀ',
    'Tensione a frequenza di rete',
    'Impulso di scarica rilevato',
    'Impulsi di scarica in picocoulomb',
    'Cinque punti, cinque misure diverse',
    'Terna isolatori AT',
    'Terna isolatori BT',
    'Commutatore sotto carico',
    'Neutro e messa a terra',
    'Cassone e nucleo',
    'PF1 · Osservabilità',
    'PF2 · Controllabilità',
    'Due funzioni, due versi opposti',
    'Il comando arriva, lo stato torna indietro',
    'COMANDO DI DISTACCO',
    'Stato che risale, comando che ridiscende',
    'RICHIUSURA AUTOMATICA',
    'Dal contatore al dato consultabile',
    'DATO DI MISURA',
  ];

  test('nessuna pagina /en/ contiene stringhe italiane note provenienti dai diagrammi', () => {
    const enDir = path.join(DIST, 'en');
    if (!existsSync(enDir)) return; // coperto dallo skip generale sopra
    const filesToCheck = [];
    const camminaDentro = (dir) => {
      for (const voce of readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, voce.name);
        if (voce.isDirectory()) camminaDentro(p);
        else if (voce.name.endsWith('.html')) filesToCheck.push(p);
      }
    };
    camminaDentro(enDir);
    assert.ok(filesToCheck.length > 0, 'nessuna pagina trovata sotto dist/en/');

    for (const f of filesToCheck) {
      // I commenti HTML dei diagrammi (`<!-- Blocchi. -->` e simili) sono
      // note per chi legge il codice sorgente, non contenuto della pagina:
      // finiscono nell'HTML compilato ma nessun utente né motore di ricerca
      // li legge come testo. Il test riguarda le stringhe *visibili* — testo
      // e attributi come aria-label — quindi i commenti si tolgono prima del
      // confronto.
      const html = readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      for (const stringa of STRINGHE_ITALIANE_DIAGRAMMI) {
        assert.ok(
          !html.includes(stringa),
          `${path.relative(DIST, f)}: contiene la stringa italiana "${stringa}" di un diagramma`,
        );
      }
    }
  });

  // Il testo che si legge in pagina: niente script, stili e commenti, tag
  // tolti, entità delle lineette e dello spazio indivisibile decodificate.
  const testoVisibile = (html) =>
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
      .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
      .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ');

  test('nessuna lineetta usata come pausa nel testo delle pagine tecniche', () => {
    const trovate = [];
    for (const rotta of TECH_ROUTES) {
      for (const lato of ['it', 'en']) {
        const testo = testoVisibile(contenuto(readFileSync(fileDi(lato, rotta), 'utf8')));
        for (const m of testo.matchAll(/.{0,30}\s[—–]\s.{0,30}/g)) trovate.push(`${hrefDi(lato, slugDi(lato, rotta))}: «${m[0].trim()}»`);
      }
    }
    assert.deepEqual(trovate, [], `lineette usate come pausa:\n${trovate.join('\n')}`);
  });

  test('il testo alternativo dell og:image non separa il titolo con una lineetta', () => {
    for (const rotta of TECH_ROUTES) {
      for (const lato of ['it', 'en']) {
        const m = readFileSync(fileDi(lato, rotta), 'utf8').match(/property="og:image:alt" content="([^"]*)"/);
        assert.ok(m, `${hrefDi(lato, slugDi(lato, rotta))}: manca og:image:alt`);
        assert.doesNotMatch(m[1], /\s[—–]\s/, `${hrefDi(lato, slugDi(lato, rotta))}: og:image:alt «${m[1]}»`);
      }
    }
  });
});
