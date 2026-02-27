import React from "react";
import htm from "htm";

const html = htm.bind(React.createElement);

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const statusActions = {
  new: [{ label: "Start Prep", nextStatus: "prep", tone: "primary" }],
  prep: [
    { label: "Mark Ready", nextStatus: "ready", tone: "success" },
    { label: "Back to New", nextStatus: "new", tone: "ghost" },
  ],
  ready: [{ label: "Back to Prep", nextStatus: "prep", tone: "ghost" }],
};

function formatDuration(elapsedMs) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export function OrderCard({ order, nowMs, onMoveOrder, isUpdating }) {
  const placedAtMs = new Date(order.placed_at).getTime();
  const elapsedMs = nowMs - placedAtMs;
  const isLate = elapsedMs >= FIFTEEN_MINUTES_MS;
  const actions = statusActions[order.status] ?? [];
  const items = order.order_items ?? [];

  return html`
    <article className=${`order-card ${isLate ? "order-card--late" : ""}`}>
      <header className="order-card__header">
        <h3 className="order-card__title">Order #${order.order_number}</h3>
        <span className=${`timer-pill ${isLate ? "timer-pill--late" : ""}`}>
          ${formatDuration(elapsedMs)}
        </span>
      </header>

      <ul className="order-items">
        ${items.map(
          (item) => html`
            <li key=${item.id} className="order-item">
              <div className="order-item__line">
                <span className="order-item__qty">${item.quantity}x</span>
                <span className="order-item__name">${item.item_name}</span>
              </div>
              ${(item.modifiers ?? []).length > 0
                ? html`
                    <div className="modifier-row">
                      ${(item.modifiers ?? []).map(
                        (modifier) => html`
                          <span key=${`${item.id}-${modifier}`} className="modifier-chip"
                            >${modifier}</span
                          >
                        `
                      )}
                    </div>
                  `
                : null}
            </li>
          `
        )}
      </ul>

      <div className="order-card__actions">
        ${actions.map(
          (action) => html`
            <button
              key=${`${order.id}-${action.nextStatus}`}
              className=${`touch-btn touch-btn--${action.tone}`}
              onClick=${() => onMoveOrder(order.id, action.nextStatus)}
              disabled=${isUpdating}
            >
              ${action.label}
            </button>
          `
        )}
      </div>
    </article>
  `;
}
