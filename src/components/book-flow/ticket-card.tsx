import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View, useColorScheme } from 'react-native';

import type { LocalTicket } from '@/types/local-ticket';
import { useBookFeedback } from '@/services/book-feedback';
import { formatCad } from '@/utils/tickets';
import { TicketCode } from './ticket-code';
import { palette, ui } from './ui';

export function TicketCard({ ticket, action, showPhoto = true }: { ticket: LocalTicket; action?: ReactNode; showPhoto?: boolean }) {
  useColorScheme();
  const { completed } = useBookFeedback(`sale:${ticket.id}`);
  return (
    <View style={[ui.card, { padding: 0, overflow: 'hidden' }]}>
      <View style={{ height: 5, backgroundColor: palette.blue }} />
      {showPhoto && ticket.photoUri ? <Image
        source={{ uri: ticket.photoUri }}
        accessibilityLabel={`Your photo of ${ticket.book.title}`}
        contentFit="contain"
        style={{ height: 190, width: '100%', backgroundColor: palette.paper }}
      /> : null}
      <View style={{ padding: 20, paddingTop: 12, gap: 16 }}>
        <Text selectable style={ui.title}>{ticket.book.title}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
          <View style={{ gap: 4 }}><Text style={ui.caption}>Condition</Text><Text selectable style={ui.label}>{ticket.condition}</Text></View>
          <View style={{ gap: 4 }}><Text style={ui.caption}>Price</Text><Text selectable style={[ui.label, { fontVariant: ['tabular-nums'] }]}>{formatCad(ticket.priceCents)}</Text></View>
        </View>
        {action}
      </View>
      {!completed ? <>
        <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: palette.line }} />
        <View style={{ padding: 20, paddingTop: 4, gap: 16 }}>
          <TicketCode ticket={ticket} />
          <Text selectable style={ui.caption}>ISBN {ticket.book.isbn}</Text>
        </View>
      </> : null}
    </View>
  );
}
