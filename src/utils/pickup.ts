import type { Order } from "@/services/orders";

/** A local pickup identity, not a booking URL or proof of payment. */
export function pickupQrValue(order: Pick<Order, "id">): string {
  return `booksforless:pickup:${order.id}`;
}
