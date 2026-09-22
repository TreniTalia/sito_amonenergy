import { existsSync, readFileSync } from 'node:fs';
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
      assert.ok(
        !/<img[^>]+\.(jpe?g|png|webp|avif)/.test(contenuto(html)),
        `${lato}: la pagina contiene una fotografia`,
      );
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

  test('tutte e nove le pagine tecniche esistono, in entrambe le lingue, con Service, FAQPage, nessuna fotografia e nessuna certificazione', () => {
    for (const lato of ['it', 'en']) {
      for (const rotta of TECH_ROUTES) {
        const slug = slugDi(lato, rotta);
        const f = fileDi(lato, rotta);
        assert.ok(existsSync(f), `${lato}: manca /${slug}/`);
        const html = readFileSync(f, 'utf8');
        assert.match(html, /"@type":"Service"/, `${lato}/${slug}: manca Service`);
        assert.match(html, /"@type":"FAQPage"/, `${lato}/${slug}: manca FAQPage`);
        assert.ok(!/certificazion|certification/i.test(html), `${lato}/${slug}: cita certificazioni`);
        assert.ok(
          !/<img[^>]+\.(jpe?g|png|webp|avif)/.test(contenuto(html)),
          `${lato}/${slug}: la pagina contiene una fotografia`,
        );
      }
    }
  });
});
