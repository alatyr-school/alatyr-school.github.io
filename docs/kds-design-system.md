# KDS Design System

This repo now uses a **premium operational design language** for the KDS interface.

For full redesign guidance see:

- `docs/kds-premium-redesign-package.md`

## Core principles

1. **Command-layer clarity** for rapid kitchen decisions.
2. **Executive metric readability** without visual noise.
3. **Card-first object model** where each order is a strong system entity.
4. **Disciplined state accents** (critical/warning/success), no neon overload.

## Token groups (index.css)

- Surface/background: `--bg-*`, `--surface-*`
- Borders: `--border-*`
- Text: `--text-*`
- Semantic states: `--state-*`
- Radius/spacing/type scales: `--radius-*`, `--space-*`, `--type-*`

## UI primitives

### `TouchButton`

Path: `src/components/ui/TouchButton.js`

Current variants:

- `forward`: workflow progression action
- `confirm`: completion action
- `reverse`: backward workflow action
- `secondary`: utility action (e.g., refresh/reset)
- `passive`: command/filter toggles
- `ghost`: fallback neutral

Sizes:

- `md` (toolbar/control layer)
- `lg` (order-card action zone)

### `MetricTile`

Path: `src/components/ui/MetricTile.js`

Tones:

- `default`
- `warning`
- `danger`
- `success`

## Dashboard capability set

Path: `src/components/KDSDashboard.js`

- Integrated command architecture (identity + indicators + control matrix)
- Search, filters, sort, density, sound toggle
- KPI strip with restrained semantic emphasis
- Workflow board with staged columns and order-card priority

## Shared KDS constants

Path: `src/constants/kds.js`

- `FIFTEEN_MINUTES_MS`
- `BOARD_COLUMNS`
- elapsed/late/search helper functions
