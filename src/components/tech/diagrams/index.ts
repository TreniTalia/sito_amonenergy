import RispostaFrequenza from './RispostaFrequenza.astro';
import ScaricheParziali from './ScaricheParziali.astro';
import CurvaTempoCorrente from './CurvaTempoCorrente.astro';
import PuntiMisuraTrasformatore from './PuntiMisuraTrasformatore.astro';
import RampaIsolamento from './RampaIsolamento.astro';

// Mappa chiave → componente. Il campo `diagramma` nel Markdown contiene la
// chiave: così il contenuto sceglie il disegno senza importare nulla, e il
// pannello CMS può offrire un elenco chiuso.
export const DIAGRAMMI = {
  'risposta-frequenza': RispostaFrequenza,
  'scariche-parziali': ScaricheParziali,
  'curva-tempo-corrente': CurvaTempoCorrente,
  'punti-misura-trasformatore': PuntiMisuraTrasformatore,
  'rampa-isolamento': RampaIsolamento,
} as const;
