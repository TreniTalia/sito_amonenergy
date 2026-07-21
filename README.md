# Sito Amon Energy S.r.l.

Sito vetrina statico B2B per Amon Energy — Astro 5 + Tailwind 4, contenuti editabili
da pannello, deploy automatico su SiteGround. Vedi `SPEC_sito_amonenergy.md` per la
spec costruttiva completa, `PRODUCT.md`/`DESIGN.md` per il contesto strategico e
visivo, `docs/CMS-SETUP.md` per il setup del pannello `/admin`.

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
├── admin/            # Pannello Sveltia CMS
├── .htaccess         # Redirect 301 + cache, versionato qui (Astro lo copia in dist/)
└── docs/              # PDF/documenti pubblici (rendicontazione contributi, ecc.)
.github/workflows/deploy.yml   # CI/CD: build + deploy SFTP su push a main
docs/CMS-SETUP.md              # Setup OAuth del pannello /admin (passaggi manuali)
```

## Deploy

### Automatico (CI/CD — motore del pannello /admin)

Ogni push su `main` (manuale o generato dal pannello `/admin`) attiva
`.github/workflows/deploy.yml`: `npm ci && npm run build` seguito da un deploy SFTP
su `public_html/`. Prima del primo deploy automatico, configura questi **secrets**
nel repository GitHub (Settings → Secrets and variables → Actions):

| Secret | Valore |
| :--- | :--- |
| `SFTP_HOST` | Host SFTP (Site Tools → Devs → FTP Accounts su SiteGround) |
| `SFTP_USER` | Utente SFTP |
| `SFTP_PASS` | Password SFTP |
| `SFTP_PORT` | Porta (spesso 22, ma SiteGround può usarne una diversa — verificare in Site Tools) |

Il workflow usa `wlixcc/SFTP-Deploy-Action` per il vero protocollo SFTP (non FTP/FTPS
— vedi il commento nel workflow stesso per i dettagli). **Verifica i nomi esatti
degli input dell'azione contro il suo README prima del primo run reale**, non sono
stati testati contro un deploy live.

Dopo l'upload, il workflow non esegue una purge automatica della cache SiteGround
(dipende dal piano attivo se l'API SG Optimizer è disponibile). Fallback manuale:
**Site Tools → Speed → Caching → Purge** (un click). Senza purge, le modifiche fatte
dal pannello `/admin` non si vedono subito e sembra che il pannello sia rotto.

### Manuale (fase 1 / fallback)

```bash
npm run build          # genera dist/
```

1. Accedi a SiteGround → Site Tools → **File Manager** (o SFTP).
2. Backup: rinomina l'attuale `public_html` in `public_html_wp_backup`, ricrea
   `public_html` vuota.
3. Carica **il contenuto** di `dist/` (non la cartella stessa) in `public_html/`.
4. `.htaccess` è già incluso in `dist/` (versionato in `public/.htaccess`) — nessuna
   azione manuale necessaria oltre al caricamento.
5. In Site Tools: attiva **SSL Let's Encrypt** + HTTPS Enforce, attiva la cache
   statica, disattiva eventuali servizi WordPress residui (WP Toolkit).
6. Verifica home, tutte le pagine, i redirect 301 e i link `tel:`/`mailto:`.

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

**Nota**: `/admin` non è ancora utilizzabile finché non completi il setup OAuth
descritto in `docs/CMS-SETUP.md` — è un passaggio esterno a questo repo che
richiede i tuoi account GitHub/Cloudflare.

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
- **Repository GitHub**: creare la repo, aggiornare `backend.repo` in
  `public/admin/config.yml`, collegare il remote.
- **Setup CMS**: vedi `docs/CMS-SETUP.md` per l'autenticazione del pannello `/admin`.
- **QA pre-deploy**: `npx astro check`, test manuale di tutti i link `tel:`/`mailto:`,
  Lighthouse mobile (obiettivo ≥95), verifica visiva a 360/390/768/1024/1440px.
