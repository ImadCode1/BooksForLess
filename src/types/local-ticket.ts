import type { BookMetadata } from './book-metadata';

export type BookCondition = 'Like New' | 'Good' | 'Fair' | 'Poor';

export type LocalTicket = {
  id: string;
  book: BookMetadata;
  condition: BookCondition;
  priceCents: number;
  photoUri: string;
  createdAt: string;
  status: 'Awaiting drop-off';
};

export type TicketDraft = Pick<LocalTicket, 'book' | 'condition' | 'priceCents' | 'photoUri'>;
