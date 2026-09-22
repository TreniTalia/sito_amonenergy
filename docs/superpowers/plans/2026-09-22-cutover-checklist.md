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

- [ ] **`nginx -t` sulla configurazione reale.**
  ```
  docker run --rm -v "$(pwd)/docker/nginx.conf:/etc/nginx/conf.d/site.conf:ro" nginx:1.27-alpine nginx -t
  ```
  Atteso: `nginx: configuration file /etc/nginx/nginx.conf test is successful`.
  **A cura di: sviluppatore.**

- [ ] **Build reale in un container locale.**
  ```
  docker compose -f docker-compose.yml -f docker-compose.build.yml up --build -d web
  ```
  Atteso: il container `web` parte e resta `Up` (non riavvia in loop —
  verificare con `docker compose ps` qualche minuto dopo).
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

  Verifica del TTL attuale, eseguibile da chiunque:
  ```
  dig amonenergy.it +noall +answer
  ```
  Atteso: la colonna del TTL (il numero prima di `IN A`) è già bassa
  (≤300) almeno 24 ore prima dello switch.

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

  Verifica di propagazione, eseguibile da chiunque dopo la pubblicazione:
  ```
  dig TXT amonenergy.it +noall +answer
  ```
  Atteso: il record TXT fornito da Search Console compare nell'output.
  Poi, in Search Console, cliccare "Verifica": esito atteso "Proprietà
  verificata".

- [ ] **5. Cambio del DNS** (record A o CNAME di `amonenergy.it`, e di
  `www.amonenergy.it` se separato) verso l'host che serve il nuovo sito
  Astro. **A cura di: cliente esclusivamente** — è lui il titolare del
  pannello DNS.

- [ ] **6. Verifica del nuovo sito prima ancora che il DNS sia propagato
  ovunque**, puntando `curl` direttamente al nuovo IP con l'header `Host`
  (bypassa il DNS, utile nei primi minuti quando alcuni resolver
  restituiscono ancora il vecchio IP):
  ```
  curl -sI -H 'Host: amonenergy.it' https://<NUOVO_IP>/ | head -5
  ```
  Atteso: `HTTP/2 200`, nessun `x-robots-tag` nella risposta.
  **A cura di: sviluppatore.**

- [ ] **7. Verifica di propagazione DNS globale.**
  ```
  dig amonenergy.it +noall +answer
  ```
  (ripetere da reti/DNS diversi se possibile — es. `dig @8.8.8.8
  amonenergy.it`, `dig @1.1.1.1 amonenergy.it`) Atteso: tutti i resolver
  interrogati restituiscono il nuovo IP. Con TTL basso (sezione 2), la
  propagazione dovrebbe essere quasi completa entro 15-30 minuti dal
  cambio.
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
  ```
  docker logs -f --tail 200 <nome-container-web>
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
