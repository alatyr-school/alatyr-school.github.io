# KDS Reliability / Error-Observability Model

This package adds a production-style reliability model for KDS on Supabase/Postgres and mirrors it in demo mode.

## Data planes

1. **Command plane**  
   `kds_command_log` stores each write intent (`move_status`, `update_note`), result and error metadata.

2. **State plane**  
   `orders.state_version` + `orders.last_command_id` make state transitions replayable.

3. **Business audit plane**  
   `order_events` now includes `command_id`, `trace_id`, `version_after`, `event_origin`.

4. **Technical plane**  
   `kds_technical_events` stores runtime faults (RPC failures, realtime channel issues, detector warnings).

5. **Incident plane**  
   `kds_anomalies`, `kds_incidents`, `kds_incident_timeline`, `kds_recovery_actions` model detection and response lifecycle.

## Core RPC additions

- `kds_log_technical_event(...)`
- `kds_report_client_heartbeat(...)`
- `kds_run_basic_consistency_scan()`
- `kds_create_incident_from_open_anomalies(...)`

## Detected scenarios

- duplicate active order numbers,
- stale client heartbeat snapshots,
- checksum divergence between screens.

## Demo fault injection matrix

- realtime event loss,
- duplicate order insertion,
- status jump (skipped workflow),
- screen divergence,
- stale snapshot,
- KPI drift.

Each injection generates correlated entries in:

- command log,
- technical events,
- anomalies,
- optional incident/recovery records.

In UI (demo mode), this is exposed via a dedicated **Error simulation lab** panel separated from regular demo order flow controls.
