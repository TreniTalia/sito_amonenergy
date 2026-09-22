# Migrazione SEO di amonenergy.it — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** portare il sito Astro a sostituire il WordPress su amonenergy.it senza perdere posizionamento, aggiungendo 10 pagine per lingua e uno strato SEO completo.

**Architecture:** build statica Astro servita da nginx. I redirect e la canonicalizzazione del dominio vivono in `docker/nginx.conf`, perché in produzione non gira alcun processo Node. Un unico file `src/i18n/routes.ts` è la sorgente di verità delle coppie di URL IT/EN: da lì derivano `hreflang`, il selettore di lingua e i test sui redirect. Le 9 pagine tecniche sono una sola collection renderizzata da due route dinamiche, una per lingua.

**Tech Stack:** Astro 7 (statico, senza adapter), Tailwind 4 via `@tailwindcss/vite`, content collections con Zod, `@astrojs/sitemap`, Decap CMS, nginx 1.27, test con `node:test` + Playwright contro `dist`.

**Spec:** `docs/superpowers/specs/2026-09-22-migrazione-seo-design.md`

## Global Constraints

- **NAP unico, identico ovunque**: `Amon Energy S.r.l.` — `Via Roma 105, 71025 Castelluccio dei Sauri (FG)` — `+39 0881 377590`. Sede unica. Mai citare Troia né il CAP 71029.
- **Nessuna certificazione aziendale** va nominata in nessuna pagina, in nessuna lingua.
- `foundingDate` nel JSON-LD vale **2020**. Il 2000 si cita solo in prosa, come origine dell'esperienza.
- **Nessuna fotografia** nelle pagine nuove. Solo SVG nel linguaggio di `src/components/CoverageMap.astro`: navy, tratto sottile, verde come micro-accento.
- **Nessuna catena di redirect**: ogni vecchio URL raggiunge la destinazione finale con un solo salto.
- Le 9 pagine tecniche **non entrano nella navigazione**. Nav: Home, Azienda, Servizi, Lavori, Contatti.
- Measurement ID GA4 = `G-XXXXXXXXXX` (segnaposto, lo fornirà il cliente).
- Ogni norma tecnica citata dev'essere verificata prima di scriverla. Verificate e utilizzabili: **IEC 60076-18** (misura della risposta in frequenza, sweep 20 Hz–2 MHz, tensione di prova sotto 10 V RMS), **IEC 60270 / CEI EN 60270** (misure di scariche parziali, metodo convenzionale in pC), **CEI 0-16** con **CEI 0-16 V5** e **Delibera ARERA 564/2025/R/eel** per PF1/PF2 (già confermate dal cliente), **CEI EN 50110-1** e **CEI 11-27** (esercizio degli impianti e qualifica del personale, già in `home.yaml`).
- Commenti nel codice in italiano, come tutto il repository. Testo dei commit in italiano.
- I test si scrivono **prima** dell'implementazione e devono fallire prima di passare.

---

## Nota sul contenuto testuale

Le task 8-11 producono prosa tecnica. Il piano fissa per ciascuna pagina la
struttura esatta, i fatti verificati disponibili, le fonti da cui attingere e i
criteri di accettazione; **non** contiene le 20 pagine di prosa già scritte,
perché la prosa è il deliverable di quelle task, non un dettaglio omesso. Ogni
task di contenuto elenca i fatti che deve contenere e i test che lo verificano.

---

## Struttura dei file

**Nuovi, infrastruttura**

- `src/i18n/routes.ts` — coppie IT/EN di ogni URL; sorgente unica per `hreflang`, selettore di lingua e test
- `src/i18n/ui.ts` — dizionario delle stringhe di interfaccia (nav, CTA, etichette)
- `src/data/analytics.ts` — Measurement ID GA4
- `src/components/Analytics.astro` — caricamento `gtag.js` dietro consenso
- `src/components/LangSwitch.astro` — selettore di lingua nell'header

**Nuovi, pagine tecniche**

- `src/content/servizi-dettaglio/it/*.md` (9 file) e `.../en/*.md` (9 file)
- `src/pages/servizi/[slug].astro` e `src/pages/en/services/[slug].astro`
- `src/components/tech/SpecPanel.astro`, `ProcessSteps.astro`, `ParamGrid.astro`, `TechFaq.astro`
- `src/components/tech/diagrams/*.astro` (9 SVG) + `index.ts` che li mappa per chiave

**Nuovi, azienda e mirror EN**

- `src/pages/azienda.astro`, `src/content/pagine/it/azienda.yaml` (recuperato da Git)
- `src/pages/en/index.astro`, `company.astro`, `services/index.astro`, `projects.astro`, `contacts.astro`, `privacy-policy.astro`

**Modificati**

- `src/layouts/Base.astro` — `og:image:*`, `hreflang`, `WebSite`, `BreadcrumbList`, `Analytics`, `lang` dinamico
- `astro.config.mjs` — blocco `i18n`, `sitemap({ i18n })`
- `src/content.config.ts` — collection `servizi-dettaglio`, schema `azienda`, percorsi per lingua
- `docker/nginx.conf` — canonicalizzazione `www`, mappa redirect completa, 410 sui residui WordPress
- `public/robots.txt`, `public/llms.txt`, `public/og-image.jpg`
- `public/admin/config.yml` — i18n e nuove collection
- `src/components/Header.astro`, `Footer.astro` — voce Azienda, selettore di lingua
- `src/pages/privacy-policy.astro` — voce GA4

**Test**

- `test/seo-head.test.mjs`, `test/redirects.test.mjs`, `test/i18n-routes.test.mjs`, `test/tech-pages.test.mjs`

---

## Task 1: Fondamenta SEO nell'head

**Files:**
- Create: `public/og-image.jpg`, `test/seo-head.test.mjs`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Produces: `Base.astro` accetta le props esistenti più `lang?: 'it' | 'en'` (default `'it'`). Emette `og:image:width`, `og:image:height`, `og:image:alt`, JSON-LD `WebSite` e `BreadcrumbList` su ogni pagina.

- [ ] **Step 1: Scrivere il test che fallisce**

`test/seo-head.test.mjs`, sullo stesso schema di `test/navbar-active-pill.test.mjs` (server statico su `dist`, skip se `dist` o Playwright mancano — copiare quel preambolo verbatim):

```js
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

const pagine = () =>
  globSync('**/index.html', { cwd: DIST }).filter((p) => !p.startsWith('admin/'));

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

  test('titoli e descrizioni sono unici fra le pagine', () => {
    const visti = new Map();
    for (const p of pagine()) {
      const html = readFileSync(path.join(DIST, p), 'utf8');
      const t = html.match(/<title>(.*?)<\/title>/s)[1];
      assert.ok(!visti.has(t), `titolo duplicato fra ${visti.get(t)} e ${p}: ${t}`);
      visti.set(t, p);
    }
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/seo-head.test.mjs`
Expected: FAIL — `og:image punta a un file inesistente: og-image.jpg`

- [ ] **Step 3: Creare `public/og-image.jpg`**

1200×630, fondo `var(--color-navy-950)`, marchio Amon Energy, la riga `Impianti connessi, energia sotto controllo.` in Archivo e un accento verde. Generarla con lo stesso pipeline sharp già usato per le foto del repository, oppure renderizzando una pagina Astro temporanea a 1200×630 con Playwright e salvandone lo screenshot. Peso obiettivo sotto 150 KB.

- [ ] **Step 4: Estendere l'head di `Base.astro`**

Aggiungere sotto `og:image`:

```astro
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={`${title} — Amon Energy`} />
```

E, accanto a `organization`, due blocchi nuovi:

```ts
// Il sito come entità a sé, distinta dall'azienda: è il blocco che lega
// dominio e lingua, e serve ai motori per capire che /en/ è lo stesso sito.
const webSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Amon Energy',
  url: Astro.site?.toString(),
  inLanguage: lang === 'en' ? 'en-GB' : 'it-IT',
  publisher: { '@type': 'Organization', name: contatti.ragioneSociale },
};

// Briciole calcolate dal path, così nessuna pagina può dimenticarsele: prima
// erano passate a mano da ogni pagina e la home non le aveva affatto.
const segmenti = Astro.url.pathname.split('/').filter(Boolean);
const breadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: new URL('/', Astro.site).toString() },
    ...segmenti.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 2,
      name: s.replace(/-/g, ' '),
      item: new URL(`/${segmenti.slice(0, i + 1).join('/')}/`, Astro.site).toString(),
    })),
  ],
};

const jsonLdBlocks = [organization, webSite, breadcrumb, ...structuredData];
```

Aggiungere all'oggetto `organization` esistente le tre proprietà che oggi mancano:

```ts
  logo: {
    '@type': 'ImageObject',
    url: new URL('/favicon.png', Astro.site).toString(),
  },
  foundingDate: '2020',
  numberOfEmployees: { '@type': 'QuantitativeValue', value: 20 },
```

`foundingDate` è **2020**, la data della persona giuridica. Il 2000 è l'origine dell'esperienza e si racconta solo in prosa: metterlo in un dato strutturato sarebbe falso e verificabile in visura.

Aggiungere a `Props` il campo `lang?: 'it' | 'en'`, estrarlo con default `'it'`, e usarlo in `<html lang={lang}>`.

Rimuovere il `breadcrumb` passato a mano in `structuredData` da `contatti.astro`, `lavori.astro`, `privacy-policy.astro`, `servizi/index.astro`, altrimenti ogni pagina emette due `BreadcrumbList` in conflitto.

- [ ] **Step 5: Eseguire i test e verificare che passino**

Run: `npm run build && node --test test/seo-head.test.mjs`
Expected: PASS, 5 test

- [ ] **Step 6: Commit**

```bash
git add public/og-image.jpg src/layouts/Base.astro src/pages test/seo-head.test.mjs
git commit -m "feat(seo): og-image reale, meta immagine completi, WebSite e BreadcrumbList su ogni pagina"
```

---

## Task 2: GA4 dietro consenso

**Files:**
- Create: `src/data/analytics.ts`, `src/components/Analytics.astro`
- Modify: `src/layouts/Base.astro`, `src/components/CookieConsent.astro`, `src/pages/privacy-policy.astro`
- Test: `test/seo-head.test.mjs` (nuovo blocco)

**Interfaces:**
- Consumes: `Base.astro` di Task 1.
- Produces: `src/data/analytics.ts` esporta `export const GA4_ID = 'G-XXXXXXXXXX';`. `CookieConsent.astro` emette l'evento `amon:consenso` su `document` con `detail: { analytics: boolean }` all'accettazione e al ripristino di una preferenza salvata.

- [ ] **Step 1: Scrivere il test che fallisce**

Aggiungere a `test/seo-head.test.mjs`, dentro un nuovo `describe`, un test Playwright (riusare `browser`/`origin` del preambolo):

```js
test('gtag non parte senza consenso, parte dopo il consenso', async () => {
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
});
```

Se l'attributo `data-consenso-accetta` non esiste in `CookieConsent.astro`, aggiungerlo al pulsante di accettazione nello stesso step in cui si scrive il test: è un aggancio per il test, non logica.

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/seo-head.test.mjs`
Expected: FAIL — `gtag non caricato dopo il consenso`

- [ ] **Step 3: Creare `src/data/analytics.ts`**

```ts
// Measurement ID di Google Analytics 4. Sta scritto in chiaro di proposito:
// un Measurement ID finisce comunque nell'HTML di ogni pagina, non è un
// segreto. Il segnaposto resta finché il cliente non fornisce quello vero;
// cambiarlo qui è l'unica modifica necessaria, poi serve un rebuild
// (la build è statica, una variabile d'ambiente sul container non la
// raggiungerebbe).
export const GA4_ID = 'G-XXXXXXXXXX';

// Con il segnaposto ancora in posizione lo script non si carica: meglio zero
// dati che dati sparati su una proprietà inesistente.
export const analyticsAttivo = !GA4_ID.includes('XXXXXXXXXX');
```

- [ ] **Step 4: Creare `src/components/Analytics.astro`**

```astro
---
import { GA4_ID, analyticsAttivo } from '../data/analytics.ts';
---

{
  analyticsAttivo && (
    <script is:inline define:vars={{ GA4_ID }}>
      // Caricamento differito fino al consenso esplicito: il tag non deve
      // esistere nella pagina prima che l'utente abbia accettato, altrimenti
      // il banner è decorativo e l'informativa è falsa.
      let caricato = false;
      const carica = () => {
        if (caricato) return;
        caricato = true;
        const s = document.createElement('script');
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
        document.head.appendChild(s);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', GA4_ID, { anonymize_ip: true });
      };
      document.addEventListener('amon:consenso', (e) => {
        if (e.detail?.analytics) carica();
      });
    </script>
  )
}
```

- [ ] **Step 5: Emettere l'evento da `CookieConsent.astro`**

Nel punto in cui il consenso viene accettato e in quello in cui una preferenza salvata viene riletta all'avvio:

```js
document.dispatchEvent(
  new CustomEvent('amon:consenso', { detail: { analytics: true } }),
);
```

- [ ] **Step 6: Montare `Analytics` in `Base.astro`**

Importarlo e inserirlo in fondo a `<body>`, accanto a `CookieConsent`.

- [ ] **Step 7: Aggiornare la Privacy Policy**

In `src/pages/privacy-policy.astro`, sezione cookie: aggiungere Google Analytics 4 con finalità (misurazione statistica del traffico), titolare del trattamento dei dati raccolti (Google Ireland Limited), base giuridica (consenso), durata dei cookie `_ga` (24 mesi) e `_ga_<ID>` (24 mesi), e la nota che l'IP è anonimizzato e lo script non viene caricato senza consenso.

- [ ] **Step 8: Eseguire i test**

Run: `npm run build && node --test test/seo-head.test.mjs`
Expected: PASS. Con il segnaposto ancora in `analytics.ts` il test sul consenso va marcato `skip` con motivazione `GA4_ID è ancora il segnaposto`; il test sulla **non** esecuzione prima del consenso deve passare comunque.

- [ ] **Step 9: Commit**

```bash
git add src/data/analytics.ts src/components/Analytics.astro src/components/CookieConsent.astro src/layouts/Base.astro src/pages/privacy-policy.astro test/seo-head.test.mjs
git commit -m "feat(seo): GA4 caricato solo dopo il consenso, con voce in privacy policy"
```

---

## Task 3: `robots.txt` e `llms.txt`

**Files:**
- Create: `public/llms.txt`
- Modify: `public/robots.txt`

- [ ] **Step 1: Estendere `public/robots.txt`**

```
User-agent: *
Allow: /

# Crawler dei modelli linguistici, dichiarati per nome. `User-agent: *` li
# coprirebbe già: la riga esplicita è il segnale che questi crawler leggono,
# e l'accesso è consentito di proposito — senza accesso non ci citano.
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://amonenergy.it/sitemap-index.xml
```

- [ ] **Step 2: Creare `public/llms.txt`**

Formato: un `# Amon Energy` in testa, un paragrafo che dice chi è l'azienda (sede unica a Castelluccio dei Sauri, 20 persone, dal 2000 come esperienza e dal 2020 come Amon Energy S.r.l., 140+ impianti MT in O&M, Control Room 24/7), poi una sezione `## Pagine` con una riga per URL nella forma `- [Titolo](https://amonenergy.it/percorso/): una riga di descrizione`. Includere tutti e 30 gli URL del sito, italiani e inglesi. Nessuna certificazione.

- [ ] **Step 3: Verificare che finiscano in `dist`**

Run: `npm run build && ls dist/robots.txt dist/llms.txt`
Expected: entrambi presenti

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt public/llms.txt
git commit -m "feat(seo): llms.txt e Allow esplicito per i crawler dei modelli linguistici"
```

---

## Task 4: nginx — dominio canonico e residui WordPress

**Files:**
- Create: `test/redirects.test.mjs`
- Modify: `docker/nginx.conf`

**Interfaces:**
- Produces: `test/redirects.test.mjs` esporta, per riuso nelle task successive, la funzione `leggiMappa(nome)` che estrae le coppie `pattern → destinazione` da un blocco `map` di `docker/nginx.conf`.

- [ ] **Step 1: Scrivere il test che fallisce**

```js
import { readFileSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const CONF = readFileSync(fileURLToPath(new URL('../docker/nginx.conf', import.meta.url)), 'utf8');

/** Estrae le coppie pattern/destinazione da un blocco `map ... $nome { ... }`. */
export function leggiMappa(nome) {
  const blocco = CONF.match(new RegExp(`map\\s+\\S+\\s+\\$${nome}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(blocco, `blocco map $${nome} non trovato in docker/nginx.conf`);
  const coppie = new Map();
  for (const riga of blocco[1].split('\n')) {
    const m = riga.trim().match(/^(~?\S+)\s+"?([^";]+)"?;/);
    if (m && m[1] !== 'default') coppie.set(m[1], m[2].trim());
  }
  return coppie;
}

describe('nginx: dominio canonico e residui WordPress', () => {
  test('www redirige al dominio nudo con 301', () => {
    assert.match(
      CONF,
      /server_name\s+www\.amonenergy\.it;[\s\S]*?return\s+301\s+https:\/\/amonenergy\.it\$request_uri;/,
      'manca il server che redirige www al dominio nudo',
    );
  });

  test('solo il dominio nudo è indicizzabile', () => {
    const robots = leggiMappa('robots_tag');
    assert.equal(robots.get('amonenergy.it'), '', 'il dominio nudo deve essere indicizzabile');
    assert.ok(
      !robots.has('www.amonenergy.it') || robots.get('www.amonenergy.it') !== '',
      'www non deve più essere marcato indicizzabile: ora redirige',
    );
  });

  test('gli endpoint WordPress rispondono 410, non 404', () => {
    for (const p of ['wp-admin', 'wp-login\\.php', 'xmlrpc\\.php']) {
      assert.match(CONF, new RegExp(`${p}[\\s\\S]{0,120}return\\s+410`), `manca il 410 per ${p}`);
    }
  });

  test('i vecchi sitemap e i feed redirigono', () => {
    const legacy = leggiMappa('legacy_redirect');
    assert.equal(legacy.get('~^/sitemap_index\\.xml$'), '/sitemap-index.xml');
    assert.equal(legacy.get('~^/page-sitemap\\.xml$'), '/sitemap-index.xml');
    assert.equal(legacy.get('~^/feed/?$'), '/');
    assert.equal(legacy.get('~^/comments/feed/?$'), '/');
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `node --test test/redirects.test.mjs`
Expected: FAIL — `manca il server che redirige www al dominio nudo`

- [ ] **Step 3: Aggiungere il server `www` in `docker/nginx.conf`**

Prima del `server` esistente:

```nginx
# Canonicalizzazione del dominio: vince amonenergy.it nudo.
#
# Senza questo blocco nginx serve lo stesso contenuto su amonenergy.it e su
# www.amonenergy.it, e per Google sono due siti identici che si dividono i
# segnali. $request_uri conserva path e query string, quindi il redirect è
# valido anche per gli URL profondi e non crea una catena: chi arriva su
# www/vecchio-url fa un solo salto verso il dominio nudo, dove poi la mappa
# legacy lo manda a destinazione. Due salti in quel caso sono inevitabili e
# riguardano solo chi digita il www su un vecchio indirizzo.
server {
    listen 80;
    server_name www.amonenergy.it;
    return 301 https://amonenergy.it$request_uri;
}
```

Nella mappa `$robots_tag`, togliere la riga `www.amonenergy.it  "";`: quell'host non serve più contenuto.

- [ ] **Step 4: Aggiungere 410 e redirect dei residui**

Dentro il `server` principale:

```nginx
# Endpoint del vecchio WordPress. 410 e non 404: dichiara al crawler che
# l'URL è sparito in modo definitivo, e taglia il rumore dei bot che
# continuano a sondare le installazioni WordPress.
location ~ ^/(wp-admin|wp-login\.php|xmlrpc\.php|wp-json) {
    return 410;
}
```

E nella mappa `$legacy_redirect`:

```nginx
    ~^/sitemap_index\.xml$    /sitemap-index.xml;
    ~^/page-sitemap\.xml$     /sitemap-index.xml;
    ~^/feed/?$                /;
    ~^/comments/feed/?$       /;
```

- [ ] **Step 5: Verificare la sintassi nginx**

Run: `docker run --rm -v "$(pwd)/docker/nginx.conf:/etc/nginx/conf.d/site.conf:ro" nginx:1.27-alpine nginx -t`
Expected: `syntax is ok` / `test is successful`

- [ ] **Step 6: Eseguire i test**

Run: `node --test test/redirects.test.mjs`
Expected: PASS, 4 test

- [ ] **Step 7: Commit**

```bash
git add docker/nginx.conf test/redirects.test.mjs
git commit -m "feat(seo): canonicalizza su amonenergy.it nudo, 410 sui residui WordPress"
```

---

## Task 5: Impalcatura i18n

**Files:**
- Create: `src/i18n/routes.ts`, `src/i18n/ui.ts`, `test/i18n-routes.test.mjs`
- Modify: `astro.config.mjs`, `src/layouts/Base.astro`

**Interfaces:**
- Produces:
  - `src/i18n/routes.ts` esporta `export type Lingua = 'it' | 'en';`, `export const ROTTE: readonly { it: string; en: string }[]`, `export function gemella(pathname: string): { lingua: Lingua; altra: string | null }`.
  - `Base.astro` emette `<link rel="alternate" hreflang="...">` per la pagina stessa, la gemella e `x-default`.

- [ ] **Step 1: Scrivere il test che fallisce**

```js
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

const fileDi = (rotta) => path.join(DIST, rotta.replace(/^\//, ''), 'index.html');

describe('rotte bilingui', { skip }, () => {
  test('ogni rotta esiste in entrambe le lingue', () => {
    assert.ok(ROTTE, 'src/i18n/routes.ts non importabile');
    for (const r of ROTTE) {
      assert.ok(existsSync(fileDi(r.it)), `manca la pagina italiana ${r.it}`);
      assert.ok(existsSync(fileDi(r.en)), `manca la pagina inglese ${r.en}`);
    }
  });

  test('gli hreflang sono reciproci', () => {
    for (const r of ROTTE) {
      const it = readFileSync(fileDi(r.it), 'utf8');
      const en = readFileSync(fileDi(r.en), 'utf8');
      assert.match(it, new RegExp(`hreflang="en"[^>]*href="[^"]*${r.en}"`), `${r.it}: non punta a ${r.en}`);
      assert.match(en, new RegExp(`hreflang="it"[^>]*href="[^"]*${r.it}"`), `${r.en}: non punta a ${r.it}`);
      assert.match(it, /hreflang="x-default"/, `${r.it}: manca x-default`);
      assert.match(en, /hreflang="x-default"/, `${r.en}: manca x-default`);
    }
  });

  test('le pagine inglesi dichiarano lang="en"', () => {
    for (const r of ROTTE) {
      assert.match(readFileSync(fileDi(r.en), 'utf8'), /<html lang="en"/, `${r.en}: lang errato`);
    }
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/i18n-routes.test.mjs`
Expected: FAIL — `src/i18n/routes.ts non importabile`

- [ ] **Step 3: Creare `src/i18n/routes.ts`**

```ts
// Sorgente unica delle coppie di URL fra le due lingue.
//
// Da qui derivano tre cose che altrimenti divergerebbero in silenzio: gli
// hreflang nell'head, il selettore di lingua nell'header e i test che
// verificano che ogni pagina esista in entrambe le lingue. Uno slug inglese
// cambiato qui si propaga ovunque; cambiato altrove, rompe solo un pezzo.
//
// Gli slug inglesi sono tradotti e non copiati dall'italiano: uno slug è un
// fattore di ranking debole ma reale, e un lettore inglese capisce
// /en/services/insulation-testing/, non /en/services/prove-isolamento/.
export type Lingua = 'it' | 'en';

export const ROTTE = [
  { it: '/', en: '/en/' },
  { it: '/azienda/', en: '/en/company/' },
  { it: '/servizi/', en: '/en/services/' },
  { it: '/servizi/sfra/', en: '/en/services/sfra/' },
  { it: '/servizi/misure-scariche-parziali/', en: '/en/services/partial-discharge-measurement/' },
  { it: '/servizi/verifica-protezioni-at-mt/', en: '/en/services/hv-mv-protection-testing/' },
  { it: '/servizi/verifiche-trasformatori-di-potenza/', en: '/en/services/power-transformer-testing/' },
  { it: '/servizi/prove-isolamento/', en: '/en/services/insulation-testing/' },
  { it: '/servizi/rcs-monitoraggio-cabina-mt/', en: '/en/services/rcs-mv-substation-monitoring/' },
  { it: '/servizi/cci-controllore-centrale-impianto/', en: '/en/services/cci-central-plant-controller/' },
  { it: '/servizi/teledistacco-a72/', en: '/en/services/a72-remote-tripping/' },
  { it: '/servizi/lettura-contatori/', en: '/en/services/meter-reading/' },
  { it: '/lavori/', en: '/en/projects/' },
  { it: '/contatti/', en: '/en/contacts/' },
  { it: '/privacy-policy/', en: '/en/privacy-policy/' },
] as const;

/** Data una pathname, dice in che lingua siamo e qual è la pagina gemella. */
export function gemella(pathname: string): { lingua: Lingua; altra: string | null } {
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const r = ROTTE.find((r) => r.it === p || r.en === p);
  if (!r) return { lingua: p.startsWith('/en/') ? 'en' : 'it', altra: null };
  return r.it === p ? { lingua: 'it', altra: r.en } : { lingua: 'en', altra: r.it };
}
```

- [ ] **Step 4: Creare `src/i18n/ui.ts`**

Dizionario delle sole stringhe di interfaccia (non dei contenuti, che stanno nelle collection): voci di nav, etichette dei pulsanti, `Chiamaci`, `Scopri i servizi`, intestazioni del footer, testo del banner cookie, etichette delle briciole. Forma:

```ts
export const UI = {
  it: { nav: { home: 'Home', azienda: 'Azienda', servizi: 'Servizi', lavori: 'Lavori', contatti: 'Contatti' }, /* … */ },
  en: { nav: { home: 'Home', azienda: 'Company', servizi: 'Services', lavori: 'Projects', contatti: 'Contacts' }, /* … */ },
} as const;

export const t = (lingua: 'it' | 'en') => UI[lingua];
```

- [ ] **Step 5: Configurare i18n in `astro.config.mjs`**

```js
  // Italiano senza prefisso (gli URL già indicizzati non si spostano),
  // inglese sotto /en/.
  i18n: {
    locales: ['it', 'en'],
    defaultLocale: 'it',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'it',
        locales: { it: 'it-IT', en: 'en-GB' },
      },
    }),
    icon(),
  ],
```

- [ ] **Step 6: Emettere gli `hreflang` in `Base.astro`**

```astro
---
import { gemella } from '../i18n/routes.ts';
const { lingua, altra } = gemella(Astro.url.pathname);
const rottaIt = lingua === 'it' ? Astro.url.pathname : altra;
---
<link rel="alternate" hreflang={lingua} href={canonicalURL} />
{altra && <link rel="alternate" hreflang={lingua === 'it' ? 'en' : 'it'} href={new URL(altra, Astro.site)} />}
{rottaIt && <link rel="alternate" hreflang="x-default" href={new URL(rottaIt, Astro.site)} />}
```

`x-default` punta sempre all'italiano: è la lingua del mercato principale.

Sostituire il default della prop `lang` con `lingua`, così nessuna pagina deve ricordarsi di passarlo.

- [ ] **Step 7: Eseguire il test**

Run: `npm run build && node --test test/i18n-routes.test.mjs`
Expected: FAIL sul primo test (`manca la pagina italiana /azienda/`) — corretto: le pagine arrivano nelle task successive. Gli `hreflang` sulle 4 rotte già esistenti devono però essere già reciproci una volta create le gemelle in Task 11.

- [ ] **Step 8: Commit**

```bash
git add src/i18n astro.config.mjs src/layouts/Base.astro test/i18n-routes.test.mjs
git commit -m "feat(i18n): impalcatura bilingue, rotte gemelle e hreflang reciproci"
```

---

## Task 6: Pagina `/azienda/`

**Files:**
- Create: `src/pages/azienda.astro`, `src/content/pagine/azienda.yaml` (recuperato da Git)
- Modify: `src/content.config.ts`, `src/components/Header.astro`, `src/components/Footer.astro`, `docker/nginx.conf`

**Interfaces:**
- Consumes: `Base.astro` di Task 1, `ROTTE` di Task 5.
- Produces: la pagina `/azienda/` con un elemento `id="clienti"` sulla sezione del roster, destinazione del redirect di `/i-nostri-clienti/`.

- [ ] **Step 1: Recuperare il contenuto da Git**

```bash
git show 95c0739^:src/content/pagine/azienda.yaml > src/content/pagine/azienda.yaml
git show 95c0739^:src/pages/azienda.astro > src/pages/azienda.astro
git show 95c0739^:src/content.config.ts | sed -n '/aziendaSchema/,/});/p'
```

Il terzo comando stampa `aziendaSchema` da reintrodurre in `src/content.config.ts`, dentro lo `z.discriminatedUnion('pagina', [...])`.

- [ ] **Step 2: Scrivere il test che fallisce**

In `test/seo-head.test.mjs`, nuovo test:

```js
test('la pagina azienda espone l ancora clienti e non cita certificazioni', () => {
  const html = readFileSync(path.join(DIST, 'azienda', 'index.html'), 'utf8');
  assert.match(html, /id="clienti"/, 'manca id="clienti", destinazione di /i-nostri-clienti/');
  assert.ok(!/certificazion/i.test(html), 'la pagina cita certificazioni: vietato');
  assert.ok(!/Troia/.test(html), 'la pagina cita Troia: la sede è unica, a Castelluccio dei Sauri');
  assert.match(html, /"foundingDate":"2020"/, 'foundingDate deve valere 2020');
});
```

- [ ] **Step 3: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/seo-head.test.mjs`
Expected: FAIL — file `dist/azienda/index.html` inesistente

- [ ] **Step 4: Adattare la pagina recuperata**

La pagina risale a prima della ristrutturazione: va riallineata allo stato attuale.

1. Rimuovere qualunque sezione o voce sulle certificazioni.
2. Aggiungere `id="clienti"` alla sezione con `ClientMarquee`.
3. Sostituire eventuali link a pagine servizio non più esistenti con `/servizi/`.
4. Aggiungere `CoverageMap` e `StatBar` se la versione recuperata non li ha.
5. Passare a `Base` uno `structuredData` con `foundingDate: '2020'` e `numberOfEmployees: 20` come proprietà aggiuntive dell'`Organization` — oppure, meglio, aggiungerle direttamente all'oggetto `organization` in `Base.astro`, così valgono su tutte le pagine.
6. Verificare che il testo recuperato non nomini Troia né il CAP 71029.

- [ ] **Step 5: Rimettere Azienda nella navigazione**

In `Header.astro` (nav desktop e pannello mobile) e nella colonna del footer: voce `Azienda` con `href="/azienda/"`, fra Home e Servizi. Le 9 pagine tecniche **non** vanno nel menu.

- [ ] **Step 6: Correggere i due redirect con destinazione sbagliata**

In `docker/nginx.conf`:

```nginx
    ~^/i-nostri-clienti/?$    "/azienda/#clienti";
    ~^/lavora-con-noi/?$      /contatti/;
```

(oggi puntano entrambi a `/`, perché furono scritti subito dopo l'eliminazione della pagina Azienda)

- [ ] **Step 7: Eseguire i test**

Run: `npm run build && node --test test/seo-head.test.mjs test/redirects.test.mjs`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/pages/azienda.astro src/content/pagine/azienda.yaml src/content.config.ts src/components/Header.astro src/components/Footer.astro docker/nginx.conf test/seo-head.test.mjs
git commit -m "feat(azienda): ripristina la pagina Azienda e ripunta i redirect che vi arrivano"
```

---

## Task 7: Componenti grafici delle pagine tecniche

**Files:**
- Create: `src/components/tech/SpecPanel.astro`, `ProcessSteps.astro`, `ParamGrid.astro`, `TechFaq.astro`

**Interfaces:**
- Produces:
  - `SpecPanel`: props `{ titolo: string; voci: { etichetta: string; valore: string }[] }`
  - `ProcessSteps`: props `{ fasi: { titolo: string; testo: string }[] }`
  - `ParamGrid`: props `{ voci: { titolo: string; testo: string; icona: string }[] }`
  - `TechFaq`: props `{ domande: { d: string; r: string }[] }` — rende `<details>` accessibili e **non** emette JSON-LD (lo emette la pagina, per non duplicarlo)

- [ ] **Step 1: Leggere il linguaggio visivo esistente**

Leggere `src/components/CoverageMap.astro` (palette, spessori, uso del verde, tacche d'angolo) e `DESIGN.md` §0. I componenti nuovi devono sembrare disegnati dalla stessa mano.

- [ ] **Step 2: Scrivere `SpecPanel.astro`**

Pannello `.ds-panel` in vetro, titolo in eyebrow maiuscolo spaziato, elenco di righe etichetta/valore separate da una linea sottile `color-mix(in srgb, var(--color-paper) 12%, transparent)`. Valori in tabulare (`font-variant-numeric: tabular-nums`) perché sono misure.

- [ ] **Step 3: Scrivere `ProcessSteps.astro`**

Fasi numerate, collegate da una linea verticale su mobile e orizzontale da 768px in su. Il numero in un cerchio con bordo verde sottile, mai pieno: il verde resta micro-accento.

- [ ] **Step 4: Scrivere `ParamGrid.astro`**

Griglia 1 colonna su mobile, 2 da 640px, 3 da 1024px. Ogni voce usa `GlassSvgIcon` con la chiave passata in `icona`.

- [ ] **Step 5: Scrivere `TechFaq.astro`**

`<details>`/`<summary>` nativi, con chevron che ruota all'apertura. Nativi e non un accordion in JavaScript: sono già accessibili da tastiera e il loro contenuto resta nel DOM, quindi leggibile dai crawler anche da chiuso.

- [ ] **Step 6: Verificare visivamente a 390 e 1440**

Run: `npm run build && npm run preview -- --port 4322`, poi uno script Playwright temporaneo nella cartella scratchpad che apre la prima pagina tecnica costruita in Task 8 e salva gli screenshot. Cancellare lo script dopo.

- [ ] **Step 7: Commit**

```bash
git add src/components/tech
git commit -m "feat(tech): componenti SpecPanel, ProcessSteps, ParamGrid e TechFaq"
```

---

## Task 8: Collection, route dinamiche e pagina pilota SFRA

**Files:**
- Create: `src/content/servizi-dettaglio/it/sfra.md`, `src/pages/servizi/[slug].astro`, `src/components/tech/diagrams/RispostaFrequenza.astro`, `src/components/tech/diagrams/index.ts`, `test/tech-pages.test.mjs`
- Modify: `src/content.config.ts`, `src/pages/servizi/index.astro`

**Interfaces:**
- Consumes: componenti di Task 7.
- Produces:
  - schema `serviziDettaglio` con i campi: `titolo`, `lead`, `seoTitle`, `seoDescription`, `ordine`, `diagramma` (chiave), `problema` (array di stringhe), `parametri` (array `{titolo, testo, icona}`), `fasi` (array `{titolo, testo}`), `strumentazione` (array `{modello, nota}`), `norma` (`{codice, titolo, note}`), `caso` (opzionale, `{progetto, testo}`), `faq` (array `{d, r}`), `correlati` (array di id)
  - `src/components/tech/diagrams/index.ts` esporta `DIAGRAMMI: Record<string, AstroComponent>`

- [ ] **Step 1: Scrivere il test che fallisce**

```js
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

describe('pagine tecniche', { skip }, () => {
  test('la pagina SFRA esiste ed è completa', () => {
    const f = path.join(DIST, 'servizi', 'sfra', 'index.html');
    assert.ok(existsSync(f), 'manca /servizi/sfra/');
    const html = readFileSync(f, 'utf8');
    assert.match(html, /IEC 60076-18/, 'manca la norma di riferimento');
    assert.match(html, /"@type":"Service"/, 'manca il JSON-LD Service');
    assert.match(html, /"@type":"FAQPage"/, 'manca il JSON-LD FAQPage');
    assert.match(html, /<svg/, 'manca il diagramma SVG');
    assert.ok(!/<img[^>]+\.(jpe?g|png|webp|avif)/.test(html), 'la pagina contiene una fotografia');
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
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/tech-pages.test.mjs`
Expected: FAIL — `manca /servizi/sfra/`

- [ ] **Step 3: Aggiungere la collection in `src/content.config.ts`**

```ts
const serviziDettaglio = defineCollection({
  // Un livello di cartella per lingua: il glob prende entrambe, la route
  // filtra per prefisso dell'id.
  loader: glob({ pattern: '**/*.md', base: './src/content/servizi-dettaglio' }),
  schema: () =>
    z.object({
      titolo: z.string(),
      lead: z.string(),
      seoTitle: z.string(),
      seoDescription: z.string(),
      ordine: z.number(),
      diagramma: z.string(),
      problema: z.array(z.string()).min(2),
      parametri: z.array(z.object({ titolo: z.string(), testo: z.string(), icona: z.string() })).min(4),
      fasi: z.array(z.object({ titolo: z.string(), testo: z.string() })).min(3),
      strumentazione: z.array(z.object({ modello: z.string(), nota: z.string() })).min(1),
      norma: z.object({ codice: z.string(), titolo: z.string(), note: z.string() }),
      caso: z.object({ progetto: z.string(), testo: z.string() }).optional(),
      faq: z.array(z.object({ d: z.string(), r: z.string() })).min(3),
      correlati: z.array(z.string()).min(2),
    }),
});
```

Registrarla in `export const collections`.

- [ ] **Step 4: Scrivere il diagramma `RispostaFrequenza.astro`**

SVG inline, `viewBox="0 0 640 320"`, `role="img"` con `aria-label` descrittivo. Contenuto: assi con scala logaritmica in frequenza etichettata `20 Hz`, `1 kHz`, `100 kHz`, `2 MHz` (l'intervallo reale della IEC 60076-18), asse verticale in dB. Due tracciati sovrapposti: quello di riferimento in `#bcd6e8` continuo, quello misurato in `#4fd07f` — coincidenti in bassa frequenza e divergenti sopra i 100 kHz, che è dove una deformazione dell'avvolgimento si manifesta. Una banda verticale tenue sulla zona di divergenza con etichetta `scostamento`. Palette e spessori identici a `CoverageMap.astro`.

- [ ] **Step 5: Creare `src/components/tech/diagrams/index.ts`**

```ts
import RispostaFrequenza from './RispostaFrequenza.astro';

// Mappa chiave → componente. Il campo `diagramma` nel Markdown contiene la
// chiave: così il contenuto sceglie il disegno senza importare nulla, e il
// pannello CMS può offrire un elenco chiuso.
export const DIAGRAMMI = {
  'risposta-frequenza': RispostaFrequenza,
} as const;
```

- [ ] **Step 6: Scrivere `src/pages/servizi/[slug].astro`**

`getStaticPaths` filtra le voci con id che inizia per `it/`. La pagina monta, nell'ordine: `PageHero`, i paragrafi di `problema`, il diagramma da `DIAGRAMMI[diagramma]`, `ParamGrid`, `SpecPanel` (strumentazione), il blocco norma, il caso reale con link al progetto, `TechFaq`, i link ai `correlati`, `CtaBand`.

Passa a `Base` uno `structuredData` con due blocchi:

```ts
const service = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: data.titolo,
  serviceType: data.titolo,
  description: data.seoDescription,
  areaServed: { '@type': 'Place', name: 'Centro-Sud Italia' },
  provider: { '@type': 'Organization', name: contatti.ragioneSociale, url: Astro.site?.toString() },
};

const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: data.faq.map((f) => ({
    '@type': 'Question',
    name: f.d,
    acceptedAnswer: { '@type': 'Answer', text: f.r },
  })),
};
```

- [ ] **Step 7: Scrivere `src/content/servizi-dettaglio/it/sfra.md`**

Contenuti obbligatori, tutti verificati:

- `norma`: codice `IEC 60076-18`, titolo `Power transformers – Part 18: Measurement of frequency response`, note che citino l'intervallo **20 Hz – 2 MHz** e la tensione di prova **sotto 10 V RMS**
- `problema`: cosa rivela la risposta in frequenza — movimento del nucleo, deformazione e spostamento dell'avvolgimento, collasso parziale dell'avvolgimento, strutture di serraggio cedute, cortocircuiti e avvolgimenti aperti (fonte: la pagina SFRA del vecchio sito)
- `strumentazione`: l'analizzatore M5500, **solo dopo aver confermato** che è strumentazione di Amon Energy — compare sul vecchio sito ma non nell'elenco di `azienda.yaml`. Se non confermabile, descrivere la capacità senza nominare il modello.
- `caso`: la stazione di **Banzi**, dove l'analisi è stata eseguita confrontando la risposta con i valori di riferimento; il progetto esiste già in `src/content/progetti/banzi-montemilone.md`
- `fasi`: sopralluogo e messa in sicurezza, misura con cavi coassiali a doppia schermatura e treccia di massa piatta (prescrizione della norma), confronto con l'impronta di riferimento, referto
- `correlati`: `verifiche-trasformatori-di-potenza`, `misure-scariche-parziali`, `prove-isolamento`
- `seoTitle` e `seoDescription` scritti per la query `prova SFRA trasformatore`, dopo aver guardato cosa copre la prima pagina di Google su quella query

- [ ] **Step 8: Collegare la pagina dall'hub**

In `src/pages/servizi/index.astro`, nella sezione ingegneria elettrica, aggiungere i link alle pagine di dettaglio man mano che esistono. Senza questi link le pagine nuove sono orfane e Google le scopre solo dalla sitemap.

- [ ] **Step 9: Eseguire i test**

Run: `npm run build && node --test test/tech-pages.test.mjs`
Expected: PASS, 2 test

- [ ] **Step 10: Commit**

```bash
git add src/content.config.ts src/content/servizi-dettaglio src/pages/servizi src/components/tech/diagrams test/tech-pages.test.mjs
git commit -m "feat(tech): collection servizi-dettaglio, route dinamica e pagina SFRA"
```

---

## Task 9: Pagine tecniche — diagnostica (4 pagine)

**Files:**
- Create: `src/content/servizi-dettaglio/it/{misure-scariche-parziali,verifica-protezioni-at-mt,verifiche-trasformatori-di-potenza,prove-isolamento}.md`
- Create: `src/components/tech/diagrams/{ScaricheParziali,CurvaTempoCorrente,PuntiMisuraTrasformatore,RampaIsolamento}.astro`
- Modify: `src/components/tech/diagrams/index.ts`, `src/pages/servizi/index.astro`

**Interfaces:**
- Consumes: schema e route di Task 8. Nessuna interfaccia nuova.

- [ ] **Step 1: Estendere il test**

In `test/tech-pages.test.mjs`, aggiungere:

```js
const NORME = {
  'misure-scariche-parziali': /IEC 60270/,
  'verifica-protezioni-at-mt': /CEI 0-16/,
  'verifiche-trasformatori-di-potenza': /IEC 60076/,
  'prove-isolamento': /CEI 11-27|CEI EN 50110-1/,
};

test('ogni pagina di diagnostica cita la sua norma', () => {
  for (const [slug, re] of Object.entries(NORME)) {
    const f = path.join(DIST, 'servizi', slug, 'index.html');
    assert.ok(existsSync(f), `manca /servizi/${slug}/`);
    assert.match(readFileSync(f, 'utf8'), re, `${slug}: norma mancante`);
  }
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/tech-pages.test.mjs`
Expected: FAIL — `manca /servizi/misure-scariche-parziali/`

- [ ] **Step 3: Verificare le norme non ancora confermate**

`IEC 60076` ha molte parti: individuare quella corretta per le misure sui trasformatori di potenza prima di citarla (la parte 1 per le prescrizioni generali e le prove, non la 18 che riguarda la sola risposta in frequenza). Per le prove di isolamento, verificare se esiste una norma di prodotto pertinente; in assenza di certezza citare solo `CEI 11-27` e `CEI EN 50110-1`, che riguardano l'esercizio e la qualifica del personale e sono già confermate. **Non citare una norma non verificata.**

- [ ] **Step 4: Scrivere i quattro diagrammi**

- `ScaricheParziali` — sinusoide di tensione con impulsi di scarica sovrapposti, asse in pC, soglia orizzontale tratteggiata; nota che il metodo convenzionale della IEC 60270 misura in picocoulomb
- `CurvaTempoCorrente` — assi log-log, gradino `I>` e gradino `I>>`, punto di prova evidenziato in verde
- `PuntiMisuraTrasformatore` — sagoma schematica del trasformatore con i punti di misura numerati e collegati a un elenco laterale
- `RampaIsolamento` — rampa di tensione nel tempo con la corrente di fuga sovrapposta, e la zona in cui la curva si impenna marcata come anomalia

Registrarli tutti in `DIAGRAMMI`.

- [ ] **Step 5: Scrivere i quattro file Markdown**

Per ciascuno: struttura completa da schema, fatti dal vecchio sito, strumentazione dalla tabella in spec §3.3 (`b2 HVA68TD+PD` per le scariche parziali; `DRTS/64` e `ISA CBA 1000` per le protezioni; `ISA T2000` e `ISA STS5000 + TD500` per i trasformatori; `Megger HV Test 80 kV` per l'isolamento), 3-4 FAQ vere, e `correlati` che formino un anello: ogni pagina ne linka almeno due e ne è linkata da almeno due.

- [ ] **Step 6: Collegarle dall'hub `/servizi/`**

- [ ] **Step 7: Eseguire i test**

Run: `npm run build && node --test test/tech-pages.test.mjs`
Expected: PASS, 3 test

- [ ] **Step 8: Commit**

```bash
git add src/content/servizi-dettaglio src/components/tech/diagrams src/pages/servizi/index.astro test/tech-pages.test.mjs
git commit -m "feat(tech): quattro pagine di diagnostica strumentale"
```

---

## Task 10: Pagine tecniche — controllo e monitoraggio (4 pagine)

**Files:**
- Create: `src/content/servizi-dettaglio/it/{rcs-monitoraggio-cabina-mt,cci-controllore-centrale-impianto,teledistacco-a72,lettura-contatori}.md`
- Create: `src/components/tech/diagrams/{CatenaRcs,OsservabilitaControllabilita,CatenaA72,CatenaContatori}.astro`
- Modify: `src/components/tech/diagrams/index.ts`, `src/pages/servizi/index.astro`

- [ ] **Step 1: Estendere il test**

```js
test('tutte e nove le pagine tecniche esistono e hanno Service e FAQPage', () => {
  for (const s of SLUG) {
    const f = path.join(DIST, 'servizi', s, 'index.html');
    assert.ok(existsSync(f), `manca /servizi/${s}/`);
    const html = readFileSync(f, 'utf8');
    assert.match(html, /"@type":"Service"/, `${s}: manca Service`);
    assert.match(html, /"@type":"FAQPage"/, `${s}: manca FAQPage`);
    assert.ok(!/certificazion/i.test(html), `${s}: cita certificazioni`);
  }
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/tech-pages.test.mjs`
Expected: FAIL — `manca /servizi/rcs-monitoraggio-cabina-mt/`

- [ ] **Step 3: Scrivere i quattro diagrammi**

- `CatenaRcs` — cabina MT, unità RCS, collegamento, Control Room; lo stato che risale e il comando che ridiscende, con la richiusura automatica evidenziata
- `OsservabilitaControllabilita` — due colonne, PF1 osservabilità (lo stato dell'impianto letto dal CCI) e PF2 controllabilità (la limitazione di potenza attiva su comando del distributore), con il riferimento CEI 0-16 V5 e la Delibera ARERA 564/2025/R/eel già confermati dal cliente
- `CatenaA72` — RIGEDI, modem A72, SCADA, distributore: la catena di segnale del teledistacco
- `CatenaContatori` — contatore, acquisizione, validazione, portale

- [ ] **Step 4: Scrivere i quattro file Markdown**

Fonti: le pagine corrispondenti del vecchio sito e i contenuti già presenti in `src/content/pagine/servizi.yaml` (sezione `controllo`, blocchi `rcs` e `cci`, incluso il partner Teamware). La pagina CCI deve nominare Teamware come partner, coerentemente con l'hub.

Per `teledistacco-a72`, i fatti dal vecchio sito: verifica e diagnostica dei dispositivi RIGEDI e Modem A72, assistenza tecnica alla messa in servizio, analisi delle prestazioni e verifica di conformità, supporto nella comunicazione con il distributore, integrazione SCADA.

- [ ] **Step 5: Collegarle dall'hub e chiudere l'anello dei `correlati`**

Verificare che ogni pagina abbia almeno due link entranti da pagine sorelle, non solo uscenti.

- [ ] **Step 6: Eseguire i test**

Run: `npm run build && node --test test/tech-pages.test.mjs`
Expected: PASS, 4 test

- [ ] **Step 7: Commit**

```bash
git add src/content/servizi-dettaglio src/components/tech/diagrams src/pages/servizi/index.astro test/tech-pages.test.mjs
git commit -m "feat(tech): quattro pagine di controllo e monitoraggio"
```

---

## Task 11: Mirror inglese

**Files:**
- Create: `src/pages/en/{index,company,projects,contacts,privacy-policy}.astro`, `src/pages/en/services/{index,[slug]}.astro`
- Create: `src/content/servizi-dettaglio/en/*.md` (9 file), `src/content/pagine/en/*.yaml`
- Modify: `src/content.config.ts`, `src/components/Header.astro` (selettore di lingua), `src/components/LangSwitch.astro`

**Interfaces:**
- Consumes: `ROTTE` e `t()` di Task 5, collection di Task 8.
- Produces: `LangSwitch.astro` — nessuna prop; legge `Astro.url.pathname` e `gemella()`, e non si mostra quando `altra` è `null`.

- [ ] **Step 1: Spostare i contenuti italiani sotto `it/`**

```bash
mkdir -p src/content/pagine/it
git mv src/content/pagine/home.yaml src/content/pagine/contatti.yaml src/content/pagine/servizi.yaml src/content/pagine/azienda.yaml src/content/pagine/it/
```

Aggiornare gli id usati da `getEntry` nelle pagine (`home` diventa `it/home`) e le voci `file:` in `public/admin/config.yml`.

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/i18n-routes.test.mjs`
Expected: FAIL — `manca la pagina inglese /en/`

- [ ] **Step 3: Creare le pagine inglesi**

Ogni pagina inglese è la gemella strutturale dell'italiana: stessi componenti, stesso ordine, contenuto dalla collection `en`. Non duplicare la logica — se una pagina italiana contiene logica non banale, estrarla in un componente condiviso e farla usare a entrambe.

- [ ] **Step 4: Tradurre i contenuti**

Traduzione tecnica, non riscrittura. Vincoli: i nomi degli strumenti, i codici delle norme e i nomi propri restano invariati; il NAP resta in italiano (`Via Roma 105, 71025 Castelluccio dei Sauri (FG), Italy`); nessuna certificazione; `seoTitle` e `seoDescription` inglesi scritti per la query inglese, non tradotti alla lettera dall'italiano.

- [ ] **Step 5: Creare `LangSwitch.astro` e montarlo nell'header**

```astro
---
import { gemella } from '../i18n/routes.ts';
const { lingua, altra } = gemella(Astro.url.pathname);
---
{
  altra && (
    <a class="lang-switch" href={altra} hreflang={lingua === 'it' ? 'en' : 'it'} rel="alternate">
      {lingua === 'it' ? 'EN' : 'IT'}
    </a>
  )
}
```

Stile coerente con i pulsanti in vetro dell'header. Va nella nav desktop e nel pannello mobile.

- [ ] **Step 6: Eseguire i test**

Run: `npm run build && node --test test/i18n-routes.test.mjs test/seo-head.test.mjs test/tech-pages.test.mjs`
Expected: PASS su tutti e tre

- [ ] **Step 7: Commit**

```bash
git add src/pages/en src/content src/components/LangSwitch.astro src/components/Header.astro src/content.config.ts public/admin/config.yml
git commit -m "feat(i18n): mirror inglese completo con selettore di lingua"
```

---

## Task 12: Mappa redirect completa

**Files:**
- Modify: `docker/nginx.conf`, `test/redirects.test.mjs`

**Interfaces:**
- Consumes: `leggiMappa()` di Task 4, `ROTTE` di Task 5.

- [ ] **Step 1: Scrivere il test che fallisce**

```js
// Inventario reale del sito WordPress, letto dal suo page-sitemap.xml il
// 2026-09-22. È la lista che i redirect devono coprire per intero: se domani
// ne salta fuori un altro, si aggiunge qui e il test dice subito che manca.
const VECCHI_URL = [
  '/progetti/', '/i-nostri-clienti/', '/lavora-con-noi/', '/consulenza/', '/foto-video/',
  '/laboratorio-mobile/', '/centrix/', '/verifiche-strumentali/', '/monitoraggio-controllo/',
  '/gestione-e-manutenzione/', '/repowering-e-revamping-eolico/', '/prove-isolamento/',
  '/verifiche-strumentali/sfra/', '/verifiche-strumentali/misure-scariche-parziali/',
  '/verifiche-strumentali/verifica-protezioni-at-mt/',
  '/verifiche-strumentali/verifiche-trasformatori-potenza-misure/',
  '/monitoraggio-controllo/rcs-monitoraggio-e-controllo-cabina-mt/',
  '/monitoraggio-controllo/cci-controllore-centrale-dimpianto/',
  '/monitoraggio-controllo/teledistacco-a72/', '/monitoraggio-controllo/lettura-contatori/',
  '/company/', '/our-job/', '/our-clients/', '/rcs/', '/centrix-2-0/', '/contacts/',
  '/repowering-eolic-revamping/',
];

// Restano identici: devono rispondere 200, non redirigere.
const INVARIATI = ['/', '/azienda/', '/contatti/', '/privacy-policy/'];

const combacia = (mappa, url) => {
  for (const [pattern, dest] of mappa) {
    if (!pattern.startsWith('~')) continue;
    if (new RegExp(pattern.slice(1)).test(url)) return dest;
  }
  return null;
};

describe('mappa redirect completa', () => {
  const legacy = leggiMappa('legacy_redirect');

  test('ogni vecchio URL ha una destinazione', () => {
    for (const u of VECCHI_URL) {
      assert.ok(combacia(legacy, u), `nessun redirect per ${u}`);
    }
  });

  test('nessun URL invariato viene rediretto', () => {
    for (const u of INVARIATI) {
      assert.equal(combacia(legacy, u), null, `${u} non deve redirigere: resta identico`);
    }
  });

  test('ogni destinazione esiste in dist (nessuna catena, nessun 404)', () => {
    const DIST = fileURLToPath(new URL('../dist', import.meta.url));
    for (const u of VECCHI_URL) {
      const dest = combacia(legacy, u);
      const percorso = dest.split('#')[0];
      const f = path.join(DIST, percorso.replace(/^\//, ''), 'index.html');
      const diretto = path.join(DIST, percorso.replace(/^\//, ''));
      assert.ok(
        existsSync(f) || existsSync(diretto),
        `${u} punta a ${dest}, che non esiste in dist`,
      );
      assert.equal(combacia(legacy, percorso), null, `catena di redirect: ${u} → ${dest} → …`);
    }
  });

  test('le ancore usate come destinazione esistono nella pagina', () => {
    const DIST = fileURLToPath(new URL('../dist', import.meta.url));
    for (const u of VECCHI_URL) {
      const dest = combacia(legacy, u);
      const [percorso, ancora] = dest.split('#');
      if (!ancora) continue;
      const html = readFileSync(path.join(DIST, percorso.replace(/^\//, ''), 'index.html'), 'utf8');
      assert.match(html, new RegExp(`id="${ancora}"`), `${dest}: l'ancora #${ancora} non esiste`);
    }
  });
});
```

- [ ] **Step 2: Eseguire il test e verificare che fallisca**

Run: `npm run build && node --test test/redirects.test.mjs`
Expected: FAIL — `nessun redirect per /foto-video/`

- [ ] **Step 3: Completare la mappa `$legacy_redirect`**

Le 28 righe della spec §4. Le destinazioni con ancora vanno fra virgolette, come già fanno quelle esistenti. Ordine: prima i figli di secondo livello, poi i genitori — anche se i pattern ancorati con `/?$` rendono l'ordine non critico, tenerlo esplicito evita che la prossima riga aggiunta senza ancora rompa la mappa in silenzio. Scriverlo in un commento.

- [ ] **Step 4: Gestire la home inglese con query string**

```nginx
# La home inglese del vecchio sito era `/?lang=en`, e `map $uri` la query
# string non la vede: per nginx quell'URL ha $uri uguale a "/". Serve quindi
# una mappa sull'argomento, applicata solo quando $uri è esattamente "/".
#
# Trattamento concordato: best practice, non requisito. Se questo blocco
# mostra un comportamento anomalo sulla home italiana in fase di crawl, si
# rimuove — un singolo redirect perso vale meno della home.
map $arg_lang $home_en {
    default  "";
    en       /en/;
}
```

E nel `server`, prima delle altre `location`:

```nginx
location = / {
    if ($home_en) { return 301 $home_en; }
    try_files /index.html =404;
}
```

Verificare esplicitamente che `https://amonenergy.it/` senza query risponda `200` e non entri in alcun redirect.

- [ ] **Step 5: Verificare la sintassi e il comportamento reale**

```bash
docker run --rm -v "$(pwd)/docker/nginx.conf:/etc/nginx/conf.d/site.conf:ro" nginx:1.27-alpine nginx -t
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d web
for u in / /?lang=en /verifiche-strumentali/sfra/ /company/ /foto-video/ /wp-admin/; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "http://localhost:8080$u")"
done
```

Atteso: `/` → `200`; `/?lang=en` → `301 /en/`; `/verifiche-strumentali/sfra/` → `301 /servizi/sfra/`; `/company/` → `301 /en/company/`; `/foto-video/` → `301 /lavori/`; `/wp-admin/` → `410`.

- [ ] **Step 6: Eseguire i test**

Run: `npm run build && node --test test/redirects.test.mjs`
Expected: PASS, 8 test

- [ ] **Step 7: Commit**

```bash
git add docker/nginx.conf test/redirects.test.mjs
git commit -m "feat(seo): mappa redirect completa dai 28 vecchi URL WordPress"
```

---

## Task 13: Pannello CMS bilingue

**Files:**
- Modify: `public/admin/config.yml`

- [ ] **Step 1: Abilitare i18n in Decap**

```yaml
i18n:
  structure: multiple_folders
  locales: [it, en]
  default_locale: it
```

E su ogni collection interessata: `i18n: true` a livello di collection e sui singoli campi che vanno tradotti (`i18n: true`) o replicati senza traduzione (`i18n: duplicate` per numeri, ordini, chiavi di diagramma, icone).

- [ ] **Step 2: Aggiungere la collection `servizi-dettaglio`**

Una voce per ogni campo dello schema Zod di Task 8, con `hint` in italiano come le collection esistenti. Il campo `diagramma` va come `widget: select` con l'elenco chiuso delle chiavi registrate in `DIAGRAMMI`: un valore libero produrrebbe una pagina senza disegno.

- [ ] **Step 3: Rimettere la voce `azienda`**

Recuperabile da Git: `git show 95c0739^:public/admin/config.yml`, sezione `pagine → azienda`. Aggiornare `file:` al nuovo percorso `src/content/pagine/it/azienda.yaml`. Rimuovere ogni campo relativo alle certificazioni.

- [ ] **Step 4: Verificare il pannello**

Run: `npm run build && npm run preview -- --port 4322`, aprire `http://localhost:4322/admin/`, controllare che le collection compaiano, che l'editor mostri i due campi lingua affiancati e che il `select` del diagramma elenchi le nove chiavi. Il salvataggio richiede il backend GitHub e non va provato in locale.

- [ ] **Step 5: Commit**

```bash
git add public/admin/config.yml
git commit -m "feat(cms): pannello bilingue e collection delle pagine tecniche"
```

---

## Task 14: Verifica finale e checklist di cutover

**Files:**
- Create: `docs/superpowers/plans/2026-09-22-cutover-checklist.md`

- [ ] **Step 1: Eseguire l'intera suite**

Run: `npm run build && npm test`
Expected: tutti i test passano, nessuno saltato tranne quello su GA4 finché il Measurement ID è il segnaposto.

- [ ] **Step 2: Crawl completo su build reale**

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d web
```

Script temporaneo nella cartella scratchpad che, per ciascuno dei 28 vecchi URL, segue i redirect contando i salti e verifica: esattamente un `301`, stato finale `200`, destinazione attesa. Per i 4 invariati: `200` diretto, zero salti. Stampare una tabella. Cancellare lo script al termine.

- [ ] **Step 3: Verificare `X-Robots-Tag` per host**

```bash
curl -sI -H 'Host: amonenergy.it' http://localhost:8080/ | grep -i x-robots-tag
curl -sI -H 'Host: test.amonenergy.it' http://localhost:8080/ | grep -i x-robots-tag
```

Atteso: nessuna intestazione per `amonenergy.it`; `noindex, nofollow` per `test.amonenergy.it`. Questa è la verifica che azzera tutto il lavoro se salta.

- [ ] **Step 4: Validare i dati strutturati**

Passare l'HTML di home, `/azienda/`, `/servizi/sfra/` e `/en/services/sfra/` al Rich Results Test di Google. Zero errori; gli avvisi su proprietà raccomandate mancanti sono accettabili.

- [ ] **Step 5: Verificare la sitemap**

`dist/sitemap-0.xml` deve contenere 30 URL, entrambe le lingue, nessun URL che rediriga e nessuna pagina `admin`.

- [ ] **Step 6: Scrivere la checklist di cutover**

`docs/superpowers/plans/2026-09-22-cutover-checklist.md`: la sequenza operativa della spec §5.2 e §5.3 come elenco di caselle, con i comandi esatti accanto a ogni voce verificabile e, per le voci che spettano al cliente (TTL DNS, record TXT di Search Console, switch), l'indicazione esplicita di chi la esegue. È il documento che si riapre il giorno dello switch.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/plans/2026-09-22-cutover-checklist.md
git commit -m "docs: checklist operativa del giorno dello switch"
```

---

## Autoverifica del piano

**Copertura della spec**

| Sezione spec | Task |
|---|---|
| 1.1 og-image | 1 |
| 1.2 GA4 hardcoded | 2 |
| 1.3 GA4 dietro consenso, privacy policy | 2 |
| 1.4 Verifica Search Console via DNS TXT | 14 (voce a carico del cliente in checklist) |
| 1.5 WebSite, Service, FAQPage, BreadcrumbList, ImageObject | 1, 8 |
| 1.6 llms.txt, robots.txt | 3 |
| 2.1-2.2 routing e inventario | 5, 11 |
| 2.3 struttura piatta | 8 |
| 2.4 hreflang reciproci | 5 |
| 2.5 pagine EN orfane | 12 |
| 2.6 query string | 12 |
| 2.7 collection e CMS | 8, 11, 13 |
| 2.8 pagine escluse | 12 (restano redirect) |
| 3.1-3.2 anatomia e grafica | 7, 8 |
| 3.3 testo e norme | 8, 9, 10 |
| 3.4 ricerca query | 8, 9, 10 (nei passi su seoTitle/seoDescription) |
| 3.5 azienda | 6 |
| 3.6 volume | 8-11 |
| 4 mappa redirect | 4, 6, 12 |
| 5.1 canonicalizzazione www | 4 |
| 5.2-5.4 cutover e misura | 14 |

**Note aperte, da risolvere durante l'esecuzione, non rimandabili**

1. L'analizzatore **M5500** va confermato come strumentazione di Amon Energy prima di nominarlo (Task 8, Step 7).
2. La parte corretta della **IEC 60076** per le verifiche sui trasformatori di potenza va identificata prima di citarla (Task 9, Step 3).
3. Il **Measurement ID GA4** lo fornirà il cliente: fino ad allora `analyticsAttivo` è falso e lo script non viene emesso.
