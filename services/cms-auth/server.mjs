// Backend OAuth GitHub per il pannello /admin (Sveltia CMS).
//
// Perché esiste: GitHub non consente di completare un flow OAuth interamente
// lato browser, perché lo scambio del `code` con l'access token richiede il
// client secret, che non può stare in una pagina statica. Serve quindi un
// pezzo di server. Questo file è quel pezzo, e nient'altro.
//
// Sostituisce il Cloudflare Worker `sveltia-cms-auth` previsto in origine:
// stesso protocollo, ma dentro lo stack, senza dipendere da un account
// Cloudflare né da un'immagine di terzi non manutenuta.
//
// Node puro, nessuna dipendenza: niente da aggiornare, niente supply chain.
//
// NOTA DI SICUREZZA — il token emesso qui ha permesso di scrittura sul
// repository. Due difese, entrambe necessarie:
//   1. `state` casuale legato a un cookie HttpOnly, verificato al callback
//      (anti-CSRF: impedisce che un attaccante inneschi il flow e si faccia
//      consegnare un token per conto della vittima).
//   2. origin del postMessage vincolato ad ALLOWED_ORIGIN in entrambe le
//      direzioni, mai "*": il token va consegnato solo al pannello del sito.

import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8080);
const CLIENT_ID = process.env.GITHUB_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_OAUTH_CLIENT_SECRET;
const RAW_ORIGIN = process.env.ALLOWED_ORIGIN;

// `repo` per leggere e scrivere i contenuti, `user` perché il pannello mostra
// nome e avatar dell'editor. Nessuno scope oltre il necessario.
const SCOPE = process.env.GITHUB_OAUTH_SCOPE ?? 'repo,user';

const STATE_COOKIE = 'cms_auth_state';
const STATE_TTL_SECONDS = 600;

// --- Validazione della configurazione all'avvio -----------------------------
// Meglio non partire affatto che partire e fallire il primo login con un
// errore incomprensibile in una popup.

const missing = Object.entries({
    GITHUB_OAUTH_CLIENT_ID: CLIENT_ID,
    GITHUB_OAUTH_CLIENT_SECRET: CLIENT_SECRET,
    ALLOWED_ORIGIN: RAW_ORIGIN,
})
    .filter(([, value]) => !value)
    .map(([name]) => name);

if (missing.length > 0) {
    console.error(`[cms-auth] variabili d'ambiente mancanti: ${missing.join(', ')}`);
    process.exit(1);
}

let ALLOWED_ORIGIN;
try {
    ALLOWED_ORIGIN = new URL(RAW_ORIGIN).origin;
} catch {
    console.error(`[cms-auth] ALLOWED_ORIGIN non è un URL valido: ${RAW_ORIGIN}`);
    process.exit(1);
}

// La redirect_uri è derivata da ALLOWED_ORIGIN, non configurabile a parte:
// così non può divergere dall'origin autorizzato. Deve combaciare esattamente
// con la "Authorization callback URL" della OAuth App su GitHub.
const REDIRECT_URI = `${ALLOWED_ORIGIN}/oauth/callback`;

// Il flag Secure va messo se e solo se il sito pubblico è in HTTPS: su http
// il browser scarterebbe il cookie e il controllo dello state fallirebbe
// sempre, con un errore che sembra un bug del pannello.
const COOKIE_SECURE = ALLOWED_ORIGIN.startsWith('https:');

// --- Utility ----------------------------------------------------------------

const escapeHtml = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (char) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );

const page = (body) =>
    `<!doctype html><html lang="it"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex,nofollow">` +
    `<title>Amon Energy — autenticazione pannello</title></head>` +
    `<body style="font:16px/1.5 system-ui,sans-serif;margin:0;padding:2rem;` +
    `color:#0f172a;background:#f8fafc">${body}</body></html>`;

function stateCookie(value, maxAge) {
    return (
        `${STATE_COOKIE}=${value}; Path=/oauth; Max-Age=${maxAge}; ` +
        `HttpOnly; SameSite=Lax${COOKIE_SECURE ? '; Secure' : ''}`
    );
}

function readCookie(header, name) {
    if (!header) return undefined;
    for (const part of header.split(';')) {
        const index = part.indexOf('=');
        if (index === -1) continue;
        if (part.slice(0, index).trim() === name) {
            return decodeURIComponent(part.slice(index + 1).trim());
        }
    }
    return undefined;
}

// Confronto a tempo costante. timingSafeEqual pretende buffer di pari
// lunghezza, quindi il controllo di lunghezza va fatto prima.
function safeEqual(a, b) {
    const left = Buffer.from(String(a ?? ''), 'utf8');
    const right = Buffer.from(String(b ?? ''), 'utf8');
    if (left.length === 0 || left.length !== right.length) return false;
    return timingSafeEqual(left, right);
}

function sendHtml(res, status, body, extraHeaders = {}) {
    res.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        ...extraHeaders,
    });
    res.end(page(body));
}

function fail(res, status, message, logDetail) {
    if (logDetail) console.error(`[cms-auth] ${message} — ${logDetail}`);
    sendHtml(
        res,
        status,
        `<h1 style="font-size:1.25rem">Autenticazione non riuscita</h1>` +
            `<p>${escapeHtml(message)}</p>` +
            `<p>Chiudi questa finestra e riprova dal pannello.</p>`,
    );
}

// --- GET /oauth/auth --------------------------------------------------------
// Primo passo: genera lo state, lo deposita in un cookie e manda l'editor su
// GitHub. SameSite=Lax e non Strict perché il cookie deve sopravvivere al
// ritorno da github.com, che è una navigazione GET cross-site.

function handleAuth(req, res) {
    const state = randomBytes(32).toString('hex');

    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', CLIENT_ID);
    authorize.searchParams.set('redirect_uri', REDIRECT_URI);
    authorize.searchParams.set('scope', SCOPE);
    authorize.searchParams.set('state', state);

    res.writeHead(302, {
        Location: authorize.href,
        'Set-Cookie': stateCookie(state, STATE_TTL_SECONDS),
        'Cache-Control': 'no-store',
    });
    res.end();
}

// --- GET /oauth/callback ----------------------------------------------------

async function handleCallback(req, res, url) {
    // Il cookie va bruciato in ogni esito, anche in errore: uno state è
    // valido una volta sola.
    const burnCookie = { 'Set-Cookie': stateCookie('', 0) };

    const oauthError = url.searchParams.get('error');
    if (oauthError) {
        const description = url.searchParams.get('error_description') ?? oauthError;
        return sendHtml(
            res,
            400,
            `<h1 style="font-size:1.25rem">Accesso negato</h1><p>${escapeHtml(description)}</p>`,
            burnCookie,
        );
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const expected = readCookie(req.headers.cookie, STATE_COOKIE);

    if (!code) {
        return fail(res, 400, 'Richiesta priva del parametro code.');
    }
    if (!safeEqual(state, expected)) {
        return fail(
            res,
            400,
            'Verifica anti-CSRF non superata: il parametro state non corrisponde. ' +
                'Può succedere se il login è rimasto aperto più di 10 minuti.',
            `state=${state ? 'presente' : 'assente'} cookie=${expected ? 'presente' : 'assente'}`,
        );
    }

    let token;
    try {
        token = await exchangeCodeForToken(code);
    } catch (error) {
        return fail(
            res,
            502,
            'Scambio del codice con GitHub non riuscito.',
            error?.message ?? String(error),
        );
    }

    return sendSuccess(res, token, burnCookie);
}

async function exchangeCodeForToken(code) {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'amonenergy-cms-auth',
        },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
        throw new Error(`GitHub ha risposto ${response.status}`);
    }

    const payload = await response.json();

    // GitHub segnala gli errori dello scambio con HTTP 200 e un campo `error`
    // nel corpo, non con uno status di errore.
    if (payload.error) {
        throw new Error(`${payload.error}: ${payload.error_description ?? 'senza dettaglio'}`);
    }
    if (!payload.access_token) {
        throw new Error('risposta senza access_token');
    }

    return payload.access_token;
}

// --- Consegna del token al pannello ----------------------------------------
// Handshake atteso da Sveltia CMS (ereditato da Decap/Netlify CMS): la popup
// annuncia "authorizing:github", il pannello risponde, e solo a quel punto la
// popup consegna il token. Il doppio scambio serve a non parlare nel vuoto se
// il pannello non è ancora in ascolto.
//
// L'implementazione originale annuncia a "*" e risponde a e.origin. Qui
// entrambi i lati sono vincolati ad ALLOWED_ORIGIN: la popup parla solo al
// nostro sito e accetta risposte solo da lui.

function sendSuccess(res, token, extraHeaders) {
    const message = `authorization:github:success:${JSON.stringify({
        token,
        provider: 'github',
    })}`;

    // Letterale JS da interpolare in un <script>: `<` va neutralizzato, altrimenti
    // un valore contenente `</script>` chiuderebbe il tag in anticipo.
    const js = (value) => JSON.stringify(value).replace(/</g, '\\u003c');

    const script =
        `(function () {\n` +
        `  var origin = ${js(ALLOWED_ORIGIN)};\n` +
        `  var message = ${js(message)};\n` +
        `  if (!window.opener) {\n` +
        `    document.getElementById('esito').textContent =\n` +
        `      'Questa pagina va aperta dalla finestra di login del pannello.';\n` +
        `    return;\n` +
        `  }\n` +
        `  function onMessage(event) {\n` +
        `    if (event.origin !== origin) return;\n` +
        `    window.removeEventListener('message', onMessage, false);\n` +
        `    window.opener.postMessage(message, origin);\n` +
        `  }\n` +
        `  window.addEventListener('message', onMessage, false);\n` +
        `  window.opener.postMessage('authorizing:github', origin);\n` +
        `})();`;

    sendHtml(
        res,
        200,
        `<h1 style="font-size:1.25rem">Accesso effettuato</h1>` +
            `<p id="esito">Puoi chiudere questa finestra.</p>` +
            `<script>${script}</script>`,
        {
            // Lo script è inline e va autorizzato; tutto il resto è vietato.
            'Content-Security-Policy':
                "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'",
            ...extraHeaders,
        },
    );
}

// --- Server -----------------------------------------------------------------

const server = createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);

    // nginx inoltra conservando il prefisso /oauth/, ma il probe di
    // HEALTHCHECK colpisce il container direttamente: entrambe le forme
    // devono funzionare.
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const route = path.startsWith('/oauth') ? path.slice('/oauth'.length) || '/' : path;

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return fail(res, 405, 'Metodo non consentito.');
    }

    if (route === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
        return res.end('ok\n');
    }

    if (route === '/auth' || route === '/') {
        return handleAuth(req, res);
    }

    if (route === '/callback') {
        return handleCallback(req, res, url).catch((error) =>
            fail(res, 500, 'Errore interno.', error?.stack ?? String(error)),
        );
    }

    return fail(res, 404, 'Rotta non trovata.');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[cms-auth] in ascolto sulla porta ${PORT}`);
    console.log(`[cms-auth] origin autorizzato: ${ALLOWED_ORIGIN}`);
    console.log(`[cms-auth] redirect_uri attesa dalla OAuth App: ${REDIRECT_URI}`);
});

// Docker manda SIGTERM allo stop: chiudere pulito evita i 10 secondi di attesa
// prima del SIGKILL.
for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => server.close(() => process.exit(0)));
}
