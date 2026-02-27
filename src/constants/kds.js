export const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export const BOARD_COLUMNS = [
  { key: "new", title: "New" },
  { key: "prep", title: "Prep" },
  { key: "ready", title: "Ready" },
];

export function getElapsedMs(placedAtIso, nowMs) {
  return nowMs - new Date(placedAtIso).getTime();
}

export function isOrderLate(order, nowMs) {
  return getElapsedMs(order.placed_at, nowMs) >= FIFTEEN_MINUTES_MS;
}

export function matchesOrderQuery(order, queryText) {
  if (!queryText) {
    return true;
  }

  const normalizedQuery = queryText.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  if (String(order.order_number).includes(normalizedQuery)) {
    return true;
  }

  for (const item of order.order_items ?? []) {
    if ((item.item_name ?? "").toLowerCase().includes(normalizedQuery)) {
      return true;
    }

    for (const modifier of item.modifiers ?? []) {
      if ((modifier ?? "").toLowerCase().includes(normalizedQuery)) {
        return true;
      }
    }
  }

  return false;
}
