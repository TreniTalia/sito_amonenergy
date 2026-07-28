# Sito Amon Energy S.r.l.

Sito vetrina statico B2B per Amon Energy — Astro 5 + Tailwind 4, contenuti editabili
da pannello, deploy come stack Docker su Portainer. Vedi `SPEC_sito_amonenergy.md`
per la spec costruttiva completa, `PRODUCT.md`/`DESIGN.md` per il contesto
strategico e visivo, `docs/CMS-SETUP.md` per il setup del pannello `/admin`.

## Comandi

| Comando | Azione |
| :--- | :--- |
| `npm install` | Installa le dipendenze |
| `npm run dev` | Avvia il dev server su `localhost:4321` |
| `npm run build` | Build di produzione in `./dist/` |
| `npm run preview` | Anteprima locale della build di produzione |
| `npx astro check` | Type-check di tutto il progetto |

## Struttura

```
src/
├── components/       # Header, Footer, CtaBand, componenti gallery, ecc.
├── layouts/Base.astro
├── pages/            # Routing basato su file
├── content/          # Content Collections: progetti, servizi, pagine
├── data/             # contatti.ts, clienti.ts — dati non editabili da CMS
└── styles/global.css # Design tokens (Tailwind 4 @theme)
public/
├── admin/            # Pannello Sveltia CMS (statico, servito su /admin)
└── docs/             # PDF/documenti pubblici (rendicontazione contributi, ecc.)

Dockerfile                     # Immagine del sito: build Astro -> nginx
docker/nginx.conf              # Redirect 301, 404 custom, cache, proxy /oauth/
docker/snippets/               # Header di sicurezza inclusi da nginx.conf
services/cms-auth/             # Backend OAuth del pannello (Node, zero dipendenze)
docker-compose.yml             # Stack Portainer (immagini da GHCR)
docker-compose.build.yml       # Override per costruire in locale
.env.example                   # Variabili dello stack, HTTP_PORT incluso
.github/workflows/deploy.yml   # CI/CD: build immagini -> GHCR -> webhook Portainer
docs/CMS-SETUP.md              # Setup OAuth del pannello /admin (passaggi manuali)
```

## Deploy (stack Docker su Portainer)

Lo stack ha due servizi:

| Servizio | Immagine | Ruolo |
| :--- | :--- | :--- |
| `web` | `ghcr.io/trenitalia/sito_amonenergy-web` | nginx con la build statica + il pannello. **L'unico con una porta pubblicata**: `HTTP_PORT` → 80. |
| `cms-auth` | `ghcr.io/trenitalia/sito_amonenergy-cms-auth` | Backend OAuth del pannello. Nessuna porta pubblicata: `web` gli fa da reverse proxy su `/oauth/`. |

Davanti allo stack c'è il reverse proxy dell'host, che termina il TLS su
`amonenergy.it` e inoltra su `HTTP_PORT` (in produzione: **8082**).

### Primo deploy in Portainer

1. **Stacks → Add stack**, sorgente *Repository*: `https://github.com/TreniTalia/sito_amonenergy`,
   compose path `docker-compose.yml`.
2. Compila le **Environment variables** (vedi `.env.example` per la descrizione
   di ciascuna):

   | Variabile | Valore in produzione |
   | :--- | :--- |
   | `HTTP_PORT` | `8082` |
   | `ALLOWED_ORIGIN` | `https://amonenergy.it` |
   | `GITHUB_OAUTH_CLIENT_ID` | dalla GitHub OAuth App — vedi `docs/CMS-SETUP.md` |
   | `GITHUB_OAUTH_CLIENT_SECRET` | idem |
   | `IMAGE_TAG` | `latest` |

3. Se il package GHCR è **privato**, registra prima la credenziale in
   Portainer (*Registries → Add registry → Custom*, host `ghcr.io`, username il
   tuo utente GitHub, password un PAT con scope `read:packages`). Con il package
   pubblico non serve nulla.
4. Attiva il **webhook** dello stack (nella pagina dello stack) e incolla l'URL
   generato fra i secrets del repository come `PORTAINER_WEBHOOK_URL`.

### Pubblicazione automatica (motore del pannello /admin)

```
push su main  (a mano, o generato da un salvataggio nel pannello /admin)
   └─> GitHub Actions: build delle due immagini -> push su GHCR (:latest e :<sha>)
       └─> POST al webhook Portainer
           └─> Portainer ri-pulla :latest e ricrea lo stack
```

Un solo secret nel repository: `PORTAINER_WEBHOOK_URL`. Per GHCR basta il
`GITHUB_TOKEN` che Actions fornisce da sé. Se il secret manca, il workflow
costruisce e pubblica comunque le immagini e chiude con un warning: lo stack va
poi aggiornato a mano da Portainer.

Tempo dal salvataggio alla pagina live: circa 2-3 minuti. Nessuna purge di cache
da fare — l'HTML è servito `no-store`.

> **Se il tuo è un edge stack**, i webhook non sono disponibili: in quel caso usa
> il polling *GitOps updates* di Portainer sul repository al posto della
> chiamata webhook, e rimuovi il job `deploy` dal workflow.

### Build e verifica in locale

```bash
cp .env.example .env     # e metti HTTP_PORT=8082
docker compose -f docker-compose.yml -f docker-compose.build.yml up --build
```

Il sito risponde su `http://localhost:8082`. `docker-compose.yml` da solo non
costruisce nulla: usa le immagini di GHCR, perché è il file che Portainer
deploya e una chiave `build:` senza il repository a disposizione lo farebbe
fallire.

### Redirect, cache e 404

Erano in `public/.htaccess` (Apache), ora sono in **`docker/nginx.conf`**:
i 9 redirect 301 dai vecchi URL WordPress, `error_page 404`, e le regole di
cache (`/_astro/` immutable a 1 anno, HTML `no-store`). Il `.htaccess` è stato
eliminato: con nginx non farebbe nulla e resterebbe una falsa fonte di verità.

## Pannello /admin (editing contenuti)

Un editor non tecnico può aggiungere progetti alla galleria e modificare i testi
delle pagine da `/admin`, senza toccare codice o git:

1. Vai su `https://amonenergy.it/admin` e accedi con il tuo account GitHub
   (deve essere collaboratore della repository — vedi `docs/CMS-SETUP.md` per il
   setup una tantum richiesto prima che questo funzioni).
2. **Per aggiungere un progetto alla galleria**: collection "Progetti" → New Progetto
   → compila titolo, kV, committente, provincia, tipologia, carica la foto, scrivi
   2-3 righe di descrizione, imposta l'ordine → Salva. Il progetto compare in fondo
   alla galleria rispettando automaticamente il ritmo editoriale della griglia.
3. **Per cambiare un testo della home** (o di Azienda/Contatti/hub Servizi):
   collection "Pagine" → scegli la pagina → modifica il campo → Salva.
4. Ogni salvataggio crea un commit diretto su `main` (nessun flusso di revisione:
   due editor interni, complessità inutile) e il deploy automatico pubblica la
   modifica in circa 2-3 minuti.
5. Il logo bianco Amon Energy in alto a sinistra nel pannello riporta alla lista
   delle collection.

**Nota**: `/admin` non è utilizzabile finché non completi il setup OAuth descritto
in `docs/CMS-SETUP.md` — sono tre passaggi che richiedono il tuo account GitHub
(creare la OAuth App, passarne le credenziali allo stack, aggiungere l'editor come
collaboratore).

## Cose da fare prima del go-live

Elementi segnati come placeholder nel codice, che uno sviluppatore o il cliente
deve sostituire prima di andare live (vedi anche i commenti `[DATO DA CONFERMARE]`
e `<!-- DATO-FINTO -->` nel codice/contenuti):

- **Logo e favicon**: sostituire `public/favicon.svg` e il wordmark testuale in
  `Header`/`Footer` con il logo vettoriale reale (versione blu e bianca).
- **Fotografie**: tutte le immagini sono placeholder SVG navy con etichetta
  (`src/assets/img/**`) — sostituire con le foto reali elencate nella spec §7.
- **StatBar** (`src/content/pagine/home.yaml`): 3 dei 4 numeri sono segnaposto
  (`finto: true`) — sostituire con i dati reali del cliente.
- **Missione aziendale** (`src/content/pagine/azienda.yaml`): testo redatto dai
  soli fatti presenti nello spec, non è testo brochure verbatim — da far validare.
- **Privacy Policy** (`src/pages/privacy-policy.astro`): bozza minima, non
  revisionata da un legale — non pubblicare senza validazione.
- **Dati mancanti nella galleria progetti**: kV e/o committente di alcuni progetti
  sono marcati `[DATO DA CONFERMARE]` (vedi `src/content/progetti/*.md`).
- **PDF rendicontazione contributi pubblici**: `public/docs/rendicontazione-contributi-pubblici.txt`
  è un segnaposto — recuperare il PDF originale dal sito attuale e sostituirlo
  (aggiornando anche il link nel footer da `.txt` a `.pdf`).
- **Dominio di produzione**: `astro.config.mjs` usa `https://amonenergy.it` — confermare
  che sia corretto (apex, non `www`) prima del deploy.
- **Setup CMS**: vedi `docs/CMS-SETUP.md` per l'autenticazione del pannello `/admin`
  (GitHub OAuth App + variabili dello stack). Finché non è fatto, `/admin` non
  consente il login.
- **Webhook Portainer**: creare il webhook dello stack e salvarlo come secret
  `PORTAINER_WEBHOOK_URL` nel repository, altrimenti la pubblicazione dal
  pannello si ferma su GHCR e va completata a mano.
- **QA pre-deploy**: `npx astro check`, test manuale di tutti i link `tel:`/`mailto:`,
  Lighthouse mobile (obiettivo ≥95), verifica visiva a 360/390/768/1024/1440px.
