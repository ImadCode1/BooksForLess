import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { formatPrice } from '@/data/books';
import { useBookFeedback } from '@/services/book-feedback';
import type { LibraryItem, LibrarySection } from '@/utils/my-books';
import { formatCad } from '@/utils/tickets';
import { BookCompletion } from './book-completion';
import { BookCoverThumbnail } from './book-cover-thumbnail';
import { ListingStatus } from './listing-status';
import { useListingColors } from './listing-theme';
import { ui } from './ui';

export function LibraryBookCard({ item, section }: { item: LibraryItem; section?: LibrarySection }) {
  const colors = useListingColors();
  const { fontScale } = useWindowDimensions();
  const selling = item.kind === 'sale';
  const book = selling ? item.ticket : item.order;
  const title = selling ? item.ticket.book.title : item.order.title;
  const isbn = selling ? item.ticket.book.isbn : item.order.isbn;
  const coverUrl = selling ? item.ticket.book.coverUrl : undefined;
  const authors = selling ? item.ticket.book.authors?.join(', ') : undefined;
  const { completed } = useBookFeedback(`${item.kind}:${book.id}`);
  const listingStatus = item.kind === 'sale' ? completed ? 'Sold' : item.ticket.status : undefined;
  const status = listingStatus === 'Awaiting drop-off' ? undefined : listingStatus;
  const fullHeightCover = selling && (section === 'selling' || !completed);
  const price = item.kind === 'sale' ? formatCad(item.ticket.priceCents) : formatPrice(item.order.price);
  const cardStyle = { padding: 12, gap: 12, borderRadius: 12, borderCurve: 'continuous' as const, overflow: 'hidden' as const, backgroundColor: colors.surface };
  const openDetails = () => router.push({ pathname: '/listing/[id]', params: { id: book.id } });
  const detailsLabel = `View book details for ${title}${authors ? ` by ${authors}` : ''}, ${price}, ${book.condition}${status ? `, ${status}` : ''}`;

  const row = (
    <View style={{ flexDirection: 'row', alignItems: fullHeightCover ? 'stretch' : 'center', minHeight: fullHeightCover ? 96 : undefined, gap: 12 }}>
      <BookCoverThumbnail key={`${isbn}:${coverUrl ?? ''}`} isbn={isbn} title={title} coverUrl={coverUrl} fillHeight={fullHeightCover} />
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 8 }}>
        <View style={{ gap: 3 }}>
          <Text selectable={!selling} numberOfLines={fontScale >= 1.4 ? undefined : 2} ellipsizeMode="tail"
            style={[ui.label, { fontSize: 16, lineHeight: 21, color: colors.ink }]}>{title}</Text>
          {authors ? <Text numberOfLines={fontScale >= 1.4 ? undefined : 1} ellipsizeMode="tail"
            style={[ui.caption, { color: colors.muted }]}>{authors}</Text> : null}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10, rowGap: 4 }}>
          <Text selectable={!selling} style={[ui.label, { fontSize: 15, lineHeight: 20, color: colors.ink, fontVariant: ['tabular-nums'] }]}>{price}</Text>
          <Text selectable={!selling} style={[ui.caption, { color: colors.muted }]}>{book.condition}</Text>
        </View>
        {status ? <ListingStatus status={status} compact /> : null}
      </View>
      {selling ? <SymbolView accessible={false} name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={14} tintColor={colors.muted} style={{ alignSelf: 'center' }} /> : null}
    </View>
  );

  // Selling is a navigation list. Sale/review controls remain on Book Details.
  if (fullHeightCover) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={detailsLabel}
        accessibilityHint="Opens the book details and its drop-off QR ticket"
        onPress={openDetails} style={({ pressed }) => [cardStyle, pressed && { opacity: 0.7 }]}>
        {row}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle}>
      {selling ? <Pressable accessibilityRole="button" accessibilityLabel={detailsLabel}
        onPress={openDetails} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>{row}</Pressable> : row}
      {item.kind === 'purchase' && !completed ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`View pickup QR for ${title}`}
          onPress={() => router.push({ pathname: '/pickup/[id]', params: { id: book.id } })}
          style={({ pressed }) => ({ minHeight: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 8, backgroundColor: colors.soft, opacity: pressed ? 0.7 : 1 })}>
          <Text style={[ui.caption, { color: colors.accentText, fontWeight: '600' }]}>View pickup QR</Text>
        </Pressable>
      ) : null}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 }}>
        <BookCompletion id={book.id} kind={item.kind} title={title} compact />
      </View>
    </View>
  );
}
