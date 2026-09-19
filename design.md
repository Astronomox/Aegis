/* Hallmark · pre-emit critique: P5 H4 E5 S5 R5 V5 */

# Aegis Dashboard — Design System

Genre: modern-minimal
Tone: utilitarian
Macrostructure: Workbench
Theme: Coral (light warm-grey, coral accent)
Nav: N1b SaaS three-section
Footer: Ft2 Inline single line
Enrichment: none (dashboard IS the product)
Motion: minimal (status pulse + map marker transitions)

---

## Typography

| Role | Family | Weight | Size | Tracking |
|------|--------|--------|------|----------|
| Display | Geist Sans | 600 | clamp(1.5rem, 2vw + 0.75rem, 2.25rem) | -0.02em |
| H2 | Geist Sans | 600 | clamp(1.125rem, 1.5vw + 0.5rem, 1.5rem) | -0.015em |
| H3 | Geist Sans | 500 | 1rem | -0.01em |
| Body | Geist Sans | 400 | 0.875rem | 0 |
| Small | Geist Sans | 400 | 0.75rem | 0.01em |
| Mono | JetBrains Mono | 400 | 0.8125rem | 0 |
| Mono-sm | JetBrains Mono | 400 | 0.6875rem | 0.02em |

Single-family discipline: Geist Sans top-to-bottom. No serif. No italic headers.

---

## Palette (OKLCH)

### Paper
| Token | Value | Use |
|-------|-------|-----|
| --color-paper | oklch(97% 0.005 85) | App background |
| --color-paper-raised | oklch(100% 0 0) | Sidebar, cards |
| --color-paper-overlay | oklch(95% 0.005 85) | Dropdowns, modals |
| --color-paper-hover | oklch(93% 0.008 85) | Hover states |

### Ink
| Token | Value | Use |
|-------|-------|-----|
| --color-ink | oklch(18% 0.01 85) | Primary text |
| --color-ink-muted | oklch(42% 0.01 85) | Secondary text |
| --color-ink-faint | oklch(62% 0.008 85) | Placeholders, disabled |

### Accent
| Token | Value | Use |
|-------|-------|-----|
| --color-accent | oklch(65% 0.2 18) | Links, active nav, focus rings |
| --color-accent-dim | oklch(95% 0.03 18) | Accent backgrounds at 10% |
| --color-accent-bright | oklch(72% 0.22 18) | Hover on accent elements |

### Status
| Token | Value | Use |
|-------|-------|-----|
| --color-safe | oklch(62% 0.17 155) | Online, resolved, success |
| --color-safe-dim | oklch(95% 0.03 155) | Safe status backgrounds |
| --color-warn | oklch(72% 0.16 75) | Warning states |
| --color-warn-dim | oklch(95% 0.04 75) | Warning backgrounds |
| --color-danger | oklch(58% 0.22 25) | Critical, incident active |
| --color-danger-dim | oklch(95% 0.04 25) | Danger backgrounds |

### Rules & Borders
| Token | Value | Use |
|-------|-------|-----|
| --color-rule | oklch(90% 0.008 85) | Hairline borders |
| --color-rule-strong | oklch(82% 0.01 85) | Section dividers |

---

## Spacing (4pt scale)

| Token | Value |
|-------|-------|
| --space-2xs | 0.25rem |
| --space-xs | 0.5rem |
| --space-sm | 0.75rem |
| --space-md | 1rem |
| --space-lg | 1.5rem |
| --space-xl | 2rem |
| --space-2xl | 3rem |
| --space-3xl | 4rem |

---

## Radii

| Token | Value | Use |
|-------|-------|-----|
| --radius-sm | 4px | Inputs, small elements |
| --radius-md | 6px | Cards, buttons |
| --radius-lg | 8px | Modals, panels |

---

## Shadows

| Token | Value |
|-------|-------|
| --shadow-sm | 0 1px 2px oklch(0% 0 0 / 0.04) |
| --shadow-md | 0 4px 12px oklch(0% 0 0 / 0.06) |
| --shadow-lg | 0 8px 24px oklch(0% 0 0 / 0.08) |

---

## Component Voice

- **Buttons:** Outlined chip (C1) for secondary actions. Filled pill for primary. Verbs only: "View", "Dismiss", "Export". No "Click here".
- **Cards:** Subtle border (`--color-rule`), no shadow by default. Shadow on hover only.
- **Inputs:** Light paper background, border on focus only. Monospace for IDs, coordinates, timestamps.
- **Tables:** Hairline row separators. Tabular numerics for counts. No zebra striping.
- **Status indicators:** Colored dot + label. Pulsing dot for active alerts only.
- **Navigation:** Active item has accent underline. Inactive items are muted. No icons in nav.
- **Map:** Light tiles. Markers use status colors. Cluster markers show count.

---

## Anti-patterns enforced

- No italic headers (gate 38a)
- No gradient text (gate 2)
- No glassmorphism
- No bouncy easings (gate 12)
- No invented metrics (gate 46)
- No re-drawn UI chrome (gate 47)
- All tokens via var(), no inline colors (gate 48)
- Mobile responsive at 320/375/414/768px (gates 34, 49-53)
- No horizontal scroll (gate 34)
- No N1a, no Ft3 (AI fingerprints)
