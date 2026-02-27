import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient.js";

const KDS_SESSION_STORAGE_KEY = "kds_session_id";

function getOrCreateKdsSessionId() {
  if (!globalThis.localStorage || !globalThis.crypto?.randomUUID) {
    return null;
  }

  try {
    const existing = globalThis.localStorage.getItem(KDS_SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }

    const created = globalThis.crypto.randomUUID();
    globalThis.localStorage.setItem(KDS_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function useKitchenOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [updatingOrderIds, setUpdatingOrderIds] = useState(new Set());
  const channelRef = useRef(null);

  const reportTechnicalEvent = useCallback(
    async ({
      severity = "warn",
      component,
      eventName,
      message = null,
      payload = {},
      orderId = null,
      sessionId = null,
      errorClass = null,
      errorCode = null,
    }) => {
      if (!supabase) {
        return;
      }

      try {
        await supabase.rpc("kds_log_technical_event", {
          p_severity: severity,
          p_component: component,
          p_event_name: eventName,
          p_message: message,
          p_payload: payload,
          p_order_id: orderId,
          p_session_id: sessionId,
          p_command_id: null,
          p_trace_id: null,
          p_error_class: errorClass,
          p_error_code: errorCode,
        });
      } catch {
        // Silent fallback: observability call should never block business flow.
      }
    },
    []
  );

  const fetchOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setConnectionState("offline");
      setError("Supabase is not configured.");
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        placed_at,
        started_at,
        ready_at,
        updated_at,
        order_items (
          id,
          item_name,
          quantity,
          modifiers,
          position
        )
      `
      )
      .order("placed_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      reportTechnicalEvent({
        severity: "error",
        component: "client_fetch",
        eventName: "orders_fetch_failed",
        message: fetchError.message,
        payload: { hook: "useKitchenOrders.fetchOrders" },
        errorClass: "query",
        errorCode: fetchError.code ?? null,
      });
      return;
    }

    const normalized = (data ?? []).map((order) => ({
      ...order,
      order_items: [...(order.order_items ?? [])].sort(
        (a, b) => a.position - b.position
      ),
    }));

    setOrders(normalized);
    setError("");
    setLoading(false);
  }, [reportTechnicalEvent]);

  useEffect(() => {
    fetchOrders();

    if (!isSupabaseConfigured || !supabase) {
      return undefined;
    }

    const channel = supabase
      .channel("kds-realtime-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        fetchOrders
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        fetchOrders
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionState("live");
        } else if (status === "CHANNEL_ERROR") {
          setConnectionState("error");
          reportTechnicalEvent({
            severity: "error",
            component: "realtime",
            eventName: "channel_error",
            message: "Supabase realtime channel error",
            payload: { channel: "kds-realtime-orders" },
            errorClass: "realtime",
          });
        } else if (status === "TIMED_OUT") {
          setConnectionState("error");
          reportTechnicalEvent({
            severity: "warn",
            component: "realtime",
            eventName: "channel_timeout",
            message: "Supabase realtime channel timeout",
            payload: { channel: "kds-realtime-orders" },
            errorClass: "realtime",
          });
        } else {
          setConnectionState("connecting");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchOrders, reportTechnicalEvent]);

  const moveOrder = useCallback(async (orderId, nextStatus) => {
    if (!supabase) {
      return;
    }

    let expectedUpdatedAt = null;

    setUpdatingOrderIds((current) => {
      const next = new Set(current);
      next.add(orderId);
      return next;
    });

    setOrders((current) =>
      current.map((order) => {
        if (order.id === orderId) {
          expectedUpdatedAt = order.updated_at ?? null;
          return { ...order, status: nextStatus };
        }
        return order;
      })
    );

    try {
      const actorSessionId = getOrCreateKdsSessionId();
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "kds_move_order_status",
        {
          p_order_id: orderId,
          p_to_status: nextStatus,
          p_reason_code: null,
          p_actor_session_id: actorSessionId,
          p_expected_updated_at: expectedUpdatedAt,
        }
      );

      let resolvedData = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      let resolvedError = rpcError;
      const message = rpcError?.message ?? "";
      const missingFunction =
        message.includes("Could not find the function") ||
        message.includes("does not exist");

      // Transitional fallback for environments where RPC is not deployed yet.
      if (missingFunction) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("orders")
          .update({ status: nextStatus })
          .eq("id", orderId)
          .select("id,status,updated_at")
          .maybeSingle();

        resolvedData = fallbackData ?? resolvedData;
        resolvedError = fallbackError;
      }

      if (resolvedError) {
        setError(resolvedError.message);
        fetchOrders();
        reportTechnicalEvent({
          severity: "error",
          component: "rpc",
          eventName: "move_order_failed",
          message: resolvedError.message,
          payload: { nextStatus, fallbackUsed: missingFunction },
          orderId,
          sessionId: actorSessionId,
          errorClass: missingFunction ? "fallback" : "rpc",
          errorCode: resolvedError.code ?? null,
        });
      } else {
        if (resolvedData?.id) {
          setOrders((current) =>
            current.map((order) =>
              order.id === resolvedData.id
                ? {
                    ...order,
                    status: resolvedData.status ?? nextStatus,
                    updated_at: resolvedData.updated_at ?? order.updated_at,
                  }
                : order
            )
          );
        }

        setError("");
      }
    } finally {
      setUpdatingOrderIds((current) => {
        const next = new Set(current);
        next.delete(orderId);
        return next;
      });
    }
  }, [fetchOrders, reportTechnicalEvent]);

  return {
    orders,
    loading,
    error,
    connectionState,
    updatingOrderIds,
    moveOrder,
    reloadOrders: fetchOrders,
    isSupabaseConfigured,
  };
}
