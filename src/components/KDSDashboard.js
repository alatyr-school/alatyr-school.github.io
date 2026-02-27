import React, { useEffect, useMemo, useState } from "react";
import htm from "htm";
import { KanbanColumn } from "./KanbanColumn.js";
import { useKitchenOrders } from "../hooks/useKitchenOrders.js";

const html = htm.bind(React.createElement);

const boardColumns = [
  { key: "new", title: "New" },
  { key: "prep", title: "Prep" },
  { key: "ready", title: "Ready" },
];

function statusClass(connectionState) {
  if (connectionState === "live") return "status-pill status-pill--live";
  if (connectionState === "error") return "status-pill status-pill--error";
  if (connectionState === "offline") return "status-pill status-pill--offline";
  return "status-pill";
}

export function KDSDashboard() {
  const [nowMs, setNowMs] = useState(Date.now());
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

  const groupedOrders = useMemo(() => {
    const groups = { new: [], prep: [], ready: [] };
    for (const order of orders) {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    }
    return groups;
  }, [orders]);

  if (!isSupabaseConfigured) {
    return html`
      <main className="kds-dashboard">
        <section className="config-warning">
          <h1>Kitchen Display System</h1>
          <p>
            Set <code>window.__SUPABASE_URL__</code> and
            <code>window.__SUPABASE_ANON_KEY__</code> in
            <code>index.html</code> to enable realtime kitchen updates.
          </p>
        </section>
      </main>
    `;
  }

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
          <span className=${statusClass(connectionState)}>
            ${connectionState === "live" ? "Live" : connectionState}
          </span>
          <button className="touch-btn touch-btn--ghost" onClick=${reloadOrders}>
            Refresh
          </button>
        </div>
      </header>

      ${error ? html`<p className="error-banner">${error}</p>` : null}
      ${loading ? html`<p className="loading-banner">Loading kitchen orders...</p>` : null}

      <section className="kds-board">
        ${boardColumns.map(
          (column) => html`
            <${KanbanColumn}
              key=${column.key}
              title=${column.title}
              statusKey=${column.key}
              orders=${groupedOrders[column.key]}
              nowMs=${nowMs}
              onMoveOrder=${moveOrder}
              updatingOrderIds=${updatingOrderIds}
            />
          `
        )}
      </section>
    </main>
  `;
}
