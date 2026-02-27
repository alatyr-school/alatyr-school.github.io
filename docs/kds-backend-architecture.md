# KDS Backend Architecture (Supabase/Postgres)

This document describes the production-ready backend model for the existing KDS frontend.

## Goals

- Realtime-ready order updates for multiple kitchen screens.
- Safe status transitions (`new -> prep -> ready -> served/cancelled`).
- Auditable event history.
- Role and station based access control.
- Extensible to multi-station routing.

## Domain model

### Core entities

1. **orders**  
   Single source of truth for order lifecycle and KPI timestamps.

2. **order_items**  
   Line items attached to orders.

3. **order_item_modifiers**  
   Row-based modifier model (`No onions`, `Extra pickles`) for filtering/analytics/audit.

4. **kitchen_stations**  
   Station/zone definitions (`grill`, `fryer`, `assembly`, `drinks`).

5. **order_events**  
   Immutable audit log of state transitions and operational actions.

### Supporting/service entities

1. **staff_profiles**  
   Role mapping for authenticated users.

2. **staff_station_memberships**  
   Station-level permissions per staff member.

3. **kitchen_sessions**  
   Device/screen sessions with `last_seen_at`.

4. **order_station_assignments**  
   Optional multi-station routing layer.

## Why order_events is mandatory

`updated_at` only indicates last mutation timestamp and loses:

- transition chain (full sequence),
- actor identity,
- device/session context,
- reason/payload metadata.

`order_events` solves incident debugging, SLA analytics, rollback forensics, and auditability.

## Modifier storage decision

Canonical model: **separate rows in `order_item_modifiers`**.

Reasons:

- SQL filtering and indexing,
- robust analytics (top modifiers, station trends),
- better audit granularity.

Backward compatibility is preserved by sync triggers between:

- legacy `order_items.modifiers` text[],
- normalized `order_item_modifiers` rows.

## Security model

- RLS enabled for all KDS tables.
- Policies enforce station visibility and update rights.
- Role functions (`viewer`, `cook`, `expediter`, `manager`, `admin`, `integration`).
- `order_events` is append-only from server triggers; direct client mutation is revoked.

## Realtime scope (data layer only)

The following tables are configured for realtime publication:

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_events`
- `kitchen_stations`

This schema intentionally stops at data architecture stage (no client subscription code here).
