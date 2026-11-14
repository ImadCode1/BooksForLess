import type { BookMetadata } from '@/types/book-metadata';

export const DEMO_ISBN = '9780262033848';

// Metadata shared with future catalog/selling integrations; no simulated prices here.
export const DEMO_BOOKS: readonly BookMetadata[] = [
  {
    isbn: DEMO_ISBN,
    title: 'Introduction to Algorithms',
    authors: ['Thomas H. Cormen', 'Charles E. Leiserson', 'Ronald L. Rivest', 'Clifford Stein'],
    source: 'demo',
  },
  {
    isbn: '9780131103627',
    title: 'The C Programming Language',
    authors: ['Brian W. Kernighan', 'Dennis M. Ritchie'],
    source: 'demo',
  },
];
