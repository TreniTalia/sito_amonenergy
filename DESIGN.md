---
name: Amon Energy
description: Industrial-precision B2B showcase for AT/MT/BT electrical and renewable energy infrastructure
colors:
  # Field world (navy) — construction, substations, fault-finding
  navy-950: "#0A2A44"
  navy-900: "#103B5F"
  navy-800: "#14486F"
  navy-700: "#1D5585"
  navy-300: "#7EA6C4"
  navy-100: "#E8EFF5"
  # Green — accent only, never a surface (see §0.1)
  green-500: "#3E8E5A"  # the logo leaf — shared bridge accent
  green-400: "#4FD07F"  # live "signal" green — telemetry, pulse, glow
  # RCS tier accents (from the company presentation)
  tier-basic: "#43B26A"
  tier-advance: "#E0912F"
  tier-pro: "#E05A3D"
  # Shared
  signal-400: "#4FB3D9"
  paper: "#FAFBFC"
  ink: "#16222E"
typography:
  hero:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "clamp(2.75rem, 1.4rem + 4.4vw, 5.75rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  display:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "clamp(2.4rem, 1.6rem + 2.6vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "clamp(1.9rem, 1.3rem + 1.9vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  control:
    fontFamily: "Source Serif 4 Variable, Georgia, serif"
    fontSize: "clamp(2rem, 1.3rem + 2.4vw, 3.4rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  button:
    # Shared by every CTA (.ds-btn-*). A hair under body so a pill CTA reads as
    # a control, not as a sentence.
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 600
    letterSpacing: "0.1em"
  pill-label:
    fontFamily: "Archivo Variable, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  button: "999px"  # Liquid Industrial: CTAs are Apple-style pills
  card: "26px"
  panel: "30px"
  sm: "16px"
  pill: "999px"
spacing:
  gap-sm: "16px"
  gap-md: "24px"
  gap-lg: "32px"
  section-y: "96px"
  section-y-lg: "144px"
components:
  # All CTAs share these metrics — see the .ds-btn-* block in global.css.
  button-primary:
    backgroundColor: "{colors.navy-900}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "13px 26px"
    minHeight: "48px"
  button-primary-hover:
    backgroundColor: "{colors.navy-700}"
  button-on-dark:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-950}"
    rounded: "{rounded.button}"
    padding: "13px 26px"
    minHeight: "48px"
  button-on-dark-hover:
    backgroundColor: "#FFFFFF"  # signal-400 is the hover *glow*, not the fill
  card-service:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Design System: Amon Energy

## 0. Update — "Liquid Industrial" (2026-07, supersedes the flat rules below)

At the brand owner's direction, the site moved from the original flat "Industrial
Precision" system to **Liquid Industrial**: the same navy + green palette and
technical voice, but rendered with an Apple-style **liquid-glass** language.
Where the sections below say *no glassmorphism, no gradients, no box-shadow, near-flat
corners, Lucide icons, 6px pill-free buttons* — those rules are **superseded**. Current
system (see `src/styles/global.css`, the source of truth):

- **Glass materials** — `.glass-dark` / `.glass-light` (translucent + `backdrop-filter`
  blur + specular sheen). Used for the floating navbar island, cards, overlays,
  the projects captions, the lightbox, and the mobile bar.
- **Soft layered depth** — `--shadow-sm/md/lg` plus signal/green glows on interactive
  accents. Tasteful navy/green gradients on buttons and surfaces are allowed.
- **Rounding** — pill CTAs (`--radius-btn: 999px`), cards `26px`, panels `30px`.
- **Icons** — **Font Awesome 6** (`fa6-solid` / `fa6-brands`) via `astro-icon`, not Lucide.
- **Buttons** — one coherent system: `.ds-btn-primary` (navy gradient), `.ds-btn-on-dark`
  (frosted white), `.ds-btn-ghost` (glass outline on dark), `.ds-btn-secondary` (glass on
  light), `.ds-btn-signal` (frosted white, control sections). All CTAs share identical metrics.
- **Signature ornament** — the "energy flow" spark gap (`WaveDivider.astro`), a WebGL
  Jacob's ladder; see §5 below for the full spec.

What still holds from below: the type scale, accessibility (WCAG 2.2 AA, reduced-motion,
44px targets), and the proof-over-adjectives content principles.

## 0.1 Update — one surface colour (2026-07, supersedes §1b)

At the brand owner's direction, the **two-world colour split is retired**. The green
drench that marked the control sections (Control Room, RCS, CCI) read as a second brand
rather than a second voice, so **navy is now the only surface colour of the site** —
continuity over contrast.

- **Surfaces are always navy.** `navy-950` / `navy-900` drenches, `.ds-panel` as navy
  glass, white-alpha hairlines and chips on dark. The dark green steps
  (`green-950…green-600`, `green-200`) are **deleted from the palette**, so a green
  section cannot come back by accident.
- **Green survives as an accent only** — `green-500` (logo leaf) and `green-400` (live
  signal): live dots, eyebrow dashes, step numbers, small icons, checkmarks, the map pin.
  Never a background, never a large fill, never body text.
- The **control voice still exists**, carried by what is not colour: the Source Serif 4
  display face, the live 24/7 dot, the telemetry panels, the scanline. `PageHero`'s
  `tone="control"` now only swaps the eyebrow dash for the live dot.
- Large glows follow the same rule: ambient washes use `navy-700/800` or `signal-400`,
  not green. `WaveDivider` has `signal` and `navy` tones only.

## 1. Overview

**Creative North Star: "Liquid Industrial"**

The standard is still the one the client's own 2024 brochure earned — the site should read like the print collateral of a serious electrical-engineering contractor: deep navy, generous white space, confident large-scale type, one signature graphic, not a SaaS product landing page. What changed in 2026-07 (§0) is the material, not the posture: surfaces are frosted glass over navy with soft layered depth, rendered with the precision of instrument housing rather than the softness of a consumer app. Restraint is still the default, and it is now enforced by *where* effects are allowed rather than by banning them outright — blur only where something genuinely floats (the Earned Blur Rule), shadows only in the navy's own shade (the Navy Shadow Rule), green only at the scale of a marker (the Leaf Rarity Rule). The system still rejects gradient text, decorative glassmorphism, and the stock-photography-and-superlative vocabulary of the prior WordPress site.

Density is generous but purposeful: sections carry one idea each (per PRODUCT.md's Design Principles), separated by real vertical space rather than dividers or shadows. The one permitted piece of ornament is the spark gap (§5) — a Jacob's ladder arc struck between two electrodes, used as the band that closes every hero. Everything else earns its place through structure (borders, type scale, color role) rather than decoration.

**Key Characteristics:**
- Deep navy + paper-white base, with leaf-green and signal-blue reserved for small, deliberate accents only
- Large, confident, geometric-expanded display type paired with a neutral, highly readable body face
- Depth from frosted glass and soft layered shadows, tuned to feel engineered rather than decorative (per §0)
- One recurring signature element (the spark gap), not a library of decorative motifs
- Mobile-first, touch-parity by construction: nothing shown only on hover

## 1b. The two-world system — **superseded by §0.1**

> The colour half of this section no longer applies: the control world is drenched in
> navy like everything else. What survives is the *voice* split (serif display, live dot,
> telemetry panels) and the leaf accent.

The identity runs on **two visual worlds**, each lifted from the company's own collateral, applied by section as art direction (consistency of *voice*, not of *treatment*):

- **Field world (navy)** — construction, substations, ricerca guasti, O&M in the field. Deep navy base, **Archivo Expanded** display type, real substation photography, flat surfaces with 1px borders. This is the brochure DNA and the site's default.
- **Control world (green)** — the Control Room, the RCS platform, the CCI, 24/7 monitoring. Deep forest-green drench (`green-950`), a **Source Serif 4** "authority" display voice, a bright **`green-400` signal** accent for live/telemetry cues (pulse dots, scanline, glow), and translucent `ds-panel` telemetry panels. This is the company-presentation DNA and marks the digital/monitoring surfaces (the home Control pillar, `/servizi/monitoraggio-e-controllo`).

The **A-leaf monogram** and the **leaf-green** accent are the bridge shared by both worlds. Serif is the semantic marker of the control/authority voice; the RCS tiers use `tier-basic` (green) / `tier-advance` (amber) / `tier-pro` (red) exactly as the presentation does.

## 2. Colors

A two-register palette: a deep navy family that does almost all of the work, plus two narrow-use accents borrowed directly from the logo.

### Primary
- **Amon Navy** (`#103B5F` / `navy-900`): the brand's primary color. CTA buttons on light backgrounds, primary interactive elements, the resting state of body-copy links.

### Secondary
- **Circuit Blue** (`#4FB3D9` / `signal-400`): the "signal" accent — technical detail lines, the eyebrow/kicker color option, focus-visible outlines, and the hover state of buttons placed on dark surfaces.

### Tertiary
- **Signal Leaf** (`#3E8E5A` / `green-500`): the logo's leaf green. Reserved for micro-accents only — a service-card icon, a small tag, a bullet. Never a section background, never a large fill.

### Neutral
- **Deep Navy** (`#0A2A44` / `navy-950`): the darkest step in the navy ramp. Full-viewport dark sections (hero, footer, dark service sub-hero, lightbox backdrop).
- **Navy Hover** (`#1D5585` / `navy-700`): interactive hover/focus state for elements on light backgrounds (card borders, link underlines).
- **Pale Navy** (`#E8EFF5` / `navy-100`): the light alternating section background, and the resting-state border color on service cards.
- **Paper** (`#FAFBFC` / `paper`): the base page background on light sections, and text color on dark sections.
- **Ink** (`#16222E` / `ink`): body text color on light/paper backgrounds.

### Named Rules
**The Leaf Rarity Rule.** `green-500` (and its bright sibling `green-400`) never fills a background, a button, or a section. It appears only as a small accent — an icon, a chip, a bullet — and its rarity is what keeps it feeling like the logo's signature color rather than a UI color.

**The Navy Ramp Rule.** `navy-950 → navy-900 → navy-700 → navy-100` is a single continuous tonal ramp, not four unrelated colors. Any new navy-family need (a fifth shade, a tint) should sit somewhere on this same ramp rather than introducing an unrelated blue.

## 3. Typography

**Display Font:** Archivo Variable (Expanded width axis for headings), with a system sans-serif fallback.
**Body Font:** Inter Variable, with a system sans-serif fallback.

**Character:** A geometric, technically-confident expanded display face against a neutral, highly-legible body face — the contrast is in width and personality (engineered vs. readable), not in serif/sans, which keeps the pairing calm rather than decorative.

### Hierarchy
- **Hero / Display** (`typography.hero` / `typography.display`): H1s only — one per page. `.text-hero` adds the Archivo width axis at 112%; `.text-display` opens it to 125%.
- **Headline** (`typography.headline`): H2 section titles, Archivo at 125% width.
- **Control** (`typography.control`): the Source Serif 4 authority voice — H2s in the Control Room / RCS narrative only. Since §0.1 this serif, not a colour, is what marks the control world.
- **Body** (400/500, 1rem, line-height 1.65): running copy. Capped at 65ch measure at every breakpoint — never wider.
- **Label** (600, 0.8rem, letter-spacing 0.1em, uppercase, color `signal-400` or `green-500`): the eyebrow line that opens most sections, preceded by a short 32×2px dash in navy or signal.

### Named Rules
**The No-Fluff Rule.** Copy is short, factual, and technically specific (norms, equipment, kV ratings) rather than motivational. If a sentence could appear on any B2B site regardless of industry, cut it.

**The Deliberate Eyebrow Rule.** The eyebrow-dash-title pattern is inherited directly from the client's print brochure — it is brand continuity, not a default scaffold. Because a tracked-uppercase kicker above every section is also the most common AI-generated-site tell, treat it as a *single system* applied consistently (same dash, same tracking, same two accent colors) rather than as filler reached for per-section; vary section rhythm through spacing, StatBar, marquee, and full-bleed gallery breaks so the eyebrow doesn't become the only structural device on the page.

## 4. Elevation

Soft, layered, and navy-tinted — never neutral gray. Depth comes from three stacked devices: a **shadow ramp** whose every layer is `rgba(10,42,68,…)` so shadows read as the navy's own shade rather than as dirt; **frosted glass** (`.glass-dark` / `.glass-light`, 24px blur + 180% saturate + a specular sheen gradient) for anything that floats over photography or a drench; and a **1px luminous border** — white-alpha on dark, navy-alpha on light — that draws the edge the blur alone would lose.

### Shadow Vocabulary
- **`--shadow-sm`** (`0 1px 2px rgba(10,42,68,.06), 0 4px 12px -4px rgba(10,42,68,.1)`): resting cards, chips, secondary buttons.
- **`--shadow-md`** (`0 2px 6px rgba(10,42,68,.07), 0 16px 40px -12px rgba(10,42,68,.18)`): primary CTAs, light glass panels, the map card.
- **`--shadow-lg`** (`0 10px 30px -10px rgba(10,42,68,.22), 0 30px 70px -24px rgba(10,42,68,.3)`): hover-lifted cards and buttons. Always paired with a −2px to −4px `translateY`.
- **`--shadow-glass`** (`0 10px 34px -10px rgba(10,42,68,.3), inset 0 1px 0 rgba(255,255,255,.16)`): dark glass only. The inset top highlight is the specular edge; without it glass reads as flat translucency.
- **`--glow-signal`** / **`--glow-green`** (`0 0 44px -8px …`): hover glows on interactive accents only, never at rest.

### Named Rules
**The Navy Shadow Rule.** Every shadow is mixed from `rgba(10, 42, 68, …)`. A neutral or black shadow anywhere in the system is a bug — on the paper background it reads as smudge rather than depth.

**The Earned Blur Rule.** `backdrop-filter` is for elements that genuinely float over something (the navbar island over the hero, captions over photography, the lightbox, telemetry panels over a drench). Glass on a static section against a flat background is decoration, and PRODUCT.md rules out decorative glassmorphism by name.

## 5. Components

### Buttons
One coherent system: five variants, identical metrics. 999px pill (`{rounded.button}`), 48px min-height, `13px 26px` padding, `typography.button`. Only the material changes.
- **`.ds-btn-primary`** — navy gradient (`navy-800 → navy-950`) + `--shadow-md` + an inset white top highlight. On light surfaces.
- **`.ds-btn-on-dark`** — frosted white glass, `navy-950` ink. On dark drenches and photography. Hover goes pure white with `--glow-signal`.
- **`.ds-btn-signal`** — same frosted white, used inside the control sections; it has no colour of its own (see §0.1).
- **`.ds-btn-ghost`** — 6% white fill, 34% white border, on dark only.
- **`.ds-btn-secondary`** — light glass, navy ink, on paper.
- **Hover, all variants:** −2px `translateY` plus a step up the shadow ramp. Never a colour-only hover.
- **Labels:** always explicit and task-specific — "Chiamaci ora", "Scrivici via email" — never generic verbs like "Invia" or "Submit".

### Cards (Service cards)
- **Corner style:** `26px` (`{rounded.card}`) — the Liquid Industrial radius; soft, deliberate, matched to the pill CTAs rather than contrasted against them.
- **Background:** light frosted glass — a white sheen gradient over 78% white, 14px blur, 150% saturate.
- **Border:** 1px `--glass-light-border` at rest; shifts to 40% `navy-700` on hover.
- **Hover:** −4px `translateY` into `--shadow-lg`.
- **Icon:** Font Awesome 6 in a 54px `.glass-icon` chip, tinted with the card's accent (`green-500` default, `signal-400` for the control service) — the icon is the card's one point of accent color.

### Telemetry Panel (`.ds-panel`)
The control sections' surface. Navy glass — a white sheen gradient over 62% `navy-900`, 16px blur, 160% saturate, 16% white hairline, `--shadow-md` plus an 8% inset top highlight. Holds the RCS screenshot, the three system cards, and the alarm-flow steps. Since §0.1 it carries no green; the control voice comes from the serif heading, the live dot, and the scanline instead.

### Eyebrow (recurring section opener)
- **Style:** a short 32×2px dash (navy or signal) directly before an uppercase, letter-spaced (0.1em) label in `signal-400` or `green-500`, immediately followed by the H2 and body copy. See the Deliberate Eyebrow Rule above for how this stays brand-specific rather than generic.

### Navigation (Header)
- **Style:** transparent over the dark hero image; solidifies to `navy-950` on scroll.
- **Items:** Azienda · Servizi (dropdown, 5 sub-services) · Progetti · Contatti.
- **Persistent CTA:** a `tel:` button stays visible in the header at every breakpoint (icon-only under 400px).
- **Mobile:** hamburger opens a full-height `navy-950` panel with large nav items and contact info at the base; a 56px sticky bottom bar with two 50/50 "Chiama" / "Email" buttons stays pinned below `md`, respecting `env(safe-area-inset-bottom)`.

### Spark Gap (signature component — `WaveDivider.astro`)
The one decorative element in the system, and the only place in the site where motion is the subject rather than a transition. A full-width band closing the hero of every page: a 1px conductor hairline runs in from both edges and terminates at two electrodes that diverge slightly as they rise — a spark gap. Between them an arc strikes at the narrow foot, climbs while it stretches and destabilises, then breaks and restrikes, on an irregular cadence (~1.6–2.9 s live, ~0.3–1.2 s dark). It is a Jacob's ladder, not a waveform: no sine, no travelling particles, no sparks thrown off.

- **Render:** WebGL via `ogl` (`Renderer` / `Program` / `Mesh` / `Triangle` imported by path, ~40 kB raw across four chunks), one fullscreen-triangle fragment shader. Glow is a distance field around the filament — a hot core plus two Gaussian falloffs — so the light is continuous, never stacked translucent layers. Premultiplied alpha makes it add to the dark hero instead of veiling it.
- **Filament shape:** fBm with *linear* interpolation, so the channel is straight runs meeting at sharp kinks. Displacement is pinned to zero at the electrodes; amplitude and bow grow with the climb and run away just before the break. Two counter-scrolling noise samples keep it shimmering in place rather than sliding sideways.
- **Restraint rules:** the arc is thin and cold. Neither tone carries green — a green bloom at this size would break the Leaf Rarity Rule. Only `signal` and `navy` exist (the `green` tone was removed with §0.1). Light fades out near both band edges so nothing hard-cuts at the boundary with the next section.
- **`animated={false}`** (dividers on light sections) never loads WebGL: it renders the same spark gap cold, in CSS, as a hairline and two pins. Same for the pre-hydration and no-WebGL fallback.
- **`prefers-reduced-motion`:** one frame, drawn once, frozen mid-climb.

No other decorative motif is permitted alongside it.

## 6. Do's and Don'ts

### Do:
- **Do** keep `green-500` / `green-400` to micro-accents only — a live dot, an eyebrow dash, a step number, an icon, a bullet (the Leaf Rarity Rule).
- **Do** drench every surface in navy, control sections included (the One Surface Rule).
- **Do** mix every shadow from `rgba(10, 42, 68, …)` so depth reads as the navy's own shade (the Navy Shadow Rule).
- **Do** write explicit, task-specific button labels ("Chiamaci ora", "Scrivici via email"), never "Invia" / "Submit".
- **Do** cap body copy at 65–68ch measure at every breakpoint.
- **Do** give every CTA the same metrics — 999px pill, 48px min-height, `13px 26px` — and change only the material.
- **Do** keep the `tel:` CTA visible in the header at every breakpoint, and in the mobile sticky bar below `md`.
- **Do** show gallery captions, metadata, and chip tags by default — never hover-only, since touch has no hover state.
- **Do** disable the spark-gap arc, StatBar counters, and all scroll-reveal animation under `prefers-reduced-motion`.

### Don't:
- **Don't** use green as a section background, a button fill, or body text — it is a logo accent, not a UI color (§0.1).
- **Don't** reintroduce a `green-950`/`green-900` surface step; they were deleted from the palette on purpose.
- **Don't** reach for `backdrop-filter` on elements that aren't actually floating over something (the Earned Blur Rule) — PRODUCT.md rules out decorative glassmorphism by name.
- **Don't** use `background-clip: text`, gradient text, or a saturated multi-stop gradient — this is an engineering brochure, not a SaaS landing page.
- **Don't** use stock photography of "smiling guys in hardhats" — source real brochure/site photography of the actual substations, vans, and control room.
- **Don't** build the projects gallery as Pinterest-style masonry, a uniform square-thumbnail grid, an autoplay carousel, a 50%-black-overlay-with-centered-title, or a flip/tilt hover card — all five are explicitly ruled out for this project.
- **Don't** use a hero-metric template (big number, small label, gradient accent) — the StatBar is the one sanctioned numbers block, and its placeholder values stay marked as such until the client confirms them.
- **Don't** let the eyebrow-dash pattern become the only section-opening device on a page — vary rhythm with StatBar, marquee, and full-bleed breaks (the Deliberate Eyebrow Rule).
