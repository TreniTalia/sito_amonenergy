// Prova di isolamento in alta tensione a rampa controllata, fino a 80 kV come
// il Megger HV Test 80 kV della nostra dotazione. La corrente che lo
// strumento legge ha due parti: la carica della capacità del componente,
// C·dV/dt, costante finché la tensione sale e nulla in tenuta, e la
// conduzione attraverso l'isolante, V/R. Un isolante sano ha R costante. Uno
// compromesso regge fino a una soglia e poi la sua resistenza crolla:
// la corrente si impenna prima di arrivare al valore di prova.
export interface ProvaIsolamento {
  C: number; // F
  Rsano: number; // Ω
  durataRampaMin: number;
  sogliaKv: number;
  scalaKv: number; // quanto rapidamente crolla R sopra soglia
}

export const PROVA_ESEMPIO: ProvaIsolamento = { C: 50e-9, Rsano: 100e9, durataRampaMin: 8, sogliaKv: 45, scalaKv: 10 };

export function tensione(tMin: number, p: ProvaIsolamento): number {
  return Math.min(80, (80 * tMin) / p.durataRampaMin);
}

export function correnteFuga(tMin: number, p: ProvaIsolamento, stato: 'sano' | 'compromesso'): number {
  const kv = tensione(tMin, p);
  const carica = tMin < p.durataRampaMin ? p.C * ((80e3 / p.durataRampaMin) / 60) : 0;
  const R = stato === 'sano' || kv <= p.sogliaKv ? p.Rsano : p.Rsano * Math.exp(-(kv - p.sogliaKv) / p.scalaKv);
  return (carica + (kv * 1e3) / R) * 1e6;
}
