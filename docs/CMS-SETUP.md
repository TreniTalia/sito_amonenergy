# Setup del pannello /admin (Sveltia CMS)

Il pannello (`public/admin/`) è statico: viene compilato dentro l'immagine del
sito e servito da nginx su `/admin`. Il backend OAuth che gli serve per il login
è il servizio `cms-auth` dello stesso stack Docker — non c'è nulla da deployare
fuori (in particolare: **nessun Cloudflare Worker**, a differenza di quanto
prevedeva la spec originale).

Restano tre passaggi una tantum che nessun agente può fare al posto tuo, perché
richiedono il tuo account GitHub. Sono gli stessi che servirebbero con qualunque
altra soluzione OAuth: GitHub deve sapere che esiste un'applicazione autorizzata
a chiedere accesso al repository per conto di un editor.

## 1. Crea la GitHub OAuth App

GitHub → Settings → Developer settings → **OAuth Apps** → *New OAuth App*.

| Campo | Valore |
| :--- | :--- |
| Application name | `Amon Energy CMS` (libero) |
| Homepage URL | `https://amonenergy.it` |
| Authorization callback URL | `https://amonenergy.it/oauth/callback` |

Poi *Generate a new client secret*. **Il secret è visibile una volta sola**:
copialo subito.

La callback URL deve combaciare **esattamente** con quella che `cms-auth`
costruisce da `ALLOWED_ORIGIN` (`$ALLOWED_ORIGIN/oauth/callback`). Se le due
divergono GitHub rifiuta lo scambio con `redirect_uri_mismatch`. All'avvio il
servizio stampa nei log la redirect_uri che si aspetta — è il posto dove
verificare in caso di dubbio:

```
[cms-auth] redirect_uri attesa dalla OAuth App: https://amonenergy.it/oauth/callback
```

## 2. Passa le credenziali allo stack

In Portainer → Stacks → `amonenergy` → *Environment variables*:

| Variabile | Valore |
| :--- | :--- |
| `GITHUB_OAUTH_CLIENT_ID` | Client ID della OAuth App |
| `GITHUB_OAUTH_CLIENT_SECRET` | il secret generato al punto 1 |
| `ALLOWED_ORIGIN` | `https://amonenergy.it` |

Portainer conserva lui questi valori: non serve un file `.env` sull'host. Senza
tutte e tre, `cms-auth` **non parte** e lo scrive nei log — è deliberato,
meglio un fallimento subito che un login rotto in modo incomprensibile.

`ALLOWED_ORIGIN` non è decorativo: è l'unica origine a cui il token OAuth viene
consegnato via `postMessage`. Quel token ha permesso di scrittura sul
repository, quindi il valore va tenuto vincolato al dominio reale del sito.

## 3. Aggiungi l'editor come collaboratore

Repository → Settings → Collaborators. L'editor usa il proprio account GitHub
solo per autenticarsi su `/admin`: non naviga il codice.

## Verifica end-to-end

1. Vai su `https://amonenergy.it/admin`.
2. Accedi con l'account GitHub collaboratore: si apre una popup verso GitHub,
   che al ritorno si chiude da sola e ti lascia dentro al pannello.
3. Modifica un testo (es. il sottotitolo della home) e salva. Sveltia crea un
   commit diretto su `main` (editorial workflow disattivato, vedi
   `publish_mode: simple` in `public/admin/config.yml`).
4. Il push su `main` attiva `.github/workflows/deploy.yml`: le immagini vengono
   ricostruite e pubblicate su GHCR, poi il webhook fa ricreare lo stack a
   Portainer. La modifica è live in circa 2-3 minuti.

Non serve nessuna purge di cache: nginx serve l'HTML `no-store` (vedi
`docker/nginx.conf`).

## Diagnosi dei problemi di login

| Sintomo | Causa probabile |
| :--- | :--- |
| La popup mostra "Autenticazione non riuscita — Verifica anti-CSRF non superata" | Il login è rimasto aperto oltre 10 minuti (durata dello `state`), oppure il cookie non arriva. Se il sito è servito in HTTP mentre `ALLOWED_ORIGIN` è `https://`, il flag `Secure` del cookie lo fa scartare dal browser. |
| GitHub mostra `redirect_uri_mismatch` | La callback URL della OAuth App non combacia con `$ALLOWED_ORIGIN/oauth/callback`. |
| `/oauth/auth` risponde 502 | Il container `cms-auth` è giù. Il sito pubblico resta online per costruzione: nginx risolve l'upstream a runtime. Controlla i log del servizio. |
| La popup si apre, GitHub autorizza, ma il pannello non entra | `ALLOWED_ORIGIN` non coincide con l'origine da cui stai aprendo `/admin` — il `postMessage` con il token viene scartato dal browser. |

## Cosa NON è ancora stato validato

`public/admin/config.yml` è stato scritto a specchio degli schemi Zod di
`src/content.config.ts`, ma non è mai stato testato contro un'istanza Sveltia
CMS realmente in esecuzione. Al primo test reale, verifica in particolare:

- Che i quattro "files" della collection `pagine` mostrino i campi corretti.
- Che il campo `punti` (lista di oggetti) nella collection `servizi` si comporti
  come un widget "list" ripetibile.
- Che l'upload immagini nella collection `progetti` salvi effettivamente in
  `src/assets/img/progetti/` e che l'anteprima nel pannello non dia errori.

Nota sull'handshake OAuth: `services/cms-auth/server.mjs` implementa il
protocollo `postMessage` di Decap/Netlify CMS, che Sveltia eredita. È il
protocollo che il pannello si aspetta, ma anche questo lato non è stato provato
contro un'istanza live — richiede la OAuth App del punto 1.
