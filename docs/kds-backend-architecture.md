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
- Safe write entrypoints are exposed as RPC functions instead of ad-hoc direct writes.

## Realtime scope (data layer only)

The following tables are configured for realtime publication:

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_events`
- `kitchen_stations`

This schema intentionally stops at data architecture stage (no client subscription code here).

## RPC contract (safe write path)

1. `kds_touch_kitchen_session(...) -> kitchen_sessions`  
   Creates/refreshes a device session and updates `last_seen_at`.

2. `kds_move_order_status(...) -> orders`  
   Validates transition + station permissions + optional optimistic lock (`p_expected_updated_at`), then writes status and emits audit events.

3. `kds_update_order_note(...) -> orders`  
   Controlled update of order note (`special_instructions`) with audit event.

`reason_code` and `actor_session_id` are passed to audit layer using transaction-local settings consumed by `order_events` trigger.

## Reliability / observability layer

The schema now includes a dedicated observability plane for incident response:

- `kds_command_log` — immutable command intake/result journal (accepted/rejected/failed/noop).
- `kds_technical_events` — technical errors, realtime drop signals, RPC/runtime diagnostics.
- `kds_client_heartbeats` — per-screen heartbeat and checksum snapshot.
- `kds_anomalies` — detector output (`duplicate_order`, `screen_divergence`, `stale_snapshot`, etc).
- `kds_incidents` + `kds_incident_timeline` — incident lifecycle and operator timeline.
- `kds_recovery_actions` — executed remediation actions and outcomes.

### Correlation model

`kds_move_order_status` and `kds_update_order_note` now generate:

- `command_id` and `trace_id`,
- command results in `kds_command_log`,
- correlated `order_events.command_id/trace_id`,
- technical failure events in `kds_technical_events`.

`orders` also tracks `state_version` and `last_command_id` for deterministic replay/debug.

### Detector + incident RPCs

- `kds_run_basic_consistency_scan()` inserts anomalies for:
  - duplicate active order numbers,
  - stale heartbeat sessions,
  - board checksum divergence between screens.
- `kds_create_incident_from_open_anomalies(...)` links open anomalies to a new incident and writes incident timeline.

### Access model

- All observability tables have RLS enabled.
- Raw writes are revoked from client roles (`anon`/`authenticated`).
- Data mutation is routed through security-definer RPCs/triggers.
