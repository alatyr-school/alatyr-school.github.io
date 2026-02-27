import React from "react";
import htm from "htm";

const html = htm.bind(React.createElement);

export function MetricTile({ label, value, tone = "default", helper = "" }) {
  return html`
    <article className=${`metric-tile metric-tile--${tone}`}>
      <p className="metric-tile__label">${label}</p>
      <p className="metric-tile__value">${value}</p>
      ${helper ? html`<p className="metric-tile__helper">${helper}</p>` : null}
    </article>
  `;
}
