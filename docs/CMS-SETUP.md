# Setup del pannello /admin (Sveltia CMS)

Il pannello (`public/admin/`) è già presente nel repo e viene deployato insieme al
resto del sito. Perché un editor possa effettivamente accedervi e salvare modifiche
servono alcuni passaggi una tantum, esterni a questo repo, che nessun agente può
eseguire al posto tuo perché richiedono i tuoi account GitHub/Cloudflare.

## 1. Crea la repository GitHub

1. Crea una repository (consigliato: privata) e pusha questo progetto.
2. In `public/admin/config.yml`, sostituisci `amonenergy/sito-amonenergy` con
   l'owner/repo reale.
3. Aggiungi l'editor come collaboratore della repo (l'editor userà il proprio
   account GitHub solo per autenticarsi su `/admin` — non vedrà mai il codice).

## 2. Configura l'autenticazione OAuth (sveltia-cms-auth su Cloudflare Worker)

Sveltia CMS (come Decap/Netlify CMS prima di lui) richiede un piccolo backend OAuth
per completare il login GitHub — non può farlo da solo perché GitHub non permette
OAuth flow puramente client-side. La soluzione consigliata dalla spec è
[`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth), deployato come
Cloudflare Worker gratuito:

1. Crea una GitHub OAuth App: GitHub → Settings → Developer settings → OAuth Apps →
   New OAuth App.
   - Homepage URL: `https://amonenergy.it`
   - Authorization callback URL: `https://<il-tuo-worker>.workers.dev/callback`
   - Annota `Client ID` e `Client Secret`.
2. Deploya il Worker `sveltia-cms-auth` sul tuo account Cloudflare (free tier),
   seguendo le istruzioni nel suo repository. Imposta `Client ID`/`Client Secret`
   come variabili d'ambiente del Worker.
3. In `public/admin/config.yml`, aggiungi sotto `backend:`:
   ```yaml
   backend:
     name: github
     repo: <owner>/<repo>
     branch: main
     base_url: https://<il-tuo-worker>.workers.dev
   ```
4. Verifica che `astro.config.mjs` / `public/.htaccess` non blocchino richieste
   verso il dominio del Worker (CSP non è configurata in questo progetto, quindi
   non dovrebbe essere un problema).

**Alternativa zero-infrastruttura**: se preferisci non toccare Cloudflare,
[PagesCMS](https://pagescms.org) offre lo stesso principio (pannello hosted,
nessun Worker da deployare) con una configurazione in `.pages.yml` invece di
`config.yml` di Sveltia. Il contenuto (Markdown nel repo) resta identico e i due
CMS sono intercambiabili — vedi SPEC §2.3.

## 3. Verifica end-to-end

1. Vai su `https://amonenergy.it/admin`.
2. Accedi con l'account GitHub collaboratore.
3. Modifica un testo (es. il sottotitolo della home) e salva: Sveltia crea un
   commit diretto su `main` (editorial workflow disattivato, vedi
   `public/admin/config.yml`).
4. Il push su `main` attiva `.github/workflows/deploy.yml`: build + deploy SFTP.
   La modifica va live in circa 2-3 minuti (vedi README.md per i dettagli sul
   deploy e sulla purge della cache SiteGround).

## Cosa NON è ancora stato validato

`public/admin/config.yml` è stato scritto a specchio degli schemi Zod di
`src/content.config.ts`, ma non è mai stato testato contro un'istanza Sveltia CMS
realmente in esecuzione (serve il backend OAuth del punto 2, che richiede i tuoi
account). Al primo test reale, verifica in particolare:

- Che i tre "files" della collection `pagine` mostrino i campi corretti.
- Che il campo `punti` (lista di oggetti) nella collection `servizi` si comporti
  come un widget "list" ripetibile.
- Che l'upload immagini nella collection `progetti` salvi effettivamente in
  `src/assets/img/progetti/` e che l'anteprima nel pannello non dia errori.
