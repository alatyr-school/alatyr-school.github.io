import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "../supabaseClient.js";

export function useKitchenOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [updatingOrderIds, setUpdatingOrderIds] = useState(new Set());
  const channelRef = useRef(null);

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
  }, []);

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
  }, [fetchOrders]);

  const moveOrder = useCallback(async (orderId, nextStatus) => {
    if (!supabase) {
      return;
    }

    setUpdatingOrderIds((current) => {
      const next = new Set(current);
      next.add(orderId);
      return next;
    });

    setOrders((current) =>
      current.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: nextStatus };
        }
        return order;
      })
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);

    if (updateError) {
      setError(updateError.message);
      fetchOrders();
    } else {
      setError("");
    }

    setUpdatingOrderIds((current) => {
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
  }, [fetchOrders]);

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
