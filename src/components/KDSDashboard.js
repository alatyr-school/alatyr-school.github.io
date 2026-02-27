import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import htm from "htm";
import { KanbanColumn } from "./KanbanColumn.js";
import { useKitchenOrders } from "../hooks/useKitchenOrders.js";
import {
  BOARD_COLUMNS,
  getElapsedMs,
  isOrderLate,
  matchesOrderQuery,
} from "../constants/kds.js";
import { MetricTile } from "./ui/MetricTile.js";
import { TouchButton } from "./ui/TouchButton.js";

const html = htm.bind(React.createElement);

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
    {
      id: "demo-1004",
      order_number: 1004,
      status: "new",
      placed_at: new Date(now - 6 * 60 * 1000).toISOString(),
      started_at: null,
      ready_at: null,
      updated_at: new Date(now - 6 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-1004-1",
          item_name: "Bacon Burger",
          quantity: 1,
          modifiers: ["No onions", "No mustard"],
          position: 1,
        },
      ],
    },
  ];
}

function statusClass(connectionState) {
  if (connectionState === "live") return "status-pill status-pill--live";
  if (connectionState === "error") return "status-pill status-pill--error";
  if (connectionState === "demo") return "status-pill status-pill--demo";
  if (connectionState === "offline") return "status-pill status-pill--offline";
  return "status-pill";
}

function formatAverageWait(orders, nowMs) {
  if (orders.length === 0) {
    return "0 min";
  }

  const averageMs =
    orders.reduce((sum, order) => sum + getElapsedMs(order.placed_at, nowMs), 0) /
    orders.length;
  const minutes = Math.round(averageMs / 60000);
  return `${minutes} min`;
}

function playAlertTone() {
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "square";
  oscillator.frequency.value = 980;
  gain.gain.value = 0.04;

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.18);

  globalThis.setTimeout(() => {
    audioContext.close();
  }, 250);
}

export function KDSDashboard() {
  const [nowMs, setNowMs] = useState(Date.now());
  const [demoOrders, setDemoOrders] = useState(() => buildDemoOrders());
  const [searchText, setSearchText] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [sortMode, setSortMode] = useState("oldest");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const previousLateOrderIdsRef = useRef(new Set());
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

  useEffect(() => {
    const currentLateIds = new Set(
      activeOrders.filter((order) => isOrderLate(order, nowMs)).map((order) => order.id)
    );

    if (audioEnabled) {
      let hasNewLateOrder = false;
      for (const orderId of currentLateIds) {
        if (!previousLateOrderIdsRef.current.has(orderId)) {
          hasNewLateOrder = true;
          break;
        }
      }

      if (hasNewLateOrder) {
        playAlertTone();
      }
    }

    previousLateOrderIdsRef.current = currentLateIds;
  }, [activeOrders, nowMs, audioEnabled]);

  const filteredOrders = useMemo(() => {
    const lateAwareOrders = activeOrders.filter((order) => {
      if (lateOnly && !isOrderLate(order, nowMs)) {
        return false;
      }

      return matchesOrderQuery(order, searchText);
    });

    const sortedOrders = [...lateAwareOrders].sort((a, b) => {
      const aPlacedAtMs = new Date(a.placed_at).getTime();
      const bPlacedAtMs = new Date(b.placed_at).getTime();

      if (sortMode === "urgency") {
        const aLate = isOrderLate(a, nowMs);
        const bLate = isOrderLate(b, nowMs);
        if (aLate !== bLate) {
          return aLate ? -1 : 1;
        }
      }

      return aPlacedAtMs - bPlacedAtMs;
    });

    return sortedOrders;
  }, [activeOrders, lateOnly, nowMs, searchText, sortMode]);

  const groupedOrders = useMemo(() => {
    const groups = { new: [], prep: [], ready: [] };
    for (const order of filteredOrders) {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    }
    return groups;
  }, [filteredOrders]);

  const totalOrders = activeOrders.length;
  const lateOrders = activeOrders.filter((order) => isOrderLate(order, nowMs)).length;
  const readyOrders = activeOrders.filter((order) => order.status === "ready").length;
  const averageWait = formatAverageWait(activeOrders, nowMs);

  const queueTone =
    lateOrders >= 5 || totalOrders >= 15
      ? "danger"
      : lateOrders >= 2 || totalOrders >= 10
        ? "warning"
        : "success";

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

  const currentConnectionState = isSupabaseConfigured ? connectionState : "demo";
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
                <${TouchButton}
                  label="Refresh"
                  variant="ghost"
                  size="md"
                  onClick=${reloadOrders}
                />
              `
            : html`
                <${TouchButton}
                  label="Reset Demo"
                  variant="ghost"
                  size="md"
                  onClick=${() => setDemoOrders(buildDemoOrders())}
                />
              `}
        </div>
      </header>

      <section className="kds-toolbar">
        <div className="toolbar-search">
          <label className="toolbar-label" htmlFor="kds-search">Search</label>
          <input
            id="kds-search"
            className="toolbar-input"
            type="text"
            value=${searchText}
            placeholder="Order #, item, modifier..."
            onInput=${(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Filters</span>
          <div className="toolbar-actions">
            <${TouchButton}
              label="Late only"
              variant="ghost"
              size="md"
              isActive=${lateOnly}
              onClick=${() => setLateOnly((current) => !current)}
            />
            <${TouchButton}
              label=${audioEnabled ? "Sound on" : "Sound off"}
              variant=${audioEnabled ? "success" : "ghost"}
              size="md"
              isActive=${audioEnabled}
              onClick=${() => setAudioEnabled((current) => !current)}
            />
          </div>
        </div>

        <div className="toolbar-group">
          <label className="toolbar-label" htmlFor="kds-sort">Sort</label>
          <select
            id="kds-sort"
            className="toolbar-select"
            value=${sortMode}
            onChange=${(event) => setSortMode(event.target.value)}
          >
            <option value="oldest">Oldest first</option>
            <option value="urgency">Urgency first</option>
          </select>
        </div>

        <div className="toolbar-group">
          <span className="toolbar-label">Density</span>
          <div className="toolbar-actions">
            <${TouchButton}
              label="Comfortable"
              variant="ghost"
              size="md"
              isActive=${density === "comfortable"}
              onClick=${() => setDensity("comfortable")}
            />
            <${TouchButton}
              label="Compact"
              variant="ghost"
              size="md"
              isActive=${density === "compact"}
              onClick=${() => setDensity("compact")}
            />
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <${MetricTile}
          label="Active Orders"
          value=${String(totalOrders)}
          tone=${queueTone}
          helper="Across all stations"
        />
        <${MetricTile}
          label="Late Orders"
          value=${String(lateOrders)}
          tone=${lateOrders > 0 ? "danger" : "success"}
          helper="15+ minutes"
        />
        <${MetricTile}
          label="Average Wait"
          value=${averageWait}
          tone="default"
          helper="Placed to now"
        />
        <${MetricTile}
          label="Ready to Serve"
          value=${String(readyOrders)}
          tone="success"
          helper="Hand off now"
        />
      </section>

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

      <section className="kds-board" data-density=${density}>
        ${BOARD_COLUMNS.map(
          (column) => html`
            <${KanbanColumn}
              key=${column.key}
              title=${column.title}
              statusKey=${column.key}
              orders=${groupedOrders[column.key]}
              nowMs=${nowMs}
              onMoveOrder=${handleMoveOrder}
              updatingOrderIds=${updatingOrderIds}
              density=${density}
            />
          `
        )}
      </section>
    </main>
  `;
}
