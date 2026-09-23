// Caratteristica tempo–corrente della protezione di massima corrente, come la
// verifichiamo in campo: I> a tempo inverso secondo IEC 60255-151, curva
// "standard inverse", e I>> a tempo definito che la taglia alle correnti di
// cortocircuito. I punti di prova sono iniezioni ai multipli canonici della
// soglia, con il tempo cronometrato che si discosta di pochi punti
// percentuali dalla curva teorica, come in un referto reale.
export interface Taratura {
  Is: number; // A primari, soglia I>
  TMS: number;
  Iist: number; // A primari, soglia I>>
  tIst: number; // s
}

export function tempoInverso(I: number, Is: number, TMS: number): number {
  const k = I / Is;
  return k <= 1 ? Infinity : (TMS * 0.14) / (k ** 0.02 - 1);
}

export function tempoIntervento(I: number, t: Taratura): number {
  return I >= t.Iist ? t.tIst : tempoInverso(I, t.Is, t.TMS);
}

export const TARATURA_ESEMPIO: Taratura = { Is: 400, TMS: 0.1, Iist: 4000, tIst: 0.05 };

export const PUNTI_PROVA = [
  { I: 800, t: tempoIntervento(800, TARATURA_ESEMPIO) * 1.018 },
  { I: 2000, t: tempoIntervento(2000, TARATURA_ESEMPIO) * 0.988 },
  { I: 3200, t: tempoIntervento(3200, TARATURA_ESEMPIO) * 1.009 },
  { I: 6000, t: TARATURA_ESEMPIO.tIst * 1.04 },
];
