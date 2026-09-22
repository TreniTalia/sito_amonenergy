// Sorgente unica delle coppie di URL fra le due lingue.
//
// Da qui derivano tre cose che altrimenti divergerebbero in silenzio: gli
// hreflang nell'head, il selettore di lingua nell'header e i test che
// verificano che ogni pagina esista in entrambe le lingue. Uno slug inglese
// cambiato qui si propaga ovunque; cambiato altrove, rompe solo un pezzo.
//
// Gli slug inglesi sono tradotti e non copiati dall'italiano: uno slug è un
// fattore di ranking debole ma reale, e un lettore inglese capisce
// /en/services/insulation-testing/, non /en/services/prove-isolamento/.
export type Lingua = 'it' | 'en';

export const ROTTE = [
  { it: '/', en: '/en/' },
  { it: '/azienda/', en: '/en/company/' },
  { it: '/servizi/', en: '/en/services/' },
  { it: '/servizi/sfra/', en: '/en/services/sfra/' },
  { it: '/servizi/misure-scariche-parziali/', en: '/en/services/partial-discharge-measurement/' },
  { it: '/servizi/verifica-protezioni-at-mt/', en: '/en/services/hv-mv-protection-testing/' },
  { it: '/servizi/verifiche-trasformatori-di-potenza/', en: '/en/services/power-transformer-testing/' },
  { it: '/servizi/prove-isolamento/', en: '/en/services/insulation-testing/' },
  { it: '/servizi/rcs-monitoraggio-cabina-mt/', en: '/en/services/rcs-mv-substation-monitoring/' },
  { it: '/servizi/cci-controllore-centrale-impianto/', en: '/en/services/cci-central-plant-controller/' },
  { it: '/servizi/teledistacco-a72/', en: '/en/services/a72-remote-tripping/' },
  { it: '/servizi/lettura-contatori/', en: '/en/services/meter-reading/' },
  { it: '/lavori/', en: '/en/projects/' },
  { it: '/contatti/', en: '/en/contacts/' },
  { it: '/privacy-policy/', en: '/en/privacy-policy/' },
] as const;

/** Data una pathname, dice in che lingua siamo e qual è la pagina gemella. */
export function gemella(pathname: string): { lingua: Lingua; altra: string | null } {
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const r = ROTTE.find((r) => r.it === p || r.en === p);
  if (!r) return { lingua: p.startsWith('/en/') ? 'en' : 'it', altra: null };
  return r.it === p ? { lingua: 'it', altra: r.en } : { lingua: 'en', altra: r.it };
}
