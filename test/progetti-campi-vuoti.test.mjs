/**
 * Campi facoltativi lasciati vuoti nel pannello.
 *
 * Sveltia scrive un campo facoltativo lasciato vuoto come stringa vuota
 * (`titoloEn: ''`), non lo omette. I componenti ripiegano sull'italiano con
 * `??`, che però scatta solo su un campo assente: la card inglese del primo
 * progetto creato dal pannello (Erchie, 2026-09-25) è andata online con titolo
 * e descrizione vuoti. Qui ogni card, in entrambe le lingue, deve avere un
 * titolo e una descrizione.
 *
 * Il test legge il `dist` già costruito e si salta se non c'è.
 */
import { readFileSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { DIST, distHa } from './helpers/dist-server.mjs';

const skip = distHa('lavori/index.html') ? false : 'dist assente: esegui `npm run build` prima di questo test';

const testi = (html, classe) =>
  [...html.matchAll(new RegExp(`class="${classe}"[^>]*>([^<]*)<`, 'g'))].map(([, t]) => t.trim());

describe('nessuna card con testi vuoti', { skip }, () => {
  for (const pagina of ['lavori', 'en/projects']) {
    test(`/${pagina}/: ogni card ha titolo e descrizione`, () => {
      const html = readFileSync(path.join(DIST, pagina, 'index.html'), 'utf8');
      const titoli = testi(html, 'pco-titolo-testo');
      const descrizioni = testi(html, 'pco-desc');
      assert.ok(titoli.length >= 2, 'card non trovate nella pagina');
      assert.equal(descrizioni.length, titoli.length);
      titoli.forEach((t, i) => assert.ok(t, `card ${i + 1}: titolo vuoto`));
      descrizioni.forEach((d, i) => assert.ok(d, `card ${i + 1} ("${titoli[i]}"): descrizione vuota`));
    });
  }

  for (const pagina of ['', 'en']) {
    test(`home /${pagina}: ogni anteprima progetto ha un titolo`, () => {
      const html = readFileSync(path.join(DIST, pagina, 'index.html'), 'utf8');
      const titoli = [...html.matchAll(/class="progetto-preview[\s\S]*?<h3[^>]*>([^<]*)<\/h3>/g)].map(([, t]) => t.trim());
      assert.equal(titoli.length, 3);
      titoli.forEach((t, i) => assert.ok(t, `anteprima ${i + 1}: titolo vuoto`));
    });
  }
});
