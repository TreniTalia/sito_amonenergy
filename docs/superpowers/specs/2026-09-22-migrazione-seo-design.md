# Migrazione SEO di amonenergy.it — design

Data: 2026-09-22
Stato: approvato dal cliente (sezioni 1-5), pronto per il piano operativo.

## Obiettivo

Sostituire il sito WordPress attualmente servito su `https://amonenergy.it` con
il sito Astro di questo repository, ereditando l'autorità di ricerca accumulata
dal vecchio dominio e ampliando la superficie indicizzabile.

Due risultati attesi, entrambi misurabili:

1. Nessuna perdita di posizionamento sulle query già presidiate. Ogni URL del
   vecchio sito deve avere una destinazione pertinente, raggiunta con un solo
   salto.
2. Presenza sulle query tecniche di dettaglio (SFRA, scariche parziali,
   teledistacco A72, verifica protezioni AT/MT…) e citabilità da parte dei
   modelli linguistici, che oggi non esiste perché non esistono le pagine.

## Stato di partenza (verificato, non assunto)

Il sito nuovo **non** è privo di SEO. Sono già presenti:

- `<link rel="canonical">`, Open Graph e Twitter Card in `src/layouts/Base.astro`
- JSON-LD `Organization` + `LocalBusiness` + `ElectricalUtility`
- `@astrojs/sitemap` e `public/robots.txt`
- `X-Robots-Tag: noindex, nofollow` su tutti gli host tranne `amonenergy.it` e
  `www.amonenergy.it`, tramite `map $host $robots_tag` in `docker/nginx.conf`
- 10 redirect 301 da vecchi URL WordPress, in `map $uri $legacy_redirect`

Mancano invece: il file `public/og-image.jpg` (referenziato da ogni pagina ma
inesistente, quindi oggi ogni anteprima social e ogni scraper riceve un 404),
qualsiasi forma di tracciamento, 18 dei 28 redirect necessari, e le pagine su
cui posizionarsi. Dei 10 redirect già scritti, 2 vanno corretti nella
destinazione: `/i-nostri-clienti/` e `/lavora-con-noi/` puntano oggi alla home,
perché quando furono scritti la pagina `/azienda/` era appena stata eliminata.

Il sito live è stato censito leggendo il suo `page-sitemap.xml`: 30 URL, di cui
22 in italiano e 8 in inglese (WPML, forma `?lang=en`).

### Vincolo architetturale

Astro è configurato **senza adapter**: la build è statica e servita da nginx
(vedi `Dockerfile`). In produzione non gira alcun processo Node. Ogni scelta che
richieda logica a runtime deve quindi vivere in nginx, non nel sito.

### Decisione precedente che questo design ribalta

Il commit `95c0739` e la spec
`docs/superpowers/specs/2026-08-26-sitemap-servizi-restructure-design.md` hanno
eliminato di proposito la pagina `/azienda/` e le 5 pagine servizio di
dettaglio, per semplificare la sitemap. Quella decisione rispondeva a un
criterio di architettura dell'informazione; questa risponde a un criterio di
migrazione SEO, e i due criteri tirano in direzioni opposte.

Riconciliazione adottata: le pagine tornano, ma **non tornano nella
navigazione**. La nav resta Home, Azienda, Servizi, Lavori, Contatti. Le 9
pagine tecniche si raggiungono dal corpo di `/servizi/`, dai link incrociati fra
pagine sorelle e dai motori di ricerca. Nessun menu a tendina con nove voci.

### Dati aziendali di riferimento

NAP unico, da usare identico ovunque (sito, JSON-LD, Search Console, eventuali
schede esterne):

> Amon Energy S.r.l. — Via Roma 105, 71025 Castelluccio dei Sauri (FG) — +39 0881 377590

Sede **unica**. Il vecchio sito dichiarava anche una sede a Troia (Via Ludovico
Ariosto 4) e un CAP 71029 per Castelluccio: entrambi errati, non vanno
riportati. Un NAP incoerente impedisce a Google di consolidare i segnali locali.

Fatti aziendali confermati dal cliente e già presenti nel repository
(`src/content/pagine/home.yaml` e, per la parte recuperata, il file
`src/content/pagine/azienda.yaml` eliminato dal commit `95c0739`):

- Origine dell'esperienza: 2000, come PL System, poi Energy System; oltre 100
  stazioni AT/MT realizzate, contratti O&M su più di 30 impianti nel Sud Italia;
  acquisizione da parte del Gruppo BayWa r.e. nel 2019.
- Amon Energy S.r.l. fondata nel **2020** da Mario Palumbo e Ludovico Lombardi.
- 20 persone, fra ingegneri e operai.
- 140+ impianti MT in gestione O&M, 50+ clienti, sede unica da 5.000 m²,
  Control Room attiva 24/7/365.

Nel JSON-LD, `foundingDate` vale **2020**: è la data della persona giuridica. Il
2000 si racconta nel testo come continuità di esperienza, non come data di
fondazione — dichiarare 2000 in un dato strutturato sarebbe falso e verificabile
in visura.

Certificazioni: **non se ne parla**, in nessuna pagina. Il cliente non ne ha
dichiarate, e una certificazione inventata è il tipo di affermazione che un
committente verifica.

## 1. Fondamenta SEO

### 1.1 Immagine Open Graph

Creare `public/og-image.jpg`, 1200×630, nello stile del sito (navy, tipografia
Archivo, marchio). Aggiungere in `Base.astro` i meta oggi assenti
`og:image:width`, `og:image:height` e `og:image:alt`: senza dimensioni
dichiarate alcuni scraper saltano l'immagine.

### 1.2 Tracciamento

Il Measurement ID GA4 va **hardcoded**, in un unico punto:
`src/data/analytics.ts`, con il segnaposto `G-XXXXXXXXXX` finché il cliente non
fornisce quello reale. Non è un dato sensibile: un Measurement ID finisce
comunque in chiaro nell'HTML di ogni pagina.

L'alternativa a runtime (template `envsubst` servito da nginx) è stata valutata
e scartata dal cliente in favore della semplicità. Il problema che si poneva: in
una build statica `import.meta.env.PUBLIC_*` viene congelato al momento del
`npm run build`, quindi una variabile impostata in Portainer sul container non
raggiungerebbe mai l'HTML. Con l'ID hardcoded il vincolo diventa semplicemente
che un cambio richiede un rebuild.

### 1.3 GA4 dietro consenso

`gtag.js` si carica **solo** dopo l'accettazione nel banner già esistente
(`src/components/CookieConsent.astro`), mai prima, con `anonymize_ip`. La
Privacy Policy va aggiornata con la voce GA4: finalità, durata dei cookie,
titolare. Senza questo il banner è decorativo e l'informativa è falsa.

### 1.4 Verifica Search Console

Via record **DNS TXT**, non con file HTML né meta tag. Il cliente controlla il
DNS; la verifica sul dominio copre tutti i sottodomini e non si perde a ogni
rebuild. La esegue il cliente.

### 1.5 Dati strutturati

Oltre all'`Organization` già presente:

- `WebSite` con `inLanguage`
- `Service` su ogni pagina tecnica (`serviceType`, `areaServed`, `provider`)
- `FAQPage` dove esistono domande reali
- `BreadcrumbList` su tutte le pagine, home inclusa (oggi manca)
- `ImageObject` per il logo

È il materiale che i modelli linguistici leggono più volentieri, perché è
esplicito e non ambiguo.

### 1.6 `llms.txt` e crawler dei modelli

Creare `/llms.txt`: chi è l'azienda, cosa fa, elenco delle pagine con una riga
di descrizione ciascuna, in prosa.

In `robots.txt`, `Allow` esplicito per `GPTBot`, `ClaudeBot`, `PerplexityBot`,
`Google-Extended`. `User-agent: *` li coprirebbe già, ma la dichiarazione
esplicita è il segnale che quei crawler leggono. Il cliente **vuole** essere
citato: l'accesso è consentito deliberatamente.

## 2. Architettura URL e i18n

### 2.1 Routing

i18n nativo di Astro: `defaultLocale: 'it'`, `prefixDefaultLocale: false`.
Italiano su `/`, inglese sotto `/en/`. Nessun URL italiano già indicizzato si
sposta.

### 2.2 Inventario finale: 15 URL per lingua, 30 in tutto

| Italiano | Inglese |
|---|---|
| `/` | `/en/` |
| `/azienda/` | `/en/company/` |
| `/servizi/` | `/en/services/` |
| `/servizi/sfra/` | `/en/services/sfra/` |
| `/servizi/misure-scariche-parziali/` | `/en/services/partial-discharge-measurement/` |
| `/servizi/verifica-protezioni-at-mt/` | `/en/services/hv-mv-protection-testing/` |
| `/servizi/verifiche-trasformatori-di-potenza/` | `/en/services/power-transformer-testing/` |
| `/servizi/prove-isolamento/` | `/en/services/insulation-testing/` |
| `/servizi/rcs-monitoraggio-cabina-mt/` | `/en/services/rcs-mv-substation-monitoring/` |
| `/servizi/cci-controllore-centrale-impianto/` | `/en/services/cci-central-plant-controller/` |
| `/servizi/teledistacco-a72/` | `/en/services/a72-remote-tripping/` |
| `/servizi/lettura-contatori/` | `/en/services/meter-reading/` |
| `/lavori/` | `/en/projects/` |
| `/contatti/` | `/en/contacts/` |
| `/privacy-policy/` | `/en/privacy-policy/` |

Gli slug inglesi sono tradotti, non copiati: uno slug è un fattore di ranking
debole ma reale, e un inglese capisce `/en/services/sfra/`, non
`/en/services/verifica-protezioni-at-mt/`.

### 2.3 Struttura piatta sotto `/servizi/`

Il vecchio sito annidava le pagine tecniche sotto due genitori
(`/verifiche-strumentali/…`, `/monitoraggio-controllo/…`). Ricreare quegli URL
identici eviterebbe il redirect del tutto, e un 301 costa sempre un filo di
segnale.

Si adotta comunque un solo livello, perché nel sito nuovo quei genitori non
esistono come pagine — sono ancore dentro `/servizi/` — e un figlio senza
genitore è una briciola di navigazione rotta. Un 301 ben fatto trasferisce la
sostanza dell'autorità; la simmetria con l'inglese e la pulizia
dell'architettura valgono più di quel filo. Decisione presa consapevolmente dal
cliente: dopo lo switch non è reversibile senza una seconda migrazione.

### 2.4 `hreflang`

Ogni pagina dichiara sé stessa, la gemella nell'altra lingua e `x-default`
sull'italiano. I riferimenti devono essere **reciproci**: se A punta a B, B deve
puntare ad A, altrimenti Google ignora l'intero blocco.

### 2.5 Pagine inglesi senza gemella italiana

Regola generale decisa dal cliente: 301 alla home. Applicata con due
precisazioni:

- Destinazione `/en/`, non `/`. Mandare un visitatore inglese sulla home
  italiana produce un abbandono immediato.
- `/our-clients/` fa eccezione e punta a `/en/company/#clients`: la sezione
  clienti vive dentro la pagina Azienda (il roster è già in
  `src/data/clienti.ts`), quindi la destinazione è pertinente e il 301 non
  rischia di essere interpretato come soft-404.

### 2.6 Query string e `map $uri`

Il `map $uri` di nginx **non vede la query string**. Gli URL inglesi del vecchio
sito hanno la forma `?lang=en`: per quelli con un path proprio (`/company/`,
`/rcs/`…) il match sul path è sufficiente, ma la home inglese è `/?lang=en` e
per nginx il `$uri` vale `/`.

Serve quindi un `map $arg_lang` separato, valutato prima. Trattamento
concordato: **best practice, non requisito bloccante**. Se la gestione della
query string rischia di compromettere la home italiana (loop di redirect, o
qualsiasi comportamento anomalo riscontrato in crawl), si rinuncia a quel
singolo redirect. La rinuncia vale solo per questo caso.

### 2.7 Contenuti e CMS

Le collection passano a `src/content/<collection>/it/` e `.../en/`. Nuova
collection `servizi-dettaglio` per le 9 pagine tecniche.

`public/admin/config.yml` (Decap) va configurato con `i18n`, altrimenti
l'inglese risulta modificabile solo da Git e non dal pannello.

### 2.8 Pagine escluse

`/laboratorio-mobile/` e `/centrix/` restano redirect verso un'ancora di
`/servizi/`. Valutate come possibili pagine proprie e **scartate dal cliente**:
il numero di pagine va tenuto basso.

## 3. Le pagine nuove

### 3.1 Anatomia della pagina tecnica

Identica per tutte e 9, così è riconoscibile per il lettore e rapida da
riempire:

1. `PageHero` — briciole, H1, lead di due righe
2. Il problema — cosa si guasta e perché conta, due paragrafi
3. Modulo grafico proprio della pagina (vedi 3.2)
4. Cosa misuriamo — griglia di 4-6 voci con `GlassSvgIcon`
5. Strumentazione — pannello vetro con modello e capacità reali
6. Riferimento normativo — la norma applicata, citata per numero
7. Caso reale — rimando a una stazione in `/lavori/`
8. FAQ — 3-4 domande vere, che alimentano lo schema `FAQPage`
9. `CtaBand` e servizi correlati; i link incrociati fanno circolare l'autorità
   fra le nove pagine

### 3.2 Elementi grafici, nessuna fotografia

Si riusa il linguaggio visivo già costruito per
`src/components/CoverageMap.astro`: SVG navy, tratto sottile, verde come
micro-accento, tacche da strumento.

Tre moduli riusabili, più un disegno dedicato per pagina:

- `SpecPanel` — scheda tecnica su pannello vetro
- `ProcessSteps` — fasi numerate e collegate (sopralluogo, misura, referto)
- `ParamGrid` — parametri misurati, griglia a icone
- SVG dedicato: curva di risposta in frequenza per la SFRA, treno di impulsi per
  le scariche parziali, catena di segnale RIGEDI → A72 → SCADA per il
  teledistacco

### 3.3 Origine del testo

Base: i contenuti del vecchio sito, che hanno sostanza tecnica reale
(analizzatore M5500, movimento del nucleo, deformazione e spostamento
dell'avvolgimento, dispositivi RIGEDI e Modem A72, caso della stazione di
Banzi).

Sopra si aggiungono due cose che il vecchio sito non ha: le **norme citate per
numero** e **dati concreti**. È il materiale che rende una pagina citabile da un
modello linguistico, perché è verificabile; una pagina di aggettivi non viene
citata da nessuno.

**Ogni norma va verificata prima di scriverla.** Una norma sbagliata su una
pagina tecnica distrugge la credibilità davanti a un committente che quel numero
lo conosce. Candidate da verificare, non da dare per buone: IEC 60076-18
(risposta in frequenza sui trasformatori), IEC 60270 (misure di scariche
parziali), CEI 0-16 (connessione alla rete MT, protezioni e teledistacco). Già
citate nel repository e da confermare: CEI EN 50110-1 e CEI 11-27 (esercizio
degli impianti elettrici, qualifica del personale — in `home.yaml`), CEI 0-16 V5
e Delibera ARERA 564/2025/R/eel (PF1 osservabilità, PF2 controllabilità —
confermate dal cliente nella spec del 2026-08-26).

Strumentazione reale, dal file `azienda.yaml` recuperato da Git, associata alle
pagine che la useranno:

| Strumento | Pagina |
|---|---|
| Megger HV Test 80 kV | prove isolamento |
| b2 HVA68TD+PD | misure scariche parziali |
| DRTS/64, ISA CBA 1000 | verifica protezioni AT/MT |
| ISA T2000, ISA STS5000 + TD500 | verifiche trasformatori di potenza |
| OTDR 8000MAX-Q1, INNO View 7 | fibra ottica |
| Termocamere HT VEGA 74 | termografia |
| Laboratori mobili Centrix 2.0 | trasversale |

L'analizzatore SFRA M5500 compare sul vecchio sito ma non nell'elenco
strumentazione: va confermato prima di citarlo come strumentazione propria.

### 3.4 Ricerca delle query

Non esistono ancora dati Search Console. Il primo giro si fa sul campo: per ogni
pagina si cerca la query in italiano, si guarda chi occupa la prima pagina e
cosa copre, e si scrive per battere quel contenuto.

Quando la Search Console avrà 30 giorni di dati, il giro si rifà sui dati veri.
È un passo **ricorrente**, non una tantum.

### 3.5 `/azienda/`

Hero, chi siamo, `StatBar` con i numeri, competenze, `ClientMarquee` (roster già
in `src/data/clienti.ts`), `CoverageMap`, CTA. Nessuna sezione certificazioni.

Il testo non si riscrive: `src/content/pagine/azienda.yaml` si recupera integro
da Git (commit precedente a `95c0739`) e contiene storia, missione, raggio
d'azione ed elenco strumentazione.

È la pagina che risponde a "chi è Amon Energy": la più citata dai modelli
linguistici e la più rilevante per l'E-E-A-T.

### 3.6 Volume

9 pagine tecniche più `/azienda/`, in due lingue: 20 testi. L'inglese è
traduzione tecnica, non riscrittura.

## 4. Mappa redirect completa

Quattro URL italiani **restano identici** e non richiedono alcun redirect: `/`,
`/azienda/`, `/contatti/`, `/privacy-policy/`. Su questi l'autorità passa
intatta.

### Italiano

| Vecchio | Nuovo |
|---|---|
| `/progetti/` | `/lavori/` |
| `/i-nostri-clienti/` | `/azienda/#clienti` |
| `/lavora-con-noi/` | `/contatti/` |
| `/consulenza/` | `/contatti/` |
| `/foto-video/` | `/lavori/` |
| `/laboratorio-mobile/` | `/servizi/#ingegneria-elettrica` |
| `/centrix/` | `/servizi/#ingegneria-elettrica` |
| `/verifiche-strumentali/` | `/servizi/#ingegneria-elettrica` |
| `/monitoraggio-controllo/` | `/servizi/#controllo-e-monitoraggio` |
| `/gestione-e-manutenzione/` | `/servizi/#costruzione-e-gestione` |
| `/repowering-e-revamping-eolico/` | `/servizi/#costruzione-e-gestione` |
| `/prove-isolamento/` | `/servizi/prove-isolamento/` |
| `/verifiche-strumentali/sfra/` | `/servizi/sfra/` |
| `/verifiche-strumentali/misure-scariche-parziali/` | `/servizi/misure-scariche-parziali/` |
| `/verifiche-strumentali/verifica-protezioni-at-mt/` | `/servizi/verifica-protezioni-at-mt/` |
| `/verifiche-strumentali/verifiche-trasformatori-potenza-misure/` | `/servizi/verifiche-trasformatori-di-potenza/` |
| `/monitoraggio-controllo/rcs-monitoraggio-e-controllo-cabina-mt/` | `/servizi/rcs-monitoraggio-cabina-mt/` |
| `/monitoraggio-controllo/cci-controllore-centrale-dimpianto/` | `/servizi/cci-controllore-centrale-impianto/` |
| `/monitoraggio-controllo/teledistacco-a72/` | `/servizi/teledistacco-a72/` |
| `/monitoraggio-controllo/lettura-contatori/` | `/servizi/lettura-contatori/` |

### Inglese

| Vecchio | Nuovo |
|---|---|
| `/company/` | `/en/company/` |
| `/our-job/` | `/en/projects/` |
| `/our-clients/` | `/en/company/#clients` |
| `/rcs/` | `/en/services/rcs-mv-substation-monitoring/` |
| `/centrix-2-0/` | `/en/services/` |
| `/contacts/` | `/en/contacts/` |
| `/repowering-eolic-revamping/` | `/en/services/#construction` |
| `/?lang=en` | `/en/` (best-effort, vedi 2.6) |

### Residui WordPress

- `/sitemap_index.xml` e `/page-sitemap.xml` → 301 a `/sitemap-index.xml`.
  Google continua a richiedere il vecchio indirizzo per mesi.
- `/feed/` e `/comments/feed/` → 301 alla home. Sono URL con backlink reali.
- `/wp-admin/`, `/wp-login.php`, `/xmlrpc.php` → **410**, non 404: dichiara al
  crawler che l'URL è sparito in modo definitivo e riduce il rumore da bot.

### Regole trasversali

- **Nessuna catena.** Ogni vecchio URL raggiunge la destinazione finale con un
  solo salto. Le catene diluiscono il segnale e rallentano la scansione.
- **Ordinamento in `map $uri`.** nginx applica la prima regex che combacia. I
  pattern genitore sono ancorati con `/?$`, quindi
  `/verifiche-strumentali/sfra/` non può cadere su `~^/verifiche-strumentali/?$`.
  Chi aggiunge una regex senza ancora rompe la mappa in silenzio: verificarlo a
  ogni modifica.
- **Durata.** I redirect restano in servizio per sempre, e comunque non meno di
  12 mesi. Rimuoverli è buttare via il lavoro di migrazione.

## 5. Cutover e misura

### 5.1 Canonicalizzazione del dominio — da chiudere prima dello switch

Oggi `docker/nginx.conf` marca indicizzabili sia `amonenergy.it` sia
`www.amonenergy.it`, e il `server` risponde a entrambi con lo stesso contenuto:
agli occhi di Google sono due siti identici.

Decisione del cliente: **vince il dominio nudo**. `www.amonenergy.it` fa 301
verso `amonenergy.it` su tutti i percorsi, preservando path e query string.

### 5.2 Prima dello switch

Tutto verificato su preview, con il vecchio sito ancora online:

1. crawl automatico dei vecchi URL: 28 con redirect (20 italiani, 8 inglesi) più
   i 4 invariati. Ognuno dei 28 deve restituire un `301` singolo verso un `200`,
   con il target atteso; i 4 invariati devono rispondere `200` diretto, senza
   redirect intermedi
2. `hreflang` reciproci verificati a coppie, `x-default` presente
3. sitemap con entrambe le lingue, nessun URL che rediriga dentro la sitemap
4. `og-image.jpg` raggiungibile, JSON-LD validato
5. TTL DNS abbassato a 300 secondi 24 ore prima

### 5.3 Il giorno dello switch

1. DNS puntato al nuovo host
2. certificato valido sul dominio nudo **e** su `www`
3. verifica che l'`X-Robots-Tag: noindex` **non** compaia su `amonenergy.it`. È
   l'errore che azzera silenziosamente tutto il lavoro.
4. Search Console: invio della sitemap, ispezione manuale di home, `/azienda/`,
   `/servizi/` e delle tre pagine tecniche più importanti
5. il vecchio WordPress resta acceso ma non più sul dominio, come archivio, per
   almeno 6 mesi

Non serve lo strumento "Cambio di indirizzo" di Search Console: il dominio non
cambia.

### 5.4 Monitoraggio

- **24 ore**: errori di scansione, picchi di 404
- **7 giorni**: copertura dell'indice, 301 assorbiti
- **30 giorni**: confronto delle query su dati Search Console reali, primo giro
  di riscrittura mirata
- **90 giorni**: verifica del recupero

Un calo nelle prime 2-4 settimane è fisiologico in una migrazione e non va
confuso con un errore di configurazione.

## Fuori ambito

- **Profilo Google Business** e **Bing Webmaster Tools**: consigliati, non
  bloccanti, esclusi su decisione del cliente. Il primo è il ritorno più alto
  per ora spesa sulle ricerche locali di un'azienda con sede fisica; il secondo
  alimenta l'indice usato da Copilot.
- Certificazioni aziendali: nessuna dichiarata, nessuna pagina.
- `/laboratorio-mobile/` e `/centrix/` come pagine proprie.
