import { StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import type { LocalTicket } from '@/types/local-ticket';
import { formatCad, ticketQrValue } from '@/utils/tickets';

import { palette, ui } from './ui';

export function TicketCard({ ticket, showStatus = true }: { ticket: LocalTicket; showStatus?: boolean }) {
  useColorScheme();
  const { width } = useWindowDimensions();
  const qrSize = Math.max(120, Math.min(200, width - 136));
  return (
    <View style={[ui.card, { padding: 0, overflow: 'hidden' }]}>
      <View style={{ height: 5, backgroundColor: palette.blue }} />
      <View style={{ padding: 20, paddingTop: 8, gap: 16 }}>
      {showStatus ? <View style={styles.badge}><Text style={styles.badgeText}>Awaiting drop-off</Text></View> : null}
      <Text selectable style={ui.title}>{ticket.book.title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
        <View style={{ gap: 4 }}><Text style={ui.caption}>Test condition</Text><Text selectable style={ui.label}>{ticket.condition}</Text></View>
        <View style={{ gap: 4 }}><Text style={ui.caption}>Test price</Text><Text selectable style={[ui.label, { fontVariant: ['tabular-nums'] }]}>{formatCad(ticket.priceCents)}</Text></View>
      </View>
      </View>
      <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: palette.line }} />
      <View style={{ padding: 20, paddingTop: 4, gap: 16 }}>
      <View style={styles.qr} accessible accessibilityLabel={`QR ticket ${ticket.id}`}>
        <QRCode value={ticketQrValue(ticket)} size={qrSize} quietZone={18} color="#000000" backgroundColor="#FFFFFF" />
      </View>
      <Text selectable style={styles.id}>{ticket.id}</Text>
      <Text style={ui.body}>Saved to the shared demo collection. Keep this ticket for the proposed campus co-op drop-off. No drop-off is booked and no co-op has accepted your book.</Text>
      <Text selectable style={ui.caption}>ISBN {ticket.book.isbn}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: palette.soft, borderRadius: 8, padding: 8 },
  badgeText: { color: palette.accentText, fontSize: 13, fontWeight: '600' },
  qr: { alignSelf: 'center', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden' },
  id: { textAlign: 'center', fontSize: 14, color: palette.ink, fontWeight: '600' },
});
