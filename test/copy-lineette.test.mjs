/**
 * Nessuna lineetta usata come pausa nel testo visibile del sito.
 *
 * Il cliente lo ha chiesto esplicitamente: la lineetta lunga dentro la frase
 * legge come testo generato, non scritto. Il controllo gira su tutte le
 * pagine costruite, dentro <main> (header e footer sono fuori), dopo aver
 * tolto script, stili, commenti e i titoli ufficiali delle norme marcati con
 * `data-titolo-norma`, che si citano come sono pubblicati.
 *
 * Si salta se `dist` non c'è: `npm test` deve restare eseguibile senza build.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

function pagine(dir = DIST) {
  const out = [];
  for (const nome of readdirSync(dir)) {
    const p = path.join(dir, nome);
    if (statSync(p).isDirectory()) {
      if (nome !== 'admin' && nome !== '_astro') out.push(...pagine(p));
    } else if (nome === 'index.html') out.push(p);
  }
  return out;
}

const testoVisibile = (html) => {
  const i = html.indexOf('<main');
  const j = html.lastIndexOf('</main>');
  return (i === -1 || j === -1 ? '' : html.slice(i, j))
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<cite\b[^>]*data-titolo-norma[^>]*>[\s\S]*?<\/cite>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
    .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
    .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ');
};

test('nessuna lineetta usata come pausa nel testo delle pagine', { skip: !existsSync(path.join(DIST, 'index.html')) && 'dist assente' }, () => {
  const trovate = [];
  for (const f of pagine()) {
    const testo = testoVisibile(readFileSync(f, 'utf8'));
    for (const m of testo.matchAll(/.{0,30}\s[—–]\s.{0,30}/g)) {
      trovate.push(`${path.relative(DIST, f)}: «${m[0].replace(/\s+/g, ' ').trim()}»`);
    }
  }
  assert.deepEqual(trovate, [], `lineette usate come pausa:\n${trovate.join('\n')}`);
});
