/**
 * Regressione per il lampo bianco dell'arco su GPU mobile.
 *
 * SINTOMO: su iPhone/Android, in produzione, la banda dell'arco diventa un
 * blocco bianco opaco per la durata di una scarica, poi torna normale, e
 * ricapita a scariche successive.
 *
 * CAUSA: hash11() era `fract(sin(n * 127.1) * 43758.5453123)`. `n` deriva da
 * uTime, che cresce senza limite, moltiplicato fino a 41x dai call site e
 * ancora 5.6x per ottava da fbm(). Gli argomenti di sin() arrivano a 1e5-1e7.
 * Le GPU mobile (PowerVR/Adreno/Apple) non fanno riduzione d'intervallo a
 * quelle magnitudini e restituiscono NaN. Il NaN propaga da fbm -> arcY -> la
 * distanza `d` -> gl_FragColor, dove `min(col, 1.0)` con NaN e' undefined e su
 * quelle GPU restituisce 1.0: bianco pieno, opaco, su tutta la campata fra gli
 * elettrodi, e solo mentre `uLife > 0` — cioe' solo durante la scarica.
 *
 * Questi test bloccano le invarianti che impediscono il ritorno del difetto.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = readFileSync(fileURLToPath(new URL('../src/components/WaveDivider.astro', import.meta.url)), 'utf8');

const fnBody = (name) => {
  const at = SRC.indexOf(`float ${name}(`);
  assert.notEqual(at, -1, `${name}() non trovata in WaveDivider.astro`);
  const open = SRC.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < SRC.length; i++) {
    if (SRC[i] === '{') depth++;
    else if (SRC[i] === '}' && --depth === 0) return SRC.slice(open, i + 1);
  }
  throw new Error(`corpo di ${name}() non chiuso`);
};

test('hash11 non usa sin(): nessun input finito puo’ produrre NaN', () => {
  assert.doesNotMatch(
    fnBody('hash11'),
    /\bsin\s*\(/,
    'hash11 e’ tornata a un hash basato su sin(): con argomenti grandi le GPU mobile restituiscono NaN',
  );
});

test('vnoise campiona un reticolo periodico: gli indici entrano nell’hash limitati', () => {
  const body = fnBody('vnoise');
  const mods = body.match(/\bmod\s*\(/g) ?? [];
  assert.ok(
    mods.length >= 2,
    'entrambi i vertici del reticolo devono passare per mod(): wrappare solo il primo spezza la continuita’ alla giunzione',
  );
});

test('il colore finale e’ mascherato sui valori non finiti', () => {
  // lastIndexOf: i commenti dello shader nominano gl_FragColor prima dell’uso.
  const main = SRC.slice(SRC.indexOf('void main()'), SRC.lastIndexOf('gl_FragColor'));
  assert.match(
    main,
    /lessThanEqual\s*\(\s*abs\s*\(\s*col\s*\)/,
    'manca la maschera sui non-finiti prima di gl_FragColor: un NaN finirebbe in min(col, 1.0), che su GPU mobile rende 1.0 (bianco)',
  );
});

test('uTime e’ limitato dal driver JS', () => {
  assert.match(
    SRC,
    /uTime\.value\s*=\s*\(\s*u\.uTime\.value\s*\+\s*dt\s*\)\s*%/,
    'uTime cresce senza limite: oltre ~2^24 il float32 non distingue piu’ celle di rumore adiacenti e il filamento si congela',
  );
});

// ---------------------------------------------------------------------------
// Verifica numerica del meccanismo, in fp32, con un modello della GPU mobile.
// ---------------------------------------------------------------------------

const f = Math.fround;
/** sin() come si comporta su GPU mobile: niente riduzione d'intervallo. */
const sinMobile = (x) => (Math.abs(x) > 65504 ? NaN : Math.sin(x));

const hashOld = (p) => f(f(Math.sin(f(p * 127.1))) * 43758.5453123) % 1;
const hashOldMobile = (p) => {
  const s = sinMobile(f(p * 127.1));
  return Number.isNaN(s) ? NaN : f(f(s * 43758.5453123) % 1);
};
const hashNew = (p) => {
  let q = f(f(p * 0.1031) % 1);
  q = f(q * f(q + 33.33));
  q = f(q * f(q + q));
  return f(q % 1);
};

const NOISE_P = 512;
const glslMod = (x, y) => f(x - y * Math.floor(x / y));

const vnoiseOld = (h, x) => {
  const i = Math.floor(x);
  return f(h(i) + (h(i + 1) - h(i)) * f(x - i));
};
const vnoiseNew = (h, x) => {
  const i = Math.floor(x);
  return f(h(glslMod(i, NOISE_P)) + (h(glslMod(i + 1, NOISE_P)) - h(glslMod(i, NOISE_P))) * f(x - i));
};

const fbm = (vn, h, x) => {
  let s = 0, a = 0.55, norm = 0, v = x;
  for (let i = 0; i < 3; i++) {
    s = f(s + a * vn(h, v));
    norm = f(norm + a);
    v = f(f(v * 2.37) + 11.3);
    a = f(a * 0.5);
  }
  return f(s / norm - 0.5);
};

/** Ogni argomento di rumore che lo shader valuta, per un dato pixel/tempo/seme. */
const noiseArgs = (px, t, seed) => [
  f(f(px * 0.0115) + f(t * 1.9) + seed),
  f(f(px * 0.0115) - f(t * 1.5) + f(seed * 3.7)),
  f(f(px * 0.038) + f(t * 4.3) + f(seed * 2.7)),
  f(f(t * 41.0) + f(px * 0.02)),
  f(f(px * 0.035) + f(t * 7.0) + seed),
  f(f(px * 0.026) + f(seed * 5.1) + f(t * 2.4)),
];

/** Campiona la finestra realistica: banda larga fino a 1840px, un'ora di pagina. */
function* samples() {
  for (const t of [5, 12, 30, 60, 300, 900, 3600]) {
    for (const seed of [0, 17, 42, 63, 99]) {
      for (const px of [0, 200, 430, 900, 1840]) yield [px, t, seed];
    }
  }
}

test('il modello riproduce il difetto: l’hash vecchio produce NaN su GPU mobile', () => {
  let nan = 0, total = 0;
  for (const [px, t, seed] of samples()) {
    for (const x of noiseArgs(px, t, seed)) {
      total++;
      if (Number.isNaN(fbm(vnoiseOld, hashOldMobile, x))) nan++;
    }
  }
  assert.ok(nan > 0, 'il modello non riproduce piu’ il difetto: rivedere sinMobile');
  // Documenta l'ampiezza: non e' un caso di bordo, e' la maggioranza dei campioni.
  assert.ok(nan / total > 0.5, `atteso NaN diffuso, ottenuto ${nan}/${total}`);
});

test('l’hash nuovo non produce NaN su nessun campione, e resta finito', () => {
  for (const [px, t, seed] of samples()) {
    for (const x of noiseArgs(px, t, seed)) {
      const v = fbm(vnoiseNew, hashNew, x);
      assert.ok(Number.isFinite(v), `fbm non finito per px=${px} t=${t} seed=${seed} x=${x}`);
      assert.ok(v >= -0.51 && v <= 0.51, `fbm fuori intervallo (${v}) per px=${px} t=${t} seed=${seed}`);
    }
  }
});

test('gli indici che entrano nell’hash restano dentro il periodo del reticolo', () => {
  let max = 0;
  for (const [px, t, seed] of samples()) {
    for (const x of noiseArgs(px, t, seed)) {
      let v = x;
      for (let o = 0; o < 3; o++) {
        const i = Math.floor(v);
        max = Math.max(max, Math.abs(glslMod(i, NOISE_P)), Math.abs(glslMod(i + 1, NOISE_P)));
        v = f(f(v * 2.37) + 11.3);
      }
    }
  }
  assert.ok(max <= NOISE_P, `indice ${max} oltre il periodo ${NOISE_P}`);
  // Sotto 65504 anche un fragment shader retrocesso a mediump non va in overflow.
  assert.ok(max < 65504, 'indice oltre il limite di rappresentazione mediump');
});
