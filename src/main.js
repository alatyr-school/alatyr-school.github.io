import React from "react";
import { createRoot } from "react-dom/client";
import { KDSDashboard } from "./components/KDSDashboard.js";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root element");
}

const root = createRoot(rootElement);
root.render(React.createElement(React.StrictMode, null, React.createElement(KDSDashboard)));
