import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
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

// Inventario reale del sito WordPress, letto dal suo page-sitemap.xml il
// 2026-09-22. È la lista che i redirect devono coprire per intero: se domani
// ne salta fuori un altro, si aggiunge qui e il test dice subito che manca.
const VECCHI_URL = [
  '/progetti/', '/i-nostri-clienti/', '/lavora-con-noi/', '/consulenza/', '/foto-video/',
  '/laboratorio-mobile/', '/centrix/', '/verifiche-strumentali/', '/monitoraggio-controllo/',
  '/gestione-e-manutenzione/', '/repowering-e-revamping-eolico/', '/prove-isolamento/',
  '/verifiche-strumentali/sfra/', '/verifiche-strumentali/misure-scariche-parziali/',
  '/verifiche-strumentali/verifica-protezioni-at-mt/',
  '/verifiche-strumentali/verifiche-trasformatori-potenza-misure/',
  '/monitoraggio-controllo/rcs-monitoraggio-e-controllo-cabina-mt/',
  '/monitoraggio-controllo/cci-controllore-centrale-dimpianto/',
  '/monitoraggio-controllo/teledistacco-a72/', '/monitoraggio-controllo/lettura-contatori/',
  '/company/', '/our-job/', '/our-clients/', '/rcs/', '/centrix-2-0/', '/contacts/',
  '/repowering-eolic-revamping/',
];

// Restano identici: devono rispondere 200, non redirigere.
const INVARIATI = ['/', '/azienda/', '/contatti/', '/privacy-policy/'];

const combacia = (mappa, url) => {
  for (const [pattern, dest] of mappa) {
    if (!pattern.startsWith('~')) continue;
    if (new RegExp(pattern.slice(1)).test(url)) return dest;
  }
  return null;
};

describe('mappa redirect completa', () => {
  const legacy = leggiMappa('legacy_redirect');

  test('ogni vecchio URL ha una destinazione', () => {
    for (const u of VECCHI_URL) {
      assert.ok(combacia(legacy, u), `nessun redirect per ${u}`);
    }
  });

  test('nessun URL invariato viene rediretto', () => {
    for (const u of INVARIATI) {
      assert.equal(combacia(legacy, u), null, `${u} non deve redirigere: resta identico`);
    }
  });

  test('ogni destinazione esiste in dist (nessuna catena, nessun 404)', () => {
    const DIST = fileURLToPath(new URL('../dist', import.meta.url));
    for (const u of VECCHI_URL) {
      const dest = combacia(legacy, u);
      const percorso = dest.split('#')[0];
      const f = path.join(DIST, percorso.replace(/^\//, ''), 'index.html');
      const diretto = path.join(DIST, percorso.replace(/^\//, ''));
      assert.ok(
        existsSync(f) || existsSync(diretto),
        `${u} punta a ${dest}, che non esiste in dist`,
      );
      assert.equal(combacia(legacy, percorso), null, `catena di redirect: ${u} → ${dest} → …`);
    }
  });

  test('le ancore usate come destinazione esistono nella pagina', () => {
    const DIST = fileURLToPath(new URL('../dist', import.meta.url));
    for (const u of VECCHI_URL) {
      const dest = combacia(legacy, u);
      const [percorso, ancora] = dest.split('#');
      if (!ancora) continue;
      const html = readFileSync(path.join(DIST, percorso.replace(/^\//, ''), 'index.html'), 'utf8');
      assert.match(html, new RegExp(`id="${ancora}"`), `${dest}: l'ancora #${ancora} non esiste`);
    }
  });
});
