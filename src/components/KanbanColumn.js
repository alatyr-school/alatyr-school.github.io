import React from "react";
import htm from "htm";
import { OrderCard } from "./OrderCard.js";

const html = htm.bind(React.createElement);

export function KanbanColumn({
  title,
  statusKey,
  orders,
  nowMs,
  onMoveOrder,
  updatingOrderIds,
}) {
  return html`
    <section className=${`kds-column kds-column--${statusKey}`}>
      <header className="kds-column__header">
        <h2>${title}</h2>
        <span className="kds-column__count">${orders.length}</span>
      </header>

      <div className="kds-column__body">
        ${orders.length === 0
          ? html`<p className="kds-empty">No orders</p>`
          : orders.map(
              (order) => html`
                <${OrderCard}
                  key=${order.id}
                  order=${order}
                  nowMs=${nowMs}
                  onMoveOrder=${onMoveOrder}
                  isUpdating=${updatingOrderIds.has(order.id)}
                />
              `
            )}
      </div>
    </section>
  `;
}
