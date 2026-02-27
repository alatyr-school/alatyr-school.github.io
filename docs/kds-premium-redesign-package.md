# KDS Premium Visual Redesign Package

## 1) Design concept

**Direction:** operational command console with restrained premium aesthetics.

- Unified layered surfaces (command, metrics, workflow).
- Strong typographic hierarchy with low visual noise.
- Card-first object model where order tickets are dominant entities.
- Color discipline: muted neutrals, reserved state accents, no neon treatment.
- Consistent geometry/rhythm (one radius family, one spacing rhythm, one border language).

## 2) Color system

### Core surfaces

- `--bg-canvas`: main page background.
- `--surface-base`: default panel.
- `--surface-elevated`: card layer.
- `--surface-active`: interactive panel.

### Semantic states

- `--state-critical` + `--state-critical-soft` (late/urgent).
- `--state-warning` + `--state-warning-soft` (aging queue).
- `--state-success` + `--state-success-soft` (ready/completed flow).

### Text

- `--text-primary`: primary data.
- `--text-secondary`: labels and controls.
- `--text-muted`: helper/system metadata.

## 3) Typography scale

- `--type-12`: micro labels, chips, helper metadata.
- `--type-13`: secondary labels.
- `--type-14`: compact controls.
- `--type-15`: default UI text and item lines.
- `--type-16`: section headings.
- `--type-18`: column headings.
- `--type-20`: order identity.
- `--type-24`: page title.

Timer uses mono stack:

- `"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace`

## 4) Spacing scale

- `--space-1`..`--space-8` as the only spacing primitives.
- Major rhythm:
  - section-to-section: `space-5/6`
  - card internals: `space-2/3/4`
  - control clusters: `space-2/4`

## 5) Surface layer rules

1. **Command surface** = navigation + controls + passive status.
2. **Metrics surface** = executive summary, no action pressure.
3. **Workflow surface** = structural frame for Kanban flow.
4. **Order cards** = highest local elevation inside workflow surface.

All surfaces share:

- one border family (`--border-*`)
- one shadow discipline (`--shadow-surface`, `--shadow-object`)
- one radius system (`--radius-*`)

## 6) Card hierarchy rules

Order card anatomy:

1. `header` (identity + time block)
2. `items area` (content payload)
3. `action zone` (state progression controls)

Visual hierarchy:

- Order ID and timer are dominant.
- Items are medium emphasis.
- Modifiers are compact supportive chips.
- Action group is grounded and stable at card bottom.

## 7) Button hierarchy rules

- `forward`: move workflow forward (Start Prep).
- `confirm`: completion action (Mark Ready).
- `reverse`: move backward in workflow.
- `secondary`: top-level utility (Refresh/Reset Demo).
- `passive`: filter/toggle controls in command layer.

Buttons remain large-touch but visually restrained using muted contrast and border-led emphasis.

## 8) Top-area composition strategy

`kds-command-surface` is split into:

1. `kds-command-head` (identity + passive indicators + primary utility action)
2. `kds-control-architecture` (search + filters + sort + density as one command matrix)

This removes “independent widgets” feeling and creates one coherent command layer.

## 9) KPI strategy

- KPI tiles use restrained accents via thin left indicator, not full saturated fills.
- Number rhythm: label → value → helper.
- Conservative uppercase labeling for executive tone.
- Reduced chroma to avoid dashboard fatigue during long shifts.

## 10) Tailwind/CSS class translation guidance

If migrated to Tailwind, map to:

- Surface shells:
  - `rounded-2xl border border-slate-700/60 bg-slate-900/70 shadow-2xl`
- Control matrix:
  - `grid gap-4 lg:grid-cols-[1.8fr_repeat(3,minmax(0,1fr))]`
- KPI strip:
  - `grid gap-3 xl:grid-cols-4 md:grid-cols-2`
- Kanban board:
  - `grid gap-4 xl:grid-cols-3`
- Order card:
  - `rounded-xl border border-slate-600/40 bg-slate-800/80 shadow-xl`

State accents should remain subtle:

- Critical: `border-rose-400/50 bg-rose-500/10`
- Success: `border-emerald-400/45 bg-emerald-500/10`
- Warning: `border-amber-400/45 bg-amber-500/10`

## 11) Concrete implementation notes (without logic rewrite)

- Keep all existing hooks, state, realtime subscriptions, and move-order behavior untouched.
- Update only:
  - DOM composition in dashboard/column/card components
  - design tokens and visual classes
  - button visual variants
- Preserve:
  - filter/sort/density/audio behavior
  - card action scenarios
  - Supabase data structures and schema
