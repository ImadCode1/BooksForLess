import type { BookFeedback } from '@/services/book-feedback';
import type { Order } from '@/services/orders';
import type { LocalTicket } from '@/types/local-ticket';

export type LibraryItem = { kind: 'sale'; ticket: LocalTicket } | { kind: 'purchase'; order: Order };
export type LibrarySection = 'purchases' | 'selling' | 'history';

export function selectLibraryItems(
  tickets: readonly LocalTicket[],
  orders: readonly Order[],
  feedback: ReadonlyMap<string, BookFeedback>,
  section: LibrarySection,
): LibraryItem[] {
  const items: LibraryItem[] = [
    ...orders.map((order): LibraryItem => ({ kind: 'purchase', order })),
    ...tickets.map((ticket): LibraryItem => ({ kind: 'sale', ticket })),
  ];
  return items.filter((item) => {
    const id = item.kind === 'sale' ? item.ticket.id : item.order.id;
    const review = feedback.get(`${item.kind}:${id}`);
    const reviewed = review?.completed === true && review.rating !== null;
    if (section === 'history') return reviewed;
    return !reviewed && item.kind === (section === 'selling' ? 'sale' : 'purchase');
  });
}
