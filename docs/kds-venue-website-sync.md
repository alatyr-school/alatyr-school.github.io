# Venue Website + KDS Sync

This module adds a customer-facing premium website panel directly into the app and keeps it synchronized with KDS data.

## What was added

- `VenueSiteShowcase` component (`src/components/VenueSiteShowcase.js`)
- Premium storefront UI section in dashboard (`KDSDashboard`)
- Live queue/order status feed backed by the same order source as KDS board
- Demo web checkout actions that instantly create website orders and push them into KDS flow

## Sync behavior

- **Live Supabase mode**: storefront reads exactly the same realtime-updated `orders` set as KDS.
- **Demo mode**: storefront can create web orders (`createWebsiteOrder`) that are inserted into demo runtime and instantly appear in:
  - storefront live feed
  - KDS workflow columns (`New/Prep/Ready`)
  - audit/event streams.

## Direct view URLs

Dashboard now supports URL-driven workspace modes:

- `?view=venue` — venue website focused view
- `?view=split` — website + operations split
- `?view=kds` — KDS operations only

## Website order bundles (demo)

- Signature Smash Combo
- Family Mix Pack
- Late Night Fuel

Each bundle maps to menu templates, source=`web`, and consistent checkout notes for traceability.
