import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { c, mul, div, abs, par } from '../src/components/tech/charts/models/complex.ts';
import { mulberry32, normale } from '../src/components/tech/charts/models/random.ts';
import { proietta, logspace } from '../src/components/tech/charts/models/scale.ts';
import { rispostaSfra, AVVOLGIMENTO_RIFERIMENTO as RIF, AVVOLGIMENTO_DEFORMATO as DEF } from '../src/components/tech/charts/models/sfra.ts';
import { logspace as ls } from '../src/components/tech/charts/models/scale.ts';
import { tempoInverso, tempoIntervento, TARATURA_ESEMPIO as TAR, PUNTI_PROVA } from '../src/components/tech/charts/models/iec60255.ts';

describe('fondamenta dei grafici', () => {
  test('aritmetica complessa', () => {
    const z = mul(c(1, 2), c(3, -1));
    assert.deepEqual(z, { re: 5, im: 5 });
    const q = div(c(5, 5), c(3, -1));
    assert.ok(Math.abs(q.re - 1) < 1e-12 && Math.abs(q.im - 2) < 1e-12);
    assert.equal(abs(c(3, 4)), 5);
    assert.ok(Math.abs(par(c(2), c(2)).re - 1) < 1e-12);
  });
  test('mulberry32 è deterministico e uniforme', () => {
    const a = mulberry32(42), b = mulberry32(42);
    const xs = Array.from({ length: 5000 }, a);
    assert.deepEqual(xs.slice(0, 5), Array.from({ length: 5 }, b));
    const media = xs.reduce((s, x) => s + x, 0) / xs.length;
    assert.ok(Math.abs(media - 0.5) < 0.02);
    const n = Array.from({ length: 5000 }, () => normale(a));
    const m2 = n.reduce((s, x) => s + x, 0) / n.length;
    assert.ok(Math.abs(m2) < 0.06);
  });
  test('scale lineari e logaritmiche', () => {
    assert.equal(proietta({ tipo: 'lin', min: 0, max: 10 }, 5, 0, 100), 50);
    assert.equal(proietta({ tipo: 'log', min: 10, max: 1000 }, 100, 0, 200), 100);
    const f = logspace(20, 2e6, 5);
    assert.equal(f.length, 5);
    assert.ok(Math.abs(f[0] - 20) < 1e-9 && Math.abs(f[4] - 2e6) < 1e-6);
  });
});

describe('modello SFRA', () => {
  const f = ls(20, 2e6, 600);
  const rif = f.map((x) => rispostaSfra(x, RIF));
  const def = f.map((x) => rispostaSfra(x, DEF));
  test('ampiezze nel campo di misura', () => {
    for (const v of rif) assert.ok(v <= 0 && v >= -100, `valore fuori scala: ${v}`);
  });
  test('coincidono sotto 10 kHz, si separano sopra 100 kHz', () => {
    f.forEach((x, i) => { if (x < 1e4) assert.ok(Math.abs(rif[i] - def[i]) < 1, `scarto a ${x} Hz`); });
    assert.ok(f.some((x, i) => x > 1e5 && Math.abs(rif[i] - def[i]) > 3), 'nessuno scostamento sopra 100 kHz');
  });
  test('almeno tre risonanze fra 1 kHz e 2 MHz', () => {
    let minimi = 0;
    for (let i = 1; i < f.length - 1; i++) if (f[i] > 1e3 && rif[i] < rif[i - 1] && rif[i] < rif[i + 1]) minimi++;
    assert.ok(minimi >= 3, `minimi trovati: ${minimi}`);
  });

  // Test di forma: una SFRA end-to-end a circuito aperto non è un passa-basso.
  // Il nucleo fa scendere la risposta già dai 20 Hz, l'antirisonanza fra
  // induttanza di magnetizzazione e capacità dell'avvolgimento dà il minimo
  // profondo fra qualche centinaio di hertz e qualche kilohertz, e sopra i
  // 100 kHz restano risonanze distinte che la deformazione sposta, non trasla.
  const estremi = (da) => {
    let minimi = 0, massimi = 0;
    for (let i = 1; i < f.length - 1; i++) {
      if (f[i] <= da) continue;
      if (rif[i] < rif[i - 1] && rif[i] < rif[i + 1]) minimi++;
      if (rif[i] > rif[i - 1] && rif[i] > rif[i + 1]) massimi++;
    }
    return { minimi, massimi };
  };
  test('in bassa frequenza l\'attenuazione cresce con la frequenza (nucleo)', () => {
    const a20 = rispostaSfra(20, RIF), a200 = rispostaSfra(200, RIF);
    assert.ok(a20 - a200 > 10, `da 20 a 200 Hz scende di ${(a20 - a200).toFixed(1)} dB`);
  });
  test('il minimo sotto 10 kHz cade fra 200 Hz e 5 kHz', () => {
    let im = 0;
    f.forEach((x, i) => { if (x < 1e4 && rif[i] < rif[im]) im = i; });
    assert.ok(f[im] > 200 && f[im] < 5e3, `minimo a ${f[im].toFixed(0)} Hz`);
  });
  test('sopra 100 kHz almeno due minimi e due massimi locali', () => {
    const { minimi, massimi } = estremi(1e5);
    assert.ok(minimi >= 2 && massimi >= 2, `minimi ${minimi}, massimi ${massimi}`);
  });
  test('sopra 100 kHz lo scostamento non è una traslazione costante', () => {
    const d = [];
    f.forEach((x, i) => { if (x > 1e5) d.push(def[i] - rif[i]); });
    let cambi = 0;
    for (let i = 1; i < d.length; i++) if (Math.sign(d[i]) * Math.sign(d[i - 1]) < 0) cambi++;
    const media = d.reduce((s, v) => s + v, 0) / d.length;
    const sd = Math.sqrt(d.reduce((s, v) => s + (v - media) ** 2, 0) / d.length);
    assert.ok(cambi >= 1, `lo scarto non cambia mai segno sopra 100 kHz`);
    assert.ok(sd > 1, `deviazione standard dello scarto ${sd.toFixed(2)} dB`);
  });
});

describe('caratteristica IEC 60255-151 standard inverse', () => {
  test('formula ai multipli canonici', () => {
    const atteso = (k) => (0.1 * 0.14) / (k ** 0.02 - 1);
    for (const k of [2, 5, 10]) {
      const t = tempoInverso(k * 400, 400, 0.1);
      assert.ok(Math.abs(t - atteso(k)) / atteso(k) < 0.005, `k=${k}: ${t}`);
    }
    assert.equal(tempoInverso(300, 400, 0.1), Infinity);
  });
  test('I>> taglia la curva a tempo definito', () => {
    assert.equal(tempoIntervento(TAR.Iist * 1.5, TAR), TAR.tIst);
    assert.ok(tempoIntervento(TAR.Is * 2, TAR) > TAR.tIst);
  });
  test('i punti di prova cadono entro il 5% della curva', () => {
    for (const p of PUNTI_PROVA) {
      const teor = tempoIntervento(p.I, TAR);
      assert.ok(Math.abs(p.t - teor) / teor < 0.05);
    }
  });
});
