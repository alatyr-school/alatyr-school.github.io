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

function nowIso() {
  return new Date().toISOString();
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
  const nextOrder = { ...order, status: nextStatus, updated_at: isoNow };

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
    app_version: "demo-runtime-1.0.0",
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

export function useKdsDemoRuntime({ enabled }) {
  const [orders, setOrders] = useState(() => createSeedOrders());
  const [updatingOrderIds, setUpdatingOrderIds] = useState(new Set());
  const [events, setEvents] = useState([]);
  const [session, setSession] = useState(() => createBaseSession());
  const [error, setError] = useState("");
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);

  const ordersRef = useRef(orders);
  const eventsRef = useRef(events);
  const orderNumberRef = useRef(2000);
  const eventSequenceRef = useRef(1);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const seededOrders = createSeedOrders();
    const maxOrderNumber = seededOrders.reduce(
      (max, order) => Math.max(max, Number(order.order_number) || 0),
      1000
    );
    orderNumberRef.current = maxOrderNumber + 1;

    const initialEvents = buildSeedEvents(seededOrders, session);
    const maxEventId = initialEvents.reduce(
      (max, event) => Math.max(max, Number(event.id) || 0),
      0
    );
    eventSequenceRef.current = maxEventId + 1;
    setOrders(seededOrders);
    setEvents(initialEvents);
    setError("");
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
        ...eventInput,
      };

      const nextEvents = [event, ...eventsRef.current].slice(0, 300);
      eventsRef.current = nextEvents;
      setEvents(nextEvents);
    },
    [session.id, session.staff_user_id]
  );

  const touchSession = useCallback(() => {
    setSession((current) => ({
      ...current,
      status: "active",
      last_seen_at: nowIso(),
    }));
  }, []);

  const moveOrder = useCallback(
    async (orderId, nextStatus, reasonCode = null) => {
      if (!enabled) {
        return;
      }

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
        setError("Demo DB: order not found");
        setUpdatingOrderIds((current) => {
          const next = new Set(current);
          next.delete(orderId);
          return next;
        });
        return;
      }

      if (!isValidTransition(targetOrder.status, nextStatus)) {
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

      appendEvent({
        order_id: targetOrder.id,
        order_number: targetOrder.order_number,
        event_type: mapEventType(targetOrder.status, nextStatus),
        from_status: targetOrder.status,
        to_status: nextStatus,
        station_id: targetOrder.station_id,
        reason_code: reasonCode,
        payload: {
          priority: targetOrder.priority,
          source: targetOrder.source,
          rpc: "kds_move_order_status",
        },
      });

      setUpdatingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    },
    [appendEvent, enabled, touchSession]
  );

  const createDemoOrder = useCallback(() => {
    if (!enabled) {
      return;
    }

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
      payload: {
        source: order.source,
        priority: order.priority,
        inserted_via: "demo_control",
      },
    });
  }, [appendEvent, enabled, touchSession]);

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

  const resetDemo = useCallback(() => {
    const seededOrders = createSeedOrders();
    const seededSession = createBaseSession();
    const seededEvents = buildSeedEvents(seededOrders, seededSession);

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

    setUpdatingOrderIds(new Set());
    setAutoplayEnabled(false);
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
      kitchen_sessions: 1,
      staff_profiles: DEMO_STAFF_PROFILE_COUNT,
      staff_station_memberships: DEMO_STAFF_MEMBERSHIP_COUNT,
      order_station_assignments: orders.length,
    }),
    [events.length, orders]
  );

  return {
    stations: DEMO_STATIONS,
    orders,
    events,
    session,
    tableCounts,
    error,
    updatingOrderIds,
    autoplayEnabled,
    setAutoplayEnabled,
    resetDemo,
    moveOrder,
    createDemoOrder,
    runScenarioStep,
    touchSession,
    advanceOldestNew,
    advanceOldestPrep,
    serveOldestReady,
    cancelNewestNew,
  };
}
