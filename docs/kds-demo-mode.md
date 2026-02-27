# KDS Demo Mode (System + Database Logic)

Demo mode now simulates backend/database behavior directly in UI when Supabase keys are not configured.

## Purpose

Show end-to-end logic to stakeholders without live infrastructure:

- order lifecycle transitions,
- audit stream generation,
- table-level data growth,
- session heartbeat behavior,
- guard rails for invalid transitions,
- reliability fault simulation and incident analysis.

## Where it appears

When `window.__SUPABASE_URL__` / `window.__SUPABASE_ANON_KEY__` are placeholders:

- Dashboard connection badge shows `Demo DB`.
- `Demo backend simulator` panel appears above workflow board.
- `Error simulation lab` appears as a separate panel for fault/incident drills.

## Simulated tables

- `orders`
- `order_items`
- `order_item_modifiers`
- `order_events`
- `kitchen_stations`
- `kitchen_sessions`
- `staff_profiles`
- `staff_station_memberships`
- `order_station_assignments`
- `kds_command_log`
- `kds_technical_events`
- `kds_client_heartbeats`
- `kds_anomalies`
- `kds_incidents`
- `kds_incident_timeline`
- `kds_recovery_actions`

## Scenario controls

- **Insert Mock Order**: simulates `order_created` insert flow.
- **Run Logic Step**: advances pipeline automatically (`new -> prep -> ready -> served`) or creates order.
- **Autoplay**: periodic simulation loop for live demo.
- **Advance New -> Prep**
- **Advance Prep -> Ready**
- **Serve Ready Order**
- **Cancel New Order** (with reason code)
- **Session Heartbeat**
- **Reset Scenario**

## Fault injection controls

- **Inject Realtime Drop**: creates technical event + realtime gap anomaly.
- **Inject Duplicate Order**: inserts duplicated active order number anomaly.
- **Inject Status Jump**: simulates illegal transition (`new -> ready`).
- **Inject Screen Divergence**: simulates checksum mismatch across screens.
- **Inject Stale Snapshot**: forces old heartbeat age.
- **Inject KPI Drift**: simulates analytics mismatch.
- **Delivery Failure Drill**: bundle scenario (realtime drop + stale snapshot + analysis scan).
- **Data Integrity Drill**: bundle scenario (duplicate + divergence + KPI drift + scan).
- **Workflow Desync Drill**: bundle scenario (status jump + divergence + scan).

## Analysis and response controls

- **Зроби помилку зараз**: instant critical desync injection for live demonstration.
- **Показати шлях виправлення**: executes a 4-step recovery playbook (detect -> incident -> recover -> verify).
- **Run Analysis Scan**: detector pass over duplicates, stale sessions, checksum divergence.
- **Create Incident**: creates incident from open anomalies.
- **Run Recovery Resync**: resolves sync-related anomalies by heartbeat/checksum resync.

## Transition rules (same as backend model)

- `new -> prep | cancelled`
- `prep -> ready | new | cancelled`
- `ready -> served | prep | cancelled`

Invalid transitions are blocked and shown as demo error.

## Audit simulation

Every mutation appends a demo `order_events` entry with:

- event type (`moved_to_prep`, `served`, etc),
- status transition,
- actor/session context,
- optional reason code,
- event timestamp.

Additionally, demo runtime writes:

- command-level entries to `kds_command_log`,
- technical diagnostics to `kds_technical_events`,
- detector findings to `kds_anomalies`,
- incident and recovery traces for response workflows.
