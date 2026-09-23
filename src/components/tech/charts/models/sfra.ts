// Risposta in frequenza end-to-end di un avvolgimento a circuito aperto, come
// la misura la IEC 60076-18: sorgente su 50 Ω al terminale di linea, misura
// su 50 Ω al terminale opposto, rapporto fra le due tensioni in dB.
//
// Il modello ha due parti in cascata, ciascuna ridotta a una matrice ABCD.
//
// 1. RAMO DEL NUCLEO. La corrente che scorre uguale in tutte le spire crea il
//    flusso nel nucleo: vista dai morsetti è l'induttanza di magnetizzazione
//    Lm, in parallelo alla capacità equivalente C0 dell'avvolgimento per
//    questo modo. Le correnti parassite nei lamierini espellono il flusso al
//    salire della frequenza: Lm(f) = Lm / (1 + j f/fc), che equivale a Lm in
//    parallelo alla resistenza di perdita del ferro Rc = 2π·fc·Lm. In bassa
//    frequenza domina Lm e l'attenuazione cresce di 20 dB per decade; Lm e C0
//    danno l'antirisonanza, cioè il minimo profondo attorno a 1 kHz, e Rc ne
//    limita la profondità. Sopra, il ramo è capacitivo e passa la mano
//    all'avvolgimento.
//
// 2. AVVOLGIMENTO. N sezioni uguali (i dischi), analizzate per nodi. Ogni
//    sezione ha induttanza propria Ls e mutua con le altre Ls·ρ^|i-j| (il
//    flusso in aria che le concatena, senza il nucleo), resistenza con
//    effetto pelle R(f) = R0·√(1 + f/fs), capacità serie Cs verso la sezione
//    successiva e capacità verso massa Cg (nucleo, cassone, altro
//    avvolgimento), entrambe con perdita dielettrica G = ω·C·tanδ. Sono le
//    mutue induttanze a separare i modi: una scala a sole induttanze proprie
//    li ammucchia tutti alla frequenza di Ls‖Cs, e lì la risposta sprofonda.
//    Così invece gli N modi si distribuiscono da circa 20 kHz a oltre 1 MHz,
//    più fitti verso l'alto, come nella banda media e alta di una SFRA vera.
//    La matrice nodale si riduce ai due morsetti (riduzione di Kron) e dà i
//    parametri Y, da cui la matrice ABCD.
//
// Una deformazione radiale avvicina un gruppo di dischi al nucleo o
// all'avvolgimento vicino: Cg cresce su quelle sezioni (e Cs un poco). Sotto
// i 10 kHz, dove risponde il nucleo, non cambia nulla; sopra i 100 kHz le
// risonanze dell'avvolgimento si spostano e cambiano ampiezza. È quello che
// la SFRA vede.
import { c, add, sub, mul, div, abs, par, type C } from './complex.ts';

export interface ParametriAvvolgimento {
  /** H, induttanza di magnetizzazione vista dai morsetti (bassa frequenza). */
  Lm: number;
  /** Hz, frequenza di taglio delle correnti parassite nei lamierini. */
  fc: number;
  /** F, capacità equivalente dell'avvolgimento in parallelo a Lm. */
  C0: number;
  /** Numero di sezioni (dischi) dell'avvolgimento. */
  sezioni: number;
  /** H, induttanza propria in aria di una sezione. */
  Ls: number;
  /** Accoppiamento fra sezioni: la mutua fra i e j vale Ls·ρ^|i-j|. */
  rho: number;
  /** Ω, resistenza in continua di una sezione. */
  R0: number;
  /** Hz, frequenza da cui l'effetto pelle fa crescere R come √f. */
  fs: number;
  /** F, capacità serie fra una sezione e la successiva. */
  Cs: number;
  /** F, capacità verso massa di una sezione. */
  Cg: number;
  /** Fattore di perdita dell'isolamento olio-carta. */
  tanDelta: number;
  /** Moltiplicatori di Cg e Cs per indice di sezione (deformazione). */
  deformazione?: (i: number) => { cg: number; cs: number };
}

type M = [C, C, C, C]; // A, B, C, D

/** Risolve A·X = B per eliminazione di Gauss con pivot parziale (in place). */
function risolvi(A: C[][], B: C[][]): C[][] {
  const n = A.length, m = B[0].length;
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (abs(A[i][k]) > abs(A[p][k])) p = i;
    [A[k], A[p]] = [A[p], A[k]];
    [B[k], B[p]] = [B[p], B[k]];
    for (let i = k + 1; i < n; i++) {
      const q = div(A[i][k], A[k][k]);
      for (let j = k; j < n; j++) A[i][j] = sub(A[i][j], mul(q, A[k][j]));
      for (let j = 0; j < m; j++) B[i][j] = sub(B[i][j], mul(q, B[k][j]));
    }
  }
  for (let k = n - 1; k >= 0; k--) {
    for (let j = 0; j < m; j++) {
      let s = B[k][j];
      for (let i = k + 1; i < n; i++) s = sub(s, mul(A[k][i], B[i][j]));
      B[k][j] = div(s, A[k][k]);
    }
  }
  return B;
}

/** Matrice ABCD dell'avvolgimento, dalla sua matrice nodale. */
function avvolgimento(f: number, p: ParametriAvvolgimento): M {
  const w = 2 * Math.PI * f;
  const N = p.sezioni;
  const R = p.R0 * Math.sqrt(1 + f / p.fs);
  const def = (i: number) => p.deformazione?.(i) ?? { cg: 1, cs: 1 };

  // Impedenze dei rami induttivi (N × N, con le mutue), poi la loro inversa.
  const Z: C[][] = [], U: C[][] = [];
  for (let i = 0; i < N; i++) {
    Z.push([]);
    U.push([]);
    for (let j = 0; j < N; j++) {
      Z[i].push(c(i === j ? R : 0, w * p.Ls * p.rho ** Math.abs(i - j)));
      U[i].push(c(i === j ? 1 : 0));
    }
  }
  const Yr = risolvi(Z, U);

  // Matrice nodale (N + 1 nodi): il ramo k va dal nodo k al nodo k + 1.
  const n = N + 1;
  const Y: C[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => c(0)));
  for (let a = 0; a < N; a++) {
    for (let b = 0; b < N; b++) {
      const y = Yr[a][b];
      Y[a][b] = add(Y[a][b], y);
      Y[a + 1][b + 1] = add(Y[a + 1][b + 1], y);
      Y[a][b + 1] = sub(Y[a][b + 1], y);
      Y[a + 1][b] = sub(Y[a + 1][b], y);
    }
  }
  const capacita = (C: number) => c(w * C * p.tanDelta, w * C);
  for (let k = 0; k < N; k++) {
    const y = capacita(p.Cs * def(k).cs);
    Y[k][k] = add(Y[k][k], y);
    Y[k + 1][k + 1] = add(Y[k + 1][k + 1], y);
    Y[k][k + 1] = sub(Y[k][k + 1], y);
    Y[k + 1][k] = sub(Y[k + 1][k], y);
  }
  // Cg di ogni sezione, metà su ciascuno dei suoi due nodi.
  for (let k = 0; k < N; k++) {
    const y = capacita((p.Cg * def(k).cg) / 2);
    Y[k][k] = add(Y[k][k], y);
    Y[k + 1][k + 1] = add(Y[k + 1][k + 1], y);
  }

  // Riduzione di Kron sui morsetti 0 e N: Y2 = Ybb − Ybi·Yii⁻¹·Yib.
  const interni = Array.from({ length: N - 1 }, (_, i) => i + 1);
  const X = risolvi(
    interni.map((i) => interni.map((j) => Y[i][j])),
    interni.map((i) => [Y[i][0], Y[i][N]]),
  );
  const y2 = (a: number, col: 0 | 1) => {
    let s = Y[a][col === 0 ? 0 : N];
    interni.forEach((k, q) => { s = sub(s, mul(Y[a][k], X[q][col])); });
    return s;
  };
  const y11 = y2(0, 0), y12 = y2(0, 1), y21 = y2(N, 0), y22 = y2(N, 1);
  // Da parametri Y a ABCD.
  return [
    div(sub(c(0), y22), y21),
    div(c(-1), y21),
    div(sub(mul(y12, y21), mul(y11, y22)), y21),
    div(sub(c(0), y11), y21),
  ];
}

const R50 = 50;

export function rispostaSfra(f: number, p: ParametriAvvolgimento): number {
  const w = 2 * Math.PI * f;
  // Ramo del nucleo in serie: [1 z; 0 1].
  const zNucleo = par(
    mul(c(0, w), div(c(p.Lm), c(1, f / p.fc))),
    div(c(1), c(w * p.C0 * p.tanDelta, w * p.C0)),
  );
  const [a, b, cc, d] = avvolgimento(f, p);
  const A = add(a, mul(zNucleo, cc));
  const B = add(b, mul(zNucleo, d));
  // Vout / Vin con carico di misura R50: H = 1 / (A + B / R50).
  const h = div(c(1), add(A, div(B, c(R50))));
  return 20 * Math.log10(abs(h));
}

// Valori dell'ordine di un avvolgimento MT/AT di un trasformatore di
// distribuzione, a livello di segnale SFRA (pochi volt, permeabilità
// iniziale del ferro):
// - Lm = 60 H, fc = 4 kHz: magnetizzazione a basso livello e taglio delle
//   correnti parassite in lamierini da 0,3 mm; Rc = 2π·fc·Lm ≈ 1,5 MΩ.
// - C0 = 0,4 nF: con Lm porta l'antirisonanza del nucleo a circa 1 kHz.
// - 24 dischi, Ls = 60 µH ciascuno in aria, ρ = 0,97 (accoppiamento in aria
//   0,97 fra dischi adiacenti, circa 0,5 fra i due estremi).
// - R0 = 1 Ω per disco (24 Ω in continua), effetto pelle da 20 kHz.
// - Cs = 3 nF fra dischi adiacenti (125 pF lungo tutto l'avvolgimento),
//   Cg = 0,16 nF per disco (3,8 nF verso massa): α = N·√(Cg/Cs) ≈ 5,5,
//   tipico di un avvolgimento a dischi continuo.
// - tanδ = 0,018, isolamento olio-carta nella banda della misura.
export const AVVOLGIMENTO_RIFERIMENTO: ParametriAvvolgimento = {
  Lm: 60,
  fc: 4000,
  C0: 0.4e-9,
  sezioni: 24,
  Ls: 60e-6,
  rho: 0.97,
  R0: 1,
  fs: 20000,
  Cs: 3e-9,
  Cg: 0.16e-9,
  tanDelta: 0.018,
};

// Deformazione radiale del terzo centrale dell'avvolgimento (dischi 12-19):
// la distanza verso il nucleo si riduce, Cg cresce del 45% e Cs del 5%.
// Sotto i 10 kHz lo scarto resta di qualche decimo di dB; sopra i 100 kHz
// le risonanze scendono in frequenza e cambiano ampiezza di diversi dB.
export const AVVOLGIMENTO_DEFORMATO: ParametriAvvolgimento = {
  ...AVVOLGIMENTO_RIFERIMENTO,
  deformazione: (i) => (i >= 12 && i <= 19 ? { cg: 1.45, cs: 1.05 } : { cg: 1, cs: 1 }),
};
