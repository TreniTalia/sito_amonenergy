// Risposta in frequenza end-to-end di un avvolgimento, come la misura la
// IEC 60076-18: sorgente su 50 Ω al terminale di linea, misura su 50 Ω al
// terminale opposto, rapporto fra le due tensioni in dB.
//
// L'avvolgimento è una rete a scala di N sezioni. Ogni sezione ha in serie
// l'induttanza L con le perdite R, in parallelo alla capacità fra spire Cs, e
// verso terra la capacità Cg con una piccola conduttanza G. In bassa
// frequenza domina l'induttanza (il nucleo), salendo compaiono le risonanze
// fra L e le capacità distribuite. Una deformazione radiale avvicina
// l'avvolgimento al cassone: Cg cresce su un gruppo di sezioni e le
// risonanze alte si spostano, quelle basse no. È quello che la SFRA vede.
import { c, add, mul, div, par, abs, type C } from './complex.ts';

export interface ParametriAvvolgimento {
  sezioni: number;
  L: number; // H, induttanza della prima sezione (terminale di linea)
  R: number; // Ω per sezione
  Cs: number; // F per sezione
  Cg: number; // F per sezione
  G: number; // S per sezione
  /**
   * Rapporto fra l'induttanza dell'ultima sezione e quella della prima
   * (< 1): le sezioni non sono identiche, l'induttanza scende lungo la
   * scala secondo una progressione geometrica. Una scala con N sezioni
   * tutte uguali ha un solo circuito risonante L‖Cs, che le N sezioni
   * ripetono in fase: la profondità della risonanza si somma linearmente in
   * dB e sfonda il fondo scala della misura (verificato: con sezioni
   * identiche il minimo scende oltre -300 dB). Un vero avvolgimento a
   * dischi non ha questo problema perché non è fatto di sezioni identiche
   * (spire di entrata/uscita, dischi di regolazione, dischi principali) e
   * perché sezioni non adiacenti sono comunque accoppiate da mutua
   * induttanza, che la scala a soli accoppiamenti fra vicini non
   * rappresenta. Distribuire l'induttanza lungo la scala è il modo più
   * semplice per ottenere lo stesso effetto: le N risonanze si separano in
   * frequenza invece di sommarsi, restando dentro i -100 dB della misura.
   */
  rapportoL: number;
  /** Moltiplicatore di Cg per indice di sezione (deformazione). */
  fattoreCg?: (i: number) => number;
}

type M = [C, C, C, C]; // A, B, C, D
const molt = (a: M, b: M): M => [
  add(mul(a[0], b[0]), mul(a[1], b[2])),
  add(mul(a[0], b[1]), mul(a[1], b[3])),
  add(mul(a[2], b[0]), mul(a[3], b[2])),
  add(mul(a[2], b[1]), mul(a[3], b[3])),
];

const R50 = 50;

export function rispostaSfra(f: number, p: ParametriAvvolgimento): number {
  const w = 2 * Math.PI * f;
  let m: M = [c(1), c(0), c(0), c(1)];
  for (let i = 0; i < p.sezioni; i++) {
    // Induttanza della sezione i-esima: progressione geometrica da L (i = 0)
    // a L·rapportoL (i = sezioni - 1). Vedi il commento su `rapportoL`.
    const Li = p.L * Math.pow(p.rapportoL, i / (p.sezioni - 1));
    const zL = add(c(p.R), c(0, w * Li));
    const zC = c(0, -1 / (w * p.Cs));
    const zs = par(zL, zC);
    const cg = p.Cg * (p.fattoreCg?.(i) ?? 1);
    const y = add(c(p.G), c(0, w * cg));
    m = molt(m, [c(1), zs, c(0), c(1)]);
    m = molt(m, [c(1), c(0), y, c(1)]);
  }
  // Vout / Vin con carico di misura R50: H = 1 / (A + B / R50).
  const h = div(c(1), add(m[0], div(m[1], c(R50))));
  return 20 * Math.log10(abs(h));
}

// Parametri tarati (Step 3 della development plan): 24 sezioni con
// induttanza a rapporto geometrico 1:100.000 (0,1 H → 1 µH, vedi
// `rapportoL`) per separare le risonanze invece di sommarle; R = 110 Ω per
// sezione smorza abbastanza da restare sopra i -100 dB anche nel punto più
// profondo, lasciando comunque leggibili le risonanze (il criterio "almeno
// tre minimi sopra 1 kHz" ne trova cinque). Cs e Cg (50 nF e 10 nF per
// sezione, il rapporto Cg/Cs = 0,2 fissa il livello del plateau capacitivo
// alle alte frequenze) sono l'ordine di grandezza delle capacità
// distribuite di un avvolgimento AT/MT reale.
export const AVVOLGIMENTO_RIFERIMENTO: ParametriAvvolgimento = {
  sezioni: 24,
  L: 0.1,
  R: 110,
  Cs: 5e-8,
  Cg: 1e-8,
  G: 1e-7,
  rapportoL: 1e-5,
};

// Deformazione radiale sulle ultime 3 sezioni (indici 21-23, quelle con
// induttanza più bassa e quindi risonanza propria più alta): Cg maggiorato
// del 65%. Toccando solo le sezioni ad alta frequenza lo scostamento resta
// sotto 1 dB per tutta la banda sotto i 10 kHz — dove una SFRA reale
// coincide con l'impronta di riferimento — e supera i 3 dB sopra i 100 kHz,
// la firma di una deformazione dell'avvolgimento.
export const AVVOLGIMENTO_DEFORMATO: ParametriAvvolgimento = {
  ...AVVOLGIMENTO_RIFERIMENTO,
  fattoreCg: (i) => (i >= 21 ? 1.65 : 1),
};
