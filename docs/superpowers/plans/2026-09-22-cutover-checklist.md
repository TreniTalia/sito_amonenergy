# Checklist di cutover — passaggio da WordPress ad Astro

Documento operativo per il giorno in cui il cliente decide di spostare il
DNS di `amonenergy.it` dal vecchio WordPress al nuovo sito Astro. È scritto
per essere riaperto da zero, in una sessione che non ha visto il lavoro di
migrazione: ogni voce verificabile ha il comando esatto da incollare e la
risposta attesa. Ogni voce dice anche **chi la esegue** — sviluppatore o
cliente — perché alcune azioni (DNS, Search Console) può eseguirle solo chi
controlla quei pannelli.

> **Nota importante, da leggere prima di allarmarsi**: un calo di traffico
> organico nelle prime due-quattro settimane dopo il passaggio è **fisiologico**
> in una migrazione SEO, anche quando tutto è stato fatto correttamente.
> Google deve ri-crawlare e ri-valutare ogni URL, i redirect 301 impiegano
> tempo a trasferire il segnale di ranking, e le SERP oscillano mentre
> l'indice si assesta. Non è, da solo, un segnale di errore di
> configurazione. Prima di cambiare qualcosa in reazione a un calo di
> traffico nelle prime 2-4 settimane, verificare i punti della sezione
> "Controlli a 7 giorni" qui sotto (redirect, indicizzazione, Search
> Console) — se quelli sono tutti a posto, il calo è normale rumore di
> transizione, non un problema da rincorrere.

## Stato al 24 settembre 2026: switch eseguito

Lo switch è stato fatto il 24 settembre 2026, su richiesta esplicita del
cliente di non aspettare le 24 ore del TTL (il vecchio WordPress resta acceso
su SiteGround, quindi chi aveva ancora in cache il vecchio IP vedeva il vecchio
sito, non un errore). Architettura reale, diversa da quella ipotizzata sotto:
DNS su SiteGround (nameserver `ns1/ns2.siteground.net`, posta su Microsoft 365
tramite MX, da non toccare), nuovo host `108.128.213.53` con nginx dell'host
che termina il TLS (certbot) e inoltra a `127.0.0.1:8082`.

Fatto e verificato:

- container: `Host: amonenergy.it` → `200` senza `X-Robots-Tag`,
  `Host: www.amonenergy.it` → `301 https://amonenergy.it/`
- vhost `/etc/nginx/sites-available/amonenergy-produzione` sull'host
- crawl dei 28 vecchi URL + `/?lang=en` + i 4 invariati + `/wp-admin/` `410`:
  34 controlli su 34 OK, contro il server nuovo con `Host: amonenergy.it`
- record A di `amonenergy.it` e `www` → `108.128.213.53` (TTL 3600, il
  minimo accettato da SiteGround); nessun AAAA né CAA che interferisse
- certificato Let's Encrypt per `amonenergy.it` + `www` (scadenza 23/12/2026,
  rinnovo automatico di certbot)
- OAuth App spostata su `https://amonenergy.it/oauth/callback`,
  `ALLOWED_ORIGIN=https://amonenergy.it` in Portainer, login `/admin` riuscito
- `test.amonenergy.it` dismesso: record DNS, vhost e certificato rimossi

Ancora aperti: i punti della sezione 0 (GA4, M5500, indirizzo, tre fatti),
Search Console (punti 4 e 9 della sezione 3), i controlli della sezione 4.
Ritocchi non bloccanti al vhost dell'host: `http2`, HSTS, e il doppio salto
`http://www` → `https://www` → `https://amonenergy.it`.

## 0. Tre punti aperti, da chiudere prima del cutover (non rimandabili)

Emersi durante il lavoro di migrazione SEO e mai risolti in codice perché
richiedono un'informazione che solo il cliente ha.

- [ ] **Measurement ID GA4 reale.** `src/data/analytics.ts` contiene ancora
  il segnaposto `G-XXXXXXXXXX`. Finché resta così, `analyticsAttivo` è
  `false` e lo script di Google Analytics non viene emesso: **zero dati**
  raccolti, anche a sito live. Sostituire la costante `GA4_ID` con il
  Measurement ID reale fornito dal cliente, poi `npm run build` per
  rigenerare l'HTML (la build è statica, non basta cambiare una variabile
  d'ambiente sul container).
  **A cura di: sviluppatore**, con il Measurement ID fornito dal **cliente**.

- [ ] **Analizzatore M5500: è strumentazione di proprietà Amon Energy?**
  Il vecchio sito nomina l'analizzatore M5500 (Doble) nella pagina SFRA. Sul
  nuovo sito non è stato nominato perché non risultava nell'elenco
  strumentazione di `src/content/pagine/azienda.yaml` (dieci voci: Centrix
  2.0, Megger HV Test 80 kV, b2 HVA68TD+PD, DRTS/64, ISA CBA 1000, ISA T2000,
  ISA STS5000 + TD500, OTDR 8000MAX-Q1, INNO View 7, termocamere HT VEGA 74).
  Se il cliente conferma che l'M5500 è di sua proprietà (e non dello
  strumentista che ha eseguito la prova a Banzi), va aggiunto sia alla scheda
  tecnica SFRA (`src/content/servizi-dettaglio/it/sfra.md` ed equivalente
  EN) sia a `azienda.yaml`, altrimenti le due pagine restano incoerenti fra
  loro. **A cura di: cliente** (la conferma), **sviluppatore** (l'eventuale
  modifica al contenuto).

- [ ] **Indirizzo dichiarato: è quello corretto?** Il sito riporta ovunque
  (JSON-LD `PostalAddress`, mappa di contatto, footer) "Via Roma 105, 71025
  Castelluccio dei Sauri (FG)", con coordinate GPS `41.30579, 15.48281` —
  dato mai verificato con una fonte del cliente durante questa migrazione,
  solo riportato dal contenuto esistente. Un indirizzo sbagliato in un
  `LocalBusiness` schema è un problema NAP (Name-Address-Phone) che danneggia
  sia la SEO locale sia la fiducia dell'utente. Verificare civico, CAP e
  coordinate prima del go-live. **A cura di: cliente** (la conferma),
  **sviluppatore** (l'eventuale correzione in `src/components/ContactMap.astro`,
  nei blocchi JSON-LD e in `src/content/pagine/*/azienda.yaml`).

- [ ] **Tre affermazioni aziendali da validare per iscritto col cliente.**
  `src/content/pagine/{it,en}/azienda.yaml` e `{it,en}/home.yaml` affermano
  «oltre 100 stazioni AT/MT realizzate», «contratti O&M su più di 30
  impianti» e «acquisizione da parte del Gruppo BayWa r.e. nel 2019». I
  commenti sopra quei campi nel contenuto dicono già che vanno validati
  prima del go-live: qui si formalizza. In particolare il riferimento a
  **BayWa r.e.** nomina un terzo per nome — un'affermazione pubblica errata
  su un'acquisizione societaria è un rischio reputazionale e potenzialmente
  legale che va oltre la SEO. Non pubblicare senza conferma scritta del
  cliente su tutti e tre i fatti. **A cura di: cliente** (la conferma),
  **sviluppatore** (l'eventuale correzione dei quattro file se il cliente
  smentisce qualcosa).

---

## 1. Verifiche da fare con il vecchio sito ancora online

Da eseguire quando serve un Docker funzionante (in questo lavoro non è
stato possibile: il daemon non risponde — `failed to connect to the docker
API at npipe:////./pipe/dockerDesktopLinuxEngine`). Rifare tutte le voci di
questa sezione con Docker attivo, **prima** di abbassare il TTL DNS.

- [ ] **Suite automatica verde.**
  ```
  npm run build && npm test
  ```
  Atteso: tutti i test passano, **un solo** test saltato (GA4 dietro
  consenso, finché `GA4_ID` è il segnaposto — vedi punto 0). Se ne risulta
  saltato un secondo, o uno fallisce, **non procedere**: indagare prima.
  **A cura di: sviluppatore.**

- [ ] **`nginx -t` sulla configurazione reale.** `docker/nginx.conf` fa
  quattro volte `include /etc/nginx/snippets/security-headers.conf`
  (righe 204, 276, 292, 324): senza montare anche quel file, `nginx -t`
  non fallisce per un errore di sintassi ma per un file mancante, un esito
  fuorviante da non scambiare per un problema di configurazione. Il
  prefisso `MSYS_NO_PATHCONV=1` serve solo su Windows con Git Bash: senza
  quello, MSYS riscrive i due punti nei percorsi `-v host:container` e i
  mount falliscono (su macOS/Linux è innocuo ometterlo, ma anche lasciarlo
  non fa danno).
  ```
  MSYS_NO_PATHCONV=1 docker run --rm \
    -v "$(pwd)/docker/nginx.conf:/etc/nginx/conf.d/site.conf:ro" \
    -v "$(pwd)/docker/snippets/security-headers.conf:/etc/nginx/snippets/security-headers.conf:ro" \
    nginx:1.27-alpine nginx -t
  ```
  Atteso: `nginx: configuration file /etc/nginx/nginx.conf test is successful`.
  **A cura di: sviluppatore.**

- [ ] **⚠️ CRITICO — dominio nudo non deve fare redirect su se stesso.**
  `nginx -t` sopra verifica solo la sintassi, non l'ordine dei blocchi
  `server`: non basta. Con il container nginx in esecuzione (es. sullo
  stack di staging su `localhost:8082`), lanciare:
  ```
  curl -i -H 'Host: amonenergy.it' http://localhost:8082/
  ```
  Atteso: **`200`**. Se risponde **`301`**, il default server di nginx è
  ricaduto sul blocco `www.amonenergy.it` invece che su quello con
  `server_name _; listen 80 default_server;`, e il dominio nudo va in loop
  di redirect infinito su tutto il sito — un incidente totale, non parziale.
  Questo è **l'unico controllo che lo intercetta**: `nginx -t` passa lo
  stesso anche con l'ordine sbagliato. **A cura di: sviluppatore.**

- [ ] **Build reale in un container locale.** `docker-compose.yml` rende
  obbligatorie tre variabili sul servizio `cms-auth` (`ALLOWED_ORIGIN`,
  `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` — tutte con
  `:?` nel file, quindi senza un `.env` `docker compose up` si rifiuta di
  partire, con o senza `-d web`: compose valida l'intero file, non solo il
  servizio richiesto). Per le sole verifiche di questa sezione (redirect,
  header, non il login del pannello) bastano valori qualsiasi purché non
  vuoti:
  (comandi singoli, non un heredoc: incollati da un elenco puntato,
  l'indentazione del blocco non deve finire dentro il file)
  ```
  echo "HTTP_PORT=8080" > .env
  echo "ALLOWED_ORIGIN=http://localhost:8080" >> .env
  echo "GITHUB_OAUTH_CLIENT_ID=verifica-locale" >> .env
  echo "GITHUB_OAUTH_CLIENT_SECRET=verifica-locale" >> .env
  docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d web
  ```
  Atteso: il container `web` parte e resta `Up` (non riavvia in loop —
  verificare con `docker compose ps` qualche minuto dopo). **Non
  riutilizzare** questo `.env` per il login reale del pannello: le
  credenziali OAuth sono finte, servono solo a far partire lo stack.
  **A cura di: sviluppatore.**

- [ ] **Crawl completo dei 28 vecchi URL WordPress.** Scrivere uno script
  temporaneo nella cartella scratchpad (non nel repository) che, per
  ciascuno dei 27 URL in `VECCHI_URL` di `test/redirects.test.mjs` più
  `/?lang=en`, segua i redirect contando i salti e verifichi: esattamente
  un `301`, stato finale `200`, destinazione uguale a quella della mappa
  in `docker/nginx.conf`. Per i 4 URL invariati (`/`, `/azienda/`,
  `/contatti/`, `/privacy-policy/`): `200` diretto, zero salti. Esempio
  rapido con `curl` per un sottoinsieme (estendere a tutti e 28 prima di
  fidarsi):
  ```
  for u in / /?lang=en /verifiche-strumentali/sfra/ /company/ /foto-video/ /wp-admin/ /our-job/ /centrix-2-0/; do
    echo "$u -> $(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "http://localhost:8080$u")"
  done
  ```
  Atteso riga per riga: `/` → `200` senza redirect_url; `/?lang=en` →
  `301 /en/`; `/verifiche-strumentali/sfra/` → `301 /servizi/sfra/`;
  `/company/` → `301 /en/company/`; `/foto-video/` → `301 /lavori/`;
  `/wp-admin/` → `410`; `/our-job/` → `301 /en/services/`; `/centrix-2-0/`
  → `301 /en/services/#ingegneria-elettrica`. Stampare una tabella
  completa con tutti e 28. **Cancellare lo script al termine** — non deve
  finire nel repository.
  **A cura di: sviluppatore.**

- [ ] **`X-Robots-Tag` per host — la verifica che azzera tutto il lavoro
  se salta.**
  ```
  curl -sI -H 'Host: amonenergy.it' http://localhost:8080/ | grep -i x-robots-tag
  curl -sI -H 'Host: test.amonenergy.it' http://localhost:8080/ | grep -i x-robots-tag
  ```
  Atteso: **nessuna riga** per `amonenergy.it` (l'header non deve
  comparire affatto, non deve comparire vuoto); `x-robots-tag: noindex,
  nofollow` per `test.amonenergy.it`. Verificato staticamente in questo
  lavoro leggendo `docker/nginx.conf` (`map $host $robots_tag { default
  "noindex, nofollow"; amonenergy.it ""; }` — nginx omette un
  `add_header` il cui valore è stringa vuota): la logica è corretta sulla
  carta, ma va confermata a runtime prima di fidarsene in produzione.
  **A cura di: sviluppatore.**

- [ ] **Dati strutturati — Rich Results Test di Google (richiede un
  browser).** Passare l'URL di ciascuna delle quattro pagine al Rich
  Results Test (`https://search.google.com/test/rich-results`):
  - `https://amonenergy.it/` (o l'URL del container di test)
  - `https://amonenergy.it/azienda/`
  - `https://amonenergy.it/servizi/sfra/`
  - `https://amonenergy.it/en/services/sfra/`

  Atteso: zero errori; avvisi su proprietà raccomandate mancanti sono
  accettabili. In questo lavoro è stata fatta solo la validazione statica
  (sintassi JSON e struttura dei campi obbligatori per `Organization`,
  `WebSite`, `BreadcrumbList`, `Service`, `FAQPage`): tutti e cinque i
  blocchi, su tutte e quattro le pagine, sono JSON valido con i campi
  richiesti presenti — ma questo non sostituisce il Rich Results Test
  reale, che verifica anche l'idoneità ai rich snippet, non solo la
  sintassi. **A cura di: sviluppatore o cliente**, chiunque abbia un
  browser a disposizione il giorno della verifica.

- [ ] **QA manuale di contenuto** (dal README, mai automatizzato):
  `npx astro check`, test manuale di tutti i link `tel:`/`mailto:`,
  Lighthouse mobile (obiettivo ≥95), verifica visiva a 360/390/768/1024/1440px.
  **A cura di: sviluppatore.**

---

## 2. 24 ore prima del passaggio: TTL DNS

- [ ] **Abbassare il TTL del record DNS di `amonenergy.it`** (e di `www`,
  se ha un record proprio) a un valore breve, ad esempio 300 secondi (5
  minuti), almeno 24 ore prima del cambio effettivo. Un TTL basso fa sì
  che, quando il record cambia il giorno dello switch, i resolver di tutto
  il mondo lo aggiornino in minuti invece che nelle ore o nei giorni del
  TTL attuale (spesso 3600-86400s). **A cura di: cliente** (è lui che
  controlla il pannello DNS — nessuno sviluppatore ha accesso).

  Verifica del TTL attuale, eseguibile da chiunque. `dig` non è installato
  di default su Windows (nemmeno dentro Git Bash): il comando universale
  è `nslookup` con `-debug`, che su Windows è un eseguibile di sistema
  (`C:\Windows\System32\nslookup.exe`) e funziona identico da Git Bash,
  da `cmd` o da PowerShell; su macOS/Linux, se disponibile, `dig
  amonenergy.it +noall +answer` dà la stessa informazione in un formato
  più compatto.
  ```
  nslookup -debug amonenergy.it
  ```
  Atteso: fra le righe `ANSWERS`, una voce `ttl = ...` già bassa (≤300
  secondi) almeno 24 ore prima dello switch.

---

## 3. Il giorno del passaggio — sequenza operativa

Eseguire nell'ordine. Non saltare voci.

- [ ] **1. Ultima ricontrollata della sezione 1**, se sono passati più di
  pochi giorni da quando è stata fatta l'ultima volta (in particolare
  `npm test` e il crawl dei 28 URL): il codice potrebbe essere cambiato nel
  frattempo. **A cura di: sviluppatore.**

- [ ] **2. Aggiornare le variabili d'ambiente dello stack Portainer per il
  dominio di produzione.** `ALLOWED_ORIGIN` deve passare da
  `https://test.amonenergy.it` a `https://amonenergy.it` (vedi
  `.env.example` e README, sezione "Primo deploy in Portainer"). Da questa
  variabile `cms-auth` deriva la `redirect_uri` OAuth: se non combacia
  esattamente con la Authorization callback URL della GitHub OAuth App, il
  login del pannello `/admin` si rompe silenziosamente.
  **A cura di: sviluppatore** (ha accesso a Portainer).

- [ ] **3. Verificare o creare una GitHub OAuth App per il dominio di
  produzione** (Settings → Developer settings → OAuth Apps), con
  Authorization callback URL `https://amonenergy.it/oauth/callback`, e
  aggiornare `GITHUB_OAUTH_CLIENT_ID`/`GITHUB_OAUTH_CLIENT_SECRET` nello
  stack se è un'app diversa da quella di test. **A cura di: sviluppatore.**

- [ ] **4. Record TXT di verifica per Google Search Console (dominio, non
  prefisso URL).** Aggiungere in Search Console una nuova proprietà a
  dominio per `amonenergy.it`, copiare il record TXT che Google fornisce e
  pubblicarlo nel pannello DNS. **A cura di: cliente** — solo lui ha
  accesso sia a Search Console sia al DNS; nessuno sviluppatore può farlo
  al posto suo.

  Verifica di propagazione, eseguibile da chiunque dopo la pubblicazione
  (`nslookup`, non `dig` — vedi nota sulla sezione 2 sul perché):
  ```
  nslookup -type=TXT amonenergy.it
  ```
  Atteso: il record TXT fornito da Search Console compare nell'output.
  Poi, in Search Console, cliccare "Verifica": esito atteso "Proprietà
  verificata".

- [ ] **5. Cambio del DNS** (record A o CNAME di `amonenergy.it`, e di
  `www.amonenergy.it` se separato) verso l'host che serve il nuovo sito
  Astro. **A cura di: cliente esclusivamente** — è lui il titolare del
  pannello DNS.

- [ ] **6. Verifica del nuovo sito prima ancora che il DNS sia propagato
  ovunque**, puntando alla nuova macchina prima che il DNS pubblico la
  restituisca. **Non** usare `curl -H 'Host: ...' https://<IP>/`: su
  HTTPS l'header `Host` non basta, perché l'handshake TLS (SNI) e la
  verifica del certificato avvengono contro l'IP letterale, non contro il
  nome che si vuole testare — il certificato è per `amonenergy.it`, non
  per un IP, e la richiesta fallisce per un errore di certificato che non
  c'entra nulla con il sito. Il modo corretto è `--resolve`, che dice a
  curl di usare quell'IP per quel nome mantenendo SNI e verifica del
  certificato coerenti:
  ```
  curl -sI --resolve amonenergy.it:443:<NUOVO_IP> https://amonenergy.it/ | head -5
  ```
  Atteso: `HTTP/2 200`, nessun `x-robots-tag` nella risposta.
  **A cura di: sviluppatore.**

- [ ] **7. Verifica di propagazione DNS globale.** `dig` non è installato
  di default su Windows: usare `nslookup`, indicando il server DNS da
  interrogare come secondo argomento (equivalente di `dig @host`).
  ```
  nslookup amonenergy.it
  nslookup amonenergy.it 8.8.8.8
  nslookup amonenergy.it 1.1.1.1
  ```
  (su macOS/Linux, se disponibile, `dig amonenergy.it +noall +answer` e
  `dig @8.8.8.8 amonenergy.it` danno la stessa informazione). Atteso:
  tutti i resolver interrogati restituiscono il nuovo IP. Con TTL basso
  (sezione 2), la propagazione dovrebbe essere quasi completa entro 15-30
  minuti dal cambio.
  **A cura di: sviluppatore o cliente.**

- [ ] **8. Verifica finale via dominio pubblico, una volta propagato.**
  ```
  curl -sI https://amonenergy.it/ | grep -i x-robots-tag
  curl -sI https://www.amonenergy.it/ | head -5
  curl -sI https://amonenergy.it/wp-admin/ | head -1
  ```
  Atteso: prima riga nessun output (nessun `x-robots-tag` su
  `amonenergy.it`); seconda riga `HTTP/2 301` con redirezione al dominio
  nudo; terza riga `HTTP/2 410`.
  **A cura di: sviluppatore.**

- [ ] **9. Invio della sitemap a Google Search Console.** Nella proprietà
  appena verificata (punto 4), Sitemap → aggiungi `sitemap-index.xml`.
  **A cura di: cliente** — richiede l'accesso alla proprietà Search
  Console appena creata, che è sua.

- [ ] **10. Invio della sitemap a Bing Webmaster Tools** (opzionale ma
  consigliato, stesso principio del punto 9, un'altra proprietà con
  un altro accesso). **A cura di: cliente.**

- [ ] **11. Monitorare i log di errore del container per la prima ora.**
  Il nome esatto del container dipende dal nome dato allo stack in
  Portainer (il progetto compose si chiama `amonenergy`, quindi in un
  `docker compose up` locale il container è di norma `amonenergy-web-1`,
  ma in Portainer può differire): trovarlo prima con un filtro invece di
  indovinarlo.
  ```
  docker ps --filter "name=web" --format "{{.Names}}"
  docker logs -f --tail 200 <nome-restituito-sopra>
  ```
  Atteso: nessun errore 5xx ricorrente, nessun crash-loop.
  **A cura di: sviluppatore.**

- [ ] **12. Verificare che il pannello `/admin` sia raggiungibile e il
  login funzioni sul dominio di produzione**, aprendo
  `https://amonenergy.it/admin` e completando un login di prova con
  l'account GitHub collaboratore. Atteso: login riuscito, nessun redirect
  verso `api.netlify.com` (sintomo di `base_url` non riscritto — vedi
  README, "L'indirizzo di login del pannello segue l'host").
  **A cura di: sviluppatore.**

---

## 4. Controlli dopo il passaggio

### A 24 ore

- [ ] **Il sito risponde stabilmente sul dominio di produzione.**
  ```
  curl -sI https://amonenergy.it/ | head -1
  ```
  Atteso: `HTTP/2 200`, in modo continuativo (nessun timeout, nessun 5xx
  intermittente). **A cura di: sviluppatore.**

- [ ] **Google Search Console: copertura indice.** Aprire la sezione
  "Pagine" della proprietà a dominio: atteso nessun errore bloccante nelle
  prime 24 ore (è normale che la maggior parte delle 30 pagine risulti
  ancora "Rilevata, attualmente non indicizzata" — serve tempo). **A cura
  di: cliente** (accesso alla proprietà) con lettura di supporto dello
  **sviluppatore**.

- [ ] **GA4 in tempo reale mostra visite**, a conferma che il Measurement
  ID reale (punto 0) è stato effettivamente inserito e la build
  rigenerata. **A cura di: cliente o sviluppatore.**

### A 7 giorni

- [ ] **Ricontrollare il crawl dei 28 vecchi URL, questa volta sul dominio
  pubblico** (stesso script della sezione 1, puntato su
  `https://amonenergy.it` invece che su `localhost`). Atteso: stessi
  risultati della verifica pre-cutover. **A cura di: sviluppatore.**

- [ ] **Google Search Console → Copertura**: gli URL redirected (i 28
  vecchi) devono iniziare a comparire come "Pagina con reindirizzamento",
  non come "Errore 404" o "Soft 404". Le 30 pagine nuove devono iniziare a
  comparire come "Indicizzata" o quantomeno "Rilevata". **A cura di:
  cliente**, con lettura di supporto dello **sviluppatore**.

- [ ] **Confrontare il traffico organico settimana su settimana** in GA4
  o Search Console. Un calo è atteso in questa finestra (vedi nota in
  testa al documento) — non agire d'istinto: prima verificare che i punti
  sopra (redirect, indicizzazione) siano a posto. Se lo sono, il calo è
  fisiologico. **A cura di: cliente.**

### A 30 giorni

- [ ] **Google Search Console → Copertura**: la maggior parte delle 30
  pagine dovrebbe risultare "Indicizzata". Investigare singolarmente
  qualunque pagina rimasta esclusa oltre questa finestra. **A cura di:
  cliente**, con lettura di supporto dello **sviluppatore**.

- [ ] **Google Search Console → Collegamenti**: verificare che i backlink
  esterni noti (se il cliente ne ha un elenco) puntino, dopo il passaggio
  attraverso i redirect, a pagine con `200`, non a pagine morte. **A cura
  di: cliente.**

- [ ] **Confronto traffico organico con il mese precedente il cutover.**
  A questo punto un calo persistente (oltre il rumore fisiologico delle
  prime settimane) è un segnale reale da indagare: posizionamento parole
  chiave in Search Console, pagine con calo di click sproporzionato,
  eventuali redirect mancanti scoperti nel frattempo. **A cura di:
  cliente**, con supporto dello **sviluppatore** per la parte tecnica.

### A 90 giorni

- [ ] **Il traffico organico si è stabilizzato o è tornato ai livelli
  pre-migrazione.** Se non è così, è il momento di un'analisi approfondita
  (non più imputabile alla normale transizione): confronto keyword per
  keyword tra la Search Console pre e post migrazione (se il cliente ha
  conservato i dati storici), controllo dei featured snippet persi,
  controllo dei rich result (i JSON-LD validati al punto 1 devono ancora
  comparire come rich result reali in SERP). **A cura di: cliente**, con
  supporto dello **sviluppatore**.

- [ ] **Rimuovere/disattivare la vecchia proprietà WordPress da Search
  Console** solo a questo punto, non prima: mantenerla attiva più a lungo
  permette di continuare a vedere se Google manda ancora traffico a URL
  vecchi non coperti da un redirect (segnale che nella mappa manca ancora
  qualcosa). **A cura di: cliente.**

- [ ] **Chiudere formalmente i tre punti aperti della sezione 0**, se non
  già fatto nelle settimane precedenti: rileggere per confermare che
  Measurement ID, M5500 e indirizzo siano tutti risolti e non più segnati
  come aperti da nessuna parte nel repository.
  **A cura di: sviluppatore.**
