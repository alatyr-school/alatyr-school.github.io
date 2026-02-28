import React, { useMemo } from "react";
import htm from "htm";
import { getElapsedMs } from "../constants/kds.js";
import { TouchButton } from "./ui/TouchButton.js";

const html = htm.bind(React.createElement);

function formatOrderStatus(status) {
  if (status === "new") return "Queued";
  if (status === "prep") return "Cooking";
  if (status === "ready") return "Ready";
  if (status === "served") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return status;
}

function formatAgo(placedAtIso, nowMs) {
  const elapsedMs = Math.max(0, getElapsedMs(placedAtIso, nowMs));
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function statusChipClass(status) {
  if (status === "ready") return "venue-live-order__status venue-live-order__status--ready";
  if (status === "prep") return "venue-live-order__status venue-live-order__status--prep";
  if (status === "served") return "venue-live-order__status venue-live-order__status--served";
  if (status === "cancelled")
    return "venue-live-order__status venue-live-order__status--cancelled";
  return "venue-live-order__status";
}

export function VenueSiteShowcase({
  orders,
  nowMs,
  isSupabaseConfigured,
  websitePackages,
  onCreateWebsiteOrder,
  connectionLabel,
}) {
  const activeQueue = useMemo(
    () => orders.filter((order) => ["new", "prep", "ready"].includes(order.status)),
    [orders]
  );
  const liveFeed = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.updated_at ?? b.placed_at) - new Date(a.updated_at ?? a.placed_at))
        .slice(0, 6),
    [orders]
  );
  const readyCount = activeQueue.filter((order) => order.status === "ready").length;
  const prepCount = activeQueue.filter((order) => order.status === "prep").length;
  const queueCount = activeQueue.filter((order) => order.status === "new").length;

  return html`
    <section className="venue-site-surface">
      <header className="venue-site-hero">
        <div className="venue-site-hero__left">
          <p className="venue-site-hero__eyebrow">Digital storefront</p>
          <h2>Munister Burger House</h2>
          <p className="venue-site-hero__lead">
            Premium customer website synchronized with kitchen operations in real time.
          </p>
          <div className="venue-site-badges">
            <span className="venue-site-badge">Sync: ${connectionLabel}</span>
            <span className="venue-site-badge">${activeQueue.length} active kitchen tickets</span>
            <span className="venue-site-badge">${readyCount} ready for pickup</span>
          </div>
        </div>
        <div className="venue-site-kpis">
          <article className="venue-site-kpi">
            <p>Queue</p>
            <strong>${String(queueCount)}</strong>
          </article>
          <article className="venue-site-kpi">
            <p>In prep</p>
            <strong>${String(prepCount)}</strong>
          </article>
          <article className="venue-site-kpi">
            <p>Ready</p>
            <strong>${String(readyCount)}</strong>
          </article>
        </div>
      </header>

      <div className="venue-site-layout">
        <section className="venue-site-card">
          <p className="venue-site-card__title">Signature menu</p>
          <div className="venue-menu-grid">
            ${(websitePackages ?? []).map(
              (bundle) => html`
                <article key=${bundle.key} className="venue-menu-item">
                  <p className="venue-menu-item__name">${bundle.title}</p>
                  <p className="venue-menu-item__desc">${bundle.description}</p>
                  <div className="venue-menu-item__meta">
                    <span>${bundle.priceLabel}</span>
                    <span>${bundle.priority}</span>
                  </div>
                  <${TouchButton}
                    label=${isSupabaseConfigured ? "Live mode (POS/API)" : "Add to KDS queue"}
                    variant="forward"
                    size="md"
                    block=${true}
                    disabled=${isSupabaseConfigured}
                    onClick=${() => onCreateWebsiteOrder(bundle.key)}
                  />
                </article>
              `
            )}
          </div>
        </section>

        <section className="venue-site-card">
          <p className="venue-site-card__title">Live order sync</p>
          <ul className="venue-live-orders">
            ${liveFeed.length === 0
              ? html`<li className="venue-live-order venue-live-order--empty">No recent orders</li>`
              : liveFeed.map(
                  (order) => html`
                    <li key=${order.id} className="venue-live-order">
                      <div className="venue-live-order__top">
                        <strong>Order #${order.order_number}</strong>
                        <span className=${statusChipClass(order.status)}
                          >${formatOrderStatus(order.status)}</span
                        >
                      </div>
                      <p className="venue-live-order__meta">
                        ${order.source ?? "pos"} · ${order.priority ?? "normal"}
                        <span>${formatAgo(order.placed_at, nowMs)}</span>
                      </p>
                    </li>
                  `
                )}
          </ul>
        </section>
      </div>
    </section>
  `;
}
