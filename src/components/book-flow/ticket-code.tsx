import type { ReactNode } from 'react';
import { Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import type { LocalTicket } from '@/types/local-ticket';
import { ticketQrValue } from '@/utils/tickets';
import { ui } from './ui';

export function TicketCode({ ticket, selectable = true, spacing = 0, reference, referenceGap = 12, showInstruction = true }: {
  ticket: LocalTicket; selectable?: boolean; spacing?: number; reference?: ReactNode; referenceGap?: number; showInstruction?: boolean;
}) {
  useColorScheme();
  const { width } = useWindowDimensions();
  const qrSize = Math.max(120, Math.min(180, width - 136));

  return (
    <View style={{ gap: 12 }}>
      <View testID="ticket-code-group" style={{ gap: referenceGap, paddingVertical: spacing }}>
        <View
          accessible
          accessibilityLabel={`QR ticket ${ticket.id}`}
          style={{ alignSelf: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, overflow: 'hidden' }}>
          <QRCode value={ticketQrValue(ticket)} size={qrSize} quietZone={18} color="#000000" backgroundColor="#FFFFFF" />
        </View>
        {reference ?? <Text selectable={selectable} style={[ui.caption, { textAlign: 'center' }]}>{ticket.id}</Text>}
      </View>
      {showInstruction ? <Text style={ui.caption}>Keep this ticket for the proposed campus co-op drop-off.</Text> : null}
    </View>
  );
}
