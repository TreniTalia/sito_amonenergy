import { readFileSync } from 'node:fs';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const CONF = readFileSync(fileURLToPath(new URL('../docker/nginx.conf', import.meta.url)), 'utf8');

/** Estrae le coppie pattern/destinazione da un blocco `map ... $nome { ... }`. */
export function leggiMappa(nome) {
  const blocco = CONF.match(new RegExp(`map\\s+\\S+\\s+\\$${nome}\\s*\\{([^}]*)\\}`, 's'));
  assert.ok(blocco, `blocco map $${nome} non trovato in docker/nginx.conf`);
  const coppie = new Map();
  for (const riga of blocco[1].split('\n')) {
    const m = riga.trim().match(/^(~?\S+)\s+"?([^";]*)"?;/);
    if (m && m[1] !== 'default') coppie.set(m[1], m[2].trim());
  }
  return coppie;
}

describe('nginx: dominio canonico e residui WordPress', () => {
  test('www redirige al dominio nudo con 301', () => {
    assert.match(
      CONF,
      /server_name\s+www\.amonenergy\.it;[\s\S]*?return\s+301\s+https:\/\/amonenergy\.it\$request_uri;/,
      'manca il server che redirige www al dominio nudo',
    );
  });

  test('solo il dominio nudo è indicizzabile', () => {
    const robots = leggiMappa('robots_tag');
    assert.equal(robots.get('amonenergy.it'), '', 'il dominio nudo deve essere indicizzabile');
    assert.ok(
      !robots.has('www.amonenergy.it') || robots.get('www.amonenergy.it') !== '',
      'www non deve più essere marcato indicizzabile: ora redirige',
    );
  });

  test('gli endpoint WordPress rispondono 410, non 404', () => {
    for (const p of ['wp-admin', 'wp-login\\.php', 'xmlrpc\\.php']) {
      // Confronto su sottostringa letterale: `p` contiene già il punto
      // escapato come appare nel sorgente nginx (`wp-login\.php`), e va
      // cercato così com'è. Costruire una RegExp da questa stringa
      // interpreterebbe `\.` come "punto letterale" nel pattern, e non
      // combacerebbe mai con un backslash reale nel testo sorgente.
      const indice = CONF.indexOf(p);
      assert.notEqual(indice, -1, `manca il pattern ${p} in docker/nginx.conf`);
      const dintorni = CONF.slice(indice, indice + p.length + 120);
      assert.match(dintorni, /return\s+410/, `manca il 410 per ${p}`);
    }
  });

  test('i vecchi sitemap e i feed redirigono', () => {
    const legacy = leggiMappa('legacy_redirect');
    assert.equal(legacy.get('~^/sitemap_index\\.xml$'), '/sitemap-index.xml');
    assert.equal(legacy.get('~^/page-sitemap\\.xml$'), '/sitemap-index.xml');
    assert.equal(legacy.get('~^/feed/?$'), '/');
    assert.equal(legacy.get('~^/comments/feed/?$'), '/');
  });
});
