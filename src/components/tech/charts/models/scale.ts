export type Scala = { tipo: 'lin' | 'log'; min: number; max: number };

/** Porta un valore del dominio nell'intervallo [da, a] di coordinate SVG. */
export function proietta(s: Scala, v: number, da: number, a: number): number {
  const u = s.tipo === 'log'
    ? (Math.log10(v) - Math.log10(s.min)) / (Math.log10(s.max) - Math.log10(s.min))
    : (v - s.min) / (s.max - s.min);
  return da + u * (a - da);
}

export function logspace(min: number, max: number, n: number): number[] {
  const a = Math.log10(min), b = Math.log10(max);
  return Array.from({ length: n }, (_, i) => 10 ** (a + ((b - a) * i) / (n - 1)));
}
