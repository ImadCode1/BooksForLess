import { useSyncExternalStore } from "react";

import type { BookCondition } from "@/data/books";

export type Order = {
  id: string;
  isbn: string;
  title: string;
  condition: BookCondition;
  price: number;
  paymentMethod: string;
  createdAt: Date;
};

// In-memory only: orders are lost when the app restarts.
// TODO: load orders from the backend once there is one.
let orders: Order[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getOrders(): Order[] {
  return orders;
}

export function addOrder(order: Omit<Order, "id" | "createdAt">): Order {
  const created: Order = {
    ...order,
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(),
  };
  orders = [created, ...orders]; // newest first
  listeners.forEach((listener) => listener());
  return created;
}

export function useOrders(): Order[] {
  return useSyncExternalStore(subscribe, getOrders, getOrders);
}
