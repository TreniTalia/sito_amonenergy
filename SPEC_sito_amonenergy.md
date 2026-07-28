# SPEC COSTRUTTIVA — Sito vetrina Amon Energy S.r.l.

> Documento operativo da dare in pasto a una skill/agente di build.
> Obiettivo: sito vetrina statico, moderno (standard 2026), B2B, in italiano,
> deployabile su SiteGround come semplice cartella di file statici.
> Nessun form di contatto: CTA dirette (telefono / email).

---

## 1. Contesto e posizionamento

**Chi è il cliente.** Amon Energy S.r.l. — azienda pugliese specializzata in
impianti elettrici AT/MT/BT e energie rinnovabili. Fondata nel 2020 da Mario
Palumbo e Ludovico Lombardi (ex Energy System Services, 20+ anni di esperienza
nel settore). Opera su tutto il Centro-Sud Italia.

**Target.** B2B quasi puro: operatori eolici e fotovoltaici, O&M contractor,
società di sviluppo energetico, utility. NON privati residenziali — il sito
attuale contiene copy sul solare domestico che va **eliminato**: è fuori
posizionamento e diluisce l'autorevolezza.

**Tono di voce.** Tecnico, asciutto, concreto. Zero fuffa motivazionale.
Il visitatore tipo è un asset manager o un responsabile O&M che deve capire
in 10 secondi: "questi sanno mettere le mani su una sottostazione 150/30 kV
e arrivano in giornata". Frasi brevi, dati verificabili, terminologia di
settore usata correttamente (CEI 0-16, ARERA, MT/AT, SSE).

**Claim principale (già consolidato):** *Professionisti dell'energia*.

---

## 2. Stack tecnico

| Componente | Scelta | Motivazione |
|---|---|---|
| Framework | **Astro 5.x** | Output HTML statico puro, zero JS di default, ottimo per siti a contenuto |
| Styling | **Tailwind CSS 4** (via `@tailwindcss/vite`) | Design token centralizzati, nessun CSS morto in produzione |
| Font | **Fontsource** (self-hosted, npm) | Niente Google Fonts CDN → GDPR-safe e più veloce |
| Icone | **Lucide** (SVG inline via astro-icon o copia diretta) | Leggere, coerenti |
| Immagini | Componente `<Image />` di Astro (sharp) | AVIF/WebP automatici, lazy loading, dimensioni esplicite → zero CLS |
| Mappa | **Embed Google Maps iframe con facade** (caricato al click) oppure immagine statica linkata a Google Maps | Evita di caricare 1MB di JS di terze parti al page load |
| Analytics | Nessuno di default; predisporre slot commentato per Plausible/Umami | Cookieless → niente cookie banner |
| CI/CD | **GitHub Actions → build → deploy SFTP su SiteGround (OBBLIGATORIO)** | Motore del CMS §2.3: ogni salvataggio dal pannello va live da solo |

**Vincoli hard:**
- Output 100% statico (`output: 'static'`, default di Astro). Nessuna API, nessun SSR.
- Build deve produrre trailing-slash directories (`/azienda/index.html`), che è il default Astro — compatibile con Apache/SiteGround senza rewrite.
- Nessun form → nessun backend, nessun captcha, nessun mailer. Punto.
- Lingua: solo IT in fase 1. Struttura URL senza prefisso lingua (`/azienda/`, non `/it/azienda/`). Predisporre i18n di Astro solo se richiesto in fase 2 (il sito attuale ha EN via WPML).

### 2.1 Inizializzazione progetto

```bash
npm create astro@latest amonenergy-site -- --template minimal --typescript strict
cd amonenergy-site
npx astro add tailwind
npm install @fontsource-variable/archivo @fontsource-variable/inter
```

### 2.2 Struttura cartelle

```
src/
├── components/
│   ├── Header.astro          # nav sticky + CTA telefono
│   ├── Footer.astro          # contatti, P.IVA, trasparenza aiuti di Stato
│   ├── Hero.astro
│   ├── ServiceCard.astro
│   ├── StatBar.astro         # numeri chiave animati (contatore on-scroll)
│   ├── GalleryGrid.astro     # griglia editoriale progetti (vedi §4.4)
│   ├── GalleryItem.astro     # singola opera: foto + scheda tecnica
│   ├── Lightbox.astro        # <dialog> nativo, vanilla JS ~2KB
│   ├── ClientMarquee.astro   # loghi/nomi clienti scorrevoli
│   ├── CtaBand.astro         # fascia CTA riusabile (tel + mail)
│   ├── ContactChannels.astro # blocco tel/mail/pec grande, pagina contatti
│   └── MapFacade.astro       # placeholder mappa → iframe al click
├── layouts/
│   └── Base.astro            # <head>, SEO, schema.org, skip-link
├── pages/
│   ├── index.astro
│   ├── azienda.astro
│   ├── servizi/
│   │   ├── index.astro
│   │   ├── laboratorio-mobile.astro
│   │   ├── verifiche-strumentali.astro
│   │   ├── monitoraggio-e-controllo.astro
│   │   ├── costruzioni.astro
│   │   └── gestione-e-manutenzione.astro
│   ├── progetti.astro
│   ├── contatti.astro
│   ├── privacy-policy.astro
│   └── 404.astro
├── content/                  # CONTENUTI EDITABILI DA CMS (vedi §2.3)
│   ├── progetti/             # un .md per opera della gallery
│   ├── servizi/              # le 5 schede servizio
│   └── pagine/               # testi delle pagine fisse (home, azienda…)
├── data/
│   ├── clienti.ts            # lista clienti selezionati
│   └── contatti.ts           # UNICA fonte di verità per tel/mail/indirizzo
└── styles/
    └── global.css            # @theme Tailwind 4 con i token sotto
public/
└── admin/                    # Sveltia CMS: index.html + config.yml (§2.3)
```

**Regola:** tutti i dati di contatto vivono SOLO in `src/data/contatti.ts` e
vengono importati ovunque. Mai hardcodare telefono/indirizzo nei template.

### 2.3 Gestione contenuti — admin panel ed editing mode (VINCOLANTE)

**Requisito:** un non-tecnico deve poter aggiungere progetti/foto alla
gallery e modificare i testi delle pagine da un pannello web stile
WordPress, senza toccare codice né git.

**Architettura: CMS git-based.** Niente database, niente backend PHP: il
pannello scrive file Markdown/immagini nel repository GitHub; ogni
salvataggio committa; una GitHub Action builda e deploya via SFTP su
SiteGround. Il contenuto va in produzione in ~2–3 minuti dal click su
"Salva". Il sito resta statico al 100%.

```
Editor apre /admin → login GitHub → modifica testo o carica foto
      → commit automatico su main → GitHub Action: build Astro
      → deploy SFTP su public_html → live
```

#### Contenuti come Content Collections

Tutto ciò che dev'essere editabile esce dai `.ts` e diventa **Astro Content
Collections** (Markdown + frontmatter YAML, o YAML puro), con schema Zod:

```
src/content/
├── progetti/            # UN FILE PER OPERA della gallery
│   ├── troia.md         #   frontmatter: titolo, kv, committente,
│   ├── banzi.md         #   provincia, tipologia, immagine, full, ordine
│   └── ...              #   body markdown = descrizione
├── servizi/             # le 5 schede servizio (titolo, excerpt, body, icona)
└── pagine/              # testi editabili delle pagine fisse:
    ├── home.yaml        #   hero (eyebrow/h1/sub), chi-siamo-breve,
    ├── azienda.yaml     #   perché-sceglierci, statbar (valori+label)…
    └── contatti.yaml    #   titoli, sottotitoli, orari
```

`contatti.ts` (dati fiscali/telefono) resta in codice: cambia una volta ogni
mai e sbagliarlo rompe tel:/schema.org — non va esposto all'editing casuale.
La StatBar invece diventa editabile: il cliente sostituirà i dati finti da solo.

#### Il pannello: Sveltia CMS su `/admin`

- **Sveltia CMS** (successore moderno di Decap/Netlify CMS): un singolo file
  statico in `public/admin/index.html` + `config.yml`. UI pulita, in
  italiano, mobile-friendly, gestione media integrata.
- Backend GitHub: login OAuth tramite **sveltia-cms-auth** deployato come
  Cloudflare Worker (free tier, 10 minuti di setup, istruzioni nel repo del
  progetto sveltia-cms-auth). Nessun server da mantenere.
- `config.yml` definisce le collection specchiando gli schemi Zod:
  - **Progetti** → cartella `src/content/progetti`, widget: string (titolo),
    select (kV da lista), string (committente), select (provincia), image
    (upload → `src/assets/img/progetti/`), boolean (full-bleed), number
    (ordine), markdown (descrizione). Anteprima card nel pannello.
  - **Servizi** e **Pagine** → i campi corrispondenti, con `i18n: false`,
    label e hint in italiano ("Questa è la frase grande nella prima
    schermata della home").
- Upload immagini: il widget image salva nel repo; al build Astro le
  processa (AVIF/WebP responsive) come tutte le altre — l'editor non deve
  sapere nulla di formati.
- Editorial workflow OFF (commit diretto su main): per due editor interni il
  flusso bozze/review è complessità inutile.

**Alternativa zero-infrastruttura:** *PagesCMS* (pagescms.org) — pannello
hosted gratuito che si collega al repo GitHub, stesso principio, nessun
Worker da deployare, config in `.pages.yml`. Scegliere questa se non si
vuole toccare Cloudflare. La struttura content resta identica: i due CMS
sono intercambiabili perché il contenuto è solo Markdown nel repo.

#### "Editing mode" — cambiare i testi al volo

- Ogni campo testuale delle pagine è nel pannello sotto la collection
  **Pagine**, con **anteprima live side-by-side** (pane di preview di
  Sveltia): l'editor vede il testo aggiornarsi mentre scrive.
- Per l'editing veramente inline (click sul testo direttamente sulla pagina
  pubblicata e lo modifichi lì, stile page-builder) servirebbe TinaCMS +
  Tina Cloud: più infrastruttura e vendor lock-in per un beneficio marginale
  su un sito vetrina. **Non previsto in fase 1** — rivalutare solo se gli
  editor lo chiedono dopo un mese d'uso reale.
- Scorciatoia da prevedere: link "Modifica questa pagina" nel footer,
  visibile solo con `?edit` nell'URL, che porta alla voce giusta di /admin.

#### Conseguenze sul resto della spec

- Il deploy CI/CD di §9.2 **non è più opzionale**: è il motore del CMS.
  Setup GitHub Actions obbligatorio in fase 1.
- La gallery §4.4 legge da `getCollection('progetti')` ordinata per campo
  `ordine`; il flag `full` non è più posizionale (ogni 3ª) ma per-opera,
  così l'editor controlla il ritmo visivo scegliendo quali foto meritano il
  full-bleed.
- Cache SiteGround: la Action, dopo l'upload SFTP, deve svuotare la cache
  statica (SiteGround espone il purge via SG Optimizer/API; in mancanza,
  documentare il purge manuale da Site Tools in 1 click).

```ts
// src/data/contatti.ts
export const contatti = {
  ragioneSociale: "Amon Energy S.r.l.",
  indirizzo: "Via Roma 105, 71025 Castelluccio dei Sauri (FG)",
  telefono: "+39 0881 377590",
  telefonoHref: "tel:+390881377590",
  email: "info@amonenergy.it",
  pec: "amonenergy@pec.it",
  piva: "03042590640",
  codiceFE: "KRRH6B9",
  linkedin: "https://www.linkedin.com/company/amonenergy",
  mapsUrl: "https://maps.google.com/?q=Amon+Energy+Srl+Castelluccio+dei+Sauri",
} as const;
```

---

## 3. Design system

### 3.1 Direzione estetica

Il brand esiste già ed è buono: blu navy profondo + bianco + foglia verde nel
logo. La brochure 2024 (sfondo #0F3A5F circa, onde vettoriali sottili) è il
riferimento visivo, NON il sito WordPress attuale.

Stile 2026: **"industrial precision"** — molto spazio bianco, tipografia
grande e sicura, sezioni scure alternate a sezioni chiare, niente gradienti
sgargianti, niente glassmorphism. Il sito deve sembrare la brochure di
un'azienda di ingegneria, non una startup SaaS.

**Elemento firma (signature):** la *linea d'onda* sottile già presente nella
brochure (fascio di curve tipo forma d'onda elettrica) usata come divisore di
sezione in SVG, animata con un leggerissimo drift orizzontale (disattivato con
`prefers-reduced-motion`). È l'unico elemento decorativo ammesso: encode il
soggetto (segnale elettrico) e dà continuità col materiale cartaceo.

### 3.2 Token colore (Tailwind 4 `@theme`)

```css
@theme {
  --color-navy-950: #0A2A44;   /* sfondi scuri profondi, footer */
  --color-navy-900: #103B5F;   /* colore brand principale (dal sito/brochure) */
  --color-navy-700: #1D5585;   /* hover, elementi interattivi su chiaro */
  --color-navy-100: #E8EFF5;   /* sfondi sezione chiari alternati */
  --color-leaf-500: #3E8E5A;   /* verde foglia del logo — SOLO accenti piccoli */
  --color-signal-400: #4FB3D9; /* azzurro "segnale" — dettagli tecnici, linee */
  --color-paper: #FAFBFC;      /* sfondo base pagina */
  --color-ink: #16222E;        /* testo su chiaro */
}
```

Regole d'uso: il verde `leaf-500` compare solo in micro-accenti (icona, tag,
bullet) — mai come sfondo di sezione. CTA primarie: navy-900 su chiaro,
bianco/signal su scuro. Contrasto minimo WCAG AA su tutto.

### 3.3 Tipografia

- **Display / headings:** `Archivo Variable` (Expanded per H1/H2) — geometrico,
  tecnico, ottima resa in maiuscolo per gli eyebrow. Weights 600–800.
- **Body:** `Inter Variable`, 400/500, `line-height: 1.65`, max-width testo
  `65ch`.
- Scala: H1 `clamp(2.4rem, 5vw, 4rem)`; H2 `clamp(1.8rem, 3.5vw, 2.6rem)`;
  eyebrow 0.8rem uppercase tracking-widest color signal-400/leaf-500.

### 3.4 Componenti ricorrenti

- **Eyebrow + titolo + testo**: ogni sezione apre così (pattern brochure:
  "— CERCA GUASTI").
- **Trattino corto** prima dell'eyebrow (come in brochure): `w-8 h-0.5` navy/signal.
- **Card servizi**: bordo 1px navy-100, hover con bordo navy-700 e leggera
  traslazione; icona Lucide 28px color leaf-500; NO ombre pesanti.
- **Bottoni**: radius 6px (non pill), padding generoso, label esplicite
  ("Chiamaci ora", "Scrivici via email") — mai "Invia" o "Submit".

### 3.5 Responsive & mobile-first (VINCOLANTE)

Il sito si progetta e si scrive **mobile-first**: ogni componente nasce per
viewport 360px e si arricchisce verso l'alto con i breakpoint Tailwind. Mai
il contrario (niente `max-width` media query, niente "poi lo sistemiamo su
mobile").

**Breakpoint di riferimento:**

| Token | Larghezza | Layout |
|---|---|---|
| base | 360–639px | 1 colonna, stack verticale, sticky bar Chiama/Email |
| `sm` | ≥640px | 2 colonne per card/griglie semplici |
| `md` | ≥768px | header con nav estesa (sotto: hamburger), 2 col contatti |
| `lg` | ≥1024px | griglie a 3+ colonne, layout editoriale gallery completo |
| `xl` | ≥1280px | container max `1200px`, respiro pieno |

**Regole per componente:**
- **Header**: sotto `md` → hamburger con pannello full-screen navy (nav a
  tutta altezza, voci grandi, contatti in fondo); il bottone `tel:` resta
  SEMPRE visibile nella barra, anche su mobile (icona sola sotto 400px).
- **Sticky bar mobile** (solo < `md`): due bottoni 50/50 "Chiama" / "Email",
  altezza 56px, `env(safe-area-inset-bottom)` per iPhone.
- **Hero**: su mobile ~70vh (non 85), H1 con `clamp()` già previsto, CTA
  impilate full-width.
- **Griglie servizi/progetti**: 1 col → `sm:2` → `lg:3`; gap che scala
  (`gap-4 md:gap-6 lg:gap-8`).
- **StatBar**: 2×2 su mobile, 4 in riga da `md`.
- **Tabelle/schede tecniche**: mai overflow orizzontale; sotto `sm`
  diventano definition list impilate.
- **Tipografia**: tutte le size fluide con `clamp()`; line-length del body
  sempre ≤ `65ch` a ogni breakpoint.
- **Immagini**: `<Image />` con `widths={[400, 800, 1200, 1600]}` e `sizes`
  corretto per ogni contesto — su mobile non deve mai scaricare il file da
  desktop.
- **Touch**: target ≥ 44×44px, hover mai portatore unico di informazione
  (tutto ciò che appare on-hover è visibile di default su touch — critico
  per le caption della gallery, vedi §4.4).
- **Test obbligatori**: 360px (Android piccolo), 390px (iPhone), 768px,
  1024px, 1440px + rotazione landscape su mobile.

---

## 4. Sitemap e contenuti pagina per pagina

> I testi sotto sono pronti all'uso, riscritti dai documenti ufficiali
> (profilo aziendale + brochure) con tono aggiornato. La skill può rifinirli
> ma NON deve inventare dati, numeri, certificazioni o clienti non elencati.

### 4.0 Header (globale)

- Logo a sinistra (`[PLACEHOLDER: logo_amon_official.svg — recuperare vettoriale dal cliente]`).
- Nav: Azienda · Servizi (dropdown con le 5 sottopagine) · Progetti · Contatti.
- CTA fissa a destra: bottone `tel:` con icona telefono → **0881 377590**.
  Su mobile: barra sticky bottom con due bottoni affiancati "Chiama" / "Email".
- Header trasparente su hero scuro, diventa solido navy-950 on-scroll.

### 4.1 Home `/`

**Hero (dark, full-viewport ~85vh):**
- Eyebrow: `PROFESSIONISTI DELL'ENERGIA`
- H1: **"Costruiamo, verifichiamo e gestiamo l'energia del Centro-Sud Italia."**
- Sub: "Sottostazioni AT/MT, verifiche strumentali, ricerca guasti e
  monitoraggio 24/7 per impianti eolici e fotovoltaici."
- CTA primaria: "Chiamaci: 0881 377590" (`tel:`) · CTA secondaria: "Scopri i servizi".
- Sfondo: `[PLACEHOLDER: hero-sottostazione.jpg — foto sottostazione al tramonto, dalla brochure p.8]` con overlay navy-950/70.
- Onda-segnale SVG animata in basso come raccordo con la sezione successiva.

**Sezione "Chi siamo in breve"** (chiaro): testo dalla brochure —
"Siamo il team che ti affianca in ogni fase della progettazione, realizzazione
e gestione di impianti di energia. Professionisti di esperienza, specialisti
del rinnovabile, pronti a intervenire in ogni momento perché non manchi mai
energia." + link "Conosci l'azienda →".

**Sezione servizi** (griglia 5 card, da `getCollection('servizi')`):
1. **Laboratorio mobile ricerca guasti** — "Unità Centrix 2.0 attrezzata per localizzare e riparare guasti su cavi MT. Reperibilità 24h, 365 giorni l'anno."
2. **Verifiche strumentali** — "Protezioni AT/MT (CEI 0-16/0-21), interruttori, trasformatori, termografia, SFRA, scariche parziali."
3. **Monitoraggio e controllo** — "Control room 24/7, sistemi RCS per cabine MT, CCI conforme CEI 0-16 V5 e Delibera ARERA 564/2025."
4. **Costruzioni** — "Stazioni elettriche AT/MT chiavi in mano per parchi eolici e fotovoltaici."
5. **Gestione e manutenzione** — "O&M completo di impianti, cabine MT e SSE, con manutenzione predittiva."

**Fascia numeri (StatBar, dark):** 4 metriche, contatore animato on-scroll
(disattivato con `prefers-reduced-motion`), 2×2 su mobile. Usare questi
**dati segnaposto realistici** — sono FINTI e vanno sostituiti dal cliente
prima del go-live (marcarli con commento `<!-- DATO-FINTO -->` nel codice):
- **120+** impianti gestiti
- **850 MW** di potenza monitorata
- **300+** interventi l'anno
- **20+** anni di esperienza del team (questo è l'unico verificato, dal profilo aziendale)

**Sezione "Perché Amon Energy"** (3 punti, sostituisce i "4 motivi" attuali
che parlano di solare residenziale):
- **Rapidità** — "Sede operativa a Castelluccio dei Sauri (FG), baricentrica: raggiungiamo la maggior parte degli impianti del Centro-Sud in poche ore."
- **Affidabilità** — "Specialisti qualificati con esperienza ventennale su impianti AT/MT e rinnovabili."
- **Tecnologia** — "Strumentazione all'avanguardia: laboratorio mobile Centrix 2.0, OTDR, prova relè DRTS/64, termocamere, Megger HV 80kV."

**Client marquee:** nomi clienti in scorrimento (testo, non loghi, salvo
`[PLACEHOLDER: loghi clienti se autorizzati]`). Selezione credibile:
E-Distribuzione, EDPR, Tozzi Sud, STE Energy, Fortore Energia, Poligrafico e
Zecca dello Stato, CROSSENERGY, Eco Puglia Energia. Titolo: "Si affidano a noi".

**CtaBand finale** (vedi §5).

### 4.2 Azienda `/azienda/`

- Storia: fondata nel 2020 da Mario Palumbo e Ludovico Lombardi, già titolari
  di Energy System Services, 20+ anni nel settore degli impianti elettrici
  civili, industriali e AT/MT. Oggi punto di riferimento per il rinnovabile
  nel Centro-Sud.
- Missione (dalla brochure, "Chi siamo").
- Blocco geolocalizzazione: mappa Italia con raggio d'azione da Castelluccio
  dei Sauri `[PLACEHOLDER: mappa-raggio-azione.svg — ridisegnare in SVG la
  mappa della brochure p.5]` + testo sulla tempestività d'intervento.
- Strumentazione: griglia compatta della dotazione principale (Centrix 2.0,
  Megger HV Test 80kV, DRTS/64, ISA CBA 1000, OTDR 8000MAX-Q1, termocamere…).
  Formato tag/chip, non elenco puntato chilometrico.
- Foto team/mezzi: `[PLACEHOLDER: foto-team.jpg]`, `[PLACEHOLDER: furgone-centrix.jpg — dalla brochure p.4]`.

### 4.3 Hub servizi `/servizi/` + 5 sottopagine

Hub: le stesse 5 card della home, versione estesa.

Ogni sottopagina segue lo **stesso template**: hero compatto scuro (eyebrow +
H1 + una frase), corpo a sezioni, CtaBand finale. Contenuti:

**`/servizi/laboratorio-mobile/`** — Centrix 2.0: laboratorio mobile per
individuazione e riparazione guasti su reti MT. Servizio 24h/365gg. Prove di
tensione applicata su cavi MT, ricerca guasto rapida. Tecnici specializzati.
`[PLACEHOLDER: furgone aperto con strumentazione, brochure p.4]`

**`/servizi/verifiche-strumentali/`** — le 5 verifiche della brochure p.6,
ognuna con titoletto + 2 righe: Verifica protezioni AT/MT (CEI 0-16/0-21) ·
Analisi termografiche (anche con drone: `[PLACEHOLDER: foto drone]`) ·
Verifiche interruttori (tempi di intervento, resistenze di contatto) ·
Verifiche trasformatori di potenza/misura (iniezione primaria) · Manutenzioni
predittive. Aggiungere: misure scariche parziali e SFRA (presenti sul sito
attuale).

**`/servizi/monitoraggio-e-controllo/`** — Control room 24/7 con personale
specializzato; analisi dati su eventi ricorsivi per massimizzare la
disponibilità; sistema RCS proprietario per supervisione cabine MT (comando
interruttori incluso); CCI – Controllore Centrale d'Impianto conforme a
**CEI 0-16 V5** e **Delibera ARERA 564/2025/R/eel**; lettura contatori;
teledistacco A72. `[PLACEHOLDER: foto control room, brochure p.7]`

**`/servizi/costruzioni/`** — Progettazione, installazione e manutenzione di
cabine MT/BT, sottostazioni AT/MT, linee di trasmissione e distribuzione.
Collaudo certificato delle apparecchiature. Posa fibra ottica (giunzioni,
terminazioni, certificazione OTDR). Quadri elettrici certificati e automazione
industriale. Rimando a /progetti per le realizzazioni.

**`/servizi/gestione-e-manutenzione/`** — O&M impianti eolici e FV in
costruzione e in esercizio; gestione cabine MT e SSE; termografia IR come
manutenzione predittiva con report dettagliato; analisi reti elettriche
(armoniche, energia reattiva, buchi di tensione, microinterruzioni) per
ottimizzare il contratto di fornitura; assistenza per pratiche e accesso a
finanziamenti per il fotovoltaico.

### 4.4 Progetti — Gallery `/progetti/`

Questa è la pagina-vetrina dei lavori costruiti e va trattata come il pezzo
di design più curato del sito. **Concept: "archivio d'opera"** — le
sottostazioni fotografate come architettura industriale, presentate con il
rigore di una monografia di ingegneria, non come una gallery di template.

**Vietato esplicitamente:** masonry alla Pinterest, griglie uniformi di
thumbnail quadrate, carousel automatici, overlay neri 50% con titolo
centrato, effetti flip/tilt. Sono i quattro cliché da evitare.

#### Layout — griglia editoriale asimmetrica

- Griglia CSS a **12 colonne** con ritmo alternato che si ripete ogni 3 opere:
  1. opera A: foto orizzontale grande, colonne 1–8, ratio 16:10;
     scheda testo colonne 9–12, allineata al bordo inferiore della foto;
  2. opera B: scheda testo colonne 1–4, foto colonne 5–12 (specchiata);
  3. opera C: foto **full-bleed** a tutta larghezza viewport, ratio 21:9,
     scheda in overlay basso-sinistra su pannello navy-950/85 con blur leggero.
  Il pattern riparte da capo → la pagina respira come un impaginato
  editoriale, e con 6 progetti si ottengono due "giri" completi.
- Su mobile (base → `md`): tutto degrada a colonna singola — foto full-width,
  scheda subito sotto, MAI in overlay (leggibilità prima di tutto). Il ritmo
  asimmetrico è un enhancement da `lg` in su.
- Tra le opere: spazio generoso (`py-24 lg:py-36`) e la linea-onda firma come
  divisore ogni 3 opere.

#### La scheda d'opera (GalleryItem)

Ogni opera ha una scheda tecnica composta, nell'ordine:
- **Indice progressivo** in cifre tabulari piccole (`01`, `02`…) color
  signal-400 — qui la numerazione è legittima: è un archivio ordinato
  cronologicamente.
- **Tag kV** in chip monospace/tabulare: `150/30 kV` — il dato più
  identitario del lavoro, trattato come elemento grafico.
- **Titolo** (H3, Archivo 600): località — es. "Stazione elettrica Troia".
- **Descrizione** 2–3 righe: cosa è stato costruito e per cosa
  ("Stazione di trasformazione 150/30 kV a servizio di un parco eolico in
  agro del Comune di Troia").
- **Metadati** in riga, separati da punto mediano: Committente · Provincia ·
  Tipologia (es. "Eco Puglia Energia · FG · Sottostazione AT/MT").

#### Micro-interazioni (sobrie, desktop only)

- Foto con **slow zoom** al hover: `scale(1.00 → 1.04)`, 1.2s
  `cubic-bezier(0.22, 1, 0.36, 1)`, dentro un wrapper `overflow-hidden`.
- Reveal on-scroll: foto entra con `opacity` + `translateY(24px)`, via
  `IntersectionObserver`, `once: true`, durata 0.7s, stagger 80ms tra foto e
  scheda. Con `prefers-reduced-motion`: tutto visibile subito, zero motion.
- Nessuna informazione è nascosta dietro il hover: le schede sono sempre
  visibili (vincolo touch di §3.5).

#### Lightbox

Al click/tap la foto apre un **`<dialog>` nativo** (accessibile gratis:
focus trap, `Esc`, backdrop):
- Immagine a piena qualità (max 1920px) su fondo navy-950/95, scheda d'opera
  ridotta in basso, contatore `03 / 06`.
- Navigazione: frecce ← → da tastiera, bottoni prev/next 44px, swipe su
  touch (pointer events, niente librerie).
- Chiusura: `Esc`, click sul backdrop, bottone ✕ in alto a destra.
- Implementazione vanilla ≤ 2KB, progressive enhancement: senza JS il click
  apre l'immagine come file (fallback `<a href>`).
- Preload dell'immagine adiacente al cambio slide.

#### Dati (content collection `progetti`, vedi §2.3)

Un file `.md` per opera in `src/content/progetti/`, editabile dal pannello
/admin. Schema Zod della collection (frontmatter):

```md
---
titolo: "Stazione elettrica Troia"
kv: "150/30 kV"
committente: "Eco Puglia Energia"
provincia: "FG"
tipologia: "Sottostazione AT/MT"
immagine: "../../assets/img/progetti/troia.jpg"   # image() nello schema Zod
full: false        # true → variante full-bleed 21:9
ordine: 1          # ordinamento in gallery
---
Stazione di trasformazione 150/30 kV a servizio di un parco eolico
in agro del Comune di Troia.
```

La pagina legge `getCollection('progetti')` ordinata per `ordine`. Il flag
`full` è per-opera (non posizionale): l'editor decide dal pannello quali
foto meritano il full-bleed. La griglia asimmetrica di cui sopra si adatta a
qualsiasi numero di opere ≥ 2 — quando il capo carica il progetto n. 7 dal
pannello, il layout continua il ritmo senza toccare codice.

Contenuti iniziali (brochure p.8-9 + profilo p.5):
1. **Stazione elettrica Troia** — 150/30 kV — parco eolico, agro del Comune di Troia (FG). `[PLACEHOLDER: foto brochure p.8 dx]`
2. **Stazione elettrica Banzi–Montemilone** — 150/20 kV — parco eolico tra Banzi e Montemilone (PZ). `[PLACEHOLDER: foto brochure p.8 sx]`
3. **Stazione elettrica Deliceto** — 150/30 kV — parco eolico, Deliceto (FG). `[PLACEHOLDER: foto brochure p.9]` → full-bleed
4. **Sottostazione EPE Troia** — committente Eco Puglia Energia. `[PLACEHOLDER: foto da richiedere]`
5. **Sottostazione Aquilonia** — committente EDPR. `[PLACEHOLDER: foto da richiedere]`
6. **Sottostazione Castelluccio** — committente STE Energy. `[PLACEHOLDER: foto da richiedere]` → full-bleed

**Requisiti foto:** orizzontali, min 1600px lato lungo, luce naturale
(le foto al tramonto della brochure sono perfette come tono). Ogni foto con
alt text descrittivo ("Trasformatore di potenza della stazione 150/30 kV di
Troia al tramonto").

**Anteprima in home:** sotto la sezione servizi, striscia orizzontale con le
3 opere migliori (scroll-snap su mobile) + link "Tutti i progetti →".

Chiusura pagina: fascia "Vuoi vedere cosa possiamo costruire per te?" + CtaBand.

### 4.5 Contatti `/contatti/` — **NIENTE FORM**

Layout a due colonne (stack su mobile):

**Colonna sinistra — ContactChannels:**
- H1: "Parliamo del tuo impianto."
- Sub: "Rispondiamo direttamente, senza moduli da compilare. Una telefonata o
  una mail e sei in contatto con un tecnico."
- Due bottoni GRANDI impilati:
  - 📞 **Chiamaci — 0881 377590** (`tel:+390881377590`) — sotto, in piccolo: "Lun–Ven 8:30–18:00 · Reperibilità guasti 24/7"
  - ✉️ **Scrivici — info@amonenergy.it** (`mailto:info@amonenergy.it?subject=Richiesta%20informazioni`)
- Riga secondaria: PEC amonenergy@pec.it · LinkedIn.
- Dati fiscali in piccolo: P.IVA 03042590640 · Codice FE KRRH6B9.

**Colonna destra — MapFacade:**
- Indirizzo ben visibile: **Via Roma 105, 71025 Castelluccio dei Sauri (FG)**.
- Facade mappa: immagine statica `[PLACEHOLDER: map-static.jpg oppure screenshot maps]`
  con bottone overlay "Apri la mappa" → al click inietta l'iframe Google Maps
  (embed già esistente sul sito attuale, punta a "Amon Energy Srl - Sede
  Operativa") oppure link diretto a Google Maps / "Ottieni indicazioni".

**Nota vincolante:** nessun form, nessun campo input in tutto il sito. Se in
futuro servisse lead capture, si valuterà `mailto` arricchito o Cal.com — non
un form generico.

### 4.6 Footer (globale)

- 3 colonne: (1) logo bianco + claim + LinkedIn; (2) nav servizi; (3) contatti
  completi (indirizzo, tel, mail, pec, P.IVA, Codice FE).
- **Blocco obbligatorio trasparenza** (obbligo di legge, già sul sito attuale —
  riportarlo identico): dicitura L. 124/2017 e DL 34/2019 su aiuti di Stato,
  link a rna.gov.it con CF 03042590640, link PDF "Rendicontazione contributi
  pubblici" `[PLACEHOLDER: recuperare il PDF dal sito attuale e includerlo in /public/docs/]`.
- Riga finale: © anno corrente (dinamico in build) · Privacy Policy · P.IVA.

### 4.7 Privacy Policy e 404

- `/privacy-policy/`: senza form né analytics con cookie, l'informativa è
  minima (dati di contatto trattati solo se l'utente scrive/chiama).
  `[PLACEHOLDER-LEGALE: testo da far validare — non copiarlo dal sito attuale
  perché riferito al form che stiamo eliminando]`.
- `/404.astro`: pagina brandizzata con link a home e contatti.

---

## 5. Pattern marketing (linee guida 2026)

1. **CTA dirette, zero attrito.** Ogni pagina termina con `CtaBand`: sfondo
   navy, titolo breve ("Un guasto non aspetta. Nemmeno noi."/"Parliamo del tuo
   impianto"), bottone `tel:` + bottone `mailto:`. Il telefono è la conversione
   primaria per questo target (emergenze guasti) → va reso cliccabile ovunque,
   ripetuto nell'header e nella sticky bar mobile.
2. **Prova sociale concreta, non aggettivi.** Nomi clienti reali e progetti
   con kV e località battono qualsiasi "leader di settore". Mai superlativi
   non dimostrabili.
3. **Un'idea per sezione.** Niente muri di testo: ogni sezione = un messaggio,
   max 3-4 righe + eventuale lista corta.
4. **Specificità tecnica come trust signal.** Citare norme (CEI 0-16 V5,
   ARERA 564/2025) e strumentazione reale: per il target B2B è il vero
   "badge di fiducia".
5. **Velocità come feature di marketing.** Un sito che apre in <1s comunica
   la stessa rapidità promessa nel pronto intervento.
6. **Niente dark pattern, niente popup, niente cookie banner** (reso possibile
   dall'assenza di tracker con cookie).

---

## 6. SEO tecnico

- Componente `Base.astro` con: `<title>` pattern `{pagina} | Amon Energy`,
  meta description unica per pagina (≤155 caratteri, scritta per il CTR),
  canonical, Open Graph + Twitter card con `[PLACEHOLDER: og-image.jpg 1200×630 — foto sottostazione con logo]`.
- **JSON-LD** in ogni pagina:
  - Sito intero: `Organization` + `LocalBusiness` (tipo `Electrician`/
    `ProfessionalService`) con indirizzo Via Roma 105, Castelluccio dei Sauri,
    telefono, geo, `areaServed: Centro-Sud Italia`, `sameAs` LinkedIn.
  - Sottopagine servizi: `Service` con `provider` → Organization.
  - `BreadcrumbList` sulle pagine interne.
- `sitemap.xml` via `@astrojs/sitemap` + `robots.txt` in `/public`.
- **Redirect 301** dai vecchi URL WordPress ai nuovi (in `.htaccess`, vedi §8):
  mappare almeno `/laboratorio-mobile/`→`/servizi/laboratorio-mobile/`,
  `/verifiche-strumentali/*`→`/servizi/verifiche-strumentali/`,
  `/monitoraggio-controllo/*`→`/servizi/monitoraggio-e-controllo/`,
  `/gestione-e-manutenzione/`→`/servizi/gestione-e-manutenzione/`,
  `/repowering-e-revamping-eolico/`→`/servizi/costruzioni/`,
  `/i-nostri-clienti/`→`/azienda/`, `/consulenza/`→`/contatti/`,
  `/centrix/`→`/servizi/laboratorio-mobile/`.
- Heading hierarchy pulita (un solo H1 per pagina), alt text descrittivi in
  italiano su tutte le immagini.

---

## 7. Immagini e asset

Convenzione: `/src/assets/img/{sezione}-{descrizione}.{ext}`, processate da
`<Image />`. Tutti i placeholder nel documento sono marcati
`[PLACEHOLDER: …]` — in build usare un'immagine grigia navy con label finché
il cliente non fornisce gli originali. **Fonti prioritarie:** foto reali della
brochure (sottostazioni, furgone Centrix, control room) > stock. Evitare
stock generiche di "uomini col caschetto che sorridono".

Asset da richiedere al cliente:
1. Logo vettoriale (versione blu e versione bianca) + favicon.
2. Foto originali ad alta risoluzione delle 3 SSE (Troia, Banzi, Deliceto).
3. Foto furgone Centrix e control room.
4. Valori reali per la StatBar (§4.1).
5. PDF rendicontazione contributi pubblici (dal sito attuale).

---

## 8. Performance, accessibilità, qualità

**Budget prestazioni (mobile, Lighthouse):** Performance ≥ 95 · LCP < 1.8s ·
CLS < 0.05 · peso home < 500KB al primo load · JS spedito < 35KB totali
(solo vanilla: toggle nav mobile, contatori StatBar, MapFacade, reveal
on-scroll e lightbox della gallery — niente framework client, niente librerie
di slider/lightbox esterne).

**Accessibilità:** WCAG 2.2 AA. Skip-link, focus visibile custom (outline
signal-400), contrasto verificato sui navy, `prefers-reduced-motion` rispettato
(disattiva onda animata e contatori), nav mobile con `aria-expanded`, target
touch ≥ 44px (critico per i bottoni tel/mail).

**QA pre-deploy:** test su viewport 360px/768px/1440px; verifica che tutti i
`tel:`/`mailto:` funzionino da mobile; `npx astro check`; validazione JSON-LD
con Rich Results Test; controllo 301 dopo il deploy.

---

## 9. Build e deploy su SiteGround

> **⚠️ SEZIONE SUPERATA — non seguire.** Il progetto non viene più deployato su
> SiteGround: è containerizzato e gira come stack Docker su Portainer, dietro il
> reverse proxy dell'host. Di conseguenza non esistono più né il deploy SFTP, né
> `public/.htaccess`, né la purge cache di Site Tools; i redirect 301 e le regole
> di cache vivono in `docker/nginx.conf`, e l'autenticazione del pannello usa il
> servizio `cms-auth` dello stack al posto del Cloudflare Worker previsto in
> §2.3. Il riferimento aggiornato è il **README.md**, sezione *Deploy*, più
> `docs/CMS-SETUP.md`. Questa sezione resta come documento storico della fase 1.

### 9.1 Procedura manuale (fase 1)

```bash
npm run build          # genera dist/
```

1. Accedere a SiteGround → Site Tools → **File Manager** (o SFTP: credenziali
   in Site Tools → Devs → FTP Accounts).
2. **Backup**: rinominare l'attuale `public_html` in `public_html_wp_backup`
   (il vecchio WordPress resta recuperabile) e ricreare `public_html` vuota.
   In alternativa: svuotare `public_html` dopo backup zip.
3. Caricare **il contenuto** di `dist/` (non la cartella) in `public_html/`.
4. Creare `public_html/.htaccess`:

```apache
# --- Redirect 301 dai vecchi URL WordPress ---
Redirect 301 /laboratorio-mobile/ /servizi/laboratorio-mobile/
Redirect 301 /centrix/ /servizi/laboratorio-mobile/
Redirect 301 /verifiche-strumentali/ /servizi/verifiche-strumentali/
Redirect 301 /monitoraggio-controllo/ /servizi/monitoraggio-e-controllo/
Redirect 301 /gestione-e-manutenzione/ /servizi/gestione-e-manutenzione/
Redirect 301 /repowering-e-revamping-eolico/ /servizi/costruzioni/
Redirect 301 /i-nostri-clienti/ /azienda/
Redirect 301 /lavora-con-noi/ /azienda/
Redirect 301 /consulenza/ /contatti/

# --- 404 custom ---
ErrorDocument 404 /404.html

# --- Cache asset con hash nel nome (Astro li fingerprinta) ---
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/avif "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

5. In Site Tools: attivare **SSL Let's Encrypt** + HTTPS Enforce; attivare la
   cache statica di SiteGround; **disattivare/rimuovere** eventuali servizi
   WordPress residui (WP Toolkit) per il dominio.
6. Verificare home, tutte le pagine, i redirect e i link tel/mailto.

### 9.2 CI/CD automatico (OBBLIGATORIO — motore del CMS §2.3)

GitHub Actions su push a `main` (sia push manuali che commit generati dal
pannello /admin): `npm ci && npm run build` → deploy con
`SamKirkland/FTP-Deploy-Action` via **SFTP** verso `public_html/`, credenziali
in GitHub Secrets (`SFTP_HOST`, `SFTP_USER`, `SFTP_PASS`, porta 22 o quella
indicata da SiteGround). `.htaccess` versionato in `/public/.htaccess` così
Astro lo copia in `dist/` (un'unica fonte di verità nel repo).

Dopo l'upload: step di **purge della cache statica SiteGround** (via API/SG
CLI se disponibile sul piano; in mancanza, documentare in README il purge
manuale da Site Tools → Speed → Caching, 1 click). Senza purge l'editor non
vede la modifica e penserà che il pannello sia rotto.

Repo privato consigliato; l'editor accede solo via /admin con il proprio
account GitHub (aggiunto come collaborator) — non deve mai vedere il codice.

---

## 10. Ordine di esecuzione per la skill

1. Scaffold Astro + Tailwind, `global.css` con i token §3.2, font Fontsource.
2. Content Collections (§2.3): schemi Zod di `progetti`, `servizi`,
   `pagine` + file di contenuto iniziali coi testi di §4; `data/contatti.ts`
   e `data/clienti.ts` in codice.
3. `Base.astro` (SEO, JSON-LD, skip-link) → `Header` → `Footer`.
4. Componenti condivisi: `CtaBand`, `ServiceCard`, `Hero`, onda-segnale SVG.
5. Home completa → verifica visiva ai 5 viewport di §3.5 → poi Azienda, hub
   Servizi, 5 sottopagine, Contatti, Privacy, 404.
6. **Gallery Progetti** (§4.4) come step dedicato: prima la griglia
   editoriale statica, poi reveal on-scroll, poi Lightbox — verificando a
   ogni passo mobile e `prefers-reduced-motion`.
7. **Admin panel**: `public/admin/` con Sveltia CMS + `config.yml` allineato
   agli schemi Zod; deploy del Worker sveltia-cms-auth; test end-to-end:
   modifica dal pannello → commit → build → live.
8. `@astrojs/sitemap`, `robots.txt`, `/public/.htaccess` (§9.1 punto 4),
   workflow GitHub Actions §9.2.
9. Pass di QA §8 (build, check, Lighthouse, mobile).
10. Consegna: repo + istruzioni §9.1 + **mini-guida per l'editor** (1 pagina,
    con screenshot: come aggiungere un progetto, come cambiare un testo).

**Definition of done:** tutte le pagine buildano staticamente; zero form nel
DOM; layout costruito mobile-first e verificato a 360/390/768/1024/1440px;
contatti importati solo da `contatti.ts` con l'indirizzo
**Via Roma 105, 71025 Castelluccio dei Sauri (FG)**; StatBar con i dati
segnaposto marcati `<!-- DATO-FINTO -->` ed editabili dal pannello; gallery
progetti conforme a §4.4 (niente masonry/carousel/overlay banali, lightbox
`<dialog>` accessibile) alimentata dalla collection; **admin /admin
funzionante end-to-end** (un non-tecnico aggiunge un progetto con foto e
modifica un testo della home senza toccare git, e la modifica va live in
pochi minuti); redirect mappati; placeholder immagine chiaramente marcati;
Lighthouse mobile ≥ 95.
