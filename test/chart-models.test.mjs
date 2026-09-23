import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { c, mul, div, abs, par } from '../src/components/tech/charts/models/complex.ts';
import { mulberry32, normale } from '../src/components/tech/charts/models/random.ts';
import { proietta, logspace } from '../src/components/tech/charts/models/scale.ts';

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
