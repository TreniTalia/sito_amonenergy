// Aritmetica complessa minima per la rete a scala della SFRA: solo quello che
// serve alle matrici ABCD, niente libreria.
export type C = { re: number; im: number };

export const c = (re: number, im = 0): C => ({ re, im });

export const add = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });

export const sub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im });

export const mul = (a: C, b: C): C => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });

export const div = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};

export const inv = (a: C): C => div(c(1), a);

export const abs = (a: C): number => Math.hypot(a.re, a.im);

/** Due impedenze in parallelo. */
export const par = (a: C, b: C): C => div(mul(a, b), add(a, b));
