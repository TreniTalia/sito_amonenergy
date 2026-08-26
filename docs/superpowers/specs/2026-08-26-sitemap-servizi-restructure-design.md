# Ristrutturazione sitemap: Servizi, Lavori, rimozione Azienda

Data: 2026-08-26

## Contesto

La home è già stata ristrutturata (copy, layout, colori). Ora tocca al resto del
sito. Il cliente vuole una sitemap più semplice:

- **Home** (fatta)
- **Servizi** — nuova pagina unica, portfolio di quello che Amon offre: RCS, CCI
  (in partnership con Teamware), ingegneria elettrica (ricerca guasti AT/MT,
  tangente delta/scariche parziali, verifiche e collaudi trasformatori),
  costruzione e gestione impianti, più una fascia tecnologie/protocolli.
- **Lavori** — l'attuale galleria progetti (stazioni costruite), solo rinominata.
- **Contatti** — invariata.
- **Azienda** — rimossa. La storia dell'azienda è già raccontata in home (fascia
  "Chi siamo", appena allungata con i fatti reali).

## Decisioni vincolanti (già confermate con il cliente)

1. Lavori = l'attuale `/progetti/`. Servizi = la pagina nuova descritta sotto.
2. La nuova Servizi è **una pagina sola**, niente più sotto-pagine di dettaglio
   per singolo servizio.
3. Costruzioni e Gestione e manutenzione **restano** servizi offerti (coerenza
   con la home, che li cita esplicitamente) — niente più pagina di dettaglio a
   sé, ma restano voci nella nuova Servizi e nella card grid della home.
4. Nessun redirect da `/azienda/` — chi ci arriva vede un 404. Il link home
   "Conosci l'azienda →" punta invece a `/servizi/`.
5. URL cambia da `/progetti/` a `/lavori/`, con redirect 301 dal vecchio
   indirizzo (via nginx, stesso meccanismo dei redirect legacy già in
   `docker/nginx.conf`).
6. PF1 = osservabilità (il CCI legge lo stato dell'impianto). PF2 =
   controllabilità (limitazione della potenza attiva su comando del
   distributore). Riferimento: CEI 0-16 V5, Delibera ARERA 564/2025/R/eel.
   Confermato dal cliente.
7. Teamware: partner reale, sito https://www.teamware.it/. Logo scaricato da
   lì (`teamware-logo-2x.png`, 420×88, blu #00468C circa — già vicino alla
   palette del sito, nessuna forzatura di colore necessaria).

## Stato attuale (per chi implementa)

- `src/pages/azienda.astro` + `src/content/pagine/azienda.yaml` (schema
  `aziendaSchema` in `src/content.config.ts`).
- `src/pages/progetti.astro`, collection `progetti` (6 voci in
  `src/content/progetti/*.md`) — resta contenutisticamente invariata.
- `src/pages/servizi/index.astro` (hub, legge `pagine/servizi.yaml`, schema
  `serviziHubSchema`) + 5 pagine di dettaglio
  (`laboratorio-mobile.astro`, `verifiche-strumentali.astro`,
  `monitoraggio-e-controllo.astro`, `costruzioni.astro`,
  `gestione-e-manutenzione.astro`), tutte renderizzate da
  `src/components/ServizioBody.astro` a partire dalla collection `servizi`
  (5 file `.md`, campi `titolo/frase/excerpt/icona/ordine/immagine?/punti?`).
- `src/components/Header.astro`: nav desktop e mobile con link `/azienda/`,
  dropdown "Servizi" (5 link alle pagine di dettaglio), `/progetti/`,
  `/contatti/`.
- `src/components/Footer.astro`: stesso elenco di 5 link ai servizi, ripetuto
  come colonna "Servizi".
- `src/pages/index.astro`: la card grid "Cosa facciamo" itera sulla collection
  `servizi` e linka a `/servizi/${id}/` (le pagine di dettaglio); il link
  "Conosci l'azienda →" punta a `/azienda/`.
- `public/admin/config.yml` (Sveltia CMS): una collection "servizi" 1:1 con le
  5 pagine di dettaglio, una voce "pagine → azienda", una voce
  "pagine → servizi-hub".
- `docker/nginx.conf`: mappa `$legacy_redirect` con redirect 301 da vecchi URL
  WordPress; due di questi (`/i-nostri-clienti/`, `/lavora-con-noi/`) puntano
  oggi a `/azienda/`, che sta per sparire.
- Nessun logo di terze parti sul sito oggi: il marquee clienti in home è testo
  puro (`ClientMarquee.astro`), non immagini.

## Design

### 1. Sitemap e navbar

Nav (desktop e mobile, in `Header.astro`): **Home, Servizi, Lavori, Contatti**.

- "Azienda" sparisce (voce singola + voce nel pannello mobile).
- Il dropdown "Servizi" (oggi 5 link) diventa un **link semplice** a
  `/servizi/`: non c'è più un elenco di sotto-pagine da mostrare in un menu.
- "Progetti" → "Lavori", href `/progetti/` → `/lavori/`.
- `Footer.astro`: la colonna "Servizi" (oggi 5 link) diventa un elenco di 3
  link — Servizi, Lavori, Contatti — echi della nav principale, non più un
  indice di sotto-pagine inesistenti.

### 2. Rimozione Azienda

- Elimino `src/pages/azienda.astro`, `src/content/pagine/azienda.yaml`.
- Rimuovo `aziendaSchema` da `src/content.config.ts` e la relativa voce dallo
  `z.discriminatedUnion`.
- Rimuovo la voce "azienda" da `public/admin/config.yml` (collection
  "pagine").
- In `src/pages/index.astro`, il link "Conosci l'azienda →" diventa "Scopri i
  servizi →" (coerente col nuovo target) e punta a `/servizi/`. Il paragrafo
  "Chi siamo" sopra resta invariato: è già la versione lunga con la storia
  reale, non richiede altro testo.
- **Redirect legacy da aggiustare**: in `docker/nginx.conf`, le righe
  ```
  ~^/i-nostri-clienti/?$   /azienda/;
  ~^/lavora-con-noi/?$     /azienda/;
  ```
  puntano a una pagina che sparisce. Le ripunto a `/` (home): un redirect che
  finisce su un altro redirect (in pratica una 404) è peggio di un redirect a
  home. Questo non è un redirect *nuovo* per `/azienda/` (il cliente ha detto
  di no) — è la correzione di due redirect legacy già esistenti che non
  possono più avere la stessa destinazione.

  **Stessa correzione serve per altri sei redirect legacy**, individuati
  scrivendo il piano: puntano tutti alle 5 pagine di dettaglio servizio che
  la §4 elimina.
  ```
  ~^/laboratorio-mobile/?$             /servizi/laboratorio-mobile/;
  ~^/centrix/?$                        /servizi/laboratorio-mobile/;
  ~^/verifiche-strumentali/?$          /servizi/verifiche-strumentali/;
  ~^/monitoraggio-controllo/?$         /servizi/monitoraggio-e-controllo/;
  ~^/gestione-e-manutenzione/?$        /servizi/gestione-e-manutenzione/;
  ~^/repowering-e-revamping-eolico/?$  /servizi/costruzioni/;
  ```
  Li ripunto alle ancore corrispondenti sulla nuova pagina unica:
  `/laboratorio-mobile/` e `/centrix/` → `/servizi/#ingegneria-elettrica`;
  `/verifiche-strumentali/` → `/servizi/#ingegneria-elettrica`;
  `/monitoraggio-controllo/` → `/servizi/#controllo-e-monitoraggio`;
  `/gestione-e-manutenzione/` → `/servizi/#costruzione-e-gestione`;
  `/repowering-e-revamping-eolico/` → `/servizi/#costruzione-e-gestione`.
- Nessuna nuova regola per `/azienda/` stesso: chi ci arriva direttamente vede
  il 404 esistente del sito (`error_page 404 /404.html`), come deciso.

### 3. Lavori (rename da Progetti)

- Rinomino `src/pages/progetti.astro` → `src/pages/lavori.astro`. Contenuto,
  copy, componenti (`GalleryGrid`, `Lightbox`, `CtaBand`) invariati — cambia
  solo l'URL e le stringhe di breadcrumb/canonical (`/lavori/`, "Lavori").
  La collection `progetti` (nome interno, file, schema) **non cambia nome**:
  è un identificatore tecnico, rinominarlo sposterebbe tutti i file sorgente
  senza alcun beneficio visibile.
- Aggiungo in `docker/nginx.conf`, nella mappa `$legacy_redirect`, una riga:
  ```
  ~^/progetti/?$   /lavori/;
  ```
  redirect 301 vero (non il meta-refresh statico di Astro), stesso
  meccanismo già in uso per gli altri redirect dal vecchio sito.
- Aggiorno tutti i link interni che oggi puntano a `/progetti/`:
  `Header.astro` (nav + mobile), `Footer.astro` (se presente), la card grid
  "Realizzazioni" in home (`index.astro`, 2 link "Tutti i progetti →"), e la
  nuova pagina Servizi (dove "Costruzioni" può rimandare a `/lavori/` per
  vedere le opere realizzate, come fa oggi il body di `costruzioni.md`).
- Il sitemap generato da `@astrojs/sitemap` si aggiorna da solo al prossimo
  build (legge le route effettive).

### 4. Servizi — nuova pagina unica

`src/pages/servizi/index.astro` (stesso URL, contenuto interamente nuovo).
Elimino le 5 pagine di dettaglio (`laboratorio-mobile.astro`,
`verifiche-strumentali.astro`, `monitoraggio-e-controllo.astro`,
`costruzioni.astro`, `gestione-e-manutenzione.astro`) e
`src/components/ServizioBody.astro` (usato solo da loro).

Struttura, dall'alto:

**PageHero** (invariato come componente):
- eyebrow: "Portfolio dei servizi"
- h1: "Un system integrator per ogni fase dell'impianto."
- sub: "Dal controllo remoto alla diagnostica strumentale, fino alla
  costruzione e alla gestione quotidiana: le competenze che mettiamo al
  lavoro sui tuoi impianti elettrici."

**Categoria 1 — Controllo e monitoraggio** (`id="controllo-e-monitoraggio"`,
banda navy, stile `ControlPillar` ma senza il pannello con la dashboard live e
senza la griglia dei tier Basic/Advance/Pro — quelli restano un'esclusiva
della home, "non così in dettaglio" come richiesto):
- eyebrow: "Controllo e monitoraggio"
- titolo: "RCS e CCI, in casa e in campo."
- testo intro: "Due sistemi distinti che lavoriamo entrambi in prima persona:
  il nostro RCS proprietario per la supervisione da remoto, e il CCI che
  installiamo, configuriamo e gestiamo per conto dei nostri clienti."
- due card (stesso stile `.ds-panel` dei "sistemi" in `ControlPillar`):
  - **RCS** — tag "RCS", titolo "Remote Control System", testo "Il nostro
    sistema proprietario di supervisione: analisi guasti in tempo reale,
    richiusura automatica, reset protezioni da remoto e storicizzazione
    dati, con integrazione SCADA.", specs: `Richiusura automatica`,
    `Web App`, `Integrazione SCADA`.
  - **CCI** — tag "CCI", titolo "Controllore Centrale d'Impianto", testo
    "Installiamo, configuriamo e gestiamo il CCI in partnership con
    Teamware, abilitando le funzioni PF1 (osservabilità dello stato
    dell'impianto) e PF2 (limitazione della potenza attiva su comando del
    distributore), conformi a CEI 0-16 V5 e alla Delibera ARERA
    564/2025/R/eel.", specs: `CEI 0-16 V5`, `PF1 · PF2`, `ARERA 564/2025`.
    Sotto il testo, una riga "in partnership con" + logo Teamware (PNG,
    colore originale — è un partner reale con un proprio marchio, non una
    tecnologia da uniformare).

**Categoria 2 — Ingegneria elettrica** (`id="ingegneria-elettrica"`, fondo
chiaro, grid di `ServiceCard` come già in home, `accent="signal"`,
`elevated`):
- eyebrow: "Ingegneria elettrica"
- titolo: "Diagnostica strumentale su cavi e trasformatori."
- sub: "Tra i servizi più richiesti dai nostri clienti: strumentazione
  all'avanguardia e tecnici qualificati per ogni prova in campo."
- 3 card (contenuto nuovo, non dalla collection `servizi`):
  1. "Ricerca guasti su cavi AT e MT" — "Localizzazione rapida dei guasti su
     cavi di alta e media tensione con il laboratorio mobile Centrix 2.0,
     reperibilità 24 ore su 24, 365 giorni l'anno." (icona
     `fa6-solid:truck-fast`)
  2. "Tangente delta e scariche parziali" — "Diagnostica avanzata dello
     stato di isolamento di cavi e macchine elettriche, con misure di
     tangente delta e scariche parziali." (icona `fa6-solid:bolt-lightning`)
  3. "Verifiche e collaudi trasformatori" — "Prove di iniezione primaria,
     SFRA e verifiche funzionali su trasformatori AT/MT e MT/BT, di potenza
     e di misura." (icona `fa6-solid:magnifying-glass-chart`)

  Nessuna delle tre ha una pagina di approfondimento: `ServiceCard` richiede
  sempre un `href`, quindi aggiungo un prop opzionale `ctaLabel` (default
  `"Approfondisci"`) e per queste tre uso `ctaLabel="Richiedi informazioni"`
  con `href="/contatti/"` — hanno senso come invito a contattare, non come
  rimando a un'altra pagina del sito.

  Nota: questi tre item non sostituiscono "Verifiche strumentali" nella
  collection `servizi` (quella resta per la card grid della home, invariata,
  con la sua descrizione più ampia — protezioni CEI 0-16/0-21, interruttori,
  termografia, manutenzione predittiva). Sono contenuto nuovo, specifico di
  questa pagina, che mette in vetrina le due prove diagnostiche più
  richieste (tangente delta/scariche parziali, collaudo trasformatori) più
  la ricerca guasti estesa a AT+MT (oggi "Laboratorio mobile" la racconta
  come solo-MT).

**Categoria 3 — Costruzione e gestione impianti**
(`id="costruzione-e-gestione"`, fondo chiaro):
- eyebrow: "Costruzione e gestione"
- titolo: "Dalla posa in opera alla gestione quotidiana."
- 2 card che leggono `titolo`/`excerpt`/`icona` **direttamente dalla
  collection `servizi`** (`getEntry('servizi', 'costruzioni')` e
  `getEntry('servizi', 'gestione-e-manutenzione')`) — stesso testo già
  approvato, nessuna duplicazione di contenuto. `ServiceCard` richiede sempre
  un `href` (non è opzionale nel componente): invece di inventare una
  variante senza link, entrambe le card puntano a `/lavori/` — è lì che si
  vedono gli impianti che Amon costruisce *e* gestisce, quindi il rimando
  regge per tutte e due (coerente con il body di `costruzioni.md`, che già
  linka all'archivio progetti).

**Categoria 4 — Tecnologie** (`id="tecnologie"`, fondo chiaro, fascia di
chip):
- eyebrow: "Tecnologie"
- titolo: "Il software che parla la lingua dell'impianto."
- sub: "Protocolli e standard industriali che integriamo nei nostri sistemi,
  oltre a competenze native di sviluppo software e intelligenza
  artificiale."
- 7 chip in riga (wrap su mobile), stesso stile pillola già usato per gli
  spec chip di `ControlPillar` (`rounded-full border border-white/18
  bg-white/8` — qui in versione chiara, `border-navy-100 bg-navy-100/40`):
  Modbus TCP/RTU, OPC UA, MQTT, Sparkplug B, IEC 61850 · 101, Zigbee, AI &
  sviluppo software. Tre di questi (Modbus, MQTT, Zigbee — vedi §5) mostrano
  anche un piccolo marchio monocromo prima dell'etichetta; gli altri quattro
  (OPC UA, Sparkplug B, IEC 61850 · 101, AI & sviluppo software) sono solo
  testo.

**CtaBand** in fondo (invariato).

Tutte le sezioni sopra la "Categoria 4" prendono il testo (eccetto le 3 card
di Ingegneria elettrica e i nomi dei chip Tecnologie, che sono liste fisse in
YAML) da un `pagine/servizi.yaml` esteso — vedi §6.

### 5. Loghi di terze parti — quali uso, quali no

Il sito oggi non mostra loghi di terzi (il marquee clienti è testo). Per la
prima volta introduco marchi esterni: serve un criterio, non solo "cerca e
metti".

- **Teamware** (partner nominato, sito noto): logo vero, a colori originali.
  Fonte: `https://www.teamware.it/wp-content/uploads/2016/06/teamware-logo-2x.png`
  (420×88, già scaricato). Nessuna licenza dubbia: è l'attribuzione di una
  partnership commerciale reale con un fornitore nominato esplicitamente dal
  cliente.
- **MQTT** e **Zigbee**: marchi monocromi liberi da vincoli d'alterazione,
  disponibili puliti su Simple Icons
  (`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/mqtt.svg` e
  `.../zigbee.svg`) — SVG a singolo path, pensati apposta per essere
  ricolorati. Li scarico, tolgo ogni `fill` fissato nel path e lo lascio
  ereditare `currentColor`, così si intonano al blu del sito
  (`--color-navy-700`) come qualunque icona Font Awesome già in uso.
- **Modbus**: stesso trattamento monocromo, marchio pubblico
  dell'organizzazione (Wikimedia Commons, "Logo of Modbus.svg" — file
  liberamente ridistribuibile, verificato in fase di download).
- **OPC UA**, **Sparkplug B**, **IEC 61850/101**: **niente logo**, solo
  etichetta testuale nel chip. Motivo:
  - Sparkplug B è un marchio Eclipse Foundation con linee guida esplicite
    che vietano di alterare il logo — ricolorarlo in monocromo per uniformità
    di stile violerebbe quella regola.
  - Il logo OPC Foundation è legato a un badge di membership/certificazione:
    mostrarlo implicherebbe un'affiliazione formale che non abbiamo verificato.
  - IEC 61850/101 sono numeri di norma, non un marchio aziendale: il logo IEC
    (l'ente) porta la stessa cautela di membership/certificazione del punto
    sopra.
  Un chip di solo testo comunica comunque il supporto allo standard, senza
  intestarsi un'affiliazione non verificata.
- **AI & sviluppo software**: nessun logo (non è un brand), chip testuale.

Asset scaricati e ripuliti finiscono in `src/assets/img/tech/` (SVG per
Modbus/MQTT/Zigbee) e `src/assets/img/brand/partners/` (PNG Teamware) — non
attraverso la pipeline `astro:assets` per gli SVG monocromi (sono marcature
piccole, inline è più semplice: `import mqttSvg from
'.../mqtt.svg?raw'` + `<Fragment set:html={mqttSvg} />` dentro un contenitore
con `color: var(--color-navy-700)`), mentre il PNG Teamware passa da
`<Image>` come il resto delle foto del sito.

### 6. Content model e CMS (Sveltia)

`src/content.config.ts`:
- Rimuovo `aziendaSchema` e la voce dallo `z.discriminatedUnion`.
- `serviziHubSchema` → `serviziSchema` (stesso `pagina: z.literal('servizi')`
  ma esteso):
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
      rcs: z.object({ titolo: z.string(), testo: z.string(), specs: z.array(z.string()) }),
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
      voci: z.array(z.object({ titolo: z.string(), testo: z.string(), icona: z.string() })),
    }),
    costruzioneGestione: z.object({ eyebrow: z.string(), titolo: z.string() }),
    tecnologie: z.object({
      eyebrow: z.string(),
      titolo: z.string(),
      sub: z.string(),
      voci: z.array(z.object({ nome: z.string(), logo: z.string().optional() })),
    }),
  });
  ```
  (`logo` è una chiave libera tipo `"mqtt"` / `"zigbee"` / `"modbus"`, letta
  dal componente per scegliere quale SVG importato mostrare; assente per i
  chip solo-testo.)
- Nella collection `servizi`: tolgo `frase`, `punti`, `immagine` (usati solo
  dal template di dettaglio che sparisce). Restano `titolo`, `excerpt`,
  `icona`, `ordine`.

`public/admin/config.yml`:
- Rimuovo la voce "pagine → azienda".
- La collection "servizi" perde i widget per `frase`, `immagine`, `punti`
  dai `servizio_fields`; resta titolo/excerpt/icona/ordine. Aggiorno la
  `description` (non è più "corrispondono 1:1 alle pagine di /servizi/" —
  ora sono solo dati per le card della home).
- "pagine → servizi-hub" diventa "pagine → servizi" con i nuovi campi
  (oggetti `controllo`/`ingegneriaElettrica`/`costruzioneGestione`/
  `tecnologie` come `widget: object`/`widget: list`, sullo stesso modello
  già usato per `hero`/`percheAmon` in "pagine → home"). I loghi (Teamware,
  Modbus/MQTT/Zigbee) **non sono editabili da CMS**: sono asset di codice,
  come il logo Amon stesso in `Logo.astro`.

### 7. Home — modifiche minime

- `index.astro`: gli `href` delle 5 `ServiceCard` in "Cosa facciamo" passano
  da `/servizi/${s.id}/` ad ancore sulla nuova pagina:
  - `laboratorio-mobile` → `/servizi/#ingegneria-elettrica`
  - `verifiche-strumentali` → `/servizi/#ingegneria-elettrica`
  - `monitoraggio-e-controllo` → `/servizi/#controllo-e-monitoraggio`
  - `costruzioni` → `/servizi/#costruzione-e-gestione`
  - `gestione-e-manutenzione` → `/servizi/#costruzione-e-gestione`
  - Il link "Conosci l'azienda →" → "Scopri i servizi →", punta a `/servizi/`
    (vedi §2).
  - I due link "Tutti i progetti →" (sezione Realizzazioni) e l'`href` delle
    card puntano a `/lavori/` invece di `/progetti/`.
- Nessun'altra modifica: copy, StatBar, ControlPillar, ClientMarquee, CtaBand
  della home restano quelli appena finiti.

## Fuori scope

- Non tocco `/contatti/` (il cliente ha confermato che va bene così).
- Non tocco `/privacy-policy/`, `/404/`.
- Non aggiungo pagine di dettaglio per i 3 nuovi item di Ingegneria
  elettrica: restano card sulla pagina Servizi, senza drill-down (coerente
  con "pagina unica, nessun dettaglio").
- Non introduco un sistema di icone/loghi generico riusabile altrove: la
  soluzione per Modbus/MQTT/Zigbee/Teamware è locale alla pagina Servizi.
