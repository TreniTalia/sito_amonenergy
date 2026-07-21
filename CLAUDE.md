## Design Context

This project has captured strategic and visual design context — read before any design or frontend work:

- `PRODUCT.md` — register (**brand**), platform (**web**), target users, positioning, brand personality, anti-references, accessibility requirements.
- `DESIGN.md` — color tokens, typography, component patterns, elevation rules, do's/don'ts. Named "Industrial Precision" system: deep navy + paper, flat surfaces (no shadows), leaf-green/signal-blue reserved for micro-accents only.
- `.impeccable/design.json` — machine-readable sidecar extending DESIGN.md (tonal ramps, component HTML/CSS snippets, motion tokens).
- `SPEC_sito_amonenergy.md` — the full constructive spec (stack, content collections, CMS/admin panel, page-by-page copy, SEO, deploy). PRODUCT.md and DESIGN.md are distilled from it; consult the spec directly for implementation-level detail (folder structure, Zod schemas, exact page copy).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
