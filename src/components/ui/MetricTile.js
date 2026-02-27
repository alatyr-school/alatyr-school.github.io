import React from "react";
import htm from "htm";

const html = htm.bind(React.createElement);

export function MetricTile({ label, value, tone = "default", helper = "" }) {
  return html`
    <article className=${`metric-tile metric-tile--${tone}`}>
      <div className="metric-tile__top">
        <p className="metric-tile__label">${label}</p>
      </div>
      <div className="metric-tile__core">
        <p className="metric-tile__value">${value}</p>
      </div>
      ${helper ? html`<p className="metric-tile__helper">${helper}</p>` : null}
    </article>
  `;
}
