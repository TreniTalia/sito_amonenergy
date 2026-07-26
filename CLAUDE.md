## Design Context

This project has captured strategic and visual design context — read before any design or frontend work:

- `PRODUCT.md` — register (**brand**), platform (**web**), target users, positioning, brand personality, anti-references, accessibility requirements.
- `DESIGN.md` — color tokens, typography, component patterns, elevation rules, do's/don'ts. **Read §0 first**: the current system is "Liquid Industrial" (glass materials, layered shadows, pill CTAs, Font Awesome), which supersedes the flat "Industrial Precision" rules stated in the sections below it. Same navy + green palette and technical voice in both.
- `.impeccable/design.json` — machine-readable sidecar extending DESIGN.md (tonal ramps, component HTML/CSS snippets, motion tokens).
- `SPEC_sito_amonenergy.md` — the full constructive spec (stack, content collections, CMS/admin panel, page-by-page copy, SEO, deploy). PRODUCT.md and DESIGN.md are distilled from it; consult the spec directly for implementation-level detail (folder structure, Zod schemas, exact page copy).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.
