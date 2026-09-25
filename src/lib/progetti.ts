import type { ImageMetadata } from 'astro';

// Le foto di un progetto in un'unica sequenza, quella che il lightbox scorre:
// prima la cover, poi la galleria nell'ordine scelto nel pannello. La cover
// caricata anche nella galleria compare una volta sola, e senza cover ne fa
// le veci la prima foto della galleria — chi carica le foto non deve sapere
// quale campo usa lo slider.
//
// Il testo alternativo della cover è quello scritto a mano nel pannello; le
// foto della galleria non hanno un campo loro (scelta del cliente: niente da
// compilare a ogni upload) e ricevono un testo automatico.

export interface FotoProgetto {
  src: ImageMetadata;
  alt: string;
}

interface DatiFoto {
  immagine?: ImageMetadata;
  galleria?: ImageMetadata[];
}

interface Testi {
  titolo: string;
  altCopertina: string;
  lingua?: 'it' | 'en';
}

export function fotoProgetto({ immagine, galleria = [] }: DatiFoto, { titolo, altCopertina, lingua = 'it' }: Testi): FotoProgetto[] {
  const viste = new Set<string>();
  const foto = [immagine, ...galleria].filter((f): f is ImageMetadata => {
    if (!f || viste.has(f.src)) return false;
    viste.add(f.src);
    return true;
  });
  const totale = foto.length;
  const auto = (i: number) => (lingua === 'en' ? `${titolo}, photo ${i + 1} of ${totale}` : `${titolo}, foto ${i + 1} di ${totale}`);
  return foto.map((src, i) => ({ src, alt: i === 0 && immagine ? altCopertina : auto(i) }));
}
