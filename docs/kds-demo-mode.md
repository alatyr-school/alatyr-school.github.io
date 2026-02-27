# KDS Demo Mode (System + Database Logic)

Demo mode now simulates backend/database behavior directly in UI when Supabase keys are not configured.

## Purpose

Show end-to-end logic to stakeholders without live infrastructure:

- order lifecycle transitions,
- audit stream generation,
- table-level data growth,
- session heartbeat behavior,
- guard rails for invalid transitions.

## Where it appears

When `window.__SUPABASE_URL__` / `window.__SUPABASE_ANON_KEY__` are placeholders:

- Dashboard connection badge shows `Demo DB`.
- `Demo backend simulator` panel appears above workflow board.

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
