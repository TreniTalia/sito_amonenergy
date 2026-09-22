import { readFileSync, existsSync, statSync } from 'node:fs';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { globSync } from 'node:fs';
import { createServer } from 'node:http';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const skip = existsSync(path.join(DIST, 'index.html'))
  ? false
  : 'dist assente: esegui `npm run build` prima di questo test';

// Stesso preambolo Playwright degli altri test del repo (hero-mobile-layout,
// navbar-active-pill): `dist` serve staticamente via HTTP locale, il browser
// è un `chromium` headless. Qui in più leggiamo `analytics.ts` per sapere se
// il Measurement ID è ancora il segnaposto: in quel caso lo script GA4 non
// viene nemmeno iniettato in pagina, quindi il test che verifica il
// caricamento *dopo* il consenso non ha nulla da osservare e va saltato.
let playwright = null;
try {
  playwright = await import('playwright');
} catch {
  /* devDependency assente: i test si saltano */
}

const skipPlaywright = skip
  ? skip
  : !playwright
    ? 'playwright non installato'
    : false;

const analyticsSrc = readFileSync(
  fileURLToPath(new URL('../src/data/analytics.ts', import.meta.url)),
  'utf8',
);
const ga4Segnaposto = /GA4_ID\s*=\s*'G-XXXXXXXXXX'/.test(analyticsSrc);

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

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
  test('la pagina azienda espone l ancora clienti e non cita certificazioni', () => {
    const html = readFileSync(path.join(DIST, 'azienda', 'index.html'), 'utf8');
    assert.match(html, /id="clienti"/, 'manca id="clienti", destinazione di /i-nostri-clienti/');
    assert.ok(!/certificazion/i.test(html), 'la pagina cita certificazioni: vietato');
    assert.ok(!/Troia/.test(html), 'la pagina cita Troia: la sede è unica, a Castelluccio dei Sauri');
    assert.match(html, /"foundingDate":"2020"/, 'foundingDate deve valere 2020');
  });

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

  // Task 11 (review): `og:locale` era fisso a "it_IT" in Base.astro mentre
  // `webSite.inLanguage` derivava correttamente da `lang` — nessun test lo
  // copriva. Ora deriva da `lang` come l'altro, e questo test lo verifica su
  // ogni pagina delle due lingue, non solo sulla home.
  test('og:locale segue la lingua della pagina (it_IT / en_GB)', () => {
    for (const p of pagine()) {
      const html = readFileSync(path.join(DIST, p), 'utf8');
      const langMatch = html.match(/<html[^>]*\blang="([^"]*)"/);
      const lang = langMatch ? langMatch[1] : '';
      const atteso = lang === 'en' ? 'en_GB' : 'it_IT';
      assert.match(
        html,
        new RegExp(`property="og:locale" content="${atteso}"`),
        `${p}: og:locale non è "${atteso}" per lang="${lang}"`,
      );
    }
  });
});

describe('Google Analytics dietro consenso', { skip: skipPlaywright }, () => {
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
    origin = `http://127.0.0.1:${server.address().port}`;
    browser = await playwright.chromium.launch();
  });

  after(async () => {
    await browser?.close();
    server?.close();
  });

  // Non dipende dal segnaposto: che GA4 sia attivo o no, prima del consenso
  // non deve partire nessuna richiesta verso googletagmanager.com. È questo
  // il test che protegge davvero dalla violazione: deve passare sempre.
  test('gtag non parte senza consenso', async () => {
    const page = await browser.newPage();
    const richieste = [];
    page.on('request', (r) => {
      if (r.url().includes('googletagmanager.com')) richieste.push(r.url());
    });

    await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    assert.equal(richieste.length, 0, 'gtag caricato prima del consenso');

    await page.close();
  });

  test(
    'gtag non parte senza consenso, parte dopo il consenso',
    { skip: ga4Segnaposto && 'GA4_ID è ancora il segnaposto' },
    async () => {
      const page = await browser.newPage();
      const richieste = [];
      page.on('request', (r) => {
        if (r.url().includes('googletagmanager.com')) richieste.push(r.url());
      });

      await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
      assert.equal(richieste.length, 0, 'gtag caricato prima del consenso');

      await page.click('[data-consenso-accetta]');
      await page.waitForTimeout(500);
      assert.ok(richieste.length > 0, 'gtag non caricato dopo il consenso');

      await page.close();
    },
  );
});
