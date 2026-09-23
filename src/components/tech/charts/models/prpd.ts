// Diagramma PRPD (phase-resolved partial discharge): ogni punto è un impulso,
// con la fase della tensione di prova a cui è comparso e la sua carica
// apparente in pC (metodo convenzionale IEC 60270). Una cavità interna
// all'isolante scarica sui fronti di salita delle due semionde, con due
// "orecchie" quasi simmetriche; la negativa un po' più alta, come si vede di
// solito. Ampiezze log-normali, seme fisso.
import { mulberry32, normale } from './random.ts';

export function tensioneProva(fase: number, Upicco: number): number {
  return Upicco * Math.sin((fase * Math.PI) / 180);
}

export function nuvolaPrpd(seme: number, n: number): { fase: number; pC: number }[] {
  const rnd = mulberry32(seme);
  const out: { fase: number; pC: number }[] = [];
  for (let i = 0; i < n; i++) {
    const negativa = rnd() < 0.5;
    const centro = negativa ? 225 : 45;
    let fase = centro + normale(rnd) * 17;
    fase = ((fase % 360) + 360) % 360;
    const mediana = negativa ? 24 : 18;
    const pC = mediana * Math.exp(normale(rnd) * 0.45);
    out.push({ fase: Math.round(fase * 10) / 10, pC: Math.round(pC * 10) / 10 });
  }
  return out;
}
