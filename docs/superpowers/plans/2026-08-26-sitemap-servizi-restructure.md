# Sitemap Restructure (Servizi, Lavori, rimozione Azienda) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Passare dalla sitemap attuale (Home, Azienda, Servizi+5 sottopagine, Progetti, Contatti) a Home, Servizi (pagina unica), Lavori, Contatti — con nav, CMS e redirect legacy allineati.

**Architecture:** Nessun cambio di stack. Astro content collections (`servizi`, `pagine`) restano il modello dati; la pagina Servizi diventa una pagina bespoke a categorie (non più un loop 1:1 su file di dettaglio); i redirect vivono in nginx (`docker/nginx.conf`), non in Astro.

**Tech Stack:** Astro 7 (content collections, Zod), Tailwind v4, astro-icon (Font Awesome 6), Sveltia CMS (YAML config), nginx (redirect map), Playwright (test esistente, invariato).

**Spec:** `docs/superpowers/specs/2026-08-26-sitemap-servizi-restructure-design.md`

## Global Constraints

- URL finali: `/`, `/servizi/`, `/lavori/`, `/contatti/`. Nessuna sotto-pagina
  sotto `/servizi/`.
- Nessun redirect nuovo per `/azienda/` stesso (decisione cliente: 404 va
  bene). Ogni *altro* redirect legacy che oggi punta a `/azienda/` o a una
  pagina di dettaglio servizio va invece ripuntato (non deve mai finire su
  una pagina che non esiste più).
- Redirect `/progetti/` → `/lavori/` deve essere un vero 301 (nginx), non il
  meta-refresh statico di Astro.
- Costruzioni e Gestione e manutenzione restano servizi offerti (citati anche
  in home) — niente pagina di dettaglio a sé, ma restano contenuto vero.
- PF1 = osservabilità, PF2 = controllabilità/limitazione potenza attiva su
  comando del distributore. Riferimento: CEI 0-16 V5, Delibera ARERA
  564/2025/R/eel.
- Loghi di terze parti: Teamware a colori originali (partner nominato); MQTT,
  Zigbee, Modbus monocromi (marchi liberi da vincoli d'alterazione); OPC UA,
  Sparkplug B, IEC 61850/101 — **solo testo, nessun logo** (vincoli di
  trademark/membership — vedi spec §5).
- Nessun nuovo componente logo riusabile altrove: la soluzione resta locale a
  `src/pages/servizi/index.astro`.

---

## Task 1: Rinomina Progetti → Lavori

**Files:**
- Create: `src/pages/lavori.astro` (copia di `src/pages/progetti.astro` con
  breadcrumb/titolo aggiornati)
- Delete: `src/pages/progetti.astro`
- Modify: `docker/nginx.conf:16-24` (mappa `$legacy_redirect`)

**Interfaces:**
- Consumes: nulla (pagina foglia, nessuna dipendenza da altri task).
- Produces: URL pubblico `/lavori/`. I task successivi (3, 9) linkano a
  questo URL — deve esistere prima che quei task vengano eseguiti.

- [ ] **Step 1: Creare `src/pages/lavori.astro`**

Contenuto identico a `src/pages/progetti.astro` (letto per intero), con
`title`, `description` e breadcrumb aggiornati:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import PageHero from '../components/PageHero.astro';
import GalleryGrid from '../components/GalleryGrid.astro';
import Lightbox from '../components/Lightbox.astro';
import CtaBand from '../components/CtaBand.astro';

const progetti = (await getCollection('progetti')).sort((a, b) => a.data.ordine - b.data.ordine);

const breadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://amonenergy.it/' },
    { '@type': 'ListItem', position: 2, name: 'Lavori', item: 'https://amonenergy.it/lavori/' },
  ],
};
---

<Base
  title="Lavori"
  description="Sottostazioni AT/MT realizzate da Amon Energy per parchi eolici e fotovoltaici nel Centro-Sud Italia: un archivio d'opera."
  structuredData={[breadcrumb]}
>
  <PageHero
    eyebrow="Archivio d'opera"
    h1="Quello che abbiamo costruito."
    sub="Sottostazioni elettriche AT/MT per parchi eolici e fotovoltaici, presentate con i dati di ogni realizzazione."
  />

  <GalleryGrid entries={progetti} />

  <section class="wrap pb-20 lg:pb-28 text-center">
    <p class="text-headline" style="max-width: 24ch; margin-inline: auto;">
      Vuoi vedere cosa possiamo costruire per te?
    </p>
  </section>

  <CtaBand />

  <Lightbox />
</Base>
```

- [ ] **Step 2: Eliminare `src/pages/progetti.astro`**

```bash
git rm src/pages/progetti.astro
```

- [ ] **Step 3: Verificare che l'unica route sia `/lavori/`**

Run: `npm run build`
Expected: nell'output compaiono `dist/lavori/index.html` e **non**
`dist/progetti/index.html`.

```bash
npm run build 2>&1 | tail -20
test -f dist/lavori/index.html && echo "OK: /lavori/ esiste"
test ! -f dist/progetti/index.html && echo "OK: /progetti/ non esiste piu"
```

- [ ] **Step 4: Aggiungere il redirect 301 in nginx**

In `docker/nginx.conf`, dentro la mappa `$legacy_redirect` (righe 16-24),
aggiungere una riga. Il blocco attuale è:

```nginx
map $uri $legacy_redirect {
    default                              "";
    ~^/laboratorio-mobile/?$             /servizi/laboratorio-mobile/;
    ~^/centrix/?$                        /servizi/laboratorio-mobile/;
    ~^/verifiche-strumentali/?$          /servizi/verifiche-strumentali/;
    ~^/monitoraggio-controllo/?$         /servizi/monitoraggio-e-controllo/;
    ~^/gestione-e-manutenzione/?$        /servizi/gestione-e-manutenzione/;
    ~^/repowering-e-revamping-eolico/?$  /servizi/costruzioni/;
    ~^/i-nostri-clienti/?$               /azienda/;
    ~^/lavora-con-noi/?$                 /azienda/;
    ~^/consulenza/?$                     /contatti/;
}
```

Diventa (una riga nuova, `/progetti/` → `/lavori/`; le altre righe si
correggono nei Task 2 e 5, non qui):

```nginx
map $uri $legacy_redirect {
    default                              "";
    ~^/progetti/?$                       /lavori/;
    ~^/laboratorio-mobile/?$             /servizi/laboratorio-mobile/;
    ~^/centrix/?$                        /servizi/laboratorio-mobile/;
    ~^/verifiche-strumentali/?$          /servizi/verifiche-strumentali/;
    ~^/monitoraggio-controllo/?$         /servizi/monitoraggio-e-controllo/;
    ~^/gestione-e-manutenzione/?$        /servizi/gestione-e-manutenzione/;
    ~^/repowering-e-revamping-eolico/?$  /servizi/costruzioni/;
    ~^/i-nostri-clienti/?$               /azienda/;
    ~^/lavora-con-noi/?$                 /azienda/;
    ~^/consulenza/?$                     /contatti/;
}
```

- [ ] **Step 5: Verificare il pattern regex del nuovo redirect**

nginx usa PCRE per i pattern `~^...$`; verificarne il comportamento con un
piccolo script Node (stesso motore di matching per queste espressioni
semplici, senza bisogno di avviare nginx):

```bash
node -e "
const re = /^\/progetti\/?$/;
const cases = [['/progetti', true], ['/progetti/', true], ['/progetti/troia', false], ['/lavori/', false]];
let ok = true;
for (const [path, expected] of cases) {
  const got = re.test(path);
  console.log(path, '->', got, got === expected ? 'OK' : 'FAIL');
  if (got !== expected) ok = false;
}
process.exit(ok ? 0 : 1);
"
```

Expected: tutte le righe stampano `OK`, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/lavori.astro docker/nginx.conf
git commit -m "feat: rinomina Progetti in Lavori (/progetti/ -> /lavori/, redirect 301)"
```

---

## Task 2: Rimozione pagina Azienda

**Files:**
- Delete: `src/pages/azienda.astro`
- Delete: `src/content/pagine/azienda.yaml`
- Modify: `src/content.config.ts` (rimuovere `aziendaSchema`)
- Modify: `public/admin/config.yml` (rimuovere la voce "azienda")
- Modify: `docker/nginx.conf` (ripuntare i due redirect legacy che oggi
  vanno su `/azienda/`)

**Interfaces:**
- Consumes: nulla.
- Produces: `/azienda/` non è più una route valida (404 gestito dal sito).
  I task 3 e 9 smettono di linkarci.

- [ ] **Step 1: Eliminare pagina e contenuto**

```bash
git rm src/pages/azienda.astro src/content/pagine/azienda.yaml
```

- [ ] **Step 2: Rimuovere `aziendaSchema` da `src/content.config.ts`**

File attuale (rilevante):

```ts
const aziendaSchema = z.object({
  pagina: z.literal('azienda'),
  eyebrow: z.string(),
  h1: z.string(),
  storia: z.string(),
  missione: z.string(),
  raggioAzione: z.string(),
  strumentazione: z.array(z.string()),
});
```

e più sotto:

```ts
const pagine = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pagine' }),
  schema: z.discriminatedUnion('pagina', [
    homeSchema,
    aziendaSchema,
    contattiSchema,
    serviziHubSchema,
  ]),
});
```

Rimuovere il blocco `aziendaSchema` per intero e togliere `aziendaSchema,`
dall'array dello `z.discriminatedUnion`:

```ts
const pagine = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pagine' }),
  schema: z.discriminatedUnion('pagina', [
    homeSchema,
    contattiSchema,
    serviziHubSchema,
  ]),
});
```

(`serviziHubSchema` verrà rinominato ed esteso nel Task 6 — qui si tocca
solo la riga di `aziendaSchema`.)

- [ ] **Step 3: Rimuovere la voce "azienda" da `public/admin/config.yml`**

Rimuovere per intero questo blocco (dentro `collections → pagine → files`):

```yaml
      - name: "azienda"
        label: "Azienda"
        file: "src/content/pagine/azienda.yaml"
        fields:
          - { label: "Tipo pagina", name: "pagina", widget: "hidden", default: "azienda" }
          - { label: "Eyebrow (etichetta sopra il titolo)", name: "eyebrow", widget: "string" }
          - { label: "Titolo grande (H1)", name: "h1", widget: "text" }
          - { label: "Storia", name: "storia", widget: "text" }
          - { label: "Missione", name: "missione", widget: "text", hint: "Testo redatto dai soli fatti noti — da far validare dal cliente." }
          - { label: "Tempestività d'intervento (testo raggio d'azione)", name: "raggioAzione", widget: "text" }
          - label: "Strumentazione (elenco tag)"
            name: "strumentazione"
            widget: "list"
            field: { label: "Strumento", name: "item", widget: "string" }
```

- [ ] **Step 4: Ripuntare i due redirect legacy che andavano su `/azienda/`**

In `docker/nginx.conf`, dentro `$legacy_redirect` (righe aggiornate dal
Task 1):

```nginx
    ~^/i-nostri-clienti/?$               /azienda/;
    ~^/lavora-con-noi/?$                 /azienda/;
```

diventano:

```nginx
    ~^/i-nostri-clienti/?$               /;
    ~^/lavora-con-noi/?$                 /;
```

- [ ] **Step 5: Verificare che il build passi senza lo schema azienda**

```bash
npm run build 2>&1 | tail -20
test ! -f dist/azienda/index.html && echo "OK: /azienda/ non esiste piu"
```

Expected: build completa senza errori Zod/TypeScript, nessun
`dist/azienda/index.html`.

- [ ] **Step 6: Verificare che non restino riferimenti orfani**

```bash
grep -rn "azienda" src/content.config.ts public/admin/config.yml && echo "FAIL: riferimenti residui" || echo "OK: nessun riferimento residuo"
```

Expected: `OK` (l'unico match legittimo sarebbe stato lo schema appena
rimosso; il grep non deve trovare nulla in questi due file).

- [ ] **Step 7: Commit**

Il working tree ha file non correlati già modificati da lavoro precedente
(non di questo piano): usare `git add` sui soli file di questo task, mai
`git add -A`, per non trascinarli dentro questo commit.

```bash
git add src/pages/azienda.astro src/content/pagine/azienda.yaml src/content.config.ts public/admin/config.yml docker/nginx.conf
git commit -m "feat: rimuovi la pagina Azienda (schema, CMS, redirect legacy)"
```

---

## Task 3: Aggiornare navigazione globale (Header, Footer) e link home orfani

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`
- Modify: `src/pages/index.astro:39-166` (link a `/azienda/` e `/progetti/`
  — gli `href` delle `ServiceCard` verso `/servizi/${id}/` si sistemano nel
  Task 9, dopo che la nuova pagina Servizi esiste con le sue ancore)

**Interfaces:**
- Consumes: `/servizi/` (esiste già, contenuto verrà riscritto nel Task 8),
  `/lavori/` (Task 1).
- Produces: nav coerente con la sitemap finale, consumata visivamente da
  ogni pagina del sito (nessuna interfaccia di codice).

- [ ] **Step 1: Riscrivere `src/components/Header.astro`**

Sostituire il file intero (232 righe) con questa versione — cambia
`serviziLinks` (rimosso, non serve più un elenco), il blocco dropdown
"Servizi" (diventa link semplice), "Azienda" (rimosso), "Progetti" →
"Lavori":

```astro
---
import { Icon } from 'astro-icon/components';
import { contatti } from '../data/contatti.ts';
import Logo from './Logo.astro';

interface Props {
  /** True when this page opens on a dark hero, so the header can start transparent. */
  transparent?: boolean;
}

const { transparent = true } = Astro.props;
---

<header class="ds-header fixed inset-x-0 top-0 z-40" data-transparent={transparent ? 'true' : 'false'}>
  <div class="ds-header-wrap wrap-wide pt-3 md:pt-4">
    <div class="ds-navbar flex items-center justify-between gap-4 rounded-[var(--radius-panel)] py-2.5 pl-5 pr-2.5 md:pl-7 md:pr-3">
      <a href="/" class="flex shrink-0 items-center text-paper" aria-label="Amon Energy, torna alla home">
        <Logo variant="full" size={26} class="max-[420px]:[--logo-h:22px]" />
      </a>

      <nav class="hidden md:flex items-center gap-1" aria-label="Navigazione principale">
        <a href="/servizi/" class="ds-nav-link">Servizi</a>
        <a href="/lavori/" class="ds-nav-link">Lavori</a>
        <a href="/contatti/" class="ds-nav-link">Contatti</a>
      </nav>

      <div class="flex items-center gap-2">
        <a href={contatti.telefonoHref} class="ds-header-cta" aria-label={`Chiama ${contatti.telefono}`}>
          <Icon name="fa6-solid:phone" class="shrink-0 text-[0.85rem]" />
          <span class="hidden sm:inline">{contatti.telefono}</span>
          <span class="hidden xs:inline sm:hidden">Chiama</span>
        </a>

        <button type="button" id="nav-toggle" class="md:hidden grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] text-paper transition-colors hover:bg-white/10" aria-expanded="false" aria-controls="mobile-nav" aria-label="Apri il menu">
          <Icon name="fa6-solid:bars" class="text-lg" />
        </button>
      </div>
    </div>
  </div>
</header>

<div id="mobile-nav" class="mobile-nav fixed inset-0 z-50 flex flex-col justify-between p-6 translate-x-full transition-transform duration-300 md:hidden" style="transition-timing-function: var(--ease-signature);">
  <div>
    <div class="flex items-center justify-between mb-10">
      <span class="text-paper"><Logo size={28} /></span>
      <button type="button" id="nav-close" class="grid h-11 w-11 place-items-center rounded-[var(--radius-sm)] text-paper transition-colors hover:bg-white/10" aria-label="Chiudi il menu">
        <Icon name="fa6-solid:xmark" class="text-xl" />
      </button>
    </div>
    <nav class="flex flex-col gap-1" aria-label="Navigazione mobile">
      <a href="/servizi/" class="text-paper text-2xl py-3 border-b border-white/10">Servizi</a>
      <a href="/lavori/" class="text-paper text-2xl py-3 border-b border-white/10">Lavori</a>
      <a href="/contatti/" class="text-paper text-2xl py-3 border-b border-white/10">Contatti</a>
    </nav>
  </div>

  <div class="flex flex-col gap-3">
    <a href={contatti.telefonoHref} class="ds-btn-on-dark w-full">
      <Icon name="fa6-solid:phone" class="text-[0.85rem]" />
      Chiamaci: {contatti.telefono}
    </a>
    <a href={`mailto:${contatti.email}`} class="text-paper/80 text-center text-sm py-2">{contatti.email}</a>
  </div>
</div>

<script>
  const header = document.querySelector<HTMLElement>('.ds-header');
  const toggle = document.getElementById('nav-toggle');
  const close = document.getElementById('nav-close');
  const panel = document.getElementById('mobile-nav');

  const onScroll = () => {
    if (!header) return;
    const solid = header.dataset.transparent !== 'true' || window.scrollY > 40;
    header.classList.toggle('ds-header--scrolled', solid);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // L'isola è `fixed`: il contenuto sotto non la vede nel flusso e deve sapere
  // quanto spazio occupa per non finirci dietro. Pubblichiamo l'altezza reale
  // invece di ricopiarne il calcolo nei layout, che è come l'occhiello dell'hero
  // era finito sotto il vetro: `pt-16` (64px) contro un'isola da ~78px.
  // ResizeObserver e non `resize`: l'altezza cambia anche a viewport ferma,
  // quando il CTA telefonico passa da numero a "Chiama" o il logo si accorcia.
  const wrap = document.querySelector<HTMLElement>('.ds-header-wrap');
  if (wrap) {
    const publishHeight = () => {
      document.documentElement.style.setProperty('--header-h', `${wrap.getBoundingClientRect().height.toFixed(2)}px`);
    };
    publishHeight();
    if ('ResizeObserver' in window) new ResizeObserver(publishHeight).observe(wrap);
    else window.addEventListener('resize', publishHeight);
  }

  const openNav = () => {
    panel?.classList.remove('translate-x-full');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeNav = () => {
    panel?.classList.add('translate-x-full');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  toggle?.addEventListener('click', openNav);
  close?.addEventListener('click', closeNav);
</script>

<style>
  .ds-header {
    color: var(--color-paper);
  }

  /* La navbar è un oggetto che galleggia, non una colonna di contenuto: sotto
     i 640px stringe il gutter da 20px a 12px, così l'isola guadagna 16px di
     larghezza e legge come un elemento a sé invece che allineata al testo.
     Da `sm` in su torna sul gutter di .wrap-wide, dove l'allineamento con la
     colonna conta più della presenza. */
  @media (max-width: 639px) {
    .ds-header-wrap {
      padding-inline: 0.75rem;
    }
  }

  /* The floating glass island. Starts airy over the hero, frosts up on scroll. */
  .ds-navbar {
    background: var(--glass-sheen), color-mix(in srgb, var(--color-navy-950) 48%, transparent);
    backdrop-filter: blur(22px) saturate(170%);
    -webkit-backdrop-filter: blur(22px) saturate(170%);
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 10px 34px -14px rgba(4, 16, 28, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.14);
    transition:
      background-color 0.3s var(--ease-signature),
      box-shadow 0.3s var(--ease-signature);
  }
  .ds-header[data-transparent='false'] .ds-navbar,
  .ds-header--scrolled .ds-navbar {
    background: var(--glass-sheen), color-mix(in srgb, var(--color-navy-950) 78%, transparent);
    box-shadow: 0 12px 36px -14px rgba(4, 16, 28, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.14);
  }

  .ds-nav-link {
    display: inline-flex;
    align-items: center;
    padding: 8px 14px;
    border-radius: var(--radius-pill);
    font-weight: 500;
    color: var(--color-paper);
    text-decoration: none;
    transition:
      background-color 0.2s var(--ease-signature),
      color 0.2s var(--ease-signature);
  }
  .ds-nav-link:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .ds-header-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--color-navy-950);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.88));
    border-radius: var(--radius-pill);
    padding: 10px 18px;
    text-decoration: none;
    box-shadow: var(--shadow-sm), inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition:
      transform 0.2s var(--ease-signature),
      box-shadow 0.3s var(--ease-signature);
  }
  .ds-header-cta:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md), var(--glow-signal);
  }

  /* Mobile nav — frosted dark sheet. */
  .mobile-nav {
    background: var(--glass-sheen), color-mix(in srgb, var(--color-navy-950) 88%, transparent);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
  }
</style>
```

- [ ] **Step 2: Aggiornare `src/components/Footer.astro`**

Sostituire l'array `serviziLinks` (righe 6-12) e il blocco della colonna
"Servizi" (righe 35-42):

Da:

```astro
const serviziLinks = [
  { href: '/servizi/laboratorio-mobile/', label: 'Laboratorio mobile ricerca guasti' },
  { href: '/servizi/verifiche-strumentali/', label: 'Verifiche strumentali' },
  { href: '/servizi/monitoraggio-e-controllo/', label: 'Monitoraggio e controllo' },
  { href: '/servizi/costruzioni/', label: 'Costruzioni' },
  { href: '/servizi/gestione-e-manutenzione/', label: 'Gestione e manutenzione' },
];
```

```astro
    <div>
      <p class="ds-eyebrow-label" style="color: var(--color-paper); opacity: 0.6;">Servizi</p>
      <ul class="mt-4 flex flex-col gap-3">
        {serviziLinks.map((s) => (
          <li><a href={s.href} class="text-paper/80 hover:text-signal-400 transition-colors">{s.label}</a></li>
        ))}
      </ul>
    </div>
```

A:

```astro
const quickLinks = [
  { href: '/servizi/', label: 'Servizi' },
  { href: '/lavori/', label: 'Lavori' },
  { href: '/contatti/', label: 'Contatti' },
];
```

```astro
    <div>
      <p class="ds-eyebrow-label" style="color: var(--color-paper); opacity: 0.6;">Naviga</p>
      <ul class="mt-4 flex flex-col gap-3">
        {quickLinks.map((s) => (
          <li><a href={s.href} class="text-paper/80 hover:text-signal-400 transition-colors">{s.label}</a></li>
        ))}
      </ul>
    </div>
```

- [ ] **Step 3: Aggiornare i link a `/azienda/` e `/progetti/` in `src/pages/index.astro`**

Nel blocco "Chi siamo" (intorno alla riga 51):

```astro
        <a
          href={chiSiamoBreve.link}
          class="group mt-7 inline-flex items-center gap-2 font-semibold text-navy-900 transition-colors hover:text-navy-700"
        >
          Conosci l'azienda
          <Icon name="fa6-solid:arrow-right" class="text-xs transition-transform duration-300 group-hover:translate-x-1" style="transition-timing-function: var(--ease-signature);" />
        </a>
```

`chiSiamoBreve.link` viene da `home.yaml` (`link: "/azienda/"`): aggiornare
`src/content/pagine/home.yaml` cambiando quel valore in `"/servizi/"` e il
testo del link:

```yaml
chiSiamoBreve:
  testo: "..."
  link: "/servizi/"
```

```astro
        <a
          href={chiSiamoBreve.link}
          class="group mt-7 inline-flex items-center gap-2 font-semibold text-navy-900 transition-colors hover:text-navy-700"
        >
          Scopri i servizi
          <Icon name="fa6-solid:arrow-right" class="text-xs transition-transform duration-300 group-hover:translate-x-1" style="transition-timing-function: var(--ease-signature);" />
        </a>
```

Nella sezione "Realizzazioni" (3 occorrenze di `/progetti/`):

```astro
      <a href="/progetti/" class="hidden shrink-0 font-semibold text-navy-900 hover:text-navy-700 sm:inline-flex">
        Tutti i progetti →
      </a>
```
→ `href="/lavori/"`

```astro
          <a href="/progetti/" class="group block" data-reveal style={`--reveal-delay:${i * 90}ms`}>
```
→ `href="/lavori/"`

```astro
    <a href="/progetti/" class="mt-8 inline-flex font-semibold text-navy-900 sm:hidden">Tutti i progetti →</a>
```
→ `href="/lavori/"`

(Gli `href` delle 5 `ServiceCard` verso `/servizi/${s.id}/`, poco sopra,
**non si toccano in questo task**: diventano ancore nel Task 9, quando la
nuova pagina Servizi con quelle ancore esiste già — ripuntarli ora
produrrebbe link a sezioni che non esistono ancora.)

- [ ] **Step 4: Verificare che non restino riferimenti a `/azienda/` o `/progetti/`**

```bash
grep -rn '"/azienda/"\|href="/azienda/"\|/progetti/' src/components/Header.astro src/components/Footer.astro src/pages/index.astro src/content/pagine/home.yaml
```

Expected: nessun risultato (comando non stampa nulla).

- [ ] **Step 5: Build e controllo visivo rapido**

```bash
npm run build 2>&1 | tail -10
```

Avviare il dev server e controllare a occhio la nav (desktop e mobile) su
`/`:

```bash
astro dev --background
```

Verificare via browser (Chrome DevTools o screenshot) che la nav mostri
"Servizi · Lavori · Contatti" senza "Azienda" e senza dropdown, sia su
desktop che nel pannello mobile.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro src/pages/index.astro src/content/pagine/home.yaml
git commit -m "feat: aggiorna nav globale e link home alla nuova sitemap"
```

---

## Task 4: `ServiceCard` — prop `ctaLabel` opzionale

**Files:**
- Modify: `src/components/ServiceCard.astro`

**Interfaces:**
- Consumes: nessuna dipendenza da altri task.
- Produces: `ServiceCard` accetta ora `ctaLabel?: string` (default
  `'Approfondisci'`). Il Task 8 lo usa con `ctaLabel="Richiedi informazioni"`
  per le 3 card di Ingegneria elettrica.

- [ ] **Step 1: Aggiungere il prop**

File attuale (dopo le modifiche della sessione precedente — prop `elevated`
già presente):

```astro
interface Props {
  titolo: string;
  excerpt: string;
  icona: string;
  href: string;
  /** 1-based position, shown as a quiet index. */
  index?: number;
  /** Accent color role for the icon. */
  accent?: 'leaf' | 'signal';
  /**
   * Stronger card treatment (solid paper background, top accent bar, bigger
   * icon chip) for sections where the default glass-on-white card reads as
   * too faint. Additive-only: the base `.ds-card-service` look is untouched,
   * so pages that don't opt in (`/servizi/`) are unaffected.
   */
  elevated?: boolean;
}

const { titolo, excerpt, icona, href, index, accent = 'leaf', elevated = false } = Astro.props;
```

Diventa:

```astro
interface Props {
  titolo: string;
  excerpt: string;
  icona: string;
  href: string;
  /** 1-based position, shown as a quiet index. */
  index?: number;
  /** Accent color role for the icon. */
  accent?: 'leaf' | 'signal';
  /**
   * Stronger card treatment (solid paper background, top accent bar, bigger
   * icon chip) for sections where the default glass-on-white card reads as
   * too faint. Additive-only: the base `.ds-card-service` look is untouched,
   * so pages that don't opt in (`/servizi/`) are unaffected.
   */
  elevated?: boolean;
  /** Text of the closing link — 'Approfondisci' fits a detail page, but a
   * card with no page to link to (e.g. a call-to-contact) needs its own
   * wording. */
  ctaLabel?: string;
}

const { titolo, excerpt, icona, href, index, accent = 'leaf', elevated = false, ctaLabel = 'Approfondisci' } = Astro.props;
```

E nel markup, la riga:

```astro
  <span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-900">
    Approfondisci
    <Icon
```

diventa:

```astro
  <span class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy-900">
    {ctaLabel}
    <Icon
```

- [ ] **Step 2: Verificare che gli usi esistenti non cambino**

```bash
grep -rn "ServiceCard" src/pages/index.astro src/pages/servizi/index.astro
```

Nessuno dei due passa `ctaLabel`, quindi entrambi devono continuare a
mostrare "Approfondisci". Confermarlo a build fatta:

```bash
npm run build 2>&1 | tail -5
grep -o "Approfondisci" dist/index.html | head -1
```

Expected: il build passa e la stringa "Approfondisci" è ancora presente in
`dist/index.html` (nessuna regressione sulle card esistenti).

- [ ] **Step 3: Commit**

```bash
git add src/components/ServiceCard.astro
git commit -m "feat: ServiceCard supporta un ctaLabel personalizzato"
```

---

## Task 5: Eliminare le pagine di dettaglio servizio e sfoltire lo schema

**Files:**
- Delete: `src/pages/servizi/laboratorio-mobile.astro`
- Delete: `src/pages/servizi/verifiche-strumentali.astro`
- Delete: `src/pages/servizi/monitoraggio-e-controllo.astro`
- Delete: `src/pages/servizi/costruzioni.astro`
- Delete: `src/pages/servizi/gestione-e-manutenzione.astro`
- Delete: `src/components/ServizioBody.astro`
- Modify: `src/content.config.ts` (schema `servizi`: rimuovere `frase`,
  `immagine`, `punti`)
- Modify: `src/content/servizi/*.md` (5 file — rimuovere `frase` e `punti`
  dal frontmatter)
- Modify: `public/admin/config.yml` (collection "servizi": rimuovere i
  widget per `frase`, `immagine`, `punti`; aggiornare la `description`)
- Modify: `docker/nginx.conf` (i 6 redirect legacy che puntavano alle
  pagine di dettaglio — vedi Global Constraints)

**Interfaces:**
- Consumes: nessuna dipendenza da altri task (indipendente da 1-4).
- Produces: la collection `servizi` espone solo `titolo`, `excerpt`,
  `icona`, `ordine` — è l'interfaccia che il Task 8 (card "Costruzione e
  gestione") e la home (invariata) continuano a leggere via `getEntry`.

- [ ] **Step 1: Eliminare le 5 pagine di dettaglio e il componente condiviso**

```bash
git rm src/pages/servizi/laboratorio-mobile.astro \
       src/pages/servizi/verifiche-strumentali.astro \
       src/pages/servizi/monitoraggio-e-controllo.astro \
       src/pages/servizi/costruzioni.astro \
       src/pages/servizi/gestione-e-manutenzione.astro \
       src/components/ServizioBody.astro
```

- [ ] **Step 2: Sfoltire lo schema `servizi` in `src/content.config.ts`**

Da:

```ts
const servizi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servizi' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      frase: z.string(),
      excerpt: z.string(),
      icona: z.string(),
      ordine: z.number(),
      immagine: image().optional(),
      punti: z
        .array(
          z.object({
            titolo: z.string(),
            testo: z.string(),
          }),
        )
        .optional(),
    }),
});
```

A:

```ts
const servizi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servizi' }),
  schema: () =>
    z.object({
      titolo: z.string(),
      excerpt: z.string(),
      icona: z.string(),
      ordine: z.number(),
    }),
});
```

- [ ] **Step 3: Ripulire il frontmatter dei 5 file `.md`**

In ciascuno dei 5 file sotto `src/content/servizi/`, rimuovere le chiavi
`frase:` e il blocco `punti:` dal frontmatter (il corpo markdown sotto i
`---` resta invariato). Esempio per
`src/content/servizi/laboratorio-mobile.md`:

Da:

```yaml
---
titolo: "Laboratorio mobile ricerca guasti"
frase: "Centrix 2.0: individuazione e riparazione guasti su reti MT, 24 ore su 24, 365 giorni l'anno."
excerpt: "Unità Centrix 2.0 attrezzata per localizzare e riparare guasti su cavi MT. Reperibilità 24h, 365 giorni l'anno."
icona: "fa6-solid:truck-fast"
ordine: 1
punti:
  - titolo: "Ricerca guasto rapida"
    testo: "Prove di tensione applicata su cavi MT per localizzare il guasto in tempi rapidi."
  - titolo: "Reperibilità 24/365"
    testo: "Servizio disponibile 24 ore su 24, 365 giorni l'anno, con tecnici specializzati pronti a intervenire."
---
```

A:

```yaml
---
titolo: "Laboratorio mobile ricerca guasti"
excerpt: "Unità Centrix 2.0 attrezzata per localizzare e riparare guasti su cavi MT. Reperibilità 24h, 365 giorni l'anno."
icona: "fa6-solid:truck-fast"
ordine: 1
---
```

Ripetere la stessa operazione (rimuovere solo `frase:` e il blocco
`punti:`, mantenere `titolo`/`excerpt`/`icona`/`ordine` e il corpo
markdown) per:
- `src/content/servizi/verifiche-strumentali.md`
- `src/content/servizi/monitoraggio-e-controllo.md`
- `src/content/servizi/costruzioni.md`
- `src/content/servizi/gestione-e-manutenzione.md`

- [ ] **Step 4: Aggiornare `public/admin/config.yml`**

Da:

```yaml
  - name: "servizi"
    label: "Servizi"
    description: "Le 5 schede servizio — corrispondono 1:1 alle pagine di /servizi/."
    files:
      - name: "laboratorio-mobile"
        label: "Laboratorio mobile ricerca guasti"
        file: "src/content/servizi/laboratorio-mobile.md"
        fields: &servizio_fields
          - { label: "Titolo", name: "titolo", widget: "string" }
          - { label: "Frase (sotto il titolo nella pagina servizio)", name: "frase", widget: "string" }
          - { label: "Testo breve (per le card home/hub)", name: "excerpt", widget: "text" }
          - { label: "Icona (nome Lucide, es. \"lucide:truck\")", name: "icona", widget: "string" }
          - { label: "Ordine", name: "ordine", widget: "number", value_type: "int" }
          - { label: "Immagine (opzionale)", name: "immagine", widget: "image", required: false }
          - label: "Punti elenco (titolo + 2 righe)"
            name: "punti"
            widget: "list"
            required: false
            fields:
              - { label: "Titolo punto", name: "titolo", widget: "string" }
              - { label: "Testo punto", name: "testo", widget: "text" }
          - { label: "Testo introduttivo/di chiusura", name: "body", widget: "markdown" }
      - name: "verifiche-strumentali"
        label: "Verifiche strumentali"
        file: "src/content/servizi/verifiche-strumentali.md"
        fields: *servizio_fields
      - name: "monitoraggio-e-controllo"
        label: "Monitoraggio e controllo"
        file: "src/content/servizi/monitoraggio-e-controllo.md"
        fields: *servizio_fields
      - name: "costruzioni"
        label: "Costruzioni"
        file: "src/content/servizi/costruzioni.md"
        fields: *servizio_fields
      - name: "gestione-e-manutenzione"
        label: "Gestione e manutenzione"
        file: "src/content/servizi/gestione-e-manutenzione.md"
        fields: *servizio_fields
```

A:

```yaml
  - name: "servizi"
    label: "Servizi"
    description: "Le 5 card servizio mostrate in home — non corrispondono più a pagine di dettaglio proprie: l'approfondimento vive tutto su /servizi/."
    files:
      - name: "laboratorio-mobile"
        label: "Laboratorio mobile ricerca guasti"
        file: "src/content/servizi/laboratorio-mobile.md"
        fields: &servizio_fields
          - { label: "Titolo", name: "titolo", widget: "string" }
          - { label: "Testo breve (per la card in home)", name: "excerpt", widget: "text" }
          - { label: "Icona (nome Font Awesome, es. \"fa6-solid:truck-fast\")", name: "icona", widget: "string" }
          - { label: "Ordine", name: "ordine", widget: "number", value_type: "int" }
      - name: "verifiche-strumentali"
        label: "Verifiche strumentali"
        file: "src/content/servizi/verifiche-strumentali.md"
        fields: *servizio_fields
      - name: "monitoraggio-e-controllo"
        label: "Monitoraggio e controllo"
        file: "src/content/servizi/monitoraggio-e-controllo.md"
        fields: *servizio_fields
      - name: "costruzioni"
        label: "Costruzioni"
        file: "src/content/servizi/costruzioni.md"
        fields: *servizio_fields
      - name: "gestione-e-manutenzione"
        label: "Gestione e manutenzione"
        file: "src/content/servizi/gestione-e-manutenzione.md"
        fields: *servizio_fields
```

- [ ] **Step 5: Ripuntare i 6 redirect legacy in `docker/nginx.conf`**

Da (righe già presenti nella mappa):

```nginx
    ~^/laboratorio-mobile/?$             /servizi/laboratorio-mobile/;
    ~^/centrix/?$                        /servizi/laboratorio-mobile/;
    ~^/verifiche-strumentali/?$          /servizi/verifiche-strumentali/;
    ~^/monitoraggio-controllo/?$         /servizi/monitoraggio-e-controllo/;
    ~^/gestione-e-manutenzione/?$        /servizi/gestione-e-manutenzione/;
    ~^/repowering-e-revamping-eolico/?$  /servizi/costruzioni/;
```

A:

```nginx
    ~^/laboratorio-mobile/?$             /servizi/#ingegneria-elettrica;
    ~^/centrix/?$                        /servizi/#ingegneria-elettrica;
    ~^/verifiche-strumentali/?$          /servizi/#ingegneria-elettrica;
    ~^/monitoraggio-controllo/?$         /servizi/#controllo-e-monitoraggio;
    ~^/gestione-e-manutenzione/?$        /servizi/#costruzione-e-gestione;
    ~^/repowering-e-revamping-eolico/?$  /servizi/#costruzione-e-gestione;
```

(Queste ancore devono esistere sulla pagina prima che il redirect sia
utile: le crea il Task 8. Il redirect può comunque essere scritto ora — se
un utente lo raggiunge prima del Task 8 atterra comunque su `/servizi/`,
solo senza scroll automatico alla sezione.)

- [ ] **Step 6: Verificare che il build passi e che le pagine di dettaglio siano sparite**

```bash
npm run build 2>&1 | tail -20
for slug in laboratorio-mobile verifiche-strumentali monitoraggio-e-controllo costruzioni gestione-e-manutenzione; do
  test ! -f "dist/servizi/$slug/index.html" && echo "OK: /servizi/$slug/ non esiste piu" || echo "FAIL: /servizi/$slug/ esiste ancora"
done
```

Expected: build verde, 5 righe `OK`.

- [ ] **Step 7: Verificare che la card grid in home resti intatta**

```bash
grep -o 'Laboratorio mobile ricerca guasti\|Verifiche strumentali\|Monitoraggio e controllo\|Costruzioni\|Gestione e manutenzione' dist/index.html | sort -u
```

Expected: tutti e 5 i titoli compaiono ancora nell'HTML della home (le
card leggono ancora `titolo`/`excerpt`/`icona` dallo schema sfoltito, che
li conserva tutti).

- [ ] **Step 8: Commit**

Come nel Task 2: `git add` sui soli file di questo task, mai `git add -A`
(il working tree ha altro lavoro non correlato in sospeso).

```bash
git add src/pages/servizi/laboratorio-mobile.astro src/pages/servizi/verifiche-strumentali.astro src/pages/servizi/monitoraggio-e-controllo.astro src/pages/servizi/costruzioni.astro src/pages/servizi/gestione-e-manutenzione.astro src/components/ServizioBody.astro src/content.config.ts src/content/servizi/laboratorio-mobile.md src/content/servizi/verifiche-strumentali.md src/content/servizi/monitoraggio-e-controllo.md src/content/servizi/costruzioni.md src/content/servizi/gestione-e-manutenzione.md public/admin/config.yml docker/nginx.conf
git commit -m "feat: rimuovi le pagine di dettaglio servizio, sfoltisci lo schema servizi"
```

---

## Task 6: Estendere il modello di contenuto della pagina Servizi

**Files:**
- Modify: `src/content.config.ts` (`serviziHubSchema` → `serviziSchema`,
  esteso)
- Modify: `src/content/pagine/servizi.yaml` (contenuto nuovo)
- Modify: `public/admin/config.yml` (voce "servizi-hub" → "servizi", campi
  nuovi)

**Interfaces:**
- Consumes: nulla di codice — dipende solo dal fatto che il Task 2 abbia
  già rimosso `aziendaSchema` dallo `z.discriminatedUnion` (altrimenti il
  diff su quell'array è più fragile da descrivere, ma non c'è una vera
  dipendenza di build).
- Produces: `getEntry('pagine', 'servizi')` restituisce l'oggetto tipizzato
  che il Task 8 (`src/pages/servizi/index.astro`) consuma. Forma esatta:

  ```ts
  {
    pagina: 'servizi';
    eyebrow: string;
    h1: string;
    sub: string;
    controllo: {
      eyebrow: string;
      titolo: string;
      testo: string;
      rcs: { titolo: string; testo: string; specs: string[] };
      cci: {
        titolo: string;
        testo: string;
        specs: string[];
        partnerNome: string;
        partnerUrl: string;
      };
    };
    ingegneriaElettrica: {
      eyebrow: string;
      titolo: string;
      sub: string;
      voci: { titolo: string; testo: string; icona: string }[]; // 3 elementi
    };
    costruzioneGestione: { eyebrow: string; titolo: string };
    tecnologie: {
      eyebrow: string;
      titolo: string;
      sub: string;
      voci: { nome: string; logo?: string }[]; // 7 elementi, logo assente = solo testo
    };
  }
  ```

- [ ] **Step 1: Sostituire `serviziHubSchema` in `src/content.config.ts`**

Da:

```ts
const serviziHubSchema = z.object({
  pagina: z.literal('servizi'),
  eyebrow: z.string(),
  h1: z.string(),
  sub: z.string(),
});
```

A:

```ts
const serviziSchema = z.object({
  pagina: z.literal('servizi'),
  eyebrow: z.string(),
  h1: z.string(),
  sub: z.string(),
  controllo: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
    testo: z.string(),
    rcs: z.object({
      titolo: z.string(),
      testo: z.string(),
      specs: z.array(z.string()),
    }),
    cci: z.object({
      titolo: z.string(),
      testo: z.string(),
      specs: z.array(z.string()),
      partnerNome: z.string(),
      partnerUrl: z.string(),
    }),
  }),
  ingegneriaElettrica: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
    sub: z.string(),
    voci: z.array(
      z.object({
        titolo: z.string(),
        testo: z.string(),
        icona: z.string(),
      }),
    ),
  }),
  costruzioneGestione: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
  }),
  tecnologie: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
    sub: z.string(),
    voci: z.array(
      z.object({
        nome: z.string(),
        logo: z.string().optional(),
      }),
    ),
  }),
});
```

E aggiornare il riferimento nello `z.discriminatedUnion`:

```ts
const pagine = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pagine' }),
  schema: z.discriminatedUnion('pagina', [
    homeSchema,
    contattiSchema,
    serviziSchema,
  ]),
});
```

- [ ] **Step 2: Riscrivere `src/content/pagine/servizi.yaml`**

```yaml
pagina: "servizi"

eyebrow: "Portfolio dei servizi"
h1: "Un system integrator per ogni fase dell'impianto."
sub: "Dal controllo remoto alla diagnostica strumentale, fino alla costruzione e alla gestione quotidiana: le competenze che mettiamo al lavoro sui tuoi impianti elettrici."

controllo:
  eyebrow: "Controllo e monitoraggio"
  titolo: "RCS e CCI, in casa e in campo."
  testo: "Due sistemi distinti che lavoriamo entrambi in prima persona: il nostro RCS proprietario per la supervisione da remoto, e il CCI che installiamo, configuriamo e gestiamo per conto dei nostri clienti."
  rcs:
    titolo: "Remote Control System"
    testo: "Il nostro sistema proprietario di supervisione: analisi guasti in tempo reale, richiusura automatica, reset protezioni da remoto e storicizzazione dati, con integrazione SCADA."
    specs: ["Richiusura automatica", "Web App", "Integrazione SCADA"]
  cci:
    titolo: "Controllore Centrale d'Impianto"
    testo: "Installiamo, configuriamo e gestiamo il CCI in partnership con Teamware, abilitando le funzioni PF1 (osservabilità dello stato dell'impianto) e PF2 (limitazione della potenza attiva su comando del distributore), conformi a CEI 0-16 V5 e alla Delibera ARERA 564/2025/R/eel."
    specs: ["CEI 0-16 V5", "PF1 · PF2", "ARERA 564/2025"]
    partnerNome: "Teamware"
    partnerUrl: "https://www.teamware.it/"

ingegneriaElettrica:
  eyebrow: "Ingegneria elettrica"
  titolo: "Diagnostica strumentale su cavi e trasformatori."
  sub: "Tra i servizi più richiesti dai nostri clienti: strumentazione all'avanguardia e tecnici qualificati per ogni prova in campo."
  voci:
    - titolo: "Ricerca guasti su cavi AT e MT"
      testo: "Localizzazione rapida dei guasti su cavi di alta e media tensione con il laboratorio mobile Centrix 2.0, reperibilità 24 ore su 24, 365 giorni l'anno."
      icona: "fa6-solid:truck-fast"
    - titolo: "Tangente delta e scariche parziali"
      testo: "Diagnostica avanzata dello stato di isolamento di cavi e macchine elettriche, con misure di tangente delta e scariche parziali."
      icona: "fa6-solid:bolt-lightning"
    - titolo: "Verifiche e collaudi trasformatori"
      testo: "Prove di iniezione primaria, SFRA e verifiche funzionali su trasformatori AT/MT e MT/BT, di potenza e di misura."
      icona: "fa6-solid:magnifying-glass-chart"

costruzioneGestione:
  eyebrow: "Costruzione e gestione"
  titolo: "Dalla posa in opera alla gestione quotidiana."

tecnologie:
  eyebrow: "Tecnologie"
  titolo: "Il software che parla la lingua dell'impianto."
  sub: "Protocolli e standard industriali che integriamo nei nostri sistemi, oltre a competenze native di sviluppo software e intelligenza artificiale."
  voci:
    - nome: "Modbus TCP/RTU"
      logo: "modbus"
    - nome: "OPC UA"
    - nome: "MQTT"
      logo: "mqtt"
    - nome: "Sparkplug B"
    - nome: "IEC 61850 · 101"
    - nome: "Zigbee"
      logo: "zigbee"
    - nome: "AI & sviluppo software"
```

- [ ] **Step 3: Aggiornare `public/admin/config.yml`**

Da:

```yaml
      - name: "servizi-hub"
        label: "Servizi (pagina hub)"
        file: "src/content/pagine/servizi.yaml"
        fields:
          - { label: "Tipo pagina", name: "pagina", widget: "hidden", default: "servizi" }
          - { label: "Eyebrow (etichetta sopra il titolo)", name: "eyebrow", widget: "string" }
          - { label: "Titolo grande (H1)", name: "h1", widget: "text" }
          - { label: "Sottotitolo", name: "sub", widget: "text" }
```

A:

```yaml
      - name: "servizi-hub"
        label: "Servizi"
        file: "src/content/pagine/servizi.yaml"
        fields:
          - { label: "Tipo pagina", name: "pagina", widget: "hidden", default: "servizi" }
          - { label: "Eyebrow (etichetta sopra il titolo)", name: "eyebrow", widget: "string" }
          - { label: "Titolo grande (H1)", name: "h1", widget: "text" }
          - { label: "Sottotitolo", name: "sub", widget: "text" }
          - label: "Controllo e monitoraggio"
            name: "controllo"
            widget: "object"
            fields:
              - { label: "Eyebrow", name: "eyebrow", widget: "string" }
              - { label: "Titolo", name: "titolo", widget: "text" }
              - { label: "Testo introduttivo", name: "testo", widget: "text" }
              - label: "RCS"
                name: "rcs"
                widget: "object"
                fields:
                  - { label: "Titolo", name: "titolo", widget: "string" }
                  - { label: "Testo", name: "testo", widget: "text" }
                  - { label: "Specifiche (chip)", name: "specs", widget: "list", field: { label: "Voce", name: "item", widget: "string" } }
              - label: "CCI"
                name: "cci"
                widget: "object"
                fields:
                  - { label: "Titolo", name: "titolo", widget: "string" }
                  - { label: "Testo", name: "testo", widget: "text" }
                  - { label: "Specifiche (chip)", name: "specs", widget: "list", field: { label: "Voce", name: "item", widget: "string" } }
                  - { label: "Nome partner", name: "partnerNome", widget: "string" }
                  - { label: "Sito partner", name: "partnerUrl", widget: "string" }
          - label: "Ingegneria elettrica"
            name: "ingegneriaElettrica"
            widget: "object"
            fields:
              - { label: "Eyebrow", name: "eyebrow", widget: "string" }
              - { label: "Titolo", name: "titolo", widget: "text" }
              - { label: "Sottotitolo", name: "sub", widget: "text" }
              - label: "Voci (3 card)"
                name: "voci"
                widget: "list"
                fields:
                  - { label: "Titolo", name: "titolo", widget: "string" }
                  - { label: "Testo", name: "testo", widget: "text" }
                  - { label: "Icona (nome Font Awesome)", name: "icona", widget: "string" }
          - label: "Costruzione e gestione"
            name: "costruzioneGestione"
            widget: "object"
            fields:
              - { label: "Eyebrow", name: "eyebrow", widget: "string" }
              - { label: "Titolo", name: "titolo", widget: "text" }
          - label: "Tecnologie"
            name: "tecnologie"
            widget: "object"
            fields:
              - { label: "Eyebrow", name: "eyebrow", widget: "string" }
              - { label: "Titolo", name: "titolo", widget: "text" }
              - { label: "Sottotitolo", name: "sub", widget: "text" }
              - label: "Voci (chip)"
                name: "voci"
                widget: "list"
                fields:
                  - { label: "Nome", name: "nome", widget: "string" }
                  - { label: "Logo (modbus / mqtt / zigbee — lasciare vuoto per un chip di solo testo)", name: "logo", widget: "string", required: false }
```

- [ ] **Step 4: Verificare che il contenuto validi contro lo schema**

```bash
npm run build 2>&1 | tail -30
```

Expected: nessun errore Zod su `pagine/servizi.yaml` (un campo mancante o
mal tipizzato fa fallire il build con un messaggio che nomina il file e il
campo).

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/content/pagine/servizi.yaml public/admin/config.yml
git commit -m "feat: estendi il modello di contenuto della pagina Servizi (RCS/CCI/ingegneria elettrica/tecnologie)"
```

---

## Task 7: Procurare gli asset dei loghi (Teamware, Modbus, MQTT, Zigbee)

**Files:**
- Create: `src/assets/img/brand/partners/teamware-logo.png`
- Create: `src/assets/img/tech/modbus.svg`
- Create: `src/assets/img/tech/mqtt.svg`
- Create: `src/assets/img/tech/zigbee.svg`

**Interfaces:**
- Consumes: nulla.
- Produces: 4 file statici che il Task 8 importa
  (`import teamwareLogo from '../../assets/img/brand/partners/teamware-logo.png'`
  come `<Image>`; gli SVG con
  `import modbusSvg from '../../assets/img/tech/modbus.svg?raw'` e
  `<Fragment set:html={modbusSvg} />`). Ogni SVG deve avere tutti i `fill`
  fissi rimossi (eredita `currentColor` dal contenitore).

- [ ] **Step 1: Scaricare il logo Teamware**

```bash
mkdir -p src/assets/img/brand/partners
curl -s -L -A "Mozilla/5.0" -o src/assets/img/brand/partners/teamware-logo.png \
  "https://www.teamware.it/wp-content/uploads/2016/06/teamware-logo-2x.png"
file src/assets/img/brand/partners/teamware-logo.png
```

Expected: `PNG image data, 420 x 88` (o dimensioni molto vicine — il file
non cambia da quando è stato verificato in fase di design).

- [ ] **Step 2: Scaricare MQTT e Zigbee da Simple Icons (già monocromi)**

```bash
mkdir -p src/assets/img/tech
curl -s -o src/assets/img/tech/mqtt.svg \
  "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mqtt.svg"
curl -s -o src/assets/img/tech/zigbee.svg \
  "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/zigbee.svg"
head -c 300 src/assets/img/tech/mqtt.svg
head -c 300 src/assets/img/tech/zigbee.svg
```

Expected: entrambi i file iniziano con `<svg ... viewBox="0 0 24 24">` e
contengono un attributo `fill="#..."` sul tag `<svg>` root (Simple Icons
mette il colore lì, non sui singoli `<path>`) — verificarlo:

```bash
grep -o '<svg[^>]*fill="[^"]*"' src/assets/img/tech/mqtt.svg
grep -o '<svg[^>]*fill="[^"]*"' src/assets/img/tech/zigbee.svg
```

- [ ] **Step 3: Rendere MQTT e Zigbee ricolorabili con `currentColor`**

Simple Icons mette `fill="#hex"` sul tag `<svg>`: sostituirlo con
`fill="currentColor"` in entrambi i file.

```bash
sed -i 's/<svg\( [^>]*\)fill="#[0-9a-fA-F]\{3,6\}"/<svg\1fill="currentColor"/' src/assets/img/tech/mqtt.svg
sed -i 's/<svg\( [^>]*\)fill="#[0-9a-fA-F]\{3,6\}"/<svg\1fill="currentColor"/' src/assets/img/tech/zigbee.svg
grep -o 'fill="[^"]*"' src/assets/img/tech/mqtt.svg
grep -o 'fill="[^"]*"' src/assets/img/tech/zigbee.svg
```

Expected: in entrambi i file l'unico `fill` presente è ora
`fill="currentColor"`.

- [ ] **Step 4: Scaricare e ripulire il logo Modbus**

```bash
curl -s -L -A "Mozilla/5.0" -o /tmp/modbus-raw.svg \
  "https://upload.wikimedia.org/wikipedia/commons/d/da/Logo_of_Modbus.svg"
grep -c 'fill:#' /tmp/modbus-raw.svg
```

Questo SVG (esportato da Inkscape) ha ogni `<path>` con uno `style="fill:#RRGGBB;..."`
diverso, non un singolo `fill` sul root: serve sostituire ogni occorrenza di
`fill:#XXXXXX` dentro gli attributi `style` con `fill:currentColor`.

```bash
sed -E 's/fill:#[0-9a-fA-F]{3,6}/fill:currentColor/g' /tmp/modbus-raw.svg > src/assets/img/tech/modbus.svg
grep -c 'fill:#' src/assets/img/tech/modbus.svg
```

Expected: `0` (nessuna occorrenza di colore fisso rimasta).

- [ ] **Step 5: Verifica visiva dei tre marchi monocromi**

Creare una pagina HTML temporanea per controllare a occhio che i tre SVG,
ricolorati, restino leggibili come i rispettivi marchi (rischio concreto
solo per Modbus, che ha più forme sovrapposte):

```bash
cat > /tmp/logo-check.html <<'EOF'
<!doctype html><html><body style="background:#0a2a44;display:flex;gap:40px;padding:40px;">
<div style="color:#e8eff5;width:160px;" id="modbus"></div>
<div style="color:#e8eff5;width:80px;" id="mqtt"></div>
<div style="color:#e8eff5;width:80px;" id="zigbee"></div>
<script>
fetch('file:///REPLACE/src/assets/img/tech/modbus.svg').then(r=>r.text()).then(t=>document.getElementById('modbus').innerHTML=t);
</script>
</body></html>
EOF
```

In pratica: aprire ciascuno dei 3 file `.svg` direttamente in un tab
Chrome (`file://.../src/assets/img/tech/modbus.svg`, ecc.) — un browser
mostra un SVG senza `fill` esplicito (solo `currentColor`) in nero di
default, il che è sufficiente per giudicare se la forma resta
riconoscibile. Confermare a occhio (screenshot) che:
- Modbus si legge ancora come il proprio logo (icona + wordmark), non come
  una macchia indistinta.
- MQTT e Zigbee, essendo mark a path singolo, non hanno questo rischio.

Se Modbus risultasse illeggibile in monocromo, fermarsi e riportare il
problema invece di procedere: l'alternativa è trattarlo come gli standard
senza logo (§5 dello spec, solo testo) invece di forzarlo.

- [ ] **Step 6: Commit**

```bash
git add src/assets/img/brand/partners/teamware-logo.png src/assets/img/tech/
git commit -m "feat: aggiungi loghi Teamware, Modbus, MQTT, Zigbee per la pagina Servizi"
```

---

## Task 8: Costruire la nuova pagina `/servizi/`

**Files:**
- Modify: `src/pages/servizi/index.astro` (riscrittura completa)

**Interfaces:**
- Consumes: `getEntry('pagine', 'servizi')` (Task 6, forma vista sopra),
  `getEntry('servizi', 'costruzioni')` e `getEntry('servizi',
  'gestione-e-manutenzione')` (Task 5, forma `{titolo, excerpt, icona,
  ordine}`), `ServiceCard` con `ctaLabel` (Task 4), asset di Task 7.
- Produces: sezioni con `id="controllo-e-monitoraggio"`,
  `id="ingegneria-elettrica"`, `id="costruzione-e-gestione"`,
  `id="tecnologie"` — il Task 9 vi punta da home, e i redirect legacy del
  Task 5 vi puntano da nginx.

- [ ] **Step 1: Scrivere il nuovo `src/pages/servizi/index.astro`**

```astro
---
import { getCollection, getEntry } from 'astro:content';
import { Image } from 'astro:assets';
import { Icon } from 'astro-icon/components';
import Base from '../../layouts/Base.astro';
import PageHero from '../../components/PageHero.astro';
import ServiceCard from '../../components/ServiceCard.astro';
import CtaBand from '../../components/CtaBand.astro';
import teamwareLogo from '../../assets/img/brand/partners/teamware-logo.png';
import modbusSvg from '../../assets/img/tech/modbus.svg?raw';
import mqttSvg from '../../assets/img/tech/mqtt.svg?raw';
import zigbeeSvg from '../../assets/img/tech/zigbee.svg?raw';

const hub = await getEntry('pagine', 'servizi');
if (!hub || hub.data.pagina !== 'servizi') throw new Error('pagine/servizi.yaml missing or malformed');
const { eyebrow, h1, sub, controllo, ingegneriaElettrica, costruzioneGestione, tecnologie } = hub.data;

const costruzioni = await getEntry('servizi', 'costruzioni');
const gestione = await getEntry('servizi', 'gestione-e-manutenzione');
if (!costruzioni || !gestione) throw new Error('content/servizi: costruzioni o gestione-e-manutenzione mancante');

// I tre marchi monocromi disponibili (vedi Task 7). Le altre voci di
// `tecnologie.voci` non hanno `logo` e restano chip di solo testo.
const techLogos: Record<string, string> = {
  modbus: modbusSvg,
  mqtt: mqttSvg,
  zigbee: zigbeeSvg,
};

const breadcrumb = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://amonenergy.it/' },
    { '@type': 'ListItem', position: 2, name: 'Servizi', item: 'https://amonenergy.it/servizi/' },
  ],
};
---

<Base
  title="Servizi"
  description="RCS, CCI, ricerca guasti AT/MT, diagnostica su cavi e trasformatori, costruzione e gestione di impianti elettrici AT/MT."
  structuredData={[breadcrumb]}
>
  <PageHero eyebrow={eyebrow} h1={h1} sub={sub} />

  <!-- Controllo e monitoraggio: RCS + CCI -->
  <section id="controllo-e-monitoraggio" class="relative isolate overflow-hidden bg-navy-950 text-paper">
    <div class="control-glow" aria-hidden="true"></div>
    <div class="wrap-wide relative z-10 py-20 lg:py-28">
      <div class="ds-eyebrow" data-reveal>
        <span class="ds-live-dot" aria-hidden="true"></span>
        <span class="ds-eyebrow-label ds-eyebrow-label--signal">{controllo.eyebrow}</span>
      </div>
      <h2 class="text-control max-w-[20ch]" data-reveal style="--reveal-delay:80ms">{controllo.titolo}</h2>
      <p class="measure mt-6 text-lg text-navy-100" data-reveal style="--reveal-delay:160ms">{controllo.testo}</p>

      <div class="mt-14 grid gap-5 md:grid-cols-2 lg:gap-6">
        <article class="ds-panel flex flex-col p-7 lg:p-8" data-reveal>
          <span class="ds-pill self-start">RCS</span>
          <h3 class="mt-5 font-display text-xl font-bold tracking-tight">{controllo.rcs.titolo}</h3>
          <p class="mt-3 text-sm leading-relaxed text-navy-100/85">{controllo.rcs.testo}</p>
          <ul class="mt-6 flex flex-wrap gap-2 border-t border-white/12 pt-5">
            {controllo.rcs.specs.map((spec) => (
              <li class="rounded-full border border-white/18 bg-white/8 px-3 py-1 font-display text-[0.72rem] font-medium tracking-wide text-navy-100">
                {spec}
              </li>
            ))}
          </ul>
        </article>

        <article class="ds-panel flex flex-col p-7 lg:p-8" data-reveal style="--reveal-delay:100ms">
          <span class="ds-pill self-start">CCI</span>
          <h3 class="mt-5 font-display text-xl font-bold tracking-tight">{controllo.cci.titolo}</h3>
          <p class="mt-3 text-sm leading-relaxed text-navy-100/85">{controllo.cci.testo}</p>
          <ul class="mt-6 flex flex-wrap gap-2 border-t border-white/12 pt-5">
            {controllo.cci.specs.map((spec) => (
              <li class="rounded-full border border-white/18 bg-white/8 px-3 py-1 font-display text-[0.72rem] font-medium tracking-wide text-navy-100">
                {spec}
              </li>
            ))}
          </ul>
          <div class="mt-6 flex items-center gap-3 border-t border-white/12 pt-5">
            <span class="text-xs font-medium uppercase tracking-wide text-navy-100/60">In partnership con</span>
            <a href={controllo.cci.partnerUrl} target="_blank" rel="noopener noreferrer" aria-label={controllo.cci.partnerNome}>
              <Image src={teamwareLogo} alt={controllo.cci.partnerNome} width={90} style="height: auto; width: 90px;" />
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>

  <!-- Ingegneria elettrica -->
  <section id="ingegneria-elettrica" class="wrap-wide py-20 lg:py-28">
    <div class="ds-eyebrow" data-reveal>
      <span class="ds-eyebrow-dash ds-eyebrow-dash--leaf"></span>
      <span class="ds-eyebrow-label ds-eyebrow-label--leaf">{ingegneriaElettrica.eyebrow}</span>
    </div>
    <h2 class="text-headline max-w-[22ch]" data-reveal style="--reveal-delay:80ms">{ingegneriaElettrica.titolo}</h2>
    <p class="measure mt-3 text-ink/70" data-reveal style="--reveal-delay:120ms">{ingegneriaElettrica.sub}</p>

    <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {
        ingegneriaElettrica.voci.map((v, i) => (
          <div data-reveal style={`--reveal-delay:${i * 90}ms`}>
            <ServiceCard
              titolo={v.titolo}
              excerpt={v.testo}
              icona={v.icona}
              href="/contatti/"
              index={i + 1}
              accent="signal"
              elevated
              ctaLabel="Richiedi informazioni"
            />
          </div>
        ))
      }
    </div>
  </section>

  <!-- Costruzione e gestione impianti -->
  <section id="costruzione-e-gestione" class="bg-navy-100">
    <div class="wrap-wide py-20 lg:py-28">
      <div class="ds-eyebrow" data-reveal>
        <span class="ds-eyebrow-dash"></span>
        <span class="ds-eyebrow-label">{costruzioneGestione.eyebrow}</span>
      </div>
      <h2 class="text-headline max-w-[22ch]" data-reveal style="--reveal-delay:80ms">{costruzioneGestione.titolo}</h2>

      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:gap-6">
        <div data-reveal style="--reveal-delay:90ms">
          <ServiceCard
            titolo={costruzioni.data.titolo}
            excerpt={costruzioni.data.excerpt}
            icona={costruzioni.data.icona}
            href="/lavori/"
            index={1}
            accent="signal"
            elevated
            ctaLabel="Guarda le opere realizzate"
          />
        </div>
        <div data-reveal style="--reveal-delay:180ms">
          <ServiceCard
            titolo={gestione.data.titolo}
            excerpt={gestione.data.excerpt}
            icona={gestione.data.icona}
            href="/lavori/"
            index={2}
            accent="signal"
            elevated
            ctaLabel="Guarda le opere realizzate"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Tecnologie -->
  <section id="tecnologie" class="wrap-wide py-20 lg:py-28">
    <div class="ds-eyebrow" data-reveal>
      <span class="ds-eyebrow-dash"></span>
      <span class="ds-eyebrow-label">{tecnologie.eyebrow}</span>
    </div>
    <h2 class="text-headline max-w-[24ch]" data-reveal style="--reveal-delay:80ms">{tecnologie.titolo}</h2>
    <p class="measure mt-3 text-ink/70" data-reveal style="--reveal-delay:120ms">{tecnologie.sub}</p>

    <ul class="mt-10 flex flex-wrap gap-3">
      {
        tecnologie.voci.map((v, i) => (
          <li
            class="tech-chip flex items-center gap-2.5 rounded-full border border-navy-100 bg-navy-100/40 px-4 py-2.5 font-display text-sm font-medium text-navy-900"
            data-reveal
            style={`--reveal-delay:${i * 60}ms`}
          >
            {v.logo && techLogos[v.logo] && <Fragment set:html={techLogos[v.logo]} />}
            {v.nome}
          </li>
        ))
      }
    </ul>
  </section>

  <CtaBand />
</Base>

<style>
  .control-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(60% 55% at 78% 8%, color-mix(in srgb, var(--color-navy-700) 55%, transparent), transparent 70%),
      radial-gradient(50% 60% at 0% 100%, color-mix(in srgb, var(--color-navy-800) 60%, transparent), transparent 70%);
    z-index: 0;
  }

  /* I tre chip con un marchio (Modbus/MQTT/Zigbee, vedi Task 7) portano
     l'SVG inline: eredita colore dal chip invece di un fill fisso. */
  .tech-chip :global(svg) {
    width: 18px;
    height: 18px;
    color: var(--color-navy-700);
    flex-shrink: 0;
  }
</style>
```

- [ ] **Step 2: Build**

```bash
npm run build 2>&1 | tail -30
```

Expected: build verde. Se fallisce su `Fragment`/`set:html`, verificare che
`Fragment` sia disponibile globalmente in Astro (lo è, non richiede
import) — un errore più probabile è un percorso di import sbagliato per i
tre `?raw`.

- [ ] **Step 3: Verificare le 4 ancore nell'HTML generato**

```bash
grep -o 'id="controllo-e-monitoraggio"\|id="ingegneria-elettrica"\|id="costruzione-e-gestione"\|id="tecnologie"' dist/servizi/index.html
```

Expected: tutte e 4 le righe presenti.

- [ ] **Step 4: Verificare che i tre loghi monocromi e il logo Teamware siano nell'output**

```bash
grep -c "TeamWare\|teamware" dist/servizi/index.html
grep -o '<svg[^>]*>' dist/servizi/index.html | grep -c "currentColor" 
```

Expected: almeno 1 occorrenza per Teamware (alt text dell'immagine); almeno
3 occorrenze di `currentColor` (i tre marchi inline).

- [ ] **Step 5: Verifica visiva in browser**

```bash
astro dev --background
```

Aprire `http://localhost:4321/servizi/` e controllare:
- Le 4 sezioni si susseguono nell'ordine giusto (Controllo e monitoraggio
  navy → Ingegneria elettrica chiaro → Costruzione e gestione chiaro
  (leggermente diverso, `bg-navy-100`) → Tecnologie chiaro).
- Le card RCS/CCI hanno gli specs chip e il logo Teamware è leggibile,
  colore originale.
- Le 3 card di Ingegneria elettrica hanno icone blu (coerenti con la home)
  e il CTA dice "Richiedi informazioni →".
- Le 2 card di Costruzione/Gestione hanno CTA "Guarda le opere realizzate
  →" e portano a `/lavori/`.
- I 7 chip Tecnologie sono leggibili; i 3 con logo (Modbus, MQTT, Zigbee)
  mostrano il marchio prima del testo, gli altri 4 sono solo testo, nessuno
  sembra "rotto" (icona mancante, quadrato vuoto).
- Su mobile (resize a ~390px), tutte le sezioni restano leggibili, i chip
  vanno a capo senza tagliare testo.

Su qualunque discrepanza visiva, correggere prima di procedere (non è un
task a parte: fa parte del "fine" di questo task).

- [ ] **Step 6: Commit**

```bash
git add src/pages/servizi/index.astro
git commit -m "feat: nuova pagina Servizi (RCS/CCI, ingegneria elettrica, costruzione e gestione, tecnologie)"
```

---

## Task 9: Ripuntare le card "Cosa facciamo" della home alle ancore di Servizi

**Files:**
- Modify: `src/pages/index.astro` (solo gli `href` delle `ServiceCard`)

**Interfaces:**
- Consumes: le 4 ancore prodotte dal Task 8.
- Produces: nessuna nuova interfaccia — è l'ultimo consumatore delle
  ancore.

- [ ] **Step 1: Aggiungere la mappa id → ancora e usarla**

Nel frontmatter di `src/pages/index.astro`, vicino a dove vengono lette le
collection:

```astro
const servizi = (await getCollection('servizi')).sort((a, b) => a.data.ordine - b.data.ordine);
```

aggiungere subito sotto:

```astro
const serviziAnchor: Record<string, string> = {
  'laboratorio-mobile': '/servizi/#ingegneria-elettrica',
  'verifiche-strumentali': '/servizi/#ingegneria-elettrica',
  'monitoraggio-e-controllo': '/servizi/#controllo-e-monitoraggio',
  costruzioni: '/servizi/#costruzione-e-gestione',
  'gestione-e-manutenzione': '/servizi/#costruzione-e-gestione',
};
```

E nel markup, la card grid:

```astro
            <ServiceCard
              titolo={s.data.titolo}
              excerpt={s.data.excerpt}
              icona={s.data.icona}
              href={`/servizi/${s.id}/`}
              index={i + 1}
              accent="signal"
              elevated
            />
```

diventa:

```astro
            <ServiceCard
              titolo={s.data.titolo}
              excerpt={s.data.excerpt}
              icona={s.data.icona}
              href={serviziAnchor[s.id] ?? '/servizi/'}
              index={i + 1}
              accent="signal"
              elevated
            />
```

- [ ] **Step 2: Verificare che non resti alcun `href` verso una sotto-pagina eliminata**

```bash
grep -n '/servizi/\${' src/pages/index.astro
```

Expected: nessun risultato (la riga col template-literal è stata
sostituita).

- [ ] **Step 3: Build e verifica dei link nell'HTML**

```bash
npm run build 2>&1 | tail -10
grep -o 'href="/servizi/#[a-z-]*"' dist/index.html | sort -u
```

Expected: esattamente due valori distinti,
`href="/servizi/#controllo-e-monitoraggio"` e
`href="/servizi/#ingegneria-elettrica"`, più `href="/servizi/#costruzione-e-gestione"`
— tre in totale (i 5 id si riducono a 3 ancore).

- [ ] **Step 4: Verifica manuale di uno scroll-to-anchor**

```bash
astro dev --background
```

Su `http://localhost:4321/`, scrollare a "Cosa facciamo" e cliccare la
card "Monitoraggio e controllo": deve aprire `/servizi/` con lo scroll già
posizionato sulla sezione "Controllo e monitoraggio".

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: le card Servizi della home puntano alle ancore della nuova pagina"
```

---

## Task 10: Verifica finale end-to-end

**Files:** nessuno (solo verifica).

**Interfaces:** nessuna — task di chiusura.

- [ ] **Step 1: Build pulita**

```bash
rm -rf dist
npm run build 2>&1 | tail -30
```

Expected: build verde, 4 pagine totali attese in più/meno rispetto a
prima (`+1 /lavori/`, `-1 /progetti/`, `-1 /azienda/`, `-5` sotto-pagine
servizi) — contare le route:

```bash
find dist -name "index.html" | sed 's#dist##;s#/index.html##;s#^$#/#' | sort
```

Verificare a occhio che compaiano `/`, `/servizi/`, `/lavori/`,
`/contatti/`, `/privacy-policy/`, `/404/` (se emesso come file), e le
pagine progetti singole se presenti, e **non** compaiano `/azienda/`,
`/progetti/`, `/servizi/laboratorio-mobile/`,
`/servizi/verifiche-strumentali/`, `/servizi/monitoraggio-e-controllo/`,
`/servizi/costruzioni/`, `/servizi/gestione-e-manutenzione/`.

- [ ] **Step 2: `astro check`**

```bash
npx astro check 2>&1 | tail -30
```

Expected: stesso, unico errore pre-esistente e non correlato in
`src/components/Header.astro:137` (`window.addEventListener` su tipo
`never`) — nessun nuovo errore introdotto da questo lavoro.

- [ ] **Step 3: Test suite esistente**

```bash
npm test 2>&1 | tail -20
```

Expected: `11 pass, 0 fail` (la suite Playwright dell'hero non è toccata
da questo lavoro; deve restare verde).

- [ ] **Step 4: Verifica dei redirect nginx via regex (nessun container necessario)**

```bash
node -e "
const map = [
  [/^\/progetti\/?$/, '/lavori/'],
  [/^\/i-nostri-clienti\/?$/, '/'],
  [/^\/lavora-con-noi\/?$/, '/'],
  [/^\/laboratorio-mobile\/?$/, '/servizi/#ingegneria-elettrica'],
  [/^\/centrix\/?$/, '/servizi/#ingegneria-elettrica'],
  [/^\/verifiche-strumentali\/?$/, '/servizi/#ingegneria-elettrica'],
  [/^\/monitoraggio-controllo\/?$/, '/servizi/#controllo-e-monitoraggio'],
  [/^\/gestione-e-manutenzione\/?$/, '/servizi/#costruzione-e-gestione'],
  [/^\/repowering-e-revamping-eolico\/?$/, '/servizi/#costruzione-e-gestione'],
];
const cases = ['/progetti', '/progetti/', '/azienda', '/azienda/', '/i-nostri-clienti/', '/lavora-con-noi', '/laboratorio-mobile/', '/centrix', '/verifiche-strumentali/', '/monitoraggio-controllo', '/gestione-e-manutenzione/', '/repowering-e-revamping-eolico'];
for (const c of cases) {
  const hit = map.find(([re]) => re.test(c));
  console.log(c.padEnd(32), '->', hit ? hit[1] : '(nessun redirect — 404 atteso solo per /azienda)');
}
"
```

Confrontare l'output a mano con `docker/nginx.conf`: ogni riga della mappa
deve comparire nel file con la stessa destinazione, e `/azienda` /
`/azienda/` devono restare senza redirect (404 atteso, per decisione del
cliente).

```bash
grep -n "legacy_redirect\|~^/" docker/nginx.conf
```

- [ ] **Step 5: Cammino manuale in browser**

Con `astro dev --background` attivo, percorrere a mano:
1. Home → click "Servizi" in nav → atterra su `/servizi/`, non c'è più
   dropdown.
2. `/servizi/` → click "Guarda le opere realizzate" su una card
   Costruzione/Gestione → atterra su `/lavori/`.
3. Nav → click "Lavori" → stessa pagina di prima (`/progetti/` rinominata),
   galleria intatta.
4. Digitare manualmente `/azienda/` nella barra indirizzi → 404 del sito
   (pagina esistente, non un errore del browser).
5. Home → scroll a "Chi siamo" → click "Scopri i servizi" → atterra su
   `/servizi/`.
6. Home → scroll a "Cosa facciamo" → click su ciascuna delle 5 card →
   ognuna atterra su `/servizi/` con lo scroll sulla sezione giusta.

- [ ] **Step 6: Nessun commit in questo task**

Questo task è verifica pura; se emergono difetti, si torna al task
pertinente, si corregge lì, e si ripete la Step 1-5 di qui.
