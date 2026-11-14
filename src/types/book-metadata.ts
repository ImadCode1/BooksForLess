/** Metadata only: no condition, pricing, or listing lifecycle fields. */
export type BookMetadata = {
  isbn: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  source: 'open-library' | 'demo' | 'manual';
};
