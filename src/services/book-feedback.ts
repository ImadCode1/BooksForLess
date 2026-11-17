import { useSyncExternalStore } from "react";

export type BookFeedback = Readonly<{ completed: boolean; rating: number | null }>;
const EMPTY_FEEDBACK: BookFeedback = { completed: false, rating: null };
const EMPTY_FEEDBACK_STORE: ReadonlyMap<string, BookFeedback> = new Map();
let feedback: ReadonlyMap<string, BookFeedback> = EMPTY_FEEDBACK_STORE;
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
  feedback = new Map(feedback).set(key, { completed, rating: null });
  listeners.forEach((listener) => listener());
}

/** Commit confirmation and optional review together, never when the form is opened. */
export function confirmBookCompletion(key: string, rating: number | null): boolean {
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) return false;
  feedback = new Map(feedback).set(key, { completed: true, rating });
  listeners.forEach((listener) => listener());
  return true;
}

export function rateBookExperience(key: string, rating: number) {
  const current = getBookFeedback(key);
  if (!current.completed || !Number.isInteger(rating) || rating < 1 || rating > 5) return;
  feedback = new Map(feedback).set(key, { ...current, rating });
  listeners.forEach((listener) => listener());
}

export function useBookFeedback(key: string): BookFeedback {
  return useSyncExternalStore(subscribe, () => getBookFeedback(key), () => EMPTY_FEEDBACK);
}

export function getBookFeedbackSnapshot(): ReadonlyMap<string, BookFeedback> {
  return feedback;
}

export function useBookFeedbackSnapshot(): ReadonlyMap<string, BookFeedback> {
  return useSyncExternalStore(subscribe, getBookFeedbackSnapshot, () => EMPTY_FEEDBACK_STORE);
}
