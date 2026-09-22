import RispostaFrequenza from './RispostaFrequenza.astro';

// Mappa chiave → componente. Il campo `diagramma` nel Markdown contiene la
// chiave: così il contenuto sceglie il disegno senza importare nulla, e il
// pannello CMS può offrire un elenco chiuso.
export const DIAGRAMMI = {
  'risposta-frequenza': RispostaFrequenza,
} as const;
