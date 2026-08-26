import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const progetti = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/progetti' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      kv: z.string(),
      committente: z.string(),
      provincia: z.string(),
      tipologia: z.string(),
      immagine: image(),
      immagineAlt: z.string(),
      full: z.boolean().default(false),
      ordine: z.number(),
    }),
});

const servizi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/servizi' }),
  schema: ({ image }) =>
    z.object({
      titolo: z.string(),
      frase: z.string(),
      excerpt: z.string(),
      icona: z.string(),
      ordine: z.number(),
      immagine: image().optional(),
      punti: z
        .array(
          z.object({
            titolo: z.string(),
            testo: z.string(),
          }),
        )
        .optional(),
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

const contattiSchema = z.object({
  pagina: z.literal('contatti'),
  h1: z.string(),
  sub: z.string(),
  orari: z.string(),
});

const serviziHubSchema = z.object({
  pagina: z.literal('servizi'),
  eyebrow: z.string(),
  h1: z.string(),
  sub: z.string(),
});

const pagine = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pagine' }),
  schema: z.discriminatedUnion('pagina', [
    homeSchema,
    contattiSchema,
    serviziHubSchema,
  ]),
});

export const collections = { progetti, servizi, pagine };
