import * as Clipboard from 'expo-clipboard';
import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { LocalTicket } from '@/types/local-ticket';
import { ListingIcon } from './listing-icon';
import { useListingColors } from './listing-theme';
import { TicketCode } from './ticket-code';
import { ui } from './ui';

const QR_SPACING = 24;

function TicketReference({ id }: { id: string }) {
  const colors = useListingColors();
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
  const pending = useRef(false);

  async function copyReference() {
    if (pending.current) return;
    pending.current = true;
    setCopyState('copying');
    try {
      const copied = await Clipboard.setStringAsync(id);
      setCopyState(copied ? 'copied' : 'error');
    } catch {
      setCopyState('error');
    } finally {
      pending.current = false;
    }
  }

  return (
    <View style={{ gap: 8, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text style={[ui.caption, { color: colors.muted }]}>Ticket reference</Text>
          <Text selectable style={[ui.caption, { color: colors.ink, fontVariant: ['tabular-nums'] }]}>{id}</Text>
        </View>
        <Pressable testID="copy-ticket-reference" accessibilityRole="button"
          accessibilityLabel={copyState === 'copied' ? 'Ticket reference copied. Copy again' : 'Copy ticket reference'}
          accessibilityState={{ disabled: copyState === 'copying', busy: copyState === 'copying' }}
          disabled={copyState === 'copying'} onPress={() => { void copyReference(); }}
          style={({ pressed }) => ({ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed || copyState === 'copying' ? 0.5 : 1 })}>
          <ListingIcon name="copy" color={colors.accentText} />
        </Pressable>
      </View>
      {copyState === 'copied' || copyState === 'error' ? <Text accessibilityLiveRegion="polite" selectable
        style={[ui.caption, { color: copyState === 'error' ? colors.danger : colors.muted }]}>
        {copyState === 'copied' ? 'Reference copied' : 'Could not copy. Try again or select the reference to copy it.'}
      </Text> : null}
    </View>
  );
}

export function ListingDropOffTicket({ ticket }: { ticket: LocalTicket }) {
  const colors = useListingColors();
  return (
    <View testID="listing-qr-section" style={{ backgroundColor: colors.surface, borderRadius: 20, borderCurve: 'continuous', padding: 20, gap: QR_SPACING }}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ListingIcon name="ticket" color={colors.muted} />
          <Text accessibilityRole="header" style={[ui.label, { color: colors.ink, flex: 1 }]}>Co-op drop-off ticket</Text>
        </View>
        <Text style={[ui.body, { fontSize: 15, lineHeight: 22, color: colors.muted }]}>
          For the proposed campus co-op drop-off, present this QR code with your book.
        </Text>
      </View>
      <TicketCode ticket={ticket} referenceGap={QR_SPACING} showInstruction={false} reference={<TicketReference key={ticket.id} id={ticket.id} />} />
    </View>
  );
}
