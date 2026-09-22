import RispostaFrequenza from './RispostaFrequenza.astro';
import ScaricheParziali from './ScaricheParziali.astro';
import CurvaTempoCorrente from './CurvaTempoCorrente.astro';
import PuntiMisuraTrasformatore from './PuntiMisuraTrasformatore.astro';
import RampaIsolamento from './RampaIsolamento.astro';
import CatenaRcs from './CatenaRcs.astro';
import OsservabilitaControllabilita from './OsservabilitaControllabilita.astro';
import CatenaA72 from './CatenaA72.astro';
import CatenaContatori from './CatenaContatori.astro';

// Mappa chiave → componente. Il campo `diagramma` nel Markdown contiene la
// chiave: così il contenuto sceglie il disegno senza importare nulla, e il
// pannello CMS può offrire un elenco chiuso.
export const DIAGRAMMI = {
  'risposta-frequenza': RispostaFrequenza,
  'scariche-parziali': ScaricheParziali,
  'curva-tempo-corrente': CurvaTempoCorrente,
  'punti-misura-trasformatore': PuntiMisuraTrasformatore,
  'rampa-isolamento': RampaIsolamento,
  'catena-rcs': CatenaRcs,
  'osservabilita-controllabilita': OsservabilitaControllabilita,
  'catena-a72': CatenaA72,
  'catena-contatori': CatenaContatori,
} as const;
