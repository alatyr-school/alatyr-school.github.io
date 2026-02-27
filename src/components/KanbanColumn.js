import React from "react";
import htm from "htm";
import { OrderCard } from "./OrderCard.js";
import { isOrderLate } from "../constants/kds.js";

const html = htm.bind(React.createElement);

export function KanbanColumn({
  title,
  statusKey,
  orders,
  nowMs,
  onMoveOrder,
  updatingOrderIds,
  density,
}) {
  const lateCount = orders.filter((order) => isOrderLate(order, nowMs)).length;

  return html`
    <section className=${`kds-column kds-column--${statusKey}`}>
      <header className="kds-column__header">
        <div className="kds-column__title-wrap">
          <h2>${title}</h2>
          ${lateCount > 0
            ? html`<span className="kds-column__late-chip">Late ${lateCount}</span>`
            : null}
        </div>
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
                  density=${density}
                />
              `
            )}
      </div>
    </section>
  `;
}
