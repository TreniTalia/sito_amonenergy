import { existsSync, readFileSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const skip = existsSync(path.join(DIST, 'index.html'))
  ? false
  : 'dist assente: esegui `npm run build` prima di questo test';

const SLUG = [
  'sfra',
  'misure-scariche-parziali',
  'verifica-protezioni-at-mt',
  'verifiche-trasformatori-di-potenza',
  'prove-isolamento',
  'rcs-monitoraggio-cabina-mt',
  'cci-controllore-centrale-impianto',
  'teledistacco-a72',
  'lettura-contatori',
];

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
  test('la pagina SFRA esiste ed è completa', () => {
    const f = path.join(DIST, 'servizi', 'sfra', 'index.html');
    assert.ok(existsSync(f), 'manca /servizi/sfra/');
    const html = readFileSync(f, 'utf8');
    assert.match(html, /IEC 60076-18/, 'manca la norma di riferimento');
    assert.match(html, /"@type":"Service"/, 'manca il JSON-LD Service');
    assert.match(html, /"@type":"FAQPage"/, 'manca il JSON-LD FAQPage');
    assert.match(html, /<svg/, 'manca il diagramma SVG');
    assert.ok(
      !/<img[^>]+\.(jpe?g|png|webp|avif)/.test(contenuto(html)),
      'la pagina contiene una fotografia',
    );
  });

  test('ogni pagina tecnica linka almeno due sorelle', () => {
    for (const s of SLUG) {
      const f = path.join(DIST, 'servizi', s, 'index.html');
      if (!existsSync(f)) continue; // le altre arrivano nelle task successive
      const html = readFileSync(f, 'utf8');
      const link = SLUG.filter((a) => a !== s && html.includes(`/servizi/${a}/`));
      assert.ok(link.length >= 2, `${s}: solo ${link.length} link a pagine sorelle`);
    }
  });
});
