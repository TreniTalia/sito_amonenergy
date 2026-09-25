import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Un campo facoltativo lasciato vuoto nel pannello arriva come stringa vuota
// (o lista vuota), non come campo assente: Sveltia lo scrive così finché non
// si attiva `output.omit_empty_optional_fields`, e i file già salvati restano
// com'erano. Ma i componenti ripiegano sull'italiano con `??`, che scatta
// solo sull'assente: la card inglese di Erchie è andata online senza titolo.
// Qui il vuoto torna assente prima di arrivare ai componenti.
const facoltativo = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null || (Array.isArray(v) && v.length === 0) ? undefined : v), schema.optional());

const progetti = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/progetti' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      kv: z.string(),
      potenza: facoltativo(z.string()),
      committente: z.string(),
      provincia: z.string(),
      tipologia: z.string(),
      // Cover: la foto reale della stazione mostrata nello slider. Assente
      // finché non arriva dal pannello: il componente mostra un placeholder,
      // mai uno schema unifilare (i clienti non ce li lasciano condividere) né
      // una foto stock spacciata per quella specifica realizzazione.
      immagine: facoltativo(image()),
      // Le altre foto della stazione, che il lightbox scorre dopo la cover
      // (vedi `fotoProgetto` in src/lib/progetti.ts). Il pannello le salva
      // come elenco di percorsi con un upload multiplo. In passato
      // `z.array(image())` dava un ImageMetadata senza `format`; con Astro 7
      // il difetto non si riproduce (verificato il 2026-09-25).
      galleria: facoltativo(z.array(image())),
      immagineAlt: z.string(),
      ordine: z.number(),
      // Testo semplice nel frontmatter, non più corpo markdown: titoli ed
      // elenchi scritti nell'editor potevano rompere la card, e sul campo di
      // testo il pannello può imporre il limite di lunghezza tarato sullo
      // slider.
      descrizione: z.string(),
      // Traduzioni inglesi, tutte opzionali con fallback all'italiano nei
      // componenti che le leggono (getTesto* in ProjectSlider.astro): la
      // collection non si biforca in due cartelle perché i dati di cantiere
      // sotto — committente, provincia, kv, potenza — sono comuni alle due
      // lingue e per richiesta del cliente non vanno tradotti. Solo il testo
      // di marketing (titolo, tipologia, alt, descrizione) si traduce qui.
      titoloEn: facoltativo(z.string()),
      tipologiaEn: facoltativo(z.string()),
      immagineAltEn: facoltativo(z.string()),
      descrizioneEn: facoltativo(z.string()),
    }),
});

const servizi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servizi' }),
  schema: () =>
    z.object({
      titolo: z.string(),
      excerpt: z.string(),
      icona: z.string(),
      ordine: z.number(),
    }),
});

// Pagine tecniche di dettaglio (una per servizio diagnostico). Sostituiscono
// le vecchie /verifiche-strumentali/* di WordPress, verso cui puntano i 301:
// ogni campo esiste perché una di quelle pagine perdeva qualcosa a non averlo.
const serviziDettaglio = defineCollection({
  // Un livello di cartella per lingua: il glob prende entrambe, la route
  // filtra per prefisso dell'id.
  loader: glob({ pattern: '**/*.md', base: './src/content/servizi-dettaglio' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      lead: z.string(),
      // Foto di cover della PageHero. Stessa foto per la pagina e la sua
      // gemella inglese; cambia solo l'alt.
      copertina: image(),
      copertinaAlt: z.string(),
      seoTitle: z.string(),
      seoDescription: z.string(),
      ordine: z.number(),
      // Colonna dell'indice "Approfondimenti tecnici" su /servizi/: prove
      // strumentali da una parte, sistemi di controllo dall'altra.
      area: z.enum(['diagnostica', 'controllo']),
      diagramma: z.string(),
      problema: z.array(z.string()).min(2),
      parametri: z.array(z.object({ titolo: z.string(), testo: z.string(), icona: z.string() })).min(4),
      fasi: z.array(z.object({ titolo: z.string(), testo: z.string() })).min(3),
      // Gli strumenti veri, e solo quelli: lo stesso dato vive anche in
      // `pagine/azienda.yaml`, e prima o poi i due elenchi andranno incrociati.
      // Mescolarci dentro i parametri di prova renderebbe l'incrocio impossibile.
      strumentazione: z.array(z.object({ modello: z.string(), nota: z.string() })).min(1),
      // Come si misura, non con che cosa: tensione di prova, banda, cablaggio,
      // messa a terra. Opzionale perché RCS, CCI, teledistacco e lettura
      // contatori sono sistemi, non prove strumentali, e un assetto di misura
      // non ce l'hanno. Stessa forma delle `voci` di SpecPanel, così ci si
      // passa direttamente.
      assettoMisura: z.array(z.object({ etichetta: z.string(), valore: z.string() })).optional(),
      norma: z.object({ codice: z.string(), titolo: z.string(), note: z.string() }),
      caso: z.object({ progetto: z.string(), testo: z.string() }).optional(),
      faq: z.array(z.object({ d: z.string(), r: z.string() })).min(3),
      correlati: z.array(z.string()).min(2),
    }),
});

const homeSchema = z.object({
  pagina: z.literal('home'),
  hero: z.object({
    eyebrow: z.string(),
    h1: z.string(),
    sub: z.string(),
    ctaPrimaria: z.string(),
    ctaSecondaria: z.string(),
  }),
  chiSiamoBreve: z.object({
    testo: z.string(),
    link: z.string(),
  }),
  controllo: z
    .object({
      eyebrow: z.string(),
      titolo: z.string(),
      testo: z.string(),
    })
    .optional(),
  statbar: z.array(
    z.object({
      valore: z.string(),
      label: z.string(),
      finto: z.boolean(),
    }),
  ),
  percheAmon: z.array(
    z.object({
      titolo: z.string(),
      testo: z.string(),
    }),
  ),
  marqueeTitolo: z.string(),
});

const aziendaSchema = z.object({
  pagina: z.literal('azienda'),
  eyebrow: z.string(),
  h1: z.string(),
  // Il sottotitolo della cover non è decorativo: senza, la cover di Azienda
  // restava più bassa di quelle di Lavori e Contatti.
  sub: z.string(),
  storiaTitolo: z.string(),
  storia: z.string(),
  missioneTitolo: z.string(),
  missione: z.string(),
  raggioTitolo: z.string(),
  raggioAzione: z.string(),
  strumentazioneTitolo: z.string(),
  strumentazioneTesto: z.string(),
  strumentazione: z.array(z.string()),
  marqueeTitolo: z.string(),
});

const contattiSchema = z.object({
  pagina: z.literal('contatti'),
  h1: z.string(),
  sub: z.string(),
  orari: z.string(),
});

const serviziSchema = z.object({
  pagina: z.literal('servizi'),
  eyebrow: z.string(),
  h1: z.string(),
  sub: z.string(),
  controllo: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
    testo: z.string(),
    rcs: z.object({
      titolo: z.string(),
      testo: z.string(),
      specs: z.array(z.string()),
    }),
    cci: z.object({
      titolo: z.string(),
      testo: z.string(),
      specs: z.array(z.string()),
      partnerNome: z.string(),
      partnerUrl: z.string(),
    }),
  }),
  ingegneriaElettrica: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
    sub: z.string(),
    voci: z.array(
      z.object({
        titolo: z.string(),
        testo: z.string(),
        icona: z.string(),
      }),
    ),
  }),
  costruzioneGestione: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
  }),
  tecnologie: z.object({
    eyebrow: z.string(),
    titolo: z.string(),
    sub: z.string(),
    voci: z.array(
      z.object({
        nome: z.string(),
        logo: z.string().optional(),
      }),
    ),
  }),
});

const pagine = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pagine' }),
  schema: z.discriminatedUnion('pagina', [
    homeSchema,
    aziendaSchema,
    contattiSchema,
    serviziSchema,
  ]),
});

export const collections = { progetti, servizi, serviziDettaglio, pagine };
