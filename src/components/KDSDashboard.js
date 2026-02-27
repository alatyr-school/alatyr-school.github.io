import React, { useCallback, useEffect, useMemo, useState } from "react";
import htm from "htm";
import { KanbanColumn } from "./KanbanColumn.js";
import { useKitchenOrders } from "../hooks/useKitchenOrders.js";

const html = htm.bind(React.createElement);

const boardColumns = [
  { key: "new", title: "New" },
  { key: "prep", title: "Prep" },
  { key: "ready", title: "Ready" },
];

function buildDemoOrders() {
  const now = Date.now();
  return [
    {
      id: "demo-1001",
      order_number: 1001,
      status: "new",
      placed_at: new Date(now - 3 * 60 * 1000).toISOString(),
      started_at: null,
      ready_at: null,
      updated_at: new Date(now - 3 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-1001-1",
          item_name: "Classic Burger",
          quantity: 2,
          modifiers: ["No onions", "Extra pickles"],
          position: 1,
        },
        {
          id: "demo-1001-2",
          item_name: "Fries",
          quantity: 1,
          modifiers: ["Well done"],
          position: 2,
        },
      ],
    },
    {
      id: "demo-1002",
      order_number: 1002,
      status: "prep",
      placed_at: new Date(now - 11 * 60 * 1000).toISOString(),
      started_at: new Date(now - 8 * 60 * 1000).toISOString(),
      ready_at: null,
      updated_at: new Date(now - 8 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-1002-1",
          item_name: "Double Cheeseburger",
          quantity: 1,
          modifiers: ["No mayo"],
          position: 1,
        },
        {
          id: "demo-1002-2",
          item_name: "Onion Rings",
          quantity: 1,
          modifiers: [],
          position: 2,
        },
      ],
    },
    {
      id: "demo-1003",
      order_number: 1003,
      status: "ready",
      placed_at: new Date(now - 18 * 60 * 1000).toISOString(),
      started_at: new Date(now - 14 * 60 * 1000).toISOString(),
      ready_at: new Date(now - 2 * 60 * 1000).toISOString(),
      updated_at: new Date(now - 2 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-1003-1",
          item_name: "Chicken Burger",
          quantity: 1,
          modifiers: ["No tomatoes"],
          position: 1,
        },
      ],
    },
  ];
}

function statusClass(connectionState) {
  if (connectionState === "live") return "status-pill status-pill--live";
  if (connectionState === "error") return "status-pill status-pill--error";
  if (connectionState === "offline") return "status-pill status-pill--offline";
  return "status-pill";
}

export function KDSDashboard() {
  const [nowMs, setNowMs] = useState(Date.now());
  const [demoOrders, setDemoOrders] = useState(() => buildDemoOrders());
  const {
    orders,
    loading,
    error,
    connectionState,
    updatingOrderIds,
    moveOrder,
    reloadOrders,
    isSupabaseConfigured,
  } = useKitchenOrders();

  useEffect(() => {
    const timerId = globalThis.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => globalThis.clearInterval(timerId);
  }, []);

  const activeOrders = isSupabaseConfigured ? orders : demoOrders;

  const groupedOrders = useMemo(() => {
    const groups = { new: [], prep: [], ready: [] };
    for (const order of activeOrders) {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    }
    return groups;
  }, [activeOrders]);

  const handleMoveOrder = useCallback(
    (orderId, nextStatus) => {
      if (isSupabaseConfigured) {
        moveOrder(orderId, nextStatus);
        return;
      }

      const nowIso = new Date().toISOString();
      setDemoOrders((current) =>
        current.map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          return {
            ...order,
            status: nextStatus,
            started_at:
              nextStatus === "new"
                ? null
                : order.started_at ?? nowIso,
            ready_at: nextStatus === "ready" ? nowIso : null,
            updated_at: nowIso,
          };
        })
      );
    },
    [isSupabaseConfigured, moveOrder]
  );

  const currentConnectionState = isSupabaseConfigured ? connectionState : "offline";
  const currentConnectionLabel = isSupabaseConfigured
    ? connectionState === "live"
      ? "Live"
      : connectionState
    : "Demo";

  return html`
    <main className="kds-dashboard">
      <header className="kds-topbar">
        <div>
          <h1>Kitchen Display System</h1>
          <p className="kds-topbar__subtitle">
            Realtime order board for hot line execution
          </p>
        </div>
        <div className="kds-topbar__actions">
          <span className=${statusClass(currentConnectionState)}>
            ${currentConnectionLabel}
          </span>
          ${isSupabaseConfigured
            ? html`
                <button className="touch-btn touch-btn--ghost" onClick=${reloadOrders}>
                  Refresh
                </button>
              `
            : html`
                <button
                  className="touch-btn touch-btn--ghost"
                  onClick=${() => setDemoOrders(buildDemoOrders())}
                >
                  Reset Demo
                </button>
              `}
        </div>
      </header>

      ${!isSupabaseConfigured
        ? html`
            <section className="config-warning">
              <h2>Demo mode is active</h2>
              <p>
                Set <code>window.__SUPABASE_URL__</code> and
                <code>window.__SUPABASE_ANON_KEY__</code> in
                <code>index.html</code> to enable live realtime updates.
              </p>
            </section>
          `
        : null}

      ${isSupabaseConfigured && error ? html`<p className="error-banner">${error}</p>` : null}
      ${isSupabaseConfigured && loading
        ? html`<p className="loading-banner">Loading kitchen orders...</p>`
        : null}

      <section className="kds-board">
        ${boardColumns.map(
          (column) => html`
            <${KanbanColumn}
              key=${column.key}
              title=${column.title}
              statusKey=${column.key}
              orders=${groupedOrders[column.key]}
              nowMs=${nowMs}
              onMoveOrder=${handleMoveOrder}
              updatingOrderIds=${updatingOrderIds}
            />
          `
        )}
      </section>
    </main>
  `;
}
