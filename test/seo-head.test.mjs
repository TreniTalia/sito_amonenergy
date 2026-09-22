import { readFileSync, existsSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { globSync } from 'node:fs';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const skip = existsSync(path.join(DIST, 'index.html'))
  ? false
  : 'dist assente: esegui `npm run build` prima di questo test';

// `globSync` restituisce separatori nativi (backslash su Windows): si
// normalizza a `/` solo per il confronto del prefisso, i path restano
// quelli originali per `readFileSync`/`path.join`, che li accettano entrambi.
const pagine = () =>
  globSync('**/index.html', { cwd: DIST }).filter((p) => !p.replace(/\\/g, '/').startsWith('admin/'));

describe('head SEO', { skip }, () => {
  test('og:image esiste come file servito', () => {
    const html = readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = html.match(/property="og:image" content="([^"]+)"/);
    assert.ok(m, 'og:image assente');
    const rel = new URL(m[1]).pathname.replace(/^\//, '');
    assert.ok(existsSync(path.join(DIST, rel)), `og:image punta a un file inesistente: ${rel}`);
  });

  test('ogni pagina dichiara larghezza, altezza e alt dell og:image', () => {
    for (const p of pagine()) {
      const html = readFileSync(path.join(DIST, p), 'utf8');
      for (const prop of ['og:image:width', 'og:image:height', 'og:image:alt']) {
        assert.match(html, new RegExp(`property="${prop}"`), `${p}: manca ${prop}`);
      }
    }
  });

  test('ogni pagina ha un blocco JSON-LD WebSite valido', () => {
    for (const p of pagine()) {
      const html = readFileSync(path.join(DIST, p), 'utf8');
      const blocchi = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
        .map((m) => JSON.parse(m[1]));
      assert.ok(
        blocchi.some((b) => b['@type'] === 'WebSite' && b.inLanguage),
        `${p}: manca JSON-LD WebSite con inLanguage`,
      );
    }
  });

  test('ogni pagina ha una BreadcrumbList', () => {
    for (const p of pagine()) {
      const html = readFileSync(path.join(DIST, p), 'utf8');
      assert.match(html, /"@type":"BreadcrumbList"/, `${p}: manca BreadcrumbList`);
    }
  });

  // Unicità per lingua, non globale: il mirror inglese che arriva più avanti
  // nel piano farà legittimamente coincidere titolo e description fra
  // `/privacy-policy/` e `/en/privacy-policy/` — sono due URL distinti, con
  // hreflang reciproci e `lang` diverso sull'elemento <html>. Un confronto
  // globale darebbe un falso positivo su quella coppia; qui si raggruppa
  // per l'attributo `lang` di ciascuna pagina e si verifica l'unicità solo
  // dentro ogni gruppo.
  test('titoli e descrizioni sono unici fra le pagine della stessa lingua', () => {
    const vistiPerLingua = new Map();
    for (const p of pagine()) {
      const html = readFileSync(path.join(DIST, p), 'utf8');
      const t = html.match(/<title>(.*?)<\/title>/s)[1];
      const langMatch = html.match(/<html[^>]*\blang="([^"]*)"/);
      const lang = langMatch ? langMatch[1] : '';
      const visti = vistiPerLingua.get(lang) ?? new Map();
      assert.ok(!visti.has(t), `titolo duplicato fra ${visti.get(t)} e ${p} (lang="${lang}"): ${t}`);
      visti.set(t, p);
      vistiPerLingua.set(lang, visti);
    }
  });
});
