/**
 * Preambolo comune dei test Playwright: `dist` servito via HTTP locale e un
 * solo chromium per file di test.
 *
 * Ogni file apriva il proprio server con la propria tabella MIME, copiata a
 * mano: stesso codice in sette punti, e sette server più sette browser
 * accesi insieme quando `node --test` esegue i file in parallelo. Su Windows
 * questo esaurisce i buffer dei socket locali (ERR_NO_BUFFER_SPACE) e un test
 * a caso fallisce senza che la pagina abbia nulla di sbagliato. Qui il
 * server è uno per file, i file girano uno alla volta (`--test-concurrency=1`
 * in package.json) e i test di layout possono rinunciare a immagini e video,
 * che non spostano nulla perché ogni `<img>` porta già larghezza e altezza.
 *
 * Il nome del file non finisce in `.test.mjs`: `node --test` non lo prende
 * per un file di test.
 */
import { createServer } from 'node:http';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const DIST = fileURLToPath(new URL('../../dist', import.meta.url));

export const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.json': 'application/json',
};

/** true se in `dist` esiste il file indicato (relativo a `dist`). */
export const distHa = (relativo) => existsSync(path.join(DIST, relativo));

let playwright = null;
try {
  playwright = await import('playwright');
} catch {
  /* devDependency assente: i test si saltano */
}
export { playwright };

/**
 * Motivo per saltare un blocco di test Playwright, o `false` se si può
 * eseguire: serve un `dist` già costruito e la devDependency installata.
 */
export const motivoSalto = (fileSpia = 'index.html') =>
  !distHa(fileSpia)
    ? 'dist assente: esegui `npm run build` prima di questo test'
    : !playwright
      ? 'playwright non installato'
      : false;

/**
 * Avvia il server statico su una porta libera. `acceptRanges` serve ai test
 * che riproducono video: senza `accept-ranges` alcuni browser rifiutano di
 * far partire il media element, e il test misurerebbe il server, non la
 * pagina. Ritorna l'origine con la barra finale e una `close()` che attende
 * la chiusura.
 */
export async function avviaServer({ acceptRanges = false } = {}) {
  const server = createServer((q, s) => {
    let f = path.join(DIST, decodeURIComponent(q.url.split('?')[0]));
    try {
      if (statSync(f).isDirectory()) f = path.join(f, 'index.html');
    } catch {
      f += '.html';
    }
    try {
      const body = readFileSync(f);
      s.setHeader('content-type', MIME[path.extname(f)] ?? 'application/octet-stream');
      if (acceptRanges) s.setHeader('accept-ranges', 'bytes');
      s.end(body);
    } catch {
      s.statusCode = 404;
      s.end('404');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return {
    origin: `http://127.0.0.1:${server.address().port}/`,
    close: () => new Promise((r) => server.close(() => r())),
  };
}

/**
 * Interrompe le richieste di immagini e video della pagina: per un test di
 * layout sono solo traffico, la geometria la fissano gli attributi
 * `width`/`height`. I font restano: cambiano la larghezza del testo, quindi
 * gli a capo che i test misurano.
 */
export async function senzaMedia(page) {
  await page.route(/\.(avif|webp|jpe?g|png|gif|mp4|webm)(\?|$)/i, (r) => r.abort());
}
