import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCompletion } from '@/components/book-flow/book-completion';
import { ListingBookHero } from '@/components/book-flow/listing-book-hero';
import { ListingDropOffTicket } from '@/components/book-flow/listing-drop-off-ticket';
import { ListingSettingsMenu } from '@/components/book-flow/listing-settings-menu';
import { ListingStatus } from '@/components/book-flow/listing-status';
import { useListingColors } from '@/components/book-flow/listing-theme';
import { useTickets } from '@/components/book-flow/ticket-provider';
import { ActionButton, Notice, palette, ui } from '@/components/book-flow/ui';
import { useBookFeedback } from '@/services/book-feedback';

function renderListingSettings() {
  return <ListingSettingsMenu />;
}

export default function ListingDetailsScreen() {
  const colors = useListingColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const validId = typeof id === 'string' && /^BFL-[A-Z0-9-]{3,70}$/.test(id);
  const { tickets, loading, error, refresh, removeTicket } = useTickets();
  const ticket = validId ? tickets.find((item) => item.id === id) : undefined;
  const { completed } = useBookFeedback(`sale:${id}`);
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const pending = useRef(false);

  function backToBooks() {
    router.dismissTo({ pathname: '/my-books', params: { tab: 'selling' } });
  }

  async function cancelListing() {
    if (!ticket || completed || pending.current) return;
    pending.current = true;
    setDeleting(true);
    setDeleteError('');
    try {
      await removeTicket(ticket.id);
      backToBooks();
    } catch {
      setDeleteError('Could not cancel this listing. Check your connection and try again.');
    } finally {
      pending.current = false;
      setDeleting(false);
    }
  }

  return (
    <View collapsable={false} style={[ui.page, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{
        headerRight: __DEV__ ? renderListingSettings : undefined,
        headerStyle: { backgroundColor: colors.background },
        headerLargeStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerTitleStyle: { color: colors.ink },
      }} />
      <ScrollView
        testID="listing-details-scroll"
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[ui.content, { flexGrow: 1, paddingTop: 24, paddingBottom: Math.max(insets.bottom, 20) + 20, paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20), gap: 28 }]}>
        {ticket ? <>
          <ListingBookHero key={`${ticket.id}:${ticket.book.coverUrl ?? ''}`} ticket={ticket} />
          <View testID="listing-metadata" style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 20, gap: 12 }}>
            <ListingStatus status={completed ? 'Sold' : ticket.status} />
            <View testID="listing-isbn" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
              <Text style={[ui.caption, { color: colors.muted }]}>ISBN</Text>
              <Text selectable style={[ui.caption, { color: colors.ink, fontVariant: ['tabular-nums'] }]}>{ticket.book.isbn}</Text>
            </View>
          </View>
          {!completed ? <ListingDropOffTicket key={ticket.id} ticket={ticket} /> : null}
          <View testID="listing-actions" style={{ gap: 16 }}>
          {confirming && !completed ? <View testID="cancel-listing-confirmation" style={{ gap: 12 }}>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[ui.label, { color: colors.ink }]}>Cancel this listing?</Text>
            <Text style={[ui.body, { color: colors.muted }]}>This permanently deletes “{ticket.book.title}” and its QR ticket from the shared demo collection for everyone. This cannot be undone.</Text>
            {deleteError ? <Notice>{deleteError}</Notice> : null}
            <Pressable
              testID="delete-listing"
              accessibilityRole="button"
              accessibilityState={{ disabled: deleting, busy: deleting }}
              disabled={deleting}
              onPress={() => { void cancelListing(); }}
              style={({ pressed }) => [ui.button, { backgroundColor: palette.danger }, pressed && { opacity: 0.7 }, deleting && { opacity: 0.5 }]}>
              <Text style={ui.buttonText}>{deleting ? 'Deleting listing…' : 'Delete listing'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={deleting} accessibilityState={{ disabled: deleting }}
              onPress={() => { setConfirming(false); setDeleteError(''); }}
              style={({ pressed }) => ({ minHeight: 48, alignItems: 'center', justifyContent: 'center', opacity: pressed || deleting ? 0.5 : 1 })}>
              <Text style={[ui.label, { color: colors.accentText }]}>Keep listing</Text>
            </Pressable>
          </View> : <>
            {!completed ? <Pressable
              testID="cancel-listing"
              accessibilityRole="button"
              onPress={() => setConfirming(true)}
              style={({ pressed }) => ({ minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surface, opacity: pressed ? 0.6 : 1 })}>
              <Text style={[ui.label, { color: colors.danger, fontWeight: '500' }]}>Cancel listing</Text>
            </Pressable> : null}
            {/* Temporary testing controls: independent of the book and ticket layout. */}
            <View testID="listing-test-actions" style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16, gap: 4 }}>
              <Text style={[ui.caption, { color: colors.muted }]}>Testing only</Text>
              <BookCompletion id={ticket.id} kind="sale" title={ticket.book.title} compact />
            </View>
          </>}
          </View>
        </> : <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          {validId && loading ? <ActivityIndicator color={colors.accentText} accessibilityLabel="Loading listing" /> : <>
            <Text accessibilityRole="header" style={[ui.title, { color: colors.ink }]}>{validId && error ? 'Could not load listing.' : 'Listing not found.'}</Text>
            <Text selectable style={[ui.body, { color: colors.muted }]}>{validId && error ? error : 'This listing may have been canceled or is no longer available.'}</Text>
            {validId && error ? <ActionButton title="Try again" secondary onPress={() => { void refresh(); }} /> : null}
          </>}
          <ActionButton title="Back to My Books" secondary onPress={backToBooks} />
        </View>}
      </ScrollView>
    </View>
  );
}
