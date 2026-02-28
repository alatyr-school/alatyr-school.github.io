import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import htm from "htm";
import { KanbanColumn } from "./KanbanColumn.js";
import { VenueSiteShowcase } from "./VenueSiteShowcase.js";
import { useKitchenOrders } from "../hooks/useKitchenOrders.js";
import { useKdsDemoRuntime } from "../hooks/useKdsDemoRuntime.js";
import {
  BOARD_COLUMNS,
  getElapsedMs,
  isOrderLate,
  matchesOrderQuery,
} from "../constants/kds.js";
import { MetricTile } from "./ui/MetricTile.js";
import { TouchButton } from "./ui/TouchButton.js";

const html = htm.bind(React.createElement);

const COLUMN_PRESENTATION = {
  new: { sequence: "01", subtitle: "Incoming queue" },
  prep: { sequence: "02", subtitle: "On the line" },
  ready: { sequence: "03", subtitle: "Handoff window" },
};

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

function formatEventType(eventType) {
  return eventType.replaceAll("_", " ");
}

function formatEventTransition(event) {
  if (event.from_status && event.to_status) {
    return `${event.from_status} -> ${event.to_status}`;
  }
  if (event.to_status) {
    return `-> ${event.to_status}`;
  }
  return "state event";
}

function formatEventTime(timestampIso) {
  const date = new Date(timestampIso);
  if (Number.isNaN(date.getTime())) {
    return timestampIso;
  }
  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSeverity(severity) {
  return String(severity ?? "").toUpperCase();
}

function recoveryStepClass(status) {
  if (status === "in_progress") return "kds-recovery-step kds-recovery-step--in-progress";
  if (status === "completed") return "kds-recovery-step kds-recovery-step--completed";
  if (status === "warning") return "kds-recovery-step kds-recovery-step--warning";
  if (status === "failed") return "kds-recovery-step kds-recovery-step--failed";
  return "kds-recovery-step";
}

export function KDSDashboard() {
  const [nowMs, setNowMs] = useState(Date.now());
  const [searchText, setSearchText] = useState("");
  const [lateOnly, setLateOnly] = useState(false);
  const [density, setDensity] = useState("comfortable");
  const [sortMode, setSortMode] = useState("oldest");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState("venue");
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
  const demoRuntime = useKdsDemoRuntime({ enabled: !isSupabaseConfigured });

  useEffect(() => {
    const timerId = globalThis.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => globalThis.clearInterval(timerId);
  }, []);

  const activeOrders = isSupabaseConfigured ? orders : demoRuntime.orders;
  const workflowOrders = useMemo(
    () =>
      activeOrders.filter((order) =>
        ["new", "prep", "ready"].includes(order.status)
      ),
    [activeOrders]
  );
  const activeUpdatingOrderIds = isSupabaseConfigured
    ? updatingOrderIds
    : demoRuntime.updatingOrderIds;
  const activeError = isSupabaseConfigured ? error : demoRuntime.error;

  useEffect(() => {
    const currentLateIds = new Set(
      workflowOrders
        .filter((order) => isOrderLate(order, nowMs))
        .map((order) => order.id)
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
  }, [workflowOrders, nowMs, audioEnabled]);

  const filteredOrders = useMemo(() => {
    const lateAwareOrders = workflowOrders.filter((order) => {
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
  }, [lateOnly, nowMs, searchText, sortMode, workflowOrders]);

  const groupedOrders = useMemo(() => {
    const groups = { new: [], prep: [], ready: [] };
    for (const order of filteredOrders) {
      if (groups[order.status]) {
        groups[order.status].push(order);
      }
    }
    return groups;
  }, [filteredOrders]);

  const totalOrders = workflowOrders.length;
  const lateOrders = workflowOrders.filter((order) => isOrderLate(order, nowMs)).length;
  const readyOrders = workflowOrders.filter((order) => order.status === "ready").length;
  const averageWait = formatAverageWait(workflowOrders, nowMs);

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
      demoRuntime.moveOrder(orderId, nextStatus);
    },
    [demoRuntime, isSupabaseConfigured, moveOrder]
  );

  const handleCreateWebsiteOrder = useCallback(
    (packageKey) => {
      if (isSupabaseConfigured) {
        return;
      }
      demoRuntime.createWebsiteOrder(packageKey);
    },
    [demoRuntime, isSupabaseConfigured]
  );

  const currentConnectionState = isSupabaseConfigured ? connectionState : "demo";
  const currentConnectionLabel = isSupabaseConfigured
    ? connectionState === "live"
      ? "Live"
      : connectionState
    : "Demo DB";
  const queueHealthLabel =
    lateOrders > 0 ? `${lateOrders} delayed` : "On cadence";
  const openDemoAnomalies = demoRuntime.anomalies.filter((entry) =>
    ["open", "acknowledged"].includes(entry.status)
  );
  const activeDemoIncidents = demoRuntime.incidents.filter(
    (incident) => incident.status !== "resolved"
  );

  return html`
    <main className="kds-dashboard">
      <section className="kds-command-surface">
        <header className="kds-command-head">
          <div className="kds-identity">
            <p className="kds-identity__eyebrow">Kitchen operations console</p>
            <h1>Kitchen Display System</h1>
            <p className="kds-topbar__subtitle">
              Realtime production command layer for high-volume service
            </p>
          </div>
          <div className="kds-topbar__actions">
            <div className="kds-passive-indicators">
              <span className=${statusClass(currentConnectionState)}>
                ${currentConnectionLabel}
              </span>
              <span className="status-pill status-pill--passive">
                ${queueHealthLabel}
              </span>
            </div>
            ${isSupabaseConfigured
              ? html`
                  <${TouchButton}
                    label="Refresh"
                    variant="secondary"
                    size="md"
                    onClick=${reloadOrders}
                  />
                `
              : html`
                  <${TouchButton}
                    label="Reset Scenario"
                    variant="secondary"
                    size="md"
                    onClick=${demoRuntime.resetDemo}
                  />
                `}
          </div>
        </header>

        <section className="kds-control-architecture">
          <div className="control-cluster control-cluster--search">
            <label className="toolbar-label" htmlFor="kds-search">Search</label>
            <input
              id="kds-search"
              className="toolbar-input"
              type="text"
              value=${searchText}
              placeholder="Find by order #, item or modifier"
              onInput=${(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="control-cluster control-cluster--filters">
            <span className="toolbar-label">Filters</span>
            <div className="toolbar-actions">
              <${TouchButton}
                label="Late only"
                variant="passive"
                size="md"
                isActive=${lateOnly}
                onClick=${() => setLateOnly((current) => !current)}
              />
              <${TouchButton}
                label=${audioEnabled ? "Sound on" : "Sound off"}
                variant="passive"
                size="md"
                isActive=${audioEnabled}
                onClick=${() => setAudioEnabled((current) => !current)}
              />
            </div>
          </div>

          <div className="control-cluster control-cluster--sort">
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

          <div className="control-cluster control-cluster--density">
            <span className="toolbar-label">Density</span>
            <div className="toolbar-actions">
              <${TouchButton}
                label="Comfortable"
                variant="passive"
                size="md"
                isActive=${density === "comfortable"}
                onClick=${() => setDensity("comfortable")}
              />
              <${TouchButton}
                label="Compact"
                variant="passive"
                size="md"
                isActive=${density === "compact"}
                onClick=${() => setDensity("compact")}
              />
            </div>
          </div>

          <div className="control-cluster control-cluster--experience">
            <span className="toolbar-label">View</span>
            <div className="toolbar-actions">
              <${TouchButton}
                label="Venue Site"
                variant="secondary"
                size="md"
                isActive=${workspaceMode === "venue"}
                onClick=${() => setWorkspaceMode("venue")}
              />
              <${TouchButton}
                label="Split"
                variant="passive"
                size="md"
                isActive=${workspaceMode === "split"}
                onClick=${() => setWorkspaceMode("split")}
              />
              <${TouchButton}
                label="KDS Only"
                variant="passive"
                size="md"
                isActive=${workspaceMode === "operations"}
                onClick=${() => setWorkspaceMode("operations")}
              />
            </div>
          </div>
        </section>
      </section>

      ${workspaceMode !== "operations"
        ? html`
            <${VenueSiteShowcase}
              orders=${activeOrders}
              nowMs=${nowMs}
              isSupabaseConfigured=${isSupabaseConfigured}
              websitePackages=${demoRuntime.websitePackages}
              onCreateWebsiteOrder=${handleCreateWebsiteOrder}
              connectionLabel=${currentConnectionLabel}
            />
          `
        : null}

      ${workspaceMode !== "venue"
        ? html`
            <section className="kds-metrics-surface">
              <header className="kds-metrics-surface__head">
                <h2>Service metrics</h2>
                <p>Executive view of queue pressure and handoff readiness</p>
              </header>
              <div className="metrics-grid">
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
                  helper="Handoff lane"
                />
              </div>
            </section>
          `
        : null}

      ${workspaceMode !== "venue" && !isSupabaseConfigured
        ? html`
            <section className="kds-demo-surface">
              <header className="kds-demo-surface__head">
                <h2>Demo backend simulator</h2>
                <p>
                  In-memory simulation of Supabase data and business flow for KDS.
                </p>
              </header>

              <div className="kds-demo-layout">
                <section className="kds-demo-card">
                  <p className="kds-demo-card__title">Scenario actions</p>
                  <div className="kds-demo-actions">
                    <${TouchButton}
                      label="Insert Mock Order"
                      variant="secondary"
                      size="md"
                      onClick=${demoRuntime.createDemoOrder}
                    />
                    <${TouchButton}
                      label="Run Logic Step"
                      variant="forward"
                      size="md"
                      onClick=${demoRuntime.runScenarioStep}
                    />
                    <${TouchButton}
                      label=${demoRuntime.autoplayEnabled
                        ? "Autoplay: ON"
                        : "Autoplay: OFF"}
                      variant="passive"
                      size="md"
                      isActive=${demoRuntime.autoplayEnabled}
                      onClick=${() =>
                        demoRuntime.setAutoplayEnabled(
                          (current) => !current
                        )}
                    />
                    <${TouchButton}
                      label="Advance New -> Prep"
                      variant="forward"
                      size="md"
                      onClick=${demoRuntime.advanceOldestNew}
                    />
                    <${TouchButton}
                      label="Advance Prep -> Ready"
                      variant="confirm"
                      size="md"
                      onClick=${demoRuntime.advanceOldestPrep}
                    />
                    <${TouchButton}
                      label="Serve Ready Order"
                      variant="confirm"
                      size="md"
                      onClick=${demoRuntime.serveOldestReady}
                    />
                    <${TouchButton}
                      label="Cancel New Order"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.cancelNewestNew}
                    />
                    <${TouchButton}
                      label="Session Heartbeat"
                      variant="secondary"
                      size="md"
                      onClick=${demoRuntime.touchSession}
                    />
                  </div>
                </section>

                <section className="kds-demo-card">
                  <p className="kds-demo-card__title">Simulated table rows</p>
                  <ul className="kds-demo-table-list">
                    ${Object.entries(demoRuntime.tableCounts).map(
                      ([tableName, count]) => html`
                        <li key=${tableName} className="kds-demo-table-item">
                          <code>${tableName}</code>
                          <span>${count}</span>
                        </li>
                      `
                    )}
                  </ul>
                  <div className="kds-demo-session">
                    <p><strong>Session:</strong> ${demoRuntime.session.id}</p>
                    <p>
                      <strong>Station:</strong>
                      ${demoRuntime.stations.find(
                        (station) =>
                          station.id === demoRuntime.session.station_id
                      )?.name ?? "Unassigned"}
                    </p>
                    <p>
                      <strong>Last seen:</strong>
                      ${formatEventTime(demoRuntime.session.last_seen_at)}
                    </p>
                  </div>
                </section>

                <section className="kds-demo-card">
                  <p className="kds-demo-card__title">Recent order_events</p>
                  <ul className="kds-demo-events">
                    ${demoRuntime.events.slice(0, 10).map(
                      (event) => html`
                        <li key=${event.id} className="kds-demo-event">
                          <div className="kds-demo-event__top">
                            <span className="kds-demo-event__type"
                              >${formatEventType(event.event_type)}</span
                            >
                            <time>${formatEventTime(event.created_at)}</time>
                          </div>
                          <p className="kds-demo-event__meta">
                            Order #${event.order_number}
                            <span>${formatEventTransition(event)}</span>
                          </p>
                          ${event.reason_code
                            ? html`
                                <p className="kds-demo-event__reason">
                                  reason: ${event.reason_code}
                                </p>
                              `
                            : null}
                        </li>
                      `
                    )}
                  </ul>
                </section>
              </div>
            </section>

            <section className="kds-error-sim-surface">
              <header className="kds-error-sim-surface__head">
                <h2>Error simulation lab</h2>
                <p>
                  Separate fault-injection console for incidents, diagnostics and
                  recovery drills.
                </p>
              </header>

              <div className="kds-error-sim-layout">
                <section className="kds-demo-card">
                  <p className="kds-demo-card__title">Fault injection</p>
                  <div className="kds-demo-actions">
                    <${TouchButton}
                      label="Inject Realtime Drop"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.injectRealtimeDrop}
                    />
                    <${TouchButton}
                      label="Inject Duplicate Order"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.injectDuplicateOrder}
                    />
                    <${TouchButton}
                      label="Inject Status Jump"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.injectStatusJump}
                    />
                    <${TouchButton}
                      label="Inject Screen Divergence"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.injectDivergence}
                    />
                    <${TouchButton}
                      label="Inject Stale Snapshot"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.injectStaleState}
                    />
                    <${TouchButton}
                      label="Inject KPI Drift"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.injectKpiMismatch}
                    />
                  </div>
                  <p className="kds-demo-card__title">Scenario bundles</p>
                  <div className="kds-demo-actions">
                    <${TouchButton}
                      label="Delivery Failure Drill"
                      variant="forward"
                      size="md"
                      onClick=${demoRuntime.runDeliveryFailureScenario}
                    />
                    <${TouchButton}
                      label="Data Integrity Drill"
                      variant="forward"
                      size="md"
                      onClick=${demoRuntime.runDataIntegrityScenario}
                    />
                    <${TouchButton}
                      label="Workflow Desync Drill"
                      variant="forward"
                      size="md"
                      onClick=${demoRuntime.runWorkflowDesyncScenario}
                    />
                  </div>
                </section>

                <section className="kds-demo-card">
                  <p className="kds-demo-card__title">Diagnostics & response</p>
                  <div className="kds-demo-actions">
                    <${TouchButton}
                      label="Зроби помилку зараз"
                      variant="reverse"
                      size="md"
                      onClick=${demoRuntime.injectErrorNow}
                    />
                    <${TouchButton}
                      label=${demoRuntime.recoveryExecuting
                        ? "Виконуємо шлях виправлення..."
                        : "Показати шлях виправлення"}
                      variant="confirm"
                      size="md"
                      disabled=${!demoRuntime.recoveryGuide || demoRuntime.recoveryExecuting}
                      onClick=${demoRuntime.executeRecoveryPath}
                    />
                    <${TouchButton}
                      label="Run Analysis Scan"
                      variant="forward"
                      size="md"
                      onClick=${demoRuntime.runAnalysisScan}
                    />
                    <${TouchButton}
                      label="Create Incident"
                      variant="secondary"
                      size="md"
                      onClick=${demoRuntime.createIncidentFromOpenAnomalies}
                    />
                    <${TouchButton}
                      label="Run Recovery Resync"
                      variant="confirm"
                      size="md"
                      onClick=${demoRuntime.runRecoveryResync}
                    />
                  </div>

                  <p className="kds-demo-card__title">Recovery playbook</p>
                  ${demoRuntime.recoveryGuide
                    ? html`
                        <div className="kds-recovery-guide">
                          <p className="kds-recovery-guide__meta">
                            ${demoRuntime.recoveryGuide.scenario}
                            <span>${formatEventTime(demoRuntime.recoveryGuide.created_at)}</span>
                          </p>
                          <ul className="kds-recovery-steps">
                            ${demoRuntime.recoveryGuide.steps.map(
                              (step) => html`
                                <li key=${step.id} className=${recoveryStepClass(step.status)}>
                                  <div className="kds-recovery-step__head">
                                    <strong>${step.title}</strong>
                                    <span>${step.status}</span>
                                  </div>
                                  <p>${step.detail}</p>
                                </li>
                              `
                            )}
                          </ul>
                        </div>
                      `
                    : html`
                        <p className="kds-recovery-empty">
                          Натисни "Зроби помилку зараз", щоб сформувати шлях виправлення.
                        </p>
                      `}

                  <ul className="kds-demo-table-list">
                    <li className="kds-demo-table-item">
                      <code>open_anomalies</code>
                      <span>${demoRuntime.computedAnalysisSummary.openAnomalies}</span>
                    </li>
                    <li className="kds-demo-table-item">
                      <code>critical_open</code>
                      <span>${demoRuntime.computedAnalysisSummary.criticalOpen}</span>
                    </li>
                    <li className="kds-demo-table-item">
                      <code>active_incidents</code>
                      <span>${demoRuntime.computedAnalysisSummary.activeIncidents}</span>
                    </li>
                    <li className="kds-demo-table-item">
                      <code>command_success_rate</code>
                      <span>${demoRuntime.computedAnalysisSummary.commandSuccessRate}%</span>
                    </li>
                  </ul>

                  <p className="kds-demo-event__meta">
                    ${demoRuntime.analysisReport.lastScanAt
                      ? formatEventTime(demoRuntime.analysisReport.lastScanAt)
                      : "scan not started"}
                    <span>
                      +${demoRuntime.analysisReport.insertedAnomalies} new anomalies
                    </span>
                  </p>
                  <p className="kds-demo-card__title">Open anomalies</p>
                  <ul className="kds-demo-events">
                    ${openDemoAnomalies.slice(0, 6).map(
                      (anomaly) => html`
                        <li key=${anomaly.id} className="kds-demo-event">
                          <div className="kds-demo-event__top">
                            <span className="kds-demo-event__type"
                              >${anomaly.anomaly_type}</span
                            >
                            <time>${formatSeverity(anomaly.severity)}</time>
                          </div>
                          <p className="kds-demo-event__meta">
                            detector: ${anomaly.detector_name}
                            <span>${anomaly.status}</span>
                          </p>
                        </li>
                      `
                    )}
                  </ul>
                  <p className="kds-demo-card__title">Active incidents</p>
                  <ul className="kds-demo-events">
                    ${activeDemoIncidents.slice(0, 4).map(
                      (incident) => html`
                        <li key=${incident.id} className="kds-demo-event">
                          <div className="kds-demo-event__top">
                            <span className="kds-demo-event__type"
                              >${incident.title}</span
                            >
                            <time>${formatSeverity(incident.severity)}</time>
                          </div>
                          <p className="kds-demo-event__meta">
                            status: ${incident.status}
                            <span>${formatEventTime(incident.detected_at)}</span>
                          </p>
                        </li>
                      `
                    )}
                  </ul>
                </section>

                <section className="kds-demo-card">
                  <p className="kds-demo-card__title">Recent technical events</p>
                  <ul className="kds-demo-events">
                    ${demoRuntime.technicalEvents.slice(0, 10).map(
                      (event) => html`
                        <li key=${event.id} className="kds-demo-event">
                          <div className="kds-demo-event__top">
                            <span className="kds-demo-event__type"
                              >${event.event_name}</span
                            >
                            <time>${formatSeverity(event.severity)}</time>
                          </div>
                          <p className="kds-demo-event__meta">
                            ${event.component}
                            <span>${formatEventTime(event.created_at)}</span>
                          </p>
                          ${event.message
                            ? html`<p className="kds-demo-event__reason">${event.message}</p>`
                            : null}
                        </li>
                      `
                    )}
                  </ul>
                </section>

                <section className="kds-demo-card">
                  <p className="kds-demo-card__title">Recent command log</p>
                  <ul className="kds-demo-events">
                    ${demoRuntime.commandLogs.slice(0, 10).map(
                      (entry) => html`
                        <li key=${entry.id} className="kds-demo-event">
                          <div className="kds-demo-event__top">
                            <span className="kds-demo-event__type"
                              >${entry.command_type}</span
                            >
                            <time>${entry.result}</time>
                          </div>
                          <p className="kds-demo-event__meta">
                            ${entry.order_id ? `order: ${entry.order_id}` : "global command"}
                            <span>${formatEventTime(entry.received_at)}</span>
                          </p>
                          ${entry.error_message
                            ? html`
                                <p className="kds-demo-event__reason">
                                  ${entry.error_code}: ${entry.error_message}
                                </p>
                              `
                            : null}
                        </li>
                      `
                    )}
                  </ul>
                </section>
              </div>
            </section>

            <section className="config-warning">
              <h2>Demo mode is active</h2>
              <p>
                You are viewing simulated KDS + database logic. Set
                <code>window.__SUPABASE_URL__</code> and
                <code>window.__SUPABASE_ANON_KEY__</code> in
                <code>index.html</code> to switch to live Supabase mode.
              </p>
            </section>
          `
        : null}

      ${activeError ? html`<p className="error-banner">${activeError}</p>` : null}
      ${workspaceMode !== "venue" && isSupabaseConfigured && loading
        ? html`<p className="loading-banner">Loading kitchen orders...</p>`
        : null}

      ${workspaceMode !== "venue"
        ? html`
            <section className="kds-workflow-surface">
              <header className="kds-workflow-surface__head">
                <h2>Workflow board</h2>
                <p>Follow the production path from intake to final pickup.</p>
              </header>

              <section className="kds-board" data-density=${density}>
                ${BOARD_COLUMNS.map(
                  (column) => html`
                    <${KanbanColumn}
                      key=${column.key}
                      title=${column.title}
                      subtitle=${COLUMN_PRESENTATION[column.key].subtitle}
                      sequence=${COLUMN_PRESENTATION[column.key].sequence}
                      statusKey=${column.key}
                      orders=${groupedOrders[column.key]}
                      nowMs=${nowMs}
                      onMoveOrder=${handleMoveOrder}
                      updatingOrderIds=${activeUpdatingOrderIds}
                      density=${density}
                    />
                  `
                )}
              </section>
            </section>
          `
        : null}
    </main>
  `;
}
