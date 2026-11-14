import { useSyncExternalStore } from "react";

export type BookFeedback = Readonly<{ completed: boolean; rating: number | null }>;
const EMPTY_FEEDBACK: BookFeedback = { completed: false, rating: null };
const feedback = new Map<string, BookFeedback>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getBookFeedback(key: string): BookFeedback {
  return feedback.get(key) ?? EMPTY_FEEDBACK;
}

/** Device/session-only confirmations: never update the shared public demo records. */
export function setBookCompleted(key: string, completed: boolean) {
  feedback.set(key, { completed, rating: null });
  listeners.forEach((listener) => listener());
}

export function rateBookExperience(key: string, rating: number) {
  const current = getBookFeedback(key);
  if (!current.completed || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
  feedback.set(key, { ...current, rating });
  listeners.forEach((listener) => listener());
}

export function useBookFeedback(key: string): BookFeedback {
  return useSyncExternalStore(subscribe, () => getBookFeedback(key), () => EMPTY_FEEDBACK);
}
