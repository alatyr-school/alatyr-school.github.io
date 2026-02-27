import React from "react";
import htm from "htm";

const html = htm.bind(React.createElement);

export function TouchButton({
  label,
  onClick,
  disabled = false,
  type = "button",
  variant = "ghost",
  size = "md",
  block = false,
  isActive = false,
  className = "",
  title = "",
}) {
  const classes = [
    "touch-btn",
    `touch-btn--${variant}`,
    `touch-btn--${size}`,
    block ? "touch-btn--block" : "",
    isActive ? "touch-btn--active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return html`
    <button
      type=${type}
      className=${classes}
      onClick=${onClick}
      disabled=${disabled}
      title=${title}
      aria-pressed=${isActive}
    >
      ${label}
    </button>
  `;
}
