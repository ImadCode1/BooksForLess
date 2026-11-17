import { Image } from 'expo-image';
import { Text, View, useWindowDimensions } from 'react-native';

import { useBookCover } from '@/services/covers';
import type { LocalTicket } from '@/types/local-ticket';
import { formatCad } from '@/utils/tickets';
import { CoverPlaceholder } from './cover-placeholder';
import { useListingColors } from './listing-theme';
import { ui } from './ui';

export function ListingBookHero({ ticket }: { ticket: LocalTicket }) {
  const colors = useListingColors();
  const cover = useBookCover(ticket.book, 'L');
  const { width, fontScale } = useWindowDimensions();
  const stacked = fontScale >= 1.4;
  const coverWidth = stacked ? 136 : width < 350 ? 104 : 120;

  return (
    <View testID="listing-book-hero" style={{ flexDirection: stacked ? 'column' : 'row', alignItems: 'flex-start', gap: 24 }}>
      <View testID="listing-cover-frame"
        style={{ width: coverWidth, height: coverWidth * 1.5, flexShrink: 0, borderRadius: 8, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: colors.surface, alignSelf: stacked ? 'center' : 'flex-start' }}>
        {!cover.loaded ? <View style={{ position: 'absolute', inset: 0 }}><CoverPlaceholder loading={cover.loading} /></View> : null}
        {cover.uri ? <Image
          testID="listing-book-cover"
          accessible
          accessibilityLabel={`Cover of ${ticket.book.title}`}
          source={{ uri: cover.uri }}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
          recyclingKey={cover.uri}
          onLoad={cover.onLoad}
          onError={cover.onError}
          style={{ width: '100%', height: '100%' }}
        /> : null}
      </View>
      <View testID="listing-book-information" style={{ flex: stacked ? undefined : 1, alignSelf: 'stretch', minWidth: 0, justifyContent: 'space-between', gap: 24 }}>
        <View testID="listing-title-author" style={{ gap: 8 }}>
          <Text selectable accessibilityRole="header" accessibilityLabel={ticket.book.title} numberOfLines={1} ellipsizeMode="clip" style={[ui.title, { fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: colors.ink, overflow: 'hidden' }]}>{ticket.book.title}</Text>
          {ticket.book.authors.length ? <Text selectable style={[ui.body, { fontSize: 15, lineHeight: 21, color: colors.muted }]}>{ticket.book.authors.join(', ')}</Text> : null}
        </View>
        <View testID="listing-price-condition" style={{ gap: 12 }}>
          <View testID="listing-condition-badge" style={{ alignSelf: 'flex-start', backgroundColor: colors.soft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderCurve: 'continuous' }}>
            <Text selectable accessibilityLabel={`Condition: ${ticket.condition}`} style={[ui.caption, { color: colors.ink, fontWeight: '500' }]}>{ticket.condition}</Text>
          </View>
          <Text selectable style={[ui.title, { color: colors.ink, fontVariant: ['tabular-nums'], fontSize: 24, lineHeight: 30 }]}>{formatCad(ticket.priceCents)}</Text>
        </View>
      </View>
    </View>
  );
}
