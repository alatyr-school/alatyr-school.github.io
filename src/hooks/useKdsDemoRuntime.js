import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DEMO_STATIONS = [
  { id: "station-grill", code: "grill", name: "Grill" },
  { id: "station-fryer", code: "fryer", name: "Fryer" },
  { id: "station-assembly", code: "assembly", name: "Assembly" },
  { id: "station-drinks", code: "drinks", name: "Drinks" },
];

const DEMO_STAFF_PROFILE_COUNT = 3;
const DEMO_STAFF_MEMBERSHIP_COUNT = 7;
const DEMO_ACTION_DELAY_MS = 180;

const DEMO_MENU = [
  {
    item_name: "Classic Burger",
    station_id: "station-grill",
    modifiers_pool: ["No onions", "Extra pickles", "No mayo"],
  },
  {
    item_name: "Double Cheeseburger",
    station_id: "station-grill",
    modifiers_pool: ["No ketchup", "Extra cheese", "No mustard"],
  },
  {
    item_name: "Chicken Burger",
    station_id: "station-assembly",
    modifiers_pool: ["No tomatoes", "Add jalapenos", "No lettuce"],
  },
  {
    item_name: "Fries",
    station_id: "station-fryer",
    modifiers_pool: ["Well done", "No salt", "Extra seasoning"],
  },
  {
    item_name: "Onion Rings",
    station_id: "station-fryer",
    modifiers_pool: ["Light batter", "Well done"],
  },
  {
    item_name: "Milkshake",
    station_id: "station-drinks",
    modifiers_pool: ["No whipped cream", "Extra syrup"],
  },
];

const ANALYSIS_SCAN_NAME = "demo_runtime_scan";
const RECOVERY_STEP_PENDING = "pending";
const RECOVERY_STEP_IN_PROGRESS = "in_progress";
const RECOVERY_STEP_COMPLETED = "completed";
const RECOVERY_STEP_WARNING = "warning";
const RECOVERY_STEP_FAILED = "failed";

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function createRecoveryGuide(scenarioName) {
  return {
    id: createId("demo-recovery-guide"),
    scenario: scenarioName,
    created_at: nowIso(),
    steps: [
      {
        id: "detect",
        title: "1) Detect: run consistency scan",
        status: RECOVERY_STEP_PENDING,
        detail: "Pending",
      },
      {
        id: "incident",
        title: "2) Contain: create incident from anomalies",
        status: RECOVERY_STEP_PENDING,
        detail: "Pending",
      },
      {
        id: "recover",
        title: "3) Recover: execute resync action",
        status: RECOVERY_STEP_PENDING,
        detail: "Pending",
      },
      {
        id: "verify",
        title: "4) Verify: re-run scan and validate board",
        status: RECOVERY_STEP_PENDING,
        detail: "Pending",
      },
    ],
  };
}

function createId(prefix) {
  const base = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${base}`;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function mapEventType(fromStatus, toStatus) {
  if (toStatus === "prep" && fromStatus === "new") return "moved_to_prep";
  if (toStatus === "ready") return "moved_to_ready";
  if (toStatus === "served") return "served";
  if (toStatus === "cancelled") return "cancelled";
  return "moved_back";
}

function isValidTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return true;
  if (fromStatus === "new" && ["prep", "cancelled"].includes(toStatus)) return true;
  if (fromStatus === "prep" && ["ready", "new", "cancelled"].includes(toStatus)) return true;
  if (fromStatus === "ready" && ["served", "prep", "cancelled"].includes(toStatus)) return true;
  return false;
}

function applyStatusTimestamps(order, nextStatus, isoNow) {
  const nextOrder = {
    ...order,
    status: nextStatus,
    updated_at: isoNow,
    state_version: (order.state_version ?? 1) + 1,
  };

  if (nextStatus === "new") {
    nextOrder.started_at = null;
    nextOrder.ready_at = null;
    nextOrder.served_at = null;
    nextOrder.cancelled_at = null;
  } else if (nextStatus === "prep") {
    nextOrder.started_at = nextOrder.started_at ?? isoNow;
    nextOrder.ready_at = null;
    nextOrder.served_at = null;
    nextOrder.cancelled_at = null;
  } else if (nextStatus === "ready") {
    nextOrder.started_at = nextOrder.started_at ?? isoNow;
    nextOrder.ready_at = isoNow;
    nextOrder.served_at = null;
    nextOrder.cancelled_at = null;
  } else if (nextStatus === "served") {
    nextOrder.started_at = nextOrder.started_at ?? isoNow;
    nextOrder.ready_at = nextOrder.ready_at ?? isoNow;
    nextOrder.served_at = isoNow;
    nextOrder.cancelled_at = null;
  } else if (nextStatus === "cancelled") {
    nextOrder.cancelled_at = isoNow;
    nextOrder.served_at = null;
  }

  return nextOrder;
}

function createSeedOrders() {
  const now = Date.now();
  return [
    {
      id: "demo-order-1001",
      business_date: new Date(now).toISOString().slice(0, 10),
      order_number: 1001,
      status: "new",
      source: "kiosk",
      priority: "normal",
      station_id: "station-assembly",
      placed_at: new Date(now - 3 * 60 * 1000).toISOString(),
      started_at: null,
      ready_at: null,
      served_at: null,
      cancelled_at: null,
      special_instructions: "Table 14",
      state_version: 1,
      updated_at: new Date(now - 3 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-item-1001-1",
          line_number: 1,
          item_name: "Classic Burger",
          quantity: 2,
          station_id: "station-grill",
          modifiers: ["No onions", "Extra pickles"],
          position: 1,
        },
        {
          id: "demo-item-1001-2",
          line_number: 2,
          item_name: "Fries",
          quantity: 1,
          station_id: "station-fryer",
          modifiers: ["Well done"],
          position: 2,
        },
      ],
    },
    {
      id: "demo-order-1002",
      business_date: new Date(now).toISOString().slice(0, 10),
      order_number: 1002,
      status: "prep",
      source: "pos",
      priority: "rush",
      station_id: "station-grill",
      placed_at: new Date(now - 11 * 60 * 1000).toISOString(),
      started_at: new Date(now - 8 * 60 * 1000).toISOString(),
      ready_at: null,
      served_at: null,
      cancelled_at: null,
      special_instructions: null,
      state_version: 2,
      updated_at: new Date(now - 8 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-item-1002-1",
          line_number: 1,
          item_name: "Double Cheeseburger",
          quantity: 1,
          station_id: "station-grill",
          modifiers: ["No mayo"],
          position: 1,
        },
        {
          id: "demo-item-1002-2",
          line_number: 2,
          item_name: "Onion Rings",
          quantity: 1,
          station_id: "station-fryer",
          modifiers: [],
          position: 2,
        },
      ],
    },
    {
      id: "demo-order-1003",
      business_date: new Date(now).toISOString().slice(0, 10),
      order_number: 1003,
      status: "ready",
      source: "web",
      priority: "normal",
      station_id: "station-assembly",
      placed_at: new Date(now - 18 * 60 * 1000).toISOString(),
      started_at: new Date(now - 14 * 60 * 1000).toISOString(),
      ready_at: new Date(now - 2 * 60 * 1000).toISOString(),
      served_at: null,
      cancelled_at: null,
      special_instructions: "Call customer on pickup",
      state_version: 3,
      updated_at: new Date(now - 2 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-item-1003-1",
          line_number: 1,
          item_name: "Chicken Burger",
          quantity: 1,
          station_id: "station-assembly",
          modifiers: ["No tomatoes"],
          position: 1,
        },
      ],
    },
    {
      id: "demo-order-1004",
      business_date: new Date(now).toISOString().slice(0, 10),
      order_number: 1004,
      status: "new",
      source: "pos",
      priority: "vip",
      station_id: "station-grill",
      placed_at: new Date(now - 6 * 60 * 1000).toISOString(),
      started_at: null,
      ready_at: null,
      served_at: null,
      cancelled_at: null,
      special_instructions: "VIP priority",
      state_version: 1,
      updated_at: new Date(now - 6 * 60 * 1000).toISOString(),
      order_items: [
        {
          id: "demo-item-1004-1",
          line_number: 1,
          item_name: "Bacon Burger",
          quantity: 1,
          station_id: "station-grill",
          modifiers: ["No onions", "No mustard"],
          position: 1,
        },
      ],
    },
  ];
}

function createBaseSession() {
  const now = nowIso();
  return {
    id: "demo-session-kds-01",
    device_uid: "kds-screen-01",
    device_label: "Kitchen Pass Screen",
    station_id: "station-assembly",
    staff_user_id: "demo-expediter",
    status: "active",
    started_at: now,
    last_seen_at: now,
    ended_at: null,
    app_version: "demo-runtime-1.1.0",
  };
}

function buildSeedEvents(orders, session) {
  const events = [];
  let sequence = 1;

  const push = (event) => {
    events.push({
      id: sequence++,
      actor_session_id: session.id,
      actor_type: "user",
      actor_user_id: session.staff_user_id,
      command_id: createId("demo-command"),
      trace_id: createId("demo-trace"),
      ...event,
    });
  };

  for (const order of orders) {
    push({
      order_id: order.id,
      order_number: order.order_number,
      event_type: "order_created",
      from_status: null,
      to_status: "new",
      station_id: order.station_id,
      reason_code: null,
      version_after: 1,
      payload: { source: order.source, priority: order.priority },
      created_at: order.placed_at,
    });

    if (order.status === "prep") {
      push({
        order_id: order.id,
        order_number: order.order_number,
        event_type: "moved_to_prep",
        from_status: "new",
        to_status: "prep",
        station_id: order.station_id,
        reason_code: null,
        version_after: order.state_version,
        payload: {},
        created_at: order.started_at ?? order.updated_at,
      });
    } else if (order.status === "ready") {
      push({
        order_id: order.id,
        order_number: order.order_number,
        event_type: "moved_to_prep",
        from_status: "new",
        to_status: "prep",
        station_id: order.station_id,
        reason_code: null,
        version_after: 2,
        payload: {},
        created_at: order.started_at ?? order.updated_at,
      });
      push({
        order_id: order.id,
        order_number: order.order_number,
        event_type: "moved_to_ready",
        from_status: "prep",
        to_status: "ready",
        station_id: order.station_id,
        reason_code: null,
        version_after: order.state_version,
        payload: {},
        created_at: order.ready_at ?? order.updated_at,
      });
    }
  }

  return events.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function countOrderItems(orders) {
  return orders.reduce((sum, order) => sum + (order.order_items?.length ?? 0), 0);
}

function countOrderItemModifiers(orders) {
  return orders.reduce(
    (sum, order) =>
      sum +
      (order.order_items ?? []).reduce(
        (itemSum, item) => itemSum + (item.modifiers?.length ?? 0),
        0
      ),
    0
  );
}

function buildBoardSnapshot(orders) {
  const active = orders.filter((order) =>
    ["new", "prep", "ready"].includes(order.status)
  );
  const counts = {
    new: active.filter((order) => order.status === "new").length,
    prep: active.filter((order) => order.status === "prep").length,
    ready: active.filter((order) => order.status === "ready").length,
  };
  const checksum = `${counts.new}:${counts.prep}:${counts.ready}:${active.length}`;
  const maxVersion = active.reduce(
    (max, order) => Math.max(max, Number(order.state_version) || 0),
    0
  );
  return { counts, checksum, maxVersion };
}

function createAnalysisSummary({ anomalies, technicalEvents, commandLogs, incidents }) {
  const openAnomalies = anomalies.filter((entry) =>
    ["open", "acknowledged"].includes(entry.status)
  );
  const criticalOpen = openAnomalies.filter((entry) => entry.severity === "critical").length;
  const recentTechErrors = technicalEvents.filter((event) => {
    const ageMs = Date.now() - new Date(event.created_at).getTime();
    return ageMs <= 15 * 60 * 1000 && ["error", "critical"].includes(event.severity);
  }).length;
  const commandAccepted = commandLogs.filter(
    (entry) => entry.result === "accepted" || entry.result === "noop"
  ).length;
  const commandSuccessRate =
    commandLogs.length === 0
      ? 100
      : Math.round((commandAccepted / commandLogs.length) * 100);

  return {
    openAnomalies: openAnomalies.length,
    criticalOpen,
    recentTechErrors,
    activeIncidents: incidents.filter((entry) => entry.status !== "resolved").length,
    commandSuccessRate,
    totalCommands: commandLogs.length,
    totalTechnicalEvents: technicalEvents.length,
  };
}

export function useKdsDemoRuntime({ enabled }) {
  const [orders, setOrders] = useState(() => createSeedOrders());
  const [updatingOrderIds, setUpdatingOrderIds] = useState(new Set());
  const [events, setEvents] = useState([]);
  const [session, setSession] = useState(() => createBaseSession());
  const [heartbeats, setHeartbeats] = useState([]);
  const [commandLogs, setCommandLogs] = useState([]);
  const [technicalEvents, setTechnicalEvents] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [incidentTimeline, setIncidentTimeline] = useState([]);
  const [recoveryActions, setRecoveryActions] = useState([]);
  const [analysisReport, setAnalysisReport] = useState(() => ({
    lastScanAt: null,
    insertedAnomalies: 0,
    summary: {
      openAnomalies: 0,
      criticalOpen: 0,
      recentTechErrors: 0,
      activeIncidents: 0,
      commandSuccessRate: 100,
      totalCommands: 0,
      totalTechnicalEvents: 0,
    },
  }));
  const [recoveryGuide, setRecoveryGuide] = useState(null);
  const [recoveryExecuting, setRecoveryExecuting] = useState(false);
  const [error, setError] = useState("");
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);

  const ordersRef = useRef(orders);
  const eventsRef = useRef(events);
  const orderNumberRef = useRef(2000);
  const eventSequenceRef = useRef(1);
  const commandSequenceRef = useRef(1);
  const techSequenceRef = useRef(1);
  const anomalySequenceRef = useRef(1);
  const incidentSequenceRef = useRef(1);
  const timelineSequenceRef = useRef(1);
  const recoverySequenceRef = useRef(1);
  const autoInjectedRef = useRef(false);
  const anomaliesRef = useRef(anomalies);
  const incidentsRef = useRef(incidents);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    anomaliesRef.current = anomalies;
  }, [anomalies]);

  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  const appendCommandLog = useCallback((entry) => {
    const nextEntry = {
      id: `demo-command-${commandSequenceRef.current++}`,
      received_at: nowIso(),
      started_at: null,
      finished_at: null,
      retry_count: 0,
      error_class: null,
      error_code: null,
      error_message: null,
      ...entry,
    };
    setCommandLogs((current) => [nextEntry, ...current].slice(0, 400));
    return nextEntry.id;
  }, []);

  const patchCommandLog = useCallback((commandId, patch) => {
    setCommandLogs((current) =>
      current.map((entry) => (entry.id === commandId ? { ...entry, ...patch } : entry))
    );
  }, []);

  const appendTechnicalEvent = useCallback((entry) => {
    const nextEntry = {
      id: techSequenceRef.current++,
      created_at: nowIso(),
      severity: "info",
      component: "demo",
      event_name: "demo_event",
      payload: {},
      ...entry,
    };
    setTechnicalEvents((current) => [nextEntry, ...current].slice(0, 500));
    return nextEntry.id;
  }, []);

  const appendEvent = useCallback(
    (eventInput) => {
      const event = {
        id: eventSequenceRef.current++,
        actor_session_id: session.id,
        actor_type: "user",
        actor_user_id: session.staff_user_id,
        created_at: nowIso(),
        payload: {},
        reason_code: null,
        command_id: null,
        trace_id: null,
        ...eventInput,
      };
      const nextEvents = [event, ...eventsRef.current].slice(0, 400);
      eventsRef.current = nextEvents;
      setEvents(nextEvents);
      return event.id;
    },
    [session.id, session.staff_user_id]
  );

  const appendAnomaly = useCallback((entry) => {
    const nextEntry = {
      id: anomalySequenceRef.current++,
      status: "open",
      detected_at: nowIso(),
      detector_name: ANALYSIS_SCAN_NAME,
      expected_state: {},
      observed_state: {},
      incident_id: null,
      ...entry,
    };
    setAnomalies((current) => [nextEntry, ...current].slice(0, 500));
    return nextEntry.id;
  }, []);

  const appendIncidentTimeline = useCallback((entry) => {
    const nextEntry = {
      id: timelineSequenceRef.current++,
      created_at: nowIso(),
      ...entry,
    };
    setIncidentTimeline((current) => [nextEntry, ...current].slice(0, 500));
  }, []);

  const appendRecoveryAction = useCallback((entry) => {
    const id = `demo-recovery-${recoverySequenceRef.current++}`;
    const base = {
      id,
      status: "pending",
      requested_at: nowIso(),
      started_at: null,
      finished_at: null,
      before_state: {},
      after_state: {},
      error: null,
      ...entry,
    };
    setRecoveryActions((current) => [base, ...current].slice(0, 300));
    return id;
  }, []);

  const patchRecoveryAction = useCallback((id, patch) => {
    setRecoveryActions((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    );
  }, []);

  const touchSession = useCallback(() => {
    setSession((current) => ({
      ...current,
      status: "active",
      last_seen_at: nowIso(),
    }));
  }, []);

  useEffect(() => {
    const seededOrders = createSeedOrders();
    const seededSession = createBaseSession();
    const seededEvents = buildSeedEvents(seededOrders, seededSession);

    const maxOrderNumber = seededOrders.reduce(
      (max, order) => Math.max(max, Number(order.order_number) || 0),
      1000
    );
    orderNumberRef.current = maxOrderNumber + 1;

    const maxEventId = seededEvents.reduce(
      (max, event) => Math.max(max, Number(event.id) || 0),
      0
    );
    eventSequenceRef.current = maxEventId + 1;

    setOrders(seededOrders);
    setSession(seededSession);
    setEvents(seededEvents);
    setCommandLogs([]);
    setTechnicalEvents([]);
    setAnomalies([]);
    setIncidents([]);
    setIncidentTimeline([]);
    setRecoveryActions([]);

    const snapshot = buildBoardSnapshot(seededOrders);
    setHeartbeats([
      {
        session_id: seededSession.id,
        station_id: seededSession.station_id,
        connection_state: "live",
        board_checksum: snapshot.checksum,
        max_order_version_seen: snapshot.maxVersion,
        active_counts: snapshot.counts,
        last_seen_at: seededSession.last_seen_at,
      },
    ]);

    setAnalysisReport({
      lastScanAt: null,
      insertedAnomalies: 0,
      summary: {
        openAnomalies: 0,
        criticalOpen: 0,
        recentTechErrors: 0,
        activeIncidents: 0,
        commandSuccessRate: 100,
        totalCommands: 0,
        totalTechnicalEvents: 0,
      },
    });
    setRecoveryGuide(null);
    setRecoveryExecuting(false);
    autoInjectedRef.current = false;
    setError("");
  }, []);

  useEffect(() => {
    const snapshot = buildBoardSnapshot(orders);
    setHeartbeats((current) => {
      const primary = {
        session_id: session.id,
        station_id: session.station_id,
        connection_state: "live",
        board_checksum: snapshot.checksum,
        max_order_version_seen: snapshot.maxVersion,
        active_counts: snapshot.counts,
        last_seen_at: session.last_seen_at,
      };

      const rest = current.filter((entry) => entry.session_id !== session.id);
      return [primary, ...rest].slice(0, 12);
    });
  }, [orders, session.id, session.last_seen_at, session.station_id]);

  const moveOrder = useCallback(
    async (orderId, nextStatus, reasonCode = null) => {
      if (!enabled) {
        return;
      }

      const commandId = createId("demo-command");
      const traceId = createId("demo-trace");
      const commandLogId = appendCommandLog({
        id: commandId,
        trace_id: traceId,
        order_id: orderId,
        command_type: "move_status",
        requested_to_status: nextStatus,
        actor_user_id: session.staff_user_id,
        actor_session_id: session.id,
        result: "accepted",
        started_at: nowIso(),
      });

      setUpdatingOrderIds((current) => {
        const next = new Set(current);
        next.add(orderId);
        return next;
      });

      await new Promise((resolve) => {
        globalThis.setTimeout(resolve, DEMO_ACTION_DELAY_MS);
      });

      const currentOrders = ordersRef.current;
      const targetOrder = currentOrders.find((order) => order.id === orderId);

      if (!targetOrder) {
        const finished = nowIso();
        patchCommandLog(commandLogId, {
          finished_at: finished,
          result: "rejected",
          error_class: "business_validation",
          error_code: "ORDER_NOT_FOUND",
          error_message: "order not found",
        });
        appendTechnicalEvent({
          severity: "error",
          component: "rpc",
          event_name: "kds_move_order_status_failed",
          order_id: orderId,
          command_id: commandId,
          trace_id: traceId,
          error_class: "business_validation",
          error_code: "ORDER_NOT_FOUND",
          message: "Order not found in demo runtime",
        });
        setError("Demo DB: order not found");
        setUpdatingOrderIds((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        return;
      }

      if (!isValidTransition(targetOrder.status, nextStatus)) {
        const finished = nowIso();
        patchCommandLog(commandLogId, {
          finished_at: finished,
          result: "rejected",
          error_class: "business_validation",
          error_code: "INVALID_TRANSITION",
          error_message: `${targetOrder.status} -> ${nextStatus} is not allowed`,
        });
        appendTechnicalEvent({
          severity: "warn",
          component: "rpc",
          event_name: "invalid_transition_blocked",
          order_id: targetOrder.id,
          command_id: commandId,
          trace_id: traceId,
          error_class: "business_validation",
          error_code: "INVALID_TRANSITION",
          message: "Invalid status transition blocked",
          payload: { from: targetOrder.status, to: nextStatus },
        });
        appendAnomaly({
          anomaly_type: "invalid_transition",
          severity: "error",
          detector_name: "demo_runtime_guard",
          order_id: targetOrder.id,
          station_id: targetOrder.station_id,
          expected_state: { allowed: true, transition: `${targetOrder.status} -> ${nextStatus}` },
          observed_state: { allowed: false },
        });
        setError(
          `Demo DB transition blocked: ${targetOrder.status} -> ${nextStatus} is not allowed`
        );
        setUpdatingOrderIds((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        return;
      }

      const isoNow = nowIso();
      const nextOrders = currentOrders.map((order) =>
        order.id === orderId ? applyStatusTimestamps(order, nextStatus, isoNow) : order
      );
      ordersRef.current = nextOrders;
      setOrders(nextOrders);
      setError("");
      touchSession();

      const afterOrder = nextOrders.find((order) => order.id === targetOrder.id);

      appendEvent({
        order_id: targetOrder.id,
        order_number: targetOrder.order_number,
        event_type: mapEventType(targetOrder.status, nextStatus),
        from_status: targetOrder.status,
        to_status: nextStatus,
        station_id: targetOrder.station_id,
        reason_code: reasonCode,
        version_after: afterOrder?.state_version ?? targetOrder.state_version,
        command_id: commandId,
        trace_id: traceId,
        payload: {
          priority: targetOrder.priority,
          source: targetOrder.source,
          rpc: "kds_move_order_status",
        },
      });

      patchCommandLog(commandLogId, {
        finished_at: nowIso(),
        result: "accepted",
      });

      setUpdatingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    },
    [appendAnomaly, appendCommandLog, appendEvent, appendTechnicalEvent, enabled, patchCommandLog, session.id, session.staff_user_id, touchSession]
  );

  const createDemoOrder = useCallback(() => {
    if (!enabled) {
      return;
    }

    const commandId = createId("demo-command");
    const traceId = createId("demo-trace");
    appendCommandLog({
      id: commandId,
      trace_id: traceId,
      order_id: null,
      command_type: "insert_order",
      requested_to_status: "new",
      actor_user_id: session.staff_user_id,
      actor_session_id: session.id,
      result: "accepted",
      started_at: nowIso(),
      finished_at: nowIso(),
    });

    const newOrderNumber = orderNumberRef.current++;
    const isoNow = nowIso();
    const selectedItems = Array.from(
      { length: Math.floor(Math.random() * 2) + 1 },
      () => randomFrom(DEMO_MENU)
    );

    const orderItems = selectedItems.map((template, index) => {
      const modifiers = template.modifiers_pool.filter(() => Math.random() > 0.55).slice(0, 2);
      return {
        id: createId("demo-item"),
        line_number: index + 1,
        item_name: template.item_name,
        quantity: Math.floor(Math.random() * 2) + 1,
        station_id: template.station_id,
        modifiers,
        position: index + 1,
      };
    });

    const station = randomFrom(DEMO_STATIONS);
    const order = {
      id: createId("demo-order"),
      business_date: isoNow.slice(0, 10),
      order_number: newOrderNumber,
      status: "new",
      source: randomFrom(["pos", "web", "kiosk"]),
      priority: randomFrom(["normal", "normal", "rush", "vip"]),
      station_id: station.id,
      placed_at: isoNow,
      started_at: null,
      ready_at: null,
      served_at: null,
      cancelled_at: null,
      special_instructions: Math.random() > 0.7 ? "Customer allergy note" : null,
      state_version: 1,
      updated_at: isoNow,
      order_items: orderItems,
    };

    const nextOrders = [...ordersRef.current, order].sort(
      (a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime()
    );
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    setError("");
    touchSession();

    appendEvent({
      order_id: order.id,
      order_number: order.order_number,
      event_type: "order_created",
      from_status: null,
      to_status: "new",
      station_id: order.station_id,
      reason_code: null,
      version_after: 1,
      command_id: commandId,
      trace_id: traceId,
      payload: {
        source: order.source,
        priority: order.priority,
        inserted_via: "demo_control",
      },
    });
  }, [appendCommandLog, appendEvent, enabled, session.id, session.staff_user_id, touchSession]);

  const pickOrder = useCallback((status, direction = "oldest") => {
    const filtered = ordersRef.current
      .filter((order) => order.status === status)
      .sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime());
    if (filtered.length === 0) {
      return null;
    }
    return direction === "newest" ? filtered[filtered.length - 1] : filtered[0];
  }, []);

  const advanceOldestNew = useCallback(() => {
    const order = pickOrder("new", "oldest");
    if (order) {
      moveOrder(order.id, "prep");
    } else {
      setError("Demo DB: no NEW orders to move");
    }
  }, [moveOrder, pickOrder]);

  const advanceOldestPrep = useCallback(() => {
    const order = pickOrder("prep", "oldest");
    if (order) {
      moveOrder(order.id, "ready");
    } else {
      setError("Demo DB: no PREP orders to move");
    }
  }, [moveOrder, pickOrder]);

  const serveOldestReady = useCallback(() => {
    const order = pickOrder("ready", "oldest");
    if (order) {
      moveOrder(order.id, "served");
    } else {
      setError("Demo DB: no READY orders to serve");
    }
  }, [moveOrder, pickOrder]);

  const cancelNewestNew = useCallback(() => {
    const order = pickOrder("new", "newest");
    if (order) {
      moveOrder(order.id, "cancelled", "customer_cancelled");
    } else {
      setError("Demo DB: no NEW orders to cancel");
    }
  }, [moveOrder, pickOrder]);

  const runScenarioStep = useCallback(() => {
    const hasNew = ordersRef.current.some((order) => order.status === "new");
    const hasPrep = ordersRef.current.some((order) => order.status === "prep");
    const hasReady = ordersRef.current.some((order) => order.status === "ready");

    if (hasReady && Math.random() > 0.45) {
      serveOldestReady();
      return;
    }
    if (hasPrep && Math.random() > 0.35) {
      advanceOldestPrep();
      return;
    }
    if (hasNew) {
      advanceOldestNew();
      return;
    }
    createDemoOrder();
  }, [advanceOldestNew, advanceOldestPrep, createDemoOrder, serveOldestReady]);

  const injectRealtimeDrop = useCallback(() => {
    appendTechnicalEvent({
      severity: "error",
      component: "realtime",
      event_name: "realtime_event_drop",
      message: "Simulated drop of realtime packet",
      payload: { mode: "fault_injection" },
      session_id: session.id,
    });
    appendAnomaly({
      anomaly_type: "realtime_gap",
      severity: "error",
      detector_name: "fault_injection",
      session_id: session.id,
      station_id: session.station_id,
      expected_state: { stream: "continuous" },
      observed_state: { stream: "gap_detected" },
    });
  }, [appendAnomaly, appendTechnicalEvent, session.id, session.station_id]);

  const injectDuplicateOrder = useCallback(() => {
    const sourceOrder = randomFrom(ordersRef.current);
    if (!sourceOrder) return;

    const duplicated = {
      ...sourceOrder,
      id: createId("demo-dup-order"),
      status: "new",
      placed_at: nowIso(),
      updated_at: nowIso(),
      state_version: 1,
      special_instructions: "Injected duplicate for reliability test",
      order_items: sourceOrder.order_items.map((item) => ({
        ...item,
        id: createId("demo-dup-item"),
      })),
    };
    const nextOrders = [...ordersRef.current, duplicated];
    ordersRef.current = nextOrders;
    setOrders(nextOrders);
    appendAnomaly({
      anomaly_type: "duplicate_order",
      severity: "critical",
      detector_name: "fault_injection",
      order_id: duplicated.id,
      station_id: duplicated.station_id,
      expected_state: { uniqueness: "business_date + order_number unique" },
      observed_state: {
        duplicated_order_number: duplicated.order_number,
      },
    });
    appendTechnicalEvent({
      severity: "critical",
      component: "data_integrity",
      event_name: "duplicate_order_inserted",
      message: "Fault injection inserted duplicate order number",
      payload: { order_number: duplicated.order_number },
      order_id: duplicated.id,
    });
  }, [appendAnomaly, appendTechnicalEvent]);

  const injectStatusJump = useCallback(() => {
    const target = pickOrder("new", "oldest");
    if (!target) {
      setError("Demo DB: no NEW order for status jump fault");
      return;
    }

    const isoNow = nowIso();
    const jumpedOrder = {
      ...target,
      status: "ready",
      ready_at: isoNow,
      updated_at: isoNow,
      state_version: (target.state_version ?? 1) + 1,
      special_instructions: "Injected invalid status jump",
    };
    const nextOrders = ordersRef.current.map((order) =>
      order.id === target.id ? jumpedOrder : order
    );
    ordersRef.current = nextOrders;
    setOrders(nextOrders);

    appendAnomaly({
      anomaly_type: "status_skipped",
      severity: "critical",
      detector_name: "fault_injection",
      order_id: target.id,
      station_id: target.station_id,
      expected_state: { transition: "new -> prep -> ready" },
      observed_state: { transition: "new -> ready" },
    });
    appendTechnicalEvent({
      severity: "critical",
      component: "workflow",
      event_name: "status_jump_injected",
      message: "Injected invalid status jump",
      order_id: target.id,
      payload: { from: "new", to: "ready" },
    });
  }, [appendAnomaly, appendTechnicalEvent, pickOrder]);

  const injectDivergence = useCallback(() => {
    const snapshot = buildBoardSnapshot(ordersRef.current);
    const divergenceSessionId = createId("demo-session");
    setHeartbeats((current) => [
      {
        session_id: divergenceSessionId,
        station_id: session.station_id,
        connection_state: "live",
        board_checksum: `${snapshot.checksum}-diverged`,
        max_order_version_seen: Math.max(snapshot.maxVersion - 2, 0),
        active_counts: {
          ...snapshot.counts,
          ready: Math.max(snapshot.counts.ready - 1, 0),
        },
        last_seen_at: nowIso(),
      },
      ...current,
    ]);
    appendAnomaly({
      anomaly_type: "screen_divergence",
      severity: "critical",
      detector_name: "fault_injection",
      station_id: session.station_id,
      session_id: divergenceSessionId,
      expected_state: { checksum: snapshot.checksum },
      observed_state: { checksum: `${snapshot.checksum}-diverged` },
    });
  }, [appendAnomaly, session.station_id]);

  const injectStaleState = useCallback(() => {
    const staleTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    setHeartbeats((current) =>
      current.map((entry, index) =>
        index === 0
          ? {
              ...entry,
              last_seen_at: staleTime,
              connection_state: "live",
            }
          : entry
      )
    );
    appendAnomaly({
      anomaly_type: "stale_snapshot",
      severity: "error",
      detector_name: "fault_injection",
      session_id: session.id,
      station_id: session.station_id,
      expected_state: { heartbeat_age_sec_max: 45 },
      observed_state: { heartbeat_age_sec: 300 },
    });
  }, [appendAnomaly, session.id, session.station_id]);

  const injectKpiMismatch = useCallback(() => {
    appendAnomaly({
      anomaly_type: "kpi_mismatch",
      severity: "warn",
      detector_name: "fault_injection",
      station_id: session.station_id,
      expected_state: { avg_wait_source: "orders" },
      observed_state: { avg_wait_source: "stale_cache" },
    });
    appendTechnicalEvent({
      severity: "warn",
      component: "analytics",
      event_name: "kpi_drift_detected",
      message: "Injected KPI mismatch between board and aggregate cache",
      payload: { metric: "avg_wait" },
    });
  }, [appendAnomaly, appendTechnicalEvent, session.station_id]);

  const runAnalysisScan = useCallback(() => {
    const currentOrders = ordersRef.current;
    let inserted = 0;

    const activeOrders = currentOrders.filter((order) =>
      ["new", "prep", "ready"].includes(order.status)
    );
    const orderKeyMap = new Map();
    for (const order of activeOrders) {
      const key = `${order.business_date}:${order.order_number}`;
      if (!orderKeyMap.has(key)) {
        orderKeyMap.set(key, []);
      }
      orderKeyMap.get(key).push(order);
    }

    for (const [key, entries] of orderKeyMap.entries()) {
      if (entries.length > 1) {
        appendAnomaly({
          anomaly_type: "duplicate_order",
          severity: "critical",
          detector_name: ANALYSIS_SCAN_NAME,
          order_id: entries[0].id,
          station_id: entries[0].station_id,
          expected_state: { uniqueness: true },
          observed_state: { key, duplicates: entries.map((entry) => entry.id) },
        });
        inserted += 1;
      }
    }

    const nowMs = Date.now();
    for (const heartbeat of heartbeats) {
      const ageMs = nowMs - new Date(heartbeat.last_seen_at).getTime();
      if (ageMs > 45_000) {
        appendAnomaly({
          anomaly_type: "stale_snapshot",
          severity: "error",
          detector_name: ANALYSIS_SCAN_NAME,
          session_id: heartbeat.session_id,
          station_id: heartbeat.station_id,
          expected_state: { heartbeat_age_ms_max: 45000 },
          observed_state: { heartbeat_age_ms: ageMs },
        });
        inserted += 1;
      }
    }

    const checksumsByStation = new Map();
    for (const heartbeat of heartbeats) {
      if (!checksumsByStation.has(heartbeat.station_id)) {
        checksumsByStation.set(heartbeat.station_id, new Set());
      }
      checksumsByStation.get(heartbeat.station_id).add(heartbeat.board_checksum);
    }
    for (const [stationId, checksumSet] of checksumsByStation.entries()) {
      if (checksumSet.size > 1) {
        appendAnomaly({
          anomaly_type: "screen_divergence",
          severity: "critical",
          detector_name: ANALYSIS_SCAN_NAME,
          station_id: stationId,
          expected_state: { checksum_variants: 1 },
          observed_state: { checksum_variants: checksumSet.size },
        });
        inserted += 1;
      }
    }

    const summary = createAnalysisSummary({
      anomalies,
      technicalEvents,
      commandLogs,
      incidents,
    });

    setAnalysisReport({
      lastScanAt: nowIso(),
      insertedAnomalies: inserted,
      summary,
    });
    setError("");
  }, [anomalies, appendAnomaly, commandLogs, heartbeats, incidents, technicalEvents]);

  const updateRecoveryStep = useCallback((stepId, status, detail) => {
    setRecoveryGuide((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        steps: current.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                status,
                detail,
              }
            : step
        ),
      };
    });
  }, []);

  const injectErrorNow = useCallback(() => {
    injectStatusJump();
    injectDivergence();
    injectRealtimeDrop();
    setRecoveryGuide(createRecoveryGuide("Critical desync drill"));
    setRecoveryExecuting(false);
    setError("Error injected: status jump + divergence + realtime gap.");
  }, [injectDivergence, injectRealtimeDrop, injectStatusJump]);

  const runDeliveryFailureScenario = useCallback(() => {
    injectRealtimeDrop();
    injectStaleState();
    globalThis.setTimeout(() => {
      runAnalysisScan();
    }, 60);
  }, [injectRealtimeDrop, injectStaleState, runAnalysisScan]);

  const runDataIntegrityScenario = useCallback(() => {
    injectDuplicateOrder();
    injectDivergence();
    injectKpiMismatch();
    globalThis.setTimeout(() => {
      runAnalysisScan();
    }, 60);
  }, [injectDivergence, injectDuplicateOrder, injectKpiMismatch, runAnalysisScan]);

  const runWorkflowDesyncScenario = useCallback(() => {
    injectStatusJump();
    injectDivergence();
    globalThis.setTimeout(() => {
      runAnalysisScan();
    }, 60);
  }, [injectDivergence, injectStatusJump, runAnalysisScan]);

  const createIncidentFromOpenAnomalies = useCallback(() => {
    const openAnomalies = anomalies.filter((entry) =>
      ["open", "acknowledged"].includes(entry.status)
    );
    if (openAnomalies.length === 0) {
      setError("No open anomalies to attach to an incident");
      return;
    }

    const incidentId = `demo-incident-${incidentSequenceRef.current++}`;
    const incident = {
      id: incidentId,
      title: "Demo reliability incident",
      severity: openAnomalies.some((entry) => entry.severity === "critical")
        ? "critical"
        : "error",
      status: "open",
      detected_at: nowIso(),
      acknowledged_at: nowIso(),
      resolved_at: null,
      owner_user_id: session.staff_user_id,
      summary: "Generated from current open anomalies",
    };
    setIncidents((current) => [incident, ...current].slice(0, 100));
    appendIncidentTimeline({
      incident_id: incidentId,
      event_type: "incident_created",
      actor_user_id: session.staff_user_id,
      details: { anomaly_count: openAnomalies.length },
    });
    setAnomalies((current) =>
      current.map((entry) =>
        ["open", "acknowledged"].includes(entry.status)
          ? { ...entry, status: "acknowledged", incident_id: incidentId }
          : entry
      )
    );
    setError("");
  }, [anomalies, appendIncidentTimeline, session.staff_user_id]);

  const runRecoveryResync = useCallback(() => {
    const actionId = appendRecoveryAction({
      action_type: "force_resync",
      target_session_id: session.id,
      requested_by: session.staff_user_id,
      status: "running",
      started_at: nowIso(),
    });

    const snapshot = buildBoardSnapshot(ordersRef.current);
    const now = nowIso();
    setHeartbeats((current) =>
      current.map((entry) => ({
        ...entry,
        board_checksum: snapshot.checksum,
        max_order_version_seen: snapshot.maxVersion,
        active_counts: snapshot.counts,
        last_seen_at: now,
        connection_state: "live",
      }))
    );

    setAnomalies((current) =>
      current.map((entry) =>
        ["screen_divergence", "stale_snapshot", "realtime_gap"].includes(
          entry.anomaly_type
        ) && entry.status !== "resolved"
          ? { ...entry, status: "resolved", resolved_at: now, resolution_note: "resync applied" }
          : entry
      )
    );

    patchRecoveryAction(actionId, {
      status: "success",
      finished_at: nowIso(),
      after_state: { board_checksum: snapshot.checksum },
    });

    appendTechnicalEvent({
      severity: "info",
      component: "recovery",
      event_name: "force_resync_completed",
      message: "Recovery action completed",
      payload: { action_id: actionId },
    });
    setError("");
  }, [appendRecoveryAction, appendTechnicalEvent, patchRecoveryAction, session.id, session.staff_user_id]);

  const executeRecoveryPath = useCallback(async () => {
    if (!recoveryGuide || recoveryExecuting) {
      return;
    }

    setRecoveryExecuting(true);
    try {
      updateRecoveryStep("detect", RECOVERY_STEP_IN_PROGRESS, "Running consistency scan");
      runAnalysisScan();
      await sleep(90);
      const openAfterDetect = anomaliesRef.current.filter((entry) =>
        ["open", "acknowledged"].includes(entry.status)
      ).length;
      updateRecoveryStep(
        "detect",
        RECOVERY_STEP_COMPLETED,
        `Open anomalies detected: ${openAfterDetect}`
      );

      updateRecoveryStep(
        "incident",
        RECOVERY_STEP_IN_PROGRESS,
        "Creating incident from open anomalies"
      );
      createIncidentFromOpenAnomalies();
      await sleep(90);
      const activeIncidentCount = incidentsRef.current.filter(
        (incident) => incident.status !== "resolved"
      ).length;
      updateRecoveryStep(
        "incident",
        RECOVERY_STEP_COMPLETED,
        `Active incidents: ${activeIncidentCount}`
      );

      updateRecoveryStep(
        "recover",
        RECOVERY_STEP_IN_PROGRESS,
        "Executing resync recovery action"
      );
      runRecoveryResync();
      await sleep(90);
      updateRecoveryStep(
        "recover",
        RECOVERY_STEP_COMPLETED,
        "Recovery resync completed"
      );

      updateRecoveryStep(
        "verify",
        RECOVERY_STEP_IN_PROGRESS,
        "Re-running scan for post-recovery verification"
      );
      runAnalysisScan();
      await sleep(90);
      const remainingAnomalies = anomaliesRef.current.filter((entry) =>
        ["open", "acknowledged"].includes(entry.status)
      ).length;
      updateRecoveryStep(
        "verify",
        remainingAnomalies === 0 ? RECOVERY_STEP_COMPLETED : RECOVERY_STEP_WARNING,
        remainingAnomalies === 0
          ? "Verification successful: no open anomalies"
          : `Verification warning: ${remainingAnomalies} anomalies still open`
      );
      setError("");
    } catch (runtimeError) {
      updateRecoveryStep(
        "verify",
        RECOVERY_STEP_FAILED,
        `Recovery flow failed: ${String(runtimeError?.message ?? runtimeError)}`
      );
      setError("Recovery path failed in demo runtime.");
    } finally {
      setRecoveryExecuting(false);
    }
  }, [
    createIncidentFromOpenAnomalies,
    recoveryExecuting,
    recoveryGuide,
    runAnalysisScan,
    runRecoveryResync,
    updateRecoveryStep,
  ]);

  useEffect(() => {
    if (!enabled || autoInjectedRef.current || orders.length === 0) {
      return;
    }
    autoInjectedRef.current = true;
    injectErrorNow();
  }, [enabled, injectErrorNow, orders.length]);

  const resetDemo = useCallback(() => {
    const seededOrders = createSeedOrders();
    const seededSession = createBaseSession();
    const seededEvents = buildSeedEvents(seededOrders, seededSession);
    const snapshot = buildBoardSnapshot(seededOrders);

    setSession(seededSession);
    setOrders(seededOrders);
    ordersRef.current = seededOrders;

    setEvents(seededEvents);
    eventsRef.current = seededEvents;

    orderNumberRef.current =
      seededOrders.reduce(
        (max, order) => Math.max(max, Number(order.order_number) || 0),
        1000
      ) + 1;
    eventSequenceRef.current =
      seededEvents.reduce((max, event) => Math.max(max, Number(event.id) || 0), 0) + 1;

    commandSequenceRef.current = 1;
    techSequenceRef.current = 1;
    anomalySequenceRef.current = 1;
    incidentSequenceRef.current = 1;
    timelineSequenceRef.current = 1;
    recoverySequenceRef.current = 1;

    setCommandLogs([]);
    setTechnicalEvents([]);
    setAnomalies([]);
    setIncidents([]);
    setIncidentTimeline([]);
    setRecoveryActions([]);
    setHeartbeats([
      {
        session_id: seededSession.id,
        station_id: seededSession.station_id,
        connection_state: "live",
        board_checksum: snapshot.checksum,
        max_order_version_seen: snapshot.maxVersion,
        active_counts: snapshot.counts,
        last_seen_at: seededSession.last_seen_at,
      },
    ]);

    setUpdatingOrderIds(new Set());
    setAutoplayEnabled(false);
    setAnalysisReport({
      lastScanAt: null,
      insertedAnomalies: 0,
      summary: {
        openAnomalies: 0,
        criticalOpen: 0,
        recentTechErrors: 0,
        activeIncidents: 0,
        commandSuccessRate: 100,
        totalCommands: 0,
        totalTechnicalEvents: 0,
      },
    });
    setRecoveryGuide(null);
    setRecoveryExecuting(false);
    setError("");
  }, []);

  useEffect(() => {
    if (!enabled || !autoplayEnabled) {
      return undefined;
    }

    const autoplayId = globalThis.setInterval(() => {
      runScenarioStep();
    }, 4200);

    return () => {
      globalThis.clearInterval(autoplayId);
    };
  }, [autoplayEnabled, enabled, runScenarioStep]);

  const tableCounts = useMemo(
    () => ({
      orders: orders.length,
      order_items: countOrderItems(orders),
      order_item_modifiers: countOrderItemModifiers(orders),
      order_events: events.length,
      kitchen_stations: DEMO_STATIONS.length,
      kitchen_sessions: heartbeats.length,
      staff_profiles: DEMO_STAFF_PROFILE_COUNT,
      staff_station_memberships: DEMO_STAFF_MEMBERSHIP_COUNT,
      order_station_assignments: orders.length,
      kds_command_log: commandLogs.length,
      kds_technical_events: technicalEvents.length,
      kds_client_heartbeats: heartbeats.length,
      kds_anomalies: anomalies.length,
      kds_incidents: incidents.length,
      kds_incident_timeline: incidentTimeline.length,
      kds_recovery_actions: recoveryActions.length,
    }),
    [
      anomalies.length,
      commandLogs.length,
      events.length,
      heartbeats.length,
      incidentTimeline.length,
      incidents.length,
      orders,
      recoveryActions.length,
      technicalEvents.length,
    ]
  );

  const computedAnalysisSummary = useMemo(
    () =>
      createAnalysisSummary({
        anomalies,
        technicalEvents,
        commandLogs,
        incidents,
      }),
    [anomalies, commandLogs, incidents, technicalEvents]
  );

  return {
    stations: DEMO_STATIONS,
    orders,
    events,
    session,
    heartbeats,
    commandLogs,
    technicalEvents,
    anomalies,
    incidents,
    incidentTimeline,
    recoveryActions,
    tableCounts,
    error,
    updatingOrderIds,
    autoplayEnabled,
    setAutoplayEnabled,
    analysisReport,
    computedAnalysisSummary,
    recoveryGuide,
    recoveryExecuting,
    injectErrorNow,
    executeRecoveryPath,
    runAnalysisScan,
    resetDemo,
    moveOrder,
    createDemoOrder,
    runScenarioStep,
    touchSession,
    advanceOldestNew,
    advanceOldestPrep,
    serveOldestReady,
    cancelNewestNew,
    injectRealtimeDrop,
    injectDuplicateOrder,
    injectStatusJump,
    injectDivergence,
    injectStaleState,
    injectKpiMismatch,
    runDeliveryFailureScenario,
    runDataIntegrityScenario,
    runWorkflowDesyncScenario,
    createIncidentFromOpenAnomalies,
    runRecoveryResync,
  };
}
