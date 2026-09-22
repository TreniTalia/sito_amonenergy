import { existsSync, readFileSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const skip = existsSync(path.join(DIST, 'index.html'))
  ? false
  : 'dist assente: esegui `npm run build` prima di questo test';

const { ROTTE } = await import('../src/i18n/routes.ts').catch(() => ({ ROTTE: null }));

// `path.join` su Windows produce backslash: va bene per `existsSync`/
// `readFileSync`, che li accettano entrambi (stessa nota di test/seo-head.test.mjs).
const fileDi = (rotta) => path.join(DIST, rotta.replace(/^\//, ''), 'index.html');

// Il mirror inglese (Task 11) ha creato le 15 coppie it/en: i tre test sotto
// non si auto-saltano più (`paginheIt`/`paginheEn`/`coppieComplete` valgono
// tutti 15 su un `dist` completo), e il quarto test, aggiunto da questa
// task, verifica in modo stretto che siano *esattamente* 15 coppie, non solo
// "più di zero" — un conteggio esplicito, non un test verde per vacuità.
//
// I controlli sotto girano solo su ciò che esiste già in `dist`, filtrando
// con `existsSync`. Se in futuro `dist` fosse parziale (una sola lingua
// buildata), il test relativo tornerebbe a saltarsi con un motivo esplicito
// — non lasciato "verde" senza aver guardato niente, che sarebbe peggio di
// un rosso perché nasconderebbe l'assenza di verifica.
describe('rotte bilingui', { skip }, () => {
  test('ROTTE è importabile e non vuoto', () => {
    assert.ok(ROTTE, 'src/i18n/routes.ts non importabile');
    assert.ok(ROTTE.length > 0, 'src/i18n/routes.ts: ROTTE è vuoto');
  });

  const paginaEsiste = (lato) => (r) => existsSync(fileDi(r[lato]));
  const paginheIt = ROTTE ? ROTTE.filter(paginaEsiste('it')) : [];
  const paginheEn = ROTTE ? ROTTE.filter(paginaEsiste('en')) : [];
  const coppieComplete = ROTTE ? ROTTE.filter((r) => existsSync(fileDi(r.it)) && existsSync(fileDi(r.en))) : [];

  test('tutte e 15 le rotte esistono in entrambe le lingue', () => {
    assert.equal(ROTTE.length, 15, `src/i18n/routes.ts: attese 15 coppie, trovate ${ROTTE.length}`);
    for (const r of ROTTE) {
      assert.ok(existsSync(fileDi(r.it)), `manca la pagina italiana ${r.it}`);
      assert.ok(existsSync(fileDi(r.en)), `manca la pagina inglese ${r.en}`);
    }
    assert.equal(coppieComplete.length, 15, `attese 15 coppie it/en complete, trovate ${coppieComplete.length}`);
  });

  test(
    'le pagine italiane già costruite dichiarano hreflang="it" e x-default',
    { skip: paginheIt.length === 0 && 'nessuna pagina italiana ancora costruita in dist' },
    () => {
      assert.ok(paginheIt.length > 0, 'nessuna rotta italiana controllata');
      for (const r of paginheIt) {
        const html = readFileSync(fileDi(r.it), 'utf8');
        assert.match(html, /hreflang="it"/, `${r.it}: manca hreflang="it"`);
        assert.match(html, /hreflang="x-default"/, `${r.it}: manca x-default`);
      }
    },
  );

  test(
    'le pagine inglesi già costruite dichiarano lang="en", hreflang="en" e x-default',
    { skip: paginheEn.length === 0 && 'nessuna pagina inglese ancora costruita in dist (arriva nelle task successive)' },
    () => {
      assert.ok(paginheEn.length > 0, 'nessuna rotta inglese controllata');
      for (const r of paginheEn) {
        const html = readFileSync(fileDi(r.en), 'utf8');
        assert.match(html, /<html lang="en"/, `${r.en}: lang errato`);
        assert.match(html, /hreflang="en"/, `${r.en}: manca hreflang="en"`);
        assert.match(html, /hreflang="x-default"/, `${r.en}: manca x-default`);
      }
    },
  );

  test(
    "gli hreflang incrociati sono reciproci per le coppie già complete",
    { skip: coppieComplete.length === 0 && 'nessuna coppia it/en completa ancora in dist' },
    () => {
      assert.ok(coppieComplete.length > 0, 'nessuna coppia it/en controllata');
      for (const r of coppieComplete) {
        const it = readFileSync(fileDi(r.it), 'utf8');
        const en = readFileSync(fileDi(r.en), 'utf8');
        assert.match(it, new RegExp(`hreflang="en"[^>]*href="[^"]*${r.en}"`), `${r.it}: non punta a ${r.en}`);
        assert.match(en, new RegExp(`hreflang="it"[^>]*href="[^"]*${r.it}"`), `${r.en}: non punta a ${r.it}`);
      }
    },
  );
});
