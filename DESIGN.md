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
  # Control world (green) — Control Room, RCS, CCI, 24/7 monitoring
  green-950: "#061C12"
  green-900: "#0B2C1D"
  green-800: "#123F2A"
  green-700: "#1A5335"
  green-600: "#227244"
  green-500: "#3E8E5A"  # the logo leaf — shared bridge accent
  green-400: "#4FD07F"  # live "signal" green — telemetry, pulse, glow
  green-200: "#BFE6CD"
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
  button-primary:
    backgroundColor: "{colors.navy-900}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.navy-700}"
  button-on-dark:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-950}"
    rounded: "{rounded.button}"
    padding: "14px 32px"
  button-on-dark-hover:
    backgroundColor: "{colors.signal-400}"
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
  light), `.ds-btn-signal` (green). All CTAs share identical metrics.
- **Signature ornament** — the "energy flow" spark gap (`WaveDivider.astro`), a WebGL
  Jacob's ladder; see §5 below for the full spec.

What still holds from below: the navy+green palette and roles, the two-world (field/control)
art direction, the type scale, accessibility (WCAG 2.2 AA, reduced-motion, 44px targets),
and the proof-over-adjectives content principles.

## 1. Overview

**Creative North Star: "Industrial Precision"**

This is the term the client's own 2024 brochure already earned, and it's the standard the site is held to: the site should read like the print collateral of a serious electrical-engineering contractor — deep navy, generous white space, confident large-scale type, one restrained signature graphic — not like a SaaS product landing page. Every decision below defaults to restraint. The system rejects gradients, glassmorphism, decorative card shadows, and the stock-photography-and-superlative vocabulary of the prior WordPress site.

Density is generous but purposeful: sections carry one idea each (per PRODUCT.md's Design Principles), separated by real vertical space rather than dividers or shadows. The one permitted piece of ornament is the signal-wave motif — a thin electrical-waveform line, lifted directly from the brochure, used as a section divider with a barely-perceptible horizontal drift. Everything else earns its place through structure (borders, type scale, color role) rather than decoration.

**Key Characteristics:**
- Deep navy + paper-white base, with leaf-green and signal-blue reserved for small, deliberate accents only
- Large, confident, geometric-expanded display type paired with a neutral, highly readable body face
- Flat surfaces throughout — depth comes from borders and translucent dark overlay panels, never box-shadow
- One recurring signature element (the signal wave), not a library of decorative motifs
- Mobile-first, touch-parity by construction: nothing shown only on hover

## 1b. The two-world system

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
- **Signal Leaf** (`#3E8E5A` / `leaf-500`): the logo's leaf green. Reserved for micro-accents only — a service-card icon, a small tag, a bullet. Never a section background, never a large fill.

### Neutral
- **Deep Navy** (`#0A2A44` / `navy-950`): the darkest step in the navy ramp. Full-viewport dark sections (hero, footer, dark service sub-hero, lightbox backdrop).
- **Navy Hover** (`#1D5585` / `navy-700`): interactive hover/focus state for elements on light backgrounds (card borders, link underlines).
- **Pale Navy** (`#E8EFF5` / `navy-100`): the light alternating section background, and the resting-state border color on service cards.
- **Paper** (`#FAFBFC` / `paper`): the base page background on light sections, and text color on dark sections.
- **Ink** (`#16222E` / `ink`): body text color on light/paper backgrounds.

### Named Rules
**The Leaf Rarity Rule.** `leaf-500` never fills a background, a button, or a section. It appears only as a small accent — an icon, a chip, a bullet — and its rarity is what keeps it feeling like the logo's signature color rather than a UI color.

**The Navy Ramp Rule.** `navy-950 → navy-900 → navy-700 → navy-100` is a single continuous tonal ramp, not four unrelated colors. Any new navy-family need (a fifth shade, a tint) should sit somewhere on this same ramp rather than introducing an unrelated blue.

## 3. Typography

**Display Font:** Archivo Variable (Expanded width axis for headings), with a system sans-serif fallback.
**Body Font:** Inter Variable, with a system sans-serif fallback.

**Character:** A geometric, technically-confident expanded display face against a neutral, highly-legible body face — the contrast is in width and personality (engineered vs. readable), not in serif/sans, which keeps the pairing calm rather than decorative.

### Hierarchy
- **Display** (700, `clamp(2.4rem, 5vw, 4rem)`, line-height 1.05, letter-spacing -0.02em): H1s only — hero headline, one per page.
- **Headline** (700, `clamp(1.8rem, 3.5vw, 2.6rem)`, line-height 1.15, letter-spacing -0.01em): H2 section titles.
- **Body** (400/500, 1rem, line-height 1.65): running copy. Capped at 65ch measure at every breakpoint — never wider.
- **Label** (600, 0.8rem, letter-spacing 0.1em, uppercase, color `signal-400` or `leaf-500`): the eyebrow line that opens most sections, preceded by a short 32×2px dash in navy or signal.

### Named Rules
**The No-Fluff Rule.** Copy is short, factual, and technically specific (norms, equipment, kV ratings) rather than motivational. If a sentence could appear on any B2B site regardless of industry, cut it.

**The Deliberate Eyebrow Rule.** The eyebrow-dash-title pattern is inherited directly from the client's print brochure — it is brand continuity, not a default scaffold. Because a tracked-uppercase kicker above every section is also the most common AI-generated-site tell, treat it as a *single system* applied consistently (same dash, same tracking, same two accent colors) rather than as filler reached for per-section; vary section rhythm through spacing, StatBar, marquee, and full-bleed gallery breaks so the eyebrow doesn't become the only structural device on the page.

## 4. Elevation

Flat by default, everywhere, with no exceptions carved out for floating UI (confirmed: lightbox backdrop, mobile nav panel, and the on-scroll solid header all stay shadow-free). Depth is conveyed two ways instead: 1px borders that shift color on hover/focus, and translucent dark navy panels (`navy-950` at partial opacity) for overlays — the hero image overlay, the full-bleed gallery caption panel, and the lightbox backdrop.

### Named Rules
**The Flat-by-Default Rule.** No `box-shadow` anywhere in the system. Where a SaaS pattern would reach for a shadow (a raised card, a floating panel, a sticky header), use a border, a background-color shift, or a `navy-950` translucent panel instead.

## 5. Components

### Buttons
- **Shape:** 6px radius, explicitly not pill-shaped (`{rounded.button}`).
- **On light:** `navy-900` background, `paper` text; hover shifts to `navy-700`.
- **On dark:** `paper` background, `navy-950` text; hover shifts to `signal-400`.
- **Labels:** always explicit and task-specific — "Chiamaci ora", "Scrivici via email" — never generic verbs like "Invia" or "Submit".
- **Padding:** generous (14px 32px baseline), full-width and stacked on mobile viewports.

### Cards (Service cards)
- **Corner style:** sharp, near-square (2px radius) — deliberately less soft than the buttons, so corners read as structural/architectural rather than friendly.
- **Border:** 1px `navy-100` at rest; shifts to 1px `navy-700` plus a small upward translate on hover.
- **Background:** `paper`, text `ink`.
- **Icon:** Lucide, 28px, `leaf-500` — the icon is the card's one point of accent color.
- **Shadow:** none, per the Flat-by-Default Rule.

### Eyebrow (recurring section opener)
- **Style:** a short 32×2px dash (navy or signal) directly before an uppercase, letter-spaced (0.1em) label in `signal-400` or `leaf-500`, immediately followed by the H2 and body copy. See the Deliberate Eyebrow Rule above for how this stays brand-specific rather than generic.

### Navigation (Header)
- **Style:** transparent over the dark hero image; solidifies to `navy-950` on scroll.
- **Items:** Azienda · Servizi (dropdown, 5 sub-services) · Progetti · Contatti.
- **Persistent CTA:** a `tel:` button stays visible in the header at every breakpoint (icon-only under 400px).
- **Mobile:** hamburger opens a full-height `navy-950` panel with large nav items and contact info at the base; a 56px sticky bottom bar with two 50/50 "Chiama" / "Email" buttons stays pinned below `md`, respecting `env(safe-area-inset-bottom)`.

### Spark Gap (signature component — `WaveDivider.astro`)
The one decorative element in the system, and the only place in the site where motion is the subject rather than a transition. A full-width band closing the hero of every page: a 1px conductor hairline runs in from both edges and terminates at two electrodes that diverge slightly as they rise — a spark gap. Between them an arc strikes at the narrow foot, climbs while it stretches and destabilises, then breaks and restrikes, on an irregular cadence (~1.6–2.9 s live, ~0.3–1.2 s dark). It is a Jacob's ladder, not a waveform: no sine, no travelling particles, no sparks thrown off.

- **Render:** WebGL via `ogl` (`Renderer` / `Program` / `Mesh` / `Triangle` imported by path, ~40 kB raw across four chunks), one fullscreen-triangle fragment shader. Glow is a distance field around the filament — a hot core plus two Gaussian falloffs — so the light is continuous, never stacked translucent layers. Premultiplied alpha makes it add to the dark hero instead of veiling it.
- **Filament shape:** fBm with *linear* interpolation, so the channel is straight runs meeting at sharp kinks. Displacement is pinned to zero at the electrodes; amplitude and bow grow with the climb and run away just before the break. Two counter-scrolling noise samples keep it shimmering in place rather than sliding sideways.
- **Restraint rules:** the arc is thin and cold. `signal`/`navy` tones carry no green at all — a green bloom at this size would break the Leaf Rarity Rule; green is the subject only in the `green` (Control world) tone. Light fades out near both band edges so nothing hard-cuts at the boundary with the next section.
- **`animated={false}`** (dividers on light sections) never loads WebGL: it renders the same spark gap cold, in CSS, as a hairline and two pins. Same for the pre-hydration and no-WebGL fallback.
- **`prefers-reduced-motion`:** one frame, drawn once, frozen mid-climb.

No other decorative motif is permitted alongside it.

## 6. Do's and Don'ts

### Do:
- **Do** keep `leaf-500` to micro-accents only — an icon, a chip, a bullet (the Leaf Rarity Rule).
- **Do** build all depth from 1px borders and `navy-950` translucent panels, never `box-shadow` (the Flat-by-Default Rule).
- **Do** write explicit, task-specific button labels ("Chiamaci ora", "Scrivici via email"), never "Invia" / "Submit".
- **Do** cap body copy at 65ch measure at every breakpoint.
- **Do** keep the two radius scales distinct: 6px for buttons, 2px for cards/containers.
- **Do** keep the `tel:` CTA visible in the header at every breakpoint, and in the mobile sticky bar below `md`.
- **Do** show gallery captions, metadata, and chip tags by default — never hover-only, since touch has no hover state.
- **Do** disable the signal-wave drift, StatBar counters, and all scroll-reveal animation under `prefers-reduced-motion`.

### Don't:
- **Don't** use `leaf-500` as a section or button background — it is a logo accent, not a UI color.
- **Don't** add `box-shadow` to cards, the mobile nav panel, the sticky header, or the lightbox.
- **Don't** use gradients, `background-clip: text`, or glassmorphism anywhere — this is an engineering brochure, not a SaaS landing page.
- **Don't** use stock photography of "smiling guys in hardhats" — source real brochure/site photography of the actual substations, vans, and control room.
- **Don't** build the projects gallery as Pinterest-style masonry, a uniform square-thumbnail grid, an autoplay carousel, a 50%-black-overlay-with-centered-title, or a flip/tilt hover card — all four are explicitly ruled out for this project.
- **Don't** use pill-shaped buttons; radius is 6px, full stop.
- **Don't** let the eyebrow-dash pattern become the only section-opening device on a page — vary rhythm with StatBar, marquee, and full-bleed breaks (the Deliberate Eyebrow Rule).
