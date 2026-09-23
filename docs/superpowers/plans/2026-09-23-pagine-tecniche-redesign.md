# Redesign delle pagine tecniche — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portare le 18 pagine tecniche (`/servizi/<slug>/`, `/en/services/<slug>/`) allo stile delle pagine classiche: cover fotografica, fasce alternate, FAQ a due colonne, box uniformi, pre-footer classico, e grafici calcolati da modelli fisici veri.

**Architecture:** Un solo template (`src/components/tech/TechDetailPage.astro`) serve tutte e 18 le pagine. I grafici a dati nascono da modelli TypeScript puri (`src/components/tech/charts/models/*.ts`, testati con `node --test`) e sono disegnati da un telaio SVG comune (`ChartFrame.astro`) a build, senza JavaScript nel browser. Gli schemi a blocchi usano primitive comuni (`SchemaFrame.astro`, `BlockChain.astro`).

**Tech Stack:** Astro 7, Tailwind 4, TypeScript (type stripping nativo di Node 24 per i test dei modelli), Playwright per i test di layout, Decap/Sveltia CMS (`public/admin/config.yml`), API Pexels (chiave in `PEXELS_API_KEY`, mai stampata né scritta nei file).

**Spec:** `docs/superpowers/specs/2026-09-23-pagine-tecniche-redesign-design.md`

## Global Constraints

- Branch `feat/migrazione-seo`. Commit per task, messaggi in italiano stile Conventional Commits, chiusi da `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Commenti nel codice in italiano, densità e tono come nei file esistenti.
- Copy nuovo in IT e EN, **mai lineette usate come pausa** («—», «–», « - »). I trattini dentro le parole restano (Centro-Sud).
- Occhielli sempre `ds-eyebrow-dash` + `ds-eyebrow-label` nel colore standard; il verde (`--signal`) solo sulla fascia navy «Come si svolge», come oggi.
- Nessuna certificazione aziendale citata; sede unica Castelluccio dei Sauri (vincoli già testati in `test/seo-head.test.mjs`).
- Foto: Pexels, toni freddi, niente volti riconoscibili, niente marchi di terzi, niente foto già usate nel sito. Commento con autore e URL accanto all'uso.
- I grafici non contraddicono il testo della pagina accanto (tensione di prova fino a 80 kV, soglie I> e I>>, intervallo SFRA 20 Hz – 2 MHz, IEC 60076-18, IEC 60270).
- Didascalia di ogni grafico a dati: «Curva calcolata da modello» (EN «Computed from a model») nel sottotitolo.
- Etichette dei grafici mai sotto 11px effettivi a 390px di larghezza.
- Dopo una modifica a `src/content.config.ts`, il dev server va riavviato cancellando `.astro/data-store.json` (`npx astro dev stop; rm -f .astro/data-store.json; npx astro dev --background`), altrimenti serve i dati vecchi.
- Verifica finale di ogni task: `npm run build && npm test` verde (oggi: 75 pass, 1 skip GA4).

## File Structure

| File | Responsabilità |
|---|---|
| `src/content.config.ts` | campi `copertina`, `copertinaAlt` su `serviziDettaglio` |
| `src/content/servizi-dettaglio/{it,en}/*.md` | valori dei due campi, commento credito foto |
| `src/assets/img/tech/cover/*.jpg` | 9 cover 2400×1600 |
| `public/admin/config.yml` | widget per i due campi |
| `src/components/tech/TechDetailPage.astro` | struttura a 9 fasce, alternanza dei fondi |
| `src/components/tech/ParamGrid.astro` | box alti uguali |
| `src/components/tech/TechFaq.astro` | invariato nel markup, larghezza piena di colonna |
| `src/components/tech/TechCtaBand.astro` | **eliminato** |
| `src/components/tech/charts/models/complex.ts` | aritmetica complessa minima |
| `src/components/tech/charts/models/random.ts` | mulberry32 e normale di Box-Muller |
| `src/components/tech/charts/models/scale.ts` | scale lineari e logaritmiche |
| `src/components/tech/charts/models/sfra.ts` | rete a scala RLC, risposta in frequenza |
| `src/components/tech/charts/models/iec60255.ts` | caratteristica tempo–corrente |
| `src/components/tech/charts/models/prpd.ts` | nuvola di impulsi PRPD |
| `src/components/tech/charts/models/isolamento.ts` | rampa e corrente di fuga |
| `src/components/tech/charts/ChartFrame.astro` | telaio SVG di tutti i grafici a dati |
| `src/components/tech/diagrams/{RispostaFrequenza,CurvaTempoCorrente,ScaricheParziali,RampaIsolamento}.astro` | riscritti sopra modelli + ChartFrame |
| `src/components/tech/diagrams/SchemaFrame.astro` | telaio degli schemi (fondo, cornice, didascalia) |
| `src/components/tech/diagrams/BlockChain.astro` | catena orizzontale di box con corsie |
| `src/components/tech/diagrams/{CatenaRcs,CatenaA72,CatenaContatori,OsservabilitaControllabilita,PuntiMisuraTrasformatore}.astro` | riscritti sopra le primitive |
| `test/chart-models.test.mjs` | test unitari dei modelli |
| `test/tech-pages.test.mjs` | divieto di foto → cover presente |
| `test/tech-layout.test.mjs` | layout Playwright delle 18 pagine |
| `test/tech-diagrams.test.mjs` | testo dei box dentro i box |

---

### Task 1: Cover fotografiche nello schema, nei contenuti e nel CMS

**Files:**
- Modify: `src/content.config.ts` (collection `serviziDettaglio`)
- Modify: tutti i 18 file `src/content/servizi-dettaglio/{it,en}/*.md`
- Create: `src/assets/img/tech/cover/<slug-it>.jpg` × 9
- Modify: `public/admin/config.yml` (ancora `&servizio_dettaglio_fields`)
- Modify: `src/components/tech/TechDetailPage.astro` (solo la chiamata a `PageHero`)
- Test: `test/tech-pages.test.mjs`

**Interfaces:**
- Produces: `voce.data.copertina: ImageMetadata`, `voce.data.copertinaAlt: string`.

- [ ] **Step 1: Riscrivi i test del divieto di foto nel test esistente**

In `test/tech-pages.test.mjs`, nei due test che oggi contengono `!/<img[^>]+\.(jpe?g|png|webp|avif)/.test(contenuto(html))` (righe ~67 e ~125), sostituisci l'asserzione con la funzione qui sotto, definita subito dopo `function contenuto(html)`:

```js
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
```

e usa `assert.ok(haCover(html), \`${lato}/${slug}: manca la foto di cover\`)` (nel test SFRA con `${lato}` soltanto). Aggiorna anche il titolo del test a riga ~114: «… con Service, FAQPage, foto di cover e nessuna certificazione».

- [ ] **Step 2: Verifica che fallisca**

Run: `npm run build >/dev/null && node --test test/tech-pages.test.mjs`
Expected: FAIL con «manca la foto di cover» su tutte le pagine.

- [ ] **Step 3: Schema**

In `src/content.config.ts`, la collection `serviziDettaglio` passa da `schema: () =>` a `schema: ({ image }) =>` e guadagna, subito dopo `lead`:

```ts
      // Foto di cover della PageHero. Stessa foto per la pagina e la sua
      // gemella inglese; cambia solo l'alt.
      copertina: image(),
      copertinaAlt: z.string(),
```

- [ ] **Step 4: Scegli e scarica le 9 foto da Pexels**

Soggetti (uno per pagina, nessuno già nel sito: escludi gli id 18468536, 36358684, 15207534, 36137497, 13820151):

| slug IT | query di partenza |
|---|---|
| sfra | `power transformer substation` |
| misure-scariche-parziali | `high voltage cable termination` |
| verifica-protezioni-at-mt | `electrical switchgear panel relay` |
| verifiche-trasformatori-di-potenza | `power transformer bushings` |
| prove-isolamento | `high voltage insulators close up` |
| rcs-monitoraggio-cabina-mt | `control room monitors dark` |
| cci-controllore-centrale-impianto | `solar farm inverter station` |
| teledistacco-a72 | `wind farm substation` |
| lettura-contatori | `electricity meter industrial` |

Ricerca (PowerShell, la chiave non va mai stampata):

```powershell
$headers = @{ Authorization = $env:PEXELS_API_KEY }
$q = [Uri]::EscapeDataString("power transformer substation")
$r = Invoke-RestMethod -Uri "https://api.pexels.com/v1/search?query=$q&orientation=landscape&per_page=15&locale=en-US" -Headers $headers
$r.photos | ForEach-Object { "{0} {1}x{2} {3} | {4}" -f $_.id,$_.width,$_.height,$_.photographer,$_.alt }
```

Scarica le anteprime `src.medium` nella scratchpad, componi un foglio di contatto con Pillow e guardalo prima di scegliere. Poi scarica l'originale e ritaglia:

```python
from PIL import Image, ImageOps
def crop(src, dst, ratio=3/2, w=2400, cy=0.5):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB'); W, H = im.size
    if W / H > ratio:
        nw = int(H * ratio); x = (W - nw) // 2; box = (x, 0, x + nw, H)
    else:
        nh = int(W / ratio); y = int((H - nh) * cy); box = (0, y, W, y + nh)
    im.crop(box).resize((w, int(w / ratio)), Image.LANCZOS).save(dst, quality=86, optimize=True, progressive=True)
```

Salva in `src/assets/img/tech/cover/<slug-it>.jpg`.

- [ ] **Step 5: Frontmatter dei 18 file**

In ogni file, subito dopo la riga `lead:`, aggiungi (il percorso è relativo al file Markdown; la gemella EN punta allo stesso jpg con slug IT):

```yaml
# Foto Pexels, <autore> (https://www.pexels.com/photo/<id>/).
copertina: "../../../assets/img/tech/cover/sfra.jpg"
copertinaAlt: "Trasformatore di potenza in una sottostazione AT, ripreso all'alba"
```

L'alt descrive la foto vera, in italiano nei file `it/`, in inglese nei file `en/`.

- [ ] **Step 6: PageHero con la foto**

In `TechDetailPage.astro` sostituisci la riga `<PageHero eyebrow={t.eyebrowHero} h1={d.titolo} sub={d.lead} />` e il commento sopra con:

```astro
  <PageHero eyebrow={t.eyebrowHero} h1={d.titolo} sub={d.lead} image={d.copertina} imageAlt={d.copertinaAlt} />
```

- [ ] **Step 7: CMS**

In `public/admin/config.yml`, nell'ancora `&servizio_dettaglio_fields`, dopo il campo `lead`:

```yaml
      - { label: "Foto di cover", name: "copertina", widget: "image", media_folder: "/src/assets/img/tech/cover", public_folder: "../../../assets/img/tech/cover", hint: "Foto orizzontale 3:2, almeno 2400px. Usa la stessa foto sulla pagina gemella nell'altra lingua." }
      - { label: "Testo alternativo della cover", name: "copertinaAlt", widget: "string", hint: "Descrive la foto per chi non la vede, nella lingua della pagina." }
```

- [ ] **Step 8: Verifica**

Run: `npm run build && node --test test/tech-pages.test.mjs`
Expected: PASS. Poi `npm test`: tutto verde.

- [ ] **Step 9: Commit**

```bash
git add src/content.config.ts src/content/servizi-dettaglio src/assets/img/tech/cover public/admin/config.yml src/components/tech/TechDetailPage.astro test/tech-pages.test.mjs
git commit -m "feat(tech): foto di cover sulle nove pagine tecniche"
```

---

### Task 2: Struttura a fasce, FAQ a due colonne, box uniformi, pre-footer classico

**Files:**
- Modify: `src/components/tech/TechDetailPage.astro`
- Modify: `src/components/tech/ParamGrid.astro`
- Delete: `src/components/tech/TechCtaBand.astro`
- Test: `test/tech-layout.test.mjs` (nuovo)

**Interfaces:**
- Consumes: `d.copertina` (Task 1), `ServiceCard` (props `titolo, excerpt, icona, href, index, accent, elevated, ctaLabel`), `CtaBand` (prop `lingua`), `contatti.telefonoHref`, `contatti.telefono`.

- [ ] **Step 1: Test di layout che fallisce**

Crea `test/tech-layout.test.mjs`. Server statico e skip identici a `test/servizi-card-layout.test.mjs` (copia `MIME`, `before`, `after`). Pagine: gli slug da `ROTTE` in `src/i18n/routes.ts` come fa `test/tech-pages.test.mjs` (importa lì la stessa lista; se non esportata, elenca i 9 slug IT e i 9 EN letti da `readdirSync('src/content/servizi-dettaglio/it')` e `/en`).

```js
const misura = async (url, width) => {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(origin + url, { waitUntil: 'load' });
  const m = await page.evaluate(() => {
    const main = document.querySelector('main');
    const sezioni = [...main.querySelectorAll(':scope > section, :scope > div > section')];
    const fondo = (s) => getComputedStyle(s).backgroundColor;
    const righe = new Map();
    for (const c of document.querySelectorAll('.param-grid__item')) {
      const r = c.getBoundingClientRect();
      const k = Math.round(r.top);
      righe.set(k, [...(righe.get(k) ?? []), Math.round(r.height)]);
    }
    const faq = document.querySelector('.tech-faq');
    const faqIntro = document.querySelector('[data-faq-intro]');
    return {
      fondi: sezioni.map(fondo),
      paramRighe: [...righe.values()],
      faqAffiancata: faq && faqIntro ? faq.getBoundingClientRect().left > faqIntro.getBoundingClientRect().right : false,
      ctaBand: Boolean(document.querySelector('.cta-band')),
      correlatiCard: document.querySelectorAll('[data-correlati] .ds-card-service').length,
      correlatiBianchi: document.querySelectorAll('.correlato').length,
    };
  });
  await page.close();
  return m;
};
```

Test per ogni pagina a 1440px (e a 1024px per FAQ e parametri):
- `fondi`: nessuna coppia adiacente uguale (`fondi[i] !== fondi[i+1]`), escluse le sezioni con foto (la cover è la prima, il pre-footer l'ultima: confronta `fondi.slice(1, -1)`).
- `paramRighe`: in ogni riga `max - min <= 1`.
- `faqAffiancata === true` a 1024 e 1440.
- `ctaBand === true`, `correlatiBianchi === 0`, `correlatiCard >= 2`.

Run: `npm run build >/dev/null && node --test test/tech-layout.test.mjs`
Expected: FAIL (FAQ non affiancata, nessuna `.cta-band`, `.correlato` presenti).

- [ ] **Step 2: ParamGrid alto uguale**

In `ParamGrid.astro`, `.param-grid__item` aggiunge `height: 100%;` e `.param-grid__text` aggiunge `flex: 1;`. Le celle della griglia si allungano già (align `stretch`), la card ora le riempie.

- [ ] **Step 3: Riscrivi il corpo di TechDetailPage**

Aggiungi a `TESTI.it`: `cheCosaRivelaTitolo: 'Che cosa misura, e perché conta.'`, `faqTesto: 'Se la tua domanda non è qui, chiamaci: risponde un tecnico, non un centralino.'`, `chiamaci: 'Chiamaci'`. A `TESTI.en`: `cheCosaRivelaTitolo: 'What it measures, and why it matters.'`, `faqTesto: 'If your question is not here, call us: a technician answers, not a switchboard.'`, `chiamaci: 'Call us'`. Rimuovi `verificheCollegateTitolo` solo se inutilizzato (resta usato: tienilo).

Import: rimuovi `TechCtaBand`, aggiungi:

```ts
import { Image } from 'astro:assets';
import CtaBand from '../../components/CtaBand.astro';
import ServiceCard from '../../components/ServiceCard.astro';
```

Alternanza dei fondi dalla fascia 5 in poi:

```ts
// Dalla fascia "Norma" in poi i fondi si alternano per posizione, sulle sole
// fasce presenti: senza caso reale la FAQ sale di un posto e cambia colore,
// così due fasce uguali non si toccano mai.
const coda = ['norma', ...(d.caso ? ['caso'] : []), 'faq', 'correlati'] as const;
const FONDI = ['bg-paper', 'bg-navy-100'] as const;
const fondo = (k: (typeof coda)[number]) => FONDI[coda.indexOf(k) % 2];
```

Icona delle card correlate (dal campo `area` delle sorelle, passato in `correlati`): estendi `interface Correlato` con `area?: 'diagnostica' | 'controllo'` e in entrambe le route (`src/pages/servizi/[slug].astro`, `src/pages/en/services/[slug].astro`) aggiungi `area: sorella?.area` all'oggetto restituito dal `map`. Nel template:

```ts
const ICONA_AREA = { diagnostica: 'fa6-solid:wave-square', controllo: 'fa6-solid:tower-broadcast' } as const;
```

Markup delle fasce 2, 5, 6, 7, 8, 9 (le fasce 3 e 4 restano come sono):

```astro
  <!-- Il problema, e accanto il grafico che lo mostra -->
  <section class="bg-paper">
    <div class="wrap-wide py-20 lg:py-28">
      <div class="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-16">
        <div>
          <div class="ds-eyebrow" data-reveal>
            <span class="ds-eyebrow-dash"></span>
            <span class="ds-eyebrow-label">{t.cheCosaRivela}</span>
          </div>
          <h2 class="text-headline max-w-[22ch]" data-reveal style="--reveal-delay:60ms">{t.cheCosaRivelaTitolo}</h2>
          <div class="mt-6 flex flex-col gap-5" data-reveal style="--reveal-delay:100ms">
            {d.problema.map((p) => <p class="measure text-body text-ink/75">{p}</p>)}
          </div>
        </div>
        <div class="lg:sticky lg:top-28" data-reveal style="--reveal-delay:160ms">
          <Diagramma lingua={lingua} />
        </div>
      </div>
    </div>
  </section>
```

```astro
  <section class={fondo('norma')}>
    <div class="wrap-wide py-20 lg:py-28">
      <!-- stesso contenuto di oggi (griglia norma + SpecPanel), invariato -->
    </div>
  </section>

  {
    d.caso && (
      <section class={fondo('caso')}>
        <div class="wrap-wide py-20 lg:py-28">
          <div class:list={['grid items-center gap-12 lg:gap-16', progetto?.data.immagine && 'lg:grid-cols-[1.05fr_0.95fr]']}>
            <div>
              <div class="ds-eyebrow" data-reveal>
                <span class="ds-eyebrow-dash" />
                <span class="ds-eyebrow-label">{t.inCampo}</span>
              </div>
              <h2 class="text-headline max-w-[22ch]" data-reveal style="--reveal-delay:80ms">
                {progetto?.data.titolo ?? t.casoRealeFallback}
              </h2>
              <p class="measure text-body mt-5 text-ink/75" data-reveal style="--reveal-delay:130ms">{d.caso.testo}</p>
              <a href={hrefLavori} class="ds-btn-secondary mt-8 inline-flex" data-reveal style="--reveal-delay:180ms">
                {t.guardaOpere}
              </a>
            </div>
            {progetto?.data.immagine && (
              <figure class="tech-figure" data-reveal style="--reveal-delay:120ms">
                <Image
                  src={progetto.data.immagine}
                  alt={lingua === 'en' ? (progetto.data.immagineAltEn ?? progetto.data.immagineAlt) : progetto.data.immagineAlt}
                  class="tech-figure__img"
                  widths={[600, 900, 1200]}
                  sizes="(min-width: 1024px) 44vw, 100vw"
                />
              </figure>
            )}
          </div>
        </div>
      </section>
    )
  }

  <section class={fondo('faq')}>
    <div class="wrap-wide py-20 lg:py-28">
      <div class="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
        <div class="lg:sticky lg:top-28" data-faq-intro>
          <div class="ds-eyebrow" data-reveal>
            <span class="ds-eyebrow-dash"></span>
            <span class="ds-eyebrow-label">{t.domandeFrequenti}</span>
          </div>
          <h2 class="text-headline max-w-[18ch]" data-reveal style="--reveal-delay:80ms">{t.domandeFrequentiTitolo}</h2>
          <p class="measure text-body mt-5 text-ink/75" data-reveal style="--reveal-delay:120ms">{t.faqTesto}</p>
          <a href={contatti.telefonoHref} class="ds-btn-primary mt-8 inline-flex" data-reveal style="--reveal-delay:160ms">
            {t.chiamaci}: {contatti.telefono}
          </a>
        </div>
        <div data-reveal style="--reveal-delay:140ms">
          <TechFaq domande={d.faq} />
        </div>
      </div>
    </div>
  </section>

  <section class={fondo('correlati')}>
    <div class="wrap-wide py-20 lg:py-28">
      <div class="ds-eyebrow" data-reveal>
        <span class="ds-eyebrow-dash"></span>
        <span class="ds-eyebrow-label">{t.verificheCollegate}</span>
      </div>
      <h2 class="text-headline max-w-[24ch]" data-reveal style="--reveal-delay:80ms">{t.verificheCollegateTitolo}</h2>
      <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" data-correlati>
        {correlati.map((c, i) => (
          <div data-reveal style={`--reveal-delay:${i * 90}ms`}>
            <ServiceCard
              titolo={c.titolo}
              excerpt={c.lead ?? ''}
              icona={ICONA_AREA[c.area ?? 'diagnostica']}
              href={c.href}
              index={i + 1}
              accent="signal"
              elevated
              ctaLabel={t.approfondisci}
            />
          </div>
        ))}
      </div>
    </div>
  </section>

  <CtaBand lingua={lingua} />
```

Verifica che la classe `ds-btn-primary` esista in `src/styles/global.css` (`grep -n "ds-btn-primary" src/styles/global.css`); se non esiste usa `ds-btn-secondary`, già usata nella fascia caso.

Nel `<style>` del componente sostituisci `.correlato*` con:

```css
  .tech-figure {
    overflow: hidden;
    aspect-ratio: 4 / 3;
    border-radius: var(--radius-card);
    border: 1px solid color-mix(in srgb, var(--color-navy-900) 10%, transparent);
    box-shadow: var(--shadow-md);
  }
  .tech-figure__img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.82) contrast(1.05);
  }
```

(stessa correzione colore delle foto laterali di `AziendaPage.astro`).

Aggiorna il commento di testa del file: niente più «niente fotografie».

- [ ] **Step 4: Elimina TechCtaBand**

```bash
git rm src/components/tech/TechCtaBand.astro
grep -rn "TechCtaBand" src test
```
Expected: nessun risultato.

- [ ] **Step 5: Verifica**

Run: `npm run build && node --test test/tech-layout.test.mjs && npm test`
Expected: PASS. Controlla a occhio `/servizi/sfra/` (con caso) e `/servizi/prove-isolamento/` (senza caso) a 1440 e 390px con uno screenshot Playwright a pagina intera.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/tech src/pages/servizi/[slug].astro src/pages/en/services/[slug].astro test/tech-layout.test.mjs
git commit -m "feat(tech): fasce alternate, FAQ a due colonne, box uniformi e pre-footer classico"
```

---

### Task 3: Fondamenta dei grafici: complessi, generatore, scale, ChartFrame

**Files:**
- Create: `src/components/tech/charts/models/complex.ts`, `random.ts`, `scale.ts`
- Create: `src/components/tech/charts/ChartFrame.astro`
- Test: `test/chart-models.test.mjs`

**Interfaces:**
- Produces:
  - `type C = { re: number; im: number }`; `c(re, im?)`, `add(a,b)`, `sub(a,b)`, `mul(a,b)`, `div(a,b)`, `inv(a)`, `abs(a)`, `par(a,b)` (parallelo `a·b/(a+b)`).
  - `mulberry32(seed: number): () => number` (in [0,1)); `normale(rnd): number` (media 0, varianza 1).
  - `type Scala = { tipo: 'lin' | 'log'; min: number; max: number }`; `proietta(s: Scala, v: number, da: number, a: number): number`; `logspace(min, max, n): number[]`.
  - `ChartFrame.astro` props (vedi Step 5).

- [ ] **Step 1: Test che falliscono**

```js
// test/chart-models.test.mjs
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { c, mul, div, abs, par } from '../src/components/tech/charts/models/complex.ts';
import { mulberry32, normale } from '../src/components/tech/charts/models/random.ts';
import { proietta, logspace } from '../src/components/tech/charts/models/scale.ts';

describe('fondamenta dei grafici', () => {
  test('aritmetica complessa', () => {
    const z = mul(c(1, 2), c(3, -1));
    assert.deepEqual(z, { re: 5, im: 5 });
    const q = div(c(5, 5), c(3, -1));
    assert.ok(Math.abs(q.re - 1) < 1e-12 && Math.abs(q.im - 2) < 1e-12);
    assert.equal(abs(c(3, 4)), 5);
    assert.ok(Math.abs(par(c(2), c(2)).re - 1) < 1e-12);
  });
  test('mulberry32 è deterministico e uniforme', () => {
    const a = mulberry32(42), b = mulberry32(42);
    const xs = Array.from({ length: 5000 }, a);
    assert.deepEqual(xs.slice(0, 5), Array.from({ length: 5 }, b));
    const media = xs.reduce((s, x) => s + x, 0) / xs.length;
    assert.ok(Math.abs(media - 0.5) < 0.02);
    const n = Array.from({ length: 5000 }, () => normale(a));
    const m2 = n.reduce((s, x) => s + x, 0) / n.length;
    assert.ok(Math.abs(m2) < 0.06);
  });
  test('scale lineari e logaritmiche', () => {
    assert.equal(proietta({ tipo: 'lin', min: 0, max: 10 }, 5, 0, 100), 50);
    assert.equal(proietta({ tipo: 'log', min: 10, max: 1000 }, 100, 0, 200), 100);
    const f = logspace(20, 2e6, 5);
    assert.equal(f.length, 5);
    assert.ok(Math.abs(f[0] - 20) < 1e-9 && Math.abs(f[4] - 2e6) < 1e-6);
  });
});
```

Run: `node --test test/chart-models.test.mjs`
Expected: FAIL «Cannot find module».

- [ ] **Step 2: complex.ts**

```ts
// Aritmetica complessa minima per la rete a scala della SFRA: solo quello che
// serve alle matrici ABCD, niente libreria.
export type C = { re: number; im: number };
export const c = (re: number, im = 0): C => ({ re, im });
export const add = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });
export const sub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im });
export const mul = (a: C, b: C): C => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
export const div = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const inv = (a: C): C => div(c(1), a);
export const abs = (a: C): number => Math.hypot(a.re, a.im);
/** Due impedenze in parallelo. */
export const par = (a: C, b: C): C => div(mul(a, b), add(a, b));
```

- [ ] **Step 3: random.ts**

```ts
// Generatore con seme fisso: la stessa build disegna la stessa nuvola di
// impulsi, così lo SVG non cambia a ogni deploy.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normale standard con Box-Muller. */
export function normale(rnd: () => number): number {
  const u = Math.max(rnd(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
}
```

- [ ] **Step 4: scale.ts**

```ts
export type Scala = { tipo: 'lin' | 'log'; min: number; max: number };

/** Porta un valore del dominio nell'intervallo [da, a] di coordinate SVG. */
export function proietta(s: Scala, v: number, da: number, a: number): number {
  const u = s.tipo === 'log'
    ? (Math.log10(v) - Math.log10(s.min)) / (Math.log10(s.max) - Math.log10(s.min))
    : (v - s.min) / (s.max - s.min);
  return da + u * (a - da);
}

export function logspace(min: number, max: number, n: number): number[] {
  const a = Math.log10(min), b = Math.log10(max);
  return Array.from({ length: n }, (_, i) => 10 ** (a + ((b - a) * i) / (n - 1)));
}
```

Run: `node --test test/chart-models.test.mjs` → PASS.

- [ ] **Step 5: ChartFrame.astro**

Telaio comune. Riprende da `RispostaFrequenza.astro` attuale fondo a gradiente, trama a punti, cornice con tacche d'angolo, stile delle etichette con `paint-order`, la regola CSS mobile e la didascalia con pallino verde: quel file è il riferimento visivo, da leggere prima di scrivere questo.

```astro
---
import { proietta, type Scala } from './models/scale.ts';

export interface Asse {
  scala: Scala;
  tacche: { v: number; t: string }[];
  unita: string;
}
export interface Serie {
  tipo: 'line' | 'scatter';
  punti: [number, number][];
  colore: string;
  spessore?: number;
  raggio?: number;
  opacita?: number;
  /** Asse y di riferimento: 'y' (default) o 'y2'. */
  asse?: 'y' | 'y2';
  legenda?: string;
}
interface Props {
  uid: string;
  ariaLabel: string;
  x: Asse;
  y: Asse;
  y2?: Asse;
  serie: Serie[];
  banda?: { da: number; a: number; etichetta: string };
  didascalia: string;
  didascaliaSub: string;
}
const { uid, ariaLabel, x, y, y2, serie, banda, didascalia, didascaliaSub } = Astro.props;

const W = 640, H = 400;
const X0 = 78, X1 = y2 ? 566 : 608, Y0 = 70, Y1 = 330;
const n = (v: number) => Math.round(v * 10) / 10;
const px = (v: number) => n(proietta(x.scala, v, X0, X1));
const py = (v: number, a: 'y' | 'y2' = 'y') => n(proietta((a === 'y2' ? y2! : y).scala, v, Y1, Y0));
const linea = (s: Serie) => s.punti.map(([a, b]) => `${px(a)},${py(b, s.asse)}`).join(' ');
const conLegenda = serie.filter((s) => s.legenda);
---

<figure class="chart">
  <div class="chart__frame rounded-[var(--radius-card)] border border-navy-100 shadow-[var(--shadow-md)]">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stop-color="#0c3151"></stop>
          <stop offset="1" stop-color="#081f36"></stop>
        </linearGradient>
        <pattern id={`${uid}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.1" cy="1.1" r="1.1" fill="#4f93c4" fill-opacity="0.16"></circle>
        </pattern>
        <clipPath id={`${uid}-clip`}><rect x={X0} y={Y0} width={X1 - X0} height={Y1 - Y0}></rect></clipPath>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-bg)`}></rect>
      <rect width={W} height={H} fill={`url(#${uid}-dots)`}></rect>

      {banda && (
        <g>
          <rect x={px(banda.da)} y={Y0} width={n(px(banda.a) - px(banda.da))} height={Y1 - Y0} fill="#4fd07f" fill-opacity="0.07" />
          <line x1={px(banda.da)} y1={Y0} x2={px(banda.da)} y2={Y1} stroke="#4fd07f" stroke-opacity="0.45" stroke-dasharray="3 4" />
        </g>
      )}

      <g stroke="#3f7fb0" stroke-width="0.8" opacity="0.22">
        {x.tacche.map((k) => <line x1={px(k.v)} y1={Y0} x2={px(k.v)} y2={Y1} />)}
        {y.tacche.map((k) => <line x1={X0} y1={py(k.v)} x2={X1} y2={py(k.v)} />)}
      </g>
      <g stroke="#6ba7d2" stroke-opacity="0.55" stroke-width="1">
        <line x1={X0} y1={Y0} x2={X0} y2={Y1} />
        <line x1={X0} y1={Y1} x2={X1} y2={Y1} />
        {y2 && <line x1={X1} y1={Y0} x2={X1} y2={Y1} />}
      </g>

      <g clip-path={`url(#${uid}-clip)`}>
        {serie.map((s) =>
          s.tipo === 'line' ? (
            <polyline points={linea(s)} fill="none" stroke={s.colore} stroke-width={s.spessore ?? 1.8} stroke-linejoin="round" stroke-linecap="round" opacity={s.opacita ?? 1} />
          ) : (
            <g fill={s.colore} fill-opacity={s.opacita ?? 0.55}>
              {s.punti.map(([a, b]) => <circle cx={px(a)} cy={py(b, s.asse)} r={s.raggio ?? 1.6} />)}
            </g>
          ),
        )}
      </g>

      <g class="chart-label" font-family="Inter Variable, Inter, sans-serif" font-size="12" font-weight="600" letter-spacing="0.06em" fill="#bcd6e8" paint-order="stroke" stroke="#081f36" stroke-width="3.5" stroke-opacity="0.85">
        {x.tacche.map((k, i) => (
          <text x={px(k.v)} y={Y1 + 22} text-anchor={i === 0 ? 'start' : i === x.tacche.length - 1 ? 'end' : 'middle'}>{k.t}</text>
        ))}
        {y.tacche.map((k) => <text x={X0 - 10} y={py(k.v) + 4} text-anchor="end">{k.t}</text>)}
        <text x={X0 - 10} y={Y0 - 14} text-anchor="end">{y.unita}</text>
        <text x={X1} y={Y1 + 44} text-anchor="end">{x.unita}</text>
        {y2 && y2.tacche.map((k) => <text x={X1 + 10} y={py(k.v, 'y2') + 4} text-anchor="start">{k.t}</text>)}
        {y2 && <text x={X1 + 10} y={Y0 - 14} text-anchor="start">{y2.unita}</text>}
        {banda && <text x={n(px(banda.a) - 8)} y={Y0 + 17} text-anchor="end" fill="#8fd9ab" letter-spacing="0.12em">{banda.etichetta}</text>}
      </g>

      <g class="chart-legend" transform={`translate(${X0} 30)`} font-family="Inter Variable, Inter, sans-serif" font-size="11" font-weight="600" fill="#bcd6e8">
        {conLegenda.map((s, i) => (
          <g transform={`translate(${i * 200} 0)`}>
            <line x1="0" y1="0" x2="20" y2="0" stroke={s.colore} stroke-width="2.2" />
            <text x="28" y="4">{s.legenda}</text>
          </g>
        ))}
      </g>

      <rect x="14" y="14" width={W - 28} height={H - 28} rx="6" fill="none" stroke="#6ba7d2" stroke-opacity="0.26" />
      <g stroke="#8fd9ab" stroke-opacity="0.5" stroke-width="1.4" stroke-linecap="square">
        <line x1="14" y1="38" x2="14" y2="14" /><line x1="14" y1="14" x2="38" y2="14" />
        <line x1={W - 38} y1="14" x2={W - 14} y2="14" /><line x1={W - 14} y1="14" x2={W - 14} y2="38" />
        <line x1="14" y1={H - 38} x2="14" y2={H - 14} /><line x1="14" y1={H - 14} x2="38" y2={H - 14} />
        <line x1={W - 38} y1={H - 14} x2={W - 14} y2={H - 14} /><line x1={W - 14} y1={H - 14} x2={W - 14} y2={H - 38} />
      </g>
    </svg>
  </div>
  <figcaption class="chart__caption">
    <span class="chart__dot" aria-hidden="true"></span>
    <span><strong>{didascalia}</strong><span class="chart__caption-sub">{didascaliaSub}</span></span>
  </figcaption>
</figure>

<style>
  .chart__frame { position: relative; overflow: hidden; aspect-ratio: 8 / 5; background: #0a2a44; }
  .chart__frame svg { display: block; width: 100%; height: 100%; }
  /* Su 390px la tela è larga ~350px reali: 12 unità di viewBox varrebbero
     meno di 7px. Le etichette crescono nello spazio del disegno. */
  @media (max-width: 767px) {
    .chart-label { font-size: 22px; }
    .chart-legend { font-size: 20px; }
  }
  .chart__caption { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.85rem; padding-left: 0.15rem; font-size: var(--fs-small); line-height: 1.35; }
  .chart__caption strong { display: block; font-weight: 700; }
  .chart__caption-sub { display: block; color: color-mix(in srgb, currentColor 62%, transparent); font-size: var(--fs-micro); }
  .chart__dot { width: 0.5rem; height: 0.5rem; flex: none; border-radius: 999px; background: #2fa85f; box-shadow: 0 0 0 4px rgb(79 208 127 / 0.22); }
</style>
```

Se a 390px le etichette ingrandite si sovrappongono, riduci le tacche mostrate su mobile passando un sottoinsieme in `tacche` non è possibile via CSS: in quel caso nascondi con `display:none` su mobile le etichette marcate `class="chart-label--minor"` (aggiungi un campo `minore?: boolean` alle tacche e applica la classe).

- [ ] **Step 6: Commit**

```bash
git add src/components/tech/charts test/chart-models.test.mjs
git commit -m "feat(tech): fondamenta dei grafici calcolati e telaio ChartFrame"
```

---

### Task 4: SFRA calcolata da una rete a scala RLC

**Files:**
- Create: `src/components/tech/charts/models/sfra.ts`
- Rewrite: `src/components/tech/diagrams/RispostaFrequenza.astro`
- Test: `test/chart-models.test.mjs` (aggiunta)

**Interfaces:**
- Consumes: `c, add, mul, div, par, abs` (complex.ts), `logspace` (scale.ts), `ChartFrame`.
- Produces: `rispostaSfra(f: number, p: ParametriAvvolgimento): number` (dB); `AVVOLGIMENTO_RIFERIMENTO`, `AVVOLGIMENTO_DEFORMATO: ParametriAvvolgimento`.

- [ ] **Step 1: Test che falliscono**

Aggiungi a `test/chart-models.test.mjs`:

```js
import { rispostaSfra, AVVOLGIMENTO_RIFERIMENTO as RIF, AVVOLGIMENTO_DEFORMATO as DEF } from '../src/components/tech/charts/models/sfra.ts';
import { logspace as ls } from '../src/components/tech/charts/models/scale.ts';

describe('modello SFRA', () => {
  const f = ls(20, 2e6, 600);
  const rif = f.map((x) => rispostaSfra(x, RIF));
  const def = f.map((x) => rispostaSfra(x, DEF));
  test('ampiezze nel campo di misura', () => {
    for (const v of rif) assert.ok(v <= 0 && v >= -100, `valore fuori scala: ${v}`);
  });
  test('coincidono sotto 10 kHz, si separano sopra 100 kHz', () => {
    f.forEach((x, i) => { if (x < 1e4) assert.ok(Math.abs(rif[i] - def[i]) < 1, `scarto a ${x} Hz`); });
    assert.ok(f.some((x, i) => x > 1e5 && Math.abs(rif[i] - def[i]) > 3), 'nessuno scostamento sopra 100 kHz');
  });
  test('almeno tre risonanze fra 1 kHz e 2 MHz', () => {
    let minimi = 0;
    for (let i = 1; i < f.length - 1; i++) if (f[i] > 1e3 && rif[i] < rif[i - 1] && rif[i] < rif[i + 1]) minimi++;
    assert.ok(minimi >= 3, `minimi trovati: ${minimi}`);
  });
});
```

Run: `node --test test/chart-models.test.mjs` → FAIL.

- [ ] **Step 2: Modello**

```ts
// Risposta in frequenza end-to-end di un avvolgimento, come la misura la
// IEC 60076-18: sorgente su 50 Ω al terminale di linea, misura su 50 Ω al
// terminale opposto, rapporto fra le due tensioni in dB.
//
// L'avvolgimento è una rete a scala di N sezioni. Ogni sezione ha in serie
// l'induttanza L con le perdite R, in parallelo alla capacità fra spire Cs, e
// verso terra la capacità Cg con una piccola conduttanza G. In bassa
// frequenza domina l'induttanza (il nucleo), salendo compaiono le risonanze
// fra L e le capacità distribuite. Una deformazione radiale avvicina
// l'avvolgimento al cassone: Cg cresce su un gruppo di sezioni e le
// risonanze alte si spostano, quelle basse no. È quello che la SFRA vede.
import { c, add, mul, div, par, abs, type C } from './complex.ts';

export interface ParametriAvvolgimento {
  sezioni: number;
  L: number; // H per sezione
  R: number; // Ω per sezione
  Cs: number; // F per sezione
  Cg: number; // F per sezione
  G: number; // S per sezione
  /** Moltiplicatore di Cg per indice di sezione (deformazione). */
  fattoreCg?: (i: number) => number;
}

type M = [C, C, C, C]; // A, B, C, D
const molt = (a: M, b: M): M => [
  add(mul(a[0], b[0]), mul(a[1], b[2])),
  add(mul(a[0], b[1]), mul(a[1], b[3])),
  add(mul(a[2], b[0]), mul(a[3], b[2])),
  add(mul(a[2], b[1]), mul(a[3], b[3])),
];

const R50 = 50;

export function rispostaSfra(f: number, p: ParametriAvvolgimento): number {
  const w = 2 * Math.PI * f;
  let m: M = [c(1), c(0), c(0), c(1)];
  for (let i = 0; i < p.sezioni; i++) {
    const zL = add(c(p.R), c(0, w * p.L));
    const zC = c(0, -1 / (w * p.Cs));
    const zs = par(zL, zC);
    const cg = p.Cg * (p.fattoreCg?.(i) ?? 1);
    const y = add(c(p.G), c(0, w * cg));
    m = molt(m, [c(1), zs, c(0), c(1)]);
    m = molt(m, [c(1), c(0), y, c(1)]);
  }
  // Vout / Vin con carico di misura R50: H = 1 / (A + B / R50).
  const h = div(c(1), add(m[0], div(m[1], c(R50))));
  return 20 * Math.log10(abs(h));
}

// Valori di partenza: L totale 12 sezioni × 0,5 H = 6 H (nucleo), capacità
// dell'ordine dei nF come in un trasformatore di distribuzione AT/MT. Se i
// test sulle risonanze falliscono, si tarano qui e solo qui.
export const AVVOLGIMENTO_RIFERIMENTO: ParametriAvvolgimento = {
  sezioni: 12,
  L: 0.5,
  R: 40,
  Cs: 0.35e-9,
  Cg: 1.2e-9,
  G: 1e-7,
};

export const AVVOLGIMENTO_DEFORMATO: ParametriAvvolgimento = {
  ...AVVOLGIMENTO_RIFERIMENTO,
  fattoreCg: (i) => (i >= 6 && i <= 9 ? 1.35 : 1),
};
```

- [ ] **Step 3: Tara**

Run: `node --test test/chart-models.test.mjs`. Se fallisce «coincidono sotto 10 kHz», riduci `fattoreCg` (1,35 → 1,25). Se fallisce «tre risonanze», aumenta `sezioni` (12 → 16) o riduci `R`. Se esce dalla scala [-100, 0], alza `L` o `R`. Ripeti finché PASS, poi guarda la curva (Step 5) e ritocca perché somigli a una SFRA end-to-end tipica: da circa -40/-60 dB in bassa frequenza, minimo profondo fra 100 Hz e 2 kHz, risalita e risonanze fitte sopra 10 kHz.

- [ ] **Step 4: Riscrivi RispostaFrequenza.astro**

Mantieni `interface Props { lingua: Lingua }` e i testi IT/EN esistenti (`ariaLabel`, `impronta`, `misuraInCampo`, `caption`, `scostamento`), con `captionSub` IT «Curva calcolata da modello · rete RLC dell'avvolgimento, 20 Hz – 2 MHz secondo IEC 60076-18» ed EN «Computed from a model · RLC winding network, 20 Hz – 2 MHz under IEC 60076-18». Corpo:

```astro
---
import ChartFrame from '../charts/ChartFrame.astro';
import { rispostaSfra, AVVOLGIMENTO_RIFERIMENTO, AVVOLGIMENTO_DEFORMATO } from '../charts/models/sfra.ts';
import { logspace } from '../charts/models/scale.ts';
// ... Props, TESTI, t come oggi ...
const f = logspace(20, 2e6, 480);
const riferimento = f.map((x) => [x, rispostaSfra(x, AVVOLGIMENTO_RIFERIMENTO)] as [number, number]);
const misura = f.map((x) => [x, rispostaSfra(x, AVVOLGIMENTO_DEFORMATO)] as [number, number]);
---
<ChartFrame
  uid="sfra"
  ariaLabel={t.ariaLabel}
  x={{ scala: { tipo: 'log', min: 20, max: 2e6 }, unita: 'Hz', tacche: [
    { v: 20, t: '20 Hz' }, { v: 100, t: '100' }, { v: 1e3, t: '1 k' }, { v: 1e4, t: '10 k' },
    { v: 1e5, t: '100 k' }, { v: 1e6, t: '1 M' }, { v: 2e6, t: '2 MHz' } ] }}
  y={{ scala: { tipo: 'lin', min: -100, max: 0 }, unita: 'dB', tacche: [0, -20, -40, -60, -80, -100].map((v) => ({ v, t: String(v) })) }}
  serie={[
    { tipo: 'line', punti: misura, colore: '#4fd07f', spessore: 1.8, legenda: t.misuraInCampo },
    { tipo: 'line', punti: riferimento, colore: '#bcd6e8', spessore: 1.6, legenda: t.impronta },
  ]}
  banda={{ da: 1e5, a: 2e6, etichetta: t.scostamento }}
  didascalia={t.caption}
  didascaliaSub={t.captionSub}
/>
```

Aggiorna il commento di testa: la curva esce dal modello di `sfra.ts`.

- [ ] **Step 5: Guarda il grafico**

Build, poi screenshot dell'elemento `figure.chart` su `/servizi/sfra/` a 1440 e 390px (script Playwright come in `test/servizi-card-layout.test.mjs`, `locator.screenshot`). Controlla: curve dentro la tela, etichette leggibili a 390px, legenda che non copre le curve.

- [ ] **Step 6: Verifica e commit**

Run: `npm run build && npm test` → PASS.

```bash
git add src/components/tech/charts/models/sfra.ts src/components/tech/diagrams/RispostaFrequenza.astro test/chart-models.test.mjs
git commit -m "feat(tech): SFRA calcolata da una rete a scala RLC"
```

---

### Task 5: Protezioni AT/MT con la caratteristica IEC 60255

**Files:**
- Create: `src/components/tech/charts/models/iec60255.ts`
- Rewrite: `src/components/tech/diagrams/CurvaTempoCorrente.astro`
- Test: `test/chart-models.test.mjs` (aggiunta)

**Interfaces:**
- Produces: `tempoInverso(I, Is, TMS): number` (s, `Infinity` se I ≤ Is); `tempoIntervento(I, taratura: Taratura): number`; `TARATURA_ESEMPIO: Taratura`; `PUNTI_PROVA: { I: number; t: number }[]`.

- [ ] **Step 1: Test che falliscono**

```js
import { tempoInverso, tempoIntervento, TARATURA_ESEMPIO as TAR, PUNTI_PROVA } from '../src/components/tech/charts/models/iec60255.ts';

describe('caratteristica IEC 60255-151 standard inverse', () => {
  test('formula ai multipli canonici', () => {
    const atteso = (k) => (0.1 * 0.14) / (k ** 0.02 - 1);
    for (const k of [2, 5, 10]) {
      const t = tempoInverso(k * 400, 400, 0.1);
      assert.ok(Math.abs(t - atteso(k)) / atteso(k) < 0.005, `k=${k}: ${t}`);
    }
    assert.equal(tempoInverso(300, 400, 0.1), Infinity);
  });
  test('I>> taglia la curva a tempo definito', () => {
    assert.equal(tempoIntervento(TAR.Iist * 1.5, TAR), TAR.tIst);
    assert.ok(tempoIntervento(TAR.Is * 2, TAR) > TAR.tIst);
  });
  test('i punti di prova cadono entro il 5% della curva', () => {
    for (const p of PUNTI_PROVA) {
      const teor = tempoIntervento(p.I, TAR);
      assert.ok(Math.abs(p.t - teor) / teor < 0.05);
    }
  });
});
```

- [ ] **Step 2: Modello**

```ts
// Caratteristica tempo–corrente della protezione di massima corrente, come la
// verifichiamo in campo: I> a tempo inverso secondo IEC 60255-151, curva
// "standard inverse", e I>> a tempo definito che la taglia alle correnti di
// cortocircuito. I punti di prova sono iniezioni ai multipli canonici della
// soglia, con il tempo cronometrato che si discosta di pochi punti
// percentuali dalla curva teorica, come in un referto reale.
export interface Taratura {
  Is: number; // A primari, soglia I>
  TMS: number;
  Iist: number; // A primari, soglia I>>
  tIst: number; // s
}

export function tempoInverso(I: number, Is: number, TMS: number): number {
  const k = I / Is;
  return k <= 1 ? Infinity : (TMS * 0.14) / (k ** 0.02 - 1);
}

export function tempoIntervento(I: number, t: Taratura): number {
  return I >= t.Iist ? t.tIst : tempoInverso(I, t.Is, t.TMS);
}

export const TARATURA_ESEMPIO: Taratura = { Is: 400, TMS: 0.1, Iist: 4000, tIst: 0.05 };

export const PUNTI_PROVA = [
  { I: 800, t: tempoIntervento(800, TARATURA_ESEMPIO) * 1.018 },
  { I: 2000, t: tempoIntervento(2000, TARATURA_ESEMPIO) * 0.988 },
  { I: 3200, t: tempoIntervento(3200, TARATURA_ESEMPIO) * 1.009 },
  { I: 6000, t: TARATURA_ESEMPIO.tIst * 1.04 },
];
```

Run test → PASS.

- [ ] **Step 3: Riscrivi CurvaTempoCorrente.astro**

Testi: legende IT «Caratteristica I> tempo inverso», «Soglia I>> tempo definito», «Punti di prova»; EN «I> inverse-time curve», «I>> definite-time threshold», «Test points». `captionSub` IT «Curva calcolata da modello · IEC 60255-151 standard inverse, Is 400 A, TMS 0,1, I>> 4 kA»; EN «Computed from a model · IEC 60255-151 standard inverse, Is 400 A, TMS 0.1, I>> 4 kA». Mantieni `caption` e `ariaLabel` attuali aggiornando nell'`ariaLabel` il riferimento alla curva a tempo inverso.

```ts
const I = logspace(420, 20000, 300);
const curva = I.map((i) => [i, Math.min(100, tempoIntervento(i, TARATURA_ESEMPIO))] as [number, number]);
const soglia = [[4000, 0.05], [20000, 0.05]] as [number, number][];
const punti = PUNTI_PROVA.map((p) => [p.I, p.t] as [number, number]);
```

`ChartFrame` con `x` log 100 A–20 kA (tacche 100 A, 1 kA, 10 kA, 20 kA), unità «A»; `y` log 0,01–100 s (tacche 0.01, 0.1, 1, 10, 100 con etichette «0,01 s»… in IT, «0.01 s»… in EN), unità «s»; serie `curva` linea `#bcd6e8`, `soglia` linea `#4fd07f`, `punti` scatter `#4fd07f` raggio 4, opacità 1.

- [ ] **Step 4: Verifica visiva, suite, commit**

Screenshot a 1440/390 di `/servizi/verifica-protezioni-at-mt/`, poi `npm run build && npm test`.

```bash
git add src/components/tech/charts/models/iec60255.ts src/components/tech/diagrams/CurvaTempoCorrente.astro test/chart-models.test.mjs
git commit -m "feat(tech): caratteristica di intervento IEC 60255 calcolata"
```

---

### Task 6: Scariche parziali come diagramma PRPD

**Files:**
- Create: `src/components/tech/charts/models/prpd.ts`
- Rewrite: `src/components/tech/diagrams/ScaricheParziali.astro`
- Test: `test/chart-models.test.mjs` (aggiunta)

**Interfaces:**
- Consumes: `mulberry32`, `normale`.
- Produces: `nuvolaPrpd(seme: number, n: number): { fase: number; pC: number }[]`; `tensioneProva(fase: number, Upicco: number): number`.

- [ ] **Step 1: Test che falliscono**

```js
import { nuvolaPrpd, tensioneProva } from '../src/components/tech/charts/models/prpd.ts';

describe('PRPD di una cavità interna', () => {
  const a = nuvolaPrpd(7, 900), b = nuvolaPrpd(7, 900);
  test('deterministica con lo stesso seme', () => assert.deepEqual(a, b));
  test('fasi in [0, 360) e cariche positive', () => {
    for (const p of a) assert.ok(p.fase >= 0 && p.fase < 360 && p.pC > 0);
  });
  test('impulsi sui fronti di salita delle due semionde', () => {
    const inFronte = a.filter((p) => (p.fase >= 0 && p.fase < 90) || (p.fase >= 180 && p.fase < 270)).length;
    assert.ok(inFronte / a.length > 0.8, `solo ${inFronte}/${a.length} sui fronti`);
  });
  test('la tensione di prova è una sinusoide', () => {
    assert.ok(Math.abs(tensioneProva(90, 12) - 12) < 1e-9);
    assert.ok(Math.abs(tensioneProva(270, 12) + 12) < 1e-9);
  });
});
```

- [ ] **Step 2: Modello**

```ts
// Diagramma PRPD (phase-resolved partial discharge): ogni punto è un impulso,
// con la fase della tensione di prova a cui è comparso e la sua carica
// apparente in pC (metodo convenzionale IEC 60270). Una cavità interna
// all'isolante scarica sui fronti di salita delle due semionde, con due
// "orecchie" quasi simmetriche; la negativa un po' più alta, come si vede di
// solito. Ampiezze log-normali, seme fisso.
import { mulberry32, normale } from './random.ts';

export function tensioneProva(fase: number, Upicco: number): number {
  return Upicco * Math.sin((fase * Math.PI) / 180);
}

export function nuvolaPrpd(seme: number, n: number): { fase: number; pC: number }[] {
  const rnd = mulberry32(seme);
  const out: { fase: number; pC: number }[] = [];
  for (let i = 0; i < n; i++) {
    const negativa = rnd() < 0.5;
    const centro = negativa ? 225 : 45;
    let fase = centro + normale(rnd) * 17;
    fase = ((fase % 360) + 360) % 360;
    const mediana = negativa ? 24 : 18;
    const pC = mediana * Math.exp(normale(rnd) * 0.45);
    out.push({ fase: Math.round(fase * 10) / 10, pC: Math.round(pC * 10) / 10 });
  }
  return out;
}
```

Run test → PASS.

- [ ] **Step 3: Riscrivi ScaricheParziali.astro**

Legende IT «Impulsi di scarica», «Tensione di prova»; EN «Discharge pulses», «Test voltage». `captionSub` IT «Calcolato da modello · cavità interna, carica apparente in pC secondo IEC 60270»; EN «Computed from a model · internal void, apparent charge in pC under IEC 60270». Didascalia IT «Impulsi di scarica per fase della tensione», EN «Discharge pulses by voltage phase».

```ts
const nuvola = nuvolaPrpd(7, 900).map((p) => [p.fase, p.pC] as [number, number]);
const sinusoide = Array.from({ length: 181 }, (_, i) => [i * 2, tensioneProva(i * 2, 12)] as [number, number]);
```

`x` lineare 0–360 (tacche 0°, 90°, 180°, 270°, 360°), unità «°»; `y` lineare 0–100 pC (tacche 0, 25, 50, 75, 100), unità «pC»; `y2` lineare −15…15 kV (tacche −15, 0, 15), unità «kV». Serie: `nuvola` scatter `#4fd07f` raggio 1.8 opacità 0.5; `sinusoide` linea `#bcd6e8` spessore 1.4 opacità 0.8 su `asse: 'y2'`.

- [ ] **Step 4: Verifica visiva, suite, commit**

```bash
git add src/components/tech/charts/models/prpd.ts src/components/tech/diagrams/ScaricheParziali.astro test/chart-models.test.mjs
git commit -m "feat(tech): scariche parziali come diagramma PRPD calcolato"
```

---

### Task 7: Prova di isolamento su due assi

**Files:**
- Create: `src/components/tech/charts/models/isolamento.ts`
- Rewrite: `src/components/tech/diagrams/RampaIsolamento.astro`
- Test: `test/chart-models.test.mjs` (aggiunta)

**Interfaces:**
- Produces: `tensione(tMin: number, p: ProvaIsolamento): number` (kV); `correnteFuga(tMin, p, stato: 'sano' | 'compromesso'): number` (µA); `PROVA_ESEMPIO: ProvaIsolamento`.

- [ ] **Step 1: Test che falliscono**

```js
import { tensione, correnteFuga, PROVA_ESEMPIO as P } from '../src/components/tech/charts/models/isolamento.ts';

describe('prova di isolamento a rampa', () => {
  test('rampa fino a 80 kV e poi tenuta', () => {
    assert.equal(tensione(0, P), 0);
    assert.equal(tensione(P.durataRampaMin, P), 80);
    assert.equal(tensione(P.durataRampaMin + 1, P), 80);
  });
  test('durante la rampa la corrente di carica vale C·dV/dt', () => {
    const icar = P.C * ((80e3 / P.durataRampaMin) / 60) * 1e6;
    assert.ok(Math.abs(correnteFuga(1, P, 'sano') - icar) < 0.5);
  });
  test('in tenuta il sano scende sotto 1 µA, il compromesso resta sopra 20', () => {
    const t = P.durataRampaMin + 1;
    assert.ok(correnteFuga(t, P, 'sano') < 1);
    assert.ok(correnteFuga(t, P, 'compromesso') > 20);
  });
});
```

- [ ] **Step 2: Modello**

```ts
// Prova di isolamento in alta tensione a rampa controllata, fino a 80 kV come
// il Megger HV Test 80 kV della nostra dotazione. La corrente che lo
// strumento legge ha due parti: la carica della capacità del componente,
// C·dV/dt, costante finché la tensione sale e nulla in tenuta, e la
// conduzione attraverso l'isolante, V/R. Un isolante sano ha R costante. Uno
// compromesso regge fino a una soglia e poi la sua resistenza crolla:
// la corrente si impenna prima di arrivare al valore di prova.
export interface ProvaIsolamento {
  C: number; // F
  Rsano: number; // Ω
  durataRampaMin: number;
  sogliaKv: number;
  scalaKv: number; // quanto rapidamente crolla R sopra soglia
}

export const PROVA_ESEMPIO: ProvaIsolamento = { C: 50e-9, Rsano: 100e9, durataRampaMin: 8, sogliaKv: 45, scalaKv: 10 };

export function tensione(tMin: number, p: ProvaIsolamento): number {
  return Math.min(80, (80 * tMin) / p.durataRampaMin);
}

export function correnteFuga(tMin: number, p: ProvaIsolamento, stato: 'sano' | 'compromesso'): number {
  const kv = tensione(tMin, p);
  const carica = tMin < p.durataRampaMin ? p.C * ((80e3 / p.durataRampaMin) / 60) : 0;
  const R = stato === 'sano' || kv <= p.sogliaKv ? p.Rsano : p.Rsano * Math.exp(-(kv - p.sogliaKv) / p.scalaKv);
  return (carica + (kv * 1e3) / R) * 1e6;
}
```

Run test → PASS.

- [ ] **Step 3: Riscrivi RampaIsolamento.astro**

Legende IT «Tensione di prova», «Fuga, isolamento sano», «Fuga, isolamento compromesso»; EN «Test voltage», «Leakage, healthy insulation», «Leakage, degraded insulation». `captionSub` IT «Curva calcolata da modello · rampa a 80 kV, carica C·dV/dt più conduzione V/R»; EN «Computed from a model · ramp to 80 kV, C·dV/dt charging plus V/R conduction». Colori: tensione `#bcd6e8`, sano `#4fd07f`, compromesso `#e05a3d` (tier-pro, già nel design system).

```ts
const tt = Array.from({ length: 241 }, (_, i) => i * (12 / 240));
const kv = tt.map((m) => [m, tensione(m, PROVA_ESEMPIO)] as [number, number]);
const sano = tt.map((m) => [m, correnteFuga(m, PROVA_ESEMPIO, 'sano')] as [number, number]);
const comp = tt.map((m) => [m, Math.min(40, correnteFuga(m, PROVA_ESEMPIO, 'compromesso'))] as [number, number]);
```

`x` lineare 0–12 min (tacche 0, 2, 4, 6, 8, 10, 12 con «min»), `y` 0–80 kV, `y2` 0–40 µA; `kv` su `y`, `sano` e `comp` su `y2`. La legenda ha tre voci: se a 640 unità non entrano in una riga con passo 200, riduci il passo a 180 in `ChartFrame` solo se le etichette non si toccano (verifica a occhio).

- [ ] **Step 4: Verifica visiva, suite, commit**

```bash
git add src/components/tech/charts/models/isolamento.ts src/components/tech/diagrams/RampaIsolamento.astro test/chart-models.test.mjs
git commit -m "feat(tech): prova di isolamento calcolata su due assi"
```

---

### Task 8: Schemi a blocchi e sagoma del trasformatore su primitive comuni

**Files:**
- Create: `src/components/tech/diagrams/SchemaFrame.astro`, `BlockChain.astro`
- Rewrite: `CatenaRcs.astro`, `CatenaA72.astro`, `CatenaContatori.astro`, `OsservabilitaControllabilita.astro`
- Modify: `PuntiMisuraTrasformatore.astro` (solo telaio e allineamenti)
- Test: `test/tech-diagrams.test.mjs` (nuovo)

**Interfaces:**
- Produces:
  - `SchemaFrame` props `{ uid: string; ariaLabel: string; didascalia: string; didascaliaSub: string }`, slot = contenuto SVG in coordinate 640×400.
  - `BlockChain` props `{ uid: string; blocchi: { t1: string; t2: string; accento?: boolean }[]; sopra?: { etichetta: string }; sotto?: { etichetta: string; evidenza?: string }; unica?: { etichetta: string } }`: disegna al massimo 4 box su una griglia fissa. Ogni box ha classe `schema-box` (il `<rect>`) e i suoi testi hanno classe `schema-box__t`.

- [ ] **Step 1: Test che fallisce**

`test/tech-diagrams.test.mjs`, stesso server statico e skip di `test/servizi-card-layout.test.mjs`. Per le 5 pagine IT e le 5 EN con schema (rcs, cci, a72, contatori, trasformatori), a 1440 e 390px:

```js
const fuori = await page.evaluate(() => {
  const errori = [];
  for (const g of document.querySelectorAll('[data-schema-box]')) {
    const r = g.querySelector('rect').getBoundingClientRect();
    for (const t of g.querySelectorAll('text')) {
      const b = t.getBoundingClientRect();
      if (b.left < r.left - 0.5 || b.right > r.right + 0.5) errori.push(t.textContent);
    }
  }
  return errori;
});
assert.deepEqual(fuori, [], `testo fuori dal box: ${fuori.join(', ')}`);
```

Oggi fallisce anche solo perché `[data-schema-box]` non esiste: aggiungi un'asserzione che ce ne sia almeno uno (`count >= 3`).

- [ ] **Step 2: SchemaFrame.astro**

Stesso fondo, trama, cornice con tacche e didascalia di `ChartFrame` (Task 3), viewBox `0 0 640 400`, `aspect-ratio: 8 / 5`, con `<slot />` al posto di assi e serie. Definisce anche i marker di freccia `${uid}-arrow-blue` (`#6ba7d2`) e `${uid}-arrow-green` (`#4fd07f`), gli stessi dei file attuali.

- [ ] **Step 3: BlockChain.astro**

Griglia: 4 box larghi 132, passo 150, primo centro a x = 95 (centri 95, 245, 395, 545: margine di 29 fra i box e di 15 dalla cornice interna a 14). Box alti 92, y = 154. Testi: `t1` 13px bold, `t2` 11px, `text-anchor="middle"`. Per stare nel box, `t1` e `t2` vanno a capo su due righe al massimo con una funzione a build:

```ts
// Una riga di testo SVG non va a capo da sola. Stima prudente della
// larghezza: 0,6 em per carattere in Inter bold. Oltre la larghezza utile del
// box il testo si spezza alla parola, al massimo su due righe.
function righe(testo: string, em: number, max: number): string[] {
  const parole = testo.split(' ');
  const out: string[] = [''];
  for (const p of parole) {
    const prova = out[out.length - 1] ? `${out[out.length - 1]} ${p}` : p;
    if (prova.length * em * 0.6 <= max || !out[out.length - 1]) out[out.length - 1] = prova;
    else out.push(p);
  }
  return out.slice(0, 2);
}
```

Ogni box è `<g data-schema-box>` con `<rect class="schema-box" rx="10">` (fill `#0f3656`, stroke `#6ba7d2` al 55%, `#4fd07f` se `accento`) e i `<text class="schema-box__t">`. Corsia `sopra` a y = 118 con freccia blu verso destra dal primo all'ultimo box, etichetta a sinistra sopra la freccia; corsia `sotto` a y = 282 con freccia verde verso sinistra, etichetta a destra sotto, e `evidenza` (es. «RICHIUSURA AUTOMATICA») scritta a sinistra in verde; corsia `unica` a y = 200 fra i box, frecce verdi fra box adiacenti. Stesse regole CSS mobile delle etichette di `ChartFrame` (`.schema-label` a 20px sotto 768px; i testi dei box a 16/13px, e la funzione `righe` riceve `max` = 132 − 16).

Nota per mobile: con testi a 16px in viewBox la stima a 0,6 em deve usare la dimensione **mobile**, la più larga, altrimenti su telefono il testo esce. Calcola `righe(t1, 16, 116)`.

- [ ] **Step 4: Riscrivi le quattro catene**

Ogni file tiene `Props`, `TESTI` (con `blocchi`, etichette, `caption`, `captionSub`, `ariaLabel`) e diventa:

```astro
<SchemaFrame uid="a72" ariaLabel={t.ariaLabel} didascalia={t.caption} didascaliaSub={t.captionSub}>
  <BlockChain uid="a72" blocchi={t.blocchi.map((b, i) => ({ ...b, accento: i === 0 }))} sopra={{ etichetta: t.stato }} sotto={{ etichetta: t.comando }} />
</SchemaFrame>
```

- `CatenaRcs`: `sopra` = STATO, `sotto` = COMANDO con `evidenza` = RICHIUSURA AUTOMATICA; accento sul blocco «Unità RCS».
- `CatenaA72`: `sopra` = STATO, `sotto` = COMANDO DI DISTACCO; accento su «Protezione di interfaccia».
- `CatenaContatori`: solo `unica` = DATO DI MISURA; accento su «Portale».
- `OsservabilitaControllabilita`: non è una catena orizzontale. Dentro `SchemaFrame` disegna due colonne di tre box (132×58) centrate a x = 190 e x = 450, righe a y = 96, 180, 264, con i titoli PF1/PF2 a y = 70 e il riferimento normativo a y = 356; ogni box è `<g data-schema-box>` e usa la stessa funzione `righe` (esportala da un file `src/components/tech/diagrams/righe.ts` e importala in entrambi). PF1 frecce blu verso l'alto, PF2 frecce verdi verso il basso, come oggi.

Didascalie: IT «Schema esemplificativo · …», EN «Sample diagram · …», come oggi (gli schemi non sono calcolati, niente «da modello»).

- [ ] **Step 5: Sagoma del trasformatore**

`PuntiMisuraTrasformatore.astro` passa a `SchemaFrame` (viewBox 640×400: sposta la sagoma di +40 in y, l'elenco laterale di +40 in y). Ogni voce dell'elenco diventa `<g data-schema-box>` con un `<rect>` trasparente (`fill="none" stroke="none"`) largo quanto la colonna dell'elenco (da x = 408 a x = 612), così il test verifica che le descrizioni non escano a destra; se escono, accorciale in `TESTI` (IT e EN).

- [ ] **Step 6: Verifica**

Run: `npm run build && node --test test/tech-diagrams.test.mjs && npm test` → PASS. Screenshot a 1440 e 390px dei cinque schemi, IT ed EN.

- [ ] **Step 7: Commit**

```bash
git add src/components/tech/diagrams test/tech-diagrams.test.mjs
git commit -m "feat(tech): schemi a blocchi su primitive comuni, testi sempre dentro i box"
```

---

### Task 9: Verifica finale sulle 18 pagine

**Files:** nessuno nuovo, salvo correzioni emerse.

- [ ] **Step 1:** `npm run build && npm test` → tutto verde; annota i numeri.
- [ ] **Step 2:** Screenshot a pagina intera, 1440 e 390px, di tutte le 18 pagine (Playwright, con `#cookie-consent` e `astro-dev-toolbar` nascosti). Guarda ciascuno: cover presente e alta come quella di `/lavori/`; fondi alternati; nessun testo orfano; FAQ su due colonne da 1024px; pre-footer uguale alla home; box della stessa famiglia.
- [ ] **Step 3:** `grep -rnP " — | – | - " src/components/tech/TechDetailPage.astro src/components/tech/diagrams src/components/tech/charts` sulle sole stringhe di copy nuove: nessuna lineetta usata come pausa.
- [ ] **Step 4:** Aggiorna `docs/superpowers/plans/2026-09-22-cutover-checklist.md` solo se una voce cita «nessuna fotografia sulle pagine tecniche» (`grep -n -i fotograf` sul file).
- [ ] **Step 5:** Commit delle eventuali correzioni: `fix(tech): <cosa>`.
