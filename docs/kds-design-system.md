# KDS Design System

## Principles

1. **Readable at distance**: high contrast, large numerals, bold hierarchy.
2. **Glove-friendly controls**: minimum touch target `3.5rem` for critical actions.
3. **Urgency-first**: late orders and queue pressure are visually elevated.
4. **Operational speed**: controls minimize taps for filtering and status movement.

## Token Layers (index.css)

- **Color tokens**: `--color-*` (surface, text, state tones).
- **Spacing tokens**: `--space-*`.
- **Typography tokens**: `--text-*`.
- **Radius tokens**: `--radius-*`.
- **Touch target token**: `--touch-target`.

## UI Primitives

### `TouchButton`

Path: `src/components/ui/TouchButton.js`

Variants:

- `primary`: move to prep / primary line action
- `success`: completion / handoff
- `ghost`: secondary controls
- `danger`: destructive/escalation actions

Sizes:

- `md`: toolbars and filters
- `lg`: order-card action area

### `MetricTile`

Path: `src/components/ui/MetricTile.js`

Displays operational KPIs in tones:

- `success`
- `warning`
- `danger`
- `default`

## Dashboard Capability Set

Path: `src/components/KDSDashboard.js`

- Search by order number, item name, modifier text.
- Late-only toggle.
- Sort modes: oldest first, urgency first.
- Density modes: comfortable, compact.
- Sound alert toggle for newly late orders.
- KPI strip: Active, Late, Average Wait, Ready.

## KDS Constants

Path: `src/constants/kds.js`

- `FIFTEEN_MINUTES_MS`
- `BOARD_COLUMNS`
- shared helpers: elapsed time, late detection, search matching
